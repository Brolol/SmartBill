/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We will force dark mode for that premium SaaS feel
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', // Deep futuristic blue/black
        surface: '#111827', // Slightly lighter for cards
        primary: {
          DEFAULT: '#6366F1', // Indigo
          glow: '#818CF8', // Lighter neon indigo
        },
        accent: {
          cyan: '#06B6D4',
          neon: '#22D3EE',
        },
        danger: {
          DEFAULT: '#EF4444',
          glow: '#F87171',
        },
        success: '#10B981',
        warning: '#F59E0B',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)',
        'neon-shimmer': 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)',
      },
      boxShadow: {
        'neon-primary': '0 0 15px rgba(99, 102, 241, 0.3)',
        'neon-danger': '0 0 15px rgba(239, 68, 68, 0.3)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}