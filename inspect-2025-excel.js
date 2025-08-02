import XLSX from 'xlsx';

async function inspect2025Excel() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const attachedDir = './attached_assets';
    const excelFile = '2025final_1753735024170.xlsx';  // New 2025 file
    const filePath = path.join(attachedDir, excelFile);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ 2025 Excel file not found:', filePath);
      return;
    }
    
    console.log('📖 Inspecting 2025 Excel file...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get range
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log('📊 Excel range:', range);
    
    // Read first few rows as arrays
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    console.log('🔍 First 3 rows:');
    for (let i = 0; i < Math.min(3, rawData.length); i++) {
      console.log(`Row ${i}:`, rawData[i]?.slice(0, 10)); // Show first 10 columns
    }
    
    // Get headers (likely in row 1)
    const headers = rawData[1];
    console.log('\n📋 Headers:', headers?.slice(0, 10));
    
    // Count data rows
    let dataRows = rawData.slice(2);
    dataRows = dataRows.filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''));
    
    console.log(`📊 Found ${dataRows.length} data rows in 2025 file`);
    
    if (dataRows.length > 0) {
      console.log('🔍 Sample 2025 data:');
      console.log('First depot:', dataRows[0]?.[5]); // Depo name
      console.log('First product:', dataRows[0]?.[16]); // Product name
    }
    
  } catch (error) {
    console.error('❌ Error inspecting 2025 Excel:', error);
  }
}

inspect2025Excel();