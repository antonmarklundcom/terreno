import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Vitest runs the pure-logic unit tests — the no-DB verify path every cloud
 * session relies on (money math, URL builders, repo filtering/facets, lead
 * routing). The `@/*` alias mirrors tsconfig so seed/repo imports resolve.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
