import autoTable from 'jspdf-autotable';
import { createDoc, addHeader, saveOrOpenPDF } from '../core';
import { PDF_THEME } from '../theme';
import { formatCurrency } from '../../format';

export const generateProfitLossPDF = (data) => {
    const doc = createDoc();
    const { margin } = PDF_THEME.layout;

    // Header
    let currentY = addHeader(doc, 'Profit & Loss Statement', `For the period ending ${new Date().toLocaleDateString()}`);

    // Helpers
    const drawLine = (y, thickness = 0.1) => {
        doc.setDrawColor(0);
        doc.setLineWidth(thickness);
        doc.line(margin, y, doc.internal.pageSize.width - margin, y);
    };

    const printSectionTitle = (title, y) => {
        doc.setFontSize(PDF_THEME.fonts.header.size);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...PDF_THEME.colors.text.primary);
        doc.text(title, margin, y);
        return y + 8;
    };

    const printTotalLine = (label, amount, y, doubleUnderline = false) => {
        // Top line
        drawLine(y - 5);

        doc.setFontSize(PDF_THEME.fonts.total.size);
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, y);

        const amountStr = formatCurrency(amount);
        const amountWidth = doc.getStringUnitWidth(amountStr) * PDF_THEME.fonts.total.size / doc.internal.scaleFactor;
        const xPos = doc.internal.pageSize.width - margin - amountWidth; // Right align manually if needed, or stick to table

        // Using autoTable for totals to ensure perfect alignment with columns is easier
        // But for "industry standard" usually totals are free-floating or aligned.
        // Let's use a simple 2-col visual alignment.
        doc.text(amountStr, doc.internal.pageSize.width - margin, y, { align: 'right' });

        if (doubleUnderline) {
            drawLine(y + 2, 0.5);
            drawLine(y + 3.5, 0.5);
            return y + 15;
        }

        return y + 10;
    };

    // --- INCOME ---
    currentY = printSectionTitle('Income', currentY);

    const revenueData = data.revenue.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: revenueData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin, right: margin },
        styles: {
            fontSize: PDF_THEME.fonts.body.size,
            cellPadding: 2,
            textColor: PDF_THEME.colors.text.primary
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'right' }
        }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    currentY = printTotalLine('Total Income', data.totalRevenue, currentY);

    currentY += 5;

    // --- EXPENSES ---
    currentY = printSectionTitle('Expenses', currentY);

    // Filter logic per request: Only Purchase, Other Expense (if they exist). 
    // Since we must rely on data.expenses, we print what we have (Purchases).
    const expensesData = data.expenses.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: expensesData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin, right: margin },
        styles: {
            fontSize: PDF_THEME.fonts.body.size,
            cellPadding: 2,
            textColor: PDF_THEME.colors.text.primary
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'right' }
        }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    currentY = printTotalLine('Total Expenses', data.totalExpenses, currentY);

    currentY += 10;

    // --- NET PROFIT / (LOSS) ---
    currentY = printTotalLine('Net Profit / (Loss)', data.netIncome, currentY, true);

    saveOrOpenPDF(doc, `profit_loss_${new Date().toISOString().split('T')[0]}.pdf`);
};
