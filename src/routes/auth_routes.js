import express from 'express';
import { login, logout, me } from '../controllers/auth_controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', me);

export default router;
