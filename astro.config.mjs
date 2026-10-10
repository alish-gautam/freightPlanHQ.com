// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import { site } from './src/lib/site';

// https://astro.build/config
export default defineConfig({
  // Configurable production domain derived from single source of truth
  site: site.url,
  trailingSlash: 'always',
  build: { format: 'directory' },
  redirects: {
    '/guides/nmfc-density-class-changes/': '/guides/nmfc-2025-changes/',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/guides/nmfc-density-class-changes/'),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
