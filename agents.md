# AI Agent & Developer Guidelines (`agents.md`)

Welcome to the **Statistic Public View** codebase! This document serves as the authoritative operational manual and coding standard for developers and AI agents (such as Antigravity, GitHub Copilot, or Cursor) working on this repository. 

Whenever you are tasked with modifying, debugging, or extending this application, you **MUST** adhere to the guidelines, architecture patterns, and styling standards outlined below.

---

## 1. Core Architectural Principles & Philosophy

1. **Simplicity Over Complexity**: Keep dependencies to an absolute minimum. We use Vanilla JavaScript on the frontend, Node.js + Express on the backend, and local SQLite for data persistence. Do not introduce heavy frontend frameworks (React, Vue, Angular) or complex ORMs (Prisma, TypeORM) unless explicitly instructed by the user.
2. **Dynamic JSON-Backed Schema (No DDL Migrations)**: 
   * A core feature of this platform is allowing Admins to define custom table columns and rows without running `ALTER TABLE` SQL statements.
   * **Rule**: We use a two-tier Category → Sub-Category architecture. Custom column definitions are stored in `custom_columns` linked to `sub_category_id`. Row data is stored as JSON in `data_records.data` linked to `sub_category_id`. Never alter the SQLite database table structure to add user-defined fields.
3. **Strict Role Separation**: Always verify session authentication and user roles (`admin` vs. `user`) on both backend API routes and frontend UI rendering.

---

## 2. Technology Stack & Standard Libraries

* **Runtime**: Node.js (v18+)
* **Web Framework**: Express.js (REST API + Static File Server)
* **Database Driver**: `better-sqlite3` (or `sqlite3` wrapped in Promises for synchronous/async SQLite operations)
* **Authentication**: `express-session`, `bcrypt` for password hashing
* **CSS & Styling**: Tailwind CSS (use standard utility classes; maintain responsive design)
* **Charts & Visualization**: **Chart.js** (loaded via CDN in `/public` or bundled cleanly)
* **Data Grid / Tables**: **Tabulator.js** (for rich client-side sorting, searching, and pagination of custom JSON records)
* **Excel I/O**: **SheetJS (`xlsx.full.min.js`)** (loaded via CDN for client-side Excel template export and bulk import parsing)

---

## 3. Directory Structure & Naming Conventions

Maintain strict separation of concerns following this directory layout:

```text
stat-pview/
├── data/                  # SQLite database directory (e.g., database.sqlite)
├── src/
│   ├── config/            # Database initialization, session config, environment variables
│   ├── controllers/       # Route handlers containing business & logic flow
│   ├── middlewares/       # Auth validation, role checks, error handlers
│   ├── models/            # SQLite queries and EAV/JSON data manipulation layers
│   ├── routes/            # Express API route definitions (/api/auth, /api/categories, etc.)
│   └── utils/             # Helper functions (date formatting, JSON validators)
├── public/                # Static frontend assets served by Express
│   ├── css/               # Compiled Tailwind CSS and custom stylesheets
│   ├── js/                # Vanilla JS frontend modules (dashboard.js, admin.js, chart-handler.js)
│   ├── index.html         # Main public dashboard view
│   ├── login.html         # User/Admin authentication page
│   └── admin.html         # Admin CRUD & schema builder management portal
├── agents.md              # This AI Agent operational guidelines file
├── prd.md                 # Product Requirements Document
├── architecture.md        # System Architecture & Data Flow
├── database_schema.md     # ERD & Table Specifications
├── api_spec.md            # REST API Contracts
├── package.json           # Project dependencies and npm scripts
└── README.md              # Quick start and overview
```

### Naming Conventions:
* **Files**: `kebab-case.js` or `snake_case.js` (e.g., `chart-handler.js`, `auth_controller.js`). Be consistent within each directory.
* **Database Tables**: `snake_case` plural (e.g., `users`, `categories`, `sub_categories`, `custom_columns`, `data_records`, `chart_configs`).
* **API Endpoints**: RESTful plural nouns in lowercase (e.g., `GET /api/categories`, `GET /api/subcategories`, `POST /api/records`).

---

## 4. UI/UX & Styling Standards (MANDATORY)

When creating or modifying frontend interfaces in `/public`, you must follow these design directives:
1. **Rich & Premium Aesthetics**: Do NOT build basic or generic layouts. Use vibrant color palettes (e.g., slate/indigo/emerald gradients), sleek dark mode toggles, and modern glassmorphism (e.g., `backdrop-blur-md bg-white/70 dark:bg-slate-900/70`).
2. **Modern Typography**: Use clean sans-serif fonts (Inter, Outfit, or Roboto) with proper visual hierarchy (bold headings, readable body text, subtle secondary labels).
3. **Dynamic Micro-Animations**: Implement subtle hover transitions (`transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`) on interactive cards, buttons, and table rows to make the interface feel alive.
4. **Responsive Layouts**: Ensure all tables and charts wrap gracefully or scroll horizontally on mobile screens without breaking page containers.
5. **No Generic Placeholders**: If demonstrating features or seeding data, generate realistic statistical datasets (e.g., "Monthly Public Transit Ridership", "City Education Funding Distribution") rather than `"Test 1"`, `"Foo"`, `"Bar"`.

---

## 5. Standard Operating Procedures (SOPs) for AI Agents

### SOP-01: Adding a New API Endpoint
1. Define the route in `src/routes/<module>_routes.js`.
2. Implement the controller logic in `src/controllers/<module>_controller.js`. Ensure inputs are sanitized and validated.
3. If database access is needed, add parameterized queries in `src/models/<module>_model.js`. Never concatenate raw strings into SQL queries to prevent SQL injection!
4. Document the new endpoint in `api_spec.md` with request/response JSON schemas.

### SOP-02: Working with Custom JSON Data Records & Excel I/O
When querying, updating, or importing `data_records`:
* Always parse and validate incoming JSON payloads or Excel spreadsheets against the sub-category's `custom_columns` definitions before inserting or updating.
* When handling bulk imports via SheetJS (`XLSX`), match spreadsheet header row names against either `column_label` or `column_name` of the custom columns schema.
* In SQLite, use built-in JSON functions when querying specific fields:
  ```sql
  SELECT id, sub_category_id, json_extract(data, '$.jamaah') AS jamaah 
  FROM data_records 
  WHERE sub_category_id = ?;
  ```

### SOP-03: Debugging Database or UI Issues
* **Database**: Check local SQLite integrity and verify that `data` column strings are valid JSON format (`JSON.parse()` / `JSON.stringify()`).
* **Frontend**: Inspect browser network logs for API failure status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `500 Internal Error`).

---

## 6. Verification & Quality Checklist
Before completing any task or response:
* [ ] Are all code changes well-commented where complex logic exists?
* [ ] Did you preserve existing unrelated documentation and docstrings?
* [ ] Is the UI styling visually premium, responsive, and aligned with Tailwind CSS best practices?
* [ ] Have you tested or verified that database queries execute without syntax errors?
