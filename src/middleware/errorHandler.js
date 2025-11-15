export const errorHandler = (err, req, res, next) => {
    // Only log full error details for non-operational errors or in development
    // Operational errors (like invalid credentials) are expected and shouldn't clutter logs
    if (!err.isOperational || process.env.NODE_ENV === 'development') {
        console.error('Error:', err.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('Stack:', err.stack);
        }
    }

    // Validation errors from express-validator
    if (err.name === 'ValidationError' || err.array) {
        const errors = err.array ? err.array() : (err.errors || []);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.map(e => ({
                field: e.param || e.path,
                message: e.msg,
                value: e.value
            }))
        });
    }

    // Database errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry. This record already exists.',
            error: err.message
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(404).json({
            success: false,
            message: 'Referenced record not found.',
            error: err.message
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // AppError (custom errors) - handle gracefully without crashing
    if (err.isOperational) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }

    // Default error
    res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

