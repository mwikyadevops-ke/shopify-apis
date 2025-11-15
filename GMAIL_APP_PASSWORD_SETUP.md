# Gmail App Password Setup Guide

To use Gmail for sending emails, you need to create an **App Password** instead of using your regular Gmail password.

## Step-by-Step Instructions

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google", find **2-Step Verification**
4. If it's not enabled, click on it and follow the setup process
5. **Note**: You MUST have 2-Step Verification enabled to create App Passwords

### Step 2: Generate App Password

1. Go back to [Google Account Settings](https://myaccount.google.com/)
2. Click on **Security**
3. Under "How you sign in to Google", find **2-Step Verification**
4. Scroll down and click on **App passwords**
   - If you don't see this option, make sure 2-Step Verification is enabled
5. You may be asked to sign in again
6. Under "Select app", choose **Mail**
7. Under "Select device", choose **Other (Custom name)**
8. Type a name like "Shopify App API" or "Node.js Email"
9. Click **Generate**
10. Google will show you a **16-character password** (like: `abcd efgh ijkl mnop`)
11. **Copy this password immediately** - you won't be able to see it again!

### Step 3: Update Your .env File

1. Open your `.env` file
2. Find the `SMTP_PASS` line
3. Replace `your-app-password-here` with the 16-character App Password you just generated
4. **Important**: Remove any spaces from the password (it should be 16 characters without spaces)
5. Save the file

Example:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dominicmwikya50@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM_NAME=Penkim Investments
```

### Step 4: Restart Your Server

After updating the `.env` file, restart your server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

## Troubleshooting

### "Invalid credentials" or "Authentication failed"
- Make sure you're using the **App Password**, not your regular Gmail password
- Verify the password has no spaces (16 characters total)
- Check that 2-Step Verification is enabled on your Google account

### "App passwords" option not showing
- Make sure 2-Step Verification is enabled first
- Try refreshing the page
- Make sure you're signed in to the correct Google account

### Still having issues?
- Try generating a new App Password
- Make sure your account doesn't have any security restrictions
- Check if "Less secure app access" is enabled (older Gmail accounts)

## Alternative: Use Mailtrap for Testing

If you want to test email functionality without setting up Gmail, you can use [Mailtrap](https://mailtrap.io/):

1. Sign up for a free Mailtrap account
2. Get your SMTP credentials from the inbox settings
3. Update your `.env`:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   ```

Mailtrap is great for development because it captures all emails without actually sending them.

