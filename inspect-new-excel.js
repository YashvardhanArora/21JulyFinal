import XLSX from 'xlsx';

async function inspectNewExcel() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const attachedDir = './attached_assets';
    const excelFile = '2024final_1753735024169.xlsx';
    const filePath = path.join(attachedDir, excelFile);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ New Excel file not found:', filePath);
      return;
    }
    
    console.log('📖 Inspecting new 2024 Excel file...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get range and convert to array of arrays to see raw structure
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log('📊 Excel range:', range);
    
    // Read first few rows as arrays to see the structure
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    console.log('🔍 First 5 rows of raw data:');
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      console.log(`Row ${i}:`, rawData[i]);
    }
    
    // Get headers
    const headers = rawData[1] || rawData[0]; // Try row 1 first, then row 0
    console.log('\n📋 Headers found:', headers);
    
    // Count data rows
    let dataRows = rawData.slice(2);
    if (!headers || headers.length === 0) {
      // If headers in row 0, data starts from row 1
      dataRows = rawData.slice(1);
    }
    
    dataRows = dataRows.filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''));
    
    console.log(`📊 Found ${dataRows.length} data rows`);
    
  } catch (error) {
    console.error('❌ Error inspecting Excel:', error);
  }
}

inspectNewExcel();