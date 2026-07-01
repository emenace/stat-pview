# Development Stage Roadmap & Checklist (`developing_stage.md`)

This document partitions the development lifecycle of **Statistic Public View** into logical, sequential stages. Each stage is broken down into granular, actionable tasks formatted as a checklist. 

As developers or AI agents complete each task, change the markdown checkbox from `[ ]` to `[x]`. Do not proceed to a new stage until the required verification steps of the current stage are validated!

---

## Stage 0: Project Initialization & Core Environment Setup
*Goal: Establish the Node.js project structure, install foundational dependencies, and configure the development environment.*

- [x] **0.1 Initialize NPM & Package Structure**:
  - [x] Run `npm init -y` to create `package.json`.
  - [x] Configure ES Module support (`"type": "module"`) or Standard CommonJS consistent with project architecture.
  - [x] Add standard npm scripts: `"start": "node src/server.js"`, `"dev": "nodemon src/server.js"`, and Tailwind CSS compilation scripts.
- [x] **0.2 Install Core Backend Dependencies**:
  - [x] Install production packages: `express`, `better-sqlite3` (or `sqlite3`), `express-session`, `bcrypt`, `cors`, `dotenv`.
  - [x] Install development packages: `nodemon`, `tailwindcss`, `postcss`, `autoprefixer`.
- [x] **0.3 Create Directory Architecture**:
  - [x] Create backend directories: `/data`, `/src/config`, `/src/controllers`, `/src/middlewares`, `/src/models`, `/src/routes`, `/src/utils`.
  - [x] Create frontend directories: `/public/css`, `/public/js`, `/public/assets`.
- [x] **0.4 Configure Tailwind CSS & Static Assets**:
  - [x] Initialize `tailwind.config.js` with custom vibrant color palettes, dark mode toggles, and content scanning paths (`./public/**/*.html`, `./public/js/**/*.js`).
  - [x] Create `/public/css/input.css` with `@tailwind base; @tailwind components; @tailwind utilities;`.
- [x] **0.5 Create Base HTTP Server (`src/server.js`)**:
  - [x] Initialize Express app with JSON body parsing (`express.json()`), URL encoding, and static file serving (`express.static('public')`).
  - [x] Set up basic health-check endpoint (`GET /api/health`).

---

## Stage 1: Database Initialization & Auth Foundation
*Goal: Set up the hybrid SQLite database engine, auto-execute DDL schemas, and build secure session authentication.*

- [x] **1.1 SQLite Database Bootstrapper (`src/config/database.js`)**:
  - [x] Establish SQLite database connection to `/data/stat-pview.sqlite`.
  - [x] Execute automated DDL statements for all tables: `users`, `categories`, `custom_columns`, `data_records`, and `chart_configs` (from `database_schema.md`).
  - [x] Add WAL mode (`PRAGMA journal_mode = WAL;`) and foreign key enforcement (`PRAGMA foreign_keys = ON;`) for performance and integrity.
- [x] **1.2 Default Account Seeder**:
  - [x] Implement startup check to verify if `users` table is empty.
  - [x] Auto-seed default Administrator account (`username: 'admin'`, password hashed with `bcrypt`, `role: 'admin'`).
  - [x] Auto-seed default Standard Viewer account (`username: 'user'`, password hashed with `bcrypt`, `role: 'user'`).
- [x] **1.3 Session & Auth Middleware**:
  - [x] Configure `express-session` with secure HTTP-only cookie parameters and secret key.
  - [x] Create `src/middlewares/authMiddleware.js` to validate active user sessions.
  - [x] Create `src/middlewares/adminOnly.js` to restrict CRUD operations to Admin roles.
- [x] **1.4 Authentication MVC Module**:
  - [x] Implement `src/models/auth_model.js`: User lookup by username.
  - [x] Implement `src/controllers/auth_controller.js`: Login validation, password comparison, session establishment, and logout.
  - [x] Implement `src/routes/auth_routes.js`: Bind `/api/auth/login`, `/api/auth/logout`, and `/api/auth/me`.

---

## Stage 2: Category & Custom Schema Builder (Backend CRUD)
*Goal: Build the backend API to manage statistical categories and dynamically define EAV custom table columns.*

- [ ] **2.1 Category Management Module**:
  - [ ] Implement `src/models/category_model.js`: SQL queries for Category CRUD.
  - [ ] Implement `src/controllers/category_controller.js`: Request validation and JSON response structuring.
  - [ ] Implement `src/routes/category_routes.js`: Bind `/api/categories` endpoints with Admin role middleware on `POST`, `PUT`, `DELETE`.
- [ ] **2.2 Custom Schema / Columns Module**:
  - [ ] Implement `src/models/column_model.js`: SQL queries to manage schema rules (`custom_columns`).
  - [ ] Implement `src/controllers/column_controller.js`: Validate `data_type` inputs (`text`, `number`, `date`, `boolean`, `select`) and manage sort ordering.
  - [ ] Implement `src/routes/column_routes.js`: Bind `/api/columns/:category_id` and CRUD routes.
- [ ] **2.3 API Verification (Stage 2 Checkpoint)**:
  - [ ] Verify creating a test category returns a valid `id`.
  - [ ] Verify adding multiple custom columns with different data types binds correctly to the category.

---

## Stage 3: Dynamic Data Records & Chart Config (Backend Engine)
*Goal: Implement the core JSON extraction engine for data records and visualization configuration models.*

- [ ] **3.1 Dynamic Data Records Module (JSON Storage)**:
  - [ ] Implement `src/models/record_model.js`:
    - [ ] Insert/Update queries utilizing SQLite `json_object()` and `json_valid()` constraints.
    - [ ] Dynamic select queries utilizing `json_extract(data, '$.field_name')` for sorting and filtering.
  - [ ] Implement `src/controllers/record_controller.js`:
    - [ ] Validate incoming JSON data against the category's `custom_columns` definition before saving.
    - [ ] Implement pagination (`page`, `limit`) and keyword search within JSON payloads.
  - [ ] Implement `src/routes/record_routes.js`: Bind `/api/records/:category_id` and CRUD routes.
- [ ] **3.2 Chart Configuration Module**:
  - [ ] Implement `src/models/chart_model.js`: Upsert and query chart settings (`chart_type`, X/Y axis column mappings, color palettes).
  - [ ] Implement `src/controllers/chart_controller.js` and `src/routes/chart_routes.js`: Bind `/api/charts/:category_id`.
- [ ] **3.3 End-to-End Backend Verification (Stage 3 Checkpoint)**:
  - [ ] Seed test data records with sample JSON data and verify sub-second retrieval.
  - [ ] Verify SQL queries correctly extract numeric values for chart aggregation.

---

## Stage 4: Frontend Core & Public Dashboard (User Role)
*Goal: Build the public interactive dashboard featuring vibrant styling, category selection, dynamic Chart.js rendering, and Tabulator.js data tables.*

- [ ] **4.1 Base UI Layout & Navigation (`/public/index.html`)**:
  - [ ] Build responsive header with Kemenag/Organization branding, dark/light mode toggle, and Login link.
  - [ ] Design glassmorphic container layout for dashboard widgets.
  - [ ] Implement category selection tab bar / dropdown with smooth hover transitions.
- [ ] **4.2 Client-Side Data Service (`/public/js/api-service.js`)**:
  - [ ] Create modular JS wrappers around `fetch()` for `/api/categories`, `/api/charts`, `/api/columns`, and `/api/records`.
  - [ ] Implement global error handling and notification toasts.
- [ ] **4.3 Dynamic Chart.js Renderer (`/public/js/chart-handler.js`)**:
  - [ ] Initialize Chart.js canvas with responsive sizing and retina display support.
  - [ ] Write dynamic chart builder that transforms JSON data records into Chart.js datasets based on selected `x_axis_column` and `y_axis_column`.
  - [ ] Implement visual support for all chart types (`bar`, `line`, `pie`, `doughnut`, `area`) with rich gradient palettes.
- [ ] **4.4 Dynamic Tabulator.js Table Grid (`/public/js/table-handler.js`)**:
  - [ ] Initialize Tabulator.js grid bound to the table container div.
  - [ ] Write dynamic header generator that translates `custom_columns` into Tabulator column definitions (including formatting numbers, dates, and text alignment).
  - [ ] Enable client-side searching, column sorting, and responsive table layout wrapping.
- [ ] **4.5 Dashboard Orchestrator (`/public/js/dashboard.js`)**:
  - [ ] Connect category tab selection event to trigger simultaneous loading of chart and table widgets.
  - [ ] Add empty-state UI placeholders when a category has no data records yet.

---

## Stage 5: Admin Management Portal (Admin Role)
*Goal: Build the authenticated Admin management suite for Category CRUD, Custom Schema Building, Row Editing, and Chart Customization.*

- [ ] **5.1 Auth & Login Portal (`/public/login.html` & `/public/js/login.js`)**:
  - [ ] Build sleek, glassmorphic login card with username/password inputs and error message display.
  - [ ] Handle login form submission, store role status, and redirect Admins to `/public/admin.html`.
- [ ] **5.2 Admin Dashboard Layout (`/public/admin.html`)**:
  - [ ] Build Admin sidebar/navbar with tabbed management sections: *Categories*, *Schema Builder*, *Data Records*, and *Chart Config*.
  - [ ] Add session verification check on page load; redirect unauthenticated users back to `login.html`.
- [ ] **5.3 Category Manager Modal & UI (`/public/js/admin-categories.js`)**:
  - [ ] Create interactive table listing all categories with Edit and Delete action buttons.
  - [ ] Build modal dialog form to create or update categories (Name, Description, Icon selector, Color Theme picker).
- [ ] **5.4 Custom Table Schema Builder UI (`/public/js/admin-schema.js`)**:
  - [ ] Build schema manager where Admins select a category and view its defined custom columns.
  - [ ] Build "Add / Edit Column" modal supporting data type selection (`text`, `number`, `date`, `boolean`, `select`), label input, required checkbox, and sort order number.
  - [ ] Implement column reordering and deletion with safety confirmation prompts.
- [ ] **5.5 Dynamic Data Row Editor (`/public/js/admin-records.js`)**:
  - [ ] Build record management table displaying JSON data rows for the selected category.
  - [ ] **Dynamic Form Generator**: Write JS logic that reads the category's `custom_columns` and dynamically builds the exact HTML form inputs (`<input type="number">`, `<input type="date">`, `<select>`, etc.) inside the "Add/Edit Record" modal!
  - [ ] Implement record insertion, modification, and deletion API bindings.
- [ ] **5.6 Live Preview Chart Customizer (`/public/js/admin-charts.js`)**:
  - [ ] Build chart configurator form with live-updating Chart.js preview canvas.
  - [ ] Build dropdowns populated with the category's `custom_columns` to allow mapping X-Axis labels and Y-Axis numeric values.
  - [ ] Allow switching chart type (`bar`, `line`, `pie`, `doughnut`, `area`) and picking color themes, saving preferences to `/api/charts/:id`.

---

## Stage 6: Polish, Performance Optimization & Final Verification
*Goal: Conduct rigorous end-to-end testing, optimize responsive styling, and prepare the codebase for production deployment.*

- [ ] **6.1 End-to-End Role & Workflow Testing**:
  - [ ] Perform complete Admin workflow: Create category -> Define 4 custom columns -> Insert 10 realistic data rows -> Configure Bar Chart -> Verify instant reflection on Public Dashboard.
  - [ ] Test role security: Ensure unauthenticated users or guest roles receive `401/403` when attempting to access `/api/records` via POST/PUT/DELETE.
- [ ] **6.2 Responsive UI/UX Audit**:
  - [ ] Audit all tables on mobile viewport widths (375px - 768px) to verify Tabulator horizontal scrolling or responsive collapsing works without breaking page containers.
  - [ ] Check micro-animations, hover states, and color contrast ratios across dark and light themes.
- [ ] **6.3 SQLite & JSON Query Performance**:
  - [ ] Check database integrity and verify SQLite indexing on `category_id` and JSON paths.
  - [ ] Test system stability under rapid switching between categories.
- [ ] **6.4 Final Documentation & Handover**:
  - [ ] Verify `README.md`, `api_spec.md`, and `database_schema.md` accurately reflect the final implemented codebase.
  - [ ] Perform final code cleanup, removing any console logs or development scratch files.
