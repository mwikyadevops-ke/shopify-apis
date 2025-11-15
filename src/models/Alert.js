import db from '../config/db.js';

const Alert = {
    // Get low stock alerts
    getLowStockAlerts: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 50;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM stock s
                JOIN products p ON s.product_id = p.id
                JOIN shops sh ON s.shop_id = sh.id
                WHERE s.quantity <= s.min_stock_level
                AND p.status = 'active'
            `;
            let dataQuery = `
                SELECT s.id as stock_id,
                       s.shop_id,
                       s.product_id,
                       s.quantity,
                       s.min_stock_level,
                       s.max_stock_level,
                       (s.min_stock_level - s.quantity) as shortage_quantity,
                       s.buy_price,
                       s.sale_price,
                       p.name as product_name,
                       p.sku,
                       p.barcode,
                       p.default_min_stock_level,
                       p.category_id,
                       c.name as category_name,
                       sh.name as shop_name,
                       sh.location as shop_location,
                       CASE 
                           WHEN s.quantity = 0 THEN 'out_of_stock'
                           WHEN s.quantity <= (s.min_stock_level * 0.5) THEN 'critical'
                           WHEN s.quantity <= s.min_stock_level THEN 'low'
                           ELSE 'normal'
                       END as alert_level
                FROM stock s
                JOIN products p ON s.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN shops sh ON s.shop_id = sh.id
                WHERE s.quantity <= s.min_stock_level
                AND p.status = 'active'
            `;
            const params = [];
            const countParams = [];

            // Filter by shop_id if provided
            if (filters.shop_id) {
                countQuery += ' AND s.shop_id = ?';
                dataQuery += ' AND s.shop_id = ?';
                params.push(filters.shop_id);
                countParams.push(filters.shop_id);
            }

            // Filter by category_id if provided
            if (filters.category_id) {
                countQuery += ' AND p.category_id = ?';
                dataQuery += ' AND p.category_id = ?';
                params.push(filters.category_id);
                countParams.push(filters.category_id);
            }

            // Filter by alert level
            if (filters.alert_level) {
                const levelCondition = filters.alert_level === 'out_of_stock' 
                    ? "s.quantity = 0"
                    : filters.alert_level === 'critical'
                    ? "s.quantity <= (s.min_stock_level * 0.5)"
                    : "s.quantity <= s.min_stock_level";
                countQuery += ` AND ${levelCondition}`;
                dataQuery += ` AND ${levelCondition}`;
            }

            // Search by product name or SKU
            if (filters.search) {
                const searchTerm = `%${filters.search}%`;
                countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
                dataQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
                params.push(searchTerm, searchTerm, searchTerm);
                countParams.push(searchTerm, searchTerm, searchTerm);
            }

            // Sorting - default by alert level (critical first) then by quantity
            const sortBy = filters.sort_by || 'alert_level';
            const sortOrder = filters.sort_order || 'asc';
            const allowedSortFields = {
                'alert_level': 's.quantity',
                'quantity': 's.quantity',
                'product_name': 'p.name',
                'shop_name': 'sh.name',
                'shortage': '(s.min_stock_level - s.quantity)'
            };
            const finalSortBy = allowedSortFields[sortBy] || 's.quantity';
            const finalSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

            // For alert_level sorting, we want critical first (lowest quantity)
            if (sortBy === 'alert_level') {
                dataQuery += ` ORDER BY s.quantity ASC, p.name ASC LIMIT ? OFFSET ?`;
            } else {
                dataQuery += ` ORDER BY ${finalSortBy} ${finalSortOrder}, p.name ASC LIMIT ? OFFSET ?`;
            }
            const dataParams = [...params, limit, offset];

            // Get total count
            const [countResult] = await db.query(countQuery, countParams);
            const total = countResult[0].total;

            // Get paginated data
            const [rows] = await db.query(dataQuery, dataParams);

            // Count by alert level
            const [levelCounts] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN s.quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(CASE WHEN s.quantity > 0 AND s.quantity <= (s.min_stock_level * 0.5) THEN 1 ELSE 0 END) as critical,
                    SUM(CASE WHEN s.quantity > (s.min_stock_level * 0.5) AND s.quantity <= s.min_stock_level THEN 1 ELSE 0 END) as low
                FROM stock s
                JOIN products p ON s.product_id = p.id
                WHERE s.quantity <= s.min_stock_level
                AND p.status = 'active'
                ${filters.shop_id ? 'AND s.shop_id = ?' : ''}
            `, filters.shop_id ? [filters.shop_id] : []);

            return {
                success: true,
                data: rows,
                summary: levelCounts[0] || { total: 0, out_of_stock: 0, critical: 0, low: 0 },
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Error fetching low stock alerts:', error);
            throw error;
        }
    },

    // Get alert count (for badge/notification count)
    getAlertCount: async (shop_id = null) => {
        try {
            let query = `
                SELECT COUNT(*) as count
                FROM stock s
                JOIN products p ON s.product_id = p.id
                WHERE s.quantity <= s.min_stock_level
                AND p.status = 'active'
            `;
            const params = [];

            if (shop_id) {
                query += ' AND s.shop_id = ?';
                params.push(shop_id);
            }

            const [rows] = await db.query(query, params);
            return {
                success: true,
                count: rows[0].count
            };
        } catch (error) {
            console.error('Error getting alert count:', error);
            throw error;
        }
    }
};

export default Alert;

