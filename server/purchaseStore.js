const { randomUUID } = require('crypto');
const db = require('./db');

const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;

const toNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeVendor = (row) => ({
    id: row.id,
    vendorName: row.vendor_name,
    mobileNumber: row.mobile_number || '',
    address: row.address || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

const computeBillStatus = (totalAmount, amountPaid) => {
    if (amountPaid <= 0) return 'Unpaid';
    if (amountPaid >= totalAmount) return 'Paid';
    return 'Partially Paid';
};

const assertVendorPayload = ({ vendorName, mobileNumber = '' }) => {
    if (!vendorName || !vendorName.trim()) {
        throw new Error('vendorName is required');
    }
    if (mobileNumber && !MOBILE_REGEX.test(String(mobileNumber).trim())) {
        throw new Error('Invalid mobile number format. Use 10-15 digits, optional leading +.');
    }
};

const resolveInventoryItemWithClient = async (client, userId, itemId, itemName, unitPrice) => {
    if (itemId) {
        const existingById = await client.query(
            `SELECT * FROM inventory_items
             WHERE id = $1 AND user_id = $2
             LIMIT 1`,
            [String(itemId), userId]
        );
        if (existingById.rows.length === 0) {
            throw new Error('Invalid inventory item selected in bill');
        }
        return existingById.rows[0];
    }

    const normalizedName = String(itemName || '').trim();
    if (!normalizedName) {
        throw new Error('Item name is required');
    }

    const existingByName = await client.query(
        `SELECT * FROM inventory_items
         WHERE user_id = $1 AND lower(item_name) = lower($2)
         LIMIT 1`,
        [userId, normalizedName]
    );

    if (existingByName.rows.length > 0) {
        return existingByName.rows[0];
    }

    const inserted = await client.query(
        `INSERT INTO inventory_items (id, user_id, item_name, default_unit_price, quantity_on_hand)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [randomUUID(), userId, normalizedName, unitPrice, 0]
    );

    return inserted.rows[0];
};

const listVendors = async (userId) => {
    const result = await db.query(
        `SELECT *
         FROM vendors
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );
    return result.rows.map(normalizeVendor);
};

const createVendor = async (userId, payload) => {
    assertVendorPayload(payload);
    const vendorName = payload.vendorName.trim();
    const mobileNumber = payload.mobileNumber ? String(payload.mobileNumber).trim() : '';
    const address = payload.address ? String(payload.address).trim() : '';

    const duplicate = await db.query(
        `SELECT id
         FROM vendors
         WHERE user_id = $1
           AND lower(vendor_name) = lower($2)
           AND COALESCE(mobile_number, '') = $3
         LIMIT 1`,
        [userId, vendorName, mobileNumber]
    );
    if (duplicate.rows.length > 0) {
        throw new Error('Vendor already exists with same name and mobile');
    }

    const result = await db.query(
        `INSERT INTO vendors (id, user_id, vendor_name, mobile_number, address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [randomUUID(), userId, vendorName, mobileNumber || null, address || null]
    );
    return normalizeVendor(result.rows[0]);
};

const updateVendor = async (userId, vendorId, payload) => {
    assertVendorPayload(payload);
    const vendorName = payload.vendorName.trim();
    const mobileNumber = payload.mobileNumber ? String(payload.mobileNumber).trim() : '';
    const address = payload.address ? String(payload.address).trim() : '';

    const duplicate = await db.query(
        `SELECT id
         FROM vendors
         WHERE user_id = $1
           AND id <> $2
           AND lower(vendor_name) = lower($3)
           AND COALESCE(mobile_number, '') = $4
         LIMIT 1`,
        [userId, vendorId, vendorName, mobileNumber]
    );
    if (duplicate.rows.length > 0) {
        throw new Error('Vendor already exists with same name and mobile');
    }

    const result = await db.query(
        `UPDATE vendors
         SET vendor_name = $1, mobile_number = $2, address = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [vendorName, mobileNumber || null, address || null, vendorId, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('Vendor not found');
    }
    return normalizeVendor(result.rows[0]);
};

const generateBillNumberWithClient = async (client, userId) => {
    const result = await client.query(
        `SELECT bill_number
         FROM purchase_bills
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
    );
    const last = result.rows[0]?.bill_number || 'BILL-000000';
    const lastNum = parseInt(last.replace(/[^0-9]/g, ''), 10) || 0;
    return `BILL-${String(lastNum + 1).padStart(6, '0')}`;
};

const listBills = async (userId, status = '') => {
    const billsResult = await db.query(
        `SELECT pb.*, v.vendor_name
         FROM purchase_bills pb
         JOIN vendors v ON v.id = pb.vendor_id
         WHERE pb.user_id = $1
           AND ($2 = '' OR pb.status = $2)
         ORDER BY pb.bill_date DESC, pb.created_at DESC`,
        [userId, status]
    );

    if (billsResult.rows.length === 0) return [];

    const billIds = billsResult.rows.map((row) => row.id);
    const itemsResult = await db.query(
        `SELECT *
         FROM purchase_bill_items
         WHERE bill_id = ANY($1::text[])
         ORDER BY id ASC`,
        [billIds]
    );

    return billsResult.rows.map((row) => ({
        id: row.id,
        billNumber: row.bill_number,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        billDate: row.bill_date,
        totalAmount: toNumber(row.total_amount),
        amountPaid: toNumber(row.amount_paid),
        amountPayable: toNumber(row.amount_payable),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: itemsResult.rows
            .filter((item) => item.bill_id === row.id)
            .map((item) => ({
                itemId: item.item_id,
                itemName: item.item_name,
                quantity: toNumber(item.quantity),
                unitPrice: toNumber(item.unit_price),
                lineTotal: toNumber(item.line_total)
            }))
    }));
};

const createBill = async (userId, payload) => {
    const { vendorId, billDate, items } = payload;
    const amountPaid = toNumber(payload.amountPaid || 0);
    if (!vendorId || !billDate || !Array.isArray(items) || items.length === 0) {
        throw new Error('vendorId, billDate and at least one item are required');
    }
    if (amountPaid < 0) {
        throw new Error('amountPaid cannot be negative');
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const vendorResult = await client.query(
            `SELECT *
             FROM vendors
             WHERE id = $1 AND user_id = $2`,
            [vendorId, userId]
        );
        if (vendorResult.rows.length === 0) {
            throw new Error('Vendor not found');
        }

        const normalizedItems = [];
        for (const item of items) {
            const itemName = String(item.itemName || '').trim();
            const itemId = item.itemId ? String(item.itemId).trim() : '';
            const quantity = toNumber(item.quantity);
            const unitPrice = toNumber(item.unitPrice);
            if (!itemName && !itemId) throw new Error('Item name or item id is required');
            if (quantity <= 0) throw new Error('Item quantity must be positive');
            if (unitPrice < 0) throw new Error('Item unit price cannot be negative');

            const inventoryItem = await resolveInventoryItemWithClient(
                client,
                userId,
                itemId,
                itemName,
                unitPrice
            );
            const lineTotal = parseFloat((quantity * unitPrice).toFixed(2));
            normalizedItems.push({
                itemId: inventoryItem.id,
                itemName: inventoryItem.item_name,
                quantity,
                unitPrice,
                lineTotal
            });
        }

        const totalAmount = parseFloat(
            normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
        );
        if (totalAmount <= 0) {
            throw new Error('Bill total must be positive');
        }
        if (amountPaid > totalAmount) {
            throw new Error('amountPaid cannot exceed totalAmount');
        }

        const amountPayable = parseFloat((totalAmount - amountPaid).toFixed(2));
        const statusText = computeBillStatus(totalAmount, amountPaid);

        const billId = randomUUID();
        const billNumber = await generateBillNumberWithClient(client, userId);

        const billResult = await client.query(
            `INSERT INTO purchase_bills
                (id, user_id, bill_number, vendor_id, bill_date, total_amount, amount_paid, amount_payable, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [billId, userId, billNumber, vendorId, billDate, totalAmount, amountPaid, amountPayable, statusText]
        );

        for (const item of normalizedItems) {
            await client.query(
                `INSERT INTO purchase_bill_items
                    (bill_id, item_id, item_name, quantity, unit_price, line_total)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [billId, item.itemId, item.itemName, item.quantity, item.unitPrice, item.lineTotal]
            );

            await client.query(
                `UPDATE inventory_items
                 SET quantity_on_hand = quantity_on_hand + $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2 AND user_id = $3`,
                [item.quantity, item.itemId, userId]
            );
        }

        await client.query('COMMIT');

        const saved = billResult.rows[0];
        return {
            id: saved.id,
            billNumber: saved.bill_number,
            vendorId: saved.vendor_id,
            billDate: saved.bill_date,
            totalAmount: toNumber(saved.total_amount),
            amountPaid: toNumber(saved.amount_paid),
            amountPayable: toNumber(saved.amount_payable),
            status: saved.status,
            createdAt: saved.created_at,
            updatedAt: saved.updated_at,
            items: normalizedItems.map((item) => ({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal
            }))
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateBillPayment = async (userId, billId, payload) => {
    const amountPaid = toNumber(payload.amountPaid);
    if (amountPaid < 0) throw new Error('amountPaid cannot be negative');

    const result = await db.query(
        `SELECT *
         FROM purchase_bills
         WHERE id = $1 AND user_id = $2`,
        [billId, userId]
    );
    if (result.rows.length === 0) {
        throw new Error('Bill not found');
    }

    const bill = result.rows[0];
    const totalAmount = toNumber(bill.total_amount);
    if (amountPaid > totalAmount) {
        throw new Error('amountPaid cannot exceed totalAmount');
    }

    const amountPayable = parseFloat((totalAmount - amountPaid).toFixed(2));
    const statusText = computeBillStatus(totalAmount, amountPaid);

    const updateResult = await db.query(
        `UPDATE purchase_bills
         SET amount_paid = $1, amount_payable = $2, status = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [amountPaid, amountPayable, statusText, billId, userId]
    );
    const updated = updateResult.rows[0];
    return {
        id: updated.id,
        billNumber: updated.bill_number,
        vendorId: updated.vendor_id,
        billDate: updated.bill_date,
        totalAmount: toNumber(updated.total_amount),
        amountPaid: toNumber(updated.amount_paid),
        amountPayable: toNumber(updated.amount_payable),
        status: updated.status,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
    };
};

module.exports = {
    listVendors,
    createVendor,
    updateVendor,
    listBills,
    createBill,
    updateBillPayment
};
