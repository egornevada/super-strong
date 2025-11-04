/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        'card': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        ui: 'var(--font-ui)',
      },
      colors: {
        // Foreground colors
        'fg': {
          1: 'var(--fg-1)',
          2: 'var(--fg-2)',
          3: 'var(--fg-3)',
          inverted: 'var(--fg-inverted)',
          disabled: 'var(--fg-disabled)',
          brand: 'var(--fg-brand)',
          success: 'var(--fg-success)',
          error: 'var(--fg-error)',
        },
        // Background colors
        'bg': {
          1: 'var(--bg-1)',
          2: 'var(--bg-2)',
          3: 'var(--bg-3)',
          inverted: 'var(--bg-inverted)',
          controls: 'var(--bg-controls)',
          disabled: 'var(--bg-disabled)',
          brand: 'var(--bg-brand)',
          success: 'var(--bg-success)',
          error: 'var(--bg-error)',
        },
        // Stroke colors (borders)
        'stroke': {
          1: 'var(--stroke-1)',
          controls: 'var(--stroke-controls)',
          disabled: 'var(--stroke-disabled)',
          brand: 'var(--stroke-brand)',
          success: 'var(--stroke-success)',
          error: 'var(--stroke-error)',
        },
        // Focus colors
        'focus-outside': 'var(--focus-outside)',
        'focus-inside': 'var(--focus-inside)',
      },
      fontSize: {
        'heading-md': ['20px', { fontWeight: 500, lineHeight: '24px', letterSpacing: '-3%' }],
      },
    },
  },
  plugins: [],
};