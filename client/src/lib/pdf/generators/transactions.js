import autoTable from 'jspdf-autotable';
import { createDoc, addHeader, addFooter, saveOrOpenPDF } from '../core';
import { PDF_THEME } from '../theme';
import { formatCurrency, formatDate } from '../../format';

export const generateTransactionPDF = (transactions) => {
    const doc = createDoc();
    const startY = addHeader(doc, 'Transaction History', 'Summary of recorded entries');

    const totalAmount = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    const totalCount = transactions.length;

    doc.setFontSize(10);
    doc.setTextColor(...PDF_THEME.colors.text.secondary);
    doc.text(`Total Transactions: ${totalCount}`, PDF_THEME.layout.margin, startY - 2);
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, doc.internal.pageSize.width - PDF_THEME.layout.margin, startY - 2, { align: 'right' });

    const tableData = transactions.map(t => [
        formatDate(t.date),
        t.description,
        t.type,
        formatCurrency(t.amount)
    ]);

    autoTable(doc, {
        head: [['Date', 'Description', 'Type', 'Amount']],
        body: tableData,
        startY: startY + 6,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: PDF_THEME.fonts.body.size,
            textColor: PDF_THEME.colors.table.text,
            lineColor: PDF_THEME.colors.border,
            lineWidth: 0.2,
            cellPadding: 3
        },
        headStyles: {
            fillColor: PDF_THEME.colors.table.header,
            textColor: PDF_THEME.colors.text.primary,
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

    addFooter(doc);
    saveOrOpenPDF(doc, `transaction_history_${new Date().toISOString().split('T')[0]}.pdf`);
};
