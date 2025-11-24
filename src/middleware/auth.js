import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * Verify access token and guard protected routes.
 * Handles expired tokens gracefully so the server doesn't crash
 * and the frontend can trigger the refresh-token flow.
 */
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = bearerToken || req.cookies?.accessToken || req.cookies?.token;

    if (!token) {
        return next(new AppError('Authentication required', 401));
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                // Flag for downstream handlers/frontends to know a refresh is needed
                req.tokenExpired = true;
                return res.status(401).json({
                    success: false,
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            if (err.name === 'JsonWebTokenError') {
                return next(new AppError('Invalid token', 401));
            }

            return next(err);
        }

        if (decoded.type && decoded.type !== 'access') {
            return next(new AppError('Invalid token type. Access token required', 401));
        }

        req.user = decoded;
        next();
    });
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

