import { createPool } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateProductsMinStock = async () => {
    const db = createPool(true);
    
    try {
        console.log('🔄 Starting products min_stock_level migration...');

        // Check if default_min_stock_level column already exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'default_min_stock_level'
        `);

        if (columns.length > 0) {
            console.log('✅ default_min_stock_level column already exists. Migration not needed.');
            await db.end();
            process.exit(0);
        }

        console.log('📋 Adding default_min_stock_level column to products table...');
        await db.query(`
            ALTER TABLE products 
            ADD COLUMN default_min_stock_level DECIMAL(10, 2) DEFAULT 0.00 AFTER cost_price
        `);
        console.log('✅ default_min_stock_level column added');

        console.log('🎉 Migration completed successfully!');
        await db.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await db.end();
        process.exit(1);
    }
};

migrateProductsMinStock();

