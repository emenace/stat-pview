# Development Roadmap: Category & Sub-Category Architectural Overhaul

This document serves as the authoritative operational roadmap and step-by-step tracking guide for the architectural overhaul of **Statistic Public View (stat-pview)**. This overhaul streamlines categories (icon + title only, removing descriptions) and introduces a two-tier relational structure: **Category → Sub-Category → Data / Columns / Charts**.

---

## 🏁 Overhaul Summary & Objectives

1. **Simplicity**: Remove all `description` fields from Category schemas, API responses, Public UI cards, and Admin CRUD forms.
2. **Two-Tier Hierarchy**: Introduce `sub_categories` table. Every statistical dataset, schema column, and chart configuration is linked directly to a `sub_category_id`.
3. **Kemenag Metro Localization**: Seed the 9 primary categories shown in the design specs (*Data Pegawai, Data KUA, Data Rumah Ibadah, Data Umat Beragama, Data Haji dan Umrah, Data Pondok Pesantren, Data Pendidikan Madrasah, Data Pendidikan Agama Islam, Data Wakaf*) with realistic sub-categories and dummy data.
4. **UI Parity with Specs**:
   - **Public**: Clean 3x3 grid. Clicking a category reveals a horizontal tab bar of its sub-categories and displays the Tabulator grid with placeholder export buttons (`Copy`, `CSV`, `Excel`, `PDF`, `Print`).
   - **Admin**: Category manager with **"Kelola Sub-Kategori"** action button and clean empty state prompt; Schema builder with cascaded selection (*Category → Sub-Category*).

---

## 🛠️ Incremental Development Stages

### Stage O-1: Database Schema Migration & Seeding
*Goal: Re-architect SQLite database schema to support sub-categories and seed new dummy data.*
- [x] **O-1.1**: Update `src/config/database.js` DDL statements:
  - [x] Remove `description` from `categories`.
  - [x] Create `sub_categories` table (`id`, `category_id`, `name`, `sort_order`, `created_at`).
  - [x] Update `custom_columns`, `data_records`, and `chart_configs` tables to reference `sub_category_id` (with `ON DELETE CASCADE`).
- [x] **O-1.2**: Update `seedDummyDevData()` in `src/config/database.js`:
  - [x] Seed the 9 Kemenag Metro categories (with icon and color theme).
  - [x] Seed realistic sub-categories for each (e.g. *Data Rumah Ibadah* → *Data Masjid*, *Data Mushollah*, *Data Gereja*, *Data Vihara*, *Data Pura*).
  - [x] Seed sample custom columns and data records for *Data Masjid* (e.g., `Nama Masjid`, `Kabupaten`, `Kecamatan`, `Tipologi`, `Alamat`).
- [x] **O-1.3**: Verify database initialization cleanly builds and seeds without errors.

---

### Stage O-2: Backend MVC & API Endpoint Refactoring
*Goal: Build Sub-Category MVC and update existing controllers/models to reference sub-categories.*
- [x] **O-2.1 Sub-Category MVC**:
  - [x] Create `src/models/subcategory_model.js` with CRUD queries.
  - [x] Create `src/controllers/subcategory_controller.js` with validation.
  - [x] Create `src/routes/subcategory_routes.js` (`GET /api/subcategories/:category_id`, `POST /api/subcategories`, `PUT /api/subcategories/:id`, `DELETE /api/subcategories/:id`) and mount in `src/server.js`.
- [x] **O-2.2 Category MVC Refactoring**:
  - [x] Update `src/models/category_model.js` and `src/controllers/category_controller.js` to remove `description` and optionally attach sub-categories list/count.
- [x] **O-2.3 Schema Column, Record & Chart Refactoring**:
  - [x] Update `src/models/column_model.js` & `src/controllers/column_controller.js` to query/filter by `sub_category_id`.
  - [x] Update `src/models/record_model.js` & `src/controllers/record_controller.js` to query/filter by `sub_category_id`.
  - [x] Update `src/models/chart_model.js` & `src/controllers/chart_controller.js` to query/filter by `sub_category_id`.
- [x] **O-2.4**: Test backend API endpoints to verify schema and data queries function correctly.

---

### Stage O-3: Public Dashboard UI Overhaul
*Goal: Build the 3x3 clean category grid and horizontal sub-category tabbed data view.*
- [x] **O-3.1 Category Grid (`/public/index.html` & `/public/js/dashboard.js`)**:
  - Render a responsive 3x3 grid of category cards with icon emblem inside a circle and centered title below.
  - Remove all description text rendering from category cards.
- [x] **O-3.2 Sub-Category Tab Bar & Data View**:
  - On category card click, hide grid and transition to Data View.
  - Render horizontal tab buttons for all sub-categories under the selected category (`[Data Masjid]`, `[Data Mushollah]`, etc.).
  - Add a "Kembali ke Kategori" button at the top to navigate back to the 3x3 grid.
- [x] **O-3.3 Data Table & Placeholder Export Buttons**:
  - Render Tabulator table for the active sub-category.
  - Render placeholder UI buttons (`Copy`, `CSV`, `Excel`, `PDF`, `Print`) above the table without underlying logic.

---

### Stage O-4: Admin Portal UI Overhaul
*Goal: Adapt Admin Category Manager and Schema Builder for the two-tier sub-category workflow.*
- [x] **O-4.1 API Service Update (`/public/js/api-service.js`)**:
  - Add wrappers: `getSubCategories(categoryId)`, `createSubCategory(data)`, `updateSubCategory(id, data)`, `deleteSubCategory(id)`.
  - Update column and record wrappers to pass `sub_category_id`.
- [x] **O-4.2 Category & Sub-Category Manager (`/public/js/admin-categories.js`)**:
  - Remove Description field from Category table grid and Create/Edit modal.
  - Add **"Kelola Sub-Kategori"** button on each category row.
  - Build modal/drawer to list, create, update, and delete sub-categories for the selected category.
  - Implement **clean empty state prompt** when creating a new category or when a category has 0 sub-categories.
- [x] **O-4.3 Cascaded Schema Builder (`/public/js/admin-schema.js`)**:
  - Update top navigation to feature two selectors: **1. Pilih Kategori** and **2. Pilih Sub-Kategori**.
  - Automatically load and display columns belonging to the selected `sub_category_id`.
  - Ensure column creation and editing bind correctly to `sub_category_id`.

---

### Stage O-5: Documentation Alignment & Verification
*Goal: Ensure authoritative documentation matches the new architecture and verify system flows.*
- [x] **O-5.1 Documentation Overhaul**:
  - Update `architecture.md`, `database_schema.md`, `api_spec.md`, `prd.md`, `agents.md`, `developing_stage.md`, and `README.md`.
- [x] **O-5.2 System Verification**:
  - Run browser automation to verify Public 3x3 grid, sub-category tabs, and placeholder export buttons.
  - Run browser automation to verify Admin category creation without description, sub-category modal management, and cascaded schema builder.
