import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const migratePasswordReset = async () => {
    try {
        console.log('Adding password reset fields to users table...');

        // Check if columns already exist
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);

        // Add password_reset_token if it doesn't exist
        if (!existingColumns.includes('password_reset_token')) {
            await db.query(`
                ALTER TABLE users 
                ADD COLUMN password_reset_token VARCHAR(255) NULL,
                ADD INDEX idx_password_reset_token (password_reset_token)
            `);
            console.log('✅ Added password_reset_token column');
        } else {
            console.log('ℹ️  password_reset_token column already exists');
        }

        // Add password_reset_expires if it doesn't exist
        if (!existingColumns.includes('password_reset_expires')) {
            await db.query(`
                ALTER TABLE users 
                ADD COLUMN password_reset_expires TIMESTAMP NULL
            `);
            console.log('✅ Added password_reset_expires column');
        } else {
            console.log('ℹ️  password_reset_expires column already exists');
        }

        console.log('✅ Password reset migration completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error migrating password reset fields:', error);
        process.exit(1);
    }
};

migratePasswordReset();

