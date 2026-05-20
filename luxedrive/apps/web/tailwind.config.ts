import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // LuxeDrive brand palette
        gold: {
          50:  '#FFFDF0',
          100: '#FFF8D1',
          200: '#FFF0A3',
          300: '#FFE566',
          400: '#FFD700',
          500: '#E6C200',
          600: '#B89900',
          700: '#8A7100',
          800: '#5C4A00',
          900: '#2E2500',
        },
        obsidian: {
          50:  '#F5F5F5',
          100: '#E0E0E0',
          200: '#BDBDBD',
          300: '#9E9E9E',
          400: '#757575',
          500: '#424242',
          600: '#212121',
          700: '#161616',
          800: '#0D0D0D',
          900: '#080808',
          950: '#040404',
        },
        cream: {
          50:  '#FDFCF8',
          100: '#FAF8F0',
          200: '#F5F0E0',
          300: '#EDE5C8',
          400: '#E0D5A8',
          500: '#CFC090',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
        'display-sm':  ['1.875rem',{ lineHeight: '1.25' }],
      },
      spacing: {
        '18':  '4.5rem',
        '22':  '5.5rem',
        '88':  '22rem',
        '100': '25rem',
        '112': '28rem',
        '120': '30rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out',
        'fade-up':      'fadeUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'shimmer':      'shimmer 2s infinite linear',
        'float':        'float 6s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
        'pulse-gold':   'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(255, 215, 0, 0)' },
        },
      },
      backgroundImage: {
        'gold-gradient':     'linear-gradient(135deg, #FFD700 0%, #E6C200 50%, #B89900 100%)',
        'dark-gradient':     'linear-gradient(180deg, #080808 0%, #161616 100%)',
        'hero-gradient':     'radial-gradient(ellipse at 60% 50%, rgba(255,215,0,0.08) 0%, transparent 70%)',
        'card-gradient':     'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'shimmer-gradient':  'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.1) 50%, transparent 100%)',
      },
      boxShadow: {
        'gold-sm':  '0 2px 8px rgba(255, 215, 0, 0.2)',
        'gold-md':  '0 4px 16px rgba(255, 215, 0, 0.25)',
        'gold-lg':  '0 8px 32px rgba(255, 215, 0, 0.3)',
        'gold-xl':  '0 16px 48px rgba(255, 215, 0, 0.35)',
        'dark-sm':  '0 2px 8px rgba(0, 0, 0, 0.4)',
        'dark-md':  '0 4px 20px rgba(0, 0, 0, 0.5)',
        'dark-lg':  '0 8px 40px rgba(0, 0, 0, 0.6)',
        'glass':    '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
}

export default config
