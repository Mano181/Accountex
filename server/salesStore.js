const { randomUUID } = require('crypto');
const db = require('./db');
const { TRANSACTION_TYPES, generateEntriesFromType, validateTransaction } = require('./accounting');

const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;
const PAYMENT_MODES = new Set(['cash', 'bank', 'UPI', 'other']);

const toNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCustomer = (row) => ({
    id: row.id,
    shopName: row.shop_name,
    mobileNumber: row.mobile_number,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const normalizeInventoryItem = (row) => ({
    id: row.id,
    itemName: row.item_name,
    sku: row.sku || '',
    quantity: toNumber(row.quantity_on_hand),
    quantityOnHand: toNumber(row.quantity_on_hand),
    unitPrice: toNumber(row.default_unit_price),
    defaultUnitPrice: toNumber(row.default_unit_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const getInventoryPayload = (payload = {}) => {
    const itemName = String(payload.itemName || '').trim();
    const sku = payload.sku ? String(payload.sku).trim() : '';
    const unitPriceRaw = payload.unitPrice ?? payload.defaultUnitPrice ?? 0;
    const quantityRaw = payload.quantity ?? payload.quantityOnHand ?? 0;
    const unitPrice = toNumber(unitPriceRaw);
    const quantity = toNumber(quantityRaw);

    return { itemName, sku, unitPrice, quantity };
};

const computeCustomerOutstandingWithClient = async (client, userId, customerId) => {
    const invoicesResult = await client.query(
        'SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales_invoices WHERE user_id = $1 AND customer_id = $2',
        [userId, customerId]
    );
    const paymentsResult = await client.query(
        'SELECT COALESCE(SUM(amount_received), 0) AS total FROM sales_payments WHERE user_id = $1 AND customer_id = $2',
        [userId, customerId]
    );

    const invoiceTotal = toNumber(invoicesResult.rows[0]?.total);
    const paymentTotal = toNumber(paymentsResult.rows[0]?.total);
    return invoiceTotal - paymentTotal;
};

const createAccountingTransactionWithClient = async ({
    client,
    userId,
    type,
    date,
    description,
    amount,
    partyName = null,
    partyType = null
}) => {
    const txId = randomUUID();
    const timestamp = new Date().toISOString();
    const entries = generateEntriesFromType(type, amount);

    if (!validateTransaction(entries)) {
        throw new Error('Internal Error: Generated entries do not balance');
    }

    await client.query(
        `INSERT INTO transactions
            (id, date, description, type, amount, timestamp, user_id, party_name, party_type, expense_account)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [txId, date, description, type, amount, timestamp, userId, partyName, partyType, null]
    );

    const insertEntrySql = `
        INSERT INTO entries (transaction_id, account, type, amount)
        VALUES ($1, $2, $3, $4)
    `;
    for (const entry of entries) {
        await client.query(insertEntrySql, [txId, entry.account, entry.type, entry.amount]);
    }

    return txId;
};

const getCustomerByIdWithClient = async (client, userId, customerId) => {
    const result = await client.query(
        'SELECT * FROM customers WHERE id = $1 AND user_id = $2',
        [customerId, userId]
    );
    return result.rows[0] || null;
};

const assertValidMobile = (mobileNumber) => {
    if (!MOBILE_REGEX.test(mobileNumber)) {
        throw new Error('Invalid mobile number format. Use 10-15 digits, optional leading +.');
    }
};

const listCustomers = async (userId, search = '') => {
    const query = `
        SELECT c.*,
               COALESCE(inv.total_invoices, 0) AS total_invoices,
               COALESCE(pay.total_payments, 0) AS total_payments
        FROM customers c
        LEFT JOIN (
            SELECT customer_id, SUM(total_amount) AS total_invoices
            FROM sales_invoices
            WHERE user_id = $1
            GROUP BY customer_id
        ) inv ON inv.customer_id = c.id
        LEFT JOIN (
            SELECT customer_id, SUM(amount_received) AS total_payments
            FROM sales_payments
            WHERE user_id = $1
            GROUP BY customer_id
        ) pay ON pay.customer_id = c.id
        WHERE c.user_id = $1
          AND (
              $2 = ''
              OR c.shop_name ILIKE '%' || $2 || '%'
              OR c.mobile_number ILIKE '%' || $2 || '%'
          )
        ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [userId, search.trim()]);
    return result.rows.map((row) => ({
        ...normalizeCustomer(row),
        totalOutstandingAmount: toNumber(row.total_invoices) - toNumber(row.total_payments)
    }));
};

const createCustomer = async (userId, payload) => {
    const { shopName, mobileNumber, address } = payload;
    if (!shopName || !mobileNumber || !address) {
        throw new Error('shopName, mobileNumber, and address are required');
    }

    assertValidMobile(mobileNumber);

    const existing = await db.query(
        `SELECT id
         FROM customers
         WHERE user_id = $1
           AND lower(shop_name) = lower($2)
           AND mobile_number = $3
         LIMIT 1`,
        [userId, shopName.trim(), mobileNumber.trim()]
    );
    if (existing.rows.length > 0) {
        throw new Error('Customer already exists with same shop name and mobile number');
    }

    const customerId = randomUUID();
    const result = await db.query(
        `INSERT INTO customers (id, user_id, shop_name, mobile_number, address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [customerId, userId, shopName.trim(), mobileNumber.trim(), address.trim()]
    );

    return normalizeCustomer(result.rows[0]);
};

const updateCustomer = async (userId, customerId, payload) => {
    const { shopName, mobileNumber, address } = payload;
    if (!shopName || !mobileNumber || !address) {
        throw new Error('shopName, mobileNumber, and address are required');
    }

    assertValidMobile(mobileNumber);

    const duplicate = await db.query(
        `SELECT id
         FROM customers
         WHERE user_id = $1
           AND id <> $2
           AND lower(shop_name) = lower($3)
           AND mobile_number = $4
         LIMIT 1`,
        [userId, customerId, shopName.trim(), mobileNumber.trim()]
    );
    if (duplicate.rows.length > 0) {
        throw new Error('Customer already exists with same shop name and mobile number');
    }

    const result = await db.query(
        `UPDATE customers
         SET shop_name = $1, mobile_number = $2, address = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [shopName.trim(), mobileNumber.trim(), address.trim(), customerId, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('Customer not found');
    }

    return normalizeCustomer(result.rows[0]);
};

const deleteCustomer = async (userId, customerId) => {
    const invoiceCount = await db.query(
        'SELECT COUNT(*)::int AS count FROM sales_invoices WHERE user_id = $1 AND customer_id = $2',
        [userId, customerId]
    );
    const paymentCount = await db.query(
        'SELECT COUNT(*)::int AS count FROM sales_payments WHERE user_id = $1 AND customer_id = $2',
        [userId, customerId]
    );

    if (invoiceCount.rows[0].count > 0 || paymentCount.rows[0].count > 0) {
        throw new Error('Customer has financial records and cannot be deleted');
    }

    const result = await db.query(
        'DELETE FROM customers WHERE id = $1 AND user_id = $2',
        [customerId, userId]
    );
    return result.rowCount > 0;
};

const listInventoryItems = async (userId, search = '') => {
    const result = await db.query(
        `SELECT * FROM inventory_items
         WHERE user_id = $1
           AND ($2 = '' OR item_name ILIKE '%' || $2 || '%')
         ORDER BY item_name ASC`,
        [userId, search.trim()]
    );
    return result.rows.map(normalizeInventoryItem);
};

const createInventoryItem = async (userId, payload) => {
    const { itemName, sku, unitPrice, quantity } = getInventoryPayload(payload);
    const quantityValue = quantity === undefined ? 0 : quantity;
    if (!itemName) {
        throw new Error('itemName is required');
    }
    if (unitPrice < 0) {
        throw new Error('unitPrice must be zero or positive');
    }
    if (quantityValue < 0) {
        throw new Error('quantity must be zero or positive');
    }

    const existing = await db.query(
        `SELECT id
         FROM inventory_items
         WHERE user_id = $1 AND lower(item_name) = lower($2)
         LIMIT 1`,
        [userId, itemName.trim()]
    );
    if (existing.rows.length > 0) {
        throw new Error('Inventory item with same name already exists');
    }

    const result = await db.query(
        `INSERT INTO inventory_items (id, user_id, item_name, sku, default_unit_price, quantity_on_hand)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [randomUUID(), userId, itemName, sku || null, unitPrice, quantityValue]
    );

    return normalizeInventoryItem(result.rows[0]);
};

const updateInventoryItem = async (userId, itemId, payload) => {
    const { itemName, sku, unitPrice, quantity } = getInventoryPayload(payload);
    const hasQuantity = payload.quantity !== undefined || payload.quantityOnHand !== undefined;
    const hasUnitPrice = payload.unitPrice !== undefined || payload.defaultUnitPrice !== undefined;
    const existingResult = await db.query(
        `SELECT *
         FROM inventory_items
         WHERE id = $1 AND user_id = $2`,
        [itemId, userId]
    );
    if (existingResult.rows.length === 0) {
        throw new Error('Inventory item not found');
    }
    const existing = existingResult.rows[0];

    const resolvedItemName = itemName || existing.item_name;
    const resolvedSku = payload.sku === undefined ? (existing.sku || '') : sku;
    const resolvedUnitPrice = hasUnitPrice ? unitPrice : toNumber(existing.default_unit_price);

    if (!resolvedItemName) {
        throw new Error('itemName is required');
    }
    if (resolvedUnitPrice < 0) {
        throw new Error('unitPrice must be zero or positive');
    }
    if (hasQuantity && quantity < 0) {
        throw new Error('quantity must be zero or positive');
    }

    const duplicate = await db.query(
        `SELECT id
         FROM inventory_items
         WHERE user_id = $1
           AND id <> $2
           AND lower(item_name) = lower($3)
         LIMIT 1`,
        [userId, itemId, resolvedItemName]
    );
    if (duplicate.rows.length > 0) {
        throw new Error('Inventory item with same name already exists');
    }

    const result = await db.query(
        `UPDATE inventory_items
         SET item_name = $1,
             sku = $2,
             default_unit_price = $3,
             quantity_on_hand = COALESCE($4, quantity_on_hand),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [resolvedItemName, resolvedSku || null, resolvedUnitPrice, hasQuantity ? quantity : null, itemId, userId]
    );
    return normalizeInventoryItem(result.rows[0]);
};

const deleteInventoryItem = async (userId, itemId) => {
    const salesDependencies = await db.query(
        `SELECT COUNT(*)::int AS count
         FROM sales_invoice_items sii
         JOIN sales_invoices si ON si.id = sii.invoice_id
         WHERE si.user_id = $1 AND sii.item_id = $2`,
        [userId, itemId]
    );
    const purchaseDependencies = await db.query(
        `SELECT COUNT(*)::int AS count
         FROM purchase_bill_items pbi
         JOIN purchase_bills pb ON pb.id = pbi.bill_id
         WHERE pb.user_id = $1 AND pbi.item_id = $2`,
        [userId, itemId]
    );
    if (salesDependencies.rows[0].count > 0 || purchaseDependencies.rows[0].count > 0) {
        throw new Error('Inventory item has financial dependency and cannot be deleted');
    }

    const result = await db.query(
        'DELETE FROM inventory_items WHERE id = $1 AND user_id = $2',
        [itemId, userId]
    );
    return result.rowCount > 0;
};

const adjustInventoryItemQuantity = async (userId, itemId, payload) => {
    const adjustmentType = String(payload.adjustmentType || '').trim();
    const adjustmentQuantity = toNumber(payload.adjustmentQuantity);

    if (!['Increase', 'Decrease'].includes(adjustmentType)) {
        throw new Error('adjustmentType must be Increase or Decrease');
    }
    if (adjustmentQuantity <= 0) {
        throw new Error('adjustmentQuantity must be greater than zero');
    }

    const result = await db.query(
        `SELECT *
         FROM inventory_items
         WHERE id = $1 AND user_id = $2`,
        [itemId, userId]
    );
    if (result.rows.length === 0) {
        throw new Error('Inventory item not found');
    }

    const item = result.rows[0];
    const currentQuantity = toNumber(item.quantity_on_hand);
    const nextQuantity = adjustmentType === 'Increase'
        ? currentQuantity + adjustmentQuantity
        : currentQuantity - adjustmentQuantity;

    if (nextQuantity < 0) {
        throw new Error('Insufficient stock for decrease adjustment');
    }

    const updateResult = await db.query(
        `UPDATE inventory_items
         SET quantity_on_hand = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [parseFloat(nextQuantity.toFixed(2)), itemId, userId]
    );

    return normalizeInventoryItem(updateResult.rows[0]);
};

const generateInvoiceNumberWithClient = async (client, userId) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const candidate = `INV-${Date.now()}-${suffix}`;
        const exists = await client.query(
            `SELECT 1
             FROM sales_invoices
             WHERE user_id = $1 AND invoice_number = $2
             LIMIT 1`,
            [userId, candidate]
        );
        if (exists.rows.length === 0) {
            return candidate;
        }
    }
    throw new Error('Failed to generate unique invoice number');
};

const listInvoices = async (userId, customerId = '') => {
    const invoicesResult = await db.query(
        `SELECT si.*, c.shop_name, c.mobile_number
         FROM sales_invoices si
         JOIN customers c ON c.id = si.customer_id
         WHERE si.user_id = $1
           AND ($2 = '' OR si.customer_id = $2)
         ORDER BY si.invoice_date DESC, si.created_at DESC`,
        [userId, customerId]
    );

    if (invoicesResult.rows.length === 0) return [];

    const invoiceIds = invoicesResult.rows.map((row) => row.id);
    const itemsResult = await db.query(
        `SELECT *
         FROM sales_invoice_items
         WHERE invoice_id = ANY($1::text[])
         ORDER BY id ASC`,
        [invoiceIds]
    );

    return invoicesResult.rows.map((row) => ({
        id: row.id,
        customerId: row.customer_id,
        customerShopName: row.shop_name,
        customerMobileNumber: row.mobile_number,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        totalAmount: toNumber(row.total_amount),
        createdAt: row.created_at,
        items: itemsResult.rows
            .filter((item) => item.invoice_id === row.id)
            .map((item) => ({
                itemId: item.item_id,
                itemName: item.item_name,
                quantity: toNumber(item.quantity),
                unitPrice: toNumber(item.unit_price),
                lineTotal: toNumber(item.line_total)
            }))
    }));
};

const createInvoice = async (userId, payload) => {
    const { customerId, invoiceDate, items } = payload;
    if (!customerId || !invoiceDate || !Array.isArray(items) || items.length === 0) {
        throw new Error('customerId, invoiceDate, and at least one item are required');
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const customer = await getCustomerByIdWithClient(client, userId, customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }

        const itemIds = [...new Set(items.map((item) => item.itemId))];
        const inventoryItemsResult = await client.query(
            `SELECT * FROM inventory_items
             WHERE user_id = $1 AND id = ANY($2::text[])
             FOR UPDATE`,
            [userId, itemIds]
        );
        const inventoryMap = new Map(inventoryItemsResult.rows.map((row) => [row.id, row]));

        if (inventoryMap.size !== itemIds.length) {
            throw new Error('One or more invoice items are invalid');
        }

        const normalizedItems = items.map((item) => {
            const inventoryItem = inventoryMap.get(item.itemId);
            const quantity = toNumber(item.quantity);
            const unitPrice = item.unitPrice === undefined || item.unitPrice === null
                ? toNumber(inventoryItem.default_unit_price)
                : toNumber(item.unitPrice);

            if (quantity <= 0) {
                throw new Error('Item quantity must be positive');
            }
            if (unitPrice < 0) {
                throw new Error('Item unit price cannot be negative');
            }

            const lineTotal = parseFloat((quantity * unitPrice).toFixed(2));

            return {
                itemId: item.itemId,
                itemName: inventoryItem.item_name,
                quantity,
                unitPrice,
                lineTotal
            };
        });

        const totalAmount = parseFloat(
            normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
        );
        if (totalAmount <= 0) {
            throw new Error('Invoice total amount must be positive');
        }

        const requestedByItem = new Map();
        normalizedItems.forEach((item) => {
            requestedByItem.set(
                item.itemId,
                toNumber(requestedByItem.get(item.itemId)) + item.quantity
            );
        });

        for (const [inventoryId, requestedQuantity] of requestedByItem.entries()) {
            const inventoryItem = inventoryMap.get(inventoryId);
            const available = toNumber(inventoryItem.quantity_on_hand);
            if (requestedQuantity > available) {
                throw new Error(`Insufficient stock for ${inventoryItem.item_name}. Available: ${available}`);
            }
        }

        const accountingTransactionId = await createAccountingTransactionWithClient({
            client,
            userId,
            type: TRANSACTION_TYPES.SALES_INVOICE,
            date: invoiceDate,
            description: `Sales Invoice - ${customer.shop_name}`,
            amount: totalAmount,
            partyName: customer.shop_name,
            partyType: 'CUSTOMER'
        });

        const invoiceNumber = await generateInvoiceNumberWithClient(client, userId);
        const invoiceId = randomUUID();

        const invoiceResult = await client.query(
            `INSERT INTO sales_invoices
                (id, user_id, customer_id, invoice_number, invoice_date, total_amount, accounting_transaction_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [invoiceId, userId, customerId, invoiceNumber, invoiceDate, totalAmount, accountingTransactionId]
        );

        const insertItemSql = `
            INSERT INTO sales_invoice_items
                (invoice_id, item_id, item_name, quantity, unit_price, line_total)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        for (const item of normalizedItems) {
            await client.query(insertItemSql, [
                invoiceId,
                item.itemId,
                item.itemName,
                item.quantity,
                item.unitPrice,
                item.lineTotal
            ]);
        }

        for (const [inventoryId, requestedQuantity] of requestedByItem.entries()) {
            await client.query(
                `UPDATE inventory_items
                 SET quantity_on_hand = quantity_on_hand - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND user_id = $3`,
                [requestedQuantity, inventoryId, userId]
            );
        }

        await client.query('COMMIT');

        const saved = invoiceResult.rows[0];
        return {
            id: saved.id,
            customerId: saved.customer_id,
            invoiceNumber: saved.invoice_number,
            invoiceDate: saved.invoice_date,
            totalAmount: toNumber(saved.total_amount),
            createdAt: saved.created_at,
            items: normalizedItems
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const listPayments = async (userId, customerId = '') => {
    const result = await db.query(
        `SELECT sp.*, c.shop_name
         FROM sales_payments sp
         JOIN customers c ON c.id = sp.customer_id
         WHERE sp.user_id = $1
           AND ($2 = '' OR sp.customer_id = $2)
         ORDER BY sp.payment_date DESC, sp.created_at DESC`,
        [userId, customerId]
    );

    return result.rows.map((row) => ({
        id: row.id,
        customerId: row.customer_id,
        customerShopName: row.shop_name,
        amountReceived: toNumber(row.amount_received),
        paymentDate: row.payment_date,
        paymentMode: row.payment_mode,
        referenceNote: row.reference_note || '',
        createdAt: row.created_at
    }));
};

const createPayment = async (userId, payload) => {
    const {
        customerId,
        amountReceived,
        paymentDate,
        paymentMode,
        referenceNote = '',
        allowOverpayment = false
    } = payload;

    const amount = toNumber(amountReceived);
    if (!customerId || !paymentDate || !paymentMode || amount <= 0) {
        throw new Error('customerId, amountReceived, paymentDate, and paymentMode are required');
    }
    if (!PAYMENT_MODES.has(paymentMode)) {
        throw new Error('Invalid payment mode');
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const customer = await getCustomerByIdWithClient(client, userId, customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }

        const outstanding = await computeCustomerOutstandingWithClient(client, userId, customerId);
        if (!allowOverpayment && amount > outstanding) {
            throw new Error(`Overpayment not allowed. Outstanding amount is ${outstanding.toFixed(2)}`);
        }

        const accountingTransactionId = await createAccountingTransactionWithClient({
            client,
            userId,
            type: TRANSACTION_TYPES.CUSTOMER_PAYMENT,
            date: paymentDate,
            description: `Payment Received - ${customer.shop_name}`,
            amount,
            partyName: customer.shop_name,
            partyType: 'CUSTOMER'
        });

        const paymentId = randomUUID();
        const result = await client.query(
            `INSERT INTO sales_payments
                (id, user_id, customer_id, amount_received, payment_date, payment_mode, reference_note, accounting_transaction_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [paymentId, userId, customerId, amount, paymentDate, paymentMode, referenceNote.trim() || null, accountingTransactionId]
        );

        await client.query('COMMIT');

        const saved = result.rows[0];
        return {
            id: saved.id,
            customerId: saved.customer_id,
            amountReceived: toNumber(saved.amount_received),
            paymentDate: saved.payment_date,
            paymentMode: saved.payment_mode,
            referenceNote: saved.reference_note || '',
            createdAt: saved.created_at
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const listOutstanding = async (userId, customerId = '') => {
    const query = `
        SELECT c.id, c.shop_name, c.mobile_number, c.address,
               COALESCE(inv.total_invoices, 0) AS total_invoices,
               COALESCE(pay.total_payments, 0) AS total_payments
        FROM customers c
        LEFT JOIN (
            SELECT customer_id, SUM(total_amount) AS total_invoices
            FROM sales_invoices
            WHERE user_id = $1
            GROUP BY customer_id
        ) inv ON inv.customer_id = c.id
        LEFT JOIN (
            SELECT customer_id, SUM(amount_received) AS total_payments
            FROM sales_payments
            WHERE user_id = $1
            GROUP BY customer_id
        ) pay ON pay.customer_id = c.id
        WHERE c.user_id = $1
          AND ($2 = '' OR c.id = $2)
        ORDER BY (COALESCE(inv.total_invoices, 0) - COALESCE(pay.total_payments, 0)) DESC, c.shop_name ASC
    `;
    const result = await db.query(query, [userId, customerId]);

    return result.rows.map((row) => ({
        customerId: row.id,
        shopName: row.shop_name,
        mobileNumber: row.mobile_number,
        address: row.address,
        totalInvoiced: toNumber(row.total_invoices),
        totalPaid: toNumber(row.total_payments),
        totalOutstandingAmount: toNumber(row.total_invoices) - toNumber(row.total_payments)
    }));
};

module.exports = {
    listCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    listInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    adjustInventoryItemQuantity,
    deleteInventoryItem,
    listInvoices,
    createInvoice,
    listPayments,
    createPayment,
    listOutstanding,
    PAYMENT_MODES
};
