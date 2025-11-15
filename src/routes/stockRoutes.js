import express from 'express';
import {
    addStock,
    reduceStock,
    getAllStock,
    getStockByShop,
    getStockByProduct,
    getStockTransactions,
    adjustStock
} from '../controllers/stockController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateStock, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Protected routes
router.post('/add', verifyToken, requireRole('admin', 'manager', 'staff'), validateStock.add, actionLogger('ADD_STOCK'), addStock);
router.post('/reduce', verifyToken, requireRole('admin', 'manager', 'staff'), validateStock.reduce, actionLogger('REDUCE_STOCK'), reduceStock);
router.post('/adjust', verifyToken, requireRole('admin', 'manager'), validateStock.adjust, actionLogger('ADJUST_STOCK'), adjustStock);
router.get('/', verifyToken, validatePagination, getAllStock);
router.get('/shop/:shopId', verifyToken, validateStock.shopId, validatePagination, getStockByShop);
router.get('/shop/:shopId/product/:productId', verifyToken, validateStock.shopId, validateStock.productId, getStockByProduct);
router.get('/transactions', verifyToken, validatePagination, getStockTransactions);

export default router;

