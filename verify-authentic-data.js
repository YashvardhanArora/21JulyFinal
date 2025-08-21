import fetch from 'node-fetch';

console.log('🔍 Verifying authentic Excel data vs demo data...\n');

try {
  const response = await fetch('http://localhost:5000/api/complaints');
  const complaints = await response.json();
  
  // Separate by year
  const year2024 = complaints.filter(c => c.date && c.date.includes('2024'));
  const year2025 = complaints.filter(c => c.date && c.date.includes('2025'));
  
  console.log(`📊 Total: ${complaints.length} | 2024: ${year2024.length} | 2025: ${year2025.length}\n`);
  
  // Check for demo/placeholder indicators
  const demoIndicators = [
    'Customer 1', 'Customer 2', 'Customer 3', 'Customer 4', 'Customer 5',
    'Party 1', 'Party 2', 'Party 3', 'Sales Person 1', 'Sales Person 2',
    'Product A', 'Product B', 'Product C', 'Product D', 'Product E',
    'company1@example.com', 'party1@example.com', 'customer complaint description'
  ];
  
  // Analyze 2024 data
  console.log('=== 2024 DATA ANALYSIS ===');
  let demoCount2024 = 0;
  let authenticCount2024 = 0;
  
  const sample2024 = year2024.slice(0, 10);
  console.log('📋 Sample 2024 complaints:');
  sample2024.forEach((c, i) => {
    const hasDemo = demoIndicators.some(indicator => 
      JSON.stringify(c).toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasDemo) demoCount2024++;
    else authenticCount2024++;
    
    console.log(`${i+1}. Depot: "${c.depoPartyName}" | Product: "${c.productName}" | Email: "${c.email}" ${hasDemo ? '⚠️ DEMO' : '✅ AUTHENTIC'}`);
  });
  
  // Analyze 2025 data
  console.log('\n=== 2025 DATA ANALYSIS ===');
  let demoCount2025 = 0;
  let authenticCount2025 = 0;
  
  const sample2025 = year2025.slice(0, 10);
  console.log('📋 Sample 2025 complaints:');
  sample2025.forEach((c, i) => {
    const hasDemo = demoIndicators.some(indicator => 
      JSON.stringify(c).toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasDemo) demoCount2025++;
    else authenticCount2025++;
    
    console.log(`${i+1}. Depot: "${c.depoPartyName}" | Product: "${c.productName}" | Email: "${c.email}" ${hasDemo ? '⚠️ DEMO' : '✅ AUTHENTIC'}`);
  });
  
  // Check for specific authentic indicators
  console.log('\n=== AUTHENTIC DATA INDICATORS ===');
  const authenticCompanies = complaints.filter(c => 
    c.depoPartyName && (
      c.depoPartyName.includes('AGARWAL') ||
      c.depoPartyName.includes('Garg Trading') ||
      c.depoPartyName.includes('Bansal') ||
      c.depoPartyName.includes('Maa Durga') ||
      c.depoPartyName.includes('ENTERPRISES')
    )
  );
  
  const authenticProducts = complaints.filter(c => 
    c.productName && (
      c.productName.includes('Nutrica') ||
      c.productName.includes('Simply Fresh') ||
      c.productName.includes('Heathly Value') ||
      c.productName.includes('Simply Gold')
    )
  );
  
  console.log(`🏢 Authentic company names found: ${authenticCompanies.length}`);
  console.log(`📦 Authentic product names found: ${authenticProducts.length}`);
  
  // Summary
  console.log('\n=== FINAL SUMMARY ===');
  console.log(`2024: ${year2024.length} total complaints`);
  console.log(`2025: ${year2025.length} total complaints`);
  console.log(`Authentic company names: ${authenticCompanies.length}`);
  console.log(`Authentic product names: ${authenticProducts.length}`);
  
  if (authenticCompanies.length > 50 && authenticProducts.length > 100) {
    console.log('✅ DATA IS AUTHENTIC - Excel data successfully imported');
  } else {
    console.log('⚠️ MIXED DATA - Some demo data may still exist');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}