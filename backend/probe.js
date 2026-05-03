const http = require('http');
const options = { hostname: '127.0.0.1', port: 3001, path: '/health', method: 'GET', timeout: 5000 };
const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', res.headers);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log('BODY', body); process.exit(0); });
});
req.on('error', (e) => { console.error('REQ_ERROR', e.message); process.exit(2); });
req.on('timeout', () => { console.error('REQ_TIMEOUT'); req.destroy(); process.exit(3); });
req.end();
