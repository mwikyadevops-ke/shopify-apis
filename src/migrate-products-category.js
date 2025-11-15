import { createPool } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateProductsCategory = async () => {
    const db = createPool(true);
    
    try {
        console.log('🔄 Starting products table migration...');

        // Check if category_id column already exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'category_id'
        `);

        if (columns.length > 0) {
            console.log('✅ category_id column already exists. Migration not needed.');
            await db.end();
            process.exit(0);
        }

        // Check if old category column exists
        const [oldColumns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'category'
        `);

        console.log('📋 Step 1: Adding category_id column...');
        await db.query(`
            ALTER TABLE products 
            ADD COLUMN category_id INT NULL AFTER description
        `);
        console.log('✅ category_id column added');

        console.log('📋 Step 2: Adding foreign key constraint...');
        try {
            await db.query(`
                ALTER TABLE products 
                ADD CONSTRAINT fk_products_category 
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            `);
            console.log('✅ Foreign key constraint added');
        } catch (error) {
            if (error.code === 'ER_DUP_KEY' || error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Foreign key constraint already exists, skipping...');
            } else {
                throw error;
            }
        }

        console.log('📋 Step 3: Adding index on category_id...');
        try {
            await db.query(`
                CREATE INDEX idx_category_id ON products(category_id)
            `);
            console.log('✅ Index created');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index already exists, skipping...');
            } else {
                throw error;
            }
        }

        // If old category column exists, we can optionally migrate data
        // For now, we'll just keep both columns (old category as backup)
        // You can manually migrate data if needed:
        // UPDATE products p 
        // SET p.category_id = (SELECT id FROM categories WHERE name = p.category LIMIT 1)
        // WHERE p.category IS NOT NULL;

        if (oldColumns.length > 0) {
            console.log('⚠️  Note: Old "category" column still exists.');
            console.log('   You can manually migrate data from category (string) to category_id (int) if needed.');
            console.log('   Or drop the old column after migration: ALTER TABLE products DROP COLUMN category;');
        }

        console.log('🎉 Migration completed successfully!');
        await db.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await db.end();
        process.exit(1);
    }
};

migrateProductsCategory();

