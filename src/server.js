import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import { validateEnv } from './config/validateEnv.js';

// Import routes
import shopRoutes from './routes/shopRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import stockTransferRoutes from './routes/stockTransferRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import corsOptions from './config/corsOptions.js';

// Load environment variables
dotenv.config();
// Validate required environment variables
try {
    validateEnv();
} catch (error) {
    console.error('\n❌ Environment validation failed:', error.message);
    console.error('\n💡 Please create a .env file with the required variables.');
    console.error('💡 You can copy .env.example to .env and update the values.\n');
    process.exit(1);
}

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging (before routes)
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/stock-transfers', stockTransferRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error logging middleware (before error handler)
app.use(errorLogger);

// Error handler (must be last)
app.use(errorHandler);

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
    // The server should continue running
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Log the error but don't crash immediately
    // In production, you might want to exit gracefully after logging
    if (process.env.NODE_ENV === 'production') {
        console.error('Fatal error occurred. Server will exit.');
        process.exit(1);
    }
});

// Start server
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

export default app;

