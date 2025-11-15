import Stock from '../models/Stock.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const addStock = asyncHandler(async (req, res) => {
    const { shop_id, product_id, quantity, buy_price, sale_price, notes, min_stock_level } = req.body;
    const created_by = req.user.id;

    if (!shop_id || !product_id || !quantity || buy_price === undefined || sale_price === undefined) {
        throw new AppError('Shop ID, product ID, quantity, buy price, and sale price are required', 400);
    }

    const result = await Stock.addStock(shop_id, product_id, quantity, buy_price, sale_price, created_by, notes, null, null, min_stock_level);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const reduceStock = asyncHandler(async (req, res) => {
    const { shop_id, product_id, quantity, notes } = req.body;
    const created_by = req.user.id;

    if (!shop_id || !product_id || !quantity) {
        throw new AppError('Shop ID, product ID, and quantity are required', 400);
    }

    const result = await Stock.reduceStock(shop_id, product_id, quantity, created_by, notes);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const getAllStock = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        product_id: req.query.product_id,
        category_id: req.query.category_id,
        low_stock: req.query.low_stock,
        search: req.query.search,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Stock.getAllStock(filters);

    res.status(200).json({
        success: true,
        message: 'Stock retrieved successfully',
        data: result.data,
        pagination: result.pagination
    });
});

export const getStockByShop = asyncHandler(async (req, res) => {
    const { shopId } = req.params;
    const filters = {
        low_stock: req.query.low_stock === 'true',
        product_id: req.query.product_id,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Stock.getStockByShop(shopId, filters);

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

export const getStockByProduct = asyncHandler(async (req, res) => {
    const { shopId, productId } = req.params;

    const result = await Stock.getStockByProduct(shopId, productId);

    res.status(200).json({
        success: true,
        data: result.data
    });
});

export const getStockTransactions = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        product_id: req.query.product_id,
        transaction_type: req.query.transaction_type,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Stock.getStockTransactions(filters);

    res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
    });
});

export const adjustStock = asyncHandler(async (req, res) => {
    const { shop_id, product_id, quantity, notes } = req.body;
    const created_by = req.user.id;

    if (!shop_id || !product_id || quantity === undefined) {
        throw new AppError('Shop ID, product ID, and quantity are required', 400);
    }

    const result = await Stock.adjustStock(shop_id, product_id, quantity, created_by, notes);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.status(200).json({
        success: true,
        message: result.message
    });
});

