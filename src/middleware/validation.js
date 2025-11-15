import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

// Validation error handler
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Group errors by field name to match frontend format
        const errorsByField = {};
        errors.array().forEach(err => {
            const field = err.param || err.path;
            if (!errorsByField[field]) {
                errorsByField[field] = [];
            }
            errorsByField[field].push(err.msg);
        });
        
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: errorsByField
        });
    }
    next();
};

// Shop validation rules
export const validateShop = {
    create: [
        body('name').trim().notEmpty().withMessage('Shop name is required').isLength({ min: 2, max: 255 }).withMessage('Shop name must be between 2 and 255 characters'),
        body('location').optional().trim().isLength({ max: 255 }).withMessage('Location must be less than 255 characters'),
        body('phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must be less than 50 characters'),
        body('email').optional().trim().isEmail().withMessage('Invalid email format'),
        body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
        validate
    ],
    update: [
        body('name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Shop name must be between 2 and 255 characters'),
        body('location').optional().trim().isLength({ max: 255 }).withMessage('Location must be less than 255 characters'),
        body('phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must be less than 50 characters'),
        body('email').optional().trim().isEmail().withMessage('Invalid email format'),
        body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
        validate
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('Invalid shop ID'),
        validate
    ]
};

// User validation rules
export const validateUser = {
    create: [
        body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3, max: 100 }).withMessage('Username must be between 3 and 100 characters'),
        body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
        body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('full_name').optional().trim().isLength({ max: 255 }).withMessage('Full name must be less than 255 characters'),
        body('phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must be less than 50 characters'),
        body('role').optional().isIn(['admin', 'manager', 'staff', 'cashier']).withMessage('Invalid role'),
        body('shop_id').optional().isInt({ min: 1 }).withMessage('Invalid shop ID'),
        body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
        validate
    ],
    login: [
        body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],
    update: [
        body('username').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Username must be between 3 and 100 characters'),
        body('email').optional().trim().isEmail().withMessage('Invalid email format'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('full_name').optional().trim().isLength({ max: 255 }).withMessage('Full name must be less than 255 characters'),
        body('phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must be less than 50 characters'),
        body('role').optional().isIn(['admin', 'manager', 'staff', 'cashier']).withMessage('Invalid role'),
        body('shop_id').optional().isInt({ min: 1 }).withMessage('Invalid shop ID'),
        body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
        validate
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
        validate
    ]
};

// Product validation rules
export const validateProduct = {
    create: [
        body('name').trim().notEmpty().withMessage('Product name is required').isLength({ min: 2, max: 255 }).withMessage('Product name must be between 2 and 255 characters'),
        body('sku').optional().trim().isLength({ max: 100 }).withMessage('SKU must be less than 100 characters'),
        body('description').optional().trim(),
        body('category_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Category ID must be a positive integer').toInt(),
        body('default_min_stock_level').optional().isFloat({ min: 0 }).withMessage('Default min stock level must be a non-negative number'),
        body('barcode').optional().trim().isLength({ max: 100 }).withMessage('Barcode must be less than 100 characters'),
        body('status').optional().isIn(['active', 'inactive', 'discontinued']).withMessage('Invalid status'),
        validate
    ],
    update: [
        body('name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Product name must be between 2 and 255 characters'),
        body('sku').optional().trim().isLength({ max: 100 }).withMessage('SKU must be less than 100 characters'),
        body('description').optional().trim(),
        body('category_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Category ID must be a positive integer').toInt(),
        body('unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
        body('cost_price').optional().isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
        body('barcode').optional().trim().isLength({ max: 100 }).withMessage('Barcode must be less than 100 characters'),
        body('status').optional().isIn(['active', 'inactive', 'discontinued']).withMessage('Invalid status'),
        validate
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('Invalid product ID'),
        validate
    ]
};

// Stock validation rules
export const validateStock = {
    add: [
        body('shop_id').isInt({ min: 1 }).withMessage('Shop ID is required and must be a positive integer'),
        body('product_id').isInt({ min: 1 }).withMessage('Product ID is required and must be a positive integer'),
        body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity is required and must be a positive number'),
        body('buy_price').notEmpty().withMessage('Buy price is required').isFloat({ min: 0 }).withMessage('Buy price must be a non-negative number'),
        body('sale_price').notEmpty().withMessage('Sale price is required').isFloat({ min: 0 }).withMessage('Sale price must be a non-negative number'),
        body('min_stock_level').optional().isFloat({ min: 0 }).withMessage('Min stock level must be a non-negative number'),
        body('notes').optional().trim(),
        validate
    ],
    reduce: [
        body('shop_id').isInt({ min: 1 }).withMessage('Shop ID is required and must be a positive integer'),
        body('product_id').isInt({ min: 1 }).withMessage('Product ID is required and must be a positive integer'),
        body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity is required and must be a positive number'),
        body('notes').optional().trim(),
        validate
    ],
    adjust: [
        body('shop_id').isInt({ min: 1 }).withMessage('Shop ID is required and must be a positive integer'),
        body('product_id').isInt({ min: 1 }).withMessage('Product ID is required and must be a positive integer'),
        body('quantity').isFloat({ min: 0 }).withMessage('Quantity is required and must be a non-negative number'),
        body('notes').optional().trim(),
        validate
    ],
    shopId: [
        param('shopId').isInt({ min: 1 }).withMessage('Invalid shop ID'),
        validate
    ],
    productId: [
        param('productId').isInt({ min: 1 }).withMessage('Invalid product ID'),
        validate
    ]
};

// Sale validation rules
export const validateSale = {
    create: [
        body('shop_id').isInt({ min: 1 }).withMessage('Shop ID is required and must be a positive integer'),
        body('customer_name').optional().trim().isLength({ max: 255 }).withMessage('Customer name must be less than 255 characters'),
        body('customer_email').optional().trim().isEmail().withMessage('Invalid email format'),
        body('customer_phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must be less than 50 characters'),
        body('items').isArray({ min: 1 }).withMessage('Items array is required and must contain at least one item'),
        body('items.*.product_id').isInt({ min: 1 }).withMessage('Product ID is required for each item'),
        body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity is required and must be a positive number for each item'),
        body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price is required and must be a non-negative number for each item'),
        body('items.*.discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a non-negative number'),
        body('apply_tax').optional().isBoolean().withMessage('Apply tax must be a boolean value').toBoolean(),
        body('tax_amount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be a non-negative number'),
        body('discount_amount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be a non-negative number'),
        body('notes').optional().trim(),
        validate
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('Invalid sale ID'),
        validate
    ]
};

// Payment validation rules
export const validatePayment = {
    create: [
        body('sale_id').isInt({ min: 1 }).withMessage('Sale ID is required and must be a positive integer'),
        body('payment_method').isIn(['cash', 'card', 'mobile_money', 'bank_transfer', 'credit']).withMessage('Invalid payment method'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount is required and must be a positive number'),
        body('reference_number').optional().trim().isLength({ max: 100 }).withMessage('Reference number must be less than 100 characters'),
        body('notes').optional().trim(),
        validate
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('Invalid payment ID'),
        validate
    ]
};

// Stock Transfer validation rules
export const validateStockTransfer = {
    create: [
        body('from_shop_id').isInt({ min: 1 }).withMessage('From shop ID is required and must be a positive integer'),
        body('to_shop_id').isInt({ min: 1 }).withMessage('To shop ID is required and must be a positive integer'),
        body('product_id').isInt({ min: 1 }).withMessage('Product ID is required and must be a positive integer'),
        body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity is required and must be a positive number'),
        body('notes').optional().trim(),
        validate
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('Invalid transfer ID'),
        validate
    ]
};

// Category validation rules
export const validateCategory = {
    create: [
        body('name').trim().notEmpty().withMessage('Category name is required').isLength({ min: 2, max: 255 }).withMessage('Category name must be between 2 and 255 characters'),
        body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
        body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
        validate
    ],
    update: [
        body('name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Category name must be between 2 and 255 characters'),
        body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
        body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
        validate
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('Invalid category ID'),
        validate
    ]
};

// Quotation validation rules
export const validateQuotation = {
    create: [
        body('supplier_name').trim().notEmpty().withMessage('Supplier name is required').isLength({ min: 2, max: 255 }).withMessage('Supplier name must be between 2 and 255 characters'),
        body('supplier_email').optional().trim().isEmail().withMessage('Invalid email format'),
        body('supplier_phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must be less than 50 characters'),
        body('supplier_address').optional().trim(),
        body('shop_id').optional().isInt({ min: 1 }).withMessage('Shop ID must be a positive integer').toInt(),
        body('items').isArray({ min: 1 }).withMessage('Items array is required and must contain at least one item'),
        body('items.*.item_name').trim().notEmpty().withMessage('Item name is required for each item').isLength({ min: 1, max: 255 }).withMessage('Item name must be between 1 and 255 characters'),
        body('items.*.item_description').optional().trim(),
        body('items.*.item_sku').optional().trim().isLength({ max: 100 }).withMessage('Item SKU must be less than 100 characters'),
        body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity is required and must be a positive number for each item'),
        body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price is required and must be a non-negative number for each item'),
        body('items.*.discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a non-negative number'),
        body('apply_tax').optional().isBoolean().withMessage('Apply tax must be a boolean value').toBoolean(),
        body('tax_amount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be a non-negative number'),
        body('discount_amount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be a non-negative number'),
        body('valid_until').optional().isISO8601().withMessage('Valid until must be a valid date'),
        body('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled']).withMessage('Invalid status'),
        body('notes').optional().trim(),
        validate
    ],
    update: [
        body('supplier_name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Supplier name must be between 2 and 255 characters'),
        body('supplier_email').optional().trim().isEmail().withMessage('Invalid email format'),
        body('supplier_phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must be less than 50 characters'),
        body('supplier_address').optional().trim(),
        body('shop_id').optional().isInt({ min: 1 }).withMessage('Shop ID must be a positive integer').toInt(),
        body('items').optional().isArray({ min: 1 }).withMessage('Items array must contain at least one item if provided'),
        body('items.*.item_name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Item name must be between 1 and 255 characters'),
        body('items.*.item_description').optional().trim(),
        body('items.*.item_sku').optional().trim().isLength({ max: 100 }).withMessage('Item SKU must be less than 100 characters'),
        body('items.*.quantity').optional().isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
        body('items.*.unit_price').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
        body('items.*.discount').optional().isFloat({ min: 0 }).withMessage('Discount must be a non-negative number'),
        body('apply_tax').optional().isBoolean().withMessage('Apply tax must be a boolean value').toBoolean(),
        body('tax_amount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be a non-negative number'),
        body('discount_amount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be a non-negative number'),
        body('valid_until').optional().isISO8601().withMessage('Valid until must be a valid date'),
        body('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled']).withMessage('Invalid status'),
        body('notes').optional().trim(),
        validate
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('Invalid quotation ID'),
        validate
    ]
};

// Pagination validation
export const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim(),
    query('status').optional().trim(),
    query('sort_by').optional().trim(),
    query('sort_order').optional().isIn(['asc', 'desc']).withMessage('Sort order must be either asc or desc'),
    query('shop_id').optional().isInt({ min: 1 }).withMessage('Shop ID must be a positive integer').toInt(),
    query('product_id').optional().isInt({ min: 1 }).withMessage('Product ID must be a positive integer').toInt(),
    query('category_id').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer').toInt(),
    query('low_stock').optional().isIn(['true', 'false']).withMessage('Low stock filter must be true or false'),
    query('supplier_name').optional().trim(),
    query('start_date').optional().trim(),
    query('end_date').optional().trim(),
    validate
];

