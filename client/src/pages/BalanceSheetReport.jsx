import { useTransactions } from '../context/TransactionContext';
import { TRANSACTION_TYPES } from '../lib/constants';
import { formatCurrency } from '../lib/format';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function BalanceSheetReport() {
    const { transactions, loading } = useTransactions();

    const totals = transactions.reduce((acc, tx) => {
        const amount = tx.amount || 0;
        switch (tx.type) {
            case TRANSACTION_TYPES.SALES:
                acc.sales += amount;
                break;
            case TRANSACTION_TYPES.PAYMENT_RECEIVED:
                acc.paymentReceived += amount;
                break;
            case TRANSACTION_TYPES.PURCHASE:
                acc.purchase += amount;
                break;
            case TRANSACTION_TYPES.PURCHASE_PAYMENT:
                acc.purchasePayment += amount;
                break;
            case TRANSACTION_TYPES.EXPENSE:
                acc.expense += amount;
                break;
            case TRANSACTION_TYPES.LOAN_TAKEN:
                acc.loanTaken += amount;
                break;
            case TRANSACTION_TYPES.LOAN_PAID:
                acc.loanPaid += amount;
                break;
            default:
                break;
        }
        return acc;
    }, { sales: 0, paymentReceived: 0, purchase: 0, purchasePayment: 0, expense: 0, loanTaken: 0, loanPaid: 0 });

    // ASSETS
    const cashBank = totals.paymentReceived - totals.purchasePayment - totals.expense + totals.loanTaken - totals.loanPaid;
    const receivables = totals.sales - totals.paymentReceived;
    const totalAssets = cashBank + receivables;

    // LIABILITIES
    const payables = totals.purchase - totals.purchasePayment;
    const loans = totals.loanTaken - totals.loanPaid;
    const totalLiabilities = payables + loans;

    // EQUITY
    const netProfit = totals.sales - (totals.purchase + totals.expense);
    const totalEquity = netProfit;

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    const ReportLine = ({ label, value, indent = false, bold = false, highlight = false }) => (
        <div className={`flex justify-between text-sm py-1.5 ${bold ? 'font-semibold' : ''} ${highlight ? 'bg-surface-highlight rounded px-2 -mx-2' : ''}`}>
            <span className={indent ? 'pl-4' : ''}>{label}</span>
            <span className="font-mono">{value}</span>
        </div>
    );

    return (
        <div className="bg-surface rounded-lg border border-border overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-surface-highlight px-6 py-4 border-b border-border text-center">
                <h2 className="text-lg font-bold">Balance Sheet</h2>
                <p className="text-xs text-text-secondary mt-1">Statement of Financial Position</p>
            </div>

            {/* Report Body */}
            <div className="p-6 space-y-6">
                {/* Assets */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Assets</h3>
                    <div className="space-y-1">
                        <ReportLine label="Cash / Bank" value={formatCurrency(cashBank)} indent />
                        <ReportLine label="Accounts Receivable" value={formatCurrency(receivables)} indent />
                        <ReportLine label="Total Assets" value={formatCurrency(totalAssets)} bold highlight />
                    </div>
                </section>

                {/* Liabilities */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Liabilities</h3>
                    <div className="space-y-1">
                        <ReportLine label="Accounts Payable" value={formatCurrency(payables)} indent />
                        <ReportLine label="Loans Payable" value={formatCurrency(loans)} indent />
                        <ReportLine label="Total Liabilities" value={formatCurrency(totalLiabilities)} bold />
                    </div>
                </section>

                {/* Equity */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Equity</h3>
                    <div className="space-y-1">
                        <ReportLine label="Retained Earnings" value={formatCurrency(netProfit)} indent />
                        <ReportLine label="Total Equity" value={formatCurrency(totalEquity)} bold />
                    </div>
                </section>

                {/* Totals */}
                <div className="pt-4 border-t-2 border-border">
                    <ReportLine label="Total Liabilities + Equity" value={formatCurrency(totalLiabilities + totalEquity)} bold highlight />
                </div>

                {/* Balance Check */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium ${isBalanced ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {isBalanced ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    <span>{isBalanced ? 'Balanced' : `Imbalance: ${formatCurrency(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}`}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-background px-6 py-3 border-t border-border text-center text-xs text-text-secondary">
                Assets = Liabilities + Equity
            </div>
        </div>
    );
}
