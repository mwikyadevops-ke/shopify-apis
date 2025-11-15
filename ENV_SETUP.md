# Environment Variables Setup

## Required Variables

Add these to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-database-password
DB_NAME=shopifya_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
# Option 1: Single origin
CORS_ORIGIN=http://localhost:3000

# Option 2: Multiple origins (comma-separated, no spaces after commas)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:8080

# Option 3: Leave empty in development to allow all localhost origins
# CORS_ORIGIN=

# SMTP Configuration (for email functionality)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Shopify App

# Server Configuration
NODE_ENV=development
PORT=8000
```

## CORS Origins

For the CORS_ORIGIN variable, you can:

1. **Set specific origins** (recommended for production):
   ```env
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173
   ```

2. **Leave it empty** (development only - allows all localhost origins):
   ```env
   # CORS_ORIGIN=
   ```

3. **Single origin**:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

## Quick Setup

1. Open your `.env` file
2. Add or update the `CORS_ORIGIN` line with your frontend URL(s)
3. Save the file
4. Restart your server

## Common Frontend Ports

- React (Create React App): `http://localhost:3000`
- Vite: `http://localhost:5173`
- Next.js: `http://localhost:3000`
- Vue CLI: `http://localhost:8080`
- Angular: `http://localhost:4200`

