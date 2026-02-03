import jsPDF from 'jspdf';
import { PDF_THEME } from './theme';

const formatReportDate = (date = new Date()) => {
    return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

/**
 * Creates a new jsPDF instance with default settings
 */
export const createDoc = () => {
    return new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
};

/**
 * Adds the standard report header
 */
export const addHeader = (doc, title, subtitle = 'Accounting Reports App') => {
    const pageWidth = doc.internal.pageSize.width;
    const { margin } = PDF_THEME.layout;

    // Brand line
    doc.setTextColor(...PDF_THEME.colors.text.secondary);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Accounting Reports', margin, margin - 4);

    // Title
    doc.setTextColor(...PDF_THEME.colors.text.primary);
    doc.setFontSize(PDF_THEME.fonts.title.size);
    doc.setFont(undefined, PDF_THEME.fonts.title.style);
    doc.text(title, margin, margin + 4);

    // Subtitle
    doc.setTextColor(...PDF_THEME.colors.text.secondary);
    doc.setFontSize(PDF_THEME.fonts.subtitle.size);
    doc.setFont(undefined, PDF_THEME.fonts.subtitle.style);
    doc.text(subtitle, margin, margin + 10);

    // Generated timestamp (right aligned)
    doc.setFontSize(9);
    doc.setTextColor(...PDF_THEME.colors.text.secondary);
    doc.text(`Generated: ${formatReportDate()}`, pageWidth - margin, margin + 4, { align: 'right' });

    // Separator line
    doc.setDrawColor(...PDF_THEME.colors.border);
    doc.setLineWidth(0.2);
    doc.line(margin, margin + 14, pageWidth - margin, margin + 14);

    return margin + 22;
};

export const addFooter = (doc, leftText = 'Prepared by Accounting Reports') => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const { margin, footerHeight } = PDF_THEME.layout;

    for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(...PDF_THEME.colors.border);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);

        doc.setFontSize(PDF_THEME.fonts.footer.size);
        doc.setTextColor(...PDF_THEME.colors.text.secondary);
        doc.setFont(undefined, PDF_THEME.fonts.footer.style);
        doc.text(leftText, margin, pageHeight - 6);
        doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }
};

/**
 * Safe save strategy for mobile compatibility
 */
export const saveOrOpenPDF = (doc, filename) => {
    // Detect mobile user agent (loose check)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        // On mobile, opening in a new tab is often safer/more reliable than forcing download
        window.open(doc.output('bloburl'), '_blank');
    } else {
        // On desktop, force download
        doc.save(filename);
    }
};
