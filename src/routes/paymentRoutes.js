import express from 'express';
import {
    createPayment,
    getPayments,
    getPaymentById,
    refundPayment
} from '../controllers/paymentController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validatePayment, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Protected routes
router.post('/', verifyToken, requireRole('admin', 'manager', 'cashier', 'staff'), validatePayment.create, actionLogger('CREATE_PAYMENT'), createPayment);
router.get('/', verifyToken, validatePagination, getPayments);
router.get('/:id', verifyToken, validatePayment.id, getPaymentById);
router.put('/:id/refund', verifyToken, requireRole('admin', 'manager'), validatePayment.id, actionLogger('REFUND_PAYMENT'), refundPayment);

export default router;

