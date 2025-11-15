import db from '../config/db.js';

const Payment = {
    // Create a payment
    create: async (paymentData) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { sale_id, payment_method, amount, reference_number, notes, processed_by } = paymentData;

            // Check if sale exists
            const [saleRows] = await connection.query(
                'SELECT * FROM sales WHERE id = ?',
                [sale_id]
            );

            if (saleRows.length === 0) {
                await connection.rollback();
                return {
                    success: false,
                    message: 'Sale not found'
                };
            }

            const sale = saleRows[0];

            // Get total paid so far
            const [paymentRows] = await connection.query(
                'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE sale_id = ? AND status = ?',
                [sale_id, 'completed']
            );

            const totalPaid = parseFloat(paymentRows[0].total_paid);
            const newTotalPaid = totalPaid + parseFloat(amount);

            // Create payment record
            const [result] = await connection.query(
                `INSERT INTO payments 
                 (sale_id, payment_method, amount, reference_number, status, notes, processed_by) 
                 VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
                [sale_id, payment_method, amount, reference_number, notes, processed_by]
            );

            // Update sale status based on payment
            let saleStatus = sale.status;
            if (newTotalPaid >= sale.total_amount) {
                saleStatus = 'completed';
            } else if (newTotalPaid > 0) {
                saleStatus = 'pending'; // Keep as pending if partial payment
            }

            await connection.query(
                'UPDATE sales SET status = ? WHERE id = ?',
                [saleStatus, sale_id]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Payment processed successfully',
                data: { id: result.insertId, sale_status: saleStatus }
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error creating payment:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get all payments with pagination
    getAll: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM payments p
                JOIN sales s ON p.sale_id = s.id
                WHERE 1=1
            `;
            let dataQuery = `
                SELECT p.*, s.sale_number, s.total_amount as sale_total,
                       sh.name as shop_name, u.username as processed_by_name
                FROM payments p
                JOIN sales s ON p.sale_id = s.id
                JOIN shops sh ON s.shop_id = sh.id
                LEFT JOIN users u ON p.processed_by = u.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.sale_id) {
                countQuery += ' AND p.sale_id = ?';
                dataQuery += ' AND p.sale_id = ?';
                params.push(filters.sale_id);
            }

            if (filters.shop_id) {
                countQuery += ' AND s.shop_id = ?';
                dataQuery += ' AND s.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.payment_method) {
                countQuery += ' AND p.payment_method = ?';
                dataQuery += ' AND p.payment_method = ?';
                params.push(filters.payment_method);
            }

            if (filters.status) {
                countQuery += ' AND p.status = ?';
                dataQuery += ' AND p.status = ?';
                params.push(filters.status);
            }

            if (filters.start_date && filters.end_date) {
                countQuery += ' AND DATE(p.payment_date) BETWEEN ? AND ?';
                dataQuery += ' AND DATE(p.payment_date) BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            dataQuery += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
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
            console.error('Error fetching payments:', error);
            throw error;
        }
    },

    // Get payment by ID
    getById: async (id) => {
        try {
            const [rows] = await db.query(
                `SELECT p.*, s.sale_number, s.total_amount as sale_total,
                        sh.name as shop_name, u.username as processed_by_name
                 FROM payments p
                 JOIN sales s ON p.sale_id = s.id
                 JOIN shops sh ON s.shop_id = sh.id
                 LEFT JOIN users u ON p.processed_by = u.id
                 WHERE p.id = ?`,
                [id]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'Payment not found',
                    data: null
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error fetching payment:', error);
            throw error;
        }
    },

    // Refund payment
    refund: async (id, processed_by, notes = null) => {
        try {
            const [result] = await db.query(
                `UPDATE payments SET status = 'refunded', notes = ? WHERE id = ? AND status = 'completed'`,
                [notes, id]
            );

            if (result.affectedRows === 0) {
                return {
                    success: false,
                    message: 'Payment not found or cannot be refunded'
                };
            }

            return {
                success: true,
                message: 'Payment refunded successfully'
            };
        } catch (error) {
            console.error('Error refunding payment:', error);
            throw error;
        }
    }
};

export default Payment;

