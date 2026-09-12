import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B1526',
          900: '#101E36',
          800: '#172A4A',
          700: '#233A5E',
          600: '#334C73',
          500: '#4A6086',
        },
        brass: {
          50: '#FBF6EC',
          100: '#F5E9CC',
          200: '#E9D19C',
          300: '#DCB86E',
          400: '#C79952',
          500: '#B8863B',
          600: '#9C6E2E',
          700: '#7C5624',
        },
        success: {
          50: '#EDF9F5', 100: '#D2F0E5', 200: '#A5E0CB', 300: '#72CBAC', 400: '#43B48D',
          500: '#279973', 600: '#1B7E5F', 700: '#17654E', 800: '#155040', 900: '#134136',
        },
        warning: {
          50: '#FFF7EC', 100: '#FEEACB', 200: '#FDD08E', 300: '#FCB355', 400: '#F89729',
          500: '#E87D12', 600: '#C6640C', 700: '#9D4F0C', 800: '#7E4010', 900: '#663512',
        },
        danger: {
          50: '#FDF3F2', 100: '#FBE2DF', 200: '#F6C3BD', 300: '#EE9C92', 400: '#E16F60',
          500: '#CE4A38', 600: '#C13527', 700: '#9C2A1E', 800: '#7D231A', 900: '#661F19',
        },
        
        
        
        
        
        info: {
          50: '#F1F5FB', 100: '#DEE8F5', 200: '#BCD0EA', 300: '#93B2DB', 400: '#6791C8',
          500: '#4574B3', 600: '#325D97', 700: '#294B7A', 800: '#233F65', 900: '#1E3554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 30 54 / 0.04), 0 1px 3px 0 rgb(16 30 54 / 0.06)',
        elevated: '0 4px 6px -2px rgb(16 30 54 / 0.05), 0 10px 20px -6px rgb(16 30 54 / 0.10)',
        'card-dark': '0 1px 2px 0 rgb(0 0 0 / 0.20), 0 1px 3px 0 rgb(0 0 0 / 0.24)',
        'elevated-dark': '0 4px 6px -2px rgb(0 0 0 / 0.20), 0 10px 24px -6px rgb(0 0 0 / 0.45)',
        
        
        
        
        
        ambient: '0 20px 25px -5px rgb(16 30 54 / 0.06), 0 30px 60px -12px rgb(16 30 54 / 0.12)',
        'ambient-dark': '0 20px 25px -5px rgb(0 0 0 / 0.30), 0 30px 60px -12px rgb(0 0 0 / 0.55)',
        
        
        
        'glow-brass': '0 0 0 1px rgb(184 134 59 / 0.25), 0 8px 24px -4px rgb(184 134 59 / 0.35)',
        'glow-brass-dark': '0 0 0 1px rgb(199 153 82 / 0.35), 0 8px 24px -4px rgb(199 153 82 / 0.35)',
      },
      backgroundImage: {
        
        
        
        
        'ink-wash': 'linear-gradient(135deg, #0B1526 0%, #172A4A 55%, #0B1526 100%)',
        'brass-sheen': 'linear-gradient(135deg, #C79952 0%, #B8863B 45%, #9C6E2E 100%)',
        'card-sheen': 'linear-gradient(180deg, rgb(255 255 255 / 0.06) 0%, rgb(255 255 255 / 0) 100%)',
      },
      transitionTimingFunction: {
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'slide-in': 'slide-in 0.18s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-in-up': 'fade-in-up 0.25s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'spin-slow': 'spin 2.5s linear infinite',
        'count-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'slide-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
} satisfies Config;
