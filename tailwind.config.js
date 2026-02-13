export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        primary: "#39FF14",
        secondary: "#1A1A1A",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        condensed: ['Oswald', 'sans-serif'],
      },
      maxWidth: {
        'mobile': '450px',
      }
    },
  },
  plugins: [],
}
