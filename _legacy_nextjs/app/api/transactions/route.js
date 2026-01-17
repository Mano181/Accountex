import { NextResponse } from 'next/server';
import { getTransactions, saveTransaction } from '@/lib/db';
import { validateTransaction } from '@/lib/accounting';

export async function GET() {
    const transactions = getTransactions();
    return NextResponse.json(transactions);
}

export async function POST(request) {
    try {
        const data = await request.json();

        // Basic validation
        if (!data.date || !data.description || !data.entries || data.entries.length < 2) {
            return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
        }

        // Accounting validation (Dr = Cr)
        if (!validateTransaction(data.entries)) {
            return NextResponse.json({ error: 'Debits must equal Credits' }, { status: 400 });
        }

        const newTransaction = {
            id: Date.now().toString(),
            date: data.date,
            description: data.description,
            entries: data.entries.map(e => ({
                account: e.account,
                type: e.type,
                amount: parseFloat(e.amount)
            })),
            timestamp: new Date().toISOString()
        };

        saveTransaction(newTransaction);

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
    }
}
