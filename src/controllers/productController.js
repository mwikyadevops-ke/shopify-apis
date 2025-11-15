import Product from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createProduct = asyncHandler(async (req, res) => {
    const { name, sku, description, category_id, default_min_stock_level, barcode, status } = req.body;

    if (!name) {
        throw new AppError('Product name is required', 400);
    }

    try {
        const result = await Product.create({ name, sku, description, category_id, default_min_stock_level, barcode, status });

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        if (error.message === 'Category not found') {
            throw new AppError('Category not found', 404);
        }
        throw error;
    }
});

export const getProducts = asyncHandler(async (req, res) => {
    const filters = {
        status: req.query.status,
        category_id: req.query.category_id,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Product.getAll(filters);

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

export const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Product.getById(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const result = await Product.update(id, updateData);

        if (!result.success) {
            throw new AppError(result.message, 404);
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        if (error.message === 'Category not found') {
            throw new AppError('Category not found', 404);
        }
        throw error;
    }
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Product.delete(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

