import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';

const salesNavItems = [
    { label: 'Customers', path: ROUTES.SALES_CUSTOMERS },
    { label: 'Invoices', path: ROUTES.SALES_INVOICES },
    { label: 'Payments Outstanding', path: ROUTES.SALES_OUTSTANDING },
    { label: 'Payments Received', path: ROUTES.SALES_PAYMENTS }
];

export default function SalesLayout() {
    return (
        <section className="space-y-4 sm:space-y-6">
            <div className="bg-surface rounded-lg border border-border px-4 py-3 sm:px-6">
                <h1 className="text-lg sm:text-xl font-semibold text-text-primary">Sales Module</h1>
                <p className="text-sm text-text-secondary mt-1">Manage customers, invoices, outstanding, and receipts.</p>
            </div>

            <div className="bg-surface rounded-lg border border-border p-2">
                <nav className="grid grid-cols-2 md:grid-cols-4 gap-2" aria-label="Sales sub navigation">
                    {salesNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `px-3 py-2.5 rounded-md text-sm font-medium text-center transition-colors ${
                                    isActive
                                        ? 'bg-primary text-white'
                                        : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <Outlet />
        </section>
    );
}
