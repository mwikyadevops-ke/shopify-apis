// CORS configuration - read origins only from .env
const corsOptions = {
    credentials: true,
    optionsSuccessStatus: 200
};

if (process.env.CORS_ORIGIN) {
    // Support comma-separated origins from .env
    const origins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0);
    corsOptions.origin = (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        if (origins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    };
} else {
    // If CORS_ORIGIN is not set, allow all origins (with warning in production)
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  CORS_ORIGIN not set in production. Allowing all origins. Consider setting CORS_ORIGIN in .env for security.');
    }
    corsOptions.origin = true; // Allow all origins
}

export default corsOptions;
