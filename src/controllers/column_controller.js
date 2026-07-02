import {
  getColumnsBySubCategory,
  getColumnById,
  createColumn,
  updateColumn,
  deleteColumn
} from '../models/column_model.js';
import { getSubCategoryById } from '../models/subcategory_model.js';

const VALID_DATA_TYPES = ['text', 'number', 'date', 'boolean', 'select'];

/**
 * GET /api/columns/:sub_category_id — List all columns for a sub-category (Public)
 */
export function listColumns(req, res) {
  try {
    const subCategoryId = req.params.sub_category_id || req.params.category_id;
    const subCat = getSubCategoryById(subCategoryId);
    if (!subCat) {
      return res.status(404).json({ success: false, error: 'Sub-category not found.' });
    }

    const columns = getColumnsBySubCategory(subCategoryId);
    return res.status(200).json({ success: true, data: columns });
  } catch (err) {
    console.error('[ColumnController] List Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve columns.' });
  }
}

/**
 * POST /api/columns — Create a new custom column (Admin Only)
 */
export function addColumn(req, res) {
  const { sub_category_id, category_id, column_name, column_label, data_type, is_required, sort_order } = req.body || {};
  const targetId = sub_category_id || category_id;

  // Validate required fields
  if (!targetId) {
    return res.status(400).json({ success: false, error: 'sub_category_id is required.' });
  }
  if (!column_name || !column_name.trim()) {
    return res.status(400).json({ success: false, error: 'column_name is required.' });
  }
  if (!column_label || !column_label.trim()) {
    return res.status(400).json({ success: false, error: 'column_label is required.' });
  }
  if (data_type && !VALID_DATA_TYPES.includes(data_type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid data_type. Must be one of: ${VALID_DATA_TYPES.join(', ')}`
    });
  }

  try {
    // Verify sub-category exists
    const subCat = getSubCategoryById(targetId);
    if (!subCat) {
      return res.status(404).json({ success: false, error: 'Sub-category not found.' });
    }

    const column = createColumn({
      sub_category_id: targetId,
      column_name: column_name.trim().toLowerCase().replace(/\s+/g, '_'),
      column_label: column_label.trim(),
      data_type: data_type || 'text',
      is_required: is_required || false,
      sort_order: sort_order || 0
    });
    return res.status(201).json({ success: true, data: column });
  } catch (err) {
    // Handle unique constraint violation
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: `Column name "${column_name}" already exists for this sub-category.`
      });
    }
    console.error('[ColumnController] Create Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create column.' });
  }
}

/**
 * PUT /api/columns/:id — Update a custom column (Admin Only)
 */
export function editColumn(req, res) {
  const { column_name, column_label, data_type, is_required, sort_order } = req.body || {};

  if (!column_name || !column_name.trim()) {
    return res.status(400).json({ success: false, error: 'column_name is required.' });
  }
  if (!column_label || !column_label.trim()) {
    return res.status(400).json({ success: false, error: 'column_label is required.' });
  }
  if (data_type && !VALID_DATA_TYPES.includes(data_type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid data_type. Must be one of: ${VALID_DATA_TYPES.join(', ')}`
    });
  }

  try {
    const exists = getColumnById(req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Column not found.' });
    }

    const updated = updateColumn(req.params.id, {
      column_name: column_name.trim().toLowerCase().replace(/\s+/g, '_'),
      column_label: column_label.trim(),
      data_type: data_type || exists.data_type,
      is_required: is_required !== undefined ? is_required : exists.is_required,
      sort_order: sort_order !== undefined ? sort_order : exists.sort_order
    });

    if (updated) {
      const column = getColumnById(req.params.id);
      return res.status(200).json({ success: true, data: column });
    }
    return res.status(500).json({ success: false, error: 'Failed to update column.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: `Column name "${column_name}" already exists for this sub-category.`
      });
    }
    console.error('[ColumnController] Update Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update column.' });
  }
}

/**
 * DELETE /api/columns/:id — Delete a custom column (Admin Only)
 */
export function removeColumn(req, res) {
  try {
    const exists = getColumnById(req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Column not found.' });
    }

    const deleted = deleteColumn(req.params.id);
    if (deleted) {
      return res.status(200).json({
        success: true,
        message: `Column "${exists.column_label}" deleted successfully.`
      });
    }
    return res.status(500).json({ success: false, error: 'Failed to delete column.' });
  } catch (err) {
    console.error('[ColumnController] Delete Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete column.' });
  }
}
