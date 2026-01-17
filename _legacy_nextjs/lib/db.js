import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'transactions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read transactions
export function getTransactions() {
    if (!fs.existsSync(FILE_PATH)) {
        return [];
    }
    const fileData = fs.readFileSync(FILE_PATH, 'utf8');
    try {
        return JSON.parse(fileData);
    } catch (error) {
        return [];
    }
}

// Helper to write transactions
export function saveTransaction(transaction) {
    const transactions = getTransactions();
    transactions.push(transaction);
    fs.writeFileSync(FILE_PATH, JSON.stringify(transactions, null, 2));
    return transaction;
}

// Helper to clear transactions (for testing)
export function clearTransactions() {
    fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
}
