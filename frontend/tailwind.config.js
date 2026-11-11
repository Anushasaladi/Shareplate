/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf7f0', 100: '#d6edde', 200: '#aedabe', 300: '#7fc299', 400: '#4ca775',
          500: '#2f8a59', 600: '#1f6f46', 700: '#1a5a3a', 800: '#174a30', 900: '#123c27',
        },
        ink: '#14231a',
        surface: '#f3f5f2',
        saffron: { 400: '#f4c15a', 500: '#f0b03a', 600: '#d8941c' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(20,35,26,.06), 0 4px 14px rgba(20,35,26,.05)' },
    },
  },
  plugins: [],
};
