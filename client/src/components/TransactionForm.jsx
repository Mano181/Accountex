import { useState } from 'react';
import { Save } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { TRANSACTION_TYPES } from '../lib/constants';

const TYPE_LABELS = {
    [TRANSACTION_TYPES.SALES]: 'Sales',
    [TRANSACTION_TYPES.PAYMENT_RECEIVED]: 'Payment Received',
    [TRANSACTION_TYPES.PURCHASE]: 'Purchase',
    [TRANSACTION_TYPES.PURCHASE_PAYMENT]: 'Purchase Payment',
    [TRANSACTION_TYPES.EXPENSE]: 'Expense',
    [TRANSACTION_TYPES.LOAN_TAKEN]: 'Loan Taken'
};

export default function TransactionForm() {
    const { addTransaction } = useTransactions();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

        setLoading(true);
        try {
            await addTransaction({
                date,
                description,
                type,
                amount: val
            });
            setDescription('');
            setAmount('');
            setType('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface rounded-lg p-6 shadow-lg border border-border">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">New Transaction</h2>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-text-secondary mb-1">Date</label>
                        <input
                            type="date"
                            className="w-full p-2 h-[42px] rounded bg-background border border-border focus:border-primary outline-none"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-text-secondary mb-1">Description</label>
                    <input
                        type="text"
                        className="w-full p-2 h-[42px] rounded bg-background border border-border focus:border-primary outline-none"
                        placeholder="e.g. Sales to Client A"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-text-secondary mb-1">Type</label>
                        <select
                            className="w-full p-2 h-[42px] rounded bg-background border border-border focus:border-primary outline-none"
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
                        <label className="block text-sm text-text-secondary mb-1">Amount</label>
                        <input
                            type="number"
                            className="w-full p-2 h-[42px] rounded bg-background border border-border focus:border-primary outline-none"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {error && <div className="text-danger mt-4 text-sm">{error}</div>}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6 flex items-center justify-center py-3 bg-primary hover:bg-blue-600 disabled:opacity-50 rounded font-semibold transition-colors"
            >
                {loading ? 'Saving...' : <><Save size={18} className="mr-2" /> Save</>}
            </button>
        </div>
    );
}
