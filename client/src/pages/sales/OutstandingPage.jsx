import { useMemo, useState } from 'react';
import { useSales } from '../../context/useSales';
import { formatCurrency } from '../../lib/format';

export default function OutstandingPage() {
    const { loading, customers, outstandingList } = useSales();
    const [customerFilter, setCustomerFilter] = useState('');

    const visibleRows = useMemo(
        () =>
            outstandingList.filter(
                (row) => !customerFilter || row.customerId === customerFilter
            ),
        [outstandingList, customerFilter]
    );

    return (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-text-primary">Payments Outstanding</h2>
                <select
                    value={customerFilter}
                    onChange={(event) => setCustomerFilter(event.target.value)}
                    className="w-full sm:w-72 p-2 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                >
                    <option value="">All customers</option>
                    {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.shopName}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="p-6 text-sm text-text-secondary">Loading outstanding balances...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                            <tr>
                                <th className="text-left p-3 sm:p-4">Customer</th>
                                <th className="text-left p-3 sm:p-4">Mobile</th>
                                <th className="text-right p-3 sm:p-4">Total Invoiced</th>
                                <th className="text-right p-3 sm:p-4">Total Paid</th>
                                <th className="text-right p-3 sm:p-4">Outstanding</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {visibleRows.map((row) => (
                                <tr key={row.customerId} className="hover:bg-surface-highlight/40">
                                    <td className="p-3 sm:p-4 font-medium">{row.shopName}</td>
                                    <td className="p-3 sm:p-4">{row.mobileNumber}</td>
                                    <td className="p-3 sm:p-4 text-right font-mono">{formatCurrency(row.totalInvoiced)}</td>
                                    <td className="p-3 sm:p-4 text-right font-mono">{formatCurrency(row.totalPaid)}</td>
                                    <td className="p-3 sm:p-4 text-right font-mono font-semibold">{formatCurrency(row.totalOutstandingAmount)}</td>
                                </tr>
                            ))}
                            {visibleRows.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-secondary">
                                        No outstanding records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
