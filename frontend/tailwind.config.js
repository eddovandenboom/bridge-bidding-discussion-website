/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bridge-themed colors
        'bridge-green': '#0F5132',
        'bridge-red': '#DC3545',
        'bridge-blue': '#0D6EFD',
        'bridge-gold': '#FFD700',
        // Card suit colors
        'spade': '#000000',
        'heart': '#DC2626',
        'diamond': '#DC2626',
        'club': '#000000',
      },
      fontFamily: {
        'bridge': ['Georgia', 'serif'],
        'cards': ['Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}