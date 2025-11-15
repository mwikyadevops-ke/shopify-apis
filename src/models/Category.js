import db from '../config/db.js';

const Category = {
    // Create a new category
    create: async (categoryData) => {
        try {
            const { name, description, status = 'active' } = categoryData;
            
            // Trim whitespace from name and description
            const trimmedName = name?.trim();
            const trimmedDescription = description?.trim();
            
            const [result] = await db.query(
                `INSERT INTO categories (name, description, status) 
                 VALUES (?, ?, ?)`,
                [trimmedName, trimmedDescription || null, status]
            );

            // Fetch the created category
            const [rows] = await db.query(
                'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL',
                [result.insertId]
            );

            return {
                success: true,
                message: 'Category created successfully',
                data: rows[0]
            };
        } catch (error) {
            console.error('Error creating category:', error);
            // Handle duplicate entry error
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Category name already exists');
            }
            throw error;
        }
    },

    // Get all categories with pagination
    getAll: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            // Ensure limit doesn't exceed maximum
            const maxLimit = 100;
            const finalLimit = limit > maxLimit ? maxLimit : limit;

            let countQuery = 'SELECT COUNT(*) as total FROM categories WHERE deleted_at IS NULL';
            let dataQuery = 'SELECT * FROM categories WHERE deleted_at IS NULL';
            const params = [];

            // Filter by status
            if (filters.status) {
                countQuery += ' AND status = ?';
                dataQuery += ' AND status = ?';
                params.push(filters.status);
            }

            // Search functionality (case-insensitive search on name and description)
            if (filters.search) {
                const searchTerm = `%${filters.search}%`;
                countQuery += ' AND (name LIKE ? OR description LIKE ?)';
                dataQuery += ' AND (name LIKE ? OR description LIKE ?)';
                params.push(searchTerm, searchTerm);
            }

            // Sorting
            const sortBy = filters.sort_by || 'created_at';
            const sortOrder = filters.sort_order || 'desc';
            const allowedSortFields = ['id', 'name', 'status', 'created_at', 'updated_at'];
            const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
            const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

            dataQuery += ` ORDER BY ${finalSortBy} ${finalSortOrder} LIMIT ? OFFSET ?`;
            const dataParams = [...params, finalLimit, offset];

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
                    limit: finalLimit,
                    total,
                    totalPages: Math.ceil(total / finalLimit),
                    hasNext: page < Math.ceil(total / finalLimit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    // Get category by ID
    getById: async (id) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'Category not found',
                    data: null
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error fetching category:', error);
            throw error;
        }
    },

    // Update category
    update: async (id, categoryData) => {
        try {
            const { name, description, status } = categoryData;
            const updates = [];
            const params = [];

            if (name !== undefined) {
                updates.push('name = ?');
                params.push(name.trim());
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description?.trim() || null);
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
                `UPDATE categories SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`,
                params
            );

            if (result.affectedRows === 0) {
                return {
                    success: false,
                    message: 'Category not found'
                };
            }

            // Fetch the updated category
            const [rows] = await db.query(
                'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            return {
                success: true,
                message: 'Category updated successfully',
                data: rows[0]
            };
        } catch (error) {
            console.error('Error updating category:', error);
            // Handle duplicate entry error
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Category name already exists');
            }
            throw error;
        }
    },

    // Delete category
    delete: async (id) => {
        try {
            // Check if category is associated with any products (excluding soft-deleted products)
            const [products] = await db.query(
                'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted_at IS NULL',
                [id]
            );

            if (products[0].count > 0) {
                return {
                    success: false,
                    message: 'Category is associated with existing products and cannot be deleted'
                };
            }

            // Check if category exists and is not already deleted
            const [existing] = await db.query(
                'SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (existing.length === 0) {
                return {
                    success: false,
                    message: 'Category not found'
                };
            }

            // Soft delete: set deleted_at timestamp
            const [result] = await db.query(
                'UPDATE categories SET deleted_at = NOW() WHERE id = ?',
                [id]
            );

            return {
                success: true,
                message: 'Category deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
};

export default Category;

