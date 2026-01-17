export default function ProfitLoss({ data }) {
    const { revenue, expenses, totalRevenue, totalExpenses, netIncome } = data;

    return (
        <div className="card">
            <h2 className="title">Profit & Loss</h2>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>REVENUE</h3>
                {revenue.map(item => (
                    <div key={item.name} className="flex-between" style={{ padding: '0.25rem 0' }}>
                        <span>{item.name}</span>
                        <span>{item.amount.toFixed(2)}</span>
                    </div>
                ))}
                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                    <span>Total Revenue</span>
                    <span>{totalRevenue.toFixed(2)}</span>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>EXPENSES</h3>
                {expenses.map(item => (
                    <div key={item.name} className="flex-between" style={{ padding: '0.25rem 0' }}>
                        <span>{item.name}</span>
                        <span>{item.amount.toFixed(2)}</span>
                    </div>
                ))}
                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                    <span>Total Expenses</span>
                    <span>{totalExpenses.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex-between" style={{ background: 'var(--surface-highlight)', padding: '1rem', borderRadius: 'var(--radius)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                <span>Net Income</span>
                <span style={{ color: netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {netIncome.toFixed(2)}
                </span>
            </div>
        </div>
    );
}
