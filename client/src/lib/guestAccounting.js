import { CHART_OF_ACCOUNTS } from './constants';

export const getGuestProfitLoss = (transactions) => {
    // Initialize balances
    const balances = {};
    Object.values(CHART_OF_ACCOUNTS).flat().forEach(acc => balances[acc] = 0);

    // Calculate balances from transactions
    transactions.forEach(tx => {
        if (!tx.entries) return;

        tx.entries.forEach(entry => {
            const amount = parseFloat(entry.amount);
            const account = entry.account;

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
    });

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

export const getGuestBalanceSheet = (transactions) => {
    // Initialize balances
    const balances = {};
    Object.values(CHART_OF_ACCOUNTS).flat().forEach(acc => balances[acc] = 0);

    // Calculate balances from transactions
    transactions.forEach(tx => {
        if (!tx.entries) return;

        tx.entries.forEach(entry => {
            const amount = parseFloat(entry.amount);
            const account = entry.account;

            const isDebitNormal = CHART_OF_ACCOUNTS.ASSETS.includes(account) || CHART_OF_ACCOUNTS.EXPENSES.includes(account);

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

    const assets = CHART_OF_ACCOUNTS.ASSETS.map(acc => ({ name: acc, amount: balances[acc] || 0 }));
    const liabilities = CHART_OF_ACCOUNTS.LIABILITIES.map(acc => ({ name: acc, amount: balances[acc] || 0 }));
    const equity = CHART_OF_ACCOUNTS.EQUITY.map(acc => ({ name: acc, amount: balances[acc] || 0 }));

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
