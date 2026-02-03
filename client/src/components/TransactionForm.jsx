import { useState } from 'react';
import { Save } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { TRANSACTION_TYPES, TYPE_LABELS, EXPENSE_ACCOUNTS } from '../lib/constants';

export default function TransactionForm() {
    const { addTransaction, transactions } = useTransactions();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [amount, setAmount] = useState('');
    const [partyName, setPartyName] = useState('');
    const [expenseAccount, setExpenseAccount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!type || !amount || !description) {
            setError('All fields are required');
            return;
        }

        const requiresParty = [
            TRANSACTION_TYPES.SALES_INVOICE,
            TRANSACTION_TYPES.CUSTOMER_PAYMENT,
            TRANSACTION_TYPES.PURCHASE_INVOICE,
            TRANSACTION_TYPES.VENDOR_PAYMENT,
            TRANSACTION_TYPES.LOAN_TAKEN,
            TRANSACTION_TYPES.LOAN_PAID
        ].includes(type);

        if (requiresParty && !partyName.trim()) {
            setError('Please enter the store/party name');
            return;
        }

        if (type === TRANSACTION_TYPES.EXPENSE && !expenseAccount) {
            setError('Please choose an expense account');
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
                amount: val,
                partyName: partyName.trim() || null,
                partyType: requiresParty ? (type === TRANSACTION_TYPES.SALES_INVOICE || type === TRANSACTION_TYPES.CUSTOMER_PAYMENT ? 'CUSTOMER' : (type === TRANSACTION_TYPES.PURCHASE_INVOICE || type === TRANSACTION_TYPES.VENDOR_PAYMENT ? 'VENDOR' : 'LENDER')) : null,
                expenseAccount: expenseAccount || null
            });
            setDescription('');
            setAmount('');
            setType('');
            setPartyName('');
            setExpenseAccount('');
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
                    {(type === TRANSACTION_TYPES.SALES_INVOICE || type === TRANSACTION_TYPES.CUSTOMER_PAYMENT || type === TRANSACTION_TYPES.PURCHASE_INVOICE || type === TRANSACTION_TYPES.VENDOR_PAYMENT || type === TRANSACTION_TYPES.LOAN_TAKEN || type === TRANSACTION_TYPES.LOAN_PAID) && (
                        <div>
                            <label className="block text-sm text-text-secondary mb-1">Store / Party</label>
                            <input
                                type="text"
                                className="w-full p-2 h-[42px] rounded bg-background border border-border focus:border-primary outline-none"
                                placeholder="e.g. Store A"
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                                list={
                                    type === TRANSACTION_TYPES.SALES_INVOICE || type === TRANSACTION_TYPES.CUSTOMER_PAYMENT
                                        ? 'customer-list'
                                        : type === TRANSACTION_TYPES.PURCHASE_INVOICE || type === TRANSACTION_TYPES.VENDOR_PAYMENT
                                            ? 'vendor-list'
                                            : 'lender-list'
                                }
                            />
                        </div>
                    )}
                    {type === TRANSACTION_TYPES.EXPENSE && (
                        <div>
                            <label className="block text-sm text-text-secondary mb-1">Expense Account</label>
                            <select
                                className="w-full p-2 h-[42px] rounded bg-background border border-border focus:border-primary outline-none appearance-none"
                                value={expenseAccount}
                                onChange={(e) => setExpenseAccount(e.target.value)}
                            >
                                <option value="">Select Account</option>
                                {EXPENSE_ACCOUNTS.map(account => (
                                    <option key={account} value={account}>{account}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-text-secondary mb-1">Type</label>
                        <select
                            className="w-full p-2 h-[42px] rounded bg-background border border-border focus:border-primary outline-none appearance-none"
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

            <datalist id="customer-list">
                {[...new Set(transactions.filter(tx => tx.party_type === 'CUSTOMER' || tx.partyType === 'CUSTOMER').map(tx => tx.party_name || tx.partyName).filter(Boolean))].map(name => (
                    <option key={name} value={name} />
                ))}
            </datalist>
            <datalist id="vendor-list">
                {[...new Set(transactions.filter(tx => tx.party_type === 'VENDOR' || tx.partyType === 'VENDOR').map(tx => tx.party_name || tx.partyName).filter(Boolean))].map(name => (
                    <option key={name} value={name} />
                ))}
            </datalist>
            <datalist id="lender-list">
                {[...new Set(transactions.filter(tx => tx.party_type === 'LENDER' || tx.partyType === 'LENDER').map(tx => tx.party_name || tx.partyName).filter(Boolean))].map(name => (
                    <option key={name} value={name} />
                ))}
            </datalist>
        </div>
    );
}
