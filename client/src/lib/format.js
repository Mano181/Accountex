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
