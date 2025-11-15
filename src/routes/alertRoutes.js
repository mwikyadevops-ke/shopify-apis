import express from 'express';
import {
    getLowStockAlerts,
    getAlertCount
} from '../controllers/alertController.js';
import { verifyToken } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';

const router = express.Router();

// Protected routes - accessible to all authenticated users
router.get('/low-stock', verifyToken, validatePagination, getLowStockAlerts);
router.get('/count', verifyToken, getAlertCount);

export default router;

