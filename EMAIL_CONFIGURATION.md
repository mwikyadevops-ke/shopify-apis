# Email Configuration Guide

This guide explains how to configure email functionality for sending quotations to suppliers.

## Environment Variables

Add the following variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dominicmwikya50@gmail.com
SMTP_PASS=@Devtech@21
SMTP_FROM_NAME=Penkim Investments
```

## Email Service Providers

### Gmail Setup

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `SMTP_PASS`

3. **Configuration**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-digit-app-password
   ```

### Outlook/Hotmail Setup

1. **Configuration**:
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@outlook.com
   SMTP_PASS=your-password
   ```

### Mailtrap (Development/Testing)

For development and testing, you can use [Mailtrap](https://mailtrap.io/):

1. Sign up for a free Mailtrap account
2. Get your SMTP credentials from the inbox settings
3. **Configuration**:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   ```

### Other SMTP Providers

You can use any SMTP provider. Common configurations:

- **SendGrid**: `smtp.sendgrid.net` (port 587)
- **Mailgun**: `smtp.mailgun.org` (port 587)
- **Amazon SES**: `email-smtp.region.amazonaws.com` (port 587)
- **Custom SMTP**: Use your provider's SMTP settings

## Testing Email Configuration

1. Create a quotation with a supplier email address
2. Call the send endpoint:
   ```bash
   PUT /api/quotations/:id/send
   ```
3. Check the response for success/error messages
4. Verify the email was received

## Troubleshooting

### "Email service is not configured"
- Make sure all SMTP environment variables are set in your `.env` file
- Restart your server after updating `.env`

### "Invalid credentials" or "Authentication failed"
- For Gmail: Make sure you're using an App Password, not your regular password
- Verify your SMTP credentials are correct
- Check if 2FA is enabled (required for Gmail App Passwords)

### "Connection timeout"
- Check your firewall settings
- Verify the SMTP host and port are correct
- Some networks block SMTP ports; try a different network or use a VPN

### Emails not received
- Check spam/junk folder
- Verify the recipient email address is correct
- For Gmail, check if "Less secure app access" is enabled (if not using App Passwords)
- Use Mailtrap for testing to verify emails are being sent

## Security Notes

- **Never commit `.env` file** to version control
- Use App Passwords instead of regular passwords when possible
- For production, consider using a dedicated email service (SendGrid, Mailgun, etc.)
- Rotate passwords regularly
- Use environment-specific configurations (development vs production)

## Email Template

The quotation email includes:
- Professional HTML formatting
- Quotation number and details
- Supplier information
- Complete item list with pricing
- Subtotal, tax, discount, and total
- Valid until date
- Notes (if provided)
- Plain text fallback for email clients that don't support HTML

