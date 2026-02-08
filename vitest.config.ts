import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // In CI we run tests inside Docker. Use an env var so we can write
      // coverage into a bind-mounted directory without trying to delete the
      // mount root (which can cause EBUSY).
      reportsDirectory: process.env.COVERAGE_DIR ?? './coverage',
      // Add `lcov` so you can use Codecov/Coveralls later if desired.
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/main.tsx',
      ],
    },
  },
});
