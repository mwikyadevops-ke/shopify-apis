import Sale from '../models/Sale.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createSale = asyncHandler(async (req, res) => {
    const { shop_id, customer_name, customer_email, customer_phone, items, tax_amount, discount_amount, notes } = req.body;
    const created_by = req.user.id;

    if (!shop_id || !items || items.length === 0) {
        throw new AppError('Shop ID and items are required', 400);
    }

    // Validate items
    for (const item of items) {
        if (!item.product_id || !item.quantity || !item.unit_price) {
            throw new AppError('Each item must have product_id, quantity, and unit_price', 400);
        }
    }

    const result = await Sale.create({
        shop_id,
        customer_name,
        customer_email,
        customer_phone,
        items,
        tax_amount: tax_amount || 0,
        discount_amount: discount_amount || 0,
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

export const getSales = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Sale.getAll(filters);

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

export const getSaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Sale.getById(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const cancelSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const created_by = req.user.id;

    const result = await Sale.cancel(id, created_by);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

