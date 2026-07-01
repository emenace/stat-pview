import express from 'express';
import { getChartConfig, saveChartConfig } from '../controllers/chart_controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminOnly.js';

const router = express.Router();

// Public: get chart config + extracted data for a category
router.get('/:category_id', getChartConfig);

// Admin-only: save (upsert) chart config
router.post('/:category_id', requireAuth, adminOnly, saveChartConfig);

export default router;
