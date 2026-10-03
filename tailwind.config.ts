import type { Config } from 'tailwindcss';

export default {
  content: ['./src/components/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}', './src/lib/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-body)', 'sans-serif'],
        fun: ['var(--font-fun)', 'var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out both',
        wobble: 'wobble 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
