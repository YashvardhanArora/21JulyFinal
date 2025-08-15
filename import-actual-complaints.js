import XLSX from 'xlsx';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importActualComplaints() {
  try {
    console.log('🔄 Starting import of actual 2025 complaints...');

    // First, clear the demo complaints (all 2024 complaints)
    const deleteResult = await pool.query(
      "DELETE FROM complaints WHERE date >= '2024-01-01' AND date < '2025-01-01'"
    );
    console.log(`🗑️  Cleared ${deleteResult.rowCount} demo 2024 complaints`);

    // Read Excel file - this contains 2025 complaints
    const workbook = XLSX.readFile('attached_assets/All complaints_1751602977654.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📊 Found ${excelData.length} complaints in Excel file`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const row of excelData) {
      try {
        // Parse the date from Excel serial number
        let complaintDate;
        const dateField = row['Month']; // Excel serial number
        
        if (typeof dateField === 'number') {
          // Handle Excel date serial numbers
          const excelEpoch = new Date(1900, 0, 1);
          complaintDate = new Date(excelEpoch.getTime() + (dateField - 2) * 24 * 60 * 60 * 1000);
        }

        if (!complaintDate || isNaN(complaintDate.getTime())) {
          skippedCount++;
          continue;
        }

        // Map Excel data to database fields
        const complaintData = {
          complaint_source: row['Complaint Source'] || 'Customer',
          place_of_supply: row['Place of Supply'] || 'Unknown',
          complaint_receiving_location: (row['Complaint Receiving location \r\n'] || '').trim() || 'Office',
          date: complaintDate.toISOString().split('T')[0],
          depo_party_name: 'Complaint ' + row['S.no.'], // Using S.no. as identifier since no party name
          email: '',
          contact_number: '',
          invoice_no: '',
          invoice_date: complaintDate.toISOString().split('T')[0],
          lr_number: '',
          transporter_name: '',
          transporter_number: '',
          complaint_type: (row['Complaint\r\nType'] || '').trim() || 'Complaint',
          voc: row['Voc'] || 'No description provided',
          sale_person_name: (row['Sale Person Name '] || '').trim(),
          product_name: (row['Product Name '] || '').trim() || 'Unknown Product',
          area_of_concern: (row['Area of Concern'] || '').trim() || 'General',
          sub_category: (row['Sub Category'] || '').trim(),
          action_taken: (row['Action Taken'] || '').trim(),
          status: (row['Final Status '] || '').toLowerCase().includes('closed') ? 'closed' : 'open',
          priority: 'medium',
          final_status: (row['Final Status '] || '').trim() || 'Open'
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
          complaintData.complaint_source,
          complaintData.place_of_supply,
          complaintData.complaint_receiving_location,
          complaintData.date,
          complaintData.depo_party_name,
          complaintData.email,
          complaintData.contact_number,
          complaintData.invoice_no,
          complaintData.invoice_date,
          complaintData.lr_number,
          complaintData.transporter_name,
          complaintData.transporter_number,
          complaintData.complaint_type,
          complaintData.voc,
          complaintData.sale_person_name,
          complaintData.product_name,
          complaintData.area_of_concern,
          complaintData.sub_category,
          complaintData.action_taken,
          complaintData.status,
          complaintData.priority,
          complaintData.final_status
        ]);

        importedCount++;
        console.log(`✅ Imported complaint ${row['S.no.']} - ${complaintDate.toISOString().split('T')[0]}`);

      } catch (error) {
        console.error(`Error processing row ${row['S.no.']}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`✅ Successfully imported ${importedCount} actual complaints from Excel`);
    console.log(`⚠️  Skipped ${skippedCount} rows`);

    // Verify the import
    const countResult = await pool.query("SELECT COUNT(*) as count FROM complaints");
    console.log(`📊 Total complaints in database: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error importing Excel data:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importActualComplaints();