/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark cinematic palette
        cinema: {
          bg: '#020617',        // slate-950
          surface: '#0f172a',   // slate-900
          card: '#1e293b',      // slate-800
          border: '#334155',    // slate-700
          muted: '#94a3b8',     // slate-400
          text: '#e2e8f0',      // slate-200
          heading: '#f8fafc',   // slate-50
        },
        accent: {
          DEFAULT: '#6366f1',   // indigo-500
          light: '#818cf8',     // indigo-400
          dark: '#4f46e5',      // indigo-600
          glow: '#a5b4fc',      // indigo-300
          subtle: '#312e81',    // indigo-900
        },
        reel: {
          red: '#ef4444',
          amber: '#f59e0b',
          emerald: '#10b981',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'cinematic': '0 0 30px -5px rgba(99, 102, 241, 0.15)',
        'glow': '0 0 15px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 30px rgba(99, 102, 241, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
