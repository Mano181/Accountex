import { CATEGORIES, ACCOUNT_TYPES, getChartOfAccounts } from './categories';

export const CHART_OF_ACCOUNTS = getChartOfAccounts();

export { ACCOUNT_TYPES };

export const TRANSACTION_TYPES = {
    SALES_INVOICE: 'SALES_INVOICE',
    CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
    PURCHASE_INVOICE: 'PURCHASE_INVOICE',
    VENDOR_PAYMENT: 'VENDOR_PAYMENT',
    EXPENSE: 'EXPENSE',
    COGS_ADJUSTMENT: 'COGS_ADJUSTMENT',
    CAPITAL_INTRODUCED: 'CAPITAL_INTRODUCED',
    DRAWINGS: 'DRAWINGS',
    LOAN_TAKEN: 'LOAN_TAKEN',
    LOAN_PAID: 'LOAN_PAID'
};

export const generateEntriesFromType = (type, amount, meta = {}) => {
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
        case TRANSACTION_TYPES.COGS_ADJUSTMENT:
            return [
                { account: 'Cost of Goods Sold', type: 'debit', amount: amt },
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
            return [];
    }
};

export const getAccountType = (accountName) => {
    return CATEGORIES[accountName]?.type || 'UNKNOWN';
};

export const TYPE_LABELS = {
    [TRANSACTION_TYPES.SALES_INVOICE]: 'Sales Invoice (Credit)',
    [TRANSACTION_TYPES.CUSTOMER_PAYMENT]: 'Customer Payment',
    [TRANSACTION_TYPES.PURCHASE_INVOICE]: 'Purchase Invoice (Credit)',
    [TRANSACTION_TYPES.VENDOR_PAYMENT]: 'Vendor Payment',
    [TRANSACTION_TYPES.EXPENSE]: 'Expense (Cash)',
    [TRANSACTION_TYPES.COGS_ADJUSTMENT]: 'Record COGS',
    [TRANSACTION_TYPES.CAPITAL_INTRODUCED]: 'Owner Capital Added',
    [TRANSACTION_TYPES.DRAWINGS]: 'Owner Drawings',
    [TRANSACTION_TYPES.LOAN_TAKEN]: 'Loan Taken',
    [TRANSACTION_TYPES.LOAN_PAID]: 'Loan Repayment'
};

export const EXPENSE_ACCOUNTS = [
    'Transport Expense',
    'Operating Expenses'
];
