import { config as loadEnvFile } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadEnvFile({ path: '.env.local' });
loadEnvFile();

const databaseUrl = process.env.DATABASE_URL ?? '';

if (!databaseUrl && process.argv.includes('migrate')) {
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local before running migrations.',
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
