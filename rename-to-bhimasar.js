// Script to rename all Bhimasur entries back to Bhimasar (correct spelling)
import { db } from './server/db.ts';
import { complaints as complaintsTable } from './shared/schema.ts';
import { eq, or, like } from 'drizzle-orm';

async function renameToBhimasar() {
  console.log('🔧 Renaming all Bhimasur entries to Bhimasar (correct spelling)...');
  
  try {
    // Get all complaints with Bhimasur variations
    const allComplaints = await db.select().from(complaintsTable);
    
    let updatedCount = 0;
    
    for (const complaint of allComplaints) {
      let needsUpdate = false;
      const updates = {};
      
      // Check placeOfSupply field
      if (complaint.placeOfSupply && complaint.placeOfSupply.toLowerCase().includes('bhimasur')) {
        updates.placeOfSupply = 'Bhimasar';
        needsUpdate = true;
      }
      
      // Check complaintReceivingLocation field
      if (complaint.complaintReceivingLocation && complaint.complaintReceivingLocation.toLowerCase().includes('bhimasur')) {
        updates.complaintReceivingLocation = complaint.complaintReceivingLocation.replace(/bhimasur/gi, 'Bhimasar');
        needsUpdate = true;
      }
      
      // Check any other text fields that might contain location names
      if (complaint.depoPartyName && complaint.depoPartyName.toLowerCase().includes('bhimasur')) {
        updates.depoPartyName = complaint.depoPartyName.replace(/bhimasur/gi, 'Bhimasar');
        needsUpdate = true;
      }
      
      if (complaint.voc && complaint.voc.toLowerCase().includes('bhimasur')) {
        updates.voc = complaint.voc.replace(/bhimasur/gi, 'Bhimasar');
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await db.update(complaintsTable)
          .set(updates)
          .where(eq(complaintsTable.id, complaint.id));
        
        console.log(`✅ Updated complaint #${complaint.id} - renamed Bhimasur to Bhimasar`);
        updatedCount++;
      }
    }
    
    // Check final counts
    const finalComplaints = await db.select().from(complaintsTable);
    const bhimasarCount = finalComplaints.filter(c => 
      (c.placeOfSupply && c.placeOfSupply.toLowerCase().includes('bhimasar')) ||
      (c.complaintReceivingLocation && c.complaintReceivingLocation.toLowerCase().includes('bhimasar'))
    ).length;
    
    const bhimasurCount = finalComplaints.filter(c => 
      (c.placeOfSupply && c.placeOfSupply.toLowerCase().includes('bhimasur')) ||
      (c.complaintReceivingLocation && c.complaintReceivingLocation.toLowerCase().includes('bhimasur'))
    ).length;
    
    console.log(`\n📊 Final Counts:`);
    console.log(`  Bhimasar: ${bhimasarCount}`);
    console.log(`  Bhimasur: ${bhimasurCount}`);
    console.log(`\n✅ Updated ${updatedCount} complaints successfully!`);
    
  } catch (error) {
    console.error('❌ Error renaming to Bhimasar:', error);
  }
}

renameToBhimasar();