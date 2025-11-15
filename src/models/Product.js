import db from '../config/db.js';

const Product = {
    // Create a new product
    create: async (productData) => {
        try {
            const { name, sku, description, category_id, default_min_stock_level, barcode, status = 'active' } = productData;
            
            // Validate category_id if provided
            if (category_id !== undefined && category_id !== null) {
                const [categoryCheck] = await db.query(
                    'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
                    [category_id]
                );
                if (categoryCheck.length === 0) {
                    throw new Error('Category not found');
                }
            }
            
            const [result] = await db.query(
                `INSERT INTO products (name, sku, description, category_id, default_min_stock_level, barcode, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [name, sku, description, category_id || null, default_min_stock_level || 0, barcode, status]
            );

            // Fetch the created product with category information
            const [rows] = await db.query(
                `SELECT p.*, c.id as category_id, c.name as category_name, c.description as category_description
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 WHERE p.id = ?`,
                [result.insertId]
            );

            return {
                success: true,
                message: 'Product created successfully',
                data: rows[0]
            };
        } catch (error) {
            console.error('Error creating product:', error);
            if (error.message === 'Category not found') {
                throw error;
            }
            throw error;
        }
    },

    // Get all products with pagination
    getAll: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total 
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.deleted_at IS NULL
            `;
            let dataQuery = `
                SELECT p.*, 
                       c.id as category_id, 
                       c.name as category_name, 
                       c.description as category_description,
                       c.status as category_status
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.deleted_at IS NULL
            `;
            const params = [];

            if (filters.status) {
                countQuery += ' AND p.status = ?';
                dataQuery += ' AND p.status = ?';
                params.push(filters.status);
            }

            if (filters.category_id) {
                countQuery += ' AND p.category_id = ?';
                dataQuery += ' AND p.category_id = ?';
                params.push(filters.category_id);
            }

            if (filters.search) {
                const searchTerm = `%${filters.search}%`;
                countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
                dataQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
                params.push(searchTerm, searchTerm, searchTerm);
            }

            dataQuery += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
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
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    // Get product by ID
    getById: async (id) => {
        try {
            const [rows] = await db.query(
                `SELECT p.*, 
                        c.id as category_id, 
                        c.name as category_name, 
                        c.description as category_description,
                        c.status as category_status
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 WHERE p.id = ? AND p.deleted_at IS NULL`,
                [id]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'Product not found',
                    data: null
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    // Update product
    update: async (id, productData) => {
        try {
            const { name, sku, description, category_id, default_min_stock_level, barcode, status } = productData;
            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (sku !== undefined) {
                updates.push('sku = ?');
                params.push(sku);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description);
            }
            if (category_id !== undefined) {
                // Validate category_id if provided
                if (category_id !== null) {
                    const [categoryCheck] = await db.query(
                        'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
                        [category_id]
                    );
                    if (categoryCheck.length === 0) {
                        throw new Error('Category not found');
                    }
                }
                updates.push('category_id = ?');
                params.push(category_id);
            }
            if (default_min_stock_level !== undefined) {
                updates.push('default_min_stock_level = ?');
                params.push(default_min_stock_level);
            }
            if (barcode !== undefined) {
                updates.push('barcode = ?');
                params.push(barcode);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }

            if (updates.length === 0) {
                return {
                    success: false,
                    message: 'No fields to update'
                };
            }

            params.push(id);

            const [result] = await db.query(
                `UPDATE products SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
                params
            );

            if (result.affectedRows === 0) {
                return {
                    success: false,
                    message: 'Product not found'
                };
            }

            // Fetch the updated product with category information
            const [rows] = await db.query(
                `SELECT p.*, 
                        c.id as category_id, 
                        c.name as category_name, 
                        c.description as category_description,
                        c.status as category_status
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 WHERE p.id = ? AND p.deleted_at IS NULL`,
                [id]
            );

            return {
                success: true,
                message: 'Product updated successfully',
                data: rows[0]
            };
        } catch (error) {
            console.error('Error updating product:', error);
            if (error.message === 'Category not found') {
                throw error;
            }
            throw error;
        }
    },

    // Delete product (soft delete)
    delete: async (id) => {
        try {
            // Check if product exists and is not already deleted
            const [existing] = await db.query(
                'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (existing.length === 0) {
                return {
                    success: false,
                    message: 'Product not found'
                };
            }

            // Soft delete: set deleted_at timestamp
            const [result] = await db.query(
                'UPDATE products SET deleted_at = NOW() WHERE id = ?',
                [id]
            );

            return {
                success: true,
                message: 'Product deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
};

export default Product;

