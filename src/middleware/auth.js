import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

        if (!token) {
            throw new AppError('Authentication required', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Ensure this is an access token, not a refresh token
        if (decoded.type && decoded.type !== 'access') {
            throw new AppError('Invalid token type. Access token required', 401);
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Invalid token', 401);
        }
        next(error);
    }
};

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            throw new AppError('Insufficient permissions', 403);
        }

        next();
    };
};

