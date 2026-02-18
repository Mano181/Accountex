-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    party_name TEXT,
    party_type TEXT,
    expense_account TEXT
);

-- Create Entries Table (Double Entry Lines)
CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
    account TEXT NOT NULL,
    type TEXT CHECK (type IN ('debit', 'credit')) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL
);

-- Index for faster joins
CREATE INDEX IF NOT EXISTS idx_entries_transaction_id ON entries(transaction_id);

-- Customers (Sales Module)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_shop_mobile_unique
    ON customers(user_id, lower(shop_name), mobile_number);

-- Inventory Items (for Sales Invoice Item Selection)
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    sku TEXT,
    default_unit_price NUMERIC(12, 2) NOT NULL CHECK (default_unit_price >= 0),
    quantity_on_hand NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_user_item_name_unique
    ON inventory_items(user_id, lower(item_name));

-- Sales Invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
    accounting_transaction_id TEXT REFERENCES transactions(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_user_id ON sales_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_invoices_user_invoice_number_unique
    ON sales_invoices(user_id, invoice_number);

-- Sales Invoice Items
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    item_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON sales_invoice_items(invoice_id);

-- Sales Payments Received
CREATE TABLE IF NOT EXISTS sales_payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    amount_received NUMERIC(12, 2) NOT NULL CHECK (amount_received > 0),
    payment_date DATE NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'bank', 'UPI', 'other')),
    reference_note TEXT,
    accounting_transaction_id TEXT REFERENCES transactions(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_payments_user_id ON sales_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_payments_customer_id ON sales_payments(customer_id);

-- Purchase Module - Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    mobile_number TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_user_name_mobile_unique
    ON vendors(user_id, lower(vendor_name), COALESCE(mobile_number, ''));

-- Purchase Module - Bills
CREATE TABLE IF NOT EXISTS purchase_bills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    bill_number TEXT NOT NULL,
    vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    bill_date DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    amount_payable NUMERIC(12, 2) NOT NULL CHECK (amount_payable >= 0),
    status TEXT NOT NULL CHECK (status IN ('Paid', 'Partially Paid', 'Unpaid')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_bills_user_id ON purchase_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_vendor_id ON purchase_bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_status ON purchase_bills(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_bills_user_bill_number_unique
    ON purchase_bills(user_id, bill_number);

-- Purchase Module - Bill Items
CREATE TABLE IF NOT EXISTS purchase_bill_items (
    id SERIAL PRIMARY KEY,
    bill_id TEXT NOT NULL REFERENCES purchase_bills(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_purchase_bill_items_bill_id ON purchase_bill_items(bill_id);
