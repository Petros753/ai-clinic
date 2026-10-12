/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Onest', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          950: '#070b11',
          900: '#0b1119',
          850: '#0f1620',
          800: '#131c28',
          700: '#1b2635',
        },
        line: 'rgba(148,176,214,0.10)',
        fg: { DEFAULT: '#e7edf4', 2: '#a3b0c0', 3: '#6d7b8e' },
        accent: { DEFAULT: '#5cc8ff', deep: '#3987e5' },
        ai: { DEFAULT: '#9d8cff', deep: '#7563e8' },
        ok: '#22b35e',
        warn: '#f5b020',
        crit: '#e5484d',
        idle: '#5b6778',
      },
      boxShadow: {
        glass: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -24px rgba(0,0,0,0.6)',
      },
      borderRadius: { xl2: '18px' },
    },
  },
  plugins: [],
}
