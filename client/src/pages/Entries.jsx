import { useState } from 'react';
import { Save, Edit2, Trash2 } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { TRANSACTION_TYPES } from '../lib/constants';
import { formatCurrency, TYPE_LABELS } from '../lib/format';

export default function Entries() {
    const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
    // Use local date instead of UTC to avoid incorrect date in early morning
    const [date, setDate] = useState(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().split('T')[0];
    });
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [amount, setAmount] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEdit = (tx) => {
        setEditingId(tx.id);
        setDate(tx.date);
        setDescription(tx.description);
        setType(tx.type);
        setAmount(tx.amount.toString());
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setType('');
        setAmount('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!type || !amount || !description) {
            setError('All fields are required');
            return;
        }

        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            setError('Amount must be positive');
            return;
        }

        const year = parseInt(date.split('-')[0]);
        if (year < 2000 || year > 2100) {
            setError('Please enter a valid year (2000-2100)');
            return;
        }

        setLoading(true);
        try {
            const transactionData = { date, description, type, amount: val };

            if (editingId) {
                await updateTransaction(editingId, transactionData);
            } else {
                await addTransaction(transactionData);
            }

            handleCancel(); // Reset form
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Entry Form */}
            <div className={`rounded-lg p-6 border ${editingId ? 'bg-blue-900/10 border-blue-500/50' : 'bg-surface border-border'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">
                        {editingId ? 'Edit Entry' : 'New Entry'}
                    </h2>
                    {editingId && (
                        <button onClick={handleCancel} className="text-sm text-text-secondary hover:text-text-primary">
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wide">Date</label>
                        <input
                            type="date"
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wide">Description</label>
                        <input
                            type="text"
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            placeholder="e.g. Office Supplies"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wide">Type</label>
                        <select
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">Select Type</option>
                            {Object.entries(TRANSACTION_TYPES).map(([key, val]) => (
                                <option key={key} value={val}>{TYPE_LABELS[val]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wide">Amount</label>
                        <input
                            type="number"
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded font-medium text-sm transition-colors ${editingId ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-primary hover:bg-blue-600'}`}
                        >
                            <Save size={16} />
                            {loading ? 'Saving...' : (editingId ? 'Update Entry' : 'Save Entry')}
                        </button>
                        {error && <span className="text-danger text-sm">{error}</span>}
                    </div>
                </form>
            </div>

            {/* Transaction Table */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-text-primary">Transaction History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                            <tr>
                                <th className="text-left p-4">Date</th>
                                <th className="text-left p-4">Description</th>
                                <th className="text-left p-4">Type</th>
                                <th className="text-right p-4">Amount</th>
                                <th className="text-center p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {transactions.slice().reverse().map(tx => (
                                <tr key={tx.id} className={`transition-colors ${editingId === tx.id ? 'bg-yellow-500/10' : 'hover:bg-surface-highlight/50'}`}>
                                    <td className="p-4 text-text-secondary whitespace-nowrap">{tx.date}</td>
                                    <td className="p-4 font-medium">{tx.description}</td>
                                    <td className="p-4 text-text-secondary">{TYPE_LABELS[tx.type] || tx.type}</td>
                                    <td className="p-4 text-right font-mono font-medium">{formatCurrency(tx.amount)}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(tx)}
                                                className="p-1.5 hover:bg-surface rounded text-text-secondary hover:text-primary transition-colors"
                                                title="Edit Entry"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to delete this entry?')) {
                                                        await deleteTransaction(tx.id);
                                                    }
                                                }}
                                                className="p-1.5 hover:bg-surface rounded text-text-secondary hover:text-danger transition-colors"
                                                title="Delete Entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-secondary">No entries found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
