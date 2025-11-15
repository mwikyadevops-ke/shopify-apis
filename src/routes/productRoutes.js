import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateProduct, validatePagination } from '../middleware/validation.js';
import { actionLogger } from '../middleware/logger.js';

const router = express.Router();

// Protected routes
router.post('/', verifyToken, requireRole('admin', 'manager'), validateProduct.create, actionLogger('CREATE_PRODUCT'), createProduct);
router.get('/', verifyToken, validatePagination, getProducts);
router.get('/:id', verifyToken, validateProduct.id, getProductById);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), validateProduct.id, validateProduct.update, actionLogger('UPDATE_PRODUCT'), updateProduct);
router.delete('/:id', verifyToken, requireRole('admin'), validateProduct.id, actionLogger('DELETE_PRODUCT'), deleteProduct);

export default router;

