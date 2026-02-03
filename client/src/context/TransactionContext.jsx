import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { generateEntriesFromType } from '../lib/constants';

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

const GUEST_STORAGE_KEY = 'guest_transactions';

export const TransactionProvider = ({ children }) => {
    const { isSignedIn, isLoaded } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        if (!isLoaded) return;

        if (isSignedIn) {
            try {
                const res = await fetch('/api/transactions');
                const data = await res.json();
                setTransactions(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
            } finally {
                setLoading(false);
            }
        } else {
            // Guest Mode - sessionStorage
            const stored = sessionStorage.getItem(GUEST_STORAGE_KEY);
            setTransactions(stored ? JSON.parse(stored) : []);
            setLoading(false);
        }
    };

    const addTransaction = async (transaction) => {
        if (isSignedIn) {
            try {
                const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transaction)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to save');
                }
                await fetchTransactions();
                return true;
            } catch (error) {
                throw error;
            }
        } else {
            // Guest Mode
            const newTx = {
                ...transaction,
                id: crypto.randomUUID(),
                entries: generateEntriesFromType(transaction.type, transaction.amount, {
                    expenseAccount: transaction.expenseAccount
                }),
                timestamp: new Date().toISOString()
            };
            const updated = [...transactions, newTx];
            sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
            setTransactions(updated);
            return true;
        }
    };

    const updateTransaction = async (id, transaction) => {
        if (isSignedIn) {
            try {
                const res = await fetch(`/api/transactions/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transaction)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to update');
                }
                await fetchTransactions();
                return true;
            } catch (error) {
                throw error;
            }
        } else {
            // Guest Mode
            const updated = transactions.map(tx => {
                if (tx.id === id) {
                    return {
                        ...tx,
                        ...transaction,
                        entries: generateEntriesFromType(transaction.type, transaction.amount, {
                            expenseAccount: transaction.expenseAccount
                        })
                    };
                }
                return tx;
            });
            sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
            setTransactions(updated);
            return true;
        }
    };

    const deleteTransaction = async (id) => {
        if (isSignedIn) {
            try {
                const res = await fetch(`/api/transactions/${id}`, {
                    method: 'DELETE'
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to delete');
                }
                await fetchTransactions();
                return true;
            } catch (error) {
                throw error;
            }
        } else {
            // Guest Mode
            const updated = transactions.filter(tx => tx.id !== id);
            sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
            setTransactions(updated);
            return true;
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [isSignedIn, isLoaded]);

    return (
        <TransactionContext.Provider value={{ transactions, loading, addTransaction, updateTransaction, deleteTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
};
