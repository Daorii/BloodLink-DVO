/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C21C24',
          darkRed: '#8A1015',
          rose: '#FFF1F2',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Instrument Sans', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        accent: ['Bricolage Grotesque', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
