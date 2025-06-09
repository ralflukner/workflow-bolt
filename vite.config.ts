import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'fs', 'crypto', 'stream', 'path', 'os', 'zlib', 'http', 'https', 'string_decoder', 'vm'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      'node:fs/promises': 'node-stdlib-browser/mock/empty',
      'node:os': 'node-stdlib-browser/mock/os',
      'node:path': 'path-browserify',
      'node:string_decoder': 'string_decoder',
    }
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
