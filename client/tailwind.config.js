/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Y Combinator light theme
        yc: '#ff6600',
        ycDark: '#e25c00',
        ycSoft: '#fff1e7',
        // semantic accent aliases (kept so legacy class names stay sane)
        glow: '#ff6600',
        coral: '#e5484d',
        lime: '#16a34a',
        violet: '#7c3aed',
        amber: '#d97706',
        // text + surfaces
        ink: '#1b1a17',
        steel: '#57534e',
        muted: '#8a857c',
        line: '#eae6df',
        paper: '#ffffff',
        cream: '#faf8f4',
        // legacy dark-surface names remapped to light so stray usages stay light
        abyss: '#ffffff',
        nebula: '#faf8f4',
        slab: '#ffffff',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        lift: '0 10px 30px rgba(16,24,40,0.08)',
        glow: '0 10px 34px rgba(255,102,0,0.14)',
        'glow-lg': '0 18px 50px rgba(255,102,0,0.18)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
      },
      animation: {
        pulseSoft: 'pulseSoft 1.8s ease-in-out infinite',
        drift: 'drift 12s ease-in-out infinite',
        breathe: 'breathe 6s ease-in-out infinite',
        float: 'float 9s ease-in-out infinite',
        shimmer: 'shimmer 2.6s linear infinite',
        sweep: 'sweep 3.4s ease-in-out infinite',
        rise: 'rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.88' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0px, 0px)' },
          '50%': { transform: 'translate(12px, -16px)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.08)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sweep: {
          '0%': { transform: 'translateX(-120%)' },
          '60%, 100%': { transform: 'translateX(320%)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
