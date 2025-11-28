# SendGrid Email Setup Guide

This guide will help you configure SendGrid for sending emails from your application.

## Step 1: Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/) and sign up for a free account
2. Complete the account verification process
3. Verify your email address

## Step 2: Create API Key

1. Log in to your SendGrid dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., "Shopify App API Key")
5. Select **Full Access** or **Restricted Access** with **Mail Send** permission enabled
6. Click **Create & View**
7. **IMPORTANT**: Copy the API key immediately (you won't be able to see it again!)
   - The API key will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Verify Sender Identity

### Option A: Single Sender Verification (Recommended for Testing)

1. Go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click **Create New Sender**
3. Fill in the form:
   - **From Email Address**: The email you want to send from (e.g., `noreply@yourdomain.com`)
   - **From Name**: Your app name (e.g., "Shopify App")
   - **Reply To**: Same as from email or a different one
   - **Company Address**: Your business address
4. Click **Create**
5. Check your email and click the verification link
6. Wait for SendGrid to verify your sender (may take a few minutes)

### Option B: Domain Authentication (Recommended for Production)

1. Go to **Settings** → **Sender Authentication** → **Domain Authentication**
2. Click **Authenticate Your Domain**
3. Follow the DNS setup instructions
4. Add the required DNS records to your domain
5. Wait for verification (can take up to 48 hours)

## Step 4: Configure Environment Variables

Add these variables to your `.env` file:

```env
# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your_actual_api_key_here
SMTP_FROM_NAME=Shopify App
```

### Important Notes:

- **SMTP_USER** must be exactly `apikey` (lowercase, no quotes)
- **SMTP_PASS** is your SendGrid API key (starts with `SG.`)
- **SMTP_PORT** can be:
  - `587` with `SMTP_SECURE=false` (TLS - recommended)
  - `465` with `SMTP_SECURE=true` (SSL)
- **SMTP_FROM_NAME** is the display name for your emails

## Step 5: Test Your Configuration

1. Restart your server to load the new environment variables
2. Try sending a test email (e.g., password reset or quotation)
3. Check the SendGrid dashboard → **Activity** to see if emails are being sent

## Common Issues and Solutions

### Error: "Authentication failed" or "Invalid credentials"

**Solution:**
- Verify `SMTP_USER` is exactly `apikey` (not your SendGrid username)
- Check that `SMTP_PASS` is your API key (starts with `SG.`)
- Ensure there are no extra spaces in the API key
- Verify the API key has "Mail Send" permissions

### Error: "Connection timeout" or "ECONNECTION"

**Solution:**
- Check your firewall isn't blocking port 587 or 465
- Verify `SMTP_HOST` is `smtp.sendgrid.net`
- Try using port 465 with `SMTP_SECURE=true`
- Check your internet connection

### Error: "Sender email not verified"

**Solution:**
- Verify your sender email in SendGrid dashboard
- Complete the Single Sender Verification process
- For production, use Domain Authentication instead

### Error: "API key does not have permission"

**Solution:**
- Go to SendGrid → Settings → API Keys
- Edit your API key
- Ensure "Mail Send" permission is enabled
- Save and try again

### Emails going to spam

**Solution:**
- Complete Domain Authentication (not just Single Sender)
- Set up SPF and DKIM records
- Use a professional sender email address
- Avoid spam trigger words in subject lines
- Warm up your domain gradually

## SendGrid Free Tier Limits

- **100 emails/day** (free tier)
- Upgrade to paid plans for more emails
- Monitor usage in SendGrid dashboard

## Production Recommendations

1. **Use Domain Authentication** instead of Single Sender
2. **Set up SPF, DKIM, and DMARC** records for better deliverability
3. **Monitor email activity** in SendGrid dashboard
4. **Set up webhooks** for bounce and spam reports
5. **Use dedicated IP** (paid plans) for high volume

## Testing

You can test your SendGrid setup by:

1. Using the password reset feature
2. Sending a quotation email
3. Checking SendGrid Activity Feed for delivery status

## Support

- SendGrid Documentation: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/
- API Status: https://status.sendgrid.com/

## Example .env Configuration

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=shopifya_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# SendGrid Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM_NAME=Shopify App

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

## Security Best Practices

1. **Never commit your API key** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** periodically
4. **Use restricted API keys** with minimal permissions
5. **Monitor API key usage** in SendGrid dashboard
6. **Set up alerts** for unusual activity

