import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  // Cast to any to avoid vite version mismatch between vitest's bundled vite and @vitejs/plugin-react
  plugins: [react() as any],
  test: {
    // Environment
    environment: 'jsdom',
    
    // Global setup
    globals: true,
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Include patterns
    include: [
      'tests/unit/**/*.test.ts',
      'tests/contract/**/*.test.ts',
    ],
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**',
        'src/app/layout.tsx',
        'src/app/providers.tsx',
      ],
    },
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
