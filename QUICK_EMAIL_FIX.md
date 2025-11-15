# Quick Email Fix - Step by Step

## Current Issue
Your `SMTP_PASS` is 19 characters, but Gmail App Passwords must be exactly **16 characters** (no spaces).

## ✅ Fix in 3 Steps

### Step 1: Generate Gmail App Password

**Direct Link**: https://myaccount.google.com/apppasswords

1. Click the link above (or go to Google Account → Security → App passwords)
2. If you see "App passwords" option:
   - Select "Mail" → "Other (Custom name)"
   - Enter: "Shopify App"
   - Click "Generate"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

3. If you DON'T see "App passwords" option:
   - You need to enable 2-Step Verification first
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"
   - Then come back to App passwords

### Step 2: Update .env File

1. Open your `.env` file
2. Find this line:
   ```
   SMTP_PASS=@Devtech@21
   ```
3. Replace it with your 16-character App Password (NO SPACES):
   ```
   SMTP_PASS=abcdefghijklmnop
   ```
   **Important**: 
   - Remove ALL spaces
   - Should be exactly 16 characters
   - No quotes, no special formatting

### Step 3: Restart Server

```bash
# Stop server (Ctrl+C) and restart
npm run dev
```

## ✅ Verify It's Working

After restarting, try sending a quotation email again. It should work!

## 🚨 Still Not Working?

### Option A: Use Mailtrap (Easier for Testing)

1. Sign up: https://mailtrap.io/ (free)
2. Go to Inboxes → SMTP Settings
3. Copy credentials
4. Update `.env`:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   ```
5. Restart server

### Option B: Check Your App Password

- Make sure it's exactly 16 characters (no spaces)
- Try generating a NEW App Password
- Delete the old one and create a fresh one

## Common Mistakes

❌ Using regular Gmail password (won't work)
❌ App Password has spaces (remove them)
❌ Wrong length (must be 16 chars)
❌ Forgot to restart server (always restart after .env changes)

