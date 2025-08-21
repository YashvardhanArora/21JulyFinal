import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = neon(process.env.DATABASE_URL || 'postgresql://workspace_owner:password@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech/workspace?sslmode=require');

async function fixStatusMapping() {
  console.log('🔍 Analyzing Excel files and updating status mapping...\n');
  
  try {
    // Read 2024 Excel file
    const workbook2024 = XLSX.readFile(path.join(__dirname, 'attached_assets', '2024final_1753647662793.xlsx'));
    const worksheet2024 = workbook2024.Sheets[workbook2024.SheetNames[0]];
    const data2024 = XLSX.utils.sheet_to_json(worksheet2024);
    
    // Skip header row and analyze real data
    const complaints2024 = data2024.slice(1);
    console.log(`📊 Processing ${complaints2024.length} 2024 complaints...`);
    
    // Read 2025 Excel file
    const workbook2025 = XLSX.readFile(path.join(__dirname, 'attached_assets', '2025final_1753676010243.xlsx'));
    const worksheet2025 = workbook2025.Sheets[workbook2025.SheetNames[0]];
    const data2025 = XLSX.utils.sheet_to_json(worksheet2025);
    
    // Skip header row
    const complaints2025 = data2025.slice(1);
    console.log(`📊 Processing ${complaints2025.length} 2025 complaints...`);
    
    // Map 2024 statuses
    let statusCounts2024 = {
      open: 0,
      resolved: 0,
      closed: 0
    };
    
    for (let i = 0; i < complaints2024.length; i++) {
      const complaint = complaints2024[i];
      const finalStatus = complaint['__EMPTY_28']; // Final Status column
      const dateOfResolution = complaint['__EMPTY_26']; // Date of Resolution
      const dateOfClosure = complaint['__EMPTY_27']; // Date of Closure
      
      let mappedStatus = 'closed'; // Default to closed
      
      // If no resolution or closure date, it's open
      if (!dateOfResolution && !dateOfClosure) {
        mappedStatus = 'open';
        statusCounts2024.open++;
      }
      // If has resolution date but no closure date, it's resolved
      else if (dateOfResolution && !dateOfClosure) {
        mappedStatus = 'resolved';
        statusCounts2024.resolved++;
      }
      // If has closure date, it's closed
      else if (dateOfClosure) {
        mappedStatus = 'closed';
        statusCounts2024.closed++;
      }
      
      // Update database - use yearlySequenceNumber to match
      const complaintId = i + 1;
      await sql`
        UPDATE complaints 
        SET status = ${mappedStatus}
        WHERE yearly_sequence_number = ${complaintId} 
        AND EXTRACT(year FROM complaint_date) = 2024
      `;
    }
    
    console.log('2024 Status distribution:', statusCounts2024);
    
    // Map 2025 statuses
    let statusCounts2025 = {
      open: 0,
      resolved: 0,
      closed: 0
    };
    
    for (let i = 0; i < complaints2025.length; i++) {
      const complaint = complaints2025[i];
      const finalStatus = complaint['Final Status ']; // Final Status column
      const dateOfResolution = complaint['Date of Resolution']; // Date of Resolution
      const dateOfClosure = complaint['Date of Closure']; // Date of Closure
      
      let mappedStatus = 'closed'; // Default to closed
      
      // If no resolution or closure date, it's open
      if (!dateOfResolution && !dateOfClosure) {
        mappedStatus = 'open';
        statusCounts2025.open++;
      }
      // If has resolution date but no closure date, it's resolved
      else if (dateOfResolution && !dateOfClosure) {
        mappedStatus = 'resolved';
        statusCounts2025.resolved++;
      }
      // If has closure date, it's closed
      else if (dateOfClosure) {
        mappedStatus = 'closed';
        statusCounts2025.closed++;
      }
      
      // Special handling for N/A values - treat as open
      if (dateOfResolution === 'N/A' && dateOfClosure === 'N/A') {
        mappedStatus = 'open';
        statusCounts2025.open++;
      }
      
      // Update database - use yearlySequenceNumber to match
      const complaintId = i + 1;
      await sql`
        UPDATE complaints 
        SET status = ${mappedStatus}
        WHERE yearly_sequence_number = ${complaintId} 
        AND EXTRACT(year FROM complaint_date) = 2025
      `;
    }
    
    console.log('2025 Status distribution:', statusCounts2025);
    
    // Verify total counts
    const totalStats = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM complaints 
      GROUP BY status
      ORDER BY status
    `;
    
    console.log('\n✅ Updated database status distribution:');
    totalStats.forEach(stat => {
      console.log(`${stat.status}: ${stat.count}`);
    });
    
    console.log('\n🎯 Status mapping completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing status mapping:', error);
  }
}

fixStatusMapping();