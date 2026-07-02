import db from '../config/database.js';

/**
 * Retrieve all data records for a sub-category with pagination and optional search
 * @param {number} subCategoryId
 * @param {object} options - { page, limit, search }
 */
export function getRecordsBySubCategory(subCategoryId, { page = 1, limit = 50, search = '' } = {}) {
  const offset = (page - 1) * limit;

  // Count total records (with optional search filter)
  let countSql = 'SELECT COUNT(*) as total FROM data_records WHERE sub_category_id = ?';
  const countParams = [subCategoryId];

  if (search) {
    countSql += ' AND data LIKE ?';
    countParams.push(`%${search}%`);
  }

  const totalRow = db.prepare(countSql).get(...countParams);
  const total = totalRow ? totalRow.total : 0;

  // Fetch paginated records
  let dataSql = 'SELECT id, sub_category_id, data, created_at, updated_at FROM data_records WHERE sub_category_id = ?';
  const dataParams = [subCategoryId];

  if (search) {
    dataSql += ' AND data LIKE ?';
    dataParams.push(`%${search}%`);
  }

  dataSql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  dataParams.push(limit, offset);

  const rows = db.prepare(dataSql).all(...dataParams);

  // Parse JSON data column for each row
  const records = rows.map(row => ({
    id: row.id,
    sub_category_id: row.sub_category_id,
    data: JSON.parse(row.data),
    created_at: row.created_at,
    updated_at: row.updated_at
  }));

  return {
    records,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

/**
 * Retrieve a single data record by its ID
 */
export function getRecordById(id) {
  const row = db.prepare('SELECT * FROM data_records WHERE id = ?').get(id);
  if (row) {
    row.data = JSON.parse(row.data);
  }
  return row;
}

/**
 * Create a new data record with JSON payload
 */
export function createRecord(subCategoryId, data) {
  const jsonStr = JSON.stringify(data);
  const stmt = db.prepare(
    'INSERT INTO data_records (sub_category_id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
  );
  const result = stmt.run(subCategoryId, jsonStr);
  return { id: result.lastInsertRowid, sub_category_id: subCategoryId, data };
}

/**
 * Update an existing data record's JSON payload
 */
export function updateRecord(id, data) {
  const jsonStr = JSON.stringify(data);
  const stmt = db.prepare(
    'UPDATE data_records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  const result = stmt.run(jsonStr, id);
  return result.changes > 0;
}

/**
 * Delete a data record by ID
 */
export function deleteRecord(id) {
  const stmt = db.prepare('DELETE FROM data_records WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Extract specific column values from all records in a sub-category using json_extract
 * Used for chart data aggregation
 * @param {number} subCategoryId
 * @param {string} xColumn - JSON key for X axis labels
 * @param {string} yColumn - JSON key for Y axis values
 */
export function extractChartData(subCategoryId, xColumn, yColumn) {
  // Note: SQLite json_extract with dynamic keys
  // We use direct string interpolation for the JSON path since these are admin-defined column names
  const safeSql = `
    SELECT
      id,
      json_extract(data, '$.${xColumn}') AS x_label,
      json_extract(data, '$.${yColumn}') AS y_value
    FROM data_records
    WHERE sub_category_id = ?
    ORDER BY id ASC
  `;
  return db.prepare(safeSql).all(subCategoryId);
}
