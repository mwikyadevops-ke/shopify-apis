import db from '../config/db.js';

const Stock = {
    // Add stock (increase quantity)
    addStock: async (shop_id, product_id, quantity, buy_price, sale_price, created_by, notes = null, reference_id = null, reference_type = null, min_stock_level = null) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get product's default min_stock_level if min_stock_level not provided
            let finalMinStockLevel = min_stock_level;
            if (finalMinStockLevel === null || finalMinStockLevel === undefined) {
                const [productRows] = await connection.query(
                    'SELECT default_min_stock_level FROM products WHERE id = ?',
                    [product_id]
                );
                if (productRows.length > 0) {
                    finalMinStockLevel = productRows[0].default_min_stock_level || 0;
                } else {
                    finalMinStockLevel = 0;
                }
            }

            // Check if stock record exists
            const [existingStock] = await connection.query(
                'SELECT id, min_stock_level, buy_price, sale_price FROM stock WHERE shop_id = ? AND product_id = ?',
                [shop_id, product_id]
            );

            if (existingStock.length > 0) {
                // Update existing stock
                // Update pricing if provided, otherwise keep existing
                const updateBuyPrice = buy_price !== null && buy_price !== undefined ? buy_price : existingStock[0].buy_price;
                const updateSalePrice = sale_price !== null && sale_price !== undefined ? sale_price : existingStock[0].sale_price;
                const updateMinStock = min_stock_level !== null && min_stock_level !== undefined ? finalMinStockLevel : existingStock[0].min_stock_level;
                
                await connection.query(
                    `UPDATE stock SET quantity = quantity + ?, 
                     buy_price = ?, sale_price = ?, min_stock_level = ?
                     WHERE shop_id = ? AND product_id = ?`,
                    [quantity, updateBuyPrice, updateSalePrice, updateMinStock, shop_id, product_id]
                );
            } else {
                // Insert new stock record with pricing and min_stock_level
                await connection.query(
                    `INSERT INTO stock (shop_id, product_id, quantity, min_stock_level, buy_price, sale_price) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [shop_id, product_id, quantity, finalMinStockLevel, buy_price, sale_price]
                );
            }

            // Record transaction
            await connection.query(
                `INSERT INTO stock_transactions 
                 (shop_id, product_id, transaction_type, quantity, reference_id, reference_type, notes, created_by) 
                 VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?)`,
                [shop_id, product_id, quantity, reference_id, reference_type, notes, created_by]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Stock added successfully'
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error adding stock:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Reduce stock (decrease quantity - for sales)
    reduceStock: async (shop_id, product_id, quantity, created_by, notes = null, reference_id = null, reference_type = null) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Check current stock
            const [stockRows] = await connection.query(
                'SELECT quantity FROM stock WHERE shop_id = ? AND product_id = ?',
                [shop_id, product_id]
            );

            if (stockRows.length === 0 || parseFloat(stockRows[0].quantity) < parseFloat(quantity)) {
                await connection.rollback();
                return {
                    success: false,
                    message: 'Insufficient stock'
                };
            }

            // Update stock
            await connection.query(
                'UPDATE stock SET quantity = quantity - ? WHERE shop_id = ? AND product_id = ?',
                [quantity, shop_id, product_id]
            );

            // Record transaction
            await connection.query(
                `INSERT INTO stock_transactions 
                 (shop_id, product_id, transaction_type, quantity, reference_id, reference_type, notes, created_by) 
                 VALUES (?, ?, 'sale', ?, ?, ?, ?, ?)`,
                [shop_id, product_id, quantity, reference_id, reference_type, notes, created_by]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Stock reduced successfully'
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error reducing stock:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get all stock (all shops or filtered by shop_id) with pagination
    getAllStock: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM stock s
                WHERE 1=1
            `;
            let dataQuery = `
                SELECT s.id, s.shop_id, s.product_id, s.quantity, s.min_stock_level, s.max_stock_level,
                       s.buy_price, s.sale_price,
                       p.name as product_name, p.sku, p.barcode, p.status as product_status,
                       p.category_id, c.name as category_name, c.description as category_description,
                       sh.name as shop_name, sh.location as shop_location
                FROM stock s
                JOIN products p ON s.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN shops sh ON s.shop_id = sh.id
                WHERE 1=1
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

            // Filter by product_id if provided
            if (filters.product_id) {
                countQuery += ' AND s.product_id = ?';
                dataQuery += ' AND s.product_id = ?';
                params.push(filters.product_id);
                countParams.push(filters.product_id);
            }

            // Filter by category_id if provided
            if (filters.category_id) {
                countQuery += ' AND p.category_id = ?';
                dataQuery += ' AND p.category_id = ?';
                params.push(filters.category_id);
                countParams.push(filters.category_id);
            }

            // Filter low stock
            if (filters.low_stock === 'true' || filters.low_stock === true) {
                countQuery += ' AND s.quantity <= s.min_stock_level';
                dataQuery += ' AND s.quantity <= s.min_stock_level';
            }

            // Search by product name, SKU, or barcode
            if (filters.search) {
                const searchTerm = `%${filters.search}%`;
                countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
                dataQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
                params.push(searchTerm, searchTerm, searchTerm);
                countParams.push(searchTerm, searchTerm, searchTerm);
            }

            // Sorting
            const sortBy = filters.sort_by || 'shop_name';
            const sortOrder = filters.sort_order || 'asc';
            const allowedSortFields = {
                'shop_name': 'sh.name',
                'product_name': 'p.name',
                'quantity': 's.quantity',
                'category_name': 'c.name'
            };
            const finalSortBy = allowedSortFields[sortBy] || 'sh.name';
            const finalSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

            dataQuery += ` ORDER BY ${finalSortBy} ${finalSortOrder}, p.name LIMIT ? OFFSET ?`;
            const dataParams = [...params, limit, offset];

            // Get total count
            const [countResult] = await db.query(countQuery, countParams);
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
            console.error('Error fetching all stock:', error);
            throw error;
        }
    },

    // Get stock for a shop with pagination
    getStockByShop: async (shop_id, filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM stock s
                WHERE s.shop_id = ?
            `;
            let dataQuery = `
                SELECT s.id, s.shop_id, s.product_id, s.quantity, s.min_stock_level, s.max_stock_level,
                       s.buy_price, s.sale_price,
                       p.name as product_name, p.sku, p.barcode, p.status as product_status,
                       p.category_id, c.name as category_name, c.description as category_description,
                       sh.name as shop_name
                FROM stock s
                JOIN products p ON s.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN shops sh ON s.shop_id = sh.id
                WHERE s.shop_id = ?
            `;
            const params = [shop_id];
            const countParams = [shop_id];

            if (filters.low_stock) {
                countQuery += ' AND s.quantity <= s.min_stock_level';
                dataQuery += ' AND s.quantity <= s.min_stock_level';
            }

            if (filters.product_id) {
                countQuery += ' AND s.product_id = ?';
                dataQuery += ' AND s.product_id = ?';
                params.push(filters.product_id);
                countParams.push(filters.product_id);
            }

            dataQuery += ' ORDER BY p.name LIMIT ? OFFSET ?';
            const dataParams = [...params, limit, offset];

            // Get total count
            const [countResult] = await db.query(countQuery, countParams);
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
            console.error('Error fetching stock:', error);
            throw error;
        }
    },

    // Get stock for a specific product in a shop
    getStockByProduct: async (shop_id, product_id) => {
        try {
            const [rows] = await db.query(
                `SELECT s.*, p.name as product_name, p.sku, s.sale_price
                 FROM stock s
                 JOIN products p ON s.product_id = p.id
                 WHERE s.shop_id = ? AND s.product_id = ?`,
                [shop_id, product_id]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'Stock not found',
                    data: { quantity: 0 }
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error fetching stock by product:', error);
            throw error;
        }
    },

    // Get stock transactions with pagination
    getStockTransactions: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM stock_transactions st
                WHERE 1=1
            `;
            let dataQuery = `
                SELECT st.*, p.name as product_name, p.sku,
                       sh.name as shop_name, u.username as created_by_name
                FROM stock_transactions st
                JOIN products p ON st.product_id = p.id
                JOIN shops sh ON st.shop_id = sh.id
                LEFT JOIN users u ON st.created_by = u.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.shop_id) {
                countQuery += ' AND st.shop_id = ?';
                dataQuery += ' AND st.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.product_id) {
                countQuery += ' AND st.product_id = ?';
                dataQuery += ' AND st.product_id = ?';
                params.push(filters.product_id);
            }

            if (filters.transaction_type) {
                countQuery += ' AND st.transaction_type = ?';
                dataQuery += ' AND st.transaction_type = ?';
                params.push(filters.transaction_type);
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
            console.error('Error fetching stock transactions:', error);
            throw error;
        }
    },

    // Adjust stock (manual adjustment)
    adjustStock: async (shop_id, product_id, quantity, created_by, notes = null) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get current stock
            const [stockRows] = await connection.query(
                'SELECT quantity FROM stock WHERE shop_id = ? AND product_id = ?',
                [shop_id, product_id]
            );

            let currentQuantity = 0;
            if (stockRows.length > 0) {
                currentQuantity = parseFloat(stockRows[0].quantity);
            }

            const newQuantity = parseFloat(quantity);
            const adjustment = newQuantity - currentQuantity;

            // Update or insert stock
            if (stockRows.length === 0) {
                await connection.query(
                    'INSERT INTO stock (shop_id, product_id, quantity) VALUES (?, ?, ?)',
                    [shop_id, product_id, newQuantity]
                );
            } else {
                await connection.query(
                    'UPDATE stock SET quantity = ? WHERE shop_id = ? AND product_id = ?',
                    [newQuantity, shop_id, product_id]
                );
            }

            // Record transaction
            await connection.query(
                `INSERT INTO stock_transactions 
                 (shop_id, product_id, transaction_type, quantity, notes, created_by) 
                 VALUES (?, ?, 'adjustment', ?, ?, ?)`,
                [shop_id, product_id, adjustment, notes, created_by]
            );

            await connection.commit();

            return {
                success: true,
                message: 'Stock adjusted successfully'
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error adjusting stock:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
};

export default Stock;

