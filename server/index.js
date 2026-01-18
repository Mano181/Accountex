const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getTransactions, addTransaction, updateTransaction, deleteTransaction } = require('./store');
const { validateTransaction, generateEntriesFromType, TRANSACTION_TYPES } = require('./accounting');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// API Routes
app.get('/api/transactions', (req, res) => {
    res.json(getTransactions());
});

// Helper to calculate outstanding loan
const calculateOutstandingLoan = (excludeTransactionId = null) => {
    const transactions = getTransactions();
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
const validateLoanPayment = (type, amount, excludeId = null) => {
    if (type === TRANSACTION_TYPES.LOAN_PAID) {
        const outstanding = calculateOutstandingLoan(excludeId);
        if (parseFloat(amount) > outstanding) {
            throw new Error(`Loan repayment (${amount}) cannot exceed outstanding loan (${outstanding.toFixed(2)})`);
        }
    }
};

app.post('/api/transactions', (req, res) => {
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
        validateLoanPayment(type, amount);

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

        addTransaction(newTransaction);
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { date, description, type, amount } = req.body;

    if (!date || !description || !type || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
    }

    try {
        // Validate Loan Logic (Excluding current transaction from calculation to allow update)
        validateLoanPayment(type, amount, id);

        const entries = generateEntriesFromType(type, amount);

        if (!validateTransaction(entries)) {
            return res.status(500).json({ error: 'Internal Error: Generated entries do not balance' });
        }

        const updatedTransaction = {
            date,
            description,
            type,
            amount: parseFloat(amount),
            entries,
            timestamp: new Date().toISOString() // Update timestamp
        };

        const result = updateTransaction(id, updatedTransaction);
        if (!result) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const result = deleteTransaction(id);

    if (!result) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(204).send();
});


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
