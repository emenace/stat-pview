import db from '../config/database.js';

/**
 * Retrieve all categories, ordered by id ascending
 */
export function getAllCategories() {
  return db.prepare('SELECT id, name, icon, color_theme, created_at FROM categories ORDER BY id ASC').all();
}

/**
 * Retrieve a single category by its ID
 */
export function getCategoryById(id) {
  return db.prepare('SELECT id, name, icon, color_theme, created_at FROM categories WHERE id = ?').get(id);
}

/**
 * Create a new category
 */
export function createCategory({ name, icon, color_theme }) {
  const stmt = db.prepare(
    'INSERT INTO categories (name, icon, color_theme) VALUES (?, ?, ?)'
  );
  const result = stmt.run(name.trim(), icon || 'chart-bar', color_theme || 'emerald');
  return { id: result.lastInsertRowid, name: name.trim(), icon: icon || 'chart-bar', color_theme: color_theme || 'emerald' };
}

/**
 * Update an existing category by ID
 */
export function updateCategory(id, { name, icon, color_theme }) {
  const stmt = db.prepare(
    'UPDATE categories SET name = ?, icon = ?, color_theme = ? WHERE id = ?'
  );
  const result = stmt.run(name.trim(), icon || 'chart-bar', color_theme || 'emerald', id);
  return result.changes > 0;
}

/**
 * Delete a category by ID (cascades to sub_categories, custom_columns, data_records, chart_configs)
 */
export function deleteCategory(id) {
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
