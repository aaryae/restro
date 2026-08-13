/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
      },
      fontFamily: {
        sans: ['"Google Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(1rem)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-out': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(1rem)' },
        },
        'drawer-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'drawer-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'backdrop-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'backdrop-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'error-enter': {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'error-orb': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(18px, -14px) scale(1.08)' },
        },
        'error-code-rise': {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.92)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'error-chip': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'error-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.75)' },
        },
        'error-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'toast-in': 'toast-in 220ms ease-out',
        'toast-out': 'toast-out 180ms ease-in forwards',
        'drawer-in': 'drawer-in 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        'drawer-out': 'drawer-out 220ms ease-in forwards',
        'backdrop-in': 'backdrop-in 220ms ease-out',
        'backdrop-out': 'backdrop-out 180ms ease-in forwards',
        'error-enter': 'error-enter 560ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both',
        'error-orb': 'error-orb 9s ease-in-out infinite',
        'error-orb-delayed': 'error-orb 11s ease-in-out 1.4s infinite',
        'error-code-rise':
          'error-code-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'error-chip':
          'error-chip 480ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both',
        'error-dot': 'error-dot 1.8s ease-in-out infinite',
        'error-fade': 'error-fade 600ms ease-out 420ms both',
      },
    },
  },
  plugins: [],
}
