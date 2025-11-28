# Email Service Usage Examples

The email service is now fully reusable and can be called from anywhere in your application.

## Import the Email Service

```javascript
import EmailService from '../config/email.js';
```

## Generic Email Method

Use `sendEmail()` for any email type:

```javascript
const result = await EmailService.sendEmail({
    to: 'recipient@example.com',
    subject: 'Your Email Subject',
    html: '<h1>Hello</h1><p>This is HTML content</p>',
    text: 'Hello\n\nThis is plain text content', // Optional
    from: 'custom@example.com', // Optional, uses default if not provided
    replyTo: 'reply@example.com', // Optional
    cc: ['cc1@example.com', 'cc2@example.com'], // Optional
    bcc: ['bcc@example.com'], // Optional
    attachments: [ // Optional
        {
            filename: 'document.pdf',
            path: '/path/to/document.pdf'
        }
    ]
});

if (result.success) {
    console.log('Email sent:', result.messageId);
} else {
    console.error('Failed to send email:', result.message);
}
```

## Convenience Methods

### Send Quotation Email

```javascript
const result = await EmailService.sendQuotation(quotationData, 'supplier@example.com');
```

### Send Password Reset Email

```javascript
const result = await EmailService.sendPasswordReset('user@example.com', resetToken);
```

## Usage Examples

### Example 1: Send Welcome Email

```javascript
// In a controller or service
import EmailService from '../config/email.js';

export const sendWelcomeEmail = async (userEmail, userName) => {
    const html = `
        <h1>Welcome, ${userName}!</h1>
        <p>Thank you for joining our platform.</p>
        <p>We're excited to have you on board!</p>
    `;
    
    const result = await EmailService.sendEmail({
        to: userEmail,
        subject: 'Welcome to Our Platform',
        html: html
    });
    
    return result;
};
```

### Example 2: Send Order Confirmation

```javascript
export const sendOrderConfirmation = async (orderData, customerEmail) => {
    const html = `
        <h1>Order Confirmation</h1>
        <p>Your order #${orderData.orderNumber} has been confirmed.</p>
        <p>Total: $${orderData.total}</p>
    `;
    
    return await EmailService.sendEmail({
        to: customerEmail,
        subject: `Order Confirmation - #${orderData.orderNumber}`,
        html: html
    });
};
```

### Example 3: Send Notification with Attachments

```javascript
export const sendReportEmail = async (recipientEmail, reportPath) => {
    return await EmailService.sendEmail({
        to: recipientEmail,
        subject: 'Monthly Report',
        html: '<p>Please find the monthly report attached.</p>',
        attachments: [
            {
                filename: 'monthly-report.pdf',
                path: reportPath
            }
        ]
    });
};
```

### Example 4: Send to Multiple Recipients

```javascript
export const sendBulkNotification = async (recipients, message) => {
    return await EmailService.sendEmail({
        to: recipients, // Array of email addresses
        subject: 'Important Notification',
        html: `<p>${message}</p>`,
        bcc: ['admin@example.com'] // Hide recipient list
    });
};
```

### Example 5: Send with Custom From Address

```javascript
export const sendFromCustomSender = async (toEmail, content) => {
    return await EmailService.sendEmail({
        to: toEmail,
        from: 'noreply@yourdomain.com',
        subject: 'Custom Sender Email',
        html: content
    });
};
```

## Response Format

All email methods return a consistent response format:

```javascript
{
    success: true, // or false
    message: 'Email sent successfully', // or error message
    messageId: 'message-id-from-smtp-server' // only if success is true
}
```

## Error Handling

```javascript
const result = await EmailService.sendEmail({
    to: 'user@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
});

if (!result.success) {
    // Handle error
    console.error('Email failed:', result.message);
    // result.message contains helpful error details
}
```

## Best Practices

1. **Always check the result**: Always check `result.success` before assuming the email was sent
2. **Handle errors gracefully**: Log errors and provide user feedback
3. **Use HTML and text**: Provide both HTML and plain text versions for better compatibility
4. **Validate email addresses**: The service validates emails, but you can pre-validate if needed
5. **Use convenience methods**: Use `sendQuotation()` and `sendPasswordReset()` for those specific use cases
6. **Use generic method for custom emails**: Use `sendEmail()` for any other email type

## Adding New Email Types

To add a new email type, simply create a new convenience method:

```javascript
// In email.js
sendWelcomeEmail: async (userEmail, userName) => {
    const html = `<h1>Welcome, ${userName}!</h1>...`;
    const text = `Welcome, ${userName}!...`;
    
    return await EmailService.sendEmail({
        to: userEmail,
        subject: 'Welcome!',
        html: html,
        text: text
    });
}
```

Or use the generic method directly in your controllers/services.

