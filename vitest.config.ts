import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: {
      '@': resolve('./src'),
      'wix:astro:i18n': resolve('./tests/mocks/wix-astro-i18n.ts'),
      'astro:env/client': resolve('./tests/mocks/astro-env-client.ts'),
      '@wix/essentials': resolve('./tests/mocks/wix-essentials.ts'),
      '@wix/site': resolve('./tests/mocks/wix-site.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
  },
});
