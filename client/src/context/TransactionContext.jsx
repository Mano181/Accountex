import { createContext, useState, useEffect, useContext } from 'react';

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/transactions');
            const data = await res.json();
            setTransactions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async (transaction) => {
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
            await fetchTransactions(); // Refresh list
            return true;
        } catch (error) {
            throw error;
        }
    };

    const updateTransaction = async (id, transaction) => {
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
            await fetchTransactions(); // Refresh list
            return true;
        } catch (error) {
            throw error;
        }
    };

    const deleteTransaction = async (id) => {
        try {
            const res = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete');
            }
            await fetchTransactions(); // Refresh
            return true;
        } catch (error) {
            throw error;
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    return (
        <TransactionContext.Provider value={{ transactions, loading, addTransaction, updateTransaction, deleteTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
};
