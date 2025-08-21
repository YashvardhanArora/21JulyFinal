import XLSX from 'xlsx';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importExcelData() {
  try {
    console.log('🔄 Starting Excel data import...');

    // First, clear existing 2024 demo complaints
    const deleteResult = await pool.query(
      "DELETE FROM complaints WHERE date >= '2024-01-01' AND date < '2025-01-01'"
    );
    console.log(`🗑️  Cleared ${deleteResult.rowCount} demo 2024 complaints`);

    // Import from main Excel file
    const workbook = XLSX.readFile('attached_assets/All complaints_1751602977654.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📊 Found ${excelData.length} complaints in Excel file`);

    let imported2024Count = 0;
    let skippedCount = 0;

    for (const row of excelData) {
      try {
        // Parse the date from Excel (handle various date formats)
        let complaintDate;
        if (row['Date'] || row['date'] || row['Date of Complaint']) {
          const dateValue = row['Date'] || row['date'] || row['Date of Complaint'];
          
          // Handle Excel date serial numbers
          if (typeof dateValue === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            complaintDate = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
          } else if (typeof dateValue === 'string') {
            complaintDate = new Date(dateValue);
          } else if (dateValue instanceof Date) {
            complaintDate = dateValue;
          }
        }

        // Only import 2024 complaints
        if (!complaintDate || complaintDate.getFullYear() !== 2024) {
          skippedCount++;
          continue;
        }

        const formattedDate = complaintDate.toISOString().split('T')[0];

        // Map Excel columns to database fields
        const complaintData = {
          complaintSource: row['Complaint Source'] || row['Source'] || 'Customer',
          placeOfSupply: row['Place of Supply'] || row['Location'] || 'Mathura',
          complaintReceivingLocation: row['Complaint Receiving Location'] || 'Office',
          date: formattedDate,
          depoPartyName: row['Depo/Party Name'] || row['Party Name'] || row['Customer Name'] || 'Unknown Party',
          email: row['Email'] || row['Email ID'] || '',
          contactNumber: row['Contact Number'] || row['Phone'] || row['Mobile'] || '',
          invoiceNo: row['Invoice No'] || row['Invoice Number'] || '',
          invoiceDate: row['Invoice Date'] ? new Date(row['Invoice Date']).toISOString().split('T')[0] : formattedDate,
          lrNumber: row['LR Number'] || row['LR No'] || '',
          transporterName: row['Transporter Name'] || row['Transporter'] || '',
          transporterNumber: row['Transporter Number'] || row['Transporter Phone'] || '',
          complaintType: row['Complaint Type'] || row['Type'] || 'Complaint',
          voc: row['Voice of Customer'] || row['VOC'] || row['Description'] || row['Complaint Details'] || 'No description provided',
          salePersonName: row['Sales Person Name'] || row['Salesperson'] || '',
          productName: row['Product Name'] || row['Product'] || 'Unknown Product',
          areaOfConcern: row['Area of Concern'] || row['Category'] || 'General',
          subCategory: row['Sub Category'] || row['Subcategory'] || '',
          actionTaken: row['Action Taken'] || row['Resolution'] || '',
          status: (row['Status'] || 'closed').toLowerCase(),
          priority: (row['Priority'] || 'medium').toLowerCase(),
          finalStatus: row['Final Status'] || row['Status'] || 'Closed'
        };

        // Insert into database
        const insertQuery = `
          INSERT INTO complaints (
            complaint_source, place_of_supply, complaint_receiving_location, date,
            depo_party_name, email, contact_number, invoice_no, invoice_date,
            lr_number, transporter_name, transporter_number, complaint_type,
            voc, sale_person_name, product_name, area_of_concern, sub_category,
            action_taken, status, priority, final_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        `;

        await pool.query(insertQuery, [
          complaintData.complaintSource,
          complaintData.placeOfSupply,
          complaintData.complaintReceivingLocation,
          complaintData.date,
          complaintData.depoPartyName,
          complaintData.email,
          complaintData.contactNumber,
          complaintData.invoiceNo,
          complaintData.invoiceDate,
          complaintData.lrNumber,
          complaintData.transporterName,
          complaintData.transporterNumber,
          complaintData.complaintType,
          complaintData.voc,
          complaintData.salePersonName,
          complaintData.productName,
          complaintData.areaOfConcern,
          complaintData.subCategory,
          complaintData.actionTaken,
          complaintData.status,
          complaintData.priority,
          complaintData.finalStatus
        ]);

        imported2024Count++;

      } catch (error) {
        console.error(`Error processing row:`, error.message);
        skippedCount++;
      }
    }

    console.log(`✅ Successfully imported ${imported2024Count} actual 2024 complaints`);
    console.log(`⚠️  Skipped ${skippedCount} rows (non-2024 or invalid data)`);

    // Verify the import
    const countResult = await pool.query(
      "SELECT COUNT(*) as count FROM complaints WHERE date >= '2024-01-01' AND date < '2025-01-01'"
    );
    console.log(`📊 Total 2024 complaints in database: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error importing Excel data:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importExcelData();