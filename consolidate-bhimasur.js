// Script to consolidate all Bhimasar entries to Bhimasur naming
import { db } from './server/db.ts';
import { complaints as complaintsTable } from './shared/schema.ts';
import { eq, or, like } from 'drizzle-orm';

async function consolidateBhimasur() {
  console.log('🔧 Consolidating Bhimasar entries to Bhimasur...');
  
  try {
    // Get all complaints with Bhimasar variations
    const allComplaints = await db.select().from(complaintsTable);
    
    let updatedCount = 0;
    
    for (const complaint of allComplaints) {
      let needsUpdate = false;
      const updates = {};
      
      // Check placeOfSupply field
      if (complaint.placeOfSupply && complaint.placeOfSupply.toLowerCase().includes('bhimasar')) {
        updates.placeOfSupply = 'Bhimasur';
        needsUpdate = true;
      }
      
      // Check complaintReceivingLocation field
      if (complaint.complaintReceivingLocation && complaint.complaintReceivingLocation.toLowerCase().includes('bhimasar')) {
        updates.complaintReceivingLocation = complaint.complaintReceivingLocation.replace(/bhimasar/gi, 'Bhimasur');
        needsUpdate = true;
      }
      
      // Check any other text fields that might contain location names
      if (complaint.depoPartyName && complaint.depoPartyName.toLowerCase().includes('bhimasar')) {
        updates.depoPartyName = complaint.depoPartyName.replace(/bhimasar/gi, 'Bhimasur');
        needsUpdate = true;
      }
      
      if (complaint.voc && complaint.voc.toLowerCase().includes('bhimasar')) {
        updates.voc = complaint.voc.replace(/bhimasar/gi, 'Bhimasur');
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await db.update(complaintsTable)
          .set(updates)
          .where(eq(complaintsTable.id, complaint.id));
        
        console.log(`✅ Updated complaint #${complaint.id} - consolidated Bhimasar to Bhimasur`);
        updatedCount++;
      }
    }
    
    // Check final counts
    const finalComplaints = await db.select().from(complaintsTable);
    const bhimasurCount = finalComplaints.filter(c => 
      (c.placeOfSupply && c.placeOfSupply.toLowerCase().includes('bhimasur')) ||
      (c.complaintReceivingLocation && c.complaintReceivingLocation.toLowerCase().includes('bhimasur'))
    ).length;
    
    const bhimasarCount = finalComplaints.filter(c => 
      (c.placeOfSupply && c.placeOfSupply.toLowerCase().includes('bhimasar')) ||
      (c.complaintReceivingLocation && c.complaintReceivingLocation.toLowerCase().includes('bhimasar'))
    ).length;
    
    console.log(`\n📊 Final Counts:`);
    console.log(`  Bhimasur: ${bhimasurCount}`);
    console.log(`  Bhimasar: ${bhimasarCount}`);
    console.log(`\n✅ Updated ${updatedCount} complaints successfully!`);
    
  } catch (error) {
    console.error('❌ Error consolidating Bhimasur entries:', error);
  }
}

consolidateBhimasur();