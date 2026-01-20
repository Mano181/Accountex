export const PDF_THEME = {
    colors: {
        primary: [33, 37, 41], // Almost Black for Titles
        secondary: [108, 117, 125], // Grey for subtitles
        accent: [41, 128, 185], // Subtle Blue for logic/branding if needed
        text: {
            primary: [33, 37, 41], // Dark Grey/Black
            secondary: [108, 117, 125], // Muted Grey
            success: [33, 37, 41], // Standard accounting usually doesn't color totals green/red, just brackets. Keeping neutral.
            danger: [33, 37, 41], // Standard accounting uses brackets () for negatives, not red.
        },
        table: {
            header: [248, 249, 250], // Very Light Grey
            text: [33, 37, 41],
            alternateRow: [255, 255, 255] // Plain white for clean print
        }
    },
    fonts: {
        title: { size: 20, style: 'bold' },
        subtitle: { size: 10, style: 'normal' },
        header: { size: 12, style: 'bold' },
        body: { size: 10, style: 'normal' },
        total: { size: 11, style: 'bold' }
    },
    layout: {
        margin: 20, // Wider margins for professional look
        lineHeight: 8
    }
};
