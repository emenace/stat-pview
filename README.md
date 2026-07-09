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

### 2. Environment Configuration
The application uses a `.env` file for easy configuration across development and production environments. Copy the example file to get started:
```bash
cp .env.example .env
```
Key configuration variables in `.env`:
* `PORT`: Server port (default is `3001`)
* `NODE_ENV`: `development` or `production`
* `FRONTEND_URL`: Production domain for CORS allowance
* `SESSION_SECRET`: Secret key for signing login session cookies
* `ADMIN_USERNAME` / `ADMIN_PASSWORD`: Default administrator account credentials

### 3. Running the Application

The application supports separate environments for development (with dummy data) and production (with clean setup and secure credentials). All login sessions are permanently saved using a custom SQLite session store (`SqliteStore`), ensuring logins survive server restarts and work reliably behind reverse proxies (Nginx/Cloudflare/PM2).

#### A. Development Mode
In development, a dummy database is automatically created and seeded with realistic statistical datasets for demonstration purposes.
```bash
npm run dev
```
* **Server Port**: `http://localhost:3001`
* **Database Location**: `data/stat-pview-dummy.sqlite` (automatically created and git-ignored).
* **On-Demand Data Seeding**: If you ever need to reset and populate 10 rows of dummy data across all categories:
  ```bash
  node seed-dev.js
  ```
* **Default Seeding Credentials**:
  * **Superuser (Root)**: `Root` / `pwdSTAT@123` (Configurable via `ROOT_PASSWORD` in `.env`)
  * **Administrator**: `admin` / `admin123`
  * **Standard User / Viewer**: `user` / `user123`

#### B. Production Mode (with PM2)
In production, a clean database is initialized and real administrator credentials are set via your `.env` file. We include an official PM2 cluster configuration (`ecosystem.config.cjs`) for maximum performance, multi-core clustering, auto-restarts, and log management.
```bash
# Ensure PM2 is installed globally
npm install -g pm2

# Start in production cluster mode
pm2 start ecosystem.config.cjs --env production

# Check status and logs
pm2 list
pm2 logs stat-pview
```
* **Server Port**: `http://localhost:3001` (or proxied via Nginx/Cloudflare)
* **Database Location**: `data/stat-pview-prod.sqlite` (git-ignored).

### 4. Running Automated API Tests
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

