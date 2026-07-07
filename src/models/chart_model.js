import db from '../config/database.js';

const VALID_CHART_TYPES = ['bar', 'line', 'pie', 'doughnut', 'area', 'none'];

/**
 * Get chart configuration for a sub-category
 */
export function getChartConfigBySubCategory(subCategoryId) {
  return db.prepare('SELECT * FROM chart_configs WHERE sub_category_id = ?').get(subCategoryId);
}

/**
 * Upsert chart configuration (insert or update on conflict)
 */
export function upsertChartConfig(subCategoryId, { chart_type, x_axis_column, y_axis_column, group_by_column, palette, title }) {
  const existing = getChartConfigBySubCategory(subCategoryId);

  if (existing) {
    // Update
    const stmt = db.prepare(`
      UPDATE chart_configs
      SET chart_type = ?, x_axis_column = ?, y_axis_column = ?, group_by_column = ?, palette = ?, title = ?
      WHERE sub_category_id = ?
    `);
    stmt.run(
      VALID_CHART_TYPES.includes(chart_type) ? chart_type : existing.chart_type,
      x_axis_column || existing.x_axis_column,
      y_axis_column || existing.y_axis_column,
      group_by_column !== undefined ? group_by_column : existing.group_by_column,
      palette || existing.palette,
      title !== undefined ? title : existing.title,
      subCategoryId
    );
    return getChartConfigBySubCategory(subCategoryId);
  } else {
    // Insert
    const stmt = db.prepare(`
      INSERT INTO chart_configs (sub_category_id, chart_type, x_axis_column, y_axis_column, group_by_column, palette, title)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      subCategoryId,
      VALID_CHART_TYPES.includes(chart_type) ? chart_type : 'bar',
      x_axis_column || null,
      y_axis_column || null,
      group_by_column || null,
      palette || 'emerald',
      title || null
    );
    return { id: result.lastInsertRowid, sub_category_id: subCategoryId, chart_type, x_axis_column, y_axis_column, group_by_column, palette, title };
  }
}

/**
 * Delete chart configuration for a sub-category
 */
export function deleteChartConfig(subCategoryId) {
  const stmt = db.prepare('DELETE FROM chart_configs WHERE sub_category_id = ?');
  const result = stmt.run(subCategoryId);
  return result.changes > 0;
}
