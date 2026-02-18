import { Link } from 'react-router-dom';
import { ROUTES } from '../lib/routes';

const reportCards = [
    {
        title: 'Profit & Loss',
        description: 'Review income, expenses, and net income for the period.',
        to: ROUTES.REPORTS_PROFIT_LOSS
    },
    {
        title: 'Balance Sheet',
        description: 'Review assets, liabilities, and owner equity balances.',
        to: ROUTES.REPORTS_BALANCE_SHEET
    },
    {
        title: 'Transaction History',
        description: 'Review the complete journal history in report format.',
        to: ROUTES.REPORTS_TRANSACTIONS
    }
];

export default function ReportsPage() {
    return (
        <section className="space-y-6">
            <div className="bg-surface rounded-lg border border-border px-4 py-3 sm:px-6">
                <h1 className="text-lg sm:text-xl font-semibold text-text-primary">Reports</h1>
                <p className="text-sm text-text-secondary mt-1">Open a financial report module.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {reportCards.map((card) => (
                    <Link
                        key={card.title}
                        to={card.to}
                        className="bg-surface rounded-lg border border-border p-5 hover:border-primary/40 hover:bg-surface-highlight transition-colors"
                    >
                        <h2 className="text-base font-semibold text-text-primary">{card.title}</h2>
                        <p className="text-sm text-text-secondary mt-2">{card.description}</p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
