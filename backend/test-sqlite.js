// Quick test for SQLite persistence
const http = require('http');

const testData = {
  language: 'javascript',
  code: 'for(let i=0;i<10;i++){console.log(i);}'
};

console.log('Sending analysis request...');
const postReq = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/complexity',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✓ Analysis response received');
    console.log(data.substring(0, 150));
  });
});

postReq.on('error', (e) => console.error('Request error:', e.message));
postReq.write(JSON.stringify(testData));
postReq.end();

// Wait a moment then fetch analyses
setTimeout(() => {
  console.log('\nFetching all analyses...');
  http.get('http://localhost:3001/api/analyses', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const analyses = JSON.parse(data);
        console.log(`✓ Found ${analyses.length} total analyses in database`);
        if (analyses.length > 0) {
          console.log('\nMost recent analysis:');
          console.log(JSON.stringify(analyses[0], null, 2).substring(0, 300));
        }
      } catch (e) {
        console.error('Parse error:', e.message);
      }
    });
  }).on('error', (e) => console.error('Fetch error:', e.message));
}, 1000);
