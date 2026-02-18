import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Edit2, Plus, Save } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { useSales } from '../context/useSales';

const GUEST_VENDOR_KEY = 'guest_purchase_vendors';
const GUEST_BILL_KEY = 'guest_purchase_bills';
const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;

const emptyVendorForm = {
    vendorName: '',
    mobileNumber: '',
    address: ''
};

const createEmptyBillItem = () => ({
    itemName: '',
    quantity: 1,
    unitPrice: 0
});

const todayIso = () => new Date().toISOString().split('T')[0];

const toNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const computeStatus = (totalAmount, amountPaid) => {
    if (amountPaid <= 0) return 'Unpaid';
    if (amountPaid >= totalAmount) return 'Paid';
    return 'Partially Paid';
};

const loadGuestList = (key) => {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
};

const saveGuestList = (key, data) => {
    sessionStorage.setItem(key, JSON.stringify(data));
};

const normalizeBillPayload = ({ vendorId, billDate, amountPaid, items }) => {
    const normalizedItems = items.map((item) => {
        const itemName = String(item.itemName || '').trim();
        const quantity = toNumber(item.quantity);
        const unitPrice = toNumber(item.unitPrice);
        if (!itemName) throw new Error('Item name is required');
        if (quantity <= 0) throw new Error('Item quantity must be positive');
        if (unitPrice < 0) throw new Error('Item unit price cannot be negative');
        const lineTotal = parseFloat((quantity * unitPrice).toFixed(2));
        return { itemName, quantity, unitPrice, lineTotal };
    });

    if (!vendorId) throw new Error('Vendor is required');
    if (!billDate) throw new Error('Bill date is required');
    if (normalizedItems.length === 0) throw new Error('At least one item is required');

    const totalAmount = parseFloat(
        normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );
    const paid = toNumber(amountPaid);
    if (paid < 0) throw new Error('Amount paid cannot be negative');
    if (paid > totalAmount) throw new Error('Amount paid cannot exceed total amount');

    return {
        vendorId,
        billDate,
        items: normalizedItems,
        totalAmount,
        amountPaid: paid,
        amountPayable: parseFloat((totalAmount - paid).toFixed(2)),
        status: computeStatus(totalAmount, paid)
    };
};

export default function PurchasePage() {
    const { isSignedIn } = useAuth();
    const { inventoryItems, createInventoryItem, updateInventoryItem, refreshSalesData } = useSales();

    const [activeTab, setActiveTab] = useState('vendors');
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [bills, setBills] = useState([]);

    const [vendorForm, setVendorForm] = useState(emptyVendorForm);
    const [editingVendorId, setEditingVendorId] = useState(null);
    const [billForm, setBillForm] = useState({
        vendorId: '',
        billDate: todayIso(),
        amountPaid: '',
        items: [createEmptyBillItem()]
    });
    const [statusFilter, setStatusFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (isSignedIn) {
                const [vendorRes, billRes] = await Promise.all([
                    fetch('/api/purchase/vendors'),
                    fetch('/api/purchase/bills')
                ]);
                const [vendorData, billData] = await Promise.all([vendorRes.json(), billRes.json()]);
                if (!vendorRes.ok) throw new Error(vendorData.error || 'Failed to load vendors');
                if (!billRes.ok) throw new Error(billData.error || 'Failed to load bills');
                setVendors(vendorData);
                setBills(billData);
            } else {
                setVendors(loadGuestList(GUEST_VENDOR_KEY));
                setBills(loadGuestList(GUEST_BILL_KEY));
            }
        } catch (fetchError) {
            setError(fetchError.message || 'Failed to load purchase data');
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const visibleBills = useMemo(() => {
        if (!statusFilter) return bills;
        return bills.filter((bill) => bill.status === statusFilter);
    }, [bills, statusFilter]);

    const resetVendorForm = () => {
        setVendorForm(emptyVendorForm);
        setEditingVendorId(null);
    };

    const saveVendor = async (event) => {
        event.preventDefault();
        setError('');
        const vendorName = vendorForm.vendorName.trim();
        const mobileNumber = vendorForm.mobileNumber.trim();
        const address = vendorForm.address.trim();

        if (!vendorName) {
            setError('Vendor name is required');
            return;
        }
        if (mobileNumber && !MOBILE_REGEX.test(mobileNumber)) {
            setError('Invalid mobile number format');
            return;
        }

        setSubmitting(true);
        try {
            if (isSignedIn) {
                if (editingVendorId) {
                    const res = await fetch(`/api/purchase/vendors/${editingVendorId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vendorName, mobileNumber, address })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to update vendor');
                    setVendors((prev) => prev.map((vendor) => (vendor.id === editingVendorId ? data : vendor)));
                } else {
                    const res = await fetch('/api/purchase/vendors', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vendorName, mobileNumber, address })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to create vendor');
                    setVendors((prev) => [data, ...prev]);
                }
            } else {
                const duplicate = vendors.find(
                    (vendor) =>
                        vendor.id !== editingVendorId &&
                        vendor.vendorName.toLowerCase() === vendorName.toLowerCase() &&
                        (vendor.mobileNumber || '') === mobileNumber
                );
                if (duplicate) {
                    throw new Error('Vendor already exists with same name and mobile');
                }
                if (editingVendorId) {
                    const nextVendors = vendors.map((vendor) =>
                        vendor.id === editingVendorId ? { ...vendor, vendorName, mobileNumber, address } : vendor
                    );
                    setVendors(nextVendors);
                    saveGuestList(GUEST_VENDOR_KEY, nextVendors);
                } else {
                    const newVendor = {
                        id: crypto.randomUUID(),
                        vendorName,
                        mobileNumber,
                        address,
                        createdAt: new Date().toISOString()
                    };
                    const nextVendors = [newVendor, ...vendors];
                    setVendors(nextVendors);
                    saveGuestList(GUEST_VENDOR_KEY, nextVendors);
                }
            }
            resetVendorForm();
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSubmitting(false);
        }
    };

    const saveBill = async () => {
        setError('');
        setSubmitting(true);
        try {
            const payload = normalizeBillPayload(billForm);
            if (isSignedIn) {
                const res = await fetch('/api/purchase/bills', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to create bill');
                await fetchData();
                await refreshSalesData();
            } else {
                const billNumber = `BILL-${String(bills.length + 1).padStart(6, '0')}`;
                const vendor = vendors.find((entry) => entry.id === payload.vendorId);
                const newBill = {
                    id: crypto.randomUUID(),
                    billNumber,
                    vendorId: payload.vendorId,
                    vendorName: vendor?.vendorName || '-',
                    billDate: payload.billDate,
                    items: payload.items,
                    totalAmount: payload.totalAmount,
                    amountPaid: payload.amountPaid,
                    amountPayable: payload.amountPayable,
                    status: payload.status,
                    createdAt: new Date().toISOString()
                };
                const nextBills = [newBill, ...bills];
                setBills(nextBills);
                saveGuestList(GUEST_BILL_KEY, nextBills);

                // Update inventory quantity in guest mode.
                for (const item of payload.items) {
                    const existing = inventoryItems.find(
                        (inventory) => inventory.itemName.toLowerCase() === item.itemName.toLowerCase()
                    );
                    if (existing) {
                        await updateInventoryItem(existing.id, {
                            itemName: existing.itemName,
                            defaultUnitPrice: existing.defaultUnitPrice,
                            quantityOnHand: toNumber(existing.quantityOnHand) + item.quantity
                        });
                    } else {
                        await createInventoryItem({
                            itemName: item.itemName,
                            defaultUnitPrice: item.unitPrice,
                            quantityOnHand: item.quantity
                        });
                    }
                }
            }

            setBillForm({
                vendorId: '',
                billDate: todayIso(),
                amountPaid: '',
                items: [createEmptyBillItem()]
            });
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSubmitting(false);
        }
    };

    const updateBillPayment = async (bill) => {
        const additionalText = window.prompt(
            `Current paid: ${bill.amountPaid}. Enter additional payment amount:`,
            '0'
        );
        if (additionalText === null) return;
        const additionalAmount = toNumber(additionalText);
        if (additionalAmount < 0) {
            setError('Payment amount cannot be negative');
            return;
        }
        const nextAmountPaid = parseFloat((toNumber(bill.amountPaid) + additionalAmount).toFixed(2));
        if (nextAmountPaid > toNumber(bill.totalAmount)) {
            setError('Amount paid cannot exceed total amount');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            if (isSignedIn) {
                const res = await fetch(`/api/purchase/bills/${bill.id}/payment`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amountPaid: nextAmountPaid })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to update payment');
                setBills((prev) =>
                    prev.map((entry) =>
                        entry.id === bill.id
                            ? {
                                ...entry,
                                amountPaid: data.amountPaid,
                                amountPayable: data.amountPayable,
                                status: data.status,
                                updatedAt: data.updatedAt
                            }
                            : entry
                    )
                );
            } else {
                const nextBills = bills.map((entry) => {
                    if (entry.id !== bill.id) return entry;
                    const amountPayable = parseFloat((toNumber(entry.totalAmount) - nextAmountPaid).toFixed(2));
                    return {
                        ...entry,
                        amountPaid: nextAmountPaid,
                        amountPayable,
                        status: computeStatus(toNumber(entry.totalAmount), nextAmountPaid)
                    };
                });
                setBills(nextBills);
                saveGuestList(GUEST_BILL_KEY, nextBills);
            }
        } catch (updateError) {
            setError(updateError.message);
        } finally {
            setSubmitting(false);
        }
    };

    const billRows = useMemo(() => {
        return billForm.items.map((item) => {
            const quantity = toNumber(item.quantity);
            const unitPrice = toNumber(item.unitPrice);
            return {
                ...item,
                quantity,
                unitPrice,
                lineTotal: parseFloat((quantity * unitPrice).toFixed(2))
            };
        });
    }, [billForm.items]);

    const totalAmount = useMemo(
        () => parseFloat(billRows.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)),
        [billRows]
    );
    const amountPaid = toNumber(billForm.amountPaid);
    const amountPayable = parseFloat(Math.max(totalAmount - amountPaid, 0).toFixed(2));

    return (
        <div className="space-y-4">
            <div className="bg-surface rounded-lg border border-border px-4 py-3 sm:px-6">
                <h1 className="text-lg sm:text-xl font-semibold text-text-primary">Purchase Module</h1>
                <p className="text-sm text-text-secondary mt-1">Manage vendors and bills with payable tracking.</p>
            </div>

            <div className="bg-surface rounded-lg border border-border p-2">
                <nav className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'vendors' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'}`}
                        onClick={() => setActiveTab('vendors')}
                    >
                        Vendors
                    </button>
                    <button
                        type="button"
                        className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'bills' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-highlight hover:text-text-primary'}`}
                        onClick={() => setActiveTab('bills')}
                    >
                        Bills
                    </button>
                </nav>
            </div>

            {activeTab === 'vendors' && (
                <div className="space-y-4">
                    <div className="bg-surface rounded-lg border border-border p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                                {editingVendorId ? 'Edit Vendor' : 'Add Vendor'}
                            </h2>
                            {editingVendorId && (
                                <button type="button" className="text-sm text-text-secondary hover:text-text-primary" onClick={resetVendorForm}>
                                    Cancel
                                </button>
                            )}
                        </div>
                        <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={saveVendor}>
                            <input
                                className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                placeholder="Vendor name"
                                value={vendorForm.vendorName}
                                onChange={(event) => setVendorForm((prev) => ({ ...prev, vendorName: event.target.value }))}
                            />
                            <input
                                className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                placeholder="Mobile number"
                                value={vendorForm.mobileNumber}
                                onChange={(event) => setVendorForm((prev) => ({ ...prev, mobileNumber: event.target.value }))}
                            />
                            <input
                                className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                placeholder="Address"
                                value={vendorForm.address}
                                onChange={(event) => setVendorForm((prev) => ({ ...prev, address: event.target.value }))}
                            />
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-60"
                            >
                                <Save size={15} />
                                {submitting ? 'Saving...' : editingVendorId ? 'Update Vendor' : 'Add Vendor'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-surface rounded-lg border border-border overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-border">
                            <h2 className="text-base sm:text-lg font-semibold text-text-primary">Vendors</h2>
                        </div>
                        {loading ? (
                            <div className="p-6 text-sm text-text-secondary">Loading vendors...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] text-sm">
                                    <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="text-left p-3 sm:p-4">Vendor Name</th>
                                            <th className="text-left p-3 sm:p-4">Mobile</th>
                                            <th className="text-left p-3 sm:p-4">Address</th>
                                            <th className="text-center p-3 sm:p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {vendors.map((vendor) => (
                                            <tr key={vendor.id} className="hover:bg-surface-highlight/40">
                                                <td className="p-3 sm:p-4 font-medium">{vendor.vendorName}</td>
                                                <td className="p-3 sm:p-4">{vendor.mobileNumber || '-'}</td>
                                                <td className="p-3 sm:p-4">{vendor.address || '-'}</td>
                                                <td className="p-3 sm:p-4 text-center">
                                                    <button
                                                        type="button"
                                                        className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-primary transition-colors"
                                                        onClick={() => {
                                                            setEditingVendorId(vendor.id);
                                                            setVendorForm({
                                                                vendorName: vendor.vendorName,
                                                                mobileNumber: vendor.mobileNumber || '',
                                                                address: vendor.address || ''
                                                            });
                                                        }}
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {vendors.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="p-8 text-center text-text-secondary">No vendors found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'bills' && (
                <div className="space-y-4">
                    <div className="bg-surface rounded-lg border border-border p-4 sm:p-6 space-y-4">
                        <h2 className="text-base sm:text-lg font-semibold text-text-primary">Create Bill</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Vendor</label>
                                <select
                                    value={billForm.vendorId}
                                    onChange={(event) => setBillForm((prev) => ({ ...prev, vendorId: event.target.value }))}
                                    className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                >
                                    <option value="">Select vendor</option>
                                    {vendors.map((vendor) => (
                                        <option key={vendor.id} value={vendor.id}>{vendor.vendorName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Bill Date</label>
                                <input
                                    type="date"
                                    value={billForm.billDate}
                                    onChange={(event) => setBillForm((prev) => ({ ...prev, billDate: event.target.value }))}
                                    className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Amount Paid (optional)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={billForm.amountPaid}
                                    onChange={(event) => setBillForm((prev) => ({ ...prev, amountPaid: event.target.value }))}
                                    className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-sm">
                                <thead className="text-xs uppercase tracking-wide text-text-secondary">
                                    <tr>
                                        <th className="text-left p-2">Item Name</th>
                                        <th className="text-right p-2">Qty</th>
                                        <th className="text-right p-2">Unit Price</th>
                                        <th className="text-right p-2">Line Total</th>
                                        <th className="text-center p-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {billRows.map((item, index) => (
                                        <tr key={`bill-item-${index}`}>
                                            <td className="p-2">
                                                <input
                                                    list="purchase-item-suggestions"
                                                    value={item.itemName}
                                                    onChange={(event) =>
                                                        setBillForm((prev) => ({
                                                            ...prev,
                                                            items: prev.items.map((entry, idx) =>
                                                                idx === index ? { ...entry, itemName: event.target.value } : entry
                                                            )
                                                        }))
                                                    }
                                                    className="w-full p-2 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                                    placeholder="Item name"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.quantity}
                                                    onChange={(event) =>
                                                        setBillForm((prev) => ({
                                                            ...prev,
                                                            items: prev.items.map((entry, idx) =>
                                                                idx === index ? { ...entry, quantity: event.target.value } : entry
                                                            )
                                                        }))
                                                    }
                                                    className="w-full p-2 rounded text-right bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.unitPrice}
                                                    onChange={(event) =>
                                                        setBillForm((prev) => ({
                                                            ...prev,
                                                            items: prev.items.map((entry, idx) =>
                                                                idx === index ? { ...entry, unitPrice: event.target.value } : entry
                                                            )
                                                        }))
                                                    }
                                                    className="w-full p-2 rounded text-right bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                                />
                                            </td>
                                            <td className="p-2 text-right font-mono">{formatCurrency(item.lineTotal)}</td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    className="p-1 rounded border border-border text-xs text-text-secondary hover:text-danger"
                                                    onClick={() =>
                                                        setBillForm((prev) => ({
                                                            ...prev,
                                                            items: prev.items.length > 1
                                                                ? prev.items.filter((_, idx) => idx !== index)
                                                                : prev.items
                                                        }))
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <datalist id="purchase-item-suggestions">
                                {inventoryItems.map((item) => (
                                    <option key={item.id} value={item.itemName} />
                                ))}
                            </datalist>
                        </div>

                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded border border-border text-sm text-text-secondary hover:bg-surface-highlight"
                            onClick={() =>
                                setBillForm((prev) => ({ ...prev, items: [...prev.items, createEmptyBillItem()] }))
                            }
                        >
                            <Plus size={14} />
                            Add Item
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm border-t border-border pt-4">
                            <div className="flex justify-between sm:block">
                                <span className="text-text-secondary">Total Amount</span>
                                <span className="font-mono font-semibold sm:block">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between sm:block">
                                <span className="text-text-secondary">Amount Paid</span>
                                <span className="font-mono sm:block">{formatCurrency(amountPaid)}</span>
                            </div>
                            <div className="flex justify-between sm:block">
                                <span className="text-text-secondary">Amount Payable</span>
                                <span className="font-mono font-semibold sm:block">{formatCurrency(amountPayable)}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={saveBill}
                            disabled={submitting}
                            className="w-full sm:w-auto px-5 py-2.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-60"
                        >
                            {submitting ? 'Saving Bill...' : 'Save Bill'}
                        </button>
                    </div>

                    <div className="bg-surface rounded-lg border border-border overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-base sm:text-lg font-semibold text-text-primary">Bills</h2>
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="w-full sm:w-56 p-2 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            >
                                <option value="">All Status</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Partially Paid">Partially Paid</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                        {loading ? (
                            <div className="p-6 text-sm text-text-secondary">Loading bills...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[920px] text-sm">
                                    <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="text-left p-3 sm:p-4">Bill Number</th>
                                            <th className="text-left p-3 sm:p-4">Vendor Name</th>
                                            <th className="text-right p-3 sm:p-4">Total Amount</th>
                                            <th className="text-right p-3 sm:p-4">Amount Paid</th>
                                            <th className="text-right p-3 sm:p-4">Amount Payable</th>
                                            <th className="text-left p-3 sm:p-4">Status</th>
                                            <th className="text-center p-3 sm:p-4">Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {visibleBills.map((bill) => (
                                            <tr key={bill.id} className="hover:bg-surface-highlight/40">
                                                <td className="p-3 sm:p-4 font-medium">{bill.billNumber}</td>
                                                <td className="p-3 sm:p-4">{bill.vendorName}</td>
                                                <td className="p-3 sm:p-4 text-right font-mono">{formatCurrency(bill.totalAmount)}</td>
                                                <td className="p-3 sm:p-4 text-right font-mono">{formatCurrency(bill.amountPaid)}</td>
                                                <td className="p-3 sm:p-4 text-right font-mono font-semibold">{formatCurrency(bill.amountPayable)}</td>
                                                <td className="p-3 sm:p-4">
                                                    <span
                                                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                                            bill.status === 'Paid'
                                                                ? 'bg-success/10 text-success'
                                                                : bill.status === 'Partially Paid'
                                                                    ? 'bg-warning/10 text-warning'
                                                                    : 'bg-danger/10 text-danger'
                                                        }`}
                                                    >
                                                        {bill.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 sm:p-4 text-center">
                                                    <button
                                                        type="button"
                                                        disabled={submitting || bill.status === 'Paid'}
                                                        onClick={() => updateBillPayment(bill)}
                                                        className="px-3 py-1.5 rounded border border-border text-xs text-text-secondary hover:text-text-primary hover:bg-surface-highlight disabled:opacity-50"
                                                    >
                                                        Add Payment
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {visibleBills.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-text-secondary">
                                                    No bills found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
