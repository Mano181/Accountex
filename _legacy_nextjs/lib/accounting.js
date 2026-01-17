// Chart of Accounts (Simplified)
export const CHART_OF_ACCOUNTS = {
    ASSETS: ['Cash', 'Bank', 'Accounts Receivable', 'Equipment'],
    LIABILITIES: ['Accounts Payable', 'Loans Payable'],
    EQUITY: ['Owner Capital', 'Retained Earnings'],
    REVENUE: ['Sales Revenue', 'Service Revenue'],
    EXPENSES: ['Rent Expense', 'Salaries Expense', 'Utilities Expense', 'Supplies Expense']
};

export const ACCOUNT_TYPES = {
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE'
};

// Map accounts to types
export const getAccountType = (accountName) => {
    if (CHART_OF_ACCOUNTS.ASSETS.includes(accountName)) return ACCOUNT_TYPES.ASSET;
    if (CHART_OF_ACCOUNTS.LIABILITIES.includes(accountName)) return ACCOUNT_TYPES.LIABILITY;
    if (CHART_OF_ACCOUNTS.EQUITY.includes(accountName)) return ACCOUNT_TYPES.EQUITY;
    if (CHART_OF_ACCOUNTS.REVENUE.includes(accountName)) return ACCOUNT_TYPES.REVENUE;
    if (CHART_OF_ACCOUNTS.EXPENSES.includes(accountName)) return ACCOUNT_TYPES.EXPENSE;
    return 'UNKNOWN';
};

// Validate that Debits = Credits
export function validateTransaction(entries) {
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(entry => {
        const amount = parseFloat(entry.amount) || 0;
        if (entry.type === 'debit') totalDebit += amount;
        if (entry.type === 'credit') totalCredit += amount;
    });

    // Use a small epsilon for floating point comparison
    return Math.abs(totalDebit - totalCredit) < 0.01;
}
