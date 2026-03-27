/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', 
        surface: '#111827', 
        primary: {
          DEFAULT: '#6366F1', 
          glow: '#818CF8', 
        },
        accent: {
          cyan: '#06B6D4',
          neon: '#22D3EE',
          purple: '#A855F7', // Added for multi-color gradients
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
        'auth-pattern': "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
      },
      boxShadow: {
        'neon-primary': '0 0 20px rgba(99, 102, 241, 0.4)',
        'neon-accent': '0 0 20px rgba(6, 182, 212, 0.4)',
        'neon-danger': '0 0 20px rgba(239, 68, 68, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
        'glass-inset': 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}