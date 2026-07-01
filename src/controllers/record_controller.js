import {
  getRecordsByCategory,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord
} from '../models/record_model.js';
import { getCategoryById } from '../models/category_model.js';
import { getColumnsByCategory } from '../models/column_model.js';

/**
 * GET /api/records/:category_id — List paginated data records (Public)
 */
export function listRecords(req, res) {
  try {
    const categoryId = req.params.category_id;
    const category = getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const search = req.query.search || '';

    const result = getRecordsByCategory(categoryId, { page, limit, search });
    return res.status(200).json({
      success: true,
      pagination: result.pagination,
      data: result.records
    });
  } catch (err) {
    console.error('[RecordController] List Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve records.' });
  }
}

/**
 * GET /api/records/detail/:id — Get a single record (Public)
 */
export function getRecord(req, res) {
  try {
    const record = getRecordById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error('[RecordController] Get Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve record.' });
  }
}

/**
 * POST /api/records — Create a new data record (Admin Only)
 * Validates incoming JSON data against the category's custom_columns definition
 */
export function addRecord(req, res) {
  const { category_id, data } = req.body || {};

  if (!category_id) {
    return res.status(400).json({ success: false, error: 'category_id is required.' });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ success: false, error: 'data must be a valid JSON object.' });
  }

  try {
    // Verify category exists
    const category = getCategoryById(category_id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    // Validate data against custom_columns schema
    const columns = getColumnsByCategory(category_id);
    const validationErrors = validateDataAgainstSchema(data, columns);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Data validation failed.',
        details: validationErrors
      });
    }

    // Filter data to only include defined column keys
    const filteredData = {};
    columns.forEach(col => {
      if (data[col.column_name] !== undefined) {
        filteredData[col.column_name] = data[col.column_name];
      }
    });

    const record = createRecord(category_id, filteredData);
    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error('[RecordController] Create Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create record.' });
  }
}

/**
 * PUT /api/records/:id — Update an existing data record (Admin Only)
 */
export function editRecord(req, res) {
  const { data } = req.body || {};

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ success: false, error: 'data must be a valid JSON object.' });
  }

  try {
    const existing = getRecordById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    // Validate data against custom_columns schema
    const columns = getColumnsByCategory(existing.category_id);
    const validationErrors = validateDataAgainstSchema(data, columns);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Data validation failed.',
        details: validationErrors
      });
    }

    // Filter data to only include defined column keys
    const filteredData = {};
    columns.forEach(col => {
      if (data[col.column_name] !== undefined) {
        filteredData[col.column_name] = data[col.column_name];
      }
    });

    const updated = updateRecord(req.params.id, filteredData);
    if (updated) {
      const record = getRecordById(req.params.id);
      return res.status(200).json({ success: true, data: record });
    }
    return res.status(500).json({ success: false, error: 'Failed to update record.' });
  } catch (err) {
    console.error('[RecordController] Update Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update record.' });
  }
}

/**
 * DELETE /api/records/:id — Delete a data record (Admin Only)
 */
export function removeRecord(req, res) {
  try {
    const existing = getRecordById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    const deleted = deleteRecord(req.params.id);
    if (deleted) {
      return res.status(200).json({ success: true, message: 'Record deleted successfully.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to delete record.' });
  } catch (err) {
    console.error('[RecordController] Delete Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete record.' });
  }
}

/**
 * Validate a data object against the category's custom_columns definition
 * @param {object} data - The incoming JSON data
 * @param {Array} columns - The category's custom_columns definitions
 * @returns {Array} Array of validation error strings (empty if valid)
 */
function validateDataAgainstSchema(data, columns) {
  const errors = [];

  for (const col of columns) {
    const value = data[col.column_name];

    // Check required fields
    if (col.is_required && (value === undefined || value === null || value === '')) {
      errors.push(`Field "${col.column_label}" is required.`);
      continue;
    }

    // Skip type validation if value is not provided and not required
    if (value === undefined || value === null || value === '') continue;

    // Validate data type
    switch (col.data_type) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push(`Field "${col.column_label}" must be a number.`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
          errors.push(`Field "${col.column_label}" must be a boolean.`);
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push(`Field "${col.column_label}" must be a valid date.`);
        }
        break;
      case 'text':
      case 'select':
        if (typeof value !== 'string') {
          errors.push(`Field "${col.column_label}" must be a text string.`);
        }
        break;
    }
  }

  return errors;
}
