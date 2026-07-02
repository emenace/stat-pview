# Statistic Public View

**Statistic Public View** is a modern, responsive, and highly customizable web application built with Node.js, Express, Tailwind CSS, and local SQLite. It allows organizations to present dynamic statistical datasets, interactive charts, and searchable data tables to public viewers or team members.

---

## 🌟 Key Features

* **Two-Tier Architecture (Category → Sub-Category)**: Clean 3x3 category grid landing pages (Icon + Title only) that transition to sub-category tabs for organized data exploration.
* **Dynamic Schema Builder (No DDL Migrations)**: Built on a hybrid Relational + JSON SQLite architecture. Administrators select Category and Sub-Category via cascaded selectors to define custom table columns (Text, Number, Date, Boolean, Select) and manage data rows on the fly without database migrations.
* **Role-Based Session Authentication**: Secure login system with role separation between **Administrators** (who manage categories, sub-categories, custom schemas, data rows, and charts) and **Users / Public Viewers** (who explore data dashboards).
* **Interactive Visualizations**: Powered by **Chart.js** for responsive Bar, Line, Pie, Doughnut, and Area charts linked to sub-categories with custom X/Y column mappings.
* **Dynamic Data Grid & Excel I/O**: Powered by **Tabulator.js** for rich client-side sorting, searching, and pagination, and **SheetJS (XLSX)** for downloading dynamic Excel template schemas and bulk importing formatted spreadsheet datasets into database records.
* **Premium UI/UX**: Designed with vibrant Tailwind CSS palettes (Kemenag Green emerald accents), dark/light mode aesthetics, glassmorphic accents, and micro-animations.

---

## 📚 Architectural & Technical Documentation

This repository is self-documenting and AI-agent ready. Please refer to the following authoritative design documents:

* [**PRD (`prd.md`)**](file:///Users/emenace/Documents/Apps /stat-pview/prd.md): Executive summary, user personas, and detailed functional requirements.
* [**AI Agent Guidelines (`agents.md`)**](file:///Users/emenace/Documents/Apps /stat-pview/agents.md): Strict coding standards, SOPs, directory conventions, and UI/UX rules for developers and AI assistants.
* [**System Architecture (`architecture.md`)**](file:///Users/emenace/Documents/Apps /stat-pview/architecture.md): High-level system diagrams (Mermaid), MVC backend structure, authentication flows, and EAV/JSON data integration.
* [**Database Schema (`database_schema.md`)**](file:///Users/emenace/Documents/Apps /stat-pview/database_schema.md): Entity-Relationship Diagram (ERD), SQLite DDL table creation statements, and sample JSON extraction queries.
* [**API Specification (`api_spec.md`)**](file:///Users/emenace/Documents/Apps /stat-pview/api_spec.md): Complete REST API endpoints, request/response JSON contracts, and error handling.

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js (v18.0.0 or higher)
* npm (v9.0.0 or higher)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/emenace/stat-pview.git
npm install
```

### 2. Running the Application

The application supports separate environments for development (with dummy data) and production (with clean setup and secure credentials).

#### A. Development Mode (Default)
In development, a dummy database is automatically created and seeded with realistic statistical datasets (Public Transit Ridership and Education Funding Allocation) for demonstration purposes.
```bash
npm run dev
```
* **Database Location**: `data/stat-pview-dummy.sqlite` (automatically created and git-ignored).
* **Environment**: `NODE_ENV=development`.
* **Default Seeding Credentials**:
  * **Administrator**: `admin` / `admin123`
  * **Standard User / Viewer**: `user` / `user123`

#### B. Production Mode
In production, a clean database is initialized. Real administrator and viewer credentials are set via environment variables. Dummy datasets are NOT seeded.
```bash
npm run start:prod
# or:
npm start
```
* **Database Location**: `data/stat-pview-prod.sqlite` (git-ignored).
* **Environment**: `NODE_ENV=production`.
* **Configuration**: Set environment variables in a `.env` file (e.g. `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `USER_USERNAME`, `USER_PASSWORD`, `SESSION_SECRET`).

### 3. Running Automated API Tests
A comprehensive test script is included to test all backend MVC layers, custom column schema validations, session handlers, and chart aggregations:
```bash
npm run test:api
```

---

## 📂 Directory Layout

```text
stat-pview/
├── data/                       # SQLite database file storage (git-ignored)
├── src/
│   ├── config/
│   │   └── database.js         # SQLite bootstrapper, DDL schemas, and env-aware seeding
│   ├── controllers/            # MVC request controllers (auth, category, column, record, chart)
│   ├── middlewares/            # Auth session & admin role middlewares
│   ├── models/                 # Parameterized SQLite query models
│   ├── routes/                 # Express API route definitions
│   └── utils/
│       └── test_api.js         # Automated backend API test suite
├── public/
│   ├── css/
│   │   ├── input.css           # Tailwind CSS source
│   │   └── output.css          # Compiled Tailwind CSS
│   ├── js/
│   │   ├── api-service.js      # Modular fetch() wrappers & toast notifications
│   │   ├── chart-handler.js    # Dynamic Chart.js renderer (bar, line, pie, doughnut, area)
│   │   ├── table-handler.js    # Dynamic Tabulator.js grid builder
│   │   └── dashboard.js        # Public dashboard orchestrator
│   ├── assets/                 # Static images and media
│   └── index.html              # Public dashboard page
├── tailwind.config.js          # Tailwind CSS configuration
├── package.json                # NPM dependencies and scripts
└── README.md
```

