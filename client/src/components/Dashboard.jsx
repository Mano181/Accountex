import { useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { getGuestProfitLoss, getGuestBalanceSheet } from '../lib/guestAccounting';
import { formatCurrency, formatDate, TYPE_LABELS } from '../lib/format';
import { TRANSACTION_TYPES } from '../lib/constants';
import { ArrowDownRight, ArrowUpRight, Layers, Scale, TrendingUp, Wallet } from 'lucide-react';

const INFLOW_TYPES = new Set([
    TRANSACTION_TYPES.SALES,
    TRANSACTION_TYPES.PAYMENT_RECEIVED,
    TRANSACTION_TYPES.LOAN_TAKEN
]);

const OUTFLOW_TYPES = new Set([
    TRANSACTION_TYPES.PURCHASE,
    TRANSACTION_TYPES.PURCHASE_PAYMENT,
    TRANSACTION_TYPES.EXPENSE,
    TRANSACTION_TYPES.LOAN_PAID
]);

const StatCard = ({ label, value, hint, icon: Icon, tone = 'default' }) => {
    const toneStyles = {
        default: 'bg-surface border-border text-text-primary',
        success: 'bg-success/10 border-success/20 text-success',
        danger: 'bg-danger/10 border-danger/20 text-danger'
    };

    return (
        <div className={`rounded-lg border p-4 ${toneStyles[tone]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
                    <p className="text-xl font-semibold mt-1">{value}</p>
                    {hint ? <p className="text-xs text-text-secondary mt-1">{hint}</p> : null}
                </div>
                {Icon ? <Icon className="text-text-secondary" size={22} /> : null}
            </div>
        </div>
    );
};

const formatPeriod = (dates) => {
    if (!dates.length) return 'No transactions yet';
    const sorted = dates.sort((a, b) => a - b);
    return `${formatDate(sorted[0])} - ${formatDate(sorted[sorted.length - 1])}`;
};

export default function Dashboard() {
    const { transactions, loading } = useTransactions();

    const metrics = useMemo(() => {
        const inflow = transactions.reduce((sum, tx) => {
            if (INFLOW_TYPES.has(tx.type)) return sum + (parseFloat(tx.amount) || 0);
            return sum;
        }, 0);

        const outflow = transactions.reduce((sum, tx) => {
            if (OUTFLOW_TYPES.has(tx.type)) return sum + (parseFloat(tx.amount) || 0);
            return sum;
        }, 0);

        const pl = getGuestProfitLoss(transactions);
        const bs = getGuestBalanceSheet(transactions);
        const dates = transactions
            .map(tx => new Date(tx.date || tx.timestamp))
            .filter(date => !Number.isNaN(date.getTime()));

        return {
            inflow,
            outflow,
            netCash: inflow - outflow,
            totalCount: transactions.length,
            netIncome: pl.netIncome,
            totalAssets: bs.totalAssets,
            totalLiabilities: bs.totalLiabilities,
            totalEquity: bs.totalEquity,
            period: formatPeriod(dates)
        };
    }, [transactions]);

    const recentTransactions = useMemo(() => {
        return transactions
            .slice()
            .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp))
            .slice(0, 5);
    }, [transactions]);

    if (loading) {
        return <div className="text-center text-text-secondary py-4">Loading dashboard...</div>;
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold">Dashboard Overview</h2>
                    <p className="text-sm text-text-secondary">Period: {metrics.period}</p>
                </div>
                <div className="text-xs text-text-secondary">
                    {metrics.totalCount} total transactions
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Inflow"
                    value={formatCurrency(metrics.inflow)}
                    hint="Sales, payments, loans"
                    icon={ArrowUpRight}
                    tone="success"
                />
                <StatCard
                    label="Total Outflow"
                    value={formatCurrency(metrics.outflow)}
                    hint="Purchases, expenses, repayments"
                    icon={ArrowDownRight}
                    tone="danger"
                />
                <StatCard
                    label="Net Cash"
                    value={formatCurrency(metrics.netCash)}
                    hint="Inflow minus outflow"
                    icon={Wallet}
                />
                <StatCard
                    label="Net Income"
                    value={formatCurrency(metrics.netIncome)}
                    hint="Based on entries"
                    icon={TrendingUp}
                    tone={metrics.netIncome >= 0 ? 'success' : 'danger'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-surface rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">Recent Activity</h3>
                        <span className="text-xs text-text-secondary">Last 5 entries</span>
                    </div>
                    {recentTransactions.length === 0 ? (
                        <p className="text-sm text-text-secondary">No recent transactions.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-medium">{tx.description}</p>
                                        <p className="text-xs text-text-secondary">
                                            {formatDate(tx.date)} • {TYPE_LABELS[tx.type] || tx.type}
                                        </p>
                                    </div>
                                    <p className="font-mono">{formatCurrency(tx.amount)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-surface rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Scale size={16} />
                        Balance Snapshot
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Total Assets</span>
                        <span className="font-mono">{formatCurrency(metrics.totalAssets)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Total Liabilities</span>
                        <span className="font-mono">{formatCurrency(metrics.totalLiabilities)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Total Equity</span>
                        <span className="font-mono">{formatCurrency(metrics.totalEquity)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border">
                        <span>Derived from entries</span>
                        <Layers size={14} />
                    </div>
                </div>
            </div>
        </section>
    );
}
