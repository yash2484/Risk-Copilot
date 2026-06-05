/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          50: '#E2E8F0', 100: '#CBD5E1', 200: '#94A3B8',
          300: '#64748B', 400: '#475569', 500: '#334155',
          600: '#1E293B', 700: '#141B2D', 800: '#0F1524',
          900: '#0B1120', 950: '#070D1A',
        },
        accent: { DEFAULT: '#3B82F6', hover: '#2563EB', dim: '#1D4ED8',
                  glow: 'rgba(59,130,246,0.15)' },
        risk: { low: '#22C55E', medium: '#F59E0B', high: '#EF4444' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}