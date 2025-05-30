import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      external: [
        'soap',
        'formidable', 
        'node:events',
        'node:fs',
        'node:crypto',
        'node:stream',
        'node:os',
        'node:path'
      ]
    }
  },
  define: {
    global: 'globalThis'
  }
});
