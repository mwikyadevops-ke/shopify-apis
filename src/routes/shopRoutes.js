import express from 'express';
import {
    createShop,
    getShops,
    getShopById,
    updateShop,
    deleteShop
} from '../controllers/shopController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateShop, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Protected routes
router.post('/', verifyToken, requireRole('admin'), validateShop.create, actionLogger('CREATE_SHOP'), createShop);
router.get('/', verifyToken, validatePagination, getShops);
router.get('/:id', verifyToken, validateShop.id, getShopById);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), validateShop.id, validateShop.update, actionLogger('UPDATE_SHOP'), updateShop);
router.delete('/:id', verifyToken, requireRole('admin'), validateShop.id, actionLogger('DELETE_SHOP'), deleteShop);

export default router;

