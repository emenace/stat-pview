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

  if (!isProd) {
    // Drop old schema tables if migrating from category_id to sub_category_id in dev mode
    const colCheck = db.prepare("PRAGMA table_info(custom_columns)").all();
    const hasSubCat = colCheck.some(c => c.name === 'sub_category_id');
    if (colCheck.length > 0 && !hasSubCat) {
      console.log('[Database] Old schema detected in Dev mode. Dropping tables for clean migration...');
      db.exec(`
        DROP TABLE IF EXISTS chart_configs;
        DROP TABLE IF EXISTS data_records;
        DROP TABLE IF EXISTS custom_columns;
        DROP TABLE IF EXISTS sub_categories;
        DROP TABLE IF EXISTS categories;
      `);
    }
  }

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
      icon TEXT DEFAULT 'chart-bar',
      color_theme TEXT DEFAULT 'emerald',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sub_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sub_category_id INTEGER NOT NULL,
      column_name TEXT NOT NULL,
      column_label TEXT NOT NULL,
      data_type TEXT CHECK(data_type IN ('text', 'number', 'date', 'boolean', 'select')) DEFAULT 'text',
      is_required BOOLEAN DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE CASCADE,
      UNIQUE(sub_category_id, column_name)
    );

    CREATE TABLE IF NOT EXISTS data_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sub_category_id INTEGER NOT NULL,
      data TEXT NOT NULL CHECK(json_valid(data)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_records_subcategory ON data_records(sub_category_id);
    CREATE INDEX IF NOT EXISTS idx_subcategories_category ON sub_categories(category_id);
    CREATE INDEX IF NOT EXISTS idx_customcols_subcategory ON custom_columns(sub_category_id);

    CREATE TABLE IF NOT EXISTS chart_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sub_category_id INTEGER UNIQUE NOT NULL,
      chart_type TEXT CHECK(chart_type IN ('bar', 'line', 'pie', 'doughnut', 'area', 'none')) DEFAULT 'bar',
      x_axis_column TEXT,
      y_axis_column TEXT,
      group_by_column TEXT,
      palette TEXT DEFAULT 'emerald',
      title TEXT,
      FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE CASCADE
    );
  `);

  // ── Migration: Rebuild chart_configs to add 'none' to chart_type CHECK constraint ──
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='chart_configs'").get();
    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes("'none'")) {
      console.log('[Database] Migrating chart_configs to allow chart_type = none...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS chart_configs_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sub_category_id INTEGER UNIQUE NOT NULL,
          chart_type TEXT CHECK(chart_type IN ('bar', 'line', 'pie', 'doughnut', 'area', 'none')) DEFAULT 'bar',
          x_axis_column TEXT,
          y_axis_column TEXT,
          group_by_column TEXT,
          palette TEXT DEFAULT 'emerald',
          title TEXT,
          FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id) ON DELETE CASCADE
        );
        INSERT INTO chart_configs_new SELECT * FROM chart_configs;
        DROP TABLE chart_configs;
        ALTER TABLE chart_configs_new RENAME TO chart_configs;
      `);
      console.log('[Database] chart_configs migration complete.');
    }
  } catch (migErr) {
    console.warn('[Database] chart_configs migration skipped or failed:', migErr.message);
  }

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
    console.log('[Database] Dev mode & categories table empty. Seeding 9 Kemenag Metro categories and sub-categories...');

    const insertCat = db.prepare('INSERT INTO categories (name, icon, color_theme) VALUES (?, ?, ?)');
    const insertSub = db.prepare('INSERT INTO sub_categories (category_id, name, sort_order) VALUES (?, ?, ?)');
    const insertCol = db.prepare('INSERT INTO custom_columns (sub_category_id, column_name, column_label, data_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    const insertRec = db.prepare('INSERT INTO data_records (sub_category_id, data) VALUES (?, ?)');
    const insertChart = db.prepare('INSERT INTO chart_configs (sub_category_id, chart_type, x_axis_column, y_axis_column, palette, title) VALUES (?, ?, ?, ?, ?, ?)');

    db.transaction(() => {
      // 1. Data Pegawai
      const cat1 = insertCat.run('Data Pegawai', 'users', 'emerald').lastInsertRowid;
      insertSub.run(cat1, 'Data Pegawai PNS', 10);
      insertSub.run(cat1, 'Data Pegawai Non PNS', 20);

      // 2. Data KUA
      const cat2 = insertCat.run('Data KUA', 'building-office', 'emerald').lastInsertRowid;
      insertSub.run(cat2, 'Data Kondisi dan Status', 10);
      insertSub.run(cat2, 'Tipologi KUA', 20);

      // 3. Data Rumah Ibadah
      const cat3 = insertCat.run('Data Rumah Ibadah', 'home', 'emerald').lastInsertRowid;
      const subMasjid = insertSub.run(cat3, 'Data Masjid', 10).lastInsertRowid;
      const subMushollah = insertSub.run(cat3, 'Data Mushollah', 20).lastInsertRowid;
      const subGereja = insertSub.run(cat3, 'Data Gereja', 30).lastInsertRowid;
      insertSub.run(cat3, 'Data Vihara', 40);
      insertSub.run(cat3, 'Data Pura', 50);

      // Columns for Data Masjid (matching Screenshot 2)
      insertCol.run(subMasjid, 'nama_masjid', 'NAMA MASJID', 'text', 1, 10);
      insertCol.run(subMasjid, 'kabupaten', 'KABUPATEN', 'text', 1, 20);
      insertCol.run(subMasjid, 'kecamatan', 'KECAMATAN', 'select', 1, 30);
      insertCol.run(subMasjid, 'tipologi', 'TIPOLOGI', 'select', 1, 40);
      insertCol.run(subMasjid, 'alamat', 'ALAMAT', 'text', 0, 50);

      const masjidRecords = [
        { nama_masjid: 'Al-Mujahidin', kabupaten: 'Kota Metro', kecamatan: 'Metro Pusat', tipologi: 'Masjid Besar', alamat: 'Jl. AH Nasution No. 1' },
        { nama_masjid: 'Nurul Quba', kabupaten: 'Kota Metro', kecamatan: 'Metro Timur', tipologi: 'Masjid di Tempat Publik', alamat: 'Jl. Ki Hajar Dewantara' },
        { nama_masjid: 'Nurul Yaqin', kabupaten: 'Kota Metro', kecamatan: 'Metro Barat', tipologi: 'Masjid di Tempat Publik', alamat: 'Jl. Sudirman' },
        { nama_masjid: 'As Syuhada', kabupaten: 'Kota Metro', kecamatan: 'Metro Utara', tipologi: 'Masjid di Tempat Publik', alamat: 'Jl. Imam Bonjol' },
        { nama_masjid: 'Nurul Huda', kabupaten: 'Kota Metro', kecamatan: 'Metro Selatan', tipologi: 'Masjid di Tempat Publik', alamat: 'Jl. Soekarno Hatta' },
        { nama_masjid: 'Takwa', kabupaten: 'Kota Metro', kecamatan: 'Metro Pusat', tipologi: 'Masjid di Tempat Publik', alamat: 'Jl. Diponegoro' },
        { nama_masjid: 'Nurul Iman', kabupaten: 'Kota Metro', kecamatan: 'Metro Timur', tipologi: 'Masjid di Tempat Publik', alamat: 'Jl. Batanghari' },
        { nama_masjid: 'Babul Khaer', kabupaten: 'Kota Metro', kecamatan: 'Metro Barat', tipologi: 'Masjid di Tempat Publik', alamat: 'Jl. Jend. Ryacudu' }
      ];
      masjidRecords.forEach(d => insertRec.run(subMasjid, JSON.stringify(d)));
      insertChart.run(subMasjid, 'bar', 'kecamatan', 'nama_masjid', 'emerald', 'Distribusi Masjid per Kecamatan');

      // Columns for Data Mushollah
      insertCol.run(subMushollah, 'nama_mushollah', 'NAMA MUSHOLLAH', 'text', 1, 10);
      insertCol.run(subMushollah, 'kecamatan', 'KECAMATAN', 'select', 1, 20);
      insertCol.run(subMushollah, 'alamat', 'ALAMAT', 'text', 0, 30);
      insertRec.run(subMushollah, JSON.stringify({ nama_mushollah: 'Mushollah Al-Ikhlas', kecamatan: 'Metro Pusat', alamat: 'Jl. Kurma' }));
      insertRec.run(subMushollah, JSON.stringify({ nama_mushollah: 'Mushollah An-Nur', kecamatan: 'Metro Timur', alamat: 'Jl. Semangka' }));

      // Columns for Data Gereja
      insertCol.run(subGereja, 'nama_gereja', 'NAMA GEREJA', 'text', 1, 10);
      insertCol.run(subGereja, 'kecamatan', 'KECAMATAN', 'select', 1, 20);
      insertCol.run(subGereja, 'alamat', 'ALAMAT', 'text', 0, 30);
      insertRec.run(subGereja, JSON.stringify({ nama_gereja: 'Gereja HKBP Metro', kecamatan: 'Metro Pusat', alamat: 'Jl. Diponegoro No. 15' }));
      insertRec.run(subGereja, JSON.stringify({ nama_gereja: 'Gereja Katolik Hati Kudus', kecamatan: 'Metro Pusat', alamat: 'Jl. Jend. Sudirman' }));

      // 4. Data Umat Beragama
      const cat4 = insertCat.run('Data Umat Beragama', 'user-group', 'emerald').lastInsertRowid;
      insertSub.run(cat4, 'Umat Islam', 10);
      insertSub.run(cat4, 'Umat Kristen', 20);
      insertSub.run(cat4, 'Umat Katolik', 30);
      insertSub.run(cat4, 'Umat Hindu', 40);
      insertSub.run(cat4, 'Umat Buddha', 50);

      // 5. Data Haji dan Umrah
      const cat5 = insertCat.run('Data Haji dan Umrah', 'globe-alt', 'emerald').lastInsertRowid;
      insertSub.run(cat5, 'Data KBIH', 10);
      insertSub.run(cat5, 'PPIU', 20);
      insertSub.run(cat5, 'Waiting List Haji', 30);

      // 6. Data Pondok Pesantren
      const cat6 = insertCat.run('Data Pondok Pesantren', 'academic-cap', 'emerald').lastInsertRowid;
      insertSub.run(cat6, 'Data Santri', 10);
      insertSub.run(cat6, 'Data Ustadz dan Guru', 20);

      // 7. Data Pendidikan Madrasah
      const cat7 = insertCat.run('Data Pendidikan Madrasah', 'book-open', 'emerald').lastInsertRowid;
      insertSub.run(cat7, 'Madrasah Ibtidaiyah (MI)', 10);
      insertSub.run(cat7, 'Madrasah Tsanawiyah (MTs)', 20);
      insertSub.run(cat7, 'Madrasah Aliyah (MA)', 30);

      // 8. Data Pendidikan Agama Islam
      const cat8 = insertCat.run('Data Pendidikan Agama Islam', 'identification', 'emerald').lastInsertRowid;
      insertSub.run(cat8, 'Guru PAI SD', 10);
      insertSub.run(cat8, 'Guru PAI SMP', 20);
      insertSub.run(cat8, 'Guru PAI SMA/SMK', 30);

      // 9. Data Wakaf
      const cat9 = insertCat.run('Data Wakaf', 'heart', 'emerald').lastInsertRowid;
      insertSub.run(cat9, 'Tanah Wakaf Masjid', 10);
      insertSub.run(cat9, 'Tanah Wakaf Sosial', 20);
    })();

    console.log('[Database] Successfully seeded 9 Kemenag Metro categories and sub-categories with sample data!');
  }
}

export default db;
