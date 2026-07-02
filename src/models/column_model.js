import db from '../config/database.js';

const VALID_DATA_TYPES = ['text', 'number', 'date', 'boolean', 'select'];

/**
 * Retrieve all custom columns for a sub-category, ordered by sort_order
 */
export function getColumnsBySubCategory(subCategoryId) {
  return db.prepare(
    'SELECT * FROM custom_columns WHERE sub_category_id = ? ORDER BY sort_order ASC, id ASC'
  ).all(subCategoryId);
}

/**
 * Retrieve a single column by its ID
 */
export function getColumnById(id) {
  return db.prepare('SELECT * FROM custom_columns WHERE id = ?').get(id);
}

/**
 * Create a new custom column for a sub-category
 */
export function createColumn({ sub_category_id, column_name, column_label, data_type, is_required, sort_order }) {
  const stmt = db.prepare(
    `INSERT INTO custom_columns (sub_category_id, column_name, column_label, data_type, is_required, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    sub_category_id,
    column_name,
    column_label,
    VALID_DATA_TYPES.includes(data_type) ? data_type : 'text',
    is_required ? 1 : 0,
    sort_order || 0
  );
  return { id: result.lastInsertRowid, sub_category_id, column_name, column_label, data_type, is_required, sort_order };
}

/**
 * Update an existing custom column by ID
 */
export function updateColumn(id, { column_name, column_label, data_type, is_required, sort_order }) {
  const stmt = db.prepare(
    `UPDATE custom_columns 
     SET column_name = ?, column_label = ?, data_type = ?, is_required = ?, sort_order = ?
     WHERE id = ?`
  );
  const result = stmt.run(
    column_name,
    column_label,
    VALID_DATA_TYPES.includes(data_type) ? data_type : 'text',
    is_required ? 1 : 0,
    sort_order || 0,
    id
  );
  return result.changes > 0;
}

/**
 * Delete a custom column by ID
 */
export function deleteColumn(id) {
  const stmt = db.prepare('DELETE FROM custom_columns WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
