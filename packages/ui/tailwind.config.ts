import type { Config } from 'tailwindcss';
import preset from '@timeswap/config/tailwind/preset.js';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  presets: [preset],
};

export default config;
