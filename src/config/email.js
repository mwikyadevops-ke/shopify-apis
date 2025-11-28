import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    // Use environment variables for email configuration
    // Supports: Gmail, SendGrid, Outlook, Mailtrap, and other SMTP services
    
    // Remove any spaces from the password (common issue with App Passwords)
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : null;
    
    // Determine if using SendGrid (SendGrid uses 'apikey' as username)
    const isSendGrid = process.env.SMTP_USER === 'apikey' || process.env.SMTP_HOST === 'smtp.sendgrid.net';
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || (isSendGrid ? 'apikey' : undefined),
            pass: smtpPass
        },
        // Add debug option in development
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development',
        // SendGrid specific: require TLS
        ...(isSendGrid && {
            requireTLS: true,
            tls: {
                rejectUnauthorized: false
            }
        })
    });

    return transporter;
};

// Email service
const EmailService = {
    /**
     * Generic email sending method - can be called from anywhere
     * @param {Object} options - Email options
     * @param {string|string[]} options.to - Recipient email address(es)
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content
     * @param {string} [options.text] - Plain text content (optional, will be generated from HTML if not provided)
     * @param {string} [options.from] - Sender email (optional, uses default if not provided)
     * @param {string} [options.replyTo] - Reply-to email (optional)
     * @param {string|string[]} [options.cc] - CC recipients (optional)
     * @param {string|string[]} [options.bcc] - BCC recipients (optional)
     * @param {Array} [options.attachments] - Email attachments (optional)
     * @returns {Promise<Object>} - Result object with success status
     */
    sendEmail: async (options) => {
        try {
            const { to, subject, html, text, from, replyTo, cc, bcc, attachments } = options;

            // Validate required fields
            if (!to) {
                return {
                    success: false,
                    message: 'Recipient email address is required'
                };
            }

            if (!subject) {
                return {
                    success: false,
                    message: 'Email subject is required'
                };
            }

            if (!html && !text) {
                return {
                    success: false,
                    message: 'Email content (HTML or text) is required'
                };
            }

            // Validate email format(s)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const validateEmail = (email) => {
                if (Array.isArray(email)) {
                    return email.every(e => emailRegex.test(e));
                }
                return emailRegex.test(email);
            };

            if (!validateEmail(to)) {
                return {
                    success: false,
                    message: 'Invalid recipient email address format'
                };
            }

            // Check if SMTP is configured
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn('⚠️  SMTP credentials not configured. Email sending is disabled.');
                return {
                    success: false,
                    message: 'Email service is not configured. Please configure SMTP settings in .env file.'
                };
            }

            const transporter = createTransporter();

            // Prepare mail options
            const mailOptions = {
                from: from || `"${process.env.SMTP_FROM_NAME || 'Shopify App'}" <${process.env.SMTP_USER}>`,
                to: to,
                subject: subject,
                html: html,
                text: text || (html ? html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : ''),
                ...(replyTo && { replyTo }),
                ...(cc && { cc }),
                ...(bcc && { bcc }),
                ...(attachments && attachments.length > 0 && { attachments })
            };

            const info = await transporter.sendMail(mailOptions);

            return {
                success: true,
                message: 'Email sent successfully',
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Error sending email:', error);
            
            // Provide helpful error messages for common SMTP issues
            let errorMessage = error.message || 'Failed to send email';
            
            const isSendGrid = process.env.SMTP_USER === 'apikey' || process.env.SMTP_HOST === 'smtp.sendgrid.net';
            
            if (error.code === 'EAUTH' || error.responseCode === 535) {
                if (isSendGrid) {
                    errorMessage = 'SendGrid authentication failed. Please check:\n' +
                        '1. SMTP_USER is set to "apikey" (exactly as shown)\n' +
                        '2. SMTP_PASS is your SendGrid API key (starts with SG.)\n' +
                        '3. The API key has "Mail Send" permissions enabled\n' +
                        '4. See SENDGRID_SETUP.md for detailed instructions';
                } else {
                    errorMessage = 'SMTP authentication failed. Please check:\n' +
                        '1. SMTP_USER and SMTP_PASS are correct\n' +
                        '2. For Gmail: Use App Password (not regular password)\n' +
                        '3. For SendGrid: Use API key with SMTP_USER="apikey"\n' +
                        '4. See EMAIL_CONFIGURATION.md for setup instructions';
                }
            } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
                errorMessage = 'Could not connect to SMTP server. Please check:\n' +
                    '1. SMTP_HOST and SMTP_PORT are correct\n' +
                    '2. Your internet connection is working\n' +
                    '3. Firewall is not blocking SMTP ports\n' +
                    (isSendGrid ? '4. SendGrid: Use port 587 with TLS or 465 with SSL' : '');
            } else if (error.responseCode === 550 || error.responseCode === 553) {
                errorMessage = 'Email address rejected. Please verify the recipient email address is correct.';
            } else if (error.responseCode === 403 && isSendGrid) {
                errorMessage = 'SendGrid API key does not have permission to send emails. Please:\n' +
                    '1. Check API key permissions in SendGrid dashboard\n' +
                    '2. Ensure "Mail Send" permission is enabled\n' +
                    '3. Verify sender email is verified in SendGrid';
            }
            
            return {
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? {
                    code: error.code,
                    responseCode: error.responseCode,
                    command: error.command,
                    response: error.response
                } : undefined
            };
        }
    },

    /**
     * Send quotation email to supplier (convenience method)
     * @param {Object} quotationData - Quotation data including items
     * @param {string} toEmail - Supplier email address
     * @returns {Promise<Object>} - Result object with success status
     */
    sendQuotation: async (quotationData, toEmail) => {
        try {

            // Format quotation items for email
            const itemsHtml = quotationData.items.map((item, index) => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.item_name || 'N/A'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.item_description || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${parseFloat(item.discount || 0).toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
            `).join('');

            // Format valid until date
            const validUntil = quotationData.valid_until 
                ? new Date(quotationData.valid_until).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })
                : 'Not specified';

            // Create HTML email template
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                        .info-section { margin-bottom: 20px; }
                        .info-row { margin: 10px 0; }
                        .info-label { font-weight: bold; display: inline-block; width: 150px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; }
                        th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
                        td { padding: 8px; }
                        .totals { margin-top: 20px; text-align: right; }
                        .total-row { margin: 5px 0; }
                        .total-label { font-weight: bold; display: inline-block; width: 200px; }
                        .total-amount { font-weight: bold; font-size: 1.2em; color: #4CAF50; }
                        .footer { margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 0 0 5px 5px; font-size: 0.9em; color: #666; }
                        .notes { margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Quotation Request</h1>
                            <p>Quotation Number: ${quotationData.quotation_number}</p>
                        </div>
                        <div class="content">
                            <div class="info-section">
                                <h2>Supplier Information</h2>
                                <div class="info-row">
                                    <span class="info-label">Name:</span>
                                    <span>${quotationData.supplier_name}</span>
                                </div>
                                ${quotationData.supplier_email ? `
                                <div class="info-row">
                                    <span class="info-label">Email:</span>
                                    <span>${quotationData.supplier_email}</span>
                                </div>
                                ` : ''}
                                ${quotationData.supplier_phone ? `
                                <div class="info-row">
                                    <span class="info-label">Phone:</span>
                                    <span>${quotationData.supplier_phone}</span>
                                </div>
                                ` : ''}
                                ${quotationData.supplier_address ? `
                                <div class="info-row">
                                    <span class="info-label">Address:</span>
                                    <span>${quotationData.supplier_address}</span>
                                </div>
                                ` : ''}
                            </div>

                            <div class="info-section">
                                <h2>Quotation Details</h2>
                                <div class="info-row">
                                    <span class="info-label">Date:</span>
                                    <span>${new Date(quotationData.quotation_date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Valid Until:</span>
                                    <span>${validUntil}</span>
                                </div>
                                ${quotationData.shop_name ? `
                                <div class="info-row">
                                    <span class="info-label">Shop:</span>
                                    <span>${quotationData.shop_name}</span>
                                </div>
                                ` : ''}
                            </div>

                            <h2>Items</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="text-align: center;">#</th>
                                        <th>Item Name</th>
                                        <th>Description</th>
                                        <th style="text-align: center;">Quantity</th>
                                        <th style="text-align: right;">Unit Price</th>
                                        <th style="text-align: right;">Discount</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>

                            <div class="totals">
                                <div class="total-row">
                                    <span class="total-label">Subtotal:</span>
                                    <span>${parseFloat(quotationData.subtotal).toFixed(2)}</span>
                                </div>
                                ${parseFloat(quotationData.tax_amount) > 0 ? `
                                <div class="total-row">
                                    <span class="total-label">Tax (${quotationData.tax_amount > 0 ? '16%' : 'Custom'}):</span>
                                    <span>${parseFloat(quotationData.tax_amount).toFixed(2)}</span>
                                </div>
                                ` : ''}
                                ${parseFloat(quotationData.discount_amount) > 0 ? `
                                <div class="total-row">
                                    <span class="total-label">Discount:</span>
                                    <span>-${parseFloat(quotationData.discount_amount).toFixed(2)}</span>
                                </div>
                                ` : ''}
                                <div class="total-row">
                                    <span class="total-label total-amount">Total Amount:</span>
                                    <span class="total-amount">${parseFloat(quotationData.total_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            ${quotationData.notes ? `
                            <div class="notes">
                                <strong>Notes:</strong>
                                <p>${quotationData.notes}</p>
                            </div>
                            ` : ''}

                            <div class="footer">
                                <p>This is an automated quotation request. Please review the items and pricing above.</p>
                                <p>If you have any questions, please contact us using the information provided.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Plain text version for email clients that don't support HTML
            const textContent = `
QUOTATION REQUEST
================

Quotation Number: ${quotationData.quotation_number}
Date: ${new Date(quotationData.quotation_date).toLocaleDateString()}
Valid Until: ${validUntil}

Supplier Information:
- Name: ${quotationData.supplier_name}
${quotationData.supplier_email ? `- Email: ${quotationData.supplier_email}\n` : ''}
${quotationData.supplier_phone ? `- Phone: ${quotationData.supplier_phone}\n` : ''}
${quotationData.supplier_address ? `- Address: ${quotationData.supplier_address}\n` : ''}
${quotationData.shop_name ? `- Shop: ${quotationData.shop_name}\n` : ''}

Items:
${quotationData.items.map((item, index) => `
${index + 1}. ${item.item_name}
   Description: ${item.item_description || 'N/A'}
   Quantity: ${item.quantity}
   Unit Price: ${parseFloat(item.unit_price).toFixed(2)}
   Discount: ${parseFloat(item.discount || 0).toFixed(2)}
   Total: ${parseFloat(item.total_price).toFixed(2)}
`).join('')}

Summary:
- Subtotal: ${parseFloat(quotationData.subtotal).toFixed(2)}
${parseFloat(quotationData.tax_amount) > 0 ? `- Tax: ${parseFloat(quotationData.tax_amount).toFixed(2)}\n` : ''}
${parseFloat(quotationData.discount_amount) > 0 ? `- Discount: ${parseFloat(quotationData.discount_amount).toFixed(2)}\n` : ''}
- Total Amount: ${parseFloat(quotationData.total_amount).toFixed(2)}

${quotationData.notes ? `\nNotes:\n${quotationData.notes}\n` : ''}

---
This is an automated quotation request. Please review the items and pricing above.
            `;

            // Use the generic sendEmail method
            return await EmailService.sendEmail({
                to: toEmail,
                subject: `Quotation Request - ${quotationData.quotation_number}`,
                html: htmlContent,
                text: textContent
            });
        } catch (error) {
            console.error('Error sending quotation email:', error);
            return {
                success: false,
                message: error.message || 'Failed to send quotation email'
            };
        }
    },

    /**
     * Send password reset email
     * @param {string} toEmail - User email address
     * @param {string} resetToken - Password reset token
     * @returns {Promise<Object>} - Result object with success status
     */
    sendPasswordReset: async (toEmail, resetToken) => {
        try {
            // Create reset URL (frontend URL + token)
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

            // Create HTML email template
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                        .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .button:hover { background-color: #45a049; }
                        .footer { margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 0 0 5px 5px; font-size: 0.9em; color: #666; }
                        .warning { margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; }
                        .token { font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>You have requested to reset your password. Click the button below to reset your password:</p>
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </div>
                            <p>Or copy and paste this link into your browser:</p>
                            <div class="token">${resetUrl}</div>
                            <div class="warning">
                                <strong>⚠️ Important:</strong>
                                <ul>
                                    <li>This link will expire in 1 hour</li>
                                    <li>If you didn't request this password reset, please ignore this email</li>
                                    <li>For security reasons, never share this link with anyone</li>
                                </ul>
                            </div>
                            <div class="footer">
                                <p>This is an automated email. Please do not reply to this message.</p>
                                <p>If you have any questions, please contact your system administrator.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Plain text version
            const textContent = `
PASSWORD RESET REQUEST
======================

Hello,

You have requested to reset your password. Please click the link below or copy it into your browser:

${resetUrl}

⚠️ Important:
- This link will expire in 1 hour
- If you didn't request this password reset, please ignore this email
- For security reasons, never share this link with anyone

This is an automated email. Please do not reply to this message.
If you have any questions, please contact your system administrator.
            `;

            // Use the generic sendEmail method
            return await EmailService.sendEmail({
                to: toEmail,
                subject: 'Password Reset Request',
                html: htmlContent,
                text: textContent
            });
        } catch (error) {
            console.error('Error sending password reset email:', error);
            return {
                success: false,
                message: error.message || 'Failed to send password reset email'
            };
        }
    }
};

export default EmailService;

