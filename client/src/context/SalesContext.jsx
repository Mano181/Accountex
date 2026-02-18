import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { TRANSACTION_TYPES } from '../lib/constants';
import { useTransactions } from './TransactionContext';
import SalesContext from './salesContextObject';

const STORAGE_KEYS = {
    CUSTOMERS: 'guest_sales_customers',
    INVENTORY_ITEMS: 'guest_sales_inventory_items',
    INVOICES: 'guest_sales_invoices',
    PAYMENTS: 'guest_sales_payments'
};

const PAYMENT_MODES = ['cash', 'bank', 'UPI', 'other'];
const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;

const toNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const todayIso = () => new Date().toISOString().split('T')[0];

const normalizeInventoryItemShape = (item) => {
    const quantity = toNumber(item.quantity ?? item.quantityOnHand ?? 0);
    const unitPrice = toNumber(item.unitPrice ?? item.defaultUnitPrice ?? 0);
    const sku = item.sku || '';

    return {
        ...item,
        sku,
        quantity,
        quantityOnHand: quantity,
        unitPrice,
        defaultUnitPrice: unitPrice
    };
};

const normalizeInventoryPayload = (payload = {}) => {
    const itemName = String(payload.itemName || '').trim();
    const sku = payload.sku ? String(payload.sku).trim() : '';
    const unitPrice = toNumber(payload.unitPrice ?? payload.defaultUnitPrice ?? 0);
    const hasQuantity = payload.quantity !== undefined || payload.quantityOnHand !== undefined;
    const quantity = hasQuantity ? toNumber(payload.quantity ?? payload.quantityOnHand) : undefined;

    return { itemName, sku, unitPrice, quantity, hasQuantity };
};

const computeOutstandingList = (customers, invoices, payments) => {
    const invoiceByCustomer = new Map();
    const paymentByCustomer = new Map();

    invoices.forEach((invoice) => {
        invoiceByCustomer.set(
            invoice.customerId,
            toNumber(invoiceByCustomer.get(invoice.customerId)) + toNumber(invoice.totalAmount)
        );
    });
    payments.forEach((payment) => {
        paymentByCustomer.set(
            payment.customerId,
            toNumber(paymentByCustomer.get(payment.customerId)) + toNumber(payment.amountReceived)
        );
    });

    return customers
        .map((customer) => {
            const totalInvoiced = toNumber(invoiceByCustomer.get(customer.id));
            const totalPaid = toNumber(paymentByCustomer.get(customer.id));
            return {
                customerId: customer.id,
                shopName: customer.shopName,
                mobileNumber: customer.mobileNumber,
                address: customer.address,
                totalInvoiced,
                totalPaid,
                totalOutstandingAmount: totalInvoiced - totalPaid
            };
        })
        .sort((a, b) => b.totalOutstandingAmount - a.totalOutstandingAmount);
};

export const SalesProvider = ({ children }) => {
    const { isSignedIn, isLoaded } = useAuth();
    const { addTransaction, refreshTransactions } = useTransactions();
    const [customers, setCustomers] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadGuestState = useCallback(() => {
        const read = (key) => {
            const raw = sessionStorage.getItem(key);
            return raw ? JSON.parse(raw) : [];
        };
        const localCustomers = read(STORAGE_KEYS.CUSTOMERS);
        const localInventory = read(STORAGE_KEYS.INVENTORY_ITEMS);
        const localInvoices = read(STORAGE_KEYS.INVOICES);
        const localPayments = read(STORAGE_KEYS.PAYMENTS);

        setCustomers(localCustomers);
        setInventoryItems(localInventory.map(normalizeInventoryItemShape));
        setInvoices(localInvoices);
        setPayments(localPayments);
    }, []);

    const persistGuestState = ({ nextCustomers, nextInventoryItems, nextInvoices, nextPayments }) => {
        if (nextCustomers) sessionStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(nextCustomers));
        if (nextInventoryItems) sessionStorage.setItem(STORAGE_KEYS.INVENTORY_ITEMS, JSON.stringify(nextInventoryItems));
        if (nextInvoices) sessionStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(nextInvoices));
        if (nextPayments) sessionStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(nextPayments));
    };

    const fetchSalesData = useCallback(async () => {
        if (!isLoaded) return;
        setLoading(true);
        try {
            if (isSignedIn) {
                const [customerRes, inventoryRes, invoiceRes, paymentRes] = await Promise.all([
                    fetch('/api/sales/customers'),
                    fetch('/api/sales/inventory-items'),
                    fetch('/api/sales/invoices'),
                    fetch('/api/sales/payments')
                ]);

                const [customerData, inventoryData, invoiceData, paymentData] = await Promise.all([
                    customerRes.json(),
                    inventoryRes.json(),
                    invoiceRes.json(),
                    paymentRes.json()
                ]);

                if (!customerRes.ok) throw new Error(customerData.error || 'Failed to load customers');
                if (!inventoryRes.ok) throw new Error(inventoryData.error || 'Failed to load inventory items');
                if (!invoiceRes.ok) throw new Error(invoiceData.error || 'Failed to load invoices');
                if (!paymentRes.ok) throw new Error(paymentData.error || 'Failed to load payments');

                setCustomers(customerData);
                setInventoryItems(inventoryData.map(normalizeInventoryItemShape));
                setInvoices(invoiceData);
                setPayments(paymentData);
            } else {
                loadGuestState();
            }
        } finally {
            setLoading(false);
        }
    }, [isLoaded, isSignedIn, loadGuestState]);

    useEffect(() => {
        fetchSalesData();
    }, [fetchSalesData]);

    const createCustomer = async (payload) => {
        const { shopName, mobileNumber, address } = payload;
        if (!shopName?.trim() || !mobileNumber?.trim() || !address?.trim()) {
            throw new Error('Shop name, mobile number, and address are required');
        }
        if (!MOBILE_REGEX.test(mobileNumber.trim())) {
            throw new Error('Invalid mobile number format');
        }

        if (isSignedIn) {
            const res = await fetch('/api/sales/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopName: shopName.trim(),
                    mobileNumber: mobileNumber.trim(),
                    address: address.trim()
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create customer');
            setCustomers((prev) => [data, ...prev]);
            return data;
        }

        const duplicate = customers.find(
            (customer) =>
                customer.shopName.toLowerCase() === shopName.trim().toLowerCase() &&
                customer.mobileNumber === mobileNumber.trim()
        );
        if (duplicate) {
            throw new Error('Customer already exists with same shop name and mobile number');
        }

        const customer = {
            id: crypto.randomUUID(),
            shopName: shopName.trim(),
            mobileNumber: mobileNumber.trim(),
            address: address.trim(),
            createdAt: new Date().toISOString()
        };
        const nextCustomers = [customer, ...customers];
        setCustomers(nextCustomers);
        persistGuestState({ nextCustomers });
        return customer;
    };

    const updateCustomer = async (customerId, payload) => {
        const { shopName, mobileNumber, address } = payload;
        if (!shopName?.trim() || !mobileNumber?.trim() || !address?.trim()) {
            throw new Error('Shop name, mobile number, and address are required');
        }
        if (!MOBILE_REGEX.test(mobileNumber.trim())) {
            throw new Error('Invalid mobile number format');
        }

        if (isSignedIn) {
            const res = await fetch(`/api/sales/customers/${customerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopName: shopName.trim(),
                    mobileNumber: mobileNumber.trim(),
                    address: address.trim()
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update customer');
            setCustomers((prev) => prev.map((customer) => (customer.id === customerId ? data : customer)));
            return data;
        }

        const duplicate = customers.find(
            (customer) =>
                customer.id !== customerId &&
                customer.shopName.toLowerCase() === shopName.trim().toLowerCase() &&
                customer.mobileNumber === mobileNumber.trim()
        );
        if (duplicate) {
            throw new Error('Customer already exists with same shop name and mobile number');
        }

        const nextCustomers = customers.map((customer) =>
            customer.id === customerId
                ? { ...customer, shopName: shopName.trim(), mobileNumber: mobileNumber.trim(), address: address.trim() }
                : customer
        );
        setCustomers(nextCustomers);
        persistGuestState({ nextCustomers });
    };

    const deleteCustomer = async (customerId) => {
        if (isSignedIn) {
            const res = await fetch(`/api/sales/customers/${customerId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete customer');
            }
            setCustomers((prev) => prev.filter((customer) => customer.id !== customerId));
            return;
        }

        const hasDependency = invoices.some((invoice) => invoice.customerId === customerId) ||
            payments.some((payment) => payment.customerId === customerId);
        if (hasDependency) {
            throw new Error('Customer has financial records and cannot be deleted');
        }
        const nextCustomers = customers.filter((customer) => customer.id !== customerId);
        setCustomers(nextCustomers);
        persistGuestState({ nextCustomers });
    };

    const createInventoryItem = async (payload) => {
        const {
            itemName,
            sku,
            unitPrice,
            quantity
        } = normalizeInventoryPayload(payload);
        if (!itemName) throw new Error('Item name is required');
        if (unitPrice < 0) throw new Error('Unit price must be non-negative');
        if (quantity !== undefined && quantity < 0) throw new Error('Quantity cannot be negative');

        if (isSignedIn) {
            const res = await fetch('/api/sales/inventory-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemName, sku, unitPrice, quantity })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create inventory item');
            setInventoryItems((prev) =>
                [...prev, normalizeInventoryItemShape(data)].sort((a, b) => a.itemName.localeCompare(b.itemName))
            );
            return data;
        }

        if (inventoryItems.some((item) => item.itemName.toLowerCase() === itemName.toLowerCase())) {
            throw new Error('Inventory item with same name already exists');
        }

        const item = {
            id: crypto.randomUUID(),
            itemName,
            sku,
            unitPrice,
            defaultUnitPrice: unitPrice,
            quantity: quantity ?? 0,
            quantityOnHand: quantity ?? 0,
            createdAt: new Date().toISOString()
        };
        const nextInventoryItems = [...inventoryItems, item]
            .map(normalizeInventoryItemShape)
            .sort((a, b) => a.itemName.localeCompare(b.itemName));
        setInventoryItems(nextInventoryItems);
        persistGuestState({ nextInventoryItems });
        return item;
    };

    const updateInventoryItem = async (itemId, payload) => {
        const {
            itemName,
            sku,
            unitPrice,
            quantity,
            hasQuantity
        } = normalizeInventoryPayload(payload);
        const currentItem = inventoryItems.find((item) => item.id === itemId);
        if (!currentItem) throw new Error('Inventory item not found');

        const resolvedItemName = itemName || currentItem.itemName;
        const resolvedSku = payload.sku === undefined ? (currentItem.sku || '') : sku;
        const resolvedUnitPrice = payload.unitPrice === undefined && payload.defaultUnitPrice === undefined
            ? toNumber(currentItem.unitPrice ?? currentItem.defaultUnitPrice)
            : unitPrice;

        if (!resolvedItemName) throw new Error('Item name is required');
        if (resolvedUnitPrice < 0) throw new Error('Unit price must be non-negative');
        if (hasQuantity && quantity < 0) {
            throw new Error('Quantity cannot be negative');
        }

        if (isSignedIn) {
            const res = await fetch(`/api/sales/inventory-items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemName: resolvedItemName,
                    sku: resolvedSku,
                    unitPrice: resolvedUnitPrice,
                    ...(hasQuantity ? { quantity } : {})
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update inventory item');
            setInventoryItems((prev) =>
                prev
                    .map((item) => (item.id === itemId ? normalizeInventoryItemShape(data) : item))
                    .sort((a, b) => a.itemName.localeCompare(b.itemName))
            );
            return;
        }

        if (inventoryItems.some((item) => item.id !== itemId && item.itemName.toLowerCase() === resolvedItemName.toLowerCase())) {
            throw new Error('Inventory item with same name already exists');
        }
        const nextInventoryItems = inventoryItems
            .map((item) => (
                item.id === itemId
                    ? {
                        ...item,
                        itemName: resolvedItemName,
                        sku: resolvedSku,
                        unitPrice: resolvedUnitPrice,
                        defaultUnitPrice: resolvedUnitPrice,
                        quantity: hasQuantity ? quantity : toNumber(item.quantity),
                        quantityOnHand: hasQuantity ? quantity : toNumber(item.quantityOnHand)
                    }
                    : item
            ))
            .map(normalizeInventoryItemShape)
            .sort((a, b) => a.itemName.localeCompare(b.itemName));
        setInventoryItems(nextInventoryItems);
        persistGuestState({ nextInventoryItems });
    };

    const deleteInventoryItem = async (itemId) => {
        if (isSignedIn) {
            const res = await fetch(`/api/sales/inventory-items/${itemId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete inventory item');
            }
            setInventoryItems((prev) => prev.filter((item) => item.id !== itemId));
            return;
        }

        const hasDependency = invoices.some((invoice) => invoice.items.some((item) => item.itemId === itemId));
        if (hasDependency) {
            throw new Error('Inventory item has invoice dependency and cannot be deleted');
        }
        const nextInventoryItems = inventoryItems.filter((item) => item.id !== itemId);
        setInventoryItems(nextInventoryItems);
        persistGuestState({ nextInventoryItems });
    };

    const adjustInventoryItemQuantity = async (itemId, payload) => {
        const adjustmentType = String(payload.adjustmentType || '').trim();
        const adjustmentQuantity = toNumber(payload.adjustmentQuantity);

        if (!['Increase', 'Decrease'].includes(adjustmentType)) {
            throw new Error('Adjustment type must be Increase or Decrease');
        }
        if (adjustmentQuantity <= 0) {
            throw new Error('Adjustment quantity must be greater than 0');
        }

        if (isSignedIn) {
            const res = await fetch(`/api/sales/inventory-items/${itemId}/adjust`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adjustmentType,
                    adjustmentQuantity,
                    reason: payload.reason || ''
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to adjust inventory quantity');

            setInventoryItems((prev) =>
                prev
                    .map((item) => (item.id === itemId ? normalizeInventoryItemShape(data) : item))
                    .sort((a, b) => a.itemName.localeCompare(b.itemName))
            );
            return data;
        }

        const existing = inventoryItems.find((item) => item.id === itemId);
        if (!existing) throw new Error('Inventory item not found');

        const currentQuantity = toNumber(existing.quantity);
        const nextQuantity = adjustmentType === 'Increase'
            ? currentQuantity + adjustmentQuantity
            : currentQuantity - adjustmentQuantity;

        if (nextQuantity < 0) {
            throw new Error('Insufficient stock for decrease adjustment');
        }

        const nextInventoryItems = inventoryItems
            .map((item) => (
                item.id === itemId
                    ? {
                        ...item,
                        quantity: parseFloat(nextQuantity.toFixed(2)),
                        quantityOnHand: parseFloat(nextQuantity.toFixed(2)),
                        updatedAt: new Date().toISOString()
                    }
                    : item
            ))
            .map(normalizeInventoryItemShape)
            .sort((a, b) => a.itemName.localeCompare(b.itemName));

        setInventoryItems(nextInventoryItems);
        persistGuestState({ nextInventoryItems });
        return nextInventoryItems.find((item) => item.id === itemId);
    };

    const createInvoice = async (payload) => {
        const customerId = payload.customerId;
        const invoiceDate = payload.invoiceDate || todayIso();
        const items = Array.isArray(payload.items) ? payload.items : [];
        if (!customerId || items.length === 0) {
            throw new Error('Customer and at least one item are required');
        }

        if (isSignedIn) {
            const res = await fetch('/api/sales/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId, invoiceDate, items })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
            await fetchSalesData();
            await refreshTransactions();
            return data;
        }

        const customer = customers.find((entry) => entry.id === customerId);
        if (!customer) throw new Error('Customer not found');

        const normalizedItems = items.map((item) => {
            const inventoryItem = inventoryItems.find((inventory) => inventory.id === item.itemId);
            if (!inventoryItem) throw new Error('Invalid inventory item selected');
            const quantity = toNumber(item.quantity);
            const unitPrice = item.unitPrice === undefined || item.unitPrice === null
                ? toNumber(inventoryItem.defaultUnitPrice)
                : toNumber(item.unitPrice);
            if (quantity <= 0) throw new Error('Item quantity must be positive');
            if (unitPrice < 0) throw new Error('Item unit price cannot be negative');
            const lineTotal = parseFloat((quantity * unitPrice).toFixed(2));
            return {
                itemId: inventoryItem.id,
                itemName: inventoryItem.itemName,
                quantity,
                unitPrice,
                lineTotal
            };
        });

        const requestedByItem = new Map();
        normalizedItems.forEach((item) => {
            requestedByItem.set(
                item.itemId,
                toNumber(requestedByItem.get(item.itemId)) + item.quantity
            );
        });

        requestedByItem.forEach((requestedQuantity, inventoryId) => {
            const stockItem = inventoryItems.find((inventory) => inventory.id === inventoryId);
            const available = toNumber(stockItem?.quantity ?? stockItem?.quantityOnHand ?? 0);
            if (requestedQuantity > available) {
                throw new Error(`Insufficient stock for ${stockItem?.itemName || 'item'}. Available: ${available}`);
            }
        });

        const totalAmount = parseFloat(
            normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
        );
        if (totalAmount <= 0) throw new Error('Invoice total amount must be positive');

        const invoice = {
            id: crypto.randomUUID(),
            customerId,
            invoiceNumber: `INV-${String(invoices.length + 1).padStart(6, '0')}`,
            invoiceDate,
            items: normalizedItems,
            totalAmount,
            createdAt: new Date().toISOString()
        };
        const nextInvoices = [invoice, ...invoices];
        setInvoices(nextInvoices);
        const nextInventoryItems = inventoryItems
            .map((item) => {
                const requestedQuantity = requestedByItem.get(item.id);
                if (!requestedQuantity) return item;
                const nextQuantity = parseFloat((toNumber(item.quantity ?? item.quantityOnHand) - requestedQuantity).toFixed(2));
                return {
                    ...item,
                    quantity: nextQuantity,
                    quantityOnHand: nextQuantity,
                    updatedAt: new Date().toISOString()
                };
            })
            .map(normalizeInventoryItemShape);

        setInventoryItems(nextInventoryItems);
        persistGuestState({ nextInvoices, nextInventoryItems });

        await addTransaction({
            date: invoiceDate,
            description: `Sales Invoice - ${customer.shopName}`,
            type: TRANSACTION_TYPES.SALES_INVOICE,
            amount: totalAmount,
            partyName: customer.shopName,
            partyType: 'CUSTOMER'
        });

        return invoice;
    };

    const createPayment = async (payload) => {
        const customerId = payload.customerId;
        const amountReceived = toNumber(payload.amountReceived);
        const paymentDate = payload.paymentDate || todayIso();
        const paymentMode = payload.paymentMode;
        const referenceNote = (payload.referenceNote || '').trim();
        const allowOverpayment = Boolean(payload.allowOverpayment);

        if (!customerId || amountReceived <= 0 || !paymentMode) {
            throw new Error('Customer, amount, and payment mode are required');
        }
        if (!PAYMENT_MODES.includes(paymentMode)) {
            throw new Error('Invalid payment mode');
        }

        const currentOutstanding = outstandingByCustomerId[customerId] || 0;
        if (!allowOverpayment && amountReceived > currentOutstanding) {
            throw new Error(`Overpayment not allowed. Outstanding amount is ${currentOutstanding.toFixed(2)}`);
        }

        if (isSignedIn) {
            const res = await fetch('/api/sales/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    amountReceived,
                    paymentDate,
                    paymentMode,
                    referenceNote,
                    allowOverpayment
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to record payment');
            await fetchSalesData();
            await refreshTransactions();
            return data;
        }

        const customer = customers.find((entry) => entry.id === customerId);
        if (!customer) throw new Error('Customer not found');

        const payment = {
            id: crypto.randomUUID(),
            customerId,
            amountReceived,
            paymentDate,
            paymentMode,
            referenceNote,
            createdAt: new Date().toISOString()
        };
        const nextPayments = [payment, ...payments];
        setPayments(nextPayments);
        persistGuestState({ nextPayments });

        await addTransaction({
            date: paymentDate,
            description: `Payment Received - ${customer.shopName}`,
            type: TRANSACTION_TYPES.CUSTOMER_PAYMENT,
            amount: amountReceived,
            partyName: customer.shopName,
            partyType: 'CUSTOMER'
        });

        return payment;
    };

    const outstandingList = useMemo(
        () => computeOutstandingList(customers, invoices, payments),
        [customers, invoices, payments]
    );
    const outstandingByCustomerId = useMemo(
        () => Object.fromEntries(outstandingList.map((item) => [item.customerId, item.totalOutstandingAmount])),
        [outstandingList]
    );

    return (
        <SalesContext.Provider
            value={{
                loading,
                customers,
                inventoryItems,
                invoices,
                payments,
                outstandingList,
                outstandingByCustomerId,
                paymentModes: PAYMENT_MODES,
                refreshSalesData: fetchSalesData,
                createCustomer,
                updateCustomer,
                deleteCustomer,
                createInventoryItem,
                updateInventoryItem,
                adjustInventoryItemQuantity,
                deleteInventoryItem,
                createInvoice,
                createPayment
            }}
        >
            {children}
        </SalesContext.Provider>
    );
};
