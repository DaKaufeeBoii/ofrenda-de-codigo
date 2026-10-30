/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#07050b',
          900: '#0d0a14',
          800: '#151122',
          700: '#201a33',
          600: '#2d2547',
        },
        marigold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          glow: '#ffaa00',
        },
        calavera: {
          bone: '#f7f4ea',
          aged: '#e5ded0',
          purple: '#9333ea',
          crimson: '#dc2626',
        }
      },
      animation: {
        'flicker': 'flicker 3s infinite ease-in-out',
        'flicker-subtle': 'flicker 4.5s infinite ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '25%': { opacity: '0.75', transform: 'scale(0.97) rotate(-1deg)' },
          '50%': { opacity: '1', transform: 'scale(1.03) rotate(1deg)' },
          '75%': { opacity: '0.8', transform: 'scale(0.98)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.65)' },
        }
      }
    },
  },
  plugins: [],
}
