/** @type {import('tailwindcss').Config} */
// ── FORENSIC LEDGER ─────────────────────────────────────────────────────────
// Warm-paper analyst instrument. Ink on paper, hairline structure, one prussian
// accent for brand/interaction, and the green/amber/red risk semaphore reserved
// strictly for data meaning. Depth comes from material contrast + hairlines, not
// decorative shadow.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warm paper surfaces (the ledger)
        paper: {
          DEFAULT: '#EDE9E0',   // page ground
          deep:    '#E4DFD4',   // wells / inset
          raised:  '#FAF8F3',   // cards, panels
          raised2: '#F3F0E9',   // hover / secondary fill
        },
        // Warm ink text ramp
        ink: {
          DEFAULT:  '#1B1712',  // headlines, strong, the loud number
          text:     '#3A362E',  // body
          muted:    '#726B5D',  // meta, captions, labels
          faint:    '#948C7C',  // subdued
          disabled: '#B4AE9F',
        },
        // Prussian ink — the single brand accent (interaction, focus, brand mark)
        accent: {
          DEFAULT: '#21456E',
          rich:    '#2A578A',   // hover / active
          deep:    '#173250',   // pressed / deep borders
        },
        // Risk semaphore — DATA MEANING ONLY, never decoration. Print-muted, not neon.
        risk: {
          low:    '#2E7D46',    // green  — lowers risk / healthy
          medium: '#9C6612',    // amber  — watch
          high:   '#B23A31',    // red    — high / raises risk
        },
      },
      fontFamily: {
        // Two faces: humanist geometric sans + technical mono for all data.
        sans:    ['"Albert Sans"', 'system-ui', 'sans-serif'],
        display: ['"Albert Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.16em',
      },
      boxShadow: {
        // Barely-there lift for raised paper cards. Hairline does the real work.
        card:  '0 1px 2px rgba(27,23,18,0.05), 0 1px 1px rgba(27,23,18,0.03)',
        lift:  '0 6px 20px rgba(27,23,18,0.08)',
        focus: '0 0 0 3px rgba(33,69,110,0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'rise': 'rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite',
        'draw': 'draw 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        draw: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
    },
  },
  plugins: [],
}
