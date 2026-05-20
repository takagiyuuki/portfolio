import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  srcDir: './src',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [icon()],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 600],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Noto Sans JP',
      cssVariable: '--font-noto-jp',
      weights: [400, 500],
    },
  ],
});
