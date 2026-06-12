/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Graphite ink scale — warm-undertone dark surfaces
        ink: {
          950: '#0B0D11',
          900: '#101319',
          800: '#161B23',
          700: '#222837',
          600: '#2E3547',
          500: '#3D4556',
          400: '#5A6275',
          300: '#8B93A7',
          200: '#AEB4C4',
          100: '#C9CEDB',
        },
        // Bone — warm off-white, evokes ledger paper
        bone: {
          DEFAULT: '#EAE6DC',
          dim: '#C9C4B8',
        },
        // Bullion gold — the accent. Banking heritage, not SaaS blue.
        gold: {
          DEFAULT: '#C9A961',
          bright: '#E2C57E',
          dim: '#8A7443',
          glow: 'rgba(201, 169, 97, 0.12)',
        },
        // Risk semaphore — used ONLY for data semantics, never decoration
        risk: {
          low: '#3FB970',
          medium: '#E0A83E',
          high: '#E06450',
        },
        // Steel — analytics/info
        steel: {
          DEFAULT: '#6B9BD2',
          dim: '#44618A',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.18em',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'rise': 'rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite',
        'tick': 'tick 1.1s steps(2) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        tick: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
 