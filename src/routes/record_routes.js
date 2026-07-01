import express from 'express';
import {
  listRecords,
  getRecord,
  addRecord,
  editRecord,
  removeRecord
} from '../controllers/record_controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminOnly.js';

const router = express.Router();

// Public: list records for a category (with pagination & search)
router.get('/:category_id', listRecords);

// Public: get a single record by ID
router.get('/detail/:id', getRecord);

// Admin-only CRUD endpoints
router.post('/', requireAuth, adminOnly, addRecord);
router.put('/:id', requireAuth, adminOnly, editRecord);
router.delete('/:id', requireAuth, adminOnly, removeRecord);

export default router;
