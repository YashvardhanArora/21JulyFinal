import XLSX from 'xlsx';

async function inspectExcelStructure() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const attachedDir = './attached_assets';
    const excelFile = '2024final_1753647662793.xlsx';
    const filePath = path.join(attachedDir, excelFile);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Excel file not found:', filePath);
      return;
    }
    
    console.log('📖 Inspecting Excel file structure...');
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
    
    // Try reading with different header options
    console.log('\n📋 Reading with headers from row 0:');
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (jsonData.length > 0) {
      console.log('Headers (Row 0):', jsonData[0]);
      if (jsonData.length > 1) {
        console.log('Sample data (Row 1):', jsonData[1]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error inspecting Excel:', error);
  }
}

inspectExcelStructure();