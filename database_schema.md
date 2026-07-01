# Database Schema & Entity-Relationship Diagram (`database_schema.md`)

This document defines the SQLite database schema, table relations, and sample queries for **Statistic Public View**. We use a hybrid architecture combining standard relational integrity with JSON storage for user-defined attributes.

> **Note**: The database file is environment-aware. In development mode, the app uses `data/stat-pview-dummy.sqlite` with auto-seeded demo data. In production mode, it uses `data/stat-pview-prod.sqlite` with real credentials from environment variables. Both are git-ignored.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        INTEGER id PK
        TEXT username UK
        TEXT password_hash
        TEXT role
        DATETIME created_at
    }

    CATEGORIES {
        INTEGER id PK
        TEXT name
        TEXT description
        TEXT icon
        TEXT color_theme
        DATETIME created_at
    }

    CUSTOM_COLUMNS {
        INTEGER id PK
        INTEGER category_id FK
        TEXT column_name
        TEXT column_label
        TEXT data_type
        BOOLEAN is_required
        INTEGER sort_order
    }

    DATA_RECORDS {
        INTEGER id PK
        INTEGER category_id FK
        TEXT data "JSON payload"
        DATETIME created_at
        DATETIME updated_at
    }

    CHART_CONFIGS {
        INTEGER id PK
        INTEGER category_id FK, UK
        TEXT chart_type
        TEXT x_axis_column
        TEXT y_axis_column
        TEXT group_by_column
        TEXT palette
        TEXT title
    }

    CATEGORIES ||--o{ CUSTOM_COLUMNS : "defines schema"
    CATEGORIES ||--o{ DATA_RECORDS : "contains rows"
    CATEGORIES ||--o| CHART_CONFIGS : "configured by"
```

---

## 2. SQL Create Table Definitions (DDL)

These SQLite DDL statements will be automatically executed by the initialization script (`src/config/database.js`) when the server boots.

### 2.1 `users` Table
Stores authentication credentials and role permissions.
```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 `categories` Table
Stores top-level statistical datasets or information tabs.
```sql
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'chart-bar',
    color_theme TEXT DEFAULT 'indigo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 `custom_columns` Table
Defines the dynamic table schema for each statistical category.
```sql
CREATE TABLE IF NOT EXISTS custom_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    column_name TEXT NOT NULL,
    column_label TEXT NOT NULL,
    data_type TEXT CHECK(data_type IN ('text', 'number', 'date', 'boolean', 'select')) DEFAULT 'text',
    is_required BOOLEAN DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id, column_name)
);
```

### 2.4 `data_records` Table
Stores flexible data rows as JSON payloads.
```sql
CREATE TABLE IF NOT EXISTS data_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    data TEXT NOT NULL CHECK(json_valid(data)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Index on category_id for fast retrieval
CREATE INDEX IF NOT EXISTS idx_records_category ON data_records(category_id);
```

### 2.5 `chart_configs` Table
Stores visualization preferences for how a category's data should be charted.
```sql
CREATE TABLE IF NOT EXISTS chart_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER UNIQUE NOT NULL,
    chart_type TEXT CHECK(chart_type IN ('bar', 'line', 'pie', 'doughnut', 'area')) DEFAULT 'bar',
    x_axis_column TEXT,
    y_axis_column TEXT,
    group_by_column TEXT,
    palette TEXT DEFAULT 'default',
    title TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

---

## 3. Sample SQLite Queries & JSON Extraction

### 3.1 Inserting a New Dynamic Record
When an Admin submits a new data row for category ID `1`:
```sql
INSERT INTO data_records (category_id, data, created_at, updated_at)
VALUES (
    1,
    json_object('month', '2026-01', 'ridership_count', 12500, 'status', 'verified'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
```

### 3.2 Fetching Chart Visualization Data (Aggregated or Ordered)
To feed Chart.js with dynamic labels and datasets based on the chart configuration:
```sql
SELECT 
    id,
    json_extract(data, '$.month') AS label,
    json_extract(data, '$.ridership_count') AS value
FROM data_records
WHERE category_id = 1
ORDER BY json_extract(data, '$.month') ASC;
```

### 3.3 Searching Within Custom JSON Fields
If a user uses the frontend search bar to find records containing the word "verified":
```sql
SELECT id, data, created_at
FROM data_records
WHERE category_id = 1
  AND data LIKE '%verified%'
ORDER BY id DESC;
```
