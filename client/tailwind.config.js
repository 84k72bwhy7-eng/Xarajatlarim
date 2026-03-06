/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                forest: {
                    50: '#f0faf5',
                    100: '#dff2ea',
                    200: '#b4e0c8',
                    300: '#7ecba4',
                    400: '#52b082',
                    500: '#3a9669',
                    600: '#2d7a55',
                    700: '#1e6142',
                    800: '#1a4d3a',
                    900: '#0d2b1e',
                },
                earth: {
                    50: '#fdf6f0',
                    100: '#f8ece0',
                    200: '#f0d4bc',
                    300: '#e4b89a',
                    400: '#d4987a',
                    500: '#bf7c55',
                    600: '#a06040',
                    700: '#7d4e31',
                    800: '#5c2c12',
                    900: '#3b1a0a',
                },
                sand: {
                    100: '#f5e6d0',
                    200: '#e8d5b7',
                    300: '#d4bb96',
                }
            }
        },
    },
    plugins: [],
}
