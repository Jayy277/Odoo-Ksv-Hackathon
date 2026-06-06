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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bcdcfe',
          300: '#82bdfd',
          400: '#4397fc',
          500: '#1b6ff7',
          600: '#0e4fe3',
          700: '#0b3eb9',
          800: '#0f3695',
          900: '#133178',
          950: '#0c1d4a',
        }
      }
    },
  },
  plugins: [],
}
