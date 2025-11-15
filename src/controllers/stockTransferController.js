import StockTransfer from '../models/StockTransfer.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createTransfer = asyncHandler(async (req, res) => {
    const { from_shop_id, to_shop_id, product_id, quantity, notes } = req.body;
    const created_by = req.user.id;

    if (!from_shop_id || !to_shop_id || !product_id || !quantity) {
        throw new AppError('From shop ID, to shop ID, product ID, and quantity are required', 400);
    }

    if (from_shop_id === to_shop_id) {
        throw new AppError('Source and destination shops cannot be the same', 400);
    }

    const result = await StockTransfer.create({
        from_shop_id,
        to_shop_id,
        product_id,
        quantity,
        notes,
        created_by
    });

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
    });
});

export const getTransfers = asyncHandler(async (req, res) => {
    const filters = {
        from_shop_id: req.query.from_shop_id,
        to_shop_id: req.query.to_shop_id,
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await StockTransfer.getAll(filters);

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

export const getTransferById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await StockTransfer.getById(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const completeTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const received_by = req.user.id;

    const result = await StockTransfer.complete(id, received_by);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const cancelTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await StockTransfer.cancel(id);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

