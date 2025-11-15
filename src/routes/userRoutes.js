import express from 'express';
import {
    createUser,
    getUsers,
    getUserById,
    loginUser,
    refreshToken,
    updateUser,
    deleteUser
} from '../controllers/userController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateUser, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Public routes
router.post('/login', validateUser.login, loginUser);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/', verifyToken, requireRole('admin', 'manager'), validateUser.create, actionLogger('CREATE_USER'), createUser);
router.get('/', verifyToken, validatePagination, getUsers);
router.get('/:id', verifyToken, validateUser.id, getUserById);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), validateUser.id, validateUser.update, actionLogger('UPDATE_USER'), updateUser);
router.delete('/:id', verifyToken, requireRole('admin'), validateUser.id, actionLogger('DELETE_USER'), deleteUser);

export default router;

