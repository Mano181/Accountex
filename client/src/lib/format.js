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
    SALES: 'Sales',
    PAYMENT_RECEIVED: 'Payment Received',
    PURCHASE: 'Purchase',
    PURCHASE_PAYMENT: 'Purchase Payment',
    EXPENSE: 'Expense',
    LOAN_TAKEN: 'Loan Taken',
    LOAN_PAID: 'Loan Repaid'
};
