import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dev.rhuanfreire.com.br',
  outDir: './dist',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
});
