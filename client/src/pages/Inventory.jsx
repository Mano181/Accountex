import { useMemo, useState } from 'react';
import { Edit2, PackagePlus, Save, Scale, Trash2 } from 'lucide-react';
import { useSales } from '../context/useSales';
import { formatCurrency } from '../lib/format';

const emptyForm = {
    itemName: '',
    sku: '',
    quantity: '',
    unitPrice: ''
};

const emptyAdjustmentForm = {
    adjustmentType: 'Increase',
    adjustmentQuantity: '',
    reason: ''
};

export default function InventoryPage() {
    const {
        loading,
        inventoryItems,
        createInventoryItem,
        updateInventoryItem,
        adjustInventoryItemQuantity,
        deleteInventoryItem
    } = useSales();

    const [search, setSearch] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [lowStockThreshold, setLowStockThreshold] = useState('5');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [adjustingItemId, setAdjustingItemId] = useState(null);
    const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const threshold = Math.max(Number(lowStockThreshold) || 0, 0);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        return inventoryItems.filter((item) => {
            const matchesSearch = !query || item.itemName.toLowerCase().includes(query);
            const quantity = Number(item.quantity ?? item.quantityOnHand) || 0;
            const matchesStockFilter = !lowStockOnly || quantity <= threshold;
            return matchesSearch && matchesStockFilter;
        });
    }, [inventoryItems, search, lowStockOnly, threshold]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            if (editingId) {
                await updateInventoryItem(editingId, form);
            } else {
                await createInventoryItem(form);
            }
            setForm(emptyForm);
            setEditingId(null);
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({
            itemName: item.itemName,
            sku: item.sku || '',
            quantity: Number(item.quantity ?? item.quantityOnHand ?? 0),
            unitPrice: Number(item.unitPrice ?? item.defaultUnitPrice ?? 0)
        });
        setAdjustingItemId(null);
        setError('');
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError('');
    };

    const handleOpenAdjust = (item) => {
        setAdjustingItemId(item.id);
        setAdjustmentForm(emptyAdjustmentForm);
        setEditingId(null);
        setError('');
    };

    const handleAdjustSubmit = async (event) => {
        event.preventDefault();
        if (!adjustingItemId) return;
        setError('');
        setSubmitting(true);
        try {
            await adjustInventoryItemQuantity(adjustingItemId, adjustmentForm);
            setAdjustingItemId(null);
            setAdjustmentForm(emptyAdjustmentForm);
        } catch (adjustError) {
            setError(adjustError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-surface rounded-lg border border-border px-4 py-3 sm:px-6">
                <h1 className="text-lg sm:text-xl font-semibold text-text-primary">Inventory Management</h1>
                <p className="text-sm text-text-secondary mt-1">Add items, adjust quantity, and track available stock.</p>
            </div>

            <div className="bg-surface rounded-lg border border-border p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                        {editingId ? 'Edit Item' : 'Add Item'}
                    </h2>
                    {editingId && (
                        <button type="button" className="text-sm text-text-secondary hover:text-text-primary" onClick={handleCancel}>
                            Cancel
                        </button>
                    )}
                </div>

                <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={handleSubmit}>
                    <input
                        className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="Item name"
                        value={form.itemName}
                        onChange={(event) => setForm((prev) => ({ ...prev, itemName: event.target.value }))}
                    />
                    <input
                        className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="SKU (optional)"
                        value={form.sku}
                        onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                    />
                    <input
                        type="number"
                        min="0"
                        className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder={editingId ? 'Quantity' : 'Opening quantity'}
                        value={form.quantity}
                        onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                    />
                    <input
                        type="number"
                        min="0"
                        className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        placeholder="Unit price (optional)"
                        value={form.unitPrice}
                        onChange={(event) => setForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-60"
                    >
                        {editingId ? <Save size={15} /> : <PackagePlus size={15} />}
                        {submitting ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                    </button>
                </form>

                {adjustingItemId && (
                    <form className="grid grid-cols-1 md:grid-cols-5 gap-3 border-t border-border pt-4" onSubmit={handleAdjustSubmit}>
                        <select
                            value={adjustmentForm.adjustmentType}
                            onChange={(event) => setAdjustmentForm((prev) => ({ ...prev, adjustmentType: event.target.value }))}
                            className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                        >
                            <option value="Increase">Increase</option>
                            <option value="Decrease">Decrease</option>
                        </select>
                        <input
                            type="number"
                            min="0"
                            className="p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            placeholder="Adjustment quantity"
                            value={adjustmentForm.adjustmentQuantity}
                            onChange={(event) => setAdjustmentForm((prev) => ({ ...prev, adjustmentQuantity: event.target.value }))}
                        />
                        <input
                            className="md:col-span-2 p-2.5 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            placeholder="Reason (optional)"
                            value={adjustmentForm.reason}
                            onChange={(event) => setAdjustmentForm((prev) => ({ ...prev, reason: event.target.value }))}
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-60"
                            >
                                <Save size={15} />
                                {submitting ? 'Saving...' : 'Apply Adjustment'}
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2.5 rounded border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface-highlight"
                                onClick={() => {
                                    setAdjustingItemId(null);
                                    setAdjustmentForm(emptyAdjustmentForm);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {error && <p className="text-sm text-danger">{error}</p>}
            </div>

            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">Inventory Items</h2>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                        <input
                            className="w-full sm:w-72 p-2 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                            placeholder="Search item name"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
                            <input
                                type="checkbox"
                                checked={lowStockOnly}
                                onChange={(event) => setLowStockOnly(event.target.checked)}
                            />
                            Low stock
                        </label>
                        {lowStockOnly && (
                            <input
                                type="number"
                                min="0"
                                className="w-full sm:w-28 p-2 rounded bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                placeholder="Threshold"
                                value={lowStockThreshold}
                                onChange={(event) => setLowStockThreshold(event.target.value)}
                            />
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-text-secondary">Loading inventory...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="bg-surface-highlight text-text-secondary text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="text-left p-3 sm:p-4">Item Name</th>
                                    <th className="text-left p-3 sm:p-4">SKU</th>
                                    <th className="text-right p-3 sm:p-4">Quantity Available</th>
                                    <th className="text-right p-3 sm:p-4">Unit Price</th>
                                    <th className="text-left p-3 sm:p-4">Last Updated</th>
                                    <th className="text-center p-3 sm:p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-surface-highlight/40">
                                        <td className="p-3 sm:p-4 font-medium">{item.itemName}</td>
                                        <td className="p-3 sm:p-4">{item.sku || '-'}</td>
                                        <td className="p-3 sm:p-4 text-right font-mono">{Number(item.quantity ?? item.quantityOnHand ?? 0)}</td>
                                        <td className="p-3 sm:p-4 text-right font-mono">{formatCurrency(item.unitPrice ?? item.defaultUnitPrice)}</td>
                                        <td className="p-3 sm:p-4 text-xs text-text-secondary">
                                            {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-primary transition-colors"
                                                    onClick={() => handleEdit(item)}
                                                    title="Edit Item"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-primary transition-colors"
                                                    onClick={() => handleOpenAdjust(item)}
                                                    title="Adjust Quantity"
                                                >
                                                    <Scale size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-1.5 rounded hover:bg-surface text-text-secondary hover:text-danger transition-colors"
                                                    onClick={async () => {
                                                        if (!window.confirm('Delete this inventory item?')) return;
                                                        try {
                                                            await deleteInventoryItem(item.id);
                                                        } catch (deleteError) {
                                                            setError(deleteError.message);
                                                        }
                                                    }}
                                                    title="Delete Item"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-text-secondary">
                                            No inventory items found.
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
