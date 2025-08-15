import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_AuNIRdz0CQL9@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function clear2024Complaints() {
  try {
    console.log('Clearing all 2024 complaints...');
    const result = await pool.query("DELETE FROM complaints WHERE EXTRACT(YEAR FROM date::date) = 2024");
    console.log(`✅ Deleted ${result.rowCount} complaints from 2024`);
  } catch (error) {
    console.error('❌ Error clearing 2024 complaints:', error);
  } finally {
    await pool.end();
  }
}

clear2024Complaints();