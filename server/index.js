require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const { getTransactions, addTransaction, updateTransaction, deleteTransaction } = require('./store');
const { validateTransaction, generateEntriesFromType, TRANSACTION_TYPES } = require('./accounting');
const { getProfitLoss, getBalanceSheet } = require('./reports');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(clerkMiddleware());

// API Routes - Protected
app.get('/api/transactions', requireAuth(), async (req, res) => {
    const { userId } = req.auth;
    try {
        const transactions = await getTransactions(userId);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Reports - Protected
app.get('/api/reports/profit-loss', requireAuth(), async (req, res) => {
    const { userId } = req.auth;
    res.set('Cache-Control', 'no-store');
    try {
        const data = await getProfitLoss(userId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/balance-sheet', requireAuth(), async (req, res) => {
    const { userId } = req.auth;
    res.set('Cache-Control', 'no-store');
    try {
        const data = await getBalanceSheet(userId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper to calculate outstanding loan
const calculateOutstandingLoan = async (userId, excludeTransactionId = null) => {
    const transactions = await getTransactions(userId);
    let taken = 0;
    let paid = 0;

    transactions.forEach(t => {
        if (t.id === excludeTransactionId) return; // Skip if we are editing this one
        if (t.type === TRANSACTION_TYPES.LOAN_TAKEN) taken += (t.amount || 0);
        if (t.type === TRANSACTION_TYPES.LOAN_PAID) paid += (t.amount || 0);
    });

    return taken - paid;
};

// Common validation logic
const validateLoanPayment = async (userId, type, amount, excludeId = null) => {
    if (type === TRANSACTION_TYPES.LOAN_PAID) {
        const outstanding = await calculateOutstandingLoan(userId, excludeId);
        if (parseFloat(amount) > outstanding) {
            throw new Error(`Loan repayment (${amount}) cannot exceed outstanding loan (${outstanding.toFixed(2)})`);
        }
    }
};

app.post('/api/transactions', requireAuth(), async (req, res) => {
    const { userId } = req.auth;
    const { date, description, type, amount } = req.body;

    if (!date || !description || !type || !amount) {
        return res.status(400).json({ error: 'Missing required fields: date, description, type, amount' });
    }

    if (!Object.values(TRANSACTION_TYPES).includes(type)) {
        return res.status(400).json({ error: `Invalid transaction type. Allowed: ${Object.values(TRANSACTION_TYPES).join(', ')}` });
    }

    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
    }

    try {
        // Validate Loan Logic
        await validateLoanPayment(userId, type, amount);

        const entries = generateEntriesFromType(type, amount);

        // Accounting validation
        if (!validateTransaction(entries)) {
            return res.status(500).json({ error: 'Internal Error: Generated entries do not balance' });
        }

        const newTransaction = {
            id: Date.now().toString(),
            date,
            description,
            type,
            amount: parseFloat(amount),
            entries,
            timestamp: new Date().toISOString()
        };

        const result = await addTransaction(newTransaction, userId);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/transactions/:id', requireAuth(), async (req, res) => {
    const { userId } = req.auth;
    const { id } = req.params;
    const { date, description, type, amount } = req.body;

    if (!date || !description || !type || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
    }

    try {
        // Validate Loan Logic
        await validateLoanPayment(userId, type, amount, id);

        const entries = generateEntriesFromType(type, amount);

        if (!validateTransaction(entries)) {
            return res.status(500).json({ error: 'Internal Error: Generated entries do not balance' });
        }

        const updatedTransaction = {
            id, // Require id for logic
            date,
            description,
            type,
            amount: parseFloat(amount),
            entries,
            timestamp: new Date().toISOString() // Update timestamp
        };

        const result = await updateTransaction(id, updatedTransaction, userId);
        if (!result) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/transactions/:id', requireAuth(), async (req, res) => {
    const { userId } = req.auth;
    const { id } = req.params;
    try {
        const result = await deleteTransaction(id, userId);

        if (!result) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;

