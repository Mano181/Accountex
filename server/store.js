// In-memory store
let transactions = [];

module.exports = {
    getTransactions: () => transactions,
    addTransaction: (transaction) => {
        transactions.push(transaction);
        return transaction;
    },
    updateTransaction: (id, updatedData) => {
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedData };
            return transactions[index];
        }
        return null;
    },
    deleteTransaction: (id) => {
        const initialLength = transactions.length;
        transactions = transactions.filter(t => t.id !== id);
        return transactions.length !== initialLength;
    },
    clearTransactions: () => {
        transactions = [];
    }
};
