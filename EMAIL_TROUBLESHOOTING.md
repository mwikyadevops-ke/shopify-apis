# Email Troubleshooting Guide

## Common Error: "535-5.7.8 Username and Password not accepted"

This error means Gmail is rejecting your credentials. Here's how to fix it:

### ✅ Solution 1: Use App Password (Required for Gmail)

**You CANNOT use your regular Gmail password.** You MUST use an App Password.

#### Step-by-Step Fix:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "Shopify App API"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

3. **Update .env file**:
   ```env
   SMTP_USER=dominicmwikya50@gmail.com
   SMTP_PASS=abcdefghijklmnop
   ```
   **Important**: 
   - Remove ALL spaces from the App Password
   - It should be exactly 16 characters
   - No quotes needed

4. **Restart your server**:
   ```bash
   npm run dev
   ```

### ✅ Solution 2: Verify Your Configuration

Check your `.env` file has:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dominicmwikya50@gmail.com
SMTP_PASS=your-16-character-app-password-no-spaces
SMTP_FROM_NAME=Penkim Investments
```

### ✅ Solution 3: Test with Mailtrap (Recommended for Development)

If Gmail setup is too complex, use Mailtrap for testing:

1. Sign up at https://mailtrap.io/ (free)
2. Go to "Inboxes" → "SMTP Settings"
3. Select "Node.js - Nodemailer"
4. Copy the credentials
5. Update `.env`:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   ```

### Common Mistakes

❌ **Using regular Gmail password** → Use App Password instead
❌ **App Password has spaces** → Remove all spaces (16 chars total)
❌ **2-Step Verification not enabled** → Enable it first
❌ **Wrong email address** → Use the exact Gmail address
❌ **Forgot to restart server** → Always restart after changing .env

### Quick Checklist

- [ ] 2-Step Verification is enabled
- [ ] App Password is generated (16 characters)
- [ ] App Password has NO spaces in .env file
- [ ] SMTP_USER matches your Gmail address exactly
- [ ] Server restarted after updating .env
- [ ] No typos in .env file

### Still Not Working?

1. **Generate a NEW App Password** (delete the old one first)
2. **Double-check** the password in .env has no spaces
3. **Try Mailtrap** for testing (easier setup)
4. **Check Gmail account** doesn't have security restrictions
5. **Verify** you're using the correct Gmail account

### Alternative: Use Different Email Provider

If Gmail continues to cause issues, consider:

- **Outlook/Hotmail**: `smtp-mail.outlook.com` (port 587)
- **SendGrid**: Professional email service (free tier available)
- **Mailgun**: Developer-friendly email service
- **Mailtrap**: Best for development/testing

See `EMAIL_CONFIGURATION.md` for configuration details for each provider.

