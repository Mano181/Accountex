import { useTransactions } from '../context/TransactionContext';

export default function Ledger() {
    const { transactions } = useTransactions();

    return (
        <div className="bg-surface rounded-lg p-6 shadow-lg border border-border mt-8">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">Recent Transactions</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border text-text-secondary text-sm">
                            <th className="p-4">Date</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Entries</th>
                            <th className="p-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice().reverse().map(tx => (
                            <tr key={tx.id} className="border-b border-border hover:bg-surface-highlight transition-colors">
                                <td className="p-4 align-top text-text-secondary">{new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}</td>
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
