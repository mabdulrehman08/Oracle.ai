/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070b14',
        nebula: '#10192a',
        glow: '#6ee7f9',
        coral: '#ff7a59',
        lime: '#9dff7a',
        steel: '#9fb2cc',
      },
      boxShadow: {
        glow: '0 0 30px rgba(110, 231, 249, 0.18)',
      },
      animation: {
        pulseSoft: 'pulseSoft 1.8s ease-in-out infinite',
        drift: 'drift 12s ease-in-out infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.78' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
