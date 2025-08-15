import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { complaints } from './shared/schema.ts';
import { sql, eq, and, like } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    "postgresql://neondb_owner:npg_AuNIRdz0CQL9@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const db = drizzle(pool, { schema: { complaints } });

async function fixDepotNames() {
  console.log('🔧 Fixing depot names for 2024 complaints...');
  
  try {
    // Find all 2024 complaints with generic customer names
    const complaintsToFix = await db.select()
      .from(complaints)
      .where(
        and(
          sql`EXTRACT(YEAR FROM ${complaints.date}::date) = 2024`,
          like(complaints.depoPartyName, 'Customer %')
        )
      );
    
    console.log(`📊 Found ${complaintsToFix.length} complaints with generic depot names`);
    
    if (complaintsToFix.length > 0) {
      // Show sample before fixing
      console.log('\n📋 Sample complaints to fix:');
      complaintsToFix.slice(0, 5).forEach(c => {
        console.log(`- ID: ${c.id}, Current depot: "${c.depoPartyName}"`);
      });
      
      // Update all generic depot names to "-"
      const result = await db.update(complaints)
        .set({ depoPartyName: '-' })
        .where(
          and(
            sql`EXTRACT(YEAR FROM ${complaints.date}::date) = 2024`,
            like(complaints.depoPartyName, 'Customer %')
          )
        );
      
      console.log(`✅ Updated ${complaintsToFix.length} complaints to have "-" for depot name`);
      
      // Verify the fix
      const verifyCount = await db.select()
        .from(complaints)
        .where(
          and(
            sql`EXTRACT(YEAR FROM ${complaints.date}::date) = 2024`,
            like(complaints.depoPartyName, 'Customer %')
          )
        );
      
      console.log(`🔍 Verification: ${verifyCount.length} complaints still have generic names (should be 0)`);
      
      // Show sample after fixing
      const sampleFixed = await db.select()
        .from(complaints)
        .where(
          and(
            sql`EXTRACT(YEAR FROM ${complaints.date}::date) = 2024`,
            eq(complaints.depoPartyName, '-')
          )
        )
        .limit(5);
      
      console.log('\n✅ Sample fixed complaints:');
      sampleFixed.forEach(c => {
        console.log(`- ID: ${c.id}, Depot: "${c.depoPartyName}", Product: ${c.productName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing depot names:', error);
  } finally {
    await pool.end();
  }
}

fixDepotNames();