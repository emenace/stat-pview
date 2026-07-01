import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment-aware database selection
const isProd = process.env.NODE_ENV === 'production';
const defaultDbName = isProd ? 'stat-pview-prod.sqlite' : 'stat-pview-dummy.sqlite';
const dbName = process.env.DB_FILE || defaultDbName;
const dbPath = path.join(__dirname, '../../data', dbName);

console.log(`[Database] Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT (Dummy DB)'}`);
console.log(`[Database] Connecting to SQLite at: ${dbPath}`);

const db = new Database(dbPath);

// Enable WAL mode and Foreign Keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize all required SQLite tables and indices (Relational + JSON EAV Schema)
 */
export function initDatabase() {
  console.log('[Database] Initializing SQLite tables...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'chart-bar',
      color_theme TEXT DEFAULT 'indigo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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

    CREATE TABLE IF NOT EXISTS data_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      data TEXT NOT NULL CHECK(json_valid(data)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_records_category ON data_records(category_id);

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
  `);

  console.log('[Database] Tables and indices verified successfully.');
  seedDefaultAccounts();

  if (!isProd) {
    seedDummyDevData();
  }
}

/**
 * Seed default accounts if users table is empty
 */
function seedDefaultAccounts() {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (row && row.count === 0) {
    console.log('[Database] Users table is empty. Seeding accounts...');
    const insertStmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || (isProd ? 'admin_secure_prod_2026' : 'admin123');
    const normalUser = process.env.USER_USERNAME || 'user';
    const normalPass = process.env.USER_PASSWORD || (isProd ? 'user_secure_prod_2026' : 'user123');

    const adminHash = bcrypt.hashSync(adminPass, 10);
    const userHash = bcrypt.hashSync(normalPass, 10);

    insertStmt.run(adminUser, adminHash, 'admin');
    insertStmt.run(normalUser, userHash, 'user');

    console.log('[Database] Seeded accounts successfully:');
    console.log(`           -> Administrator: ${adminUser} / ${adminPass}`);
    console.log(`           -> Standard User: ${normalUser} / ${normalPass}`);
  }
}

/**
 * Auto-seed dummy statistical data for development and demonstration if categories is empty
 */
function seedDummyDevData() {
  const row = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (row && row.count === 0) {
    console.log('[Database] Dev mode & categories table empty. Seeding rich dummy dataset...');

    const insertCat = db.prepare('INSERT INTO categories (name, description, icon, color_theme) VALUES (?, ?, ?, ?)');
    const insertCol = db.prepare('INSERT INTO custom_columns (category_id, column_name, column_label, data_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    const insertRec = db.prepare('INSERT INTO data_records (category_id, data) VALUES (?, ?)');
    const insertChart = db.prepare('INSERT INTO chart_configs (category_id, chart_type, x_axis_column, y_axis_column, palette, title) VALUES (?, ?, ?, ?, ?, ?)');

    db.transaction(() => {
      // Category 1: Public Transit Ridership
      const cat1Id = insertCat.run('Public Transit Ridership 2026', 'Monthly passenger transit metrics across city networks', 'bus', 'indigo').lastInsertRowid;
      insertCol.run(cat1Id, 'month', 'Month / Period', 'text', 1, 10);
      insertCol.run(cat1Id, 'passengers', 'Total Passengers', 'number', 1, 20);
      insertCol.run(cat1Id, 'on_time_pct', 'On-Time (%)', 'number', 0, 30);

      const transitData = [
        { month: 'January 2026', passengers: 142000, on_time_pct: 94.5 },
        { month: 'February 2026', passengers: 158000, on_time_pct: 96.2 },
        { month: 'March 2026', passengers: 167500, on_time_pct: 93.8 },
        { month: 'April 2026', passengers: 175000, on_time_pct: 95.1 },
        { month: 'May 2026', passengers: 183200, on_time_pct: 97.0 },
        { month: 'June 2026', passengers: 191000, on_time_pct: 96.5 }
      ];
      transitData.forEach(d => insertRec.run(cat1Id, JSON.stringify(d)));
      insertChart.run(cat1Id, 'bar', 'month', 'passengers', 'indigo', 'Monthly Public Transit Ridership 2026');

      // Category 2: Education Funding Distribution
      const cat2Id = insertCat.run('City Education Funding Distribution', 'Annual budget allocation by municipal school districts', 'academic-cap', 'emerald').lastInsertRowid;
      insertCol.run(cat2Id, 'district', 'School District / Area', 'text', 1, 10);
      insertCol.run(cat2Id, 'budget_allocation', 'Budget Allocation (Million IDR)', 'number', 1, 20);
      insertCol.run(cat2Id, 'beneficiary_schools', 'Beneficiary Schools Count', 'number', 1, 30);

      const eduData = [
        { district: 'Metro Pusat', budget_allocation: 4500, beneficiary_schools: 24 },
        { district: 'Metro Barat', budget_allocation: 3200, beneficiary_schools: 18 },
        { district: 'Metro Timur', budget_allocation: 3800, beneficiary_schools: 21 },
        { district: 'Metro Utara', budget_allocation: 2900, beneficiary_schools: 15 },
        { district: 'Metro Selatan', budget_allocation: 3100, beneficiary_schools: 16 }
      ];
      eduData.forEach(d => insertRec.run(cat2Id, JSON.stringify(d)));
      insertChart.run(cat2Id, 'pie', 'district', 'budget_allocation', 'emerald', 'Education Funding Allocation by District');
    })();

    console.log('[Database] Dummy dataset seeded: 2 categories, 6 custom columns, 11 records, 2 chart configs.');
  }
}

export default db;
