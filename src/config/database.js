import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/stat-pview.sqlite');
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
}

/**
 * Seed default accounts if users table is empty
 */
function seedDefaultAccounts() {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (row && row.count === 0) {
    console.log('[Database] Users table is empty. Seeding default accounts...');
    const insertStmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);

    insertStmt.run('admin', adminPassword, 'admin');
    insertStmt.run('user', userPassword, 'user');

    console.log('[Database] Seeded default accounts:');
    console.log('           -> Administrator: admin / admin123');
    console.log('           -> Standard User: user / user123');
  }
}

export default db;
