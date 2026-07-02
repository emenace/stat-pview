import {
  getSubCategoriesByCategory,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
} from '../models/subcategory_model.js';
import { getCategoryById } from '../models/category_model.js';

/**
 * GET /api/subcategories/:category_id — List all sub-categories for a category (Public)
 */
export function listSubCategories(req, res) {
  try {
    const categoryId = req.params.category_id;
    const category = getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const subCategories = getSubCategoriesByCategory(categoryId);
    return res.status(200).json({ success: true, data: subCategories });
  } catch (err) {
    console.error('[SubCategoryController] List Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve sub-categories.' });
  }
}

/**
 * POST /api/subcategories — Create a new sub-category (Admin Only)
 */
export function addSubCategory(req, res) {
  const { category_id, name, sort_order } = req.body || {};

  if (!category_id) {
    return res.status(400).json({ success: false, error: 'category_id is required.' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'name is required.' });
  }

  try {
    const category = getCategoryById(category_id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Parent category not found.' });
    }

    const subCategory = createSubCategory({
      category_id,
      name: name.trim(),
      sort_order: sort_order || 0
    });
    return res.status(201).json({ success: true, data: subCategory });
  } catch (err) {
    console.error('[SubCategoryController] Create Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create sub-category.' });
  }
}

/**
 * PUT /api/subcategories/:id — Update an existing sub-category (Admin Only)
 */
export function editSubCategory(req, res) {
  const { name, sort_order } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'name is required.' });
  }

  try {
    const exists = getSubCategoryById(req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Sub-category not found.' });
    }

    const updated = updateSubCategory(req.params.id, {
      name: name.trim(),
      sort_order: sort_order !== undefined ? sort_order : exists.sort_order
    });

    if (updated) {
      return res.status(200).json({ success: true, data: updated });
    }
    return res.status(500).json({ success: false, error: 'Failed to update sub-category.' });
  } catch (err) {
    console.error('[SubCategoryController] Update Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update sub-category.' });
  }
}

/**
 * DELETE /api/subcategories/:id — Delete a sub-category (Admin Only)
 */
export function removeSubCategory(req, res) {
  try {
    const exists = getSubCategoryById(req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Sub-category not found.' });
    }

    const deleted = deleteSubCategory(req.params.id);
    if (deleted) {
      return res.status(200).json({
        success: true,
        message: `Sub-category "${exists.name}" deleted successfully.`
      });
    }
    return res.status(500).json({ success: false, error: 'Failed to delete sub-category.' });
  } catch (err) {
    console.error('[SubCategoryController] Delete Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete sub-category.' });
  }
}
