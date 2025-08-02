import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to analyze Excel files for status mapping
function analyzeExcelStatus() {
  console.log('🔍 Analyzing Excel files for correct status mapping...\n');
  
  // Analyze 2024 file
  try {
    const workbook2024 = XLSX.readFile(path.join(__dirname, 'attached_assets', '2024final_1753647662793.xlsx'));
    const worksheet2024 = workbook2024.Sheets[workbook2024.SheetNames[0]];
    const data2024 = XLSX.utils.sheet_to_json(worksheet2024);
    
    console.log('📊 2024 Excel Analysis:');
    console.log(`Total records: ${data2024.length}`);
    
    // Check column names
    const headers2024 = Object.keys(data2024[0] || {});
    console.log('Headers:', headers2024.join(', '));
    
    // Find status column (check various possible names)
    const statusColumns = headers2024.filter(h => 
      h.toLowerCase().includes('status') || 
      h.toLowerCase().includes('final') ||
      h.toLowerCase().includes('resolution')
    );
    console.log('Status-related columns:', statusColumns);
    
    // Analyze status distribution
    if (statusColumns.length > 0) {
      statusColumns.forEach(col => {
        console.log(`\n--- ${col} Analysis ---`);
        const statusCounts = {};
        data2024.forEach(row => {
          const status = row[col];
          if (status && status !== '-') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          }
        });
        console.log('Status distribution:', statusCounts);
      });
    }
    
    // Show sample rows
    console.log('\n--- Sample 2024 Data ---');
    data2024.slice(0, 3).forEach((row, i) => {
      console.log(`Row ${i + 1}:`, JSON.stringify(row, null, 2));
    });
    
  } catch (error) {
    console.error('Error analyzing 2024 file:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Analyze 2025 file
  try {
    const workbook2025 = XLSX.readFile(path.join(__dirname, 'attached_assets', '2025final_1753676010243.xlsx'));
    const worksheet2025 = workbook2025.Sheets[workbook2025.SheetNames[0]];
    const data2025 = XLSX.utils.sheet_to_json(worksheet2025);
    
    console.log('📊 2025 Excel Analysis:');
    console.log(`Total records: ${data2025.length}`);
    
    // Check column names
    const headers2025 = Object.keys(data2025[0] || {});
    console.log('Headers:', headers2025.join(', '));
    
    // Find status column
    const statusColumns2025 = headers2025.filter(h => 
      h.toLowerCase().includes('status') || 
      h.toLowerCase().includes('final') ||
      h.toLowerCase().includes('resolution')
    );
    console.log('Status-related columns:', statusColumns2025);
    
    // Analyze status distribution
    if (statusColumns2025.length > 0) {
      statusColumns2025.forEach(col => {
        console.log(`\n--- ${col} Analysis ---`);
        const statusCounts = {};
        data2025.forEach(row => {
          const status = row[col];
          if (status && status !== '-') {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          }
        });
        console.log('Status distribution:', statusCounts);
      });
    }
    
    // Show sample rows
    console.log('\n--- Sample 2025 Data ---');
    data2025.slice(0, 3).forEach((row, i) => {
      console.log(`Row ${i + 1}:`, JSON.stringify(row, null, 2));
    });
    
  } catch (error) {
    console.error('Error analyzing 2025 file:', error.message);
  }
}

analyzeExcelStatus();