import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../models/category_model.js';
import { getSubCategoriesByCategory } from '../models/subcategory_model.js';

/**
 * GET /api/categories — List all categories with their sub-categories (Public)
 */
export function listCategories(req, res) {
  try {
    const categories = getAllCategories();
    // Attach sub-categories to each category
    const enriched = categories.map(cat => ({
      ...cat,
      sub_categories: getSubCategoriesByCategory(cat.id)
    }));
    return res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    console.error('[CategoryController] List Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve categories.' });
  }
}

/**
 * GET /api/categories/:id — Get single category with sub-categories (Public)
 */
export function getCategory(req, res) {
  try {
    const category = getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }
    category.sub_categories = getSubCategoriesByCategory(category.id);
    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    console.error('[CategoryController] Get Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve category.' });
  }
}

/**
 * POST /api/categories — Create new category (Admin Only)
 */
export function addCategory(req, res) {
  const { name, icon, color_theme } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required.' });
  }

  try {
    const category = createCategory({
      name: name.trim(),
      icon: icon || 'chart-bar',
      color_theme: color_theme || 'emerald'
    });
    category.sub_categories = [];
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error('[CategoryController] Create Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create category.' });
  }
}

/**
 * PUT /api/categories/:id — Update category (Admin Only)
 */
export function editCategory(req, res) {
  const { name, icon, color_theme } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required.' });
  }

  try {
    const exists = getCategoryById(req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const updated = updateCategory(req.params.id, {
      name: name.trim(),
      icon: icon || exists.icon,
      color_theme: color_theme || exists.color_theme
    });

    if (updated) {
      const category = getCategoryById(req.params.id);
      category.sub_categories = getSubCategoriesByCategory(category.id);
      return res.status(200).json({ success: true, data: category });
    }
    return res.status(500).json({ success: false, error: 'Failed to update category.' });
  } catch (err) {
    console.error('[CategoryController] Update Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update category.' });
  }
}

/**
 * DELETE /api/categories/:id — Delete category (Admin Only)
 */
export function removeCategory(req, res) {
  try {
    const exists = getCategoryById(req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const deleted = deleteCategory(req.params.id);
    if (deleted) {
      return res.status(200).json({ success: true, message: `Category "${exists.name}" deleted successfully.` });
    }
    return res.status(500).json({ success: false, error: 'Failed to delete category.' });
  } catch (err) {
    console.error('[CategoryController] Delete Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete category.' });
  }
}
