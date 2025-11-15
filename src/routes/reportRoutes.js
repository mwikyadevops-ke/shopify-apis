import express from 'express';
import {
    getSalesReport,
    getStockReport,
    getProductSalesReport,
    getPaymentReport,
    getDashboardSummary
} from '../controllers/reportController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.get('/sales', verifyToken, getSalesReport);
router.get('/stock', verifyToken, getStockReport);
router.get('/products', verifyToken, getProductSalesReport);
router.get('/payments', verifyToken, getPaymentReport);
router.get('/dashboard', verifyToken, getDashboardSummary);

export default router;

