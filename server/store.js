const db = require('./db');

const getTransactions = async (userId) => {
    // Fetch user's transactions and their entries
    const transactionsResult = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, timestamp DESC', [userId]);

    if (transactionsResult.rows.length === 0) return [];

    const transactionIds = transactionsResult.rows.map(t => t.id);

    // Fetch entries for these transactions only
    const entriesResult = await db.query('SELECT * FROM entries WHERE transaction_id = ANY($1)', [transactionIds]);

    const transactions = transactionsResult.rows;
    const entries = entriesResult.rows;

    // Join entries to transactions
    return transactions.map(tx => ({
        ...tx,
        amount: parseFloat(tx.amount), // Ensure number
        entries: entries.filter(e => e.transaction_id === tx.id).map(e => ({
            ...e,
            amount: parseFloat(e.amount)
        }))
    }));
};

const addTransaction = async (transaction, userId) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Insert Transaction with user_id
        const txQuery = `
            INSERT INTO transactions (id, date, description, type, amount, timestamp, user_id, party_name, party_type, expense_account)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const txValues = [
            transaction.id,
            transaction.date,
            transaction.description,
            transaction.type,
            transaction.amount,
            transaction.timestamp,
            userId,
            transaction.party_name || null,
            transaction.party_type || null,
            transaction.expense_account || null
        ];
        const txResult = await client.query(txQuery, txValues);

        // Insert Entries
        const entryQuery = `
            INSERT INTO entries (transaction_id, account, type, amount)
            VALUES ($1, $2, $3, $4)
        `;

        for (const entry of transaction.entries) {
            await client.query(entryQuery, [transaction.id, entry.account, entry.type, entry.amount]);
        }

        await client.query('COMMIT');

        // Return structured object
        return {
            ...txResult.rows[0],
            amount: parseFloat(txResult.rows[0].amount),
            entries: transaction.entries
        };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const updateTransaction = async (id, updatedData, userId) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Check ownership & existence
        const check = await client.query('SELECT id FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return null; // Not found or not owned
        }

        // Update Transaction
        const txQuery = `
            UPDATE transactions 
            SET date = $1, description = $2, type = $3, amount = $4, timestamp = $5, party_name = $6, party_type = $7, expense_account = $8
            WHERE id = $9 AND user_id = $10
            RETURNING *
        `;
        const txValues = [
            updatedData.date,
            updatedData.description,
            updatedData.type,
            updatedData.amount,
            updatedData.timestamp,
            updatedData.party_name || null,
            updatedData.party_type || null,
            updatedData.expense_account || null,
            id,
            userId
        ];
        const txResult = await client.query(txQuery, txValues);

        // Delete old entries
        await client.query('DELETE FROM entries WHERE transaction_id = $1', [id]);

        // Insert new entries
        const entryQuery = `
            INSERT INTO entries (transaction_id, account, type, amount)
            VALUES ($1, $2, $3, $4)
        `;

        for (const entry of updatedData.entries) {
            await client.query(entryQuery, [id, entry.account, entry.type, entry.amount]);
        }

        await client.query('COMMIT');

        return {
            ...txResult.rows[0],
            amount: parseFloat(txResult.rows[0].amount),
            entries: updatedData.entries
        };
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

const deleteTransaction = async (id, userId) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        // Delete only if owned by user
        const result = await client.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
        await client.query('COMMIT');
        return result.rowCount > 0;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

module.exports = {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
};
