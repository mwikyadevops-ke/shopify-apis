import Quotation from '../models/Quotation.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createQuotation = asyncHandler(async (req, res) => {
    const { 
        supplier_name, 
        supplier_email, 
        supplier_phone, 
        supplier_address,
        shop_id,
        items, 
        apply_tax,
        tax_amount, 
        discount_amount, 
        valid_until,
        notes 
    } = req.body;
    const created_by = req.user.id;

    if (!supplier_name || !items || items.length === 0) {
        throw new AppError('Supplier name and items are required', 400);
    }

    // Validate items
    for (const item of items) {
        if (!item.item_name || !item.quantity || item.unit_price === undefined) {
            throw new AppError('Each item must have item_name, quantity, and unit_price', 400);
        }
    }

    const result = await Quotation.create({
        supplier_name,
        supplier_email,
        supplier_phone,
        supplier_address,
        shop_id,
        items,
        apply_tax,
        tax_amount: tax_amount || 0,
        discount_amount: discount_amount || 0,
        valid_until,
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

export const getQuotations = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        status: req.query.status,
        supplier_name: req.query.supplier_name,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Quotation.getAll(filters);

    res.status(200).json({
        success: true,
        message: 'Quotations retrieved successfully',
        data: result.data,
        pagination: result.pagination
    });
});

export const getQuotationById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Quotation.getById(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        message: 'Quotation retrieved successfully',
        data: result.data
    });
});

export const updateQuotation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const result = await Quotation.update(id, updateData);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
    });
});

export const deleteQuotation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Quotation.delete(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const sendQuotation = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Quotation.send(id);

    if (!result.success) {
        throw new AppError(result.message, result.message.includes('not found') ? 404 : 400);
    }

    res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        emailInfo: result.emailInfo
    });
});

