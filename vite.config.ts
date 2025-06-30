import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'fs', 'crypto', 'stream', 'path', 'os', 'zlib', 'http', 'https', 'string_decoder', 'vm', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  server: {
    port: 5173, // Use Vite's default port
    host: true, // Allow external connections
  },
  optimizeDeps: {
    exclude: ['lucide-react', '@google-cloud/secret-manager'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'node:fs/promises': 'node-stdlib-browser/mock/empty',
      'node:os': 'node-stdlib-browser/mock/os',
      'node:path': 'path-browserify',
      'node:string_decoder': 'string_decoder',
      '@google-cloud/secret-manager': path.resolve(__dirname, 'src/mocks/secretManagerBrowserStub.ts'),
      'node:stream/web': 'node-stdlib-browser/mock/empty',
      'util': 'util'
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
