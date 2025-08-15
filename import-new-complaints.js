import XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { complaints } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_AuNIRdz0CQL9@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const db = drizzle(pool, { schema: { complaints } });

async function importComplaints() {
  try {
    console.log('📊 Starting complaint data replacement...');
    
    // First, clear all existing 2024 complaints
    console.log('🗑️ Clearing existing 2024 complaints...');
    const deleteResult = await db.delete(complaints)
      .where(sql`EXTRACT(YEAR FROM date::date) = 2024 OR date LIKE '2024%'`);
    
    console.log('✅ Cleared existing 2024 complaints');
    
    // Read the Excel file directly
    console.log('📖 Reading Excel file...');
    const fs = await import('fs');
    const path = await import('path');
    
    // Use the specific Excel file
    const excelFile = '1.Complaint Control Board 2024-25 Raw file_1751259558687.xlsx';
    console.log(`📊 Using Excel file: ${excelFile}`);
    
    const attachedDir = './attached_assets';
    const filePath = path.join(attachedDir, excelFile);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ Excel file not found at:', filePath);
      return;
    }
    
    const workbook2 = XLSX.readFile(filePath);
    const sheetName = workbook2.SheetNames[0];
    const worksheet = workbook2.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📋 Found ${jsonData.length} rows in Excel file`);
    
    let imported = 0;
    
    for (const row of jsonData) {
      try {
        // Map Excel columns to database fields according to the schema
        const complaintData = {
          yearlySequenceNumber: row['S. No.'] || row['SNo'] || row['Serial No'] || imported + 1,
          date: formatDate(row['Date'] || row['Complaint Date'] || '2024-01-01'),
          depoPartyName: row['Depo/Party Name'] || row['Party Name'] || '-',
          email: row['Email'] || row['Email ID'] || '-',
          contactNumber: row['Contact Number'] || row['Phone'] || row['Mobile'] || '-',
          complaintType: row['Complaint Type'] || row['Type'] || 'General',
          areaOfConcern: row['Area of Concern'] || row['Area'] || 'Other',
          subCategory: row['Sub Category'] || row['Sub-Category'] || '-',
          voc: row['Voice of Customer'] || row['Description'] || row['Details'] || '-',
          productName: row['Product Name'] || row['Product'] || '-',
          placeOfSupply: row['Place of Supply'] || row['Location'] || 'Mathura',
          salePersonName: row['Sales Person Name'] || row['Sales Person'] || '-',
          invoiceNo: row['Invoice Number'] || row['Invoice No'] || '-',
          invoiceDate: formatDate(row['Invoice Date'] || '2024-01-01'),
          lrNumber: row['LR Number'] || row['LR No'] || '-',
          transporterName: row['Transporter Name'] || row['Transporter'] || '-',
          transporterNumber: row['Transporter Number'] || row['Transporter No'] || '-',
          complaintSource: row['Complaint Source'] || row['Source'] || 'Direct',
          complaintReceivingLocation: row['Complaint Receiving Location'] || 'Head Office',
          priority: 'medium',
          status: row['Status'] || 'closed',
          actionTaken: row['Resolution'] || row['Resolution Details'] || '-',
          finalStatus: row['Final Status'] || 'Closed'
        };
        
        // Insert into database
        await db.insert(complaints).values(complaintData);
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`📈 Imported ${imported} complaints...`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing row ${imported + 1}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully imported ${imported} complaints from Excel file`);
    console.log('🎉 Complaint data replacement completed!');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === '-') {
    return '2024-01-01';
  }
  
  // Handle various date formats and return as string
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try parsing DD/MM/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        const parsedDate = new Date(year, month, day);
        return parsedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
      return '2024-01-01';
    }
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch (error) {
    return '2024-01-01';
  }
}

importComplaints();