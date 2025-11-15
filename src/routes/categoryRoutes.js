import express from 'express';
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateCategory, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Protected routes
router.post('/', verifyToken, requireRole('admin', 'manager'), validateCategory.create, actionLogger('CREATE_CATEGORY'), createCategory);
router.get('/', verifyToken, validatePagination, getCategories);
router.get('/:id', verifyToken, validateCategory.id, getCategoryById);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), validateCategory.id, validateCategory.update, actionLogger('UPDATE_CATEGORY'), updateCategory);
router.delete('/:id', verifyToken, requireRole('admin', 'manager'), validateCategory.id, actionLogger('DELETE_CATEGORY'), deleteCategory);

export default router;

