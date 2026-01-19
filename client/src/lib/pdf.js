import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';

// Helper to add title and basic metadata
const addReportHeader = (doc, title) => {
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });
    doc.text('Accounting Reports App', pageWidth / 2, 27, { align: 'center' });
};

export const generateTransactionPDF = (transactions) => {
    const doc = new jsPDF();

    addReportHeader(doc, 'Transaction History');

    const tableData = transactions.map(t => [
        t.date, // Already formatted usually, but could check
        t.description,
        t.type,
        formatCurrency(t.amount)
    ]);

    autoTable(doc, {
        head: [['Date', 'Description', 'Type', 'Amount']],
        body: tableData,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] }
    });

    doc.save(`transaction_history_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateProfitLossPDF = (data) => {
    const doc = new jsPDF();

    addReportHeader(doc, 'Profit & Loss Statement');

    // Revenue Section
    doc.setFontSize(14);
    doc.text('Revenue', 14, 40);

    const revenueData = data.revenue.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: revenueData,
        startY: 45,
        theme: 'plain',
        margin: { left: 14 }
    });

    let currentY = doc.lastAutoTable.finalY + 10;

    // Total Revenue
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Revenue: ${formatCurrency(data.totalRevenue)}`, 14, currentY);

    currentY += 15;

    // Expenses Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Expenses', 14, currentY);

    const expensesData = data.expenses.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: expensesData,
        startY: currentY + 5,
        theme: 'plain',
        margin: { left: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Total Expenses
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Expenses: ${formatCurrency(data.totalExpenses)}`, 14, currentY);

    currentY += 15;

    // Net Income
    doc.setFontSize(16);
    doc.setTextColor(data.netIncome >= 0 ? 0 : 200, data.netIncome >= 0 ? 100 : 0, 0); // Green or Red
    doc.text(`Net Income: ${formatCurrency(data.netIncome)}`, 14, currentY);

    doc.save(`profit_loss_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateBalanceSheetPDF = (data) => {
    const doc = new jsPDF();

    addReportHeader(doc, 'Balance Sheet');

    let currentY = 40;

    // Assets
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Assets', 14, currentY);

    const assetsData = data.assets.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: assetsData,
        startY: currentY + 5,
        theme: 'plain',
        margin: { left: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Assets: ${formatCurrency(data.totalAssets)}`, 14, currentY);

    currentY += 15;

    // Liabilities
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Liabilities', 14, currentY);

    const liabilitiesData = data.liabilities.map(item => [item.name, formatCurrency(item.amount)]);

    autoTable(doc, {
        body: liabilitiesData,
        startY: currentY + 5,
        theme: 'plain',
        margin: { left: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Liabilities: ${formatCurrency(data.totalLiabilities)}`, 14, currentY);

    currentY += 15;

    // Equity
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Equity', 14, currentY);

    const equityData = data.equity.map(item => [item.name, formatCurrency(item.amount)]);
    if (data.netIncome !== 0) {
        equityData.push(['Net Income', formatCurrency(data.netIncome)]);
    }

    autoTable(doc, {
        body: equityData,
        startY: currentY + 5,
        theme: 'plain',
        margin: { left: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Equity: ${formatCurrency(data.totalEquity)}`, 14, currentY);

    doc.save(`balance_sheet_${new Date().toISOString().split('T')[0]}.pdf`);
};
