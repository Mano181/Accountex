import { useTransactions } from '../context/TransactionContext';
import { CHART_OF_ACCOUNTS, ACCOUNT_TYPES, getAccountType } from '../lib/constants';

export default function Reports() {
    const { transactions } = useTransactions();

    // Calculate balances
    const balances = {};
    Object.values(CHART_OF_ACCOUNTS).flat().forEach(acc => balances[acc] = 0);

    transactions.forEach(tx => {
        tx.entries.forEach(entry => {
            const amount = parseFloat(entry.amount) || 0;
            const type = getAccountType(entry.account);

            // Standard Normal Balances
            if (type === ACCOUNT_TYPES.ASSET || type === ACCOUNT_TYPES.EXPENSE) {
                if (entry.type === 'debit') balances[entry.account] += amount;
                else balances[entry.account] -= amount;
            } else {
                if (entry.type === 'credit') balances[entry.account] += amount;
                else balances[entry.account] -= amount;
            }
        });
    });

    // P&L
    const revenue = CHART_OF_ACCOUNTS.REVENUE.map(acc => ({ name: acc, amount: balances[acc] }));
    const expenses = CHART_OF_ACCOUNTS.EXPENSES.map(acc => ({ name: acc, amount: balances[acc] }));
    const totalRev = revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalExp = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRev - totalExp;

    // Balance Sheet
    const assets = CHART_OF_ACCOUNTS.ASSETS.map(acc => ({ name: acc, amount: balances[acc] }));
    const liabilities = CHART_OF_ACCOUNTS.LIABILITIES.map(acc => ({ name: acc, amount: balances[acc] }));
    const equity = CHART_OF_ACCOUNTS.EQUITY.map(acc => ({ name: acc, amount: balances[acc] }));

    // Add Net Income to Retained Earnings (simplified)
    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0) + netIncome;

    const ReportSection = ({ title, items, total, totalLabel, highlightTotal }) => (
        <div className="mb-8">
            <h3 className="text-sm text-text-secondary uppercase tracking-wider mb-2">{title}</h3>
            {items.map(item => (
                <div key={item.name} className="flex justify-between py-1 text-sm">
                    <span>{item.name}</span>
                    <span className="font-mono">{item.amount.toFixed(2)}</span>
                </div>
            ))}
            <div className={`flex justify-between pt-2 mt-2 border-t border-border font-bold ${highlightTotal ? 'text-lg text-primary' : ''}`}>
                <span>{totalLabel}</span>
                <span>{total.toFixed(2)}</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Profit & Loss Card */}
            <div className="bg-surface rounded-lg p-6 shadow-lg border border-border">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Profit & Loss</h2>
                <ReportSection title="Income" items={revenue} total={totalRev} totalLabel="Total Revenue" />
                <ReportSection title="Expenses" items={expenses} total={totalExp} totalLabel="Total Expenses" />

                <div className="mt-4 p-4 bg-surface-highlight rounded flex justify-between items-center font-bold text-lg">
                    <span>Net Income</span>
                    <span className={netIncome >= 0 ? 'text-success' : 'text-danger'}>{netIncome.toFixed(2)}</span>
                </div>
            </div>

            {/* Balance Sheet Card */}
            <div className="bg-surface rounded-lg p-6 shadow-lg border border-border">
                <h2 className="text-xl font-semibold mb-4 text-text-primary">Balance Sheet</h2>
                <ReportSection title="Assets" items={assets} total={totalAssets} totalLabel="Total Assets" />
                <ReportSection title="Liabilities" items={liabilities} total={totalLiabilities} totalLabel="Total Liabilities" />

                <div className="mb-4">
                    <h3 className="text-sm text-text-secondary uppercase tracking-wider mb-2">Equity</h3>
                    {equity.map(item => (
                        <div key={item.name} className="flex justify-between py-1 text-sm">
                            <span>{item.name}</span>
                            <span className="font-mono">{item.amount.toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-1 text-sm italic text-text-secondary">
                        <span>Current Earnings</span>
                        <span className="font-mono">{netIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-border font-bold">
                        <span>Total Equity</span>
                        <span>{totalEquity.toFixed(2)}</span>
                    </div>
                </div>

                <div className={`p-4 rounded flex justify-between items-center font-bold ${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 'bg-surface-highlight text-success' : 'bg-red-900/20 text-danger'}`}>
                    <span>Balance Check (L + E)</span>
                    <span>{(totalLiabilities + totalEquity).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
