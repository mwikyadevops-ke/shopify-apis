import express from 'express';
import {
    createSale,
    getSales,
    getSaleById,
    cancelSale
} from '../controllers/saleController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateSale, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Protected routes
router.post('/', verifyToken, requireRole('admin', 'manager', 'cashier', 'staff'), validateSale.create, actionLogger('CREATE_SALE'), createSale);
router.get('/', verifyToken, validatePagination, getSales);
router.get('/:id', verifyToken, validateSale.id, getSaleById);
router.put('/:id/cancel', verifyToken, requireRole('admin', 'manager'), validateSale.id, actionLogger('CANCEL_SALE'), cancelSale);

export default router;

