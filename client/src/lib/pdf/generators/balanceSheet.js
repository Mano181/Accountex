import autoTable from 'jspdf-autotable';
import { createDoc, addHeader, saveOrOpenPDF } from '../core';
import { PDF_THEME } from '../theme';
import { formatCurrency } from '../../format';

export const generateBalanceSheetPDF = (data) => {
    const doc = createDoc();
    let currentY = addHeader(doc, 'Balance Sheet');
    const { margin } = PDF_THEME.layout;

    // Helper to print section header
    const printSectionHeader = (title, y) => {
        doc.setFontSize(PDF_THEME.fonts.header.size);
        doc.setFont(undefined, PDF_THEME.fonts.header.style);
        doc.setTextColor(...PDF_THEME.colors.text.primary);
        doc.text(title, margin, y);
        return y + 6;
    };

    // Helper to print total
    const printTotal = (label, amount, y) => {
        doc.setFontSize(PDF_THEME.fonts.total.size);
        doc.setFont(undefined, PDF_THEME.fonts.total.style);
        doc.setTextColor(...PDF_THEME.colors.text.primary);
        doc.text(`${label}: ${formatCurrency(amount)}`, margin, y);
        return y + 10;
    };

    // --- ASSETS ---
    currentY = printSectionHeader('Assets', currentY);
    const assetsData = data.assets.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: assetsData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin },
        styles: { fontSize: PDF_THEME.fonts.body.size },
        columnStyles: { 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    currentY = printTotal('Total Assets', data.totalAssets, currentY);
    currentY += 5;

    // --- LIABILITIES ---
    currentY = printSectionHeader('Liabilities', currentY);
    const liabilitiesData = data.liabilities.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: liabilitiesData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin },
        styles: { fontSize: PDF_THEME.fonts.body.size },
        columnStyles: { 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    currentY = printTotal('Total Liabilities', data.totalLiabilities, currentY);
    currentY += 5;

    // --- EQUITY ---
    currentY = printSectionHeader('Equity', currentY);
    const equityData = data.equity.map(item => [item.name, formatCurrency(item.amount)]);
    if (data.netIncome !== 0) {
        equityData.push(['Net Income (Current Period)', formatCurrency(data.netIncome)]);
    }

    autoTable(doc, {
        body: equityData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin },
        styles: { fontSize: PDF_THEME.fonts.body.size },
        columnStyles: { 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    currentY = printTotal('Total Equity', data.totalEquity, currentY);

    // --- GRAND TOTAL CHECK ---
    currentY += 8;
    // Draw line
    doc.setDrawColor(...PDF_THEME.colors.secondary);
    doc.setLineWidth(0.1);
    doc.line(margin, currentY, doc.internal.pageSize.width - margin, currentY);
    currentY += 8;

    printTotal('Total Liabilities + Equity', data.totalLiabilities + data.totalEquity, currentY);

    saveOrOpenPDF(doc, `balance_sheet_${new Date().toISOString().split('T')[0]}.pdf`);
};
