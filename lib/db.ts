import { Pool, QueryResultRow } from 'pg';

const globalForPool = global as unknown as { pool: Pool };

export const pool =
  globalForPool.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Keep pool small to avoid PostgreSQL shared memory exhaustion
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

// Simplified query helper with retry for transient shared memory errors
export async function serialQuery<T extends QueryResultRow = any>(queryText: string, values?: any[]): Promise<{ rows: T[] }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await pool.query<T>(queryText, values);
    } catch (err: any) {
      if (err.code === '53100' && attempt < 2) {
        // Shared memory error — wait and retry
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      console.error(`DB Query Error (attempt ${attempt + 1}):`, err.message);
      throw err;
    }
  }
  return await pool.query<T>(queryText, values);
}

