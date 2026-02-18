import { useMemo, useState } from 'react';
import { useSales } from '../../context/useSales';
import { formatCurrency } from '../../lib/format';

const todayIso = () => new Date().toISOString().split('T')[0];

export default function PaymentsReceivedPage() {
    const {
        loading,
        customers,
        payments,
        paymentModes,
        outstandingByCustomerId,
        createPayment
    } = useSales();

    const [form, setForm] = useState({
        customerId: '',
        amountReceived: '',
        paymentDate: todayIso(),
        paymentMode: 'cash',
        referenceNote: '',
        allowOverpayment: false
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');

    const selectedOutstanding = useMemo(
        () => outstandingByCustomerId[form.customerId] || 0,
        [form.customerId, outstandingByCustomerId]
    );
    const visiblePayments = useMemo(
        () => payments.filter((payment) => !customerFilter || payment.customerId === customerFilter),
        [payments, customerFilter]
    );

    const submitPayment = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await createPayment({
                customerId: form.customerId,
                amountReceived: form.amountReceived,
                paymentDate: form.paymentDate,
                paymentMode: form.paymentMode,
                referenceNote: form.referenceNote,
                allowOverpayment: form.allowOverpayment
            });
            setForm((prev) => ({
                ...prev,
                amountReceived: '',
                referenceNote: '',
                allowOverpayment: false
            }));
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-surface rounded-lg border border-border p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-4">Record Payment Received</h2>
                <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" onSubmit={submitPayment}>
                    <div>
                        <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Customer</label>
                        <select
                            value={form.customerId}
                            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        >
                            <option value="">Select customer</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.shopName}
                                </option>
                            ))}
                        </select>
                        {form.customerId && (
                            <p className="text-xs text-text-secondary mt-1">
                                Outstanding: <span className="font-mono">{formatCurrency(selectedOutstanding)}</span>
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Amount Received</label>
                        <input
                            type="number"
                            min="0"
                            value={form.amountReceived}
                            onChange={(event) => setForm((prev) => ({ ...prev, amountReceived: event.target.value }))}
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Payment Date</label>
                        <input
                            type="date"
                            value={form.paymentDate}
                            onChange={(event) => setForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Payment Mode</label>
                        <select
                            value={form.paymentMode}
                            onChange={(event) => setForm((prev) => ({ ...prev, paymentMode: event.target.value }))}
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        >
                            {paymentModes.map((mode) => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Reference Note</label>
                        <input
                            value={form.referenceNote}
                            onChange={(event) => setForm((prev) => ({ ...prev, referenceNote: event.target.value }))}
                            className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            placeholder="Optional"
                        />
                    </div>
                    <label className="md:col-span-2 flex items-center gap-2 text-sm text-text-secondary">
                        <input
                            type="checkbox"
                            checked={form.allowOverpayment}
                            onChange={(event) => setForm((prev) => ({ ...prev, allowOverpayment: event.target.checked }))}
                        />
                        Allow overpayment
                    </label>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="md:col-span-2 xl:col-span-1 px-4 py-2.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-60"
                    >
                        {submitting ? 'Saving Payment...' : 'Add Payment Received'}
                    </button>
                    {error && <p className="md:col-span-2 xl:col-span-3 text-sm text-danger">{error}</p>}
                </form>
            </div>

            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">Payments Received History</h2>
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
                    <div className="p-6 text-sm text-text-secondary">Loading payments...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="text-left p-3 sm:p-4">Date</th>
                                    <th className="text-left p-3 sm:p-4">Customer</th>
                                    <th className="text-right p-3 sm:p-4">Amount</th>
                                    <th className="text-left p-3 sm:p-4">Mode</th>
                                    <th className="text-left p-3 sm:p-4">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {visiblePayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-surface-highlight/40">
                                        <td className="p-3 sm:p-4">{payment.paymentDate}</td>
                                        <td className="p-3 sm:p-4">{payment.customerShopName || customers.find((c) => c.id === payment.customerId)?.shopName || '-'}</td>
                                        <td className="p-3 sm:p-4 text-right font-mono">{formatCurrency(payment.amountReceived)}</td>
                                        <td className="p-3 sm:p-4">{payment.paymentMode}</td>
                                        <td className="p-3 sm:p-4">{payment.referenceNote || '-'}</td>
                                    </tr>
                                ))}
                                {visiblePayments.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-text-secondary">
                                            No payments recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
