// Script to fix complaint status mappings based on finalStatus field
import { db } from './server/db.ts';
import { complaints as complaintsTable } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function fixComplaintStatuses() {
  console.log('🔧 Starting complaint status correction...');
  
  try {
    // Get all complaints
    const allComplaints = await db.select().from(complaintsTable);
    console.log(`📊 Found ${allComplaints.length} total complaints to analyze`);
    
    let updatedCount = 0;
    
    for (const complaint of allComplaints) {
      const finalStatus = (complaint.finalStatus || '').toLowerCase().trim();
      let correctStatus = complaint.status;
      
      // Determine correct status based on finalStatus
      if (finalStatus.includes('closed') || finalStatus.includes('close')) {
        correctStatus = 'closed';
      } else if (finalStatus.includes('resolved') || finalStatus.includes('resolve')) {
        correctStatus = 'resolved';
      } else if (finalStatus.includes('open') || finalStatus === '' || finalStatus.includes('pending')) {
        correctStatus = 'open';
      }
      
      // Update if status doesn't match
      if (complaint.status !== correctStatus) {
        await db.update(complaintsTable)
          .set({ status: correctStatus })
          .where(eq(complaintsTable.id, complaint.id));
        
        console.log(`✅ Updated complaint #${complaint.id}: "${complaint.finalStatus}" -> "${correctStatus}"`);
        updatedCount++;
      }
    }
    
    // Show final status distribution
    const updatedComplaints = await db.select().from(complaintsTable);
    const statusCounts = {
      open: updatedComplaints.filter(c => c.status === 'open').length,
      resolved: updatedComplaints.filter(c => c.status === 'resolved').length,
      closed: updatedComplaints.filter(c => c.status === 'closed').length
    };
    
    console.log('\n📈 Final Status Distribution:');
    console.log(`  Open: ${statusCounts.open}`);
    console.log(`  Resolved: ${statusCounts.resolved}`);
    console.log(`  Closed: ${statusCounts.closed}`);
    console.log(`\n✅ Updated ${updatedCount} complaints successfully!`);
    
  } catch (error) {
    console.error('❌ Error fixing complaint statuses:', error);
  }
}

fixComplaintStatuses();