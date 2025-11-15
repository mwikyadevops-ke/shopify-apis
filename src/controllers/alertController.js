import Alert from '../models/Alert.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getLowStockAlerts = asyncHandler(async (req, res) => {
    const filters = {
        shop_id: req.query.shop_id,
        category_id: req.query.category_id,
        alert_level: req.query.alert_level,
        search: req.query.search,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await Alert.getLowStockAlerts(filters);

    res.status(200).json({
        success: true,
        message: 'Low stock alerts retrieved successfully',
        data: result.data,
        summary: result.summary,
        pagination: result.pagination
    });
});

export const getAlertCount = asyncHandler(async (req, res) => {
    const shop_id = req.query.shop_id || null;

    const result = await Alert.getAlertCount(shop_id);

    res.status(200).json({
        success: true,
        count: result.count
    });
});

