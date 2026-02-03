const { CATEGORIES, ACCOUNT_TYPES, getChartOfAccounts } = require('./categories');

const CHART_OF_ACCOUNTS = getChartOfAccounts();

const TRANSACTION_TYPES = {
    SALES_INVOICE: 'SALES_INVOICE',
    CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
    PURCHASE_INVOICE: 'PURCHASE_INVOICE',
    VENDOR_PAYMENT: 'VENDOR_PAYMENT',
    EXPENSE: 'EXPENSE',
    INVENTORY_ADD: 'INVENTORY_ADD',
    INVENTORY_REDUCE: 'INVENTORY_REDUCE',
    CAPITAL_INTRODUCED: 'CAPITAL_INTRODUCED',
    DRAWINGS: 'DRAWINGS',
    LOAN_TAKEN: 'LOAN_TAKEN',
    LOAN_PAID: 'LOAN_PAID'
};

// Map accounts to types
const getAccountType = (accountName) => {
    return CATEGORIES[accountName]?.type || 'UNKNOWN';
};

// Validate that Debits = Credits
const validateTransaction = (entries) => {
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(entry => {
        const amount = parseFloat(entry.amount) || 0;
        if (entry.type === 'debit') totalDebit += amount;
        if (entry.type === 'credit') totalCredit += amount;
    });

    return Math.abs(totalDebit - totalCredit) < 0.01;
};

const generateEntriesFromType = (type, amount, meta = {}) => {
    const amt = parseFloat(amount);
    switch (type) {
        case TRANSACTION_TYPES.SALES_INVOICE:
            return [
                { account: 'Accounts Receivable', type: 'debit', amount: amt },
                { account: 'Sales Revenue', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.CUSTOMER_PAYMENT:
            return [
                { account: 'Cash', type: 'debit', amount: amt },
                { account: 'Accounts Receivable', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.PURCHASE_INVOICE:
            return [
                { account: 'Inventory', type: 'debit', amount: amt },
                { account: 'Accounts Payable', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.VENDOR_PAYMENT:
            return [
                { account: 'Accounts Payable', type: 'debit', amount: amt },
                { account: 'Cash', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.EXPENSE:
            return [
                { account: meta.expenseAccount || 'Operating Expenses', type: 'debit', amount: amt },
                { account: 'Cash', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.INVENTORY_ADD:
            return [
                { account: 'Inventory', type: 'debit', amount: amt },
                { account: 'Inventory Adjustment', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.INVENTORY_REDUCE:
            return [
                { account: 'Inventory Adjustment', type: 'debit', amount: amt },
                { account: 'Inventory', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.CAPITAL_INTRODUCED:
            return [
                { account: 'Cash', type: 'debit', amount: amt },
                { account: 'Owner Capital', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.DRAWINGS:
            return [
                { account: 'Owner Drawings', type: 'debit', amount: amt },
                { account: 'Cash', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.LOAN_TAKEN:
            return [
                { account: 'Cash', type: 'debit', amount: amt },
                { account: 'Loans Payable', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.LOAN_PAID:
            return [
                { account: 'Loans Payable', type: 'debit', amount: amt },
                { account: 'Cash', type: 'credit', amount: amt }
            ];
        default:
            throw new Error(`Invalid transaction type: ${type}`);
    }
};

module.exports = {
    CHART_OF_ACCOUNTS,
    ACCOUNT_TYPES,
    TRANSACTION_TYPES,
    getAccountType,
    validateTransaction,
    generateEntriesFromType
};
