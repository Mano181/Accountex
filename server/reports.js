const db = require('./db');
const { CATEGORIES, getChartOfAccounts } = require('./categories');

const getBalances = async () => {
    const result = await db.query('SELECT account, type, amount FROM entries');
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

const getProfitLoss = async () => {
    const balances = await getBalances();

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

const getBalanceSheet = async () => {
    const balances = await getBalances();
    const pl = await getProfitLoss();
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

