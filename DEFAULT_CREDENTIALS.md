# Default Login Credentials

After running the seed script, you can use these credentials to log in:

## Admin User

- **Email:** `admin@shopifya.com`
- **Password:** `admin123`
- **Username:** `admin`
- **Role:** `admin`

## How to Seed the Database

1. First, make sure the database is set up:
   ```bash
   npm run setup-db
   ```

2. Then, seed the database with default data:
   ```bash
   npm run seed-db
   ```

## Login Endpoint

Use the following endpoint to log in:

```
POST /api/users/login
Content-Type: application/json

{
  "email": "admin@shopifya.com",
  "password": "admin123"
}
```

## Response

On successful login, you'll receive:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@shopifya.com",
      "full_name": "System Administrator",
      "role": "admin",
      "shop_id": 1,
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⚠️ IMPORTANT:** Change the default password after first login for security!

