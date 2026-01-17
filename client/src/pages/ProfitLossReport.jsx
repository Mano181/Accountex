import { useTransactions } from '../context/TransactionContext';
import { TRANSACTION_TYPES } from '../lib/constants';
import { formatCurrency } from '../lib/format';

export default function ProfitLossReport() {
    const { transactions, loading } = useTransactions();

    const totals = transactions.reduce((acc, tx) => {
        const amount = tx.amount || 0;
        switch (tx.type) {
            case TRANSACTION_TYPES.SALES:
                acc.sales += amount;
                break;
            case TRANSACTION_TYPES.PURCHASE:
                acc.purchases += amount;
                break;
            case TRANSACTION_TYPES.EXPENSE:
                acc.expenses += amount;
                break;
            default:
                break;
        }
        return acc;
    }, { sales: 0, purchases: 0, expenses: 0 });

    const totalCosts = totals.purchases + totals.expenses;
    const netProfit = totals.sales - totalCosts;

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="bg-surface rounded-lg border border-border overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-surface-highlight px-6 py-4 border-b border-border text-center">
                <h2 className="text-lg font-bold">Profit & Loss Statement</h2>
                <p className="text-xs text-text-secondary mt-1">For the Current Period</p>
            </div>

            {/* Report Body */}
            <div className="p-6 space-y-6">
                {/* Revenue */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Revenue</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="pl-4">Sales</span>
                            <span className="font-mono">{formatCurrency(totals.sales)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-border">
                            <span>Total Revenue</span>
                            <span className="font-mono text-success">{formatCurrency(totals.sales)}</span>
                        </div>
                    </div>
                </section>

                {/* Costs */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Less: Costs & Expenses</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="pl-4">Purchases</span>
                            <span className="font-mono">({formatCurrency(totals.purchases)})</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="pl-4">Other Expenses</span>
                            <span className="font-mono">({formatCurrency(totals.expenses)})</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t border-border">
                            <span>Total Costs</span>
                            <span className="font-mono text-danger">({formatCurrency(totalCosts)})</span>
                        </div>
                    </div>
                </section>

                {/* Net Profit */}
                <div className="bg-surface-highlight rounded-lg p-4 flex justify-between items-center">
                    <span className="font-bold text-lg">Net Profit</span>
                    <span className={`font-mono font-bold text-xl ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {netProfit < 0 ? '(' : ''}{formatCurrency(Math.abs(netProfit))}{netProfit < 0 ? ')' : ''}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-background px-6 py-3 border-t border-border text-center text-xs text-text-secondary">
                Net Profit = Sales − (Purchases + Expenses)
            </div>
        </div>
    );
}
