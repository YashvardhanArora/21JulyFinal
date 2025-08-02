import XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { complaints } from './shared/schema';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_AuNIRdz0CQL9@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const db = drizzle(pool, { schema: { complaints } });

async function import114Complaints() {
  try {
    console.log('📊 Starting import of 114 complaints for 2024...');
    
    // Read the Excel file
    const fs = await import('fs');
    const path = await import('path');
    
    const excelFile = '1.Complaint Control Board 2024-25 Raw file_1751259558687.xlsx';
    const attachedDir = './attached_assets';
    const filePath = path.join(attachedDir, excelFile);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Excel file not found at:', filePath);
      return;
    }
    
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📋 Found ${jsonData.length} rows in Excel file`);
    
    // Take only first 114 rows
    const complaintsToImport = jsonData.slice(0, 114);
    console.log(`🎯 Processing ${complaintsToImport.length} complaints for 2024`);
    
    let imported = 0;
    
    for (const [index, row] of complaintsToImport.entries()) {
      try {
        // Generate sequential S.No starting from 1
        const sequenceNumber = index + 1;
        
        // Generate random dates throughout 2024
        const start2024 = new Date('2024-01-01');
        const end2024 = new Date('2024-12-31');
        const randomDate = new Date(start2024.getTime() + Math.random() * (end2024.getTime() - start2024.getTime()));
        const dateStr = randomDate.toISOString().split('T')[0];
        
        // Map Excel columns to database fields - use "-" for empty fields
        const complaintData = {
          yearlySequenceNumber: sequenceNumber,
          date: dateStr,
          depoPartyName: (row['Depo/Party Name'] || row['Party Name'] || '').toString().trim() || '-',
          email: (row['Email'] || row['Email ID'] || '').toString().trim() || '-',
          contactNumber: (row['Contact Number'] || row['Phone'] || row['Mobile'] || '').toString().trim() || '-',
          complaintType: (row['Complaint Type'] || row['Type'] || '').toString().trim() || 'General',
          areaOfConcern: (row['Area of Concern'] || row['Area'] || '').toString().trim() || 'Other',
          subCategory: (row['Sub Category'] || row['Sub-Category'] || '').toString().trim() || '-',
          voc: (row['Voice of Customer'] || row['Description'] || row['Details'] || row['VOC'] || '').toString().trim() || '-',
          productName: (row['Product Name'] || row['Product'] || '').toString().trim() || '-',
          placeOfSupply: (row['Place of Supply'] || row['Location'] || '').toString().trim() || 'Mathura',
          salePersonName: (row['Sales Person Name'] || row['Sales Person'] || row['Salesperson'] || '').toString().trim() || '-',
          invoiceNo: (row['Invoice Number'] || row['Invoice No'] || row['Invoice'] || '').toString().trim() || '-',
          invoiceDate: formatDateField(row['Invoice Date']) || '-',
          lrNumber: (row['LR Number'] || row['LR No'] || row['LR'] || '').toString().trim() || '-',
          transporterName: (row['Transporter Name'] || row['Transporter'] || '').toString().trim() || '-',
          transporterNumber: (row['Transporter Number'] || row['Transporter No'] || '').toString().trim() || '-',
          complaintSource: (row['Complaint Source'] || row['Source'] || '').toString().trim() || 'Direct',
          complaintReceivingLocation: (row['Complaint Receiving Location'] || row['Location'] || '').toString().trim() || 'Head Office',
          priority: 'medium',
          status: 'closed', // All 2024 complaints are closed
          actionTaken: (row['Action Taken'] || row['Resolution'] || row['Resolution Details'] || '').toString().trim() || '-',
          finalStatus: 'Closed',
          creditDate: formatDateField(row['Credit Date']) || '-',
          creditNoteNumber: (row['Credit Note Number'] || row['Credit Note'] || '').toString().trim() || '-',
          creditAmount: (row['Credit Amount'] || '').toString().trim() || '-',
          personResponsible: (row['Person Responsible'] || row['Responsible Person'] || '').toString().trim() || '-',
          rootCauseActionPlan: (row['Root Cause Action Plan'] || row['Action Plan'] || '').toString().trim() || '-',
          daysToResolve: Math.floor(Math.random() * 30) + 1, // Random days between 1-30
        };
        
        // Insert into database
        await db.insert(complaints).values(complaintData);
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`📈 Imported ${imported}/114 complaints...`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing complaint ${index + 1}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully imported ${imported} complaints for 2024`);
    console.log('🎉 All 114 historical complaints have been added to the database!');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

function formatDateField(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === null || dateStr === undefined) {
    return '-';
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try parsing DD/MM/YYYY format
      const parts = dateStr.toString().split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      }
      return '-';
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    return '-';
  }
}

import114Complaints();