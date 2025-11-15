import Shop from '../models/Shop.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createShop = asyncHandler(async (req, res) => {
    const { name, location, phone, email, status } = req.body;

    if (!name) {
        throw new AppError('Shop name is required', 400);
    }

    const result = await Shop.create({ name, location, phone, email, status });

    res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
    });
});

export const getShops = asyncHandler(async (req, res) => {
    const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Shop.getAll(filters);

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

export const getShopById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Shop.getById(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const updateShop = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const result = await Shop.update(id, updateData);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const deleteShop = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Shop.delete(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

