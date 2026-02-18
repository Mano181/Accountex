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

export const ROUTE_HASH = {
    PURCHASE_VENDORS: 'vendors',
    PURCHASE_BILLS: 'bills',
    PURCHASE_PAYMENTS_MADE: 'payments-made',
    INVENTORY_ITEMS: 'items',
    INVENTORY_ADJUST_ITEMS: 'adjust-items'
};

export const SIDEBAR_NAV_MODULES = [
    {
        key: 'home',
        label: 'Home (Dashboard)',
        icon: 'home',
        path: ROUTES.HOME
    },
    {
        key: 'sales',
        label: 'Sales',
        icon: 'sales',
        basePath: ROUTES.SALES,
        children: [
            { key: 'sales-customers', label: 'Customers', path: ROUTES.SALES_CUSTOMERS },
            { key: 'sales-invoices', label: 'Invoices', path: ROUTES.SALES_INVOICES },
            { key: 'sales-outstanding', label: 'Payments Outstanding', path: ROUTES.SALES_OUTSTANDING },
            { key: 'sales-payments', label: 'Payments Received', path: ROUTES.SALES_PAYMENTS }
        ]
    },
    {
        key: 'purchase',
        label: 'Purchase',
        icon: 'purchase',
        basePath: ROUTES.PURCHASE,
        children: [
            { key: 'purchase-vendors', label: 'Vendors', path: ROUTES.PURCHASE, hash: ROUTE_HASH.PURCHASE_VENDORS, defaultOnBase: true },
            { key: 'purchase-bills', label: 'Bills', path: ROUTES.PURCHASE, hash: ROUTE_HASH.PURCHASE_BILLS },
            { key: 'purchase-payments', label: 'Payments Made', path: ROUTES.PURCHASE, hash: ROUTE_HASH.PURCHASE_PAYMENTS_MADE }
        ]
    },
    {
        key: 'inventory',
        label: 'Inventory',
        icon: 'inventory',
        basePath: ROUTES.INVENTORY,
        children: [
            { key: 'inventory-items', label: 'Items', path: ROUTES.INVENTORY, hash: ROUTE_HASH.INVENTORY_ITEMS, defaultOnBase: true },
            { key: 'inventory-adjust', label: 'Adjust Items', path: ROUTES.INVENTORY, hash: ROUTE_HASH.INVENTORY_ADJUST_ITEMS }
        ]
    },
    {
        key: 'reports',
        label: 'Reports',
        icon: 'reports',
        basePath: ROUTES.REPORTS,
        children: [
            { key: 'report-profit-loss', label: 'Profit & Loss', path: ROUTES.REPORTS_PROFIT_LOSS },
            { key: 'report-balance-sheet', label: 'Balance Sheet', path: ROUTES.REPORTS_BALANCE_SHEET },
            { key: 'report-transactions', label: 'Transaction History', path: ROUTES.REPORTS_TRANSACTIONS }
        ]
    }
];
