import { createPool } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
    // Create pool without database first
    const pool = createPool(false);
    const dbName = process.env.DB_NAME || 'shopifya_db';
    
    try {
        console.log('Setting up database tables...');

        // Create database if it doesn't exist
        await pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' created or already exists`);
        
        // Switch to the database
        await pool.query(`USE \`${dbName}\``);
        
        // Now create pool with database
        const db = createPool(true);

        // Shops table
        await db.query(`
            CREATE TABLE IF NOT EXISTS shops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                phone VARCHAR(50),
                email VARCHAR(255),
                status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,
                INDEX idx_deleted_at (deleted_at)
            )
        `);
        console.log('✅ Shops table created');

        // Users table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                phone VARCHAR(50),
                role ENUM('admin', 'manager', 'staff', 'cashier') DEFAULT 'staff',
                shop_id INT,
                status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL,
                INDEX idx_deleted_at (deleted_at)
            )
        `);
        console.log('✅ Users table created');

        // Categories table
        await db.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,
                INDEX idx_status (status),
                INDEX idx_name (name),
                INDEX idx_deleted_at (deleted_at)
            )
        `);
        console.log('✅ Categories table created');

        // Products table
        await db.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(100) UNIQUE,
                description TEXT,
                category_id INT NULL,
                default_min_stock_level DECIMAL(10, 2) DEFAULT 0.00,
                barcode VARCHAR(100),
                status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL DEFAULT NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                INDEX idx_category_id (category_id),
                INDEX idx_deleted_at (deleted_at)
            )
        `);
        console.log('✅ Products table created');

        // Stock table (inventory per shop)
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                min_stock_level DECIMAL(10, 2) DEFAULT 0.00,
                max_stock_level DECIMAL(10, 2) DEFAULT 0.00,
                buy_price DECIMAL(10, 2) NULL,
                sale_price DECIMAL(10, 2) NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE KEY unique_shop_product (shop_id, product_id)
            )
        `);
        console.log('✅ Stock table created');

        // Stock transactions table (for tracking all stock movements)
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT NOT NULL,
                product_id INT NOT NULL,
                transaction_type ENUM('sale', 'purchase', 'transfer_in', 'transfer_out', 'adjustment', 'return') NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                reference_id INT NULL,
                reference_type VARCHAR(50) NULL,
                notes TEXT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Stock transactions table created');

        // Stock transfers table
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_transfers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transfer_number VARCHAR(50) UNIQUE NOT NULL,
                from_shop_id INT NOT NULL,
                to_shop_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
                notes TEXT,
                created_by INT,
                received_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (from_shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (to_shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Stock transfers table created');

        // Sales table
        await db.query(`
            CREATE TABLE IF NOT EXISTS sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_number VARCHAR(50) UNIQUE NOT NULL,
                shop_id INT NOT NULL,
                customer_name VARCHAR(255),
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                notes TEXT,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Sales table created');

        // Sale items table
        await db.query(`
            CREATE TABLE IF NOT EXISTS sale_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                discount DECIMAL(10, 2) DEFAULT 0.00,
                total_price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Sale items table created');

        // Payments table
        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT NOT NULL,
                payment_method ENUM('cash', 'card', 'mobile_money', 'bank_transfer', 'credit') NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                reference_number VARCHAR(100),
                status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_by INT,
                notes TEXT,
                FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Payments table created');

        // Quotations table
        await db.query(`
            CREATE TABLE IF NOT EXISTS quotations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quotation_number VARCHAR(50) UNIQUE NOT NULL,
                supplier_name VARCHAR(255) NOT NULL,
                supplier_email VARCHAR(255),
                supplier_phone VARCHAR(50),
                supplier_address TEXT,
                shop_id INT NULL,
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled') DEFAULT 'draft',
                valid_until DATE,
                quotation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                notes TEXT,
                deleted_at TIMESTAMP NULL DEFAULT NULL,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_status (status),
                INDEX idx_quotation_date (quotation_date),
                INDEX idx_deleted_at (deleted_at)
            )
        `);
        console.log('✅ Quotations table created');

        // Quotation items table (items are not linked to products - can be any items)
        await db.query(`
            CREATE TABLE IF NOT EXISTS quotation_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quotation_id INT NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                item_description TEXT,
                item_sku VARCHAR(100),
                quantity DECIMAL(10, 2) NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                discount DECIMAL(10, 2) DEFAULT 0.00,
                total_price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Quotation items table created');

        // Reports table (for storing generated reports metadata)
        await db.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                report_type VARCHAR(50) NOT NULL,
                shop_id INT NULL,
                start_date DATE,
                end_date DATE,
                generated_by INT,
                file_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL,
                FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Reports table created');

        console.log('🎉 Database setup completed successfully!');
        await pool.end();
        await db.end();
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        await pool.end();
        process.exit(1);
    }
    process.exit(0);
};

setupDatabase();

