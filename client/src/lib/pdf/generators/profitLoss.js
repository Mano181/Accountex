import autoTable from 'jspdf-autotable';
import { createDoc, addHeader, saveOrOpenPDF } from '../core';
import { PDF_THEME } from '../theme';
import { formatCurrency } from '../../format';

export const generateProfitLossPDF = (data) => {
    const doc = createDoc();
    let currentY = addHeader(doc, 'Profit & Loss Statement');
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
    const printTotal = (label, amount, y, color = PDF_THEME.colors.text.primary) => {
        doc.setFontSize(PDF_THEME.fonts.total.size);
        doc.setFont(undefined, PDF_THEME.fonts.total.style);
        doc.setTextColor(...color);
        doc.text(`${label}: ${formatCurrency(amount)}`, margin, y);
        return y + 10;
    };

    // --- REVENUE ---
    currentY = printSectionHeader('Revenue', currentY);

    const revenueData = data.revenue.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: revenueData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin },
        styles: { fontSize: PDF_THEME.fonts.body.size },
        columnStyles: { 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    currentY = printTotal('Total Revenue', data.totalRevenue, currentY);

    currentY += 5; // Spacing

    // --- EXPENSES ---
    currentY = printSectionHeader('Expenses', currentY);

    const expensesData = data.expenses.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: expensesData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin },
        styles: { fontSize: PDF_THEME.fonts.body.size },
        columnStyles: { 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    currentY = printTotal('Total Expenses', data.totalExpenses, currentY, PDF_THEME.colors.text.danger);

    currentY += 10; // Spacing before Net Income

    // --- NET INCOME ---
    doc.setFontSize(PDF_THEME.fonts.title.size);
    doc.setFont(undefined, 'bold');

    const netIncomeColor = data.netIncome >= 0 ? PDF_THEME.colors.text.success : PDF_THEME.colors.text.danger;
    doc.setTextColor(...netIncomeColor);

    doc.text(`Net Income: ${formatCurrency(data.netIncome)}`, margin, currentY);

    saveOrOpenPDF(doc, `profit_loss_${new Date().toISOString().split('T')[0]}.pdf`);
};
