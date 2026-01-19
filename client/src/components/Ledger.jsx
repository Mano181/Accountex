import { useTransactions } from '../context/TransactionContext';

const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
        // If it's a string, try to just split it if it has 'T'
        if (typeof dateVal === 'string') {
            if (dateVal.includes('T')) return dateVal.split('T')[0];
            return dateVal;
        }
        // If it's a Date object
        if (dateVal instanceof Date) {
            return dateVal.toISOString().split('T')[0];
        }
        // Fallback
        return new Date(dateVal).toISOString().split('T')[0];
    } catch (e) {
        console.error("Date error", dateVal, e);
        return String(dateVal);
    }
};

export default function Ledger() {
    const { transactions } = useTransactions();

    return (
        <div className="bg-surface rounded-lg p-6 shadow-lg border border-border mt-8">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Recent Transactions</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border text-text-header text-sm">
                            <th className="p-4">Date (V2)</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Entries</th>
                            <th className="p-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice().reverse().map(tx => (
                            <tr key={tx.id} className="border-b border-border hover:bg-surface-highlight transition-colors">
                                <td className="p-4 align-top text-text-secondary">
                                    {formatDate(tx.date)}
                                </td>
                                <td className="p-4 align-top font-medium">{tx.description}</td>
                                <td className="p-4">
                                    {tx.entries.map((e, i) => (
                                        <div key={i} className="flex justify-between text-sm mb-1">
                                            <span className={`${e.type === 'credit' ? 'pl-4 text-text-secondary' : 'text-text-primary'}`}>
                                                {e.account}
                                            </span>
                                        </div>
                                    ))}
                                </td>
                                <td className="p-4 text-right align-top font-bold text-text-primary">
                                    {tx.entries.filter(e => e.type === 'debit').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-text-secondary">No transactions recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
