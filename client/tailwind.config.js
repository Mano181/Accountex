/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f172a',
                surface: {
                    DEFAULT: '#1e293b',
                    highlight: '#334155',
                },
                border: '#334155',
                text: {
                    primary: '#f8fafc',
                    secondary: '#94a3b8',
                },
                primary: '#3b82f6',
                success: '#10b981',
                danger: '#ef4444',
            },
        },
    },
    plugins: [],
}
