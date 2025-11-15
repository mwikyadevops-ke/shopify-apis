import { createPool } from './config/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
    const db = createPool(true);
    const dbName = process.env.DB_NAME || 'shopifya_db';
    
    try {
        console.log('🌱 Seeding database with default data...');

        // Default shop data
        const defaultShop = {
            name: 'Main Store',
            location: 'Head Office',
            phone: '+1234567890',
            email: 'mainstore@shopifya.com',
            status: 'active'
        };

        // Check if shop already exists
        const [existingShops] = await db.query(
            'SELECT id FROM shops WHERE name = ?',
            [defaultShop.name]
        );

        let shopId;
        if (existingShops.length > 0) {
            shopId = existingShops[0].id;
            console.log(`✅ Shop '${defaultShop.name}' already exists (ID: ${shopId})`);
        } else {
            // Create default shop
            const [shopResult] = await db.query(
                `INSERT INTO shops (name, location, phone, email, status) 
                 VALUES (?, ?, ?, ?, ?)`,
                [defaultShop.name, defaultShop.location, defaultShop.phone, defaultShop.email, defaultShop.status]
            );
            shopId = shopResult.insertId;
            console.log(`✅ Created default shop: ${defaultShop.name} (ID: ${shopId})`);
        }

        // Default admin user data
        const defaultAdmin = {
            username: 'admin',
            email: 'admin@shopifya.com',
            password: 'admin123', // This will be hashed
            full_name: 'System Administrator',
            phone: '+1234567890',
            role: 'admin',
            shop_id: shopId,
            status: 'active'
        };

        // Check if admin user already exists
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [defaultAdmin.email, defaultAdmin.username]
        );

        if (existingUsers.length > 0) {
            console.log(`✅ Admin user already exists`);
            console.log('\n📋 Default Login Credentials:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`   Email:    ${defaultAdmin.email}`);
            console.log(`   Password: ${defaultAdmin.password}`);
            console.log(`   Role:     ${defaultAdmin.role}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
            // Hash password
            const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

            // Create default admin user
            await db.query(
                `INSERT INTO users (username, email, password, full_name, phone, role, shop_id, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    defaultAdmin.username,
                    defaultAdmin.email,
                    hashedPassword,
                    defaultAdmin.full_name,
                    defaultAdmin.phone,
                    defaultAdmin.role,
                    defaultAdmin.shop_id,
                    defaultAdmin.status
                ]
            );
            console.log(`✅ Created default admin user: ${defaultAdmin.username}`);

            console.log('\n📋 Default Login Credentials:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`   Email:    ${defaultAdmin.email}`);
            console.log(`   Password: ${defaultAdmin.password}`);
            console.log(`   Username: ${defaultAdmin.username}`);
            console.log(`   Role:     ${defaultAdmin.role}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
        }

        console.log('\n🎉 Database seeding completed successfully!');
        await db.end();
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        await db.end();
        process.exit(1);
    }
    process.exit(0);
};

seedDatabase();

