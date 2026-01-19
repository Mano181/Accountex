const db = require('./db');
const { CATEGORIES, getChartOfAccounts } = require('./categories');

const getBalances = async (userId) => {
    // Correctly join transactions to filter entries by user_id
    const query = `
        SELECT e.account, e.type, e.amount 
        FROM entries e
        JOIN transactions t ON e.transaction_id = t.id
        WHERE t.user_id = $1
    `;
    const result = await db.query(query, [userId]);
    const entries = result.rows;

    const balances = {};
    Object.keys(CATEGORIES).forEach(acc => balances[acc] = 0);

    entries.forEach(entry => {
        const amount = parseFloat(entry.amount);
        const account = entry.account;
        const meta = CATEGORIES[account];

        if (!meta) return;

        // Debit increases Assets/Expenses, Credit increases Liabilities/Equity/Revenue
        const isDebitNormal = meta.normalBalance === 'DEBIT';

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

const getProfitLoss = async (userId) => {
    const balances = await getBalances(userId);

    const revenue = [];
    const expenses = [];

    Object.entries(CATEGORIES).forEach(([name, meta]) => {
        if (meta.report === 'PL') {
            const item = { name, amount: balances[name] || 0 };
            if (meta.type === 'REVENUE') revenue.push(item);
            else if (meta.type === 'EXPENSE') expenses.push(item);
        }
    });

    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    return {
        revenue,
        expenses,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses
    };
};

const getBalanceSheet = async (userId) => {
    const balances = await getBalances(userId);
    const pl = await getProfitLoss(userId);
    const netIncome = pl.netIncome;

    const assets = [];
    const liabilities = [];
    const equity = [];

    Object.entries(CATEGORIES).forEach(([name, meta]) => {
        if (meta.report === 'BS') {
            const item = { name, amount: balances[name] || 0 };
            if (meta.type === 'ASSET') assets.push(item);
            else if (meta.type === 'LIABILITY') liabilities.push(item);
            else if (meta.type === 'EQUITY') equity.push(item);
        }
    });

    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0) + netIncome;

    return {
        assets,
        liabilities,
        equity,
        netIncome,
        totalAssets,
        totalLiabilities,
        totalEquity
    };
};

module.exports = {
    getProfitLoss,
    getBalanceSheet
};

