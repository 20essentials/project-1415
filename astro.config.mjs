// @ts-check
import { defineConfig, envField } from 'astro/config';
import wix from '@wix/astro';
import wixPages from '@wix/astro-pages';

import react from '@astrojs/react';
import wixHostingAdapter from '@wix/astro-wix-hosting-adapter';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  integrations: [
    wix({ essentials: true, translations: true }),
    wixPages(),
    react()
  ],
  security: { checkOrigin: false },
  adapter: wixHostingAdapter(),

  image: {
    domains: ['static.wixstatic.com']
  },

  output: 'server',

  env: {
    schema: {
      PLAYWRIGHT_BASE_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: 'http://localhost:4321',
      }),
      CI: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
    },
  },
});
