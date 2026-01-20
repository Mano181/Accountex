export const PDF_THEME = {
    colors: {
        primary: [0, 0, 0], // Strict Black for statutory titles
        secondary: [80, 80, 80], // Dark Grey for subtitles
        accent: [0, 0, 0],
        text: {
            primary: [0, 0, 0], // Black text
            secondary: [60, 60, 60], // Dark Grey
            success: [0, 0, 0],
            danger: [0, 0, 0],
        },
        table: {
            header: [255, 255, 255], // White background for clean look
            text: [0, 0, 0],
            alternateRow: [255, 255, 255] // No alternating rows for statutory look
        }
    },
    fonts: {
        title: { size: 16, style: 'bold' }, // Slightly smaller, more formal title
        subtitle: { size: 10, style: 'normal' },
        header: { size: 10, style: 'bold' }, // Section headers
        body: { size: 10, style: 'normal' },
        total: { size: 10, style: 'bold' }
    },
    layout: {
        margin: 20,
        lineHeight: 6
    }
};
