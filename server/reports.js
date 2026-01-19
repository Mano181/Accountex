const db = require('./db');
const { CHART_OF_ACCOUNTS } = require('./accounting');

const getBalances = async () => {
    // Get all entries with account types
    // Since we don't store account type in DB, we map it in code.
    const result = await db.query('SELECT account, type, amount FROM entries');
    const entries = result.rows;

    const balances = {};
    Object.values(CHART_OF_ACCOUNTS).flat().forEach(acc => balances[acc] = 0);

    entries.forEach(entry => {
        const amount = parseFloat(entry.amount);
        const account = entry.account;

        // This logic relies on consistency with client-side account mapping.
        // Debit increases Assets/Expenses, Credit increases Liabilities/Equity/Revenue
        const isDebitNormal = CHART_OF_ACCOUNTS.ASSETS.includes(account) || CHART_OF_ACCOUNTS.EXPENSES.includes(account);

        if (isDebitNormal) {
            if (entry.type === 'debit') balances[account] += amount;
            else balances[account] -= amount;
        } else {
            if (entry.type === 'credit') balances[account] += amount;
            else balances[account] -= amount;
        }
    });

    return balances;
};

const getProfitLoss = async () => {
    const balances = await getBalances();

    const revenue = CHART_OF_ACCOUNTS.REVENUE.map(acc => ({ name: acc, amount: balances[acc] || 0 }));
    const expenses = CHART_OF_ACCOUNTS.EXPENSES.map(acc => ({ name: acc, amount: balances[acc] || 0 }));

    const totalRev = revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalExp = expenses.reduce((sum, item) => sum + item.amount, 0);

    return {
        revenue,
        expenses,
        totalRevenue: totalRev,
        totalExpenses: totalExp,
        netIncome: totalRev - totalExp
    };
};

const getBalanceSheet = async () => {
    const balances = await getBalances();
    const pl = await getProfitLoss();
    const netIncome = pl.netIncome;

    const assets = CHART_OF_ACCOUNTS.ASSETS.map(acc => ({ name: acc, amount: balances[acc] || 0 }));
    const liabilities = CHART_OF_ACCOUNTS.LIABILITIES.map(acc => ({ name: acc, amount: balances[acc] || 0 }));
    const equity = CHART_OF_ACCOUNTS.EQUITY.map(acc => ({ name: acc, amount: balances[acc] || 0 }));

    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    // Add Net Income to Equity (Retained Earnings logic simplified)
    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0) + netIncome;

    return {
        assets,
        liabilities,
        equity,
        netIncome, // Needed for display in equity section
        totalAssets,
        totalLiabilities,
        totalEquity
    };
};

module.exports = {
    getProfitLoss,
    getBalanceSheet
};
