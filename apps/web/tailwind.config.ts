import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './tokens/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        popo: {
          pink: {
            DEFAULT: '#FF1A6C',
            hover: '#E0125C',
            light: '#FF4D8D',
            glow: 'rgba(255, 26, 108, 0.45)',
          },
          purple: {
            DEFAULT: '#7928CA',
            dark: '#4C1D95',
            light: '#9333EA',
          },
          cyan: {
            DEFAULT: '#00E5FF',
            glow: 'rgba(0, 229, 255, 0.4)',
          },
          gold: {
            DEFAULT: '#FFB800',
            light: '#FFD700',
            dark: '#D97706',
            shimmer: '#FFE885',
          },
          live: '#FF2B44',
          dark: {
            950: '#0B0B10', // main background
            900: '#111118', // elevated surface
            850: '#171722', // cards / containers
            800: '#1F1F2E', // elevated cards / hover
            700: '#2C2C3E', // borders / dividers
            600: '#3D3D52', // subtle icons
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#A1A1B2',
            muted: '#68687A',
            highlight: '#FF1A6C',
            gold: '#FFD700',
          },
          state: {
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', '-apple-system', 'sans-serif'],
        urdu: ['var(--font-urdu)', 'Noto Nastaliq Urdu', 'system-ui', 'serif'],
      },
      boxShadow: {
        'glow-pink': '0 0 24px -2px rgba(255, 26, 108, 0.45)',
        'glow-cyan': '0 0 20px -2px rgba(0, 229, 255, 0.35)',
        'glow-gold': '0 0 20px -2px rgba(255, 184, 0, 0.4)',
        'card-dark': '0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'card-hover': '0 15px 35px -5px rgba(255, 26, 108, 0.15), 0 0 0 1px rgba(255, 26, 108, 0.3)',
      },
      keyframes: {
        'live-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.25)', opacity: '0.6' },
        },
        'wave-bar': {
          '0%, 100%': { height: '4px' },
          '50%': { height: '18px' },
        },
        'pk-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'live-pulse': 'live-pulse 1.8s ease-in-out infinite',
        'wave-1': 'wave-bar 0.9s ease-in-out infinite',
        'wave-2': 'wave-bar 0.9s ease-in-out 0.2s infinite',
        'wave-3': 'wave-bar 0.9s ease-in-out 0.4s infinite',
        'pk-shimmer': 'pk-shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
