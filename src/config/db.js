import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '@Devtech@21',
    database: process.env.DB_NAME || 'shopifya_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Create pool without database for setup script
const createPool = (includeDatabase = true) => {
    const config = { ...dbConfig };
    if (!includeDatabase) {
        delete config.database;
    }
    return mysql.createPool(config);
};

const pool = createPool();

// Test connection (async, non-blocking)
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('💡 Make sure MySQL is running and database credentials are correct');
        console.log('💡 Run "npm run setup-db" to create the database and tables');
    }
};

testConnection();

export default pool;
export { createPool };

