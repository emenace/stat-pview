import db from './src/config/database.js';

console.log('Truncating all tables EXCEPT categories...');
db.exec(`
  DELETE FROM sub_categories;
  DELETE FROM custom_columns;
  DELETE FROM data_records;
  DELETE FROM chart_configs;
`);

console.log('Fetching existing categories...');
const categories = db.prepare('SELECT * FROM categories').all();

if (categories.length === 0) {
  console.log('No categories found. Cannot seed.');
  process.exit(0);
}

const insertSub = db.prepare('INSERT INTO sub_categories (category_id, name, sort_order) VALUES (?, ?, ?)');
const insertCol = db.prepare('INSERT INTO custom_columns (sub_category_id, column_name, column_label, data_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
const insertRec = db.prepare('INSERT INTO data_records (sub_category_id, data) VALUES (?, ?)');
const insertChart = db.prepare('INSERT INTO chart_configs (sub_category_id, chart_type, x_axis_column, y_axis_column, palette, title) VALUES (?, ?, ?, ?, ?, ?)');

db.transaction(() => {
  categories.forEach((cat) => {
    // 1. Create two sub-categories per category
    const sub1 = insertSub.run(cat.id, `Rekap ${cat.name}`, 10).lastInsertRowid;
    const sub2 = insertSub.run(cat.id, `Detail ${cat.name}`, 20).lastInsertRowid;

    // 2. Define schema for Sub 1
    insertCol.run(sub1, 'nama', 'NAMA ENTIAS', 'text', 1, 10);
    insertCol.run(sub1, 'kecamatan', 'KECAMATAN', 'select', 1, 20);
    insertCol.run(sub1, 'jumlah', 'JUMLAH / TOTAL', 'number', 1, 30);
    
    // 3. Define schema for Sub 2
    insertCol.run(sub2, 'kode', 'KODE REFERENSI', 'text', 1, 10);
    insertCol.run(sub2, 'status', 'STATUS', 'select', 1, 20);
    insertCol.run(sub2, 'nilai', 'NILAI SKOR', 'number', 1, 30);

    // 4. Seed 10 rows for Sub 1
    const kecamatans = ['Metro Pusat', 'Metro Timur', 'Metro Barat', 'Metro Utara', 'Metro Selatan'];
    for (let i = 1; i <= 10; i++) {
      insertRec.run(sub1, JSON.stringify({
        nama: `Data ${i}`,
        kecamatan: kecamatans[Math.floor(Math.random() * kecamatans.length)],
        jumlah: Math.floor(Math.random() * 500) + 50
      }));
    }
    // Add default chart for Sub 1
    insertChart.run(sub1, 'bar', 'kecamatan', 'jumlah', 'emerald', `Statistik ${cat.name}`);

    // 5. Seed 10 rows for Sub 2
    const statuses = ['Aktif', 'Non-Aktif', 'Dalam Proses'];
    for (let i = 1; i <= 10; i++) {
      insertRec.run(sub2, JSON.stringify({
        kode: `REF-00${i}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        nilai: Math.floor(Math.random() * 100) + 10
      }));
    }
    // Add default chart for Sub 2
    insertChart.run(sub2, 'pie', 'status', 'nilai', 'indigo', `Proporsi Status`);
  });
})();

console.log('Successfully seeded subcategories, columns, and 10 rows of data per category!');
