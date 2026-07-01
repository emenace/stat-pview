import db from '../config/database.js';

const VALID_CHART_TYPES = ['bar', 'line', 'pie', 'doughnut', 'area'];

/**
 * Get chart configuration for a category
 */
export function getChartConfigByCategory(categoryId) {
  return db.prepare('SELECT * FROM chart_configs WHERE category_id = ?').get(categoryId);
}

/**
 * Upsert chart configuration (insert or update on conflict)
 */
export function upsertChartConfig(categoryId, { chart_type, x_axis_column, y_axis_column, group_by_column, palette, title }) {
  const existing = getChartConfigByCategory(categoryId);

  if (existing) {
    // Update
    const stmt = db.prepare(`
      UPDATE chart_configs
      SET chart_type = ?, x_axis_column = ?, y_axis_column = ?, group_by_column = ?, palette = ?, title = ?
      WHERE category_id = ?
    `);
    stmt.run(
      VALID_CHART_TYPES.includes(chart_type) ? chart_type : existing.chart_type,
      x_axis_column || existing.x_axis_column,
      y_axis_column || existing.y_axis_column,
      group_by_column !== undefined ? group_by_column : existing.group_by_column,
      palette || existing.palette,
      title !== undefined ? title : existing.title,
      categoryId
    );
    return getChartConfigByCategory(categoryId);
  } else {
    // Insert
    const stmt = db.prepare(`
      INSERT INTO chart_configs (category_id, chart_type, x_axis_column, y_axis_column, group_by_column, palette, title)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      categoryId,
      VALID_CHART_TYPES.includes(chart_type) ? chart_type : 'bar',
      x_axis_column || null,
      y_axis_column || null,
      group_by_column || null,
      palette || 'default',
      title || null
    );
    return { id: result.lastInsertRowid, category_id: categoryId, chart_type, x_axis_column, y_axis_column, group_by_column, palette, title };
  }
}

/**
 * Delete chart configuration for a category
 */
export function deleteChartConfig(categoryId) {
  const stmt = db.prepare('DELETE FROM chart_configs WHERE category_id = ?');
  const result = stmt.run(categoryId);
  return result.changes > 0;
}
