import db from '../config/db.js';

const StockTransfer = {
    // Create a stock transfer
    create: async (transferData) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { from_shop_id, to_shop_id, product_id, quantity, notes, created_by } = transferData;

            // Check if source shop has sufficient stock
            const [stockRows] = await connection.query(
                'SELECT quantity FROM stock WHERE shop_id = ? AND product_id = ?',
                [from_shop_id, product_id]
            );

            if (stockRows.length === 0 || parseFloat(stockRows[0].quantity) < parseFloat(quantity)) {
                await connection.rollback();
                return {
                    success: false,
                    message: 'Insufficient stock in source shop'
                };
            }

            // Generate transfer number
            const transferNumber = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Create transfer record
            const [result] = await connection.query(
                `INSERT INTO stock_transfers 
                 (transfer_number, from_shop_id, to_shop_id, product_id, quantity, status, notes, created_by) 
                 VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
                [transferNumber, from_shop_id, to_shop_id, product_id, quantity, notes, created_by]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Stock transfer created successfully',
                data: { id: result.insertId, transfer_number: transferNumber }
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error creating stock transfer:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Complete a stock transfer
    complete: async (transfer_id, received_by) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get transfer details
            const [transferRows] = await connection.query(
                'SELECT * FROM stock_transfers WHERE id = ? AND status = ?',
                [transfer_id, 'pending']
            );

            if (transferRows.length === 0) {
                await connection.rollback();
                return {
                    success: false,
                    message: 'Transfer not found or already processed'
                };
            }

            const transfer = transferRows[0];

            // Reduce stock from source shop
            await connection.query(
                'UPDATE stock SET quantity = quantity - ? WHERE shop_id = ? AND product_id = ?',
                [transfer.quantity, transfer.from_shop_id, transfer.product_id]
            );

            // Add stock to destination shop
            await connection.query(
                `INSERT INTO stock (shop_id, product_id, quantity) 
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
                [transfer.to_shop_id, transfer.product_id, transfer.quantity, transfer.quantity]
            );

            // Record outgoing transaction
            await connection.query(
                `INSERT INTO stock_transactions 
                 (shop_id, product_id, transaction_type, quantity, reference_id, reference_type, created_by) 
                 VALUES (?, ?, 'transfer_out', ?, ?, 'stock_transfer', ?)`,
                [transfer.from_shop_id, transfer.product_id, transfer.quantity, transfer_id, transfer.created_by]
            );

            // Record incoming transaction
            await connection.query(
                `INSERT INTO stock_transactions 
                 (shop_id, product_id, transaction_type, quantity, reference_id, reference_type, created_by) 
                 VALUES (?, ?, 'transfer_in', ?, ?, 'stock_transfer', ?)`,
                [transfer.to_shop_id, transfer.product_id, transfer.quantity, transfer_id, received_by]
            );

            // Update transfer status
            await connection.query(
                `UPDATE stock_transfers 
                 SET status = 'completed', received_by = ?, completed_at = NOW() 
                 WHERE id = ?`,
                [received_by, transfer_id]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Stock transfer completed successfully'
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error completing stock transfer:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get all transfers with pagination
    getAll: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM stock_transfers st
                WHERE 1=1
            `;
            let dataQuery = `
                SELECT st.*, 
                       p.name as product_name, p.sku,
                       s1.name as from_shop_name,
                       s2.name as to_shop_name,
                       u1.username as created_by_name,
                       u2.username as received_by_name
                FROM stock_transfers st
                JOIN products p ON st.product_id = p.id
                JOIN shops s1 ON st.from_shop_id = s1.id
                JOIN shops s2 ON st.to_shop_id = s2.id
                LEFT JOIN users u1 ON st.created_by = u1.id
                LEFT JOIN users u2 ON st.received_by = u2.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.from_shop_id) {
                countQuery += ' AND st.from_shop_id = ?';
                dataQuery += ' AND st.from_shop_id = ?';
                params.push(filters.from_shop_id);
            }

            if (filters.to_shop_id) {
                countQuery += ' AND st.to_shop_id = ?';
                dataQuery += ' AND st.to_shop_id = ?';
                params.push(filters.to_shop_id);
            }

            if (filters.status) {
                countQuery += ' AND st.status = ?';
                dataQuery += ' AND st.status = ?';
                params.push(filters.status);
            }

            if (filters.start_date && filters.end_date) {
                countQuery += ' AND DATE(st.created_at) BETWEEN ? AND ?';
                dataQuery += ' AND DATE(st.created_at) BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            dataQuery += ' ORDER BY st.created_at DESC LIMIT ? OFFSET ?';
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
            console.error('Error fetching stock transfers:', error);
            throw error;
        }
    },

    // Get transfer by ID
    getById: async (id) => {
        try {
            const [rows] = await db.query(
                `SELECT st.*, 
                        p.name as product_name, p.sku,
                        s1.name as from_shop_name,
                        s2.name as to_shop_name,
                        u1.username as created_by_name,
                        u2.username as received_by_name
                 FROM stock_transfers st
                 JOIN products p ON st.product_id = p.id
                 JOIN shops s1 ON st.from_shop_id = s1.id
                 JOIN shops s2 ON st.to_shop_id = s2.id
                 LEFT JOIN users u1 ON st.created_by = u1.id
                 LEFT JOIN users u2 ON st.received_by = u2.id
                 WHERE st.id = ?`,
                [id]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'Transfer not found',
                    data: null
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error fetching transfer:', error);
            throw error;
        }
    },

    // Cancel transfer
    cancel: async (id) => {
        try {
            const [result] = await db.query(
                `UPDATE stock_transfers SET status = 'cancelled' WHERE id = ? AND status = 'pending'`,
                [id]
            );

            if (result.affectedRows === 0) {
                return {
                    success: false,
                    message: 'Transfer not found or cannot be cancelled'
                };
            }

            return {
                success: true,
                message: 'Transfer cancelled successfully'
            };
        } catch (error) {
            console.error('Error cancelling transfer:', error);
            throw error;
        }
    }
};

export default StockTransfer;

