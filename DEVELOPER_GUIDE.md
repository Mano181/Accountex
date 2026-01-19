# Developer Guide

How to extend the accounting system, add categories, and define new transaction types.

## Architecture Overview

The application is built on a **Centralized Configuration** architecture. This means the core accounting logic, report structures from the Balance Sheet and Profit & Loss, and chart of accounts are all driven by shared metadata files.

- **Frontend Config:** `client/src/lib/categories.js`
- **Backend Config:** `server/categories.js`

---

## 1. Adding a New Account Category

To add a new account (e.g., "Office Supplies", "Internet Expense"), update the `CATEGORIES` object in both the frontend and backend config files.

```javascript
// client/src/lib/categories.js AND server/categories.js

'New Account Name': {
    report: 'BS',           // 'BS' (Balance Sheet) or 'PL' (Profit & Loss)
    type: 'ASSET',          // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    normalBalance: 'DEBIT', // DEBIT or CREDIT
    label: 'Display Name'   // How it appears in reports
},
```

### Impact on Reports
*   The **report** field automatically places the account in the correct report.
*   The **type** field groups it under the correct section (Assets, Revenue, etc.).
*   No other code changes are needed to update the reports.

---

## 2. Adding a Transaction Type

A "Transaction Type" (e.g., "Sales", "Expense") defines the accounting rule: _Which account gets debited and which gets credited?_

### A. Define the Type Constant

Add the new Key to `TRANSACTION_TYPES` in both:
*   `client/src/lib/constants.js`
*   `server/accounting.js`

```javascript
TRANSACTION_TYPES.INTEREST_INCOME = 'INTEREST_INCOME';
```

### B. Define Logic and Labels

#### Frontend (`constants.js`)
Add the display label for the dropdown.

```javascript
export const TYPE_LABELS = {
    // ...
    [TRANSACTION_TYPES.INTEREST]: 'Interest'
};
```

#### Backend & Frontend Logic
Update `generateEntriesFromType` in both `client/src/lib/constants.js` and `server/accounting.js`.

```javascript
case TRANSACTION_TYPES.INTEREST:
    return [
        { account: 'Cash', type: 'debit', amount: amt },
        { account: 'Revenue', type: 'credit', amount: amt }
    ];
```

---

## Summary Workflow

1.  Update `categories.js` (Frontend & Backend)
2.  Update `constants.js` (Frontend) / `accounting.js` (Backend) with new Type
3.  Update `generateEntriesFromType` logic
