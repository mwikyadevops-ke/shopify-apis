import db from '../config/db.js';

const Sale = {
    // Create a sale
    create: async (saleData) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { shop_id, customer_name, customer_email, customer_phone, items, tax_amount = 0, discount_amount = 0, notes, created_by } = saleData;

            // Calculate totals
            let subtotal = 0;
            for (const item of items) {
                subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price) - parseFloat(item.discount || 0);
            }

            const total_amount = subtotal + parseFloat(tax_amount) - parseFloat(discount_amount);

            // Generate sale number
            const saleNumber = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Create sale record
            const [saleResult] = await connection.query(
                `INSERT INTO sales 
                 (sale_number, shop_id, customer_name, customer_email, customer_phone, 
                  subtotal, tax_amount, discount_amount, total_amount, status, notes, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
                [saleNumber, shop_id, customer_name, customer_email, customer_phone, 
                 subtotal, tax_amount, discount_amount, total_amount, notes, created_by]
            );

            const saleId = saleResult.insertId;

            // Create sale items and reduce stock
            for (const item of items) {
                // Insert sale item
                const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unit_price)) - parseFloat(item.discount || 0);
                await connection.query(
                    `INSERT INTO sale_items 
                     (sale_id, product_id, quantity, unit_price, discount, total_price) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [saleId, item.product_id, item.quantity, item.unit_price, item.discount || 0, itemTotal]
                );

                // Check and reduce stock within transaction
                const [stockRows] = await connection.query(
                    'SELECT quantity FROM stock WHERE shop_id = ? AND product_id = ?',
                    [shop_id, item.product_id]
                );

                if (stockRows.length === 0 || parseFloat(stockRows[0].quantity) < parseFloat(item.quantity)) {
                    await connection.rollback();
                    return {
                        success: false,
                        message: `Insufficient stock for product ${item.product_id}`
                    };
                }

                // Update stock
                await connection.query(
                    'UPDATE stock SET quantity = quantity - ? WHERE shop_id = ? AND product_id = ?',
                    [item.quantity, shop_id, item.product_id]
                );

                // Record stock transaction
                await connection.query(
                    `INSERT INTO stock_transactions 
                     (shop_id, product_id, transaction_type, quantity, reference_id, reference_type, notes, created_by) 
                     VALUES (?, ?, 'sale', ?, ?, ?, ?, ?)`,
                    [shop_id, item.product_id, item.quantity, saleId, 'sale', `Sale: ${saleNumber}`, created_by]
                );
            }

            await connection.commit();

            return {
                success: true,
                message: 'Sale created successfully',
                data: { id: saleId, sale_number: saleNumber, total_amount }
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error creating sale:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get all sales with pagination
    getAll: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM sales s
                WHERE 1=1
            `;
            let dataQuery = `
                SELECT s.*, 
                       sh.name as shop_name, 
                       u.username as created_by_name,
                       COUNT(si.id) as items_count,
                       COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_paid,
                       CASE 
                           WHEN COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) >= s.total_amount THEN 'paid'
                           WHEN COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) > 0 THEN 'partial'
                           ELSE 'unpaid'
                       END as payment_status
                FROM sales s
                JOIN shops sh ON s.shop_id = sh.id
                LEFT JOIN users u ON s.created_by = u.id
                LEFT JOIN sale_items si ON s.id = si.sale_id
                LEFT JOIN payments p ON s.id = p.sale_id
                WHERE 1=1
            `;
            const params = [];

            if (filters.shop_id) {
                countQuery += ' AND s.shop_id = ?';
                dataQuery += ' AND s.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.status) {
                countQuery += ' AND s.status = ?';
                dataQuery += ' AND s.status = ?';
                params.push(filters.status);
            }

            if (filters.start_date && filters.end_date) {
                countQuery += ' AND DATE(s.sale_date) BETWEEN ? AND ?';
                dataQuery += ' AND DATE(s.sale_date) BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            dataQuery += ' GROUP BY s.id ORDER BY s.sale_date DESC LIMIT ? OFFSET ?';
            const dataParams = [...params, limit, offset];

            // Get total count
            const [countResult] = await db.query(countQuery, params);
            const total = countResult[0].total;

            // Get paginated data
            const [rows] = await db.query(dataQuery, dataParams);

            return {
                success: true,
                data: rows,
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
            console.error('Error fetching sales:', error);
            throw error;
        }
    },

    // Get sale by ID
    getById: async (id) => {
        try {
            // Get sale details
            const [saleRows] = await db.query(
                `SELECT s.*, 
                        sh.name as shop_name, 
                        u.username as created_by_name,
                        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count,
                        COALESCE((SELECT SUM(amount) FROM payments WHERE sale_id = s.id AND status = 'completed'), 0) as total_paid,
                        CASE 
                            WHEN COALESCE((SELECT SUM(amount) FROM payments WHERE sale_id = s.id AND status = 'completed'), 0) >= s.total_amount THEN 'paid'
                            WHEN COALESCE((SELECT SUM(amount) FROM payments WHERE sale_id = s.id AND status = 'completed'), 0) > 0 THEN 'partial'
                            ELSE 'unpaid'
                        END as payment_status
                 FROM sales s
                 JOIN shops sh ON s.shop_id = sh.id
                 LEFT JOIN users u ON s.created_by = u.id
                 WHERE s.id = ?`,
                [id]
            );

            if (saleRows.length === 0) {
                return {
                    success: false,
                    message: 'Sale not found',
                    data: null
                };
            }

            // Get sale items
            const [itemRows] = await db.query(
                `SELECT si.*, p.name as product_name, p.sku, p.barcode
                 FROM sale_items si
                 JOIN products p ON si.product_id = p.id
                 WHERE si.sale_id = ?`,
                [id]
            );

            // Get payments
            const [paymentRows] = await db.query(
                `SELECT p.*, u.username as processed_by_name
                 FROM payments p
                 LEFT JOIN users u ON p.processed_by = u.id
                 WHERE p.sale_id = ?`,
                [id]
            );

            return {
                success: true,
                data: {
                    ...saleRows[0],
                    items: itemRows,
                    payments: paymentRows
                }
            };
        } catch (error) {
            console.error('Error fetching sale:', error);
            throw error;
        }
    },

    // Cancel sale (refund)
    cancel: async (id, created_by) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get sale details
            const [saleRows] = await connection.query(
                'SELECT * FROM sales WHERE id = ? AND status = ?',
                [id, 'completed']
            );

            if (saleRows.length === 0) {
                await connection.rollback();
                return {
                    success: false,
                    message: 'Sale not found or cannot be cancelled'
                };
            }

            const sale = saleRows[0];

            // Get sale items
            const [itemRows] = await connection.query(
                'SELECT * FROM sale_items WHERE sale_id = ?',
                [id]
            );

            // Return stock for each item
            for (const item of itemRows) {
                // Add stock back
                await connection.query(
                    `INSERT INTO stock (shop_id, product_id, quantity) 
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
                    [sale.shop_id, item.product_id, item.quantity, item.quantity]
                );

                // Record stock transaction
                await connection.query(
                    `INSERT INTO stock_transactions 
                     (shop_id, product_id, transaction_type, quantity, reference_id, reference_type, notes, created_by) 
                     VALUES (?, ?, 'return', ?, ?, ?, ?, ?)`,
                    [sale.shop_id, item.product_id, item.quantity, id, 'sale', `Sale cancellation: ${sale.sale_number}`, created_by]
                );
            }

            // Update sale status
            await connection.query(
                'UPDATE sales SET status = ? WHERE id = ?',
                ['cancelled', id]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Sale cancelled successfully'
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error cancelling sale:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
};

export default Sale;

