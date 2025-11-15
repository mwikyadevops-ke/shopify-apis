import Payment from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createPayment = asyncHandler(async (req, res) => {
    const { sale_id, payment_method, amount, reference_number, notes } = req.body;
    const processed_by = req.user.id;

    if (!sale_id || !payment_method || !amount) {
        throw new AppError('Sale ID, payment method, and amount are required', 400);
    }

    const validPaymentMethods = ['cash', 'card', 'mobile_money', 'bank_transfer', 'credit'];
    if (!validPaymentMethods.includes(payment_method)) {
        throw new AppError('Invalid payment method', 400);
    }

    const result = await Payment.create({
        sale_id,
        payment_method,
        amount,
        reference_number,
        notes,
        processed_by
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

export const getPayments = asyncHandler(async (req, res) => {
    const filters = {
        sale_id: req.query.sale_id,
        shop_id: req.query.shop_id,
        payment_method: req.query.payment_method,
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Payment.getAll(filters);

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

export const getPaymentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Payment.getById(id);

    if (!result.success) {
        throw new AppError(result.message, 404);
    }

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const refundPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const processed_by = req.user.id;

    const result = await Payment.refund(id, processed_by, notes);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

