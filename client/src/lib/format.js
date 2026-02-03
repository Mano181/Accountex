// Format currency with proper accounting style
export const formatCurrency = (amount, showSign = false) => {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (num < 0) {
        return `(${formatted})`;
    }
    if (showSign && num > 0) {
        return formatted;
    }
    return formatted;
};

export const formatDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
        const d = dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
        return new Date(d).toLocaleDateString();
    }
    return new Date(dateVal).toLocaleDateString();
};

// Transaction type labels
export const TYPE_LABELS = {
    SALES_INVOICE: 'Sales Invoice (Credit)',
    CUSTOMER_PAYMENT: 'Customer Payment',
    PURCHASE_INVOICE: 'Purchase Invoice (Credit)',
    VENDOR_PAYMENT: 'Vendor Payment',
    EXPENSE: 'Expense (Cash)',
    COGS_ADJUSTMENT: 'Record COGS',
    CAPITAL_INTRODUCED: 'Owner Capital Added',
    DRAWINGS: 'Owner Drawings',
    LOAN_TAKEN: 'Loan Taken',
    LOAN_PAID: 'Loan Repayment'
};
