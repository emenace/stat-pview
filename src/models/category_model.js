import db from '../config/database.js';

/**
 * Retrieve all categories, ordered by creation date (newest first)
 */
export function getAllCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY created_at DESC').all();
}

/**
 * Retrieve a single category by its ID
 */
export function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

/**
 * Create a new category
 */
export function createCategory({ name, description, icon, color_theme }) {
  const stmt = db.prepare(
    'INSERT INTO categories (name, description, icon, color_theme) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(name, description || null, icon || 'chart-bar', color_theme || 'indigo');
  return { id: result.lastInsertRowid, name, description, icon, color_theme };
}

/**
 * Update an existing category by ID
 */
export function updateCategory(id, { name, description, icon, color_theme }) {
  const stmt = db.prepare(
    'UPDATE categories SET name = ?, description = ?, icon = ?, color_theme = ? WHERE id = ?'
  );
  const result = stmt.run(name, description || null, icon || 'chart-bar', color_theme || 'indigo', id);
  return result.changes > 0;
}

/**
 * Delete a category by ID (cascades to custom_columns, data_records, chart_configs)
 */
export function deleteCategory(id) {
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
