import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/adminOnly.js';
import { getListUsers, createNewUser, editUser, removeUser } from '../controllers/user_controller.js';

const router = express.Router();

// All user management routes require Admin privileges
router.use(requireAuth, adminOnly);

router.get('/', getListUsers);
router.post('/', createNewUser);
router.put('/:id', editUser);
router.delete('/:id', removeUser);

export default router;
