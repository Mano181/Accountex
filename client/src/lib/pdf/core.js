import jsPDF from 'jspdf';
import { PDF_THEME } from './theme';

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

    // Main Title
    doc.setTextColor(...PDF_THEME.colors.primary);
    doc.setFontSize(PDF_THEME.fonts.title.size);
    doc.setFont(undefined, PDF_THEME.fonts.title.style);
    doc.text(title, pageWidth / 2, margin, { align: 'center' });

    // Subtitle / Date
    doc.setTextColor(...PDF_THEME.colors.text.secondary);
    doc.setFontSize(PDF_THEME.fonts.subtitle.size);
    doc.setFont(undefined, PDF_THEME.fonts.subtitle.style);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, margin + 6, { align: 'center' });
    doc.text(subtitle, pageWidth / 2, margin + 11, { align: 'center' });

    // Separator Line
    doc.setDrawColor(...PDF_THEME.colors.secondary);
    doc.setLineWidth(0.1);
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

    return margin + 25; // Return Y position to start content
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
