/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'star-movement-bottom': {
          '0%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateX(-100px) translateY(-100px) rotate(360deg)' },
        },
        'star-movement-top': {
          '0%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateX(100px) translateY(100px) rotate(360deg)' },
        },
        'star-movement-right': {
          '0%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateX(-100px) translateY(100px) rotate(360deg)' },
        },
        'star-movement-left': {
          '0%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateX(100px) translateY(-100px) rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'aurora-1': {
          '0%': { transform: 'translateX(-100%) translateY(-50%) rotate(0deg)' },
          '50%': { transform: 'translateX(50%) translateY(-25%) rotate(180deg)' },
          '100%': { transform: 'translateX(-100%) translateY(-50%) rotate(360deg)' },
        },
        'aurora-2': {
          '0%': { transform: 'translateX(100%) translateY(50%) rotate(0deg)' },
          '50%': { transform: 'translateX(-50%) translateY(25%) rotate(-180deg)' },
          '100%': { transform: 'translateX(100%) translateY(50%) rotate(-360deg)' },
        },
        'aurora-3': {
          '0%': { transform: 'translateX(0%) translateY(0%) rotate(0deg)' },
          '33%': { transform: 'translateX(30%) translateY(-30%) rotate(120deg)' },
          '66%': { transform: 'translateX(-30%) translateY(30%) rotate(240deg)' },
          '100%': { transform: 'translateX(0%) translateY(0%) rotate(360deg)' },
        },
      },
      animation: {
        gradient: 'gradient 8s linear infinite',
        'star-movement-bottom': 'star-movement-bottom 6s linear infinite',
        'star-movement-top': 'star-movement-top 6s linear infinite',
        'star-movement-right': 'star-movement-right 6s linear infinite',
        'star-movement-left': 'star-movement-left 6s linear infinite',
        shimmer: 'shimmer 2s infinite linear',
        'aurora-1': 'aurora-1 20s ease-in-out infinite',
        'aurora-2': 'aurora-2 25s ease-in-out infinite reverse',
        'aurora-3': 'aurora-3 30s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};