/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dakora-green':  '#2D5A27',
        'dakora-yellow': '#F2C94C',
        // Couleurs extraites directement du logo Dakora Business
        'dakora-lime':   '#A8DC00',  // vert-jaune du "d"
        'dakora-blue':   '#159FFF',  // bleu du "B"
      }
    },
  },
  plugins: [],
}