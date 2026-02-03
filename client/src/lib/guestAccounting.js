import { CATEGORIES } from './categories';

export const getGuestProfitLoss = (transactions) => {
    // Initialize balances
    const balances = {};
    Object.keys(CATEGORIES).forEach(acc => balances[acc] = 0);

    // Calculate balances from transactions
    transactions.forEach(tx => {
        if (!tx.entries) return;

        tx.entries.forEach(entry => {
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
    });

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

    const purchasesTotal = transactions
        .filter(tx => tx.type === 'PURCHASE_INVOICE')
        .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    const closingInventory = balances['Inventory'] || 0;
    const openingInventory = 0;
    const cogs = openingInventory + purchasesTotal - closingInventory;

    return {
        revenue,
        expenses: [
            { name: 'Cost of Goods Sold', amount: cogs },
            ...expenses
        ],
        totalRevenue,
        totalExpenses: totalExpenses + cogs,
        netIncome: totalRevenue - (totalExpenses + cogs)
    };
};

export const getGuestBalanceSheet = (transactions) => {
    // Initialize balances
    const balances = {};
    Object.keys(CATEGORIES).forEach(acc => balances[acc] = 0);

    // Calculate balances from transactions
    transactions.forEach(tx => {
        if (!tx.entries) return;

        tx.entries.forEach(entry => {
            const amount = parseFloat(entry.amount);
            const account = entry.account;
            const meta = CATEGORIES[account];

            if (!meta) return;

            const isDebitNormal = meta.normalBalance === 'DEBIT';

            if (isDebitNormal) {
                if (entry.type === 'debit') balances[account] += amount;
                else balances[account] -= amount;
            } else {
                if (entry.type === 'credit') balances[account] += amount;
                else balances[account] -= amount;
            }
        });
    });

    // Calculate P&L for Equity
    const pl = getGuestProfitLoss(transactions);
    const netIncome = pl.netIncome;

    const assets = [];
    const liabilities = [];
    const equity = [];

    Object.entries(CATEGORIES).forEach(([name, meta]) => {
        if (meta.report === 'BS') {
            const rawAmount = balances[name] || 0;
            const amount = meta.contra ? -rawAmount : rawAmount;
            const item = { name, amount };
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
