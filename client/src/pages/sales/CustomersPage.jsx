import { useMemo, useState } from 'react';
import { Edit2, Save, Trash2 } from 'lucide-react';
import { useSales } from '../../context/useSales';
import { formatCurrency } from '../../lib/format';

const emptyForm = {
    shopName: '',
    mobileNumber: '',
    address: ''
};

export default function CustomersPage() {
    const { loading, customers, outstandingList, createCustomer, updateCustomer, deleteCustomer } = useSales();
    const [search, setSearch] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const filteredCustomers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return customers;
        return customers.filter((customer) =>
            customer.shopName.toLowerCase().includes(query) ||
            customer.mobileNumber.toLowerCase().includes(query)
        );
    }, [customers, search]);

    const outstandingMap = useMemo(
        () => Object.fromEntries(outstandingList.map((item) => [item.customerId, item.totalOutstandingAmount])),
        [outstandingList]
    );

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            if (editingId) {
                await updateCustomer(editingId, form);
            } else {
                await createCustomer(form);
            }
            setForm(emptyForm);
            setEditingId(null);
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (customer) => {
        setEditingId(customer.id);
        setForm({
            shopName: customer.shopName,
            mobileNumber: customer.mobileNumber,
            address: customer.address
        });
        setError('');
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError('');
    };

    return (
        <div className="space-y-4">
            <div className="bg-surface rounded-lg border border-border p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                        {editingId ? 'Edit Customer' : 'Create Customer'}
                    </h2>
                    {editingId && (
                        <button
                            type="button"
                            className="text-sm text-text-secondary hover:text-text-primary"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    )}
                </div>
                <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleSubmit}>
                    <input
                        className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="Shop name"
                        value={form.shopName}
                        onChange={(event) => setForm((prev) => ({ ...prev, shopName: event.target.value }))}
                    />
                    <input
                        className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="Mobile number"
                        value={form.mobileNumber}
                        onChange={(event) => setForm((prev) => ({ ...prev, mobileNumber: event.target.value }))}
                    />
                    <input
                        className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="Address"
                        value={form.address}
                        onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="md:col-span-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-60"
                    >
                        <Save size={15} />
                        {submitting ? 'Saving...' : editingId ? 'Update Customer' : 'Create Customer'}
                    </button>
                    {error && <p className="md:col-span-3 text-sm text-danger">{error}</p>}
                </form>
            </div>

            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">Customers</h2>
                    <input
                        className="w-full sm:w-72 p-2 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="Search by shop or mobile"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-text-secondary">Loading customers...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="text-left p-3 sm:p-4">Shop Name</th>
                                    <th className="text-left p-3 sm:p-4">Mobile</th>
                                    <th className="text-left p-3 sm:p-4">Address</th>
                                    <th className="text-right p-3 sm:p-4">Outstanding</th>
                                    <th className="text-center p-3 sm:p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-surface-highlight/40">
                                        <td className="p-3 sm:p-4 font-medium">{customer.shopName}</td>
                                        <td className="p-3 sm:p-4">{customer.mobileNumber}</td>
                                        <td className="p-3 sm:p-4">{customer.address}</td>
                                        <td className="p-3 sm:p-4 text-right font-mono">
                                            {formatCurrency(outstandingMap[customer.id] || 0)}
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-primary transition-colors"
                                                    onClick={() => handleEdit(customer)}
                                                    title="Edit customer"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-danger transition-colors"
                                                    onClick={async () => {
                                                        if (!window.confirm('Delete this customer?')) return;
                                                        try {
                                                            await deleteCustomer(customer.id);
                                                        } catch (deleteError) {
                                                            setError(deleteError.message);
                                                        }
                                                    }}
                                                    title="Delete customer"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-text-secondary">
                                            No customers found.
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
