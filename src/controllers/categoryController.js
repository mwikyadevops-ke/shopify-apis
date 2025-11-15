import Category from '../models/Category.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createCategory = asyncHandler(async (req, res) => {
    const { name, description, status } = req.body;

    if (!name) {
        throw new AppError('Category name is required', 400);
    }

    try {
        const result = await Category.create({ name, description, status });

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        if (error.message === 'Category name already exists') {
            throw new AppError('Category name already exists', 409);
        }
        throw error;
    }
});

export const getCategories = asyncHandler(async (req, res) => {
    const filters = {
        status: req.query.status,
        search: req.query.search,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Category.getAll(filters);

    res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: result.data,
        pagination: result.pagination
    });
});

export const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Category.getById(id);

    if (!result.success) {
        throw new AppError(result.message || 'Category not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: result.data
    });
});

export const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const result = await Category.update(id, updateData);

        if (!result.success) {
            throw new AppError(result.message || 'Category not found', 404);
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        if (error.message === 'Category name already exists') {
            throw new AppError('Category name already exists', 409);
        }
        throw error;
    }
});

export const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Category.delete(id);

    if (!result.success) {
        if (result.message.includes('associated with existing products')) {
            throw new AppError(result.message, 409);
        }
        throw new AppError(result.message || 'Category not found', 404);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

