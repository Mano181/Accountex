/**
 * Centralized Category Configuration (Node.js version)
 * This drives the Chart of Accounts, Validation, and Reporting logic.
 */

const CATEGORIES = {
    // ASSETS
    'Cash': {
        report: 'BS',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        label: 'Cash'
    },
    'Bank': {
        report: 'BS',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        label: 'Bank'
    },
    'Accounts Receivable': {
        report: 'BS',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        label: 'Accounts Receivable'
    },
    // LIABILITIES
    'Accounts Payable': {
        report: 'BS',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        label: 'Accounts Payable'
    },
    'Loans Payable': {
        report: 'BS',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        label: 'Loans Payable'
    },
    // EQUITY
    'Owner Capital': {
        report: 'BS',
        type: 'EQUITY',
        normalBalance: 'CREDIT',
        label: 'Owner Capital'
    },
    'Retained Earnings': {
        report: 'BS',
        type: 'EQUITY',
        normalBalance: 'CREDIT',
        label: 'Retained Earnings'
    },
    // REVENUE
    'Sales Revenue': {
        report: 'PL',
        type: 'REVENUE',
        normalBalance: 'CREDIT',
        label: 'Sales Revenue'
    },
    'Service Revenue': {
        report: 'PL',
        type: 'REVENUE',
        normalBalance: 'CREDIT',
        label: 'Service Revenue'
    },
    // EXPENSES
    'Purchases': {
        report: 'PL',
        type: 'EXPENSE',
        normalBalance: 'DEBIT',
        label: 'Purchases'
    }
};

const ACCOUNT_TYPES = {
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE'
};

const getChartOfAccounts = () => {
    const coa = {
        ASSETS: [],
        LIABILITIES: [],
        EQUITY: [],
        REVENUE: [],
        EXPENSES: []
    };

    Object.entries(CATEGORIES).forEach(([name, meta]) => {
        if (meta.type === 'ASSET') coa.ASSETS.push(name);
        else if (meta.type === 'LIABILITY') coa.LIABILITIES.push(name);
        else if (meta.type === 'EQUITY') coa.EQUITY.push(name);
        else if (meta.type === 'REVENUE') coa.REVENUE.push(name);
        else if (meta.type === 'EXPENSE') coa.EXPENSES.push(name);
    });

    return coa;
};

module.exports = {
    CATEGORIES,
    ACCOUNT_TYPES,
    getChartOfAccounts
};
