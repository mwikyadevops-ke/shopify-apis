import dotenv from 'dotenv';

dotenv.config();

/**
 * Validate required environment variables
 * Throws error if required variables are missing
 */
export const validateEnv = () => {
    const required = [
        'JWT_SECRET',
        'DB_HOST',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME'
    ];

    const missing = [];

    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n💡 Please check your .env file and ensure all required variables are set.');
        console.error('💡 You can copy .env.example to .env and update the values.');
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Set defaults for optional variables
    if (!process.env.JWT_REFRESH_SECRET) {
        process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
        console.log('⚠️  JWT_REFRESH_SECRET not set, using JWT_SECRET as fallback');
    }

    if (!process.env.JWT_EXPIRES_IN) {
        process.env.JWT_EXPIRES_IN = '1h';
        console.log('⚠️  JWT_EXPIRES_IN not set, using default: 1h');
    }

    if (!process.env.JWT_REFRESH_EXPIRES_IN) {
        process.env.JWT_REFRESH_EXPIRES_IN = '7d';
        console.log('⚠️  JWT_REFRESH_EXPIRES_IN not set, using default: 7d');
    }

    console.log('✅ Environment variables validated');
};

