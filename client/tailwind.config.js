/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#F8FAFC',
                surface: {
                    DEFAULT: '#FFFFFF',
                    highlight: '#F3F4F6',
                },
                border: '#E5E7EB',
                text: {
                    primary: '#111827',
                    secondary: '#6B7280',
                    header: '#374151',
                },
                primary: {
                    DEFAULT: '#4A6FA5',
                    hover: '#3E5F8A',
                },
                link: '#5B8DEF',
                success: '#2E7D32',
                danger: '#C2413C',
                warning: '#D97706',
            },
        },
    },
    plugins: [],
}
