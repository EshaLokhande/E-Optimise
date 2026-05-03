// Direct DB query to verify persistence
const { getRecentAnalyses, getAnalyses } = require('./database');

console.log('\n=== Database Content ===');
try {
  const analyses = getAnalyses();
  console.log(`Total analyses: ${analyses.length}`);
  
  if (analyses.length > 0) {
    console.log('\nAll analyses:');
    analyses.forEach((a, i) => {
      console.log(`\n[${i+1}] ID: ${a.id}, Type: ${a.type}, Language: ${a.language}`);
      console.log(`    Created: ${a.created_at}`);
      console.log(`    Result: ${a.result.substring(0, 80)}...`);
    });
  } else {
    console.log('No analyses found in database');
  }
} catch (err) {
  console.error('Error querying database:', err.message);
}
