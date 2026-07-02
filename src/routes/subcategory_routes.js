import express from 'express';
import {
  listSubCategories,
  addSubCategory,
  editSubCategory,
  removeSubCategory
} from '../controllers/subcategory_controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminOnly.js';

const router = express.Router();

// Public: GET /api/subcategories/:category_id — List sub-categories for a given category
router.get('/:category_id', listSubCategories);

// Admin Only routes
router.post('/', requireAuth, adminOnly, addSubCategory);
router.put('/:id', requireAuth, adminOnly, editSubCategory);
router.delete('/:id', requireAuth, adminOnly, removeSubCategory);

export default router;
