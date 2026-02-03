import autoTable from 'jspdf-autotable';
import { createDoc, addHeader, addFooter, saveOrOpenPDF } from '../core';
import { PDF_THEME } from '../theme';
import { formatCurrency } from '../../format';

export const generateProfitLossPDF = (data) => {
    const doc = createDoc();
    const { margin } = PDF_THEME.layout;

    // Header
    let currentY = addHeader(doc, 'Profit and Loss Statement', `For the period ending ${new Date().toLocaleDateString()}`);

    // Helpers
    const drawLine = (y, thickness = 0.1) => {
        doc.setDrawColor(...PDF_THEME.colors.border);
        doc.setLineWidth(thickness);
        doc.line(margin, y, doc.internal.pageSize.width - margin, y);
    };

    const printSectionTitle = (title, y) => {
        doc.setFontSize(PDF_THEME.fonts.header.size);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...PDF_THEME.colors.text.primary);
        doc.text(title.toUpperCase(), margin, y);
        drawLine(y + 2, 0.2);
        return y + 8;
    };

    const printTotalLine = (label, amount, y, doubleUnderline = false) => {
        // Top line
        drawLine(y - 5, 0.2);

        doc.setFontSize(PDF_THEME.fonts.total.size);
        doc.setFont(undefined, 'bold');
        doc.text(label, margin, y);

        const amountStr = formatCurrency(amount);
        doc.text(amountStr, doc.internal.pageSize.width - margin, y, { align: 'right' });

        if (doubleUnderline) {
            drawLine(y + 2, 0.4);
            drawLine(y + 3.5, 0.4);
            return y + 15;
        }

        return y + 10;
    };

    // --- INCOME ---
    currentY = printSectionTitle('Income', currentY);

    const revenueData = data.revenue.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        head: [['Account', 'Amount']],
        body: revenueData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin + 5, right: margin },
        styles: {
            fontSize: PDF_THEME.fonts.body.size,
            cellPadding: 2,
            textColor: PDF_THEME.colors.text.primary,
            fontStyle: 'normal'
        },
        headStyles: {
            fillColor: PDF_THEME.colors.table.header,
            textColor: PDF_THEME.colors.text.primary,
            fontStyle: 'bold'
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

    const expensesData = data.expenses.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        head: [['Account', 'Amount']],
        body: expensesData,
        startY: currentY,
        theme: 'plain',
        margin: { left: margin + 5, right: margin },
        styles: {
            fontSize: PDF_THEME.fonts.body.size,
            cellPadding: 2,
            textColor: PDF_THEME.colors.text.primary
        },
        headStyles: {
            fillColor: PDF_THEME.colors.table.header,
            textColor: PDF_THEME.colors.text.primary,
            fontStyle: 'bold'
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

    addFooter(doc);
    saveOrOpenPDF(doc, `profit_loss_${new Date().toISOString().split('T')[0]}.pdf`);
};
