# System Architecture & Technical Specifications (`architecture.md`)

This document details the system architecture, component interactions, and data flow for **Statistic Public View**. Designed for high performance, portability, and zero-migration schema flexibility, the platform leverages a Node.js + Express backend paired with a hybrid SQLite database and a responsive Tailwind CSS frontend.

---

## 1. High-Level System Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer ["Client Layer (Browser)"]
        UI_User["Public Dashboard (index.html)<br>Tailwind CSS + Chart.js + Tabulator.js"]
        UI_Admin["Admin Portal (admin.html)<br>Schema Builder & CRUD Editors"]
        UI_Login["Auth Portal (login.html)"]
    end

    subgraph Server Layer ["Server Layer (Node.js + Express)"]
        Router["Express API Router (/api/*)"]
        AuthMid["Session Auth & RBAC Middleware"]
        
        subgraph Controllers
            Ctrl_Auth["Auth Controller"]
            Ctrl_Cat["Category Controller"]
            Ctrl_Col["Schema / Column Controller"]
            Ctrl_Rec["Data Record Controller"]
            Ctrl_Chart["Chart Config Controller"]
        end
        
        subgraph Models
            Mod_SQLite["SQLite Query Engine<br>(Relational + JSON Extraction)"]
        end
    end

    subgraph Storage Layer ["Storage Layer (Local File System)"]
        DB[(stat-pview.sqlite<br>Standalone SQLite DB File)]
    end

    UI_User <-->|REST API JSON| Router
    UI_Admin <-->|REST API JSON + Auth Cookie| Router
    UI_Login <-->|POST /api/auth/login| Router

    Router --> AuthMid
    AuthMid --> Ctrl_Auth
    AuthMid --> Ctrl_Cat
    AuthMid --> Ctrl_Col
    AuthMid --> Ctrl_Rec
    AuthMid --> Ctrl_Chart

    Ctrl_Auth & Ctrl_Cat & Ctrl_Col & Ctrl_Rec & Ctrl_Chart --> Mod_SQLite
    Mod_SQLite <-->|better-sqlite3 / sqlite3| DB
```

---

## 2. Backend Architecture

### 2.1 Pattern & Modular Layers
The backend follows a strict **Model-View-Controller (MVC) / Layered Architecture**:
* **Routes (`/src/routes`)**: Define HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`), endpoint paths, and attach appropriate authentication middleware.
* **Middlewares (`/src/middlewares`)**: 
  * `authMiddleware.js`: Verifies that `req.session.user` exists.
  * `adminOnly.js`: Ensures `req.session.user.role === 'admin'` before allowing state-mutating requests.
* **Controllers (`/src/controllers`)**: Handle HTTP requests, parse payloads, validate input formats, coordinate model calls, and return structured JSON responses.
* **Models (`/src/models`)**: Encapsulate all SQLite database interactions using parameterized queries.

### 2.2 Authentication Flow
```mermaid
sequenceDiagram
    actor Admin
    participant UI as Browser (Admin Portal)
    participant API as Express Server
    participant DB as SQLite Database

    Admin->>UI: Enter username & password
    UI->>API: POST /api/auth/login {username, password}
    API->>DB: SELECT * FROM users WHERE username = ?
    DB-->>API: User Record (with password_hash)
    API->>API: bcrypt.compare(password, password_hash)
    alt Valid Credentials
        API->>API: Create HTTP-only session (req.session.user)
        API-->>UI: 200 OK {success: true, role: 'admin'}
        UI->>UI: Redirect to /admin.html
    else Invalid Credentials
        API-->>UI: 401 Unauthorized {error: "Invalid login"}
    end
```

---

## 3. Dynamic Schema Architecture (Hybrid Relational + JSON)

A major technical challenge in dynamic dashboard builders is enabling custom columns and rows without executing database schema DDL migrations (`ALTER TABLE ADD COLUMN`), which can lock tables and degrade performance.

### How Our EAV / JSON Approach Works:
1. **Schema Definition (`custom_columns` table)**:
   * When an Admin adds a column (e.g., "Monthly Revenue" of type `number`), a row is inserted into `custom_columns` with `category_id`, `column_name = 'monthly_revenue'`, and `data_type = 'number'`.
2. **Data Storage (`data_records` table)**:
   * When data rows are entered, values are stored as a single JSON object inside the `data` text column of `data_records`:
     ```json
     {
       "month": "January 2026",
       "monthly_revenue": 45000,
       "is_audited": true
     }
     ```
3. **Query & Extraction**:
   * SQLite provides high-performance JSON functions (`json_extract()`, `json_tree()`, and `json_group_array()`).
   * When rendering a chart that maps X-axis to `month` and Y-axis to `monthly_revenue`, the backend executes:
     ```sql
     SELECT 
       json_extract(data, '$.month') AS x_label,
       json_extract(data, '$.monthly_revenue') AS y_value
     FROM data_records
     WHERE category_id = ?
     ORDER BY id ASC;
     ```

---

## 4. Frontend Architecture

### 4.1 Client-Side State & DOM Rendering
The frontend is built using clean, modular ES6 JavaScript without heavy bundling requirements during prototyping:
* **`dashboard.js`**:
  1. On page load, calls `GET /api/categories` and populates the category navigation tabs/dropdown.
  2. When a category is selected, fetches `/api/charts/:category_id` and `/api/records/:category_id`.
  3. Rebuilds the **Chart.js** instance and re-initializes the **Tabulator.js** table grid.
* **`admin.js`**:
  1. Manages modal dialogs for Category CRUD and Custom Column definitions.
  2. Dynamically generates form input fields (`<input type="text|number|date">` or `<select>`) based on fetched column metadata.
  3. Sends serialized JSON bodies to the REST API endpoints.

### 4.2 Chart & Table Integration Flow
```mermaid
flowchart LR
    A[User Selects Category] -->|1. Fetch Schema & Config| B(GET /api/categories/:id/config)
    A -->|2. Fetch Row Data| C(GET /api/records/:category_id)
    B --> D[Parse Chart Config & Table Headers]
    C --> E[Extract JSON Row Data]
    D & E --> F[Initialize Chart.js Canvas]
    D & E --> G[Initialize Tabulator.js Grid]
```
