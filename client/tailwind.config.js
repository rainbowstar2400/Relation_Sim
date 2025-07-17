/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: '#454545',
        panel: '#3d3d3d',
        event: '#4eb0db',
        system: '#ffb74d'
      },
      fontFamily: {
        jp: ['"Hiragino Kaku Gothic ProN"', 'Meiryo', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'monospace']
      }
    },
  },
  plugins: [],
}
