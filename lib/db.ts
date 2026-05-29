// src/lib/db.ts
import { Pool } from 'pg';

// Ensures we reuse the same database connection pool during Next.js hot-reloads
const globalForPool = globalThis as unknown as { pool: Pool };

export const pool =
  globalForPool.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Optimal defaults for local PostgreSQL

    // required for Supabase on Vercel
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

export default pool;