import db from '../config/db.js';

const Report = {
    // Sales report
    getSalesReport: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    DATE(s.sale_date) as date,
                    s.shop_id,
                    sh.name as shop_name,
                    COUNT(DISTINCT s.id) as total_sales,
                    SUM(s.subtotal) as total_subtotal,
                    SUM(s.tax_amount) as total_tax,
                    SUM(s.discount_amount) as total_discount,
                    SUM(s.total_amount) as total_amount
                FROM sales s
                JOIN shops sh ON s.shop_id = sh.id
                WHERE s.status = 'completed'
            `;
            const params = [];

            if (filters.shop_id) {
                query += ' AND s.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.start_date && filters.end_date) {
                query += ' AND DATE(s.sale_date) BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            query += ' GROUP BY DATE(s.sale_date), s.shop_id ORDER BY date DESC';

            const [rows] = await db.query(query, params);
            return {
                success: true,
                data: rows
            };
        } catch (error) {
            console.error('Error generating sales report:', error);
            throw error;
        }
    },

    // Stock report
    getStockReport: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    s.shop_id,
                    sh.name as shop_name,
                    s.product_id,
                    p.name as product_name,
                    p.sku,
                    p.category,
                    s.quantity,
                    s.min_stock_level,
                    s.max_stock_level,
                    CASE 
                        WHEN s.quantity <= s.min_stock_level THEN 'low'
                        WHEN s.quantity >= s.max_stock_level THEN 'high'
                        ELSE 'normal'
                    END as stock_status
                FROM stock s
                JOIN shops sh ON s.shop_id = sh.id
                JOIN products p ON s.product_id = p.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.shop_id) {
                query += ' AND s.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.low_stock) {
                query += ' AND s.quantity <= s.min_stock_level';
            }

            query += ' ORDER BY sh.name, p.name';

            const [rows] = await db.query(query, params);
            return {
                success: true,
                data: rows
            };
        } catch (error) {
            console.error('Error generating stock report:', error);
            throw error;
        }
    },

    // Product sales report
    getProductSalesReport: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    si.product_id,
                    p.name as product_name,
                    p.sku,
                    p.category,
                    SUM(si.quantity) as total_quantity_sold,
                    SUM(si.total_price) as total_revenue,
                    AVG(si.unit_price) as average_price,
                    COUNT(DISTINCT si.sale_id) as number_of_sales
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status = 'completed'
            `;
            const params = [];

            if (filters.shop_id) {
                query += ' AND s.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.product_id) {
                query += ' AND si.product_id = ?';
                params.push(filters.product_id);
            }

            if (filters.start_date && filters.end_date) {
                query += ' AND DATE(s.sale_date) BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            query += ' GROUP BY si.product_id ORDER BY total_revenue DESC';

            const [rows] = await db.query(query, params);
            return {
                success: true,
                data: rows
            };
        } catch (error) {
            console.error('Error generating product sales report:', error);
            throw error;
        }
    },

    // Payment report
    getPaymentReport: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    p.payment_method,
                    DATE(p.payment_date) as date,
                    COUNT(*) as transaction_count,
                    SUM(p.amount) as total_amount
                FROM payments p
                JOIN sales s ON p.sale_id = s.id
                WHERE p.status = 'completed'
            `;
            const params = [];

            if (filters.shop_id) {
                query += ' AND s.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.start_date && filters.end_date) {
                query += ' AND DATE(p.payment_date) BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            query += ' GROUP BY p.payment_method, DATE(p.payment_date) ORDER BY date DESC';

            const [rows] = await db.query(query, params);
            return {
                success: true,
                data: rows
            };
        } catch (error) {
            console.error('Error generating payment report:', error);
            throw error;
        }
    },

    // Dashboard summary
    getDashboardSummary: async (shop_id = null) => {
        try {
            let shopFilter = shop_id ? 'AND s.shop_id = ?' : '';
            const params = shop_id ? [shop_id] : [];

            // Total sales today
            const [todaySales] = await db.query(
                `SELECT COALESCE(SUM(total_amount), 0) as total 
                 FROM sales 
                 WHERE DATE(sale_date) = CURDATE() AND status = 'completed' ${shopFilter}`,
                params
            );

            // Total sales this month
            const [monthSales] = await db.query(
                `SELECT COALESCE(SUM(total_amount), 0) as total 
                 FROM sales 
                 WHERE MONTH(sale_date) = MONTH(CURDATE()) 
                 AND YEAR(sale_date) = YEAR(CURDATE()) 
                 AND status = 'completed' ${shopFilter}`,
                params
            );

            // Total sales this year
            const [yearSales] = await db.query(
                `SELECT COALESCE(SUM(total_amount), 0) as total 
                 FROM sales 
                 WHERE YEAR(sale_date) = YEAR(CURDATE()) 
                 AND status = 'completed' ${shopFilter}`,
                params
            );

            // Total products
            const [productCount] = await db.query(
                `SELECT COUNT(DISTINCT product_id) as total 
                 FROM stock ${shop_id ? 'WHERE shop_id = ?' : ''}`,
                shop_id ? [shop_id] : []
            );

            // Low stock items
            const [lowStock] = await db.query(
                `SELECT COUNT(*) as total 
                 FROM stock 
                 WHERE quantity <= min_stock_level ${shop_id ? 'AND shop_id = ?' : ''}`,
                shop_id ? [shop_id] : []
            );

            // Pending transfers
            const [pendingTransfers] = await db.query(
                `SELECT COUNT(*) as total 
                 FROM stock_transfers 
                 WHERE status = 'pending' 
                 ${shop_id ? 'AND (from_shop_id = ? OR to_shop_id = ?)' : ''}`,
                shop_id ? [shop_id, shop_id] : []
            );

            return {
                success: true,
                data: {
                    today_sales: parseFloat(todaySales[0].total),
                    month_sales: parseFloat(monthSales[0].total),
                    year_sales: parseFloat(yearSales[0].total),
                    total_products: parseInt(productCount[0].total),
                    low_stock_items: parseInt(lowStock[0].total),
                    pending_transfers: parseInt(pendingTransfers[0].total)
                }
            };
        } catch (error) {
            console.error('Error generating dashboard summary:', error);
            throw error;
        }
    }
};

export default Report;

