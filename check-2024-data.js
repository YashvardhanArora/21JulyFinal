import fetch from 'node-fetch';

console.log('Checking 2024 complaints data...');

try {
  const response = await fetch('http://localhost:5000/api/complaints');
  const complaints = await response.json();
  
  console.log('Total complaints:', complaints.length);
  
  const year2024 = complaints.filter(c => c.date && c.date.includes('2024'));
  console.log('2024 complaints:', year2024.length);
  
  if (year2024.length > 0) {
    console.log('\nSample 2024 complaint:');
    console.log(JSON.stringify(year2024[0], null, 2));
    
    console.log('\n2024 complaints summary:');
    year2024.slice(0, 5).forEach((c, i) => {
      console.log(`${i+1}. ID: ${c.id}, Depot: ${c.depoPartyName || 'N/A'}, Date: ${c.date}, Product: ${c.productName || 'N/A'}`);
    });
  } else {
    console.log('No 2024 complaints found!');
  }
  
  const year2025 = complaints.filter(c => c.date && c.date.includes('2025'));
  console.log('\n2025 complaints:', year2025.length);
  
} catch (error) {
  console.error('Error:', error.message);
}