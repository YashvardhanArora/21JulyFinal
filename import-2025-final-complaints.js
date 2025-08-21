import xlsx from 'xlsx';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { complaints } from './shared/schema.ts';
import { eq, sql } from 'drizzle-orm';

const connectionString = 'postgresql://neondb_owner:npg_AuNIRdz0CQL9@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const connection = postgres(connectionString);
const db = drizzle(connection);

async function import2025FinalComplaints() {
  try {
    console.log('📊 Starting import of 2025 final complaints...');

    // Read the Excel file
    const workbook = xlsx.readFile('attached_assets/2025final_1753675201325.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`📋 Found ${data.length} rows in Excel file`);

    // Clear all existing 2025 complaints first
    const year2025Start = new Date('2025-01-01');
    const year2025End = new Date('2025-12-31');
    
    // Delete complaints where date starts with "2025"
    await db.delete(complaints).where(
      sql`LEFT(date, 4) = '2025'`
    );
    console.log('🗑️ Cleared existing 2025 complaints');

    let importedCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row || Object.keys(row).length === 0) continue;

      try {
        // Map Excel columns to complaint schema fields with "-" for empty values
        const complaint = {
          yearlySequenceNumber: i + 1,
          complaintSource: row['Complaint Source'] || row['Source'] || '-',
          placeOfSupply: row['Place of Supply'] || row['Location'] || '-',
          complaintReceivingLocation: row['Complaint Receiving Location'] || row['Location'] || '-',
          date: '2025-01-01', // Set to 2025 for filtering
          
          // Party/Customer Details
          depoPartyName: row['Depo/Party Name'] || row['Party Name'] || row['Depo'] || '-',
          email: row['Email'] || '-',
          contactNumber: row['Contact Number'] || row['Phone'] || '-',
          
          // Invoice & Transport Details
          invoiceNo: row['Invoice Number'] || row['Invoice'] || '-',
          invoiceDate: row['Invoice Date'] || '-',
          lrNumber: row['LR Number'] || row['LR'] || '-',
          transporterName: row['Transporter Name'] || row['Transporter'] || '-',
          transporterNumber: row['Transporter Number'] || row['Transporter Contact'] || '-',
          
          // Complaint Details
          complaintType: row['Complaint Type'] || row['Type'] || '-',
          voc: row['Voice of Customer'] || row['Description'] || row['Details'] || '-',
          salePersonName: row['Sales Person'] || row['Salesperson'] || '-',
          productName: row['Product Name'] || row['Product'] || '-',
          
          // Classification
          areaOfConcern: row['Area of Concern'] || row['Area'] || '-',
          subCategory: row['Sub Category'] || row['Category'] || '-',
          
          // Resolution Details
          actionTaken: row['Action Taken'] || row['Resolution'] || '-',
          creditDate: row['Credit Date'] || '-',
          creditNoteNumber: row['Credit Note Number'] || '-',
          creditAmount: row['Credit Amount'] || '-',
          personResponsible: row['Person Responsible'] || '-',
          rootCauseActionPlan: row['Root Cause Action Plan'] || row['Root Cause'] || '-',
          
          // Status & Priority
          status: row['Status'] || 'new',
          priority: row['Priority'] || 'medium',
          finalStatus: row['Final Status'] || 'Open',
          
          // Timestamps
          complaintCreation: new Date('2025-01-01'),
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01')
        };

        // Insert the complaint
        await db.insert(complaints).values(complaint);
        importedCount++;
        
        console.log(`✅ Imported complaint ${i + 1}: ${complaint.complaintNumber}`);
        
      } catch (error) {
        console.error(`❌ Error importing row ${i + 1}:`, error);
        console.log('Row data:', row);
      }
    }

    console.log(`🎉 Successfully imported ${importedCount} complaints for 2025`);
    
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await connection.end();
  }
}

// Run the import
import2025FinalComplaints();