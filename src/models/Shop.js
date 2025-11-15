import db from '../config/db.js';

const Shop = {
    // Create a new shop
    create: async (shopData) => {
        try {
            const { name, location, phone, email, status = 'active' } = shopData;
            
            const [result] = await db.query(
                `INSERT INTO shops (name, location, phone, email, status) 
                 VALUES (?, ?, ?, ?, ?)`,
                [name, location, phone, email, status]
            );

            return {
                success: true,
                message: 'Shop created successfully',
                data: { id: result.insertId, ...shopData }
            };
        } catch (error) {
            console.error('Error creating shop:', error);
            throw error;
        }
    },

    // Get all shops with pagination
    getAll: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = 'SELECT COUNT(*) as total FROM shops WHERE deleted_at IS NULL';
            let dataQuery = 'SELECT * FROM shops WHERE deleted_at IS NULL';
            const params = [];

            if (filters.status) {
                countQuery += ' AND status = ?';
                dataQuery += ' AND status = ?';
                params.push(filters.status);
            }

            dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
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
            console.error('Error fetching shops:', error);
            throw error;
        }
    },

    // Get shop by ID
    getById: async (id) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM shops WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'Shop not found',
                    data: null
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error fetching shop:', error);
            throw error;
        }
    },

    // Update shop
    update: async (id, shopData) => {
        try {
            const { name, location, phone, email, status } = shopData;
            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name);
            }
            if (location !== undefined) {
                updates.push('location = ?');
                params.push(location);
            }
            if (phone !== undefined) {
                updates.push('phone = ?');
                params.push(phone);
            }
            if (email !== undefined) {
                updates.push('email = ?');
                params.push(email);
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
                `UPDATE shops SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
                params
            );

            if (result.affectedRows === 0) {
                return {
                    success: false,
                    message: 'Shop not found'
                };
            }

            return {
                success: true,
                message: 'Shop updated successfully'
            };
        } catch (error) {
            console.error('Error updating shop:', error);
            throw error;
        }
    },

    // Delete shop (soft delete)
    delete: async (id) => {
        try {
            // Check if shop exists and is not already deleted
            const [existing] = await db.query(
                'SELECT id FROM shops WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (existing.length === 0) {
                return {
                    success: false,
                    message: 'Shop not found'
                };
            }

            // Soft delete: set deleted_at timestamp
            const [result] = await db.query(
                'UPDATE shops SET deleted_at = NOW() WHERE id = ?',
                [id]
            );

            return {
                success: true,
                message: 'Shop deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting shop:', error);
            throw error;
        }
    }
};

export default Shop;

