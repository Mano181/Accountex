/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#f8fafc',
                surface: {
                    DEFAULT: '#ffffff',
                    highlight: '#f1f5f9',
                },
                border: '#e2e8f0',
                text: {
                    primary: '#334155',
                    secondary: '#64748b',
                },
                primary: '#475569',
                success: '#059669',
                danger: '#dc2626',
            },
        },
    },
    plugins: [],
}
