import { CHART_OF_ACCOUNTS, ACCOUNT_TYPES, getAccountType } from './accounting';

export function calculateAccountBalances(transactions) {
    const balances = {};

    // Initialize all accounts to 0
    Object.values(CHART_OF_ACCOUNTS).flat().forEach(acc => {
        balances[acc] = 0;
    });

    transactions.forEach(tx => {
        tx.entries.forEach(entry => {
            const amount = parseFloat(entry.amount);
            const type = getAccountType(entry.account);

            // Standard Normal Balances:
            // Asset: Debit (Increase), Credit (Decrease)
            // Liability: Credit (Increase), Debit (Decrease)
            // Equity: Credit (Increase), Debit (Decrease)
            // Revenue: Credit (Increase), Debit (Decrease)
            // Expense: Debit (Increase), Credit (Decrease)

            if (type === ACCOUNT_TYPES.ASSET || type === ACCOUNT_TYPES.EXPENSE) {
                if (entry.type === 'debit') balances[entry.account] += amount;
                else balances[entry.account] -= amount;
            } else {
                if (entry.type === 'credit') balances[entry.account] += amount;
                else balances[entry.account] -= amount;
            }
        });
    });

    return balances;
}

export function generateProfitLoss(balances) {
    const revenue = CHART_OF_ACCOUNTS.REVENUE.map(acc => ({ name: acc, amount: balances[acc] }));
    const expenses = CHART_OF_ACCOUNTS.EXPENSES.map(acc => ({ name: acc, amount: balances[acc] }));

    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return { revenue, expenses, totalRevenue, totalExpenses, netIncome };
}

export function generateBalanceSheet(balances, netIncome) {
    const assets = CHART_OF_ACCOUNTS.ASSETS.map(acc => ({ name: acc, amount: balances[acc] }));
    const liabilities = CHART_OF_ACCOUNTS.LIABILITIES.map(acc => ({ name: acc, amount: balances[acc] }));

    // Add Net Income to Retained Earnings or separately in Equity
    // For simplicity, we'll display Retained Earnings + Net Income logic in display, 
    // or assume Retained Earnings account is updated at end of period. 
    // Here we will just map existing Equity accounts and add a computed "Current Period Earnings"

    const equity = CHART_OF_ACCOUNTS.EQUITY.map(acc => ({ name: acc, amount: balances[acc] }));

    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0) + netIncome;

    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, netIncome };
}
