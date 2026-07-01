import { getChartConfigByCategory, upsertChartConfig } from '../models/chart_model.js';
import { getCategoryById } from '../models/category_model.js';
import { extractChartData } from '../models/record_model.js';

const VALID_CHART_TYPES = ['bar', 'line', 'pie', 'doughnut', 'area'];

/**
 * GET /api/charts/:category_id — Get chart config and pre-extracted data (Public)
 */
export function getChartConfig(req, res) {
  try {
    const categoryId = req.params.category_id;
    const category = getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const config = getChartConfigByCategory(categoryId);
    if (!config) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No chart configuration set for this category.'
      });
    }

    // Extract chart-ready data using json_extract
    let chartData = [];
    if (config.y_axis_column) {
      const xCol = config.x_axis_column || config.y_axis_column;
      chartData = extractChartData(categoryId, xCol, config.y_axis_column);
    }

    return res.status(200).json({
      success: true,
      data: {
        config,
        chartData: {
          labels: chartData.map(r => r.x_label),
          values: chartData.map(r => r.y_value)
        }
      }
    });
  } catch (err) {
    console.error('[ChartController] Get Config Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve chart configuration.' });
  }
}

/**
 * POST /api/charts/:category_id — Save or update chart config (Admin Only, Upsert)
 */
export function saveChartConfig(req, res) {
  const categoryId = req.params.category_id;
  const { chart_type, x_axis_column, y_axis_column, group_by_column, palette, title } = req.body || {};

  // Validate chart type if provided
  if (chart_type && !VALID_CHART_TYPES.includes(chart_type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid chart_type. Must be one of: ${VALID_CHART_TYPES.join(', ')}`
    });
  }

  try {
    const category = getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const config = upsertChartConfig(categoryId, {
      chart_type: chart_type || 'bar',
      x_axis_column: x_axis_column || null,
      y_axis_column: y_axis_column || null,
      group_by_column: group_by_column || null,
      palette: palette || 'default',
      title: title || null
    });

    return res.status(200).json({ success: true, data: config });
  } catch (err) {
    console.error('[ChartController] Save Config Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save chart configuration.' });
  }
}
