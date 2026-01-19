import autoTable from 'jspdf-autotable';
import { createDoc, addHeader, saveOrOpenPDF } from '../core';
import { PDF_THEME } from '../theme';
import { formatCurrency, formatDate } from '../../format';

export const generateTransactionPDF = (transactions) => {
    const doc = createDoc();
    const startY = addHeader(doc, 'Transaction History');

    const tableData = transactions.map(t => [
        formatDate(t.date),
        t.description,
        t.type,
        formatCurrency(t.amount)
    ]);

    autoTable(doc, {
        head: [['Date', 'Description', 'Type', 'Amount']],
        body: tableData,
        startY: startY,
        theme: 'striped',
        styles: {
            font: 'helvetica',
            fontSize: PDF_THEME.fonts.body.size,
            textColor: PDF_THEME.colors.table.text,
            lineColor: PDF_THEME.colors.secondary,
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: PDF_THEME.colors.primary,
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: PDF_THEME.colors.table.alternateRow
        },
        columnStyles: {
            0: { cellWidth: 30 }, // Date
            1: { cellWidth: 'auto' }, // Description
            2: { cellWidth: 40 }, // Type
            3: { cellWidth: 30, halign: 'right' } // Amount
        }
    });

    saveOrOpenPDF(doc, `transaction_history_${new Date().toISOString().split('T')[0]}.pdf`);
};
