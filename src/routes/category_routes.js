import express from 'express';
import {
  listCategories,
  getCategory,
  addCategory,
  editCategory,
  removeCategory
} from '../controllers/category_controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminOnly.js';

const router = express.Router();

// Public endpoints
router.get('/', listCategories);
router.get('/:id', getCategory);

// Admin-only CRUD endpoints
router.post('/', requireAuth, adminOnly, addCategory);
router.put('/:id', requireAuth, adminOnly, editCategory);
router.delete('/:id', requireAuth, adminOnly, removeCategory);

export default router;
