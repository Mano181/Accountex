"use client";

import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { CHART_OF_ACCOUNTS } from '@/lib/accounting';

export default function TransactionForm({ onTransactionAdded }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [entries, setEntries] = useState([
        { account: '', type: 'debit', amount: '' },
        { account: '', type: 'credit', amount: '' }
    ]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Flatten accounts for select
    const allAccounts = Object.entries(CHART_OF_ACCOUNTS).flatMap(([category, accounts]) =>
        accounts.map(acc => ({ name: acc, category }))
    );

    const addEntry = () => {
        setEntries([...entries, { account: '', type: 'debit', amount: '' }]);
    };

    const removeEntry = (index) => {
        if (entries.length <= 2) return;
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const calculateTotals = () => {
        let debits = 0;
        let credits = 0;
        entries.forEach(e => {
            const val = parseFloat(e.amount) || 0;
            if (e.type === 'debit') debits += val;
            else credits += val;
        });
        return { debits, credits, balanced: Math.abs(debits - credits) < 0.01 };
    };

    const { debits, credits, balanced } = calculateTotals();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!description) {
            setError('Description is required');
            return;
        }
        if (!balanced) {
            setError(`Entries are not balanced. Difference: ${(debits - credits).toFixed(2)}`);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    description,
                    entries
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save');
            }

            // Reset form
            setDescription('');
            setEntries([
                { account: '', type: 'debit', amount: '' },
                { account: '', type: 'credit', amount: '' }
            ]);
            if (onTransactionAdded) onTransactionAdded();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2 className="title">New Journal Entry</h2>

            <div className="grid-cols-2" style={{ marginBottom: '1rem' }}>
                <div>
                    <label className="text-sm">Date</label>
                    <input
                        type="date"
                        className="input"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm">Description</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g. Sold services to client"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <div className="flex-between" style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    <div style={{ flex: 2 }}>Account</div>
                    <div style={{ flex: 1, paddingLeft: '1rem' }}>Type</div>
                    <div style={{ flex: 1, paddingLeft: '1rem' }}>Amount</div>
                    <div style={{ width: '40px' }}></div>
                </div>

                {entries.map((entry, index) => (
                    <div key={index} className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <div style={{ flex: 2 }}>
                            <select
                                className="input"
                                style={{ margin: 0 }}
                                value={entry.account}
                                onChange={(e) => updateEntry(index, 'account', e.target.value)}
                            >
                                <option value="">Select Account</option>
                                {allAccounts.map(acc => (
                                    <option key={acc.name} value={acc.name}>
                                        {acc.name} ({acc.category})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, paddingLeft: '1rem' }}>
                            <select
                                className="input"
                                style={{ margin: 0 }}
                                value={entry.type}
                                onChange={(e) => updateEntry(index, 'type', e.target.value)}
                            >
                                <option value="debit">Debit</option>
                                <option value="credit">Credit</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, paddingLeft: '1rem' }}>
                            <input
                                type="number"
                                className="input"
                                style={{ margin: 0 }}
                                placeholder="0.00"
                                value={entry.amount}
                                onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                            />
                        </div>
                        <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                            {entries.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeEntry(index)}
                                    className="text-danger"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <button type="button" onClick={addEntry} className="btn" style={{ background: 'var(--surface-highlight)' }}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Line
                </button>
                <div style={{ textAlign: 'right' }}>
                    <div className={debits === credits ? 'text-success' : 'text-danger'} style={{ color: debits === credits ? 'var(--success)' : 'var(--danger)' }}>
                        Total Debits: {debits.toFixed(2)} | Total Credits: {credits.toFixed(2)}
                    </div>
                </div>
            </div>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

            <button
                onClick={handleSubmit}
                disabled={loading || !balanced || !description}
                className="btn"
                style={{ width: '100%' }}
            >
                {loading ? 'Saving...' : <><Save size={16} style={{ marginRight: '0.5rem' }} /> Save Transaction</>}
            </button>
        </div>
    );
}
