export const ROUTES = {
    HOME: '/',
    SALES: '/sales',
    SALES_CUSTOMERS: '/sales/customers',
    SALES_INVOICES: '/sales/invoices',
    SALES_OUTSTANDING: '/sales/outstanding',
    SALES_PAYMENTS: '/sales/payments',
    PURCHASE: '/purchase',
    REPORTS: '/reports',
    INVENTORY: '/inventory',
    REPORTS_PROFIT_LOSS: '/reports/profit-loss',
    REPORTS_BALANCE_SHEET: '/reports/balance-sheet',
    REPORTS_TRANSACTIONS: '/reports/transactions',
    SIGN_IN: '/sign-in',
    SIGN_UP: '/sign-up'
};

export const MAIN_NAV_ITEMS = [
    { key: 'home', label: 'Home', path: ROUTES.HOME, end: true },
    { key: 'sales', label: 'Sales', path: ROUTES.SALES, end: false },
    { key: 'purchase', label: 'Purchase', path: ROUTES.PURCHASE, end: true },
    { key: 'reports', label: 'Reports', path: ROUTES.REPORTS, end: false },
    { key: 'inventory', label: 'Inventory', path: ROUTES.INVENTORY, end: true }
];
