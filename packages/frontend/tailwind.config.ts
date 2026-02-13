import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--color-primary, #FF6B35)',
        secondary: 'var(--color-secondary, #F7C59F)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'fall': 'fall var(--fall-duration, 2s) linear forwards',
        'sway': 'sway 2s ease-in-out infinite',
        'pop': 'pop 0.3s ease-out',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'confetti': 'confetti var(--confetti-duration, 1.5s) ease-out forwards',
        'card-flip': 'cardFlip 0.5s ease-in-out',
        'progress-fill': 'progressFill var(--progress-duration, 2s) linear',
        'tap-bounce': 'tapBounce 0.15s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        fall: {
          '0%': { transform: 'translateY(-10%) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(var(--fall-rotate, 360deg))', opacity: '0.3' },
        },
        sway: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '50%': { transform: 'translateX(var(--sway-x, 20px)) rotate(var(--sway-rotate, 10deg))' },
        },
        pop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '80%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(var(--confetti-y, 200px)) rotate(var(--confetti-rotate, 720deg)) scale(0)', opacity: '0' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        tapBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
