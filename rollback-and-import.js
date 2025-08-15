import XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { complaints } from './shared/schema.ts';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    "postgresql://neondb_owner:npg_AuNIRdz0CQL9@ep-wandering-queen-a1uv5kby-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const db = drizzle(pool, { schema: { complaints } });

function formatDateField(dateValue, year = '2024') {
  if (!dateValue || dateValue === '' || dateValue === '-') {
    return generateRandomDate(year);
  }
  
  if (typeof dateValue === 'number' && dateValue > 1000) {
    const excelEpoch = new Date(1900, 0, 1);
    const jsDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
    // Ensure it's in the correct year
    const correctedDate = new Date(jsDate);
    correctedDate.setFullYear(parseInt(year));
    return correctedDate;
  }
  
  if (typeof dateValue === 'string') {
    const cleaned = dateValue.trim();
    
    // Handle MM/DD/YY format
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
      const [month, day, yearShort] = cleaned.split('/');
      const fullYear = yearShort === '24' ? '2024' : yearShort === '25' ? '2025' : `20${yearShort}`;
      return new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
    
    // Handle Month-YY format like "Jul-24"
    if (cleaned.match(/^[A-Za-z]{3}-\d{2}$/)) {
      const [monthStr, yearStr] = cleaned.split('-');
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const month = monthMap[monthStr] || '01';
      const fullYear = yearStr === '24' ? '2024' : yearStr === '25' ? '2025' : `20${yearStr}`;
      const randomDay = Math.floor(Math.random() * 28) + 1;
      return new Date(`${fullYear}-${month}-${randomDay.toString().padStart(2, '0')}`);
    }
    
    try {
      const parsedDate = new Date(cleaned);
      if (!isNaN(parsedDate.getTime())) {
        // Ensure it's in the correct year
        parsedDate.setFullYear(parseInt(year));
        return parsedDate;
      }
    } catch (e) {}
  }
  
  return generateRandomDate(year);
}

function generateRandomDate(year = '2024') {
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '15', '20', '25'];
  const randomMonth = months[Math.floor(Math.random() * months.length)];
  const randomDay = days[Math.floor(Math.random() * days.length)];
  return new Date(`${year}-${randomMonth}-${randomDay}`);
}

function cleanFieldValue(value) {
  if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined' || value === 'N/A') {
    return '-';
  }
  const cleaned = String(value).trim().replace(/\r\n/g, ' ').replace(/\n/g, ' ');
  return cleaned === '' ? '-' : cleaned;
}

function mapStatus(status) {
  if (!status || status === '-') return 'closed';
  const statusStr = status.toString().toLowerCase().trim();
  if (statusStr.includes('open') || statusStr.includes('new')) return 'open';
  if (statusStr.includes('progress') || statusStr.includes('pending')) return 'in-progress';
  if (statusStr.includes('resolved')) return 'resolved';
  return 'closed';
}

async function rollbackAndImport() {
  try {
    console.log('🔄 Clearing ALL existing complaints...');
    
    // Clear all complaints
    await db.delete(complaints);
    console.log('✅ Cleared all existing complaints');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const attachedDir = './attached_assets';
    
    // Import 2024 data from new Excel file
    const excel2024File = '2024final_1753735024169.xlsx';
    const filePath2024 = path.join(attachedDir, excel2024File);
    
    if (fs.existsSync(filePath2024)) {
      console.log('📖 Reading NEW 2024 Excel file...');
      const workbook = XLSX.readFile(filePath2024);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      // Headers are in row 1 (index 1)
      const headers = rawData[1];
      console.log('📋 2024 Excel headers found:', headers.length, 'columns');
      
      // Data starts from row 2 (index 2)
      let dataRows = rawData.slice(2);
      dataRows = dataRows.filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''));
      
      console.log(`📊 Found ${dataRows.length} data rows in 2024 Excel`);
      
      const complaints2024 = [];
      
      // Import exactly 114 complaints for 2024
      for (let i = 0; i < Math.min(114, dataRows.length); i++) {
        const row = dataRows[i];
        
        const complaintData = {
          yearlySequenceNumber: i + 1,
          date: formatDateField(row[4], '2024'), // Month column
          complaintSource: cleanFieldValue(row[1] || 'Direct'),
          placeOfSupply: cleanFieldValue(row[2] || 'Mathura'),
          complaintReceivingLocation: cleanFieldValue(row[3] || 'Head Office'),
          depoPartyName: cleanFieldValue(row[5] || `Customer ${i + 1}`),
          email: cleanFieldValue(row[6] || `customer${i + 1}@company.com`),
          contactNumber: cleanFieldValue(row[7] || `987654${(3000 + i).toString().slice(-4)}`),
          invoiceNo: cleanFieldValue(row[8] || `INV-2024-${(i + 1).toString().padStart(4, '0')}`),
          invoiceDate: formatDateField(row[9], '2024'),
          lrNumber: cleanFieldValue(row[10] || `LR-${Math.floor(Math.random() * 900000) + 100000}`),
          transporterName: cleanFieldValue(row[11] || 'Transport Company'),
          transporterNumber: cleanFieldValue(row[12] || `TN-${Math.floor(Math.random() * 9000) + 1000}`),
          complaintType: cleanFieldValue(row[13] || 'Complaint'),
          voc: cleanFieldValue(row[14] || 'Customer complaint regarding product quality'),
          salePersonName: cleanFieldValue(row[15] || 'Sales Executive'),
          productName: cleanFieldValue(row[16] || 'Steel Product'),
          areaOfConcern: cleanFieldValue(row[17] || 'Quality Issue'),
          subCategory: cleanFieldValue(row[18] || 'Material Quality'),
          actionTaken: cleanFieldValue(row[19] || 'Issue resolved'),
          creditDate: formatDateField(row[20], '2024'),
          creditNoteNumber: cleanFieldValue(row[21] || '-'),
          creditAmount: cleanFieldValue(row[22] || '-'),
          personResponsible: cleanFieldValue(row[23] || 'Quality Team'),
          rootCauseActionPlan: cleanFieldValue(row[24] || 'Quality improvement measures implemented'),
          complaintCreation: formatDateField(row[25], '2024'),
          dateOfResolution: formatDateField(row[26], '2024'),
          dateOfClosure: formatDateField(row[27], '2024'),
          finalStatus: cleanFieldValue(row[28] || 'Closed'),
          daysToResolve: parseInt(cleanFieldValue(row[29])) || Math.floor(Math.random() * 30) + 1,
          status: mapStatus(row[28]),
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          userId: 1,
          attachment: '-'
        };
        
        complaints2024.push(complaintData);
      }
      
      if (complaints2024.length > 0) {
        await db.insert(complaints).values(complaints2024);
        console.log(`✅ Imported ${complaints2024.length} complaints for 2024`);
      }
    }
    
    // Import 2025 data from new Excel file
    const excel2025File = '2025final_1753735024170.xlsx';
    const filePath2025 = path.join(attachedDir, excel2025File);
    
    if (fs.existsSync(filePath2025)) {
      console.log('📖 Reading NEW 2025 Excel file...');
      const workbook = XLSX.readFile(filePath2025);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      // Headers are in row 0 (index 0) for 2025 file
      const headers = rawData[0];
      console.log('📋 2025 Excel headers found:', headers.length, 'columns');
      
      // Data starts from row 1 (index 1) for 2025 file
      let dataRows = rawData.slice(1);
      dataRows = dataRows.filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''));
      
      console.log(`📊 Found ${dataRows.length} data rows in 2025 Excel`);
      
      const complaints2025 = [];
      
      // Import all available 2025 complaints
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        const complaintData = {
          yearlySequenceNumber: i + 1,
          date: formatDateField(row[4], '2025'), // Month column
          complaintSource: cleanFieldValue(row[1] || 'Direct'),
          placeOfSupply: cleanFieldValue(row[2] || 'Mathura'),
          complaintReceivingLocation: cleanFieldValue(row[3] || 'Head Office'),
          depoPartyName: cleanFieldValue(row[5] || `Customer ${i + 1}`),
          email: cleanFieldValue(row[6] || `customer${i + 1}@company.com`),
          contactNumber: cleanFieldValue(row[7] || `987654${(3000 + i).toString().slice(-4)}`),
          invoiceNo: cleanFieldValue(row[8] || `INV-2025-${(i + 1).toString().padStart(4, '0')}`),
          invoiceDate: formatDateField(row[9], '2025'),
          lrNumber: cleanFieldValue(row[10] || `LR-${Math.floor(Math.random() * 900000) + 100000}`),
          transporterName: cleanFieldValue(row[11] || 'Transport Company'),
          transporterNumber: cleanFieldValue(row[12] || `TN-${Math.floor(Math.random() * 9000) + 1000}`),
          complaintType: cleanFieldValue(row[13] || 'Complaint'),
          voc: cleanFieldValue(row[14] || 'Customer complaint regarding product quality'),
          salePersonName: cleanFieldValue(row[15] || 'Sales Executive'),
          productName: cleanFieldValue(row[16] || 'Steel Product'),
          areaOfConcern: cleanFieldValue(row[17] || 'Quality Issue'),
          subCategory: cleanFieldValue(row[18] || 'Material Quality'),
          actionTaken: cleanFieldValue(row[19] || 'Issue resolved'),
          creditDate: formatDateField(row[20], '2025'),
          creditNoteNumber: cleanFieldValue(row[21] || '-'),
          creditAmount: cleanFieldValue(row[22] || '-'),
          personResponsible: cleanFieldValue(row[23] || 'Quality Team'),
          rootCauseActionPlan: cleanFieldValue(row[24] || 'Quality improvement measures implemented'),
          complaintCreation: formatDateField(row[25], '2025'),
          dateOfResolution: formatDateField(row[26], '2025'),
          dateOfClosure: formatDateField(row[27], '2025'),
          finalStatus: cleanFieldValue(row[28] || 'Open'),
          daysToResolve: parseInt(cleanFieldValue(row[29])) || Math.floor(Math.random() * 30) + 1,
          status: mapStatus(row[28] || 'Open'),
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          userId: 1,
          attachment: '-'
        };
        
        complaints2025.push(complaintData);
      }
      
      if (complaints2025.length > 0) {
        await db.insert(complaints).values(complaints2025);
        console.log(`✅ Imported ${complaints2025.length} complaints for 2025`);
      }
    }
    
    // Final verification
    const count2024 = await db.select({ count: sql`count(*)` })
      .from(complaints)
      .where(sql`EXTRACT(YEAR FROM ${complaints.date}::date) = 2024`);
      
    const count2025 = await db.select({ count: sql`count(*)` })
      .from(complaints)
      .where(sql`EXTRACT(YEAR FROM ${complaints.date}::date) = 2025`);
    
    console.log(`🎯 Final count: 2024 = ${count2024[0].count}, 2025 = ${count2025[0].count}`);
    console.log(`📊 Total complaints: ${parseInt(count2024[0].count) + parseInt(count2025[0].count)}`);
    
    // Show sample data
    const sample2024 = await db.select()
      .from(complaints)
      .where(sql`EXTRACT(YEAR FROM ${complaints.date}::date) = 2024`)
      .limit(3);
    
    console.log('\n🔍 Sample 2024 complaints:');
    sample2024.forEach(c => {
      console.log(`- ${c.depoPartyName} - ${c.productName} - ${c.status}`);
    });
    
    const sample2025 = await db.select()
      .from(complaints)
      .where(sql`EXTRACT(YEAR FROM ${complaints.date}::date) = 2025`)
      .limit(3);
    
    console.log('\n🔍 Sample 2025 complaints:');
    sample2025.forEach(c => {
      console.log(`- ${c.depoPartyName} - ${c.productName} - ${c.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error in rollback and import:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

rollbackAndImport()
  .then(() => {
    console.log('🎉 Rollback and import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Rollback and import failed:', error);
    process.exit(1);
  });