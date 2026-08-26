import type { Config } from 'tailwindcss';
import preset from '@timeswap/config/tailwind/preset.js';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  presets: [preset],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
