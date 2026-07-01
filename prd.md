# Product Requirements Document (PRD): Statistic Public View

## 1. Executive Summary & Product Vision
**Statistic Public View** is a modern, responsive, and customizable web application designed to present dynamic statistical data, charts, and tables to the general public or organization members. 

The primary problem this application solves is the rigidity of traditional data dashboards. In typical applications, adding a new table column or changing a chart visualization requires database migrations (`ALTER TABLE`) and code redeployments. **Statistic Public View** introduces a **Dynamic Schema Builder (EAV / JSON-backed)** that empowers Administrators to create custom data categories, define custom columns and rows on the fly, and configure visualizations (Bar, Pie, Line, Doughnut, Area charts) through an intuitive user interface without any technical intervention.

---

## 2. Target Audience & User Personas

### 2.1 Public User / General Viewer (`role: user`)
* **Goal**: Quickly access, explore, and analyze statistical data presented in clear visual formats.
* **Key Needs**:
  * Clean, intuitive dashboard interface.
  * Ability to switch between different statistical categories.
  * Interactive data charts (zoom, hover tooltips, legend toggles).
  * Fast, searchable, and sortable data tables.

### 2.2 Administrator (`role: admin`)
* **Goal**: Manage statistical datasets, customize presentation schemas, and configure charts.
* **Key Needs**:
  * Secure login and session management.
  * **Category CRUD**: Create, edit, and delete statistical data categories.
  * **Table Schema Builder**: Define custom columns for each category (e.g., Number, Text, Date, Select/Dropdown) with labels and sort orders.
  * **Data Row Management**: Easily insert, update, or delete data records conforming to the custom schema.
  * **Chart Customization**: Select visual representation types (Bar, Pie, Line, Area, etc.) and map which table columns represent the X-axis (labels) and Y-axis (dataset values).

---

## 3. Core Functional Requirements

### 3.1 Authentication & Session Management
* **REQ-AUTH-01**: The system shall provide a login interface supporting username/password authentication.
* **REQ-AUTH-02**: Passwords must be hashed using `bcrypt` before storage.
* **REQ-AUTH-03**: The backend shall use secure HTTP-only sessions (`express-session` with SQLite store or memory store for lightweight local setups) to persist user identity.
* **REQ-AUTH-04**: Role-based access control (RBAC) must restrict Admin management features (`/admin/*` and CRUD API endpoints) to users with `role = 'admin'`.

### 3.2 Public Dashboard & Visualization (User Role)
* **REQ-DASH-01**: A responsive main landing dashboard built with vibrant Tailwind CSS styling, dark/light mode aesthetics, and glassmorphic design accents.
* **REQ-DASH-02**: A prominent **Category Selector** dropdown or tab interface allowing users to pick which statistical dataset to view.
* **REQ-DASH-03**: **Dynamic Chart Rendering**:
  * When a category is selected, the application dynamically fetches the associated chart configuration and row data.
  * Renders interactive visualizations using **Chart.js**.
  * Supports smooth transitions and responsive resizing across desktop, tablet, and mobile devices.
* **REQ-DASH-04**: **Interactive Custom Table**:
  * Renders below or adjacent to the chart using **Tabulator.js** (or modern HTML5 table grid).
  * Automatically builds table headers based on the category's `custom_columns` definition.
  * Provides client-side or server-side pagination, sorting by column, and keyword search/filtering.

### 3.3 Admin Management Suite (Admin Role)
* **REQ-ADMIN-01**: **Category Management (CRUD)**:
  * Create new categories with names, descriptions, and icon/color identifiers.
  * Modify existing categories or archive/delete them.
* **REQ-ADMIN-02**: **Custom Table Schema Builder**:
  * Admins can add, update, reorder, or delete custom columns for any category.
  * Each column definition includes: `column_name` (internal key), `column_label` (display text), `data_type` (`text`, `number`, `date`, `boolean`, `select`), `is_required`, and `sort_order`.
* **REQ-ADMIN-03**: **Data Row Editor (CRUD)**:
  * A dynamic form builder that generates input fields based on the category's custom columns.
  * Allows Admins to add new data rows, edit existing records, or delete rows.
  * Data values are validated against the defined `data_type` before saving.
* **REQ-ADMIN-04**: **Chart Configurator**:
  * Dedicated interface to select chart type: `bar`, `line`, `pie`, `doughnut`, `area`.
  * Dropdown selectors allowing Admins to map specific custom columns to Chart properties (e.g., X-Axis Column = `month`, Y-Axis Value Column = `revenue`, Group By / Series Column).
  * Customization of color palettes and chart titles.

---

## 4. Technical & Non-Functional Requirements

### 4.1 Technology Stack
* **Backend**: Node.js (v18+) with Express.js framework.
* **Database**: Local SQLite database (`better-sqlite3` or `sqlite3`) utilizing JSON data columns for high-performance EAV storage without schema migrations.
* **Frontend Styling**: Vanilla CSS + Tailwind CSS (via PostCSS/CLI or Tailwind CDN during prototyping, compiled for production).
* **Frontend Interactivity**: Vanilla JavaScript (ES6+ Modules), **Chart.js** for charts, and **Tabulator.js** for tables.

### 4.2 UI/UX Aesthetics & Design System
* **Wow Factor**: The interface must avoid generic bootstrap or plain layouts. It must use modern typography (e.g., Inter or Outfit fonts), smooth gradients, micro-animations on hover/click, and cohesive color palettes.
* **Responsiveness**: Fully fluid layouts ensuring data tables and charts remain scannable and functional on mobile phones and wide desktop monitors alike.

### 4.3 Performance & Scalability
* **Query Optimization**: SQLite JSON extraction functions (`json_extract()`) must be indexed where appropriate to ensure sub-100ms API response times even with thousands of dynamic rows.
* **Lightweight Footprint**: Zero external database server dependencies (standalone SQLite file), making local LAN deployment or server hosting effortless.

---

## 5. Future Roadmap & Enhancements
* **Phase 2 - Data Import/Export**: Allow Admins to upload Excel/CSV files to auto-populate custom table rows, and allow Users to export filtered tables to PDF or CSV.
* **Phase 3 - Multi-Chart Dashboards**: Enable placing multiple charts from different categories onto a single unified executive summary page.
* **Phase 4 - Public API & Embeds**: Provide read-only iframe embed codes or JSON API endpoints so external websites can display Statistic Public View charts.
