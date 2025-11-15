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

// Middleware
// Configure Helmet to work with CORS
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    credentials: true,
    optionsSuccessStatus: 200
};

// Handle multiple origins or allow all in development
if (process.env.CORS_ORIGIN) {
    // Support comma-separated origins
    const origins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    corsOptions.origin = (origin, callback) => {
        if (!origin || origins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    };
} else if (process.env.NODE_ENV === 'production') {
    // In production, require CORS_ORIGIN to be set
    corsOptions.origin = false; // This will cause CORS to reject all origins
    console.warn('⚠️  CORS_ORIGIN not set in production. CORS requests will be blocked.');
} else {
    // Development: allow common localhost ports
    corsOptions.origin = (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        
        // Allow common development origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:8080',
            'http://localhost:8081',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:8080'
        ];
        
        if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS: Origin ${origin} not in allowed list. Consider setting CORS_ORIGIN in .env`);
            callback(null, true); // Still allow in development for flexibility
        }
    };
}

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

// Start server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

export default app;

