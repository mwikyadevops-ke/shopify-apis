import { createPool } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateSoftDelete = async () => {
    const db = createPool(true);
    
    try {
        console.log('🔄 Starting soft delete migration...');

        const tables = ['users', 'shops', 'categories', 'products', 'quotations'];

        for (const table of tables) {
            // Check if deleted_at column already exists
            const [columns] = await db.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ? 
                AND COLUMN_NAME = 'deleted_at'
            `, [table]);

            if (columns.length > 0) {
                console.log(`✅ deleted_at column already exists in ${table}. Skipping...`);
                continue;
            }

            console.log(`📋 Adding deleted_at column to ${table}...`);
            await db.query(`
                ALTER TABLE ${table} 
                ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL
            `);
            console.log(`✅ deleted_at column added to ${table}`);

            // Add index for better query performance
            try {
                await db.query(`
                    CREATE INDEX idx_${table}_deleted_at ON ${table}(deleted_at)
                `);
                console.log(`✅ Index created on ${table}.deleted_at`);
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log(`⚠️  Index already exists on ${table}.deleted_at, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        console.log('🎉 Soft delete migration completed successfully!');
        console.log('💡 All delete operations will now use soft delete (set deleted_at instead of removing records)');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await db.end();
        process.exit(0);
    }
};

migrateSoftDelete();

