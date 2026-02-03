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
