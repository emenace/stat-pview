import express from 'express';
import {
  listColumns,
  addColumn,
  editColumn,
  removeColumn
} from '../controllers/column_controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminOnly.js';

const router = express.Router();

// Public: get columns for a category
router.get('/:category_id', listColumns);

// Admin-only CRUD endpoints
router.post('/', requireAuth, adminOnly, addColumn);
router.put('/:id', requireAuth, adminOnly, editColumn);
router.delete('/:id', requireAuth, adminOnly, removeColumn);

export default router;
