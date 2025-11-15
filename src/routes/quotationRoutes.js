import express from 'express';
import {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    sendQuotation
} from '../controllers/quotationController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateQuotation, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Protected routes
router.post('/', verifyToken, requireRole('admin', 'manager'), validateQuotation.create, actionLogger('CREATE_QUOTATION'), createQuotation);
router.get('/', verifyToken, validatePagination, getQuotations);
router.get('/:id', verifyToken, validateQuotation.id, getQuotationById);
// More specific routes must come before general :id routes
router.put('/:id/send', verifyToken, requireRole('admin', 'manager'), validateQuotation.id, actionLogger('SEND_QUOTATION'), sendQuotation);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), validateQuotation.id, validateQuotation.update, actionLogger('UPDATE_QUOTATION'), updateQuotation);
router.delete('/:id', verifyToken, requireRole('admin', 'manager'), validateQuotation.id, actionLogger('DELETE_QUOTATION'), deleteQuotation);

export default router;

