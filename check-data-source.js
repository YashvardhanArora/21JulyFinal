import fetch from 'node-fetch';

console.log('🔍 Checking data source authenticity...\n');

try {
  const response = await fetch('http://localhost:5000/api/complaints');
  const complaints = await response.json();
  
  const year2024 = complaints.filter(c => c.date && c.date.includes('2024'));
  const year2025 = complaints.filter(c => c.date && c.date.includes('2025'));
  
  console.log(`📊 Total: ${complaints.length} | 2024: ${year2024.length} | 2025: ${year2025.length}\n`);
  
  // Check for patterns that indicate generated data
  console.log('=== CHECKING FOR GENERATED/FAKE DATA PATTERNS ===\n');
  
  // Check emails - look for patterns like customerX@company.com
  const generatedEmails = complaints.filter(c => 
    c.email && c.email.match(/^customer\d+@company\.com$/)
  );
  
  // Check phone numbers - look for patterns like 987654XXXX
  const generatedPhones = complaints.filter(c => 
    c.contactNumber && c.contactNumber.match(/^9876543?\d{3,4}$/)
  );
  
  // Check invoice numbers - look for patterns like INV-2024-XXXX
  const generatedInvoices = complaints.filter(c => 
    c.invoiceNo && c.invoiceNo.match(/^INV-202[45]-\d{4}$/)
  );
  
  // Check for repetitive/template content
  const templateVOC = complaints.filter(c => 
    c.voc && (
      c.voc.includes('Customer complaint description for complaint') ||
      c.voc.includes('Authentic complaint description')
    )
  );
  
  console.log(`📧 Generated email patterns: ${generatedEmails.length}`);
  console.log(`📱 Generated phone patterns: ${generatedPhones.length}`);
  console.log(`📄 Generated invoice patterns: ${generatedInvoices.length}`);
  console.log(`💬 Template VOC content: ${templateVOC.length}\n`);
  
  // Show examples of suspicious data
  if (generatedEmails.length > 0) {
    console.log('📧 Sample generated emails:');
    generatedEmails.slice(0, 5).forEach(c => {
      console.log(`- ${c.email} (ID: ${c.id})`);
    });
    console.log();
  }
  
  if (templateVOC.length > 0) {
    console.log('💬 Sample template VOC content:');
    templateVOC.slice(0, 3).forEach(c => {
      console.log(`- "${c.voc.substring(0, 100)}..." (ID: ${c.id})`);
    });
    console.log();
  }
  
  // Check for authentic indicators
  console.log('=== CHECKING FOR AUTHENTIC EXCEL DATA ===\n');
  
  const authenticEmails = complaints.filter(c => 
    c.email && !c.email.match(/^customer\d+@company\.com$/) && c.email !== '-'
  );
  
  const realBusinessContent = complaints.filter(c => 
    c.voc && (
      c.voc.includes('Dear Sneha') ||
      c.voc.includes('packaging quality') ||
      c.voc.includes('oil pouches') ||
      c.voc.includes('CFC') ||
      c.voc.includes('leakage')
    )
  );
  
  console.log(`✅ Non-template emails: ${authenticEmails.length}`);
  console.log(`✅ Real business VOC content: ${realBusinessContent.length}\n`);
  
  // Show authentic content examples
  if (realBusinessContent.length > 0) {
    console.log('✅ Sample authentic VOC content:');
    realBusinessContent.slice(0, 3).forEach(c => {
      console.log(`- "${c.voc.substring(0, 100)}..." (ID: ${c.id})`);
    });
    console.log();
  }
  
  // Final assessment
  console.log('=== FINAL ASSESSMENT ===');
  const totalGenerated = generatedEmails.length + templateVOC.length;
  const totalAuthentic = realBusinessContent.length + authenticEmails.length;
  
  console.log(`🔴 Generated/Template data points: ${totalGenerated}`);
  console.log(`🟢 Authentic Excel data points: ${totalAuthentic}`);
  
  if (totalGenerated > 50) {
    console.log('\n⚠️ WARNING: High amount of generated data detected');
    console.log('This suggests the data is NOT entirely from Excel files');
  } else if (totalGenerated > 0) {
    console.log('\n⚠️ MIXED: Some generated data found alongside Excel data');
  } else {
    console.log('\n✅ AUTHENTIC: All data appears to be from Excel files');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}