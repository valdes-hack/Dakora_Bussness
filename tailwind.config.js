/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- Très important : ça dit à Tailwind de regarder dans SRC
  ],
  theme: {
    extend: {
      colors: {
        'dakora-green': '#2D5A27',
        'dakora-yellow': '#F2C94C',
      }
    },
  },
  plugins: [],
}