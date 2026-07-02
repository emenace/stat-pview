import db from '../config/database.js';

/**
 * Get all sub-categories belonging to a parent category, sorted by sort_order
 */
export function getSubCategoriesByCategory(categoryId) {
  const stmt = db.prepare(`
    SELECT id, category_id, name, sort_order, created_at 
    FROM sub_categories 
    WHERE category_id = ? 
    ORDER BY sort_order ASC, id ASC
  `);
  return stmt.all(categoryId);
}

/**
 * Get a single sub-category by ID
 */
export function getSubCategoryById(id) {
  const stmt = db.prepare(`
    SELECT id, category_id, name, sort_order, created_at 
    FROM sub_categories 
    WHERE id = ?
  `);
  return stmt.get(id);
}

/**
 * Create a new sub-category
 */
export function createSubCategory({ category_id, name, sort_order }) {
  const stmt = db.prepare(`
    INSERT INTO sub_categories (category_id, name, sort_order)
    VALUES (?, ?, ?)
  `);
  const info = stmt.run(category_id, name.trim(), sort_order || 0);
  return getSubCategoryById(info.lastInsertRowid);
}

/**
 * Update an existing sub-category
 */
export function updateSubCategory(id, { name, sort_order }) {
  const stmt = db.prepare(`
    UPDATE sub_categories
    SET name = ?, sort_order = ?
    WHERE id = ?
  `);
  const info = stmt.run(name.trim(), sort_order || 0, id);
  return info.changes > 0 ? getSubCategoryById(id) : null;
}

/**
 * Delete a sub-category by ID (cascades to columns, records, and charts)
 */
export function deleteSubCategory(id) {
  const stmt = db.prepare('DELETE FROM sub_categories WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}
