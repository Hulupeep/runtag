import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'runtag-black': '#0a0a0a',
        'runtag-white': '#f5f5f0',
        'runtag-green': '#34c759',
        'runtag-red': '#ff3b30',
        'runtag-gray': '#86868b',
      },
      fontFamily: {
        headline: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'nfc-ripple': 'ripple 600ms ease-out forwards',
        'chain-pop': 'chainPop 400ms ease-out forwards',
        'fade-in': 'fadeIn 500ms ease-out forwards',
        'slide-up': 'slideUp 500ms ease-out forwards',
        'pulse-glow': 'pulseGlow 1500ms ease-in-out infinite',
        'runner': 'runnerMove 5000ms linear forwards',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.8' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        chainPop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
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
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(52, 199, 89, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(52, 199, 89, 0.8)' },
        },
        runnerMove: {
          '0%': { left: '10%' },
          '100%': { left: '90%' },
        },
      },
      transitionDuration: {
        'scene': '500ms',
      },
    },
  },
  plugins: [],
}
export default config
