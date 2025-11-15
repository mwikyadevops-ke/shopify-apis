# Shopify App APIs

A comprehensive REST API for managing shops, users, stock, sales, payments, and reporting.

## Features

- **Shop Management**: Create, read, update, and delete shops
- **User Management**: User registration, authentication, and role-based access control
- **Product Management**: Manage products with categories, pricing, and inventory
- **Stock Management**: Add, reduce, and adjust stock levels with transaction tracking
- **Stock Transfers**: Transfer stock between shops with status tracking
- **Sales Management**: Create sales, track items, and manage customer information
- **Payment Processing**: Handle multiple payment methods and track payments
- **Reporting**: Generate sales, stock, product, and payment reports
- **Dashboard**: Get summary statistics for quick insights

## Tech Stack

- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcryptjs for password hashing

## Installation

1. Clone the repository
```bash
cd C:\projects\shopifya-app-apis
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Update `.env` file with your database credentials and other configuration

5. Set up the database
```bash
npm run setup-db
```

6. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/users/login` - Login user (returns accessToken and sets refreshToken as httpOnly cookie)
- `POST /api/users/refresh-token` - Refresh access token using refresh token

### Shops
- `POST /api/shops` - Create shop (Admin/Manager)
- `GET /api/shops` - Get all shops
- `GET /api/shops/:id` - Get shop by ID
- `PUT /api/shops/:id` - Update shop (Admin/Manager)
- `DELETE /api/shops/:id` - Delete shop (Admin)

### Users
- `POST /api/users` - Create user (Admin/Manager)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (Admin/Manager)
- `DELETE /api/users/:id` - Delete user (Admin)

### Products
- `POST /api/products` - Create product (Admin/Manager)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product (Admin/Manager)
- `DELETE /api/products/:id` - Delete product (Admin)

### Stock
- `POST /api/stock/add` - Add stock (Admin/Manager/Staff)
- `POST /api/stock/reduce` - Reduce stock (Admin/Manager/Staff)
- `POST /api/stock/adjust` - Adjust stock (Admin/Manager)
- `GET /api/stock/shop/:shopId` - Get stock by shop
- `GET /api/stock/shop/:shopId/product/:productId` - Get stock by product
- `GET /api/stock/transactions` - Get stock transactions

### Stock Transfers
- `POST /api/stock-transfers` - Create transfer (Admin/Manager)
- `GET /api/stock-transfers` - Get all transfers
- `GET /api/stock-transfers/:id` - Get transfer by ID
- `PUT /api/stock-transfers/:id/complete` - Complete transfer (Admin/Manager/Staff)
- `PUT /api/stock-transfers/:id/cancel` - Cancel transfer (Admin/Manager)

### Sales
- `POST /api/sales` - Create sale (Admin/Manager/Cashier/Staff)
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID
- `PUT /api/sales/:id/cancel` - Cancel sale (Admin/Manager)

### Payments
- `POST /api/payments` - Create payment (Admin/Manager/Cashier/Staff)
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id/refund` - Refund payment (Admin/Manager)

### Quotations
- `POST /api/quotations` - Create quotation (Admin/Manager)
- `GET /api/quotations` - Get all quotations
- `GET /api/quotations/:id` - Get quotation by ID
- `PUT /api/quotations/:id` - Update quotation (Admin/Manager)
- `PUT /api/quotations/:id/send` - Send quotation to supplier via email (Admin/Manager)
- `DELETE /api/quotations/:id` - Delete quotation (Admin/Manager)

### Reports
- `GET /api/reports/sales` - Get sales report
- `GET /api/reports/stock` - Get stock report
- `GET /api/reports/products` - Get product sales report
- `GET /api/reports/payments` - Get payment report
- `GET /api/reports/dashboard` - Get dashboard summary

## Authentication

Most endpoints require authentication. Include the JWT access token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

### Token Refresh System

The API uses a dual-token system for enhanced security:

- **Access Token**: Short-lived (default: 1 hour), used for API requests
- **Refresh Token**: Long-lived (default: 7 days), used to obtain new access tokens

**How it works:**

1. **Login** (`POST /api/users/login`):
   - Returns `accessToken` in response body
   - Sets `refreshToken` as httpOnly cookie (more secure)
   - Store the `accessToken` in your frontend (localStorage/memory)

2. **Refresh Token** (`POST /api/users/refresh-token`):
   - Send refresh token in request body or it will be read from cookie automatically
   - Returns new `accessToken` and new `refreshToken`
   - Use this when access token expires (401 error)

3. **Token Rotation**: Each refresh generates a new refresh token for better security

**Environment Variables:**
```env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key  # Optional, defaults to JWT_SECRET
JWT_EXPIRES_IN=1h                           # Access token expiry (default: 1h)
JWT_REFRESH_EXPIRES_IN=7d                   # Refresh token expiry (default: 7d)
```

## User Roles

- **admin**: Full access to all features
- **manager**: Can manage shops, users, products, stock, sales, and payments
- **staff**: Can view and manage stock, create sales, and process payments
- **cashier**: Can create sales and process payments

## Error Handling

The API uses standardized error responses:

```json
{
    "success": false,
    "message": "Error message",
    "error": "Detailed error information (in development)"
}
```

## Database Schema

The database includes the following tables:
- shops
- users
- products
- stock
- stock_transactions
- stock_transfers
- sales
- sale_items
- payments
- reports

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Set up database
npm run setup-db
```

## License

ISC

