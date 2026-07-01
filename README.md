# Statistic Public View

**Statistic Public View** is a modern, responsive, and highly customizable web application built with Node.js, Express, Tailwind CSS, and local SQLite. It allows organizations to present dynamic statistical datasets, interactive charts, and searchable data tables to public viewers or team members.

---

## 🌟 Key Features

* **Dynamic Schema Builder (No DDL Migrations)**: Built on a hybrid Relational + JSON SQLite architecture. Administrators can define custom table columns (Text, Number, Date, Boolean, Select) and manage data rows on the fly without database migrations.
* **Role-Based Session Authentication**: Secure login system with role separation between **Administrators** (who manage categories, custom schemas, data rows, and charts) and **Users / Public Viewers** (who explore data dashboards).
* **Interactive Visualizations**: Powered by **Chart.js** for responsive Bar, Line, Pie, Doughnut, and Area charts with custom X/Y column mappings.
* **Dynamic Data Grid**: Powered by **Tabulator.js** for rich client-side sorting, searching, and pagination of custom data records.
* **Premium UI/UX**: Designed with vibrant Tailwind CSS palettes, dark/light mode aesthetics, glassmorphic accents, and micro-animations.

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

### 2. Development Server
Start the local server in development mode (with auto-reloading if nodemon is configured):
```bash
npm run dev
```
By default, the application will be accessible at:
👉 **http://localhost:3000**

### 3. Default Login Credentials
Upon initial database seeding, the system creates default accounts:
* **Administrator**:
  * **Username**: `admin`
  * **Password**: `admin123` *(Please change upon first deployment!)*
* **Standard User / Viewer**:
  * **Username**: `user`
  * **Password**: `user123`

---

## 📂 Directory Layout

```text
stat-pview/
├── data/               # Standalone SQLite database file storage
├── src/
│   ├── config/         # Database and session initialization
│   ├── controllers/    # MVC request controllers
│   ├── middlewares/    # Authentication and role checking middlewares
│   ├── models/         # Parameterized SQLite query models
│   ├── routes/         # Express API route definitions
│   └── utils/          # Helper utilities
├── public/             # Static HTML, CSS (Tailwind), and JS assets
└── README.md
```
