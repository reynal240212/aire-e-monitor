/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Esto le dice a Tailwind dónde buscar tus componentes para procesar las clases
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0a0c',              // Fondo oscuro profundo
          card: 'rgba(20, 20, 25, 0.7)', // Tarjetas de cristal translúcidas
          title: '#ffffff',             // Títulos en blanco puro
          muted: '#94a3b8',             // Textos secundarios grisáceos
          neon: '#00f2fe',              // Cyan / neón característico de tu app
          success: '#10b981',           // Verde esmeralda para ahorros y aciertos
          danger: '#f43f5e',            // Rojo/rosa neón para alertas y horarios a evitar
        }
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 5px rgba(0,242,254,0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(0,242,254,0.2))' },
        }
      }
    },
  },
  plugins: [],
}