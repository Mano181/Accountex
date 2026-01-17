export default function Ledger({ transactions }) {
    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <h2 className="title">Recent Transactions</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Description</th>
                            <th style={{ padding: '1rem' }}>Details</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice().reverse().map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', verticalAlign: 'top' }}>{tx.date}</td>
                                <td style={{ padding: '1rem', verticalAlign: 'top' }}>{tx.description}</td>
                                <td style={{ padding: '1rem' }}>
                                    {tx.entries.map((e, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ color: e.type === 'debit' ? 'var(--text-primary)' : 'var(--text-secondary)', paddingLeft: e.type === 'credit' ? '1rem' : '0' }}>
                                                {e.account}
                                            </span>
                                        </div>
                                    ))}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'top' }}>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {tx.entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No transactions recorded.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
