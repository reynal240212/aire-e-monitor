/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#08080f',
          card: 'rgba(18,18,35,0.75)',
          title: '#f0f0f5',
          muted: '#9090b0',
          neon: '#00e5ff',
          success: '#10b981',
          danger: '#f43f5e',
        }
      },
      animation: { 'fade-in-up': 'fadeInUp 0.5s ease forwards' },
      keyframes: {
        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } }
      }
    },
  },
  plugins: [],
}
