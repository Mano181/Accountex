export default function BalanceSheet({ data }) {
    const { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, netIncome } = data;

    return (
        <div className="card">
            <h2 className="title">Balance Sheet</h2>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>ASSETS</h3>
                {assets.map(item => (
                    <div key={item.name} className="flex-between" style={{ padding: '0.25rem 0' }}>
                        <span>{item.name}</span>
                        <span>{item.amount.toFixed(2)}</span>
                    </div>
                ))}
                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                    <span>Total Assets</span>
                    <span>{totalAssets.toFixed(2)}</span>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>LIABILITIES</h3>
                {liabilities.map(item => (
                    <div key={item.name} className="flex-between" style={{ padding: '0.25rem 0' }}>
                        <span>{item.name}</span>
                        <span>{item.amount.toFixed(2)}</span>
                    </div>
                ))}
                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                    <span>Total Liabilities</span>
                    <span>{totalLiabilities.toFixed(2)}</span>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>EQUITY</h3>
                {equity.map(item => (
                    <div key={item.name} className="flex-between" style={{ padding: '0.25rem 0' }}>
                        <span>{item.name}</span>
                        <span>{item.amount.toFixed(2)}</span>
                    </div>
                ))}
                <div className="flex-between" style={{ padding: '0.25rem 0', fontStyle: 'italic' }}>
                    <span>Current Period Earnings</span>
                    <span style={{ color: netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>{netIncome.toFixed(2)}</span>
                </div>
                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                    <span>Total Equity</span>
                    <span>{totalEquity.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex-between" style={{ background: 'var(--surface-highlight)', padding: '1rem', borderRadius: 'var(--radius)', fontWeight: 'bold' }}>
                <span>check: L + E</span>
                <span style={{ color: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 'var(--success)' : 'var(--danger)' }}>
                    {(totalLiabilities + totalEquity).toFixed(2)}
                </span>
            </div>
        </div>
    );
}
