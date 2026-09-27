import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.ts';

const databaseUrl =
  typeof process === 'undefined' ? undefined : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local on the server. ' +
      'The Neon connection string must never reach the browser bundle.',
  );
}

const sql = neon(databaseUrl);

export const db = drizzle({ client: sql, schema });
export { schema };
