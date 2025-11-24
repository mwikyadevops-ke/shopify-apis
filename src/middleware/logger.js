import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Request logger middleware
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log request details
    const logData = {
        timestamp,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id || null,
        userEmail: req.user?.email || null
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url} - IP: ${req.ip}`);
    }

    // Log to file
    const logFile = path.join(logsDir, `requests-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logData) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const responseLog = {
            ...logData,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        };

        const responseLogLine = JSON.stringify(responseLog) + '\n';
        const responseLogFile = path.join(logsDir, `responses-${new Date().toISOString().split('T')[0]}.log`);
        
        fs.appendFile(responseLogFile, responseLogLine, (err) => {
            if (err) {
                console.error('Error writing to response log file:', err);
            }
        });

        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} - ${duration}ms`);
        }
    });

    next();
};

// Error logger
export const errorLogger = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const errorLog = {
        timestamp,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || null,
        error: {
            message: err.message,
            statusCode: err.statusCode || 500,
            // Only include stack trace for non-operational errors or in development
            ...((!err.isOperational || process.env.NODE_ENV === 'development') && { stack: err.stack })
        }
    };

    // Only log operational errors (like invalid credentials) at info level, not error level
    // These are expected business logic errors, not system failures
    if (err.isOperational) {
        // Log operational errors quietly - these are expected and don't indicate system problems
        // Only log in development mode, and use console.log instead of console.error
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${timestamp}] ${err.statusCode || 500} ${req.method} ${req.originalUrl || req.url}: ${err.message}`);
        }
        // Don't log stack traces for operational errors - they're expected business logic errors
    } else {
        // Log non-operational errors (actual system errors) at error level
        console.error(`[${timestamp}] ERROR:`, err.message);
        if (process.env.NODE_ENV === 'development') {
            console.error('Stack:', err.stack);
        }
    }
    
    // Log to file
    const errorLogFile = path.join(logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
    const errorLogLine = JSON.stringify(errorLog) + '\n';
    
    fs.appendFile(errorLogFile, errorLogLine, (err) => {
        if (err) {
            console.error('Error writing to error log file:', err);
        }
    });

    next(err);
};

// Action logger (for important actions like sales, stock changes, etc.)
export const actionLogger = (action) => {
    return (req, res, next) => {
        const timestamp = new Date().toISOString();
        const actionLog = {
            timestamp,
            action,
            method: req.method,
            url: req.originalUrl || req.url,
            userId: req.user?.id || null,
            userEmail: req.user?.email || null,
            userRole: req.user?.role || null,
            ip: req.ip || req.connection.remoteAddress,
            body: req.body
        };

        // Log to file
        const actionLogFile = path.join(logsDir, `actions-${new Date().toISOString().split('T')[0]}.log`);
        const actionLogLine = JSON.stringify(actionLog) + '\n';
        
        fs.appendFile(actionLogFile, actionLogLine, (err) => {
            if (err) {
                console.error('Error writing to action log file:', err);
            }
        });

        next();
    };
};


