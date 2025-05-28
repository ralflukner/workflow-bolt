/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/vitest-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'src/__tests__/patientContext.test.tsx', 
      'src/__tests__/scheduleImport.test.tsx', 
      'src/__tests__/scheduleImportExport.test.tsx',
      'src/context/__tests__/PatientContext.test.ts',
      'src/components/__tests__/ImportJSON.test.tsx',
      'src/__tests__/json-workflow.integration.test.ts'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
});
