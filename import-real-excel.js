import XLSX from 'xlsx';
import fs from 'fs';

// Direct import without server API
async function importExcelData() {
  try {
    console.log('🔄 Starting Excel data import...');

    // Try the other Excel file first
    const workbook = XLSX.readFile('attached_assets/1.Complaint Control Board 2024-25 Raw file_1751259558687.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📊 Found ${excelData.length} rows in Excel file`);
    
    // Show first few rows to understand structure
    console.log('📋 Sample data structure:');
    if (excelData.length > 0) {
      console.log('Column names:', Object.keys(excelData[0]));
      console.log('First row:', excelData[0]);
    }

    let imported2024Count = 0;
    let skippedCount = 0;

    for (const row of excelData) {
      try {
        // Parse the date from Excel
        let complaintDate;
        const dateField = row['Date'] || row['date'] || row['Date of Complaint'] || row['Complaint Date'] || row['Month'];
        
        console.log(`Processing row with date field: ${dateField}`);
        
        if (dateField) {
          if (typeof dateField === 'number') {
            // Handle Excel date serial numbers
            const excelEpoch = new Date(1900, 0, 1);
            complaintDate = new Date(excelEpoch.getTime() + (dateField - 2) * 24 * 60 * 60 * 1000);
          } else {
            complaintDate = new Date(dateField);
          }
        }

        if (complaintDate && !isNaN(complaintDate.getTime())) {
          console.log(`Parsed date: ${complaintDate.toISOString()}, Year: ${complaintDate.getFullYear()}`);
          
          if (complaintDate.getFullYear() === 2024) {
            imported2024Count++;
            console.log(`✅ Found 2024 complaint: ${row['Depo/Party Name']} - ${complaintDate.toISOString().split('T')[0]}`);
          }
        } else {
          skippedCount++;
          console.log(`⚠️  Skipped row - invalid date: ${dateField}`);
        }

      } catch (error) {
        console.error(`Error processing row:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Found ${imported2024Count} potential 2024 complaints`);
    console.log(`⚠️  Skipped ${skippedCount} rows`);

  } catch (error) {
    console.error('❌ Error importing Excel data:', error);
  }
}

// Run the import analysis
importExcelData();