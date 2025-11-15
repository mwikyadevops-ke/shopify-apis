import express from 'express';
import {
    createTransfer,
    getTransfers,
    getTransferById,
    completeTransfer,
    cancelTransfer
} from '../controllers/stockTransferController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateStockTransfer, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Protected routes
router.post('/', verifyToken, requireRole('admin', 'manager'), validateStockTransfer.create, actionLogger('CREATE_STOCK_TRANSFER'), createTransfer);
router.get('/', verifyToken, validatePagination, getTransfers);
router.get('/:id', verifyToken, validateStockTransfer.id, getTransferById);
router.put('/:id/complete', verifyToken, requireRole('admin', 'manager', 'staff'), validateStockTransfer.id, actionLogger('COMPLETE_STOCK_TRANSFER'), completeTransfer);
router.put('/:id/cancel', verifyToken, requireRole('admin', 'manager'), validateStockTransfer.id, actionLogger('CANCEL_STOCK_TRANSFER'), cancelTransfer);

export default router;

