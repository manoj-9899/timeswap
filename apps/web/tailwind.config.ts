import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0b6057', // Deep Teal matching TimeSwap reference
          dark: '#00473f',
          light: '#9cf2e8',
          muted: '#f2f4f2',
        },
        primary: {
          DEFAULT: '#00473f',
          container: '#0b6057',
          fixed: '#a8f0e4',
          'fixed-dim': '#8cd4c8',
        },
        secondary: {
          DEFAULT: '#904d00',
          container: '#fe932c',
          fixed: '#ffdcc3',
          'fixed-dim': '#ffb77d',
        },
        tertiary: {
          DEFAULT: '#004641',
          container: '#006059',
          fixed: '#9cf2e8',
          'fixed-dim': '#80d5cb',
        },
        surface: {
          DEFAULT: '#f7f9fb',
          container: '#eceef0',
          'container-low': '#f2f4f6',
          'container-high': '#e6e8ea',
          'container-lowest': '#ffffff',
          variant: '#e0e3e5',
        },
        'on-surface': {
          DEFAULT: '#191c1e',
          variant: '#3f4947',
        },
        'outline-variant': '#bec9c6',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
