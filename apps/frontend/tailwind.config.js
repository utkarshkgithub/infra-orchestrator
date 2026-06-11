export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#08090E',
        'void-warm': '#0C0D14',
        slate: '#1A1C25',
        'slate-light': '#22242F',
        ash: '#6B7084',
        bone: '#E8E6E1',
        'bone-dim': 'rgba(232, 230, 225, 0.7)',
        phosphor: '#C8FF3C',
        'phosphor-dim': 'rgba(200, 255, 60, 0.12)',
        'phosphor-glow': 'rgba(200, 255, 60, 0.25)',
        ember: '#FF6B4A',
        'ember-dim': 'rgba(255, 107, 74, 0.12)',
        border: 'rgba(232, 230, 225, 0.08)',
        'border-hover': 'rgba(232, 230, 225, 0.14)',
        'surface-glass': 'rgba(26, 28, 37, 0.6)',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'beam-pulse': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-breathe': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'scroll-hint': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'beam-pulse': 'beam-pulse 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'glow-breathe': 'glow-breathe 4s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'scroll-hint': 'scroll-hint 2s ease-in-out infinite',
      },
    },
  },
}