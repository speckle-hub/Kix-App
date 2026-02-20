export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        primary: "#38ff14",
        secondary: "#1A1A1A",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        condensed: ['Oswald', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        'lg': '2rem',
        'xl': '3rem',
      },
      maxWidth: {
        'mobile': '450px',
      }
    },
  },
  plugins: [],
}
