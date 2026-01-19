const db = require('./db');

const getTransactions = async () => {
    // Fetch all transactions and their entries
    const transactionsResult = await db.query('SELECT * FROM transactions ORDER BY date DESC, timestamp DESC');
    const entriesResult = await db.query('SELECT * FROM entries');

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

const addTransaction = async (transaction) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Insert Transaction
        const txQuery = `
            INSERT INTO transactions (id, date, description, type, amount, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const txValues = [
            transaction.id,
            transaction.date,
            transaction.description,
            transaction.type,
            transaction.amount,
            transaction.timestamp
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

const updateTransaction = async (id, updatedData) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Check exists
        const check = await client.query('SELECT id FROM transactions WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        // Update Transaction
        const txQuery = `
            UPDATE transactions 
            SET date = $1, description = $2, type = $3, amount = $4, timestamp = $5
            WHERE id = $6
            RETURNING *
        `;
        const txValues = [
            updatedData.date,
            updatedData.description,
            updatedData.type,
            updatedData.amount,
            updatedData.timestamp,
            id
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

const deleteTransaction = async (id) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const result = await client.query('DELETE FROM transactions WHERE id = $1', [id]);
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
