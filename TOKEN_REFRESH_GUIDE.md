# Token Refresh Guide

This guide explains how to use the token refresh functionality in the API.

## Overview

The API implements a dual-token authentication system:
- **Access Token**: Short-lived token (default: 1 hour) for API requests
- **Refresh Token**: Long-lived token (default: 7 days) for obtaining new access tokens

## How It Works

### 1. Login Flow

When a user logs in via `POST /api/users/login`:

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "user@example.com",
      "role": "admin",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** The `refreshToken` is automatically set as an httpOnly cookie and is not included in the response body for security.

### 2. Using Access Token

Include the access token in the Authorization header for all protected endpoints:

```javascript
fetch('http://localhost:8000/api/products', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
```

### 3. Token Expiration

When the access token expires, you'll receive a `401 Unauthorized` error:

```json
{
  "success": false,
  "message": "Token expired"
}
```

### 4. Refreshing the Token

When you receive a token expiration error, call the refresh endpoint:

**Request:**
```javascript
// Option 1: Send refresh token in body
POST /api/users/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

```javascript
// Option 2: Refresh token from cookie (automatic)
POST /api/users/refresh-token
// No body needed if refreshToken cookie exists
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "user@example.com",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** A new refresh token is also set as an httpOnly cookie.

## Frontend Implementation Examples

### React Example

```javascript
// api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
});

let accessToken = localStorage.getItem('accessToken');

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token (cookie will be sent automatically)
        const response = await axios.post(
          'http://localhost:8000/api/users/refresh-token'
        );

        const { accessToken: newAccessToken } = response.data.data;
        accessToken = newAccessToken;
        localStorage.setItem('accessToken', newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Vue.js Example

```javascript
// api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true // Important: enables cookie sending
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          'http://localhost:8000/api/users/refresh-token',
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        router.push('/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Vanilla JavaScript Example

```javascript
// api.js
let accessToken = localStorage.getItem('accessToken');

async function refreshAccessToken() {
  try {
    const response = await fetch('http://localhost:8000/api/users/refresh-token', {
      method: 'POST',
      credentials: 'include', // Important: sends cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    accessToken = data.data.accessToken;
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  } catch (error) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw error;
  }
}

async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response = await fetch(`http://localhost:8000/api${url}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  // If token expired, refresh and retry
  if (response.status === 401) {
    await refreshAccessToken();
    headers.Authorization = `Bearer ${accessToken}`;
    response = await fetch(`http://localhost:8000/api${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });
  }

  return response;
}
```

## Security Features

1. **HttpOnly Cookies**: Refresh tokens are stored in httpOnly cookies, preventing XSS attacks
2. **Token Rotation**: Each refresh generates a new refresh token
3. **Token Type Validation**: Access tokens and refresh tokens are differentiated
4. **User Status Check**: Token refresh verifies user is still active
5. **Separate Secrets**: Can use different secrets for access and refresh tokens

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here  # Optional, defaults to JWT_SECRET
JWT_EXPIRES_IN=1h                                 # Access token: 1h, 15m, 30m, etc.
JWT_REFRESH_EXPIRES_IN=7d                        # Refresh token: 7d, 30d, etc.
```

## Best Practices

1. **Store access token securely**: Use memory or secure storage, avoid localStorage for sensitive apps
2. **Handle token expiration gracefully**: Automatically refresh before expiration when possible
3. **Implement logout**: Clear tokens and cookies on logout
4. **Use HTTPS in production**: Always use HTTPS to protect tokens in transit
5. **Monitor token usage**: Log token refresh events for security monitoring

## Troubleshooting

### "Refresh token is required"
- Make sure cookies are enabled in your browser
- Ensure `withCredentials: true` is set in axios/fetch requests
- Check that the refresh token cookie exists

### "Refresh token expired"
- User needs to log in again
- Consider implementing a "remember me" feature with longer refresh token expiry

### "Invalid token type"
- Make sure you're using the access token for API requests, not the refresh token
- Verify token type is set correctly in JWT payload

### Cookies not being sent
- Set `withCredentials: true` in axios
- Use `credentials: 'include'` in fetch
- Ensure CORS is configured to allow credentials on the server

