import { useState } from 'react';
import { Save, Edit2, Trash2, Download } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { TRANSACTION_TYPES, EXPENSE_ACCOUNTS } from '../lib/constants';
import { formatCurrency, TYPE_LABELS } from '../lib/format';
import { generateTransactionPDF } from '../lib/pdf';

const formatDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
        return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
    }
    return new Date(dateVal).toISOString().split('T')[0];
};

const SALES_TYPES = new Set([
    TRANSACTION_TYPES.SALES_INVOICE,
    TRANSACTION_TYPES.CUSTOMER_PAYMENT
]);

const PURCHASE_TYPES = new Set([
    TRANSACTION_TYPES.PURCHASE_INVOICE,
    TRANSACTION_TYPES.VENDOR_PAYMENT,
    TRANSACTION_TYPES.EXPENSE
]);

const getPartyType = (type) => {
    if (SALES_TYPES.has(type)) return 'CUSTOMER';
    if (PURCHASE_TYPES.has(type) || type === TRANSACTION_TYPES.PURCHASE_INVOICE) return 'VENDOR';
    if (type === TRANSACTION_TYPES.LOAN_TAKEN || type === TRANSACTION_TYPES.LOAN_PAID) return 'LENDER';
    return null;
};

export default function Entries({
    allowedTypes = null,
    showForm = true,
    showActions = showForm,
    moduleTitle = 'Entries',
    tableTitle = 'Transaction History'
}) {
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
    const [partyName, setPartyName] = useState('');
    const [expenseAccount, setExpenseAccount] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const allowedTypeSet = allowedTypes ? new Set(allowedTypes) : null;

    const visibleTypes = Object.values(TRANSACTION_TYPES).filter(
        (txType) => !allowedTypeSet || allowedTypeSet.has(txType)
    );

    const visibleTransactions = transactions.filter(
        (tx) => !allowedTypeSet || allowedTypeSet.has(tx.type)
    );

    const handleEdit = (tx) => {
        setEditingId(tx.id);
        setDate(tx.date);
        setDescription(tx.description);
        setType(tx.type);
        setAmount(tx.amount.toString());
        setPartyName(tx.party_name || tx.partyName || '');
        setExpenseAccount(tx.expense_account || tx.expenseAccount || '');
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setType('');
        setAmount('');
        setPartyName('');
        setExpenseAccount('');
        setError('');
    };

    const requiresParty = [
        TRANSACTION_TYPES.SALES_INVOICE,
        TRANSACTION_TYPES.CUSTOMER_PAYMENT,
        TRANSACTION_TYPES.PURCHASE_INVOICE,
        TRANSACTION_TYPES.VENDOR_PAYMENT,
        TRANSACTION_TYPES.LOAN_TAKEN,
        TRANSACTION_TYPES.LOAN_PAID
    ].includes(type);

    const requiresExpenseAccount = type === TRANSACTION_TYPES.EXPENSE;

    const partyLabel = (() => {
        if (type === TRANSACTION_TYPES.SALES_INVOICE || type === TRANSACTION_TYPES.CUSTOMER_PAYMENT) {
            return 'Store / Customer';
        }
        if (type === TRANSACTION_TYPES.PURCHASE_INVOICE || type === TRANSACTION_TYPES.VENDOR_PAYMENT) {
            return 'Store / Supplier';
        }
        if (type === TRANSACTION_TYPES.LOAN_TAKEN || type === TRANSACTION_TYPES.LOAN_PAID) {
            return 'Lender';
        }
        return 'Party';
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!type || !amount || !description) {
            setError('All fields are required');
            return;
        }

        if (requiresParty && !partyName.trim()) {
            setError('Please enter the store/party name');
            return;
        }

        if (requiresExpenseAccount && !expenseAccount) {
            setError('Please choose an expense account');
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
            const partyType = (() => {
                return getPartyType(type);
            })();

            const transactionData = {
                date,
                description,
                type,
                amount: val,
                partyName: partyName.trim() || null,
                partyType,
                expenseAccount: expenseAccount || null
            };

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
        <div className="space-y-6 sm:space-y-8">
            <section className="bg-surface rounded-lg border border-border px-4 py-3 sm:px-6">
                <h1 className="text-lg sm:text-xl font-semibold text-text-primary">{moduleTitle}</h1>
            </section>

            {/* Entry Form */}
            {showForm && (
                <div id="entry-form" className={`rounded-lg p-4 sm:p-6 border ${editingId ? 'bg-blue-900/10 border-blue-500/50' : 'bg-surface border-border'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">
                        {editingId ? 'Edit Entry' : 'New Entry'}
                    </h2>
                    {editingId && (
                        <button onClick={handleCancel} className="text-sm text-text-secondary hover:text-text-primary">
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wide">Date</label>
                        <input
                            type="date"
                            id="entry-date"
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
                    {requiresParty && (
                        <div>
                            <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wide">{partyLabel}</label>
                            <input
                                type="text"
                                className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
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
                    {requiresExpenseAccount && (
                        <div>
                            <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wide">Expense Account</label>
                            <select
                                className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
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
                        <label className="block text-xs text-text-secondary mb-1 uppercase tracking-wide">Type</label>
                        <select
                            className="w-full p-2.5 h-[42px] rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">Select Type</option>
                            {visibleTypes.map((txType) => (
                                <option key={txType} value={txType}>{TYPE_LABELS[txType]}</option>
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

                    <div className="sm:col-span-2 xl:col-span-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded font-medium text-sm transition-colors w-full sm:w-auto ${editingId ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-primary hover:bg-blue-600'}`}
                        >
                            <Save size={16} />
                            {loading ? 'Saving...' : (editingId ? 'Update Entry' : 'Save Entry')}
                        </button>
                        {error && <span className="text-danger text-sm">{error}</span>}
                    </div>
                </form>
            </div>
            )}

            <datalist id="customer-list">
                {[...new Set(visibleTransactions.filter(tx => tx.party_type === 'CUSTOMER' || tx.partyType === 'CUSTOMER').map(tx => tx.party_name || tx.partyName).filter(Boolean))].map(name => (
                    <option key={name} value={name} />
                ))}
            </datalist>
            <datalist id="vendor-list">
                {[...new Set(visibleTransactions.filter(tx => tx.party_type === 'VENDOR' || tx.partyType === 'VENDOR').map(tx => tx.party_name || tx.partyName).filter(Boolean))].map(name => (
                    <option key={name} value={name} />
                ))}
            </datalist>
            <datalist id="lender-list">
                {[...new Set(visibleTransactions.filter(tx => tx.party_type === 'LENDER' || tx.partyType === 'LENDER').map(tx => tx.party_name || tx.partyName).filter(Boolean))].map(name => (
                    <option key={name} value={name} />
                ))}
            </datalist>

            {/* Transaction Table */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">{tableTitle}</h2>
                    <button
                        onClick={() => generateTransactionPDF(visibleTransactions)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-highlight hover:bg-surface text-text-secondary hover:text-primary rounded border border-border transition-colors text-xs font-medium w-full sm:w-auto"
                        title="Download PDF"
                        disabled={visibleTransactions.length === 0}
                    >
                        <Download size={14} />
                        Download PDF
                    </button>
                </div>

                {/* Compact Mobile List */}
                <div className="sm:hidden divide-y divide-border">
                    {visibleTransactions.slice().reverse().map(tx => (
                        <div key={tx.id} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{tx.description}</p>
                                    <p className="text-xs text-text-secondary">
                                        {formatDate(tx.date)} • {TYPE_LABELS[tx.type] || tx.type}
                                    </p>
                                </div>
                                <p className="font-mono text-sm">{formatCurrency(tx.amount)}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                                <span className="truncate">{tx.party_name || tx.partyName || 'No party'}</span>
                                {showActions && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(tx)}
                                            className="p-1.5 rounded hover:bg-surface-highlight text-text-secondary hover:text-primary transition-colors"
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
                                            className="p-1.5 rounded hover:bg-surface-highlight text-text-secondary hover:text-danger transition-colors"
                                            title="Delete Entry"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {visibleTransactions.length === 0 && (
                        <div className="p-8 text-center text-text-secondary text-sm">No entries found.</div>
                    )}
                </div>

                {/* Standard Table (Tablet and Up) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                        <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                            <tr>
                                <th className="text-left p-3 sm:p-4">Date</th>
                                <th className="text-left p-3 sm:p-4">Description</th>
                                <th className="text-left p-3 sm:p-4">Type</th>
                                <th className="text-left p-3 sm:p-4">Party</th>
                                <th className="text-right p-3 sm:p-4">Amount</th>
                                {showActions && <th className="text-center p-3 sm:p-4">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {visibleTransactions.slice().reverse().map(tx => (
                                <tr key={tx.id} className={`transition-colors ${editingId === tx.id ? 'bg-yellow-500/10' : 'hover:bg-surface-highlight/50'}`}>
                                    <td className="p-3 sm:p-4 text-text-secondary whitespace-nowrap">{formatDate(tx.date)}</td>
                                    <td className="p-3 sm:p-4 font-medium">{tx.description}</td>
                                    <td className="p-3 sm:p-4 text-text-secondary">{TYPE_LABELS[tx.type] || tx.type}</td>
                                    <td className="p-3 sm:p-4 text-text-secondary">{tx.party_name || tx.partyName || '-'}</td>
                                    <td className="p-3 sm:p-4 text-right font-mono font-medium">{formatCurrency(tx.amount)}</td>
                                    {showActions && (
                                        <td className="p-3 sm:p-4 text-center">
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
                                    )}
                                </tr>
                            ))}
                            {visibleTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={showActions ? 6 : 5} className="p-8 text-center text-text-secondary">No entries found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
