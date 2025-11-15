import { createPool } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const migratePricingToStock = async () => {
    const db = createPool(true);
    
    try {
        console.log('🔄 Starting pricing migration from products to stock...');

        // Step 1: Add buy_price and sale_price to stock table
        console.log('📋 Step 1: Adding buy_price and sale_price to stock table...');
        
        // Check if columns already exist
        const [stockColumns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'stock' 
            AND COLUMN_NAME IN ('buy_price', 'sale_price')
        `);

        const existingColumns = stockColumns.map(col => col.COLUMN_NAME);
        
        if (!existingColumns.includes('buy_price')) {
            await db.query(`
                ALTER TABLE stock 
                ADD COLUMN buy_price DECIMAL(10, 2) NULL AFTER max_stock_level
            `);
            console.log('✅ buy_price column added to stock table');
        } else {
            console.log('⚠️  buy_price column already exists');
        }

        if (!existingColumns.includes('sale_price')) {
            await db.query(`
                ALTER TABLE stock 
                ADD COLUMN sale_price DECIMAL(10, 2) NULL AFTER buy_price
            `);
            console.log('✅ sale_price column added to stock table');
        } else {
            console.log('⚠️  sale_price column already exists');
        }

        // Step 2: Migrate existing data (if any)
        // Copy cost_price to buy_price and unit_price to sale_price for existing stock
        console.log('📋 Step 2: Migrating existing pricing data...');
        const [stockRows] = await db.query(`
            SELECT s.id, s.product_id, p.cost_price, p.unit_price
            FROM stock s
            JOIN products p ON s.product_id = p.id
            WHERE s.buy_price IS NULL OR s.sale_price IS NULL
        `);

        if (stockRows.length > 0) {
            for (const row of stockRows) {
                await db.query(`
                    UPDATE stock 
                    SET buy_price = COALESCE(buy_price, ?), 
                        sale_price = COALESCE(sale_price, ?)
                    WHERE id = ?
                `, [row.cost_price || 0, row.unit_price || 0, row.id]);
            }
            console.log(`✅ Migrated pricing for ${stockRows.length} stock entries`);
        } else {
            console.log('✅ No stock entries to migrate');
        }

        // Step 3: Remove unit_price and cost_price from products table
        console.log('📋 Step 3: Removing unit_price and cost_price from products table...');
        
        const [productColumns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME IN ('unit_price', 'cost_price')
        `);

        if (productColumns.some(col => col.COLUMN_NAME === 'unit_price')) {
            await db.query(`ALTER TABLE products DROP COLUMN unit_price`);
            console.log('✅ Removed unit_price from products table');
        } else {
            console.log('⚠️  unit_price column does not exist');
        }

        if (productColumns.some(col => col.COLUMN_NAME === 'cost_price')) {
            await db.query(`ALTER TABLE products DROP COLUMN cost_price`);
            console.log('✅ Removed cost_price from products table');
        } else {
            console.log('⚠️  cost_price column does not exist');
        }

        console.log('🎉 Migration completed successfully!');
        console.log('⚠️  Note: Make sure to update your API calls to include buy_price and sale_price when adding stock.');
        await db.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await db.end();
        process.exit(1);
    }
};

migratePricingToStock();

