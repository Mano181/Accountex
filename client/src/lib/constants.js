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

export const getAccountType = (accountName) => {
    if (CHART_OF_ACCOUNTS.ASSETS.includes(accountName)) return ACCOUNT_TYPES.ASSET;
    if (CHART_OF_ACCOUNTS.LIABILITIES.includes(accountName)) return ACCOUNT_TYPES.LIABILITY;
    if (CHART_OF_ACCOUNTS.EQUITY.includes(accountName)) return ACCOUNT_TYPES.EQUITY;
    if (CHART_OF_ACCOUNTS.REVENUE.includes(accountName)) return ACCOUNT_TYPES.REVENUE;
    if (CHART_OF_ACCOUNTS.EXPENSES.includes(accountName)) return ACCOUNT_TYPES.EXPENSE;
    return 'UNKNOWN';
};
