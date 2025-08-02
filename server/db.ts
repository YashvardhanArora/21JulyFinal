import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Use environment variable or fallback to existing connection for backward compatibility
const connectionString = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_AuNIRdz0CQL9@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });

export default db;