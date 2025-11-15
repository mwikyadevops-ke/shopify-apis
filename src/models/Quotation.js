import db from '../config/db.js';

const Quotation = {
    // Create a quotation
    create: async (quotationData) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { 
                supplier_name, 
                supplier_email, 
                supplier_phone, 
                supplier_address,
                shop_id,
                items, 
                apply_tax = false,
                tax_amount = 0, 
                discount_amount = 0, 
                valid_until,
                notes, 
                created_by 
            } = quotationData;

            // Calculate totals
            let subtotal = 0;
            for (const item of items) {
                subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price) - parseFloat(item.discount || 0);
            }

            // Apply 16% tax if apply_tax is true, otherwise use provided tax_amount
            let finalTaxAmount = 0;
            if (apply_tax === true || apply_tax === 'true') {
                finalTaxAmount = subtotal * 0.16; // 16% tax
            } else {
                finalTaxAmount = parseFloat(tax_amount || 0);
            }

            const total_amount = subtotal + finalTaxAmount - parseFloat(discount_amount || 0);

            // Generate quotation number
            const quotationNumber = `QUO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Create quotation record
            const [quotationResult] = await connection.query(
                `INSERT INTO quotations 
                 (quotation_number, supplier_name, supplier_email, supplier_phone, supplier_address,
                  shop_id, subtotal, tax_amount, discount_amount, total_amount, valid_until, notes, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [quotationNumber, supplier_name, supplier_email || null, supplier_phone || null, 
                 supplier_address || null, shop_id || null, subtotal, finalTaxAmount, discount_amount, 
                 total_amount, valid_until || null, notes || null, created_by]
            );

            const quotationId = quotationResult.insertId;

            // Create quotation items
            for (const item of items) {
                const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unit_price)) - parseFloat(item.discount || 0);
                await connection.query(
                    `INSERT INTO quotation_items 
                     (quotation_id, item_name, item_description, item_sku, quantity, unit_price, discount, total_price) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [quotationId, item.item_name, item.item_description || null, item.item_sku || null,
                     item.quantity, item.unit_price, item.discount || 0, itemTotal]
                );
            }

            await connection.commit();

            // Fetch the created quotation with items
            const [quotationRows] = await connection.query(
                `SELECT q.*, 
                        sh.name as shop_name,
                        u.username as created_by_name,
                        (SELECT COUNT(*) FROM quotation_items WHERE quotation_id = q.id) as items_count
                 FROM quotations q
                 LEFT JOIN shops sh ON q.shop_id = sh.id
                 LEFT JOIN users u ON q.created_by = u.id
                 WHERE q.id = ?`,
                [quotationId]
            );

            const [itemRows] = await connection.query(
                'SELECT * FROM quotation_items WHERE quotation_id = ?',
                [quotationId]
            );

            return {
                success: true,
                message: 'Quotation created successfully',
                data: {
                    ...quotationRows[0],
                    items: itemRows
                }
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error creating quotation:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get all quotations with pagination
    getAll: async (filters = {}) => {
        try {
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const offset = (page - 1) * limit;

            let countQuery = `
                SELECT COUNT(*) as total
                FROM quotations q
                WHERE q.deleted_at IS NULL
            `;
            let dataQuery = `
                SELECT q.*, 
                       sh.name as shop_name,
                       u.username as created_by_name,
                       (SELECT COUNT(*) FROM quotation_items WHERE quotation_id = q.id) as items_count
                FROM quotations q
                LEFT JOIN shops sh ON q.shop_id = sh.id
                LEFT JOIN users u ON q.created_by = u.id
                WHERE q.deleted_at IS NULL
            `;
            const params = [];

            if (filters.shop_id) {
                countQuery += ' AND q.shop_id = ?';
                dataQuery += ' AND q.shop_id = ?';
                params.push(filters.shop_id);
            }

            if (filters.status) {
                countQuery += ' AND q.status = ?';
                dataQuery += ' AND q.status = ?';
                params.push(filters.status);
            }

            if (filters.supplier_name) {
                const searchTerm = `%${filters.supplier_name}%`;
                countQuery += ' AND q.supplier_name LIKE ?';
                dataQuery += ' AND q.supplier_name LIKE ?';
                params.push(searchTerm);
            }

            if (filters.start_date && filters.end_date) {
                countQuery += ' AND DATE(q.quotation_date) BETWEEN ? AND ?';
                dataQuery += ' AND DATE(q.quotation_date) BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            // Sorting
            const sortBy = filters.sort_by || 'quotation_date';
            const sortOrder = filters.sort_order || 'desc';
            const allowedSortFields = {
                'quotation_date': 'q.quotation_date',
                'total_amount': 'q.total_amount',
                'supplier_name': 'q.supplier_name',
                'status': 'q.status'
            };
            const finalSortBy = allowedSortFields[sortBy] || 'q.quotation_date';
            const finalSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

            dataQuery += ` GROUP BY q.id ORDER BY ${finalSortBy} ${finalSortOrder} LIMIT ? OFFSET ?`;
            const dataParams = [...params, limit, offset];

            // Get total count
            const [countResult] = await db.query(countQuery, params);
            const total = countResult[0].total;

            // Get paginated data
            const [rows] = await db.query(dataQuery, dataParams);

            return {
                success: true,
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Error fetching quotations:', error);
            throw error;
        }
    },

    // Get quotation by ID
    getById: async (id) => {
        try {
            // Get quotation details
            const [quotationRows] = await db.query(
                `SELECT q.*, 
                        sh.name as shop_name,
                        u.username as created_by_name,
                        (SELECT COUNT(*) FROM quotation_items WHERE quotation_id = q.id) as items_count
                 FROM quotations q
                 LEFT JOIN shops sh ON q.shop_id = sh.id
                 LEFT JOIN users u ON q.created_by = u.id
                 WHERE q.id = ? AND q.deleted_at IS NULL`,
                [id]
            );

            if (quotationRows.length === 0) {
                return {
                    success: false,
                    message: 'Quotation not found',
                    data: null
                };
            }

            // Get quotation items
            const [itemRows] = await db.query(
                'SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id',
                [id]
            );

            return {
                success: true,
                data: {
                    ...quotationRows[0],
                    items: itemRows
                }
            };
        } catch (error) {
            console.error('Error fetching quotation:', error);
            throw error;
        }
    },

    // Update quotation
    update: async (id, quotationData) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { 
                supplier_name, 
                supplier_email, 
                supplier_phone, 
                supplier_address,
                shop_id,
                items, 
                apply_tax,
                tax_amount, 
                discount_amount, 
                valid_until,
                status,
                notes 
            } = quotationData;

            // Check if quotation exists
            const [existingQuotation] = await connection.query(
                'SELECT id FROM quotations WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (existingQuotation.length === 0) {
                await connection.rollback();
                return {
                    success: false,
                    message: 'Quotation not found'
                };
            }

            const updates = [];
            const params = [];

            if (supplier_name !== undefined) {
                updates.push('supplier_name = ?');
                params.push(supplier_name);
            }
            if (supplier_email !== undefined) {
                updates.push('supplier_email = ?');
                params.push(supplier_email);
            }
            if (supplier_phone !== undefined) {
                updates.push('supplier_phone = ?');
                params.push(supplier_phone);
            }
            if (supplier_address !== undefined) {
                updates.push('supplier_address = ?');
                params.push(supplier_address);
            }
            if (shop_id !== undefined) {
                updates.push('shop_id = ?');
                params.push(shop_id);
            }
            if (tax_amount !== undefined) {
                updates.push('tax_amount = ?');
                params.push(tax_amount);
            }
            if (discount_amount !== undefined) {
                updates.push('discount_amount = ?');
                params.push(discount_amount);
            }
            if (valid_until !== undefined) {
                updates.push('valid_until = ?');
                params.push(valid_until);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }
            if (notes !== undefined) {
                updates.push('notes = ?');
                params.push(notes);
            }

            // If items are provided, recalculate totals and update items
            if (items && items.length > 0) {
                let subtotal = 0;
                for (const item of items) {
                    subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price) - parseFloat(item.discount || 0);
                }

                // Calculate tax: apply 16% if apply_tax is true, otherwise use provided tax_amount or current value
                let finalTax = 0;
                if (apply_tax === true || apply_tax === 'true') {
                    finalTax = subtotal * 0.16; // 16% tax
                } else if (tax_amount !== undefined) {
                    finalTax = parseFloat(tax_amount || 0);
                } else {
                    // Get current tax if not provided
                    const [currentQuotation] = await connection.query(
                        'SELECT tax_amount FROM quotations WHERE id = ?',
                        [id]
                    );
                    if (currentQuotation.length > 0) {
                        finalTax = parseFloat(currentQuotation[0].tax_amount || 0);
                    }
                }

                // Get current discount if not provided
                let finalDiscount = discount_amount;
                if (discount_amount === undefined) {
                    const [currentQuotation] = await connection.query(
                        'SELECT discount_amount FROM quotations WHERE id = ?',
                        [id]
                    );
                    if (currentQuotation.length > 0) {
                        finalDiscount = parseFloat(currentQuotation[0].discount_amount || 0);
                    } else {
                        finalDiscount = 0;
                    }
                } else {
                    finalDiscount = parseFloat(discount_amount || 0);
                }

                const total_amount = subtotal + finalTax - finalDiscount;

                updates.push('subtotal = ?');
                updates.push('tax_amount = ?');
                updates.push('total_amount = ?');
                params.push(subtotal, finalTax, total_amount);

                // Delete existing items
                await connection.query('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);

                // Insert new items
                for (const item of items) {
                    const itemTotal = (parseFloat(item.quantity) * parseFloat(item.unit_price)) - parseFloat(item.discount || 0);
                    await connection.query(
                        `INSERT INTO quotation_items 
                         (quotation_id, item_name, item_description, item_sku, quantity, unit_price, discount, total_price) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [id, item.item_name, item.item_description || null, item.item_sku || null,
                         item.quantity, item.unit_price, item.discount || 0, itemTotal]
                    );
                }
            } else if (apply_tax !== undefined || tax_amount !== undefined || discount_amount !== undefined) {
                // Recalculate total if tax/discount changed
                const [currentQuotation] = await connection.query(
                    'SELECT subtotal, tax_amount, discount_amount FROM quotations WHERE id = ?',
                    [id]
                );
                const currentSubtotal = parseFloat(currentQuotation[0].subtotal);
                
                // Calculate tax: apply 16% if apply_tax is true, otherwise use provided tax_amount or current value
                let finalTax = 0;
                if (apply_tax === true || apply_tax === 'true') {
                    finalTax = currentSubtotal * 0.16; // 16% tax
                    updates.push('tax_amount = ?');
                    params.push(finalTax);
                } else if (tax_amount !== undefined) {
                    finalTax = parseFloat(tax_amount || 0);
                    updates.push('tax_amount = ?');
                    params.push(finalTax);
                } else {
                    finalTax = parseFloat(currentQuotation[0].tax_amount || 0);
                }
                
                const finalDiscount = discount_amount !== undefined ? parseFloat(discount_amount || 0) : parseFloat(currentQuotation[0].discount_amount || 0);
                const total_amount = currentSubtotal + finalTax - finalDiscount;

                updates.push('total_amount = ?');
                params.push(total_amount);
            }

            if (updates.length > 0) {
                params.push(id);
                await connection.query(
                    `UPDATE quotations SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
                    params
                );
            }

            await connection.commit();

            // Fetch updated quotation
            const result = await Quotation.getById(id);
            return {
                success: true,
                message: 'Quotation updated successfully',
                data: result.data
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error updating quotation:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Delete quotation (soft delete)
    delete: async (id) => {
        try {
            // Check if quotation exists and is not already deleted
            const [existing] = await db.query(
                'SELECT id FROM quotations WHERE id = ? AND deleted_at IS NULL',
                [id]
            );

            if (existing.length === 0) {
                return {
                    success: false,
                    message: 'Quotation not found'
                };
            }

            // Soft delete: set deleted_at timestamp
            const [result] = await db.query(
                'UPDATE quotations SET deleted_at = NOW() WHERE id = ?',
                [id]
            );

            return {
                success: true,
                message: 'Quotation deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting quotation:', error);
            throw error;
        }
    },

    // Send quotation to supplier via email
    send: async (id) => {
        try {
            // Get quotation with items
            const quotationResult = await Quotation.getById(id);

            if (!quotationResult.success) {
                return {
                    success: false,
                    message: 'Quotation not found'
                };
            }

            const quotation = quotationResult.data;

            // Check if supplier email is provided
            if (!quotation.supplier_email) {
                return {
                    success: false,
                    message: 'Supplier email address is required to send quotation'
                };
            }

            // Check if quotation is already sent or in a final state
            if (quotation.status === 'sent' || quotation.status === 'accepted' || quotation.status === 'rejected' || quotation.status === 'cancelled') {
                return {
                    success: false,
                    message: `Cannot send quotation. Current status is '${quotation.status}'`
                };
            }

            // Import email service dynamically to avoid circular dependencies
            const EmailService = (await import('../config/email.js')).default;

            // Send email
            const emailResult = await EmailService.sendQuotation(quotation, quotation.supplier_email);

            if (!emailResult.success) {
                return emailResult;
            }

            // Update quotation status to 'sent'
            await db.query(
                'UPDATE quotations SET status = ? WHERE id = ? AND deleted_at IS NULL',
                ['sent', id]
            );

            // Fetch updated quotation
            const updatedQuotation = await Quotation.getById(id);

            return {
                success: true,
                message: 'Quotation sent successfully',
                data: updatedQuotation.data,
                emailInfo: {
                    messageId: emailResult.messageId,
                    sentTo: quotation.supplier_email
                }
            };
        } catch (error) {
            console.error('Error sending quotation:', error);
            throw error;
        }
    }
};

export default Quotation;

