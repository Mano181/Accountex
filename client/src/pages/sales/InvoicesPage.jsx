import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSales } from '../../context/useSales';
import { formatCurrency } from '../../lib/format';

const createEmptyRow = () => ({
    itemId: '',
    quantity: 1,
    unitPrice: 0
});

const todayIso = () => new Date().toISOString().split('T')[0];

export default function InvoicesPage() {
    const {
        loading,
        customers,
        inventoryItems,
        invoices,
        createInvoice,
        createInventoryItem
    } = useSales();

    const [invoiceDate, setInvoiceDate] = useState(todayIso());
    const [customerId, setCustomerId] = useState('');
    const [rows, setRows] = useState([createEmptyRow()]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [savingInvoice, setSavingInvoice] = useState(false);
    const [savingItem, setSavingItem] = useState(false);
    const [error, setError] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');

    const itemById = useMemo(
        () => Object.fromEntries(inventoryItems.map((item) => [item.id, item])),
        [inventoryItems]
    );

    const normalizedRows = useMemo(
        () =>
            rows.map((row) => {
                const quantity = Number(row.quantity) || 0;
                const unitPrice = Number(row.unitPrice) || 0;
                return {
                    ...row,
                    quantity,
                    unitPrice,
                    lineTotal: parseFloat((quantity * unitPrice).toFixed(2))
                };
            }),
        [rows]
    );

    const totalAmount = useMemo(
        () => parseFloat(normalizedRows.reduce((sum, row) => sum + row.lineTotal, 0).toFixed(2)),
        [normalizedRows]
    );

    const visibleInvoices = useMemo(
        () => invoices.filter((invoice) => !customerFilter || invoice.customerId === customerFilter),
        [invoices, customerFilter]
    );

    const updateRow = (index, patch) => {
        setRows((prev) =>
            prev.map((row, idx) => {
                if (idx !== index) return row;
                const next = { ...row, ...patch };
                if (patch.itemId && itemById[patch.itemId]) {
                    next.unitPrice = Number(itemById[patch.itemId].defaultUnitPrice) || 0;
                }
                return next;
            })
        );
    };

    const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);
    const removeRow = (index) => setRows((prev) => prev.filter((_, idx) => idx !== index));

    const handleCreateInventoryItem = async () => {
        setError('');
        setSavingItem(true);
        try {
            await createInventoryItem({
                itemName: newItemName,
                defaultUnitPrice: newItemPrice
            });
            setNewItemName('');
            setNewItemPrice('');
        } catch (createError) {
            setError(createError.message);
        } finally {
            setSavingItem(false);
        }
    };

    const handleSaveInvoice = async () => {
        setError('');
        setSavingInvoice(true);
        try {
            await createInvoice({
                customerId,
                invoiceDate,
                items: normalizedRows.map((row) => ({
                    itemId: row.itemId,
                    quantity: row.quantity,
                    unitPrice: row.unitPrice
                }))
            });
            setRows([createEmptyRow()]);
            setCustomerId('');
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSavingInvoice(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 bg-surface rounded-lg border border-border p-4 sm:p-6 space-y-4">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">Create Invoice</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Customer</label>
                            <select
                                value={customerId}
                                onChange={(event) => setCustomerId(event.target.value)}
                                className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            >
                                <option value="">Select customer</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.shopName} ({customer.mobileNumber})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wide text-text-secondary mb-1">Invoice Date</label>
                            <input
                                type="date"
                                value={invoiceDate}
                                onChange={(event) => setInvoiceDate(event.target.value)}
                                className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="text-xs uppercase tracking-wide text-text-secondary">
                                <tr>
                                    <th className="text-left p-2">Item</th>
                                    <th className="text-right p-2">Qty</th>
                                    <th className="text-right p-2">Unit Price</th>
                                    <th className="text-right p-2">Line Total</th>
                                    <th className="text-center p-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {normalizedRows.map((row, index) => (
                                    <tr key={`invoice-row-${index}`}>
                                        <td className="p-2">
                                            <select
                                                value={row.itemId}
                                                onChange={(event) => updateRow(index, { itemId: event.target.value })}
                                                className="w-full p-2 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                            >
                                                <option value="">Select inventory item</option>
                                                {inventoryItems.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.itemName} (Qty: {Number(item.quantity ?? item.quantityOnHand ?? 0)})
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.quantity}
                                                onChange={(event) => updateRow(index, { quantity: event.target.value })}
                                                className="w-full p-2 rounded text-right bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.unitPrice}
                                                onChange={(event) => updateRow(index, { unitPrice: event.target.value })}
                                                className="w-full p-2 rounded text-right bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                            />
                                        </td>
                                        <td className="p-2 text-right font-mono">{formatCurrency(row.lineTotal)}</td>
                                        <td className="p-2 text-center">
                                            <button
                                                type="button"
                                                className="p-1.5 rounded hover:bg-surface-highlight text-text-secondary hover:text-danger transition-colors"
                                                onClick={() => removeRow(index)}
                                                disabled={rows.length === 1}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface-highlight"
                            onClick={addRow}
                        >
                            <Plus size={14} />
                            Add Item
                        </button>
                        <div className="text-sm">
                            <span className="text-text-secondary mr-2">Invoice Total</span>
                            <span className="font-mono font-semibold">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-60"
                        onClick={handleSaveInvoice}
                        disabled={savingInvoice || loading}
                    >
                        {savingInvoice ? 'Saving Invoice...' : 'Save Invoice'}
                    </button>
                </div>

                <div className="bg-surface rounded-lg border border-border p-4 sm:p-6 space-y-3">
                    <h3 className="text-base font-semibold text-text-primary">Quick Add Inventory Item</h3>
                    <input
                        className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="Item name"
                        value={newItemName}
                        onChange={(event) => setNewItemName(event.target.value)}
                    />
                    <input
                        type="number"
                        min="0"
                        className="w-full p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="Default unit price"
                        value={newItemPrice}
                        onChange={(event) => setNewItemPrice(event.target.value)}
                    />
                    <button
                        type="button"
                        className="w-full px-4 py-2.5 rounded border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface-highlight transition-colors disabled:opacity-60"
                        onClick={handleCreateInventoryItem}
                        disabled={savingItem}
                    >
                        {savingItem ? 'Saving Item...' : 'Add Inventory Item'}
                    </button>
                    <div className="border-t border-border pt-3">
                        <p className="text-xs uppercase tracking-wide text-text-secondary mb-2">Available Items</p>
                        <div className="max-h-56 overflow-y-auto space-y-2">
                            {inventoryItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                    <span className="truncate pr-2">{item.itemName}</span>
                                    <span className="font-mono">
                                        {Number(item.quantity ?? item.quantityOnHand ?? 0)} • {formatCurrency(item.unitPrice ?? item.defaultUnitPrice)}
                                    </span>
                                </div>
                            ))}
                            {inventoryItems.length === 0 && (
                                <p className="text-sm text-text-secondary">No items found. Add one to start invoicing.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">Saved Invoices</h2>
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
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                            <tr>
                                <th className="text-left p-3 sm:p-4">Invoice No</th>
                                <th className="text-left p-3 sm:p-4">Date</th>
                                <th className="text-left p-3 sm:p-4">Customer</th>
                                <th className="text-right p-3 sm:p-4">Items</th>
                                <th className="text-right p-3 sm:p-4">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {visibleInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-surface-highlight/40">
                                    <td className="p-3 sm:p-4 font-medium">{invoice.invoiceNumber}</td>
                                    <td className="p-3 sm:p-4">{invoice.invoiceDate}</td>
                                    <td className="p-3 sm:p-4">{invoice.customerShopName || customers.find((c) => c.id === invoice.customerId)?.shopName || '-'}</td>
                                    <td className="p-3 sm:p-4 text-right">{invoice.items.length}</td>
                                    <td className="p-3 sm:p-4 text-right font-mono">{formatCurrency(invoice.totalAmount)}</td>
                                </tr>
                            ))}
                            {visibleInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-secondary">No invoices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
