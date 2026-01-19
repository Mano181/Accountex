import { useState, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext';

export default function Reports() {
    const { transactions } = useTransactions(); // Trigger re-fetch when this changes

    const [plData, setPlData] = useState(null);
    const [bsData, setBsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const [plRes, bsRes] = await Promise.all([
                fetch('/api/reports/profit-loss'),
                fetch('/api/reports/balance-sheet')
            ]);

            const pl = await plRes.json();
            const bs = await bsRes.json();

            setPlData(pl);
            setBsData(bs);
        } catch (error) {
            console.error("Failed to load reports:", error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch reports whenever transactions change (add/edit/delete)
    useEffect(() => {
        fetchReports();
    }, [transactions]);

    if (loading || !plData || !bsData) {
        return <div className="text-center p-8">Loading Reports...</div>;
    }

    const ReportSection = ({ title, items, total, totalLabel, highlightTotal }) => (
        <div className="mb-8">
            <h3 className="text-sm text-text-secondary uppercase tracking-wider mb-2">{title}</h3>
            {items.map(item => (
                <div key={item.name} className="flex justify-between py-1 text-sm">
                    <span>{item.name}</span>
                    <span className="font-mono">{parseFloat(item.amount).toFixed(2)}</span>
                </div>
            ))}
            <div className={`flex justify-between pt-2 mt-2 border-t border-border font-bold ${highlightTotal ? 'text-lg text-primary' : ''}`}>
                <span>{totalLabel}</span>
                <span>{parseFloat(total).toFixed(2)}</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Profit & Loss Card */}
            <div className="bg-surface rounded-lg p-6 shadow-lg border border-border">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Profit & Loss</h2>
                <ReportSection title="Income" items={plData.revenue} total={plData.totalRevenue} totalLabel="Total Revenue" />
                <ReportSection title="Expenses" items={plData.expenses} total={plData.totalExpenses} totalLabel="Total Expenses" />

                <div className="mt-4 p-4 bg-surface-highlight rounded flex justify-between items-center font-bold text-lg">
                    <span>Net Income</span>
                    <span className={plData.netIncome >= 0 ? 'text-success' : 'text-danger'}>{parseFloat(plData.netIncome).toFixed(2)}</span>
                </div>
            </div>

            {/* Balance Sheet Card */}
            <div className="bg-surface rounded-lg p-6 shadow-lg border border-border">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Balance Sheet</h2>
                <ReportSection title="Assets" items={bsData.assets} total={bsData.totalAssets} totalLabel="Total Assets" />
                <ReportSection title="Liabilities" items={bsData.liabilities} total={bsData.totalLiabilities} totalLabel="Total Liabilities" />

                <div className="mb-4">
                    <h3 className="text-sm text-text-secondary uppercase tracking-wider mb-2">Equity</h3>
                    {bsData.equity.map(item => (
                        <div key={item.name} className="flex justify-between py-1 text-sm">
                            <span>{item.name}</span>
                            <span className="font-mono">{parseFloat(item.amount).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-1 text-sm italic text-text-secondary">
                        <span>Current Earnings</span>
                        <span className="font-mono">{parseFloat(bsData.netIncome).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-border font-bold">
                        <span>Total Equity</span>
                        <span>{parseFloat(bsData.totalEquity).toFixed(2)}</span>
                    </div>
                </div>

                <div className={`p-4 rounded flex justify-between items-center font-bold ${Math.abs(bsData.totalAssets - (bsData.totalLiabilities + bsData.totalEquity)) < 0.01 ? 'bg-surface-highlight text-success' : 'bg-red-900/20 text-danger'}`}>
                    <span>Balance Check (L + E)</span>
                    <span>{(bsData.totalLiabilities + bsData.totalEquity).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
