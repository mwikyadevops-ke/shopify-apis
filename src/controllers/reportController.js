import Report from '../models/Report.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getSalesReport = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date
    };

    const result = await Report.getSalesReport(filters);

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const getStockReport = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        low_stock: req.query.low_stock === 'true'
    };

    const result = await Report.getStockReport(filters);

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const getProductSalesReport = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        product_id: req.query.product_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date
    };

    const result = await Report.getProductSalesReport(filters);

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const getPaymentReport = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date
    };

    const result = await Report.getPaymentReport(filters);

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
    const shop_id = req.query.shop_id || null;

    const result = await Report.getDashboardSummary(shop_id);

    res.status(200).json({
        success: true,
        data: result.data
    });
});

