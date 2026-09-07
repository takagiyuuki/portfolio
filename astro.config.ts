import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  srcDir: './src',
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
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
      weights: [400, 600],
    },
  ],
});
