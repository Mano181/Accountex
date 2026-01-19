import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '@clerk/clerk-react';
import { formatCurrency } from '../lib/format';
import { getGuestBalanceSheet } from '../lib/guestAccounting';
import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function BalanceSheetReport() {
    const { transactions, loading } = useTransactions();
    const { isSignedIn, isLoaded } = useAuth();
    const [reportData, setReportData] = useState(null);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn) {
            setFetching(true);
            fetch('/api/reports/balance-sheet')
                .then(res => res.json())
                .then(data => {
                    setReportData(data);
                    setFetching(false);
                })
                .catch(err => {
                    console.error("Failed to fetch Balance Sheet:", err);
                    setFetching(false);
                });
        } else {
            setReportData(getGuestBalanceSheet(transactions));
        }
    }, [isSignedIn, isLoaded, transactions]);

    if (loading || (!reportData && fetching)) {
        return <div className="text-center py-8">Loading Report...</div>;
    }

    if (!reportData) {
        return <div className="text-center py-8 text-text-secondary">No data available</div>;
    }

    const { totalAssets, totalLiabilities, totalEquity, assets, liabilities, equity, netIncome } = reportData;
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

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
                <p className="text-xs text-text-secondary mt-1">
                    {isSignedIn ? 'Real-time Database' : 'Guest Session Data'}
                </p>
            </div>

            {/* Report Body */}
            <div className="p-6 space-y-6">
                {/* Assets */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Assets</h3>
                    <div className="space-y-1">
                        {assets.map(item => (
                            <ReportLine key={item.name} label={item.name} value={formatCurrency(item.amount)} indent />
                        ))}
                        <ReportLine label="Total Assets" value={formatCurrency(totalAssets)} bold highlight />
                    </div>
                </section>

                {/* Liabilities */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Liabilities</h3>
                    <div className="space-y-1">
                        {liabilities.map(item => (
                            <ReportLine key={item.name} label={item.name} value={formatCurrency(item.amount)} indent />
                        ))}
                        <ReportLine label="Total Liabilities" value={formatCurrency(totalLiabilities)} bold />
                    </div>
                </section>

                {/* Equity */}
                <section>
                    <h3 className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-3">Equity</h3>
                    <div className="space-y-1">
                        {equity.map(item => (
                            <ReportLine key={item.name} label={item.name} value={formatCurrency(item.amount)} indent />
                        ))}
                        <ReportLine label="Net Income (Current Period)" value={formatCurrency(netIncome)} indent />
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
