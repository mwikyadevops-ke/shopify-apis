import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const User = {
    // Create a new user
    create: async (userData) => {
        try {
            const { username, email, password, full_name, phone, role = 'staff', shop_id, status = 'active' } = userData;
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await db.query(
                `INSERT INTO users (username, email, password, full_name, phone, role, shop_id, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [username, email, hashedPassword, full_name, phone, role, shop_id, status]
            );

            return {
                success: true,
                message: 'User created successfully',
                data: { id: result.insertId, username, email, full_name, phone, role, shop_id, status }
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // Get all users with pagination
    getAll: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM users u
                WHERE u.deleted_at IS NULL
            `;
            let dataQuery = `
                SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.shop_id, 
                       u.status, u.created_at, s.name as shop_name
                FROM users u
                LEFT JOIN shops s ON u.shop_id = s.id
                WHERE u.deleted_at IS NULL
            `;
            const params = [];

            if (filters.shop_id) {
                countQuery += ' AND u.shop_id = ?';
                dataQuery += ' AND u.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.role) {
                countQuery += ' AND u.role = ?';
                dataQuery += ' AND u.role = ?';
                params.push(filters.role);
            }

            if (filters.status) {
                countQuery += ' AND u.status = ?';
                dataQuery += ' AND u.status = ?';
                params.push(filters.status);
            }

            dataQuery += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
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
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Get user by ID
    getById: async (id) => {
        try {
            const [rows] = await db.query(
                `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.shop_id, 
                        u.status, u.created_at, s.name as shop_name
                 FROM users u
                 LEFT JOIN shops s ON u.shop_id = s.id
                 WHERE u.id = ? AND u.deleted_at IS NULL`,
                [id]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'User not found',
                    data: null
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },

    // Get user by email
    getByEmail: async (email) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
                [email]
            );

            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'User not found',
                    data: null
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('Error fetching user by email:', error);
            throw error;
        }
    },

    // Login user
    login: async (email, password) => {
        try {
            const userResult = await User.getByEmail(email);
            
            if (!userResult.success) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            const user = userResult.data;

            // Check if user is active
            if (user.status !== 'active') {
                return {
                    success: false,
                    message: 'User account is not active'
                };
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            // Validate JWT secrets are set
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not configured. Please set it in your .env file.');
            }

            const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
            const accessTokenExpiry = process.env.JWT_EXPIRES_IN || '1h';
            const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

            // Generate access token (short-lived)
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role, shop_id: user.shop_id, type: 'access' },
                process.env.JWT_SECRET,
                { expiresIn: accessTokenExpiry }
            );

            // Generate refresh token (long-lived)
            const refreshToken = jwt.sign(
                { id: user.id, email: user.email, type: 'refresh' },
                refreshSecret,
                { expiresIn: refreshTokenExpiry }
            );

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: userWithoutPassword,
                    accessToken,
                    refreshToken
                }
            };
        } catch (error) {
            console.error('Error logging in user:', error);
            throw error;
        }
    },

    // Refresh access token using refresh token
    refreshToken: async (refreshToken) => {
        try {
            if (!refreshToken) {
                return {
                    success: false,
                    message: 'Refresh token is required'
                };
            }

            // Verify refresh token
            const refreshSecret = process.env.JWT_REFRESH_SECRET;
            let decoded;
            
            try {
                decoded = jwt.verify(refreshToken, refreshSecret);
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    return {
                        success: false,
                        message: 'Refresh token expired'
                    };
                }
                if (error.name === 'JsonWebTokenError') {
                    return {
                        success: false,
                        message: 'Invalid refresh token'
                    };
                }
                throw error;
            }

            // Check if token type is refresh
            if (decoded.type !== 'refresh') {
                return {
                    success: false,
                    message: 'Invalid token type'
                };
            }

            // Get user to verify they still exist and are active
            const userResult = await User.getById(decoded.id);
            
            if (!userResult.success) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            const user = userResult.data;

            // Check if user is active
            if (user.status !== 'active') {
                return {
                    success: false,
                    message: 'User account is not active'
                };
            }

            // Validate JWT secrets are set
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not configured. Please set it in your .env file.');
            }

            const accessTokenExpiry = process.env.JWT_EXPIRES_IN || '1h';
            const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

            // Generate new access token
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role, shop_id: user.shop_id, type: 'access' },
                process.env.JWT_SECRET,
                { expiresIn: accessTokenExpiry }
            );

            // Optionally generate new refresh token (token rotation)
            const newRefreshToken = jwt.sign(
                { id: user.id, email: user.email, type: 'refresh' },
                refreshSecret,
                { expiresIn: refreshTokenExpiry }
            );

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            return {
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    user: userWithoutPassword,
                    accessToken,
                    refreshToken: newRefreshToken
                }
            };
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    },

    // Update user
    update: async (id, userData) => {
        try {
            const { username, email, full_name, phone, role, shop_id, status, password } = userData;
            const updates = [];
            const params = [];

            if (username !== undefined) {
                updates.push('username = ?');
                params.push(username);
            }
            if (email !== undefined) {
                updates.push('email = ?');
                params.push(email);
            }
            if (full_name !== undefined) {
                updates.push('full_name = ?');
                params.push(full_name);
            }
            if (phone !== undefined) {
                updates.push('phone = ?');
                params.push(phone);
            }
            if (role !== undefined) {
                updates.push('role = ?');
                params.push(role);
            }
            if (shop_id !== undefined) {
                updates.push('shop_id = ?');
                params.push(shop_id);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (password !== undefined) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push('password = ?');
                params.push(hashedPassword);
            }

            if (updates.length === 0) {
                return {
                    success: false,
                    message: 'No fields to update'
                };
            }

            params.push(id);

            const [result] = await db.query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
                params
            );

            if (result.affectedRows === 0) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            return {
                success: true,
                message: 'User updated successfully'
            };
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // Delete user (soft delete)
    delete: async (id) => {
        try {
            // Check if user exists and is not already deleted
            const [existing] = await db.query(
                'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (existing.length === 0) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            // Soft delete: set deleted_at timestamp
            const [result] = await db.query(
                'UPDATE users SET deleted_at = NOW() WHERE id = ?',
                [id]
            );

            return {
                success: true,
                message: 'User deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
};

export default User;

