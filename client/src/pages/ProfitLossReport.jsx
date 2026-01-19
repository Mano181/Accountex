import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '@clerk/clerk-react';
import { TRANSACTION_TYPES } from '../lib/constants';
import { formatCurrency } from '../lib/format';
import { getGuestProfitLoss } from '../lib/guestAccounting';
import { useState, useEffect } from 'react';

export default function ProfitLossReport() {
    const { transactions, loading } = useTransactions();
    const { isSignedIn, isLoaded } = useAuth();
    const [reportData, setReportData] = useState(null);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn) {
            // Fetch from API for authenticated users
            setFetching(true);
            fetch('/api/reports/profit-loss')
                .then(res => res.json())
                .then(data => {
                    setReportData(data);
                    setFetching(false);
                })
                .catch(err => {
                    console.error("Failed to fetch P&L report:", err);
                    setFetching(false);
                });
        } else {
            // Calculate locally for guests
            setReportData(getGuestProfitLoss(transactions));
        }
    }, [isSignedIn, isLoaded, transactions]);

    if (loading || (!reportData && fetching)) {
        return <div className="text-center py-8">Loading Report...</div>;
    }

    if (!reportData) {
        return <div className="text-center py-8 text-text-secondary">No data available</div>;
    }

    return (
        <div className="bg-surface rounded-lg border border-border overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-surface-highlight px-6 py-4 border-b border-border text-center">
                <h2 className="text-lg font-bold">Profit & Loss Statement</h2>
                <p className="text-xs text-text-secondary mt-1">
                    {isSignedIn ? 'Real-time Database' : 'Guest Session Data'}
                </p>
            </div>

            {/* Report Body */}
            <div className="p-6 space-y-6">
                {/* Revenue */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Revenue</h3>
                    <div className="space-y-2">
                        {reportData.revenue.map(item => (
                            <div key={item.name} className="flex justify-between text-sm">
                                <span className="pl-4">{item.name}</span>
                                <span className="font-mono">{formatCurrency(item.amount)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between font-semibold pt-2 border-t border-border">
                            <span>Total Revenue</span>
                            <span className="font-mono text-success">{formatCurrency(reportData.totalRevenue)}</span>
                        </div>
                    </div>
                </section>

                {/* Costs */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Expenses</h3>
                    <div className="space-y-2">
                        {reportData.expenses.map(item => (
                            <div key={item.name} className="flex justify-between text-sm">
                                <span className="pl-4">{item.name}</span>
                                <span className="font-mono">({formatCurrency(item.amount)})</span>
                            </div>
                        ))}
                        <div className="flex justify-between font-semibold pt-2 border-t border-border">
                            <span>Total Expenses</span>
                            <span className="font-mono text-danger">({formatCurrency(reportData.totalExpenses)})</span>
                        </div>
                    </div>
                </section>

                {/* Net Profit */}
                <div className="bg-surface-highlight rounded-lg p-4 flex justify-between items-center">
                    <span className="font-bold text-lg">Net Profit</span>
                    <span className={`font-mono font-bold text-xl ${reportData.netIncome >= 0 ? 'text-success' : 'text-danger'}`}>
                        {reportData.netIncome < 0 ? '(' : ''}{formatCurrency(Math.abs(reportData.netIncome))}{reportData.netIncome < 0 ? ')' : ''}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-background px-6 py-3 border-t border-border text-center text-xs text-text-secondary">
                Net Profit = Total Revenue − Total Expenses
            </div>
        </div>
    );
}
