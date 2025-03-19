
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src', 'popup.tsx'),
      },
      output: {
        // Output a single file named popup.js in the build directory
        entryFileNames: 'popup.js',
      },
    },
    outDir: 'dist',
  },
});
