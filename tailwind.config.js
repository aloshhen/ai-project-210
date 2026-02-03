export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'baza-red': '#DC2626',
        'baza-red-dark': '#B91C1C',
        'baza-black': '#0A0A0A',
        'baza-gray': '#171717',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}