import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config — migrations live in `drizzle/`. DATABASE_URL is required
 * only for `drizzle-kit migrate/push`; the app itself never needs it (seed
 * fallback). See ARCHITECTURE.md §4 and §12.
 */
export default defineConfig({
  dialect: 'mysql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'mysql://terreno:terreno@127.0.0.1:3306/terreno_dev',
  },
});
