import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { formatCurrency } from '../lib/format';
import { useSales } from '../context/useSales';

const GUEST_BILL_KEY = 'guest_purchase_bills';

const toNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const getStatusTone = (status) => {
    if (status === 'Paid') return 'bg-success/10 text-success';
    if (status === 'Partially Paid') return 'bg-warning/10 text-warning';
    return 'bg-danger/10 text-danger';
};

const SummaryCard = ({ title, amount, hint, accentClass }) => (
    <div className={`rounded-xl border border-border bg-surface p-4 sm:p-5 border-l-4 transition-all duration-200 hover:-translate-y-0.5 ${accentClass}`}>
        <p className="text-xs uppercase tracking-wide text-text-secondary">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-text-primary font-mono">{formatCurrency(amount)}</p>
        <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </div>
);

const EmptyState = ({ text }) => (
    <div className="px-4 py-8 text-center text-sm text-text-secondary">{text}</div>
);

export default function Dashboard() {
    const { isSignedIn, isLoaded } = useAuth();
    const { loading: salesLoading, invoices, outstandingList, inventoryItems, customers } = useSales();

    const [purchaseBills, setPurchaseBills] = useState([]);
    const [purchaseLoading, setPurchaseLoading] = useState(true);
    const [purchaseError, setPurchaseError] = useState('');

    useEffect(() => {
        let active = true;

        const loadPurchaseBills = async () => {
            if (!isLoaded) return;

            setPurchaseLoading(true);
            setPurchaseError('');
            try {
                if (isSignedIn) {
                    const response = await fetch('/api/purchase/bills');
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to load purchase bills');
                    }
                    if (!active) return;
                    setPurchaseBills(Array.isArray(data) ? data : []);
                } else {
                    const raw = sessionStorage.getItem(GUEST_BILL_KEY);
                    const guestBills = raw ? JSON.parse(raw) : [];
                    if (!active) return;
                    setPurchaseBills(Array.isArray(guestBills) ? guestBills : []);
                }
            } catch (error) {
                if (!active) return;
                setPurchaseBills([]);
                setPurchaseError(error.message || 'Failed to load purchase bills');
            } finally {
                if (active) {
                    setPurchaseLoading(false);
                }
            }
        };

        loadPurchaseBills();
        return () => {
            active = false;
        };
    }, [isLoaded, isSignedIn]);

    const customerNameById = useMemo(
        () => Object.fromEntries(customers.map((customer) => [customer.id, customer.shopName])),
        [customers]
    );

    const invoiceStatusByCustomerId = useMemo(() => {
        const statusMap = {};
        outstandingList.forEach((row) => {
            const totalInvoiced = toNumber(row.totalInvoiced);
            const totalOutstanding = toNumber(row.totalOutstandingAmount);

            if (totalInvoiced <= 0 || totalOutstanding >= totalInvoiced) {
                statusMap[row.customerId] = 'Unpaid';
            } else if (totalOutstanding <= 0) {
                statusMap[row.customerId] = 'Paid';
            } else {
                statusMap[row.customerId] = 'Partially Paid';
            }
        });
        return statusMap;
    }, [outstandingList]);

    const summary = useMemo(() => {
        const totalSales = invoices.reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
        const totalPurchase = purchaseBills.reduce((sum, bill) => sum + toNumber(bill.totalAmount), 0);
        const totalReceivables = outstandingList.reduce(
            (sum, row) => sum + Math.max(0, toNumber(row.totalOutstandingAmount)),
            0
        );
        const totalPayables = purchaseBills.reduce(
            (sum, bill) => sum + Math.max(0, toNumber(bill.amountPayable)),
            0
        );
        const inventoryValue = inventoryItems.reduce((sum, item) => {
            const quantity = toNumber(item.quantity ?? item.quantityOnHand);
            const unitPrice = toNumber(item.unitPrice ?? item.defaultUnitPrice);
            return sum + (quantity * unitPrice);
        }, 0);

        return {
            totalSales,
            totalPurchase,
            totalReceivables,
            totalPayables,
            inventoryValue
        };
    }, [invoices, purchaseBills, outstandingList, inventoryItems]);

    const recentSales = useMemo(
        () =>
            invoices
                .slice()
                .sort((a, b) => new Date(b.invoiceDate || b.createdAt) - new Date(a.invoiceDate || a.createdAt))
                .slice(0, 5),
        [invoices]
    );

    const recentPurchases = useMemo(
        () =>
            purchaseBills
                .slice()
                .sort((a, b) => new Date(b.billDate || b.createdAt) - new Date(a.billDate || a.createdAt))
                .slice(0, 5),
        [purchaseBills]
    );

    const loading = !isLoaded || salesLoading || purchaseLoading;

    if (loading) {
        return <div className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-text-secondary">Loading dashboard...</div>;
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-text-primary">Financial Overview</h2>
                <p className="text-sm text-text-secondary">Sales, purchase, receivables, payables, and inventory snapshot.</p>
            </div>

            {purchaseError && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                    {purchaseError}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard title="Total Sales" amount={summary.totalSales} hint="Updated today • Sum of all invoices" accentClass="border-l-primary" />
                <SummaryCard title="Total Purchase" amount={summary.totalPurchase} hint="Updated today • Sum of all bills" accentClass="border-l-link" />
                <SummaryCard title="Total Receivables" amount={summary.totalReceivables} hint="Updated today • Customers outstanding" accentClass="border-l-success" />
                <SummaryCard title="Total Payables" amount={summary.totalPayables} hint="Updated today • Vendors pending" accentClass="border-l-warning" />
                <SummaryCard title="Inventory Value" amount={summary.inventoryValue} hint="Updated today • Quantity × unit price" accentClass="border-l-sidebar-active" />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                        <h3 className="text-sm font-semibold text-text-primary">Recent Sales</h3>
                        <span className="text-xs text-text-secondary">Last 5 invoices</span>
                    </div>

                    {recentSales.length === 0 ? (
                        <EmptyState text="No sales invoices found." />
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <table className="w-full table-fixed text-sm">
                                    <thead className="bg-surface-highlight text-left text-xs uppercase tracking-wide text-text-secondary">
                                        <tr>
                                            <th className="px-4 py-3">Invoice No</th>
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentSales.map((invoice) => {
                                            const status = invoiceStatusByCustomerId[invoice.customerId] || 'Unpaid';
                                            return (
                                                <tr key={invoice.id}>
                                                    <td className="px-4 py-3 font-medium text-text-primary">{invoice.invoiceNumber}</td>
                                                    <td className="px-4 py-3 text-text-secondary truncate">{invoice.customerShopName || customerNameById[invoice.customerId] || '-'}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-text-primary">{formatCurrency(invoice.totalAmount)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${getStatusTone(status)}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-2 p-3 md:hidden">
                                {recentSales.map((invoice) => {
                                    const status = invoiceStatusByCustomerId[invoice.customerId] || 'Unpaid';
                                    return (
                                        <div key={invoice.id} className="rounded-lg border border-border p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-text-primary">{invoice.invoiceNumber}</p>
                                                    <p className="truncate text-xs text-text-secondary">{invoice.customerShopName || customerNameById[invoice.customerId] || '-'}</p>
                                                </div>
                                                <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${getStatusTone(status)}`}>
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-right font-mono text-sm text-text-primary">{formatCurrency(invoice.totalAmount)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="rounded-xl border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                        <h3 className="text-sm font-semibold text-text-primary">Recent Purchases</h3>
                        <span className="text-xs text-text-secondary">Last 5 bills</span>
                    </div>

                    {recentPurchases.length === 0 ? (
                        <EmptyState text="No purchase bills found." />
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <table className="w-full table-fixed text-sm">
                                    <thead className="bg-surface-highlight text-left text-xs uppercase tracking-wide text-text-secondary">
                                        <tr>
                                            <th className="px-4 py-3">Bill No</th>
                                            <th className="px-4 py-3">Vendor</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentPurchases.map((bill) => (
                                            <tr key={bill.id}>
                                                <td className="px-4 py-3 font-medium text-text-primary">{bill.billNumber}</td>
                                                <td className="px-4 py-3 text-text-secondary truncate">{bill.vendorName || '-'}</td>
                                                <td className="px-4 py-3 text-right font-mono text-text-primary">{formatCurrency(bill.totalAmount)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${getStatusTone(bill.status || 'Unpaid')}`}>
                                                        {bill.status || 'Unpaid'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-2 p-3 md:hidden">
                                {recentPurchases.map((bill) => {
                                    const status = bill.status || 'Unpaid';
                                    return (
                                        <div key={bill.id} className="rounded-lg border border-border p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-text-primary">{bill.billNumber}</p>
                                                    <p className="truncate text-xs text-text-secondary">{bill.vendorName || '-'}</p>
                                                </div>
                                                <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${getStatusTone(status)}`}>
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-right font-mono text-sm text-text-primary">{formatCurrency(bill.totalAmount)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
