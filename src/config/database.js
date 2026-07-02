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
    console.log('[Database] Dev mode & categories table empty. Seeding rich Kemenag Metro dataset...');

    const insertCat = db.prepare('INSERT INTO categories (name, description, icon, color_theme) VALUES (?, ?, ?, ?)');
    const insertCol = db.prepare('INSERT INTO custom_columns (category_id, column_name, column_label, data_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    const insertRec = db.prepare('INSERT INTO data_records (category_id, data) VALUES (?, ?)');
    const insertChart = db.prepare('INSERT INTO chart_configs (category_id, chart_type, x_axis_column, y_axis_column, palette, title) VALUES (?, ?, ?, ?, ?, ?)');

    db.transaction(() => {
      // 1. Category: Tempat Ibadah
      const cat1Id = insertCat.run('Tempat Ibadah Kota Metro', 'Statistik jumlah tempat ibadah berdasarkan jenis dan kecamatan di wilayah Kota Metro', 'building', 'emerald').lastInsertRowid;
      insertCol.run(cat1Id, 'jenis', 'Jenis Tempat Ibadah', 'select', 1, 10);
      insertCol.run(cat1Id, 'kecamatan', 'Kecamatan', 'select', 1, 20);
      insertCol.run(cat1Id, 'jumlah', 'Jumlah Jamaah', 'number', 1, 30);
      insertCol.run(cat1Id, 'status', 'Status Tanah', 'text', 0, 40);

      const ibadahData = [
        { jenis: 'Masjid', kecamatan: 'Metro Pusat', jumlah: 1250, status: 'Wakaf' },
        { jenis: 'Masjid', kecamatan: 'Metro Timur', jumlah: 980, status: 'Wakaf' },
        { jenis: 'Masjid', kecamatan: 'Metro Barat', jumlah: 850, status: 'Wakaf' },
        { jenis: 'Masjid', kecamatan: 'Metro Utara', jumlah: 720, status: 'Wakaf' },
        { jenis: 'Masjid', kecamatan: 'Metro Selatan', jumlah: 640, status: 'Wakaf' },
        { jenis: 'Gereja', kecamatan: 'Metro Pusat', jumlah: 450, status: 'Sertifikat Sendiri' },
        { jenis: 'Gereja', kecamatan: 'Metro Timur', jumlah: 310, status: 'Sertifikat Sendiri' },
        { jenis: 'Vihara', kecamatan: 'Metro Pusat', jumlah: 180, status: 'Sertifikat Sendiri' }
      ];
      ibadahData.forEach(d => insertRec.run(cat1Id, JSON.stringify(d)));
      insertChart.run(cat1Id, 'bar', 'kecamatan', 'jumlah', 'emerald', 'Jumlah Jamaah Tempat Ibadah per Kecamatan');

      // 2. Category: Tanah Wakaf
      const cat2Id = insertCat.run('Tanah Wakaf Kota Metro', 'Data aset tanah wakaf berdasarkan kecamatan, luas lahan, dan peruntukannya', 'map', 'emerald').lastInsertRowid;
      insertCol.run(cat2Id, 'kecamatan', 'Kecamatan', 'select', 1, 10);
      insertCol.run(cat2Id, 'luas', 'Luas Lahan (m²)', 'number', 1, 20);
      insertCol.run(cat2Id, 'peruntukan', 'Peruntukan', 'select', 1, 30);
      insertCol.run(cat2Id, 'wakif', 'Nama Wakif', 'text', 0, 40);

      const wakafData = [
        { kecamatan: 'Metro Pusat', luas: 2500, peruntukan: 'Masjid', wakif: 'H. Abdullah' },
        { kecamatan: 'Metro Timur', luas: 4200, peruntukan: 'Pendidikan', wakif: 'Hj. Siti Rahma' },
        { kecamatan: 'Metro Barat', luas: 1800, peruntukan: 'Mushola', wakif: 'H. Suherman' },
        { kecamatan: 'Metro Utara', luas: 3500, peruntukan: 'Pondok Pesantren', wakif: 'K.H. Ahmad Dahlan' },
        { kecamatan: 'Metro Selatan', luas: 1200, peruntukan: 'Makam / TPU', wakif: 'Keluarga Besar Sukirman' },
        { kecamatan: 'Metro Pusat', luas: 3000, peruntukan: 'Pendidikan', wakif: 'Yayasan Al-Ikhlas' }
      ];
      wakafData.forEach(d => insertRec.run(cat2Id, JSON.stringify(d)));
      insertChart.run(cat2Id, 'pie', 'peruntukan', 'luas', 'emerald', 'Distribusi Luas Tanah Wakaf berdasarkan Peruntukan (m²)');

      // 3. Category: Pencatatan Pernikahan (5 KUA Kecamatan, only 5 records)
      const cat3Id = insertCat.run('Pencatatan Pernikahan KUA', 'Statistik jumlah pernikahan yang tercatat pada 5 KUA Kecamatan se-Kota Metro tahun 2026', 'users', 'emerald').lastInsertRowid;
      insertCol.run(cat3Id, 'kua', 'KUA Kecamatan', 'select', 1, 10);
      insertCol.run(cat3Id, 'jumlah', 'Jumlah Pernikahan', 'number', 1, 20);
      insertCol.run(cat3Id, 'bulan', 'Periode', 'text', 1, 30);

      const nikahData = [
        { kua: 'KUA Metro Pusat', jumlah: 145, bulan: 'Semester I 2026' },
        { kua: 'KUA Metro Timur', jumlah: 132, bulan: 'Semester I 2026' },
        { kua: 'KUA Metro Barat', jumlah: 98, bulan: 'Semester I 2026' },
        { kua: 'KUA Metro Utara', jumlah: 85, bulan: 'Semester I 2026' },
        { kua: 'KUA Metro Selatan', jumlah: 76, bulan: 'Semester I 2026' }
      ];
      nikahData.forEach(d => insertRec.run(cat3Id, JSON.stringify(d)));
      insertChart.run(cat3Id, 'bar', 'kua', 'jumlah', 'emerald', 'Jumlah Pernikahan Terdaftar per KUA Kecamatan');
    })();

    console.log('[Database] Dummy Kemenag Metro dataset seeded: 3 categories, 11 custom columns, 19 records, 3 chart configs.');
  }
}

export default db;
