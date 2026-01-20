import autoTable from 'jspdf-autotable';
import { createDoc, addHeader, saveOrOpenPDF } from '../core';
import { PDF_THEME } from '../theme';
import { formatCurrency } from '../../format';

export const generateBalanceSheetPDF = (data) => {
    const doc = createDoc();
    const { margin } = PDF_THEME.layout;

    let currentY = addHeader(doc, 'BALANCE SHEET', `As at ${new Date().toLocaleDateString()}`);

    const drawLine = (y) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.line(margin, y, doc.internal.pageSize.width - margin, y);
    };

    const printHeader = (title, y) => {
        doc.setFontSize(PDF_THEME.fonts.header.size);
        doc.setFont(undefined, 'bold');
        doc.text(title.toUpperCase(), margin, y); // Uppercase for statutory look
        return y + 6;
    };

    const printTotal = (label, amount, y, doubleUnderline = false) => {
        drawLine(y - 5);
        doc.setFontSize(PDF_THEME.fonts.total.size);
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, y);
        doc.text(formatCurrency(amount), doc.internal.pageSize.width - margin, y, { align: 'right' });

        if (doubleUnderline) {
            doc.setLineWidth(0.4);
            doc.line(margin, y + 2, doc.internal.pageSize.width - margin, y + 2);
            doc.line(margin, y + 3.5, doc.internal.pageSize.width - margin, y + 3.5);
            return y + 15;
        }
        return y + 10;
    };

    // --- ASSETS ---
    currentY = printHeader('Assets', currentY);

    const assetsData = data.assets.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: assetsData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin + 5, right: margin }, // Indent line items
        styles: { fontSize: PDF_THEME.fonts.body.size, cellPadding: 2, textColor: PDF_THEME.colors.text.primary },
        columnStyles: { 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    currentY = printTotal('Total Assets', data.totalAssets, currentY, true);

    currentY += 10;

    // --- LIABILITIES & EQUITY ---
    currentY = printHeader('Liabilities & Equity', currentY);

    // Liabilities Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('LIABILITIES', margin + 5, currentY); // Uppercase subsection
    currentY += 6;

    const liabilitiesData = data.liabilities.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: liabilitiesData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin + 10, right: margin }, // Double indent for subsection
        styles: { fontSize: PDF_THEME.fonts.body.size, cellPadding: 2, textColor: PDF_THEME.colors.text.primary },
        columnStyles: { 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 6;
    // Subtotal Liabilities
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal'); // Normal weight for sub-total
    doc.text(`Total Liabilities: ${formatCurrency(data.totalLiabilities)}`, doc.internal.pageSize.width - margin, currentY, { align: 'right' });
    drawLine(currentY + 2); // Small line
    currentY += 10;

    // Equity Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('EQUITY', margin + 5, currentY); // Uppercase subsection
    currentY += 6;

    const equityData = data.equity.map(item => [item.name, formatCurrency(item.amount)]);
    if (data.netIncome !== 0) {
        equityData.push(['Net Income (Current Period)', formatCurrency(data.netIncome)]);
    }

    autoTable(doc, {
        body: equityData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin + 10, right: margin }, // Double indent
        styles: { fontSize: PDF_THEME.fonts.body.size, cellPadding: 2, textColor: PDF_THEME.colors.text.primary },
        columnStyles: { 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // Grand Total
    currentY = printTotal('Total Liabilities & Equity', data.totalLiabilities + data.totalEquity, currentY, true);

    saveOrOpenPDF(doc, `balance_sheet_${new Date().toISOString().split('T')[0]}.pdf`);
};
