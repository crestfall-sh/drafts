// @ts-check
// https://vitejs.dev/config/

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: path.join(process.cwd(), './crestfall-studio/client/'),
  build: {
    outDir: path.join(process.cwd(), './crestfall-studio/client/dist/'),
  },
});
