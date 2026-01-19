export const CHART_OF_ACCOUNTS = {
    ASSETS: ['Cash', 'Bank', 'Accounts Receivable', 'Equipment', 'Inventory'],
    LIABILITIES: ['Accounts Payable', 'Loans Payable'],
    EQUITY: ['Owner Capital', 'Retained Earnings'],
    REVENUE: ['Sales Revenue', 'Service Revenue'],
    EXPENSES: ['Rent Expense', 'Salaries Expense', 'Utilities Expense', 'Supplies Expense', 'General Expense', 'Purchases']
};

export const ACCOUNT_TYPES = {
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE'
};

export const TRANSACTION_TYPES = {
    SALES: 'SALES',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    PURCHASE: 'PURCHASE',
    PURCHASE_PAYMENT: 'PURCHASE_PAYMENT',
    EXPENSE: 'EXPENSE',
    LOAN_TAKEN: 'LOAN_TAKEN',
    LOAN_PAID: 'LOAN_PAID'
};

export const generateEntriesFromType = (type, amount) => {
    const amt = parseFloat(amount);
    switch (type) {
        case TRANSACTION_TYPES.SALES:
            return [
                { account: 'Accounts Receivable', type: 'debit', amount: amt },
                { account: 'Sales Revenue', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.PAYMENT_RECEIVED:
            return [
                { account: 'Cash', type: 'debit', amount: amt },
                { account: 'Accounts Receivable', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.PURCHASE:
            return [
                { account: 'Purchases', type: 'debit', amount: amt },
                { account: 'Accounts Payable', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.PURCHASE_PAYMENT:
            return [
                { account: 'Accounts Payable', type: 'debit', amount: amt },
                { account: 'Cash', type: 'credit', amount: amt }
            ];
        case TRANSACTION_TYPES.EXPENSE:
            return [
                { account: 'General Expense', type: 'debit', amount: amt },
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
    if (CHART_OF_ACCOUNTS.ASSETS.includes(accountName)) return ACCOUNT_TYPES.ASSET;
    if (CHART_OF_ACCOUNTS.LIABILITIES.includes(accountName)) return ACCOUNT_TYPES.LIABILITY;
    if (CHART_OF_ACCOUNTS.EQUITY.includes(accountName)) return ACCOUNT_TYPES.EQUITY;
    if (CHART_OF_ACCOUNTS.REVENUE.includes(accountName)) return ACCOUNT_TYPES.REVENUE;
    if (CHART_OF_ACCOUNTS.EXPENSES.includes(accountName)) return ACCOUNT_TYPES.EXPENSE;
    return 'UNKNOWN';
};

export const TYPE_LABELS = {
    [TRANSACTION_TYPES.SALES]: 'Sales Revenue',
    [TRANSACTION_TYPES.PAYMENT_RECEIVED]: 'Payment Received',
    [TRANSACTION_TYPES.PURCHASE]: 'Purchase (Credit)',
    [TRANSACTION_TYPES.PURCHASE_PAYMENT]: 'Purchase Payment',
    [TRANSACTION_TYPES.EXPENSE]: 'Cash Expense',
    [TRANSACTION_TYPES.LOAN_TAKEN]: 'Loan Taken',
    [TRANSACTION_TYPES.LOAN_PAID]: 'Loan Repayment'
};
