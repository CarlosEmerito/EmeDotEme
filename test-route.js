const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer Fl0KODY2P+tM5ePcLwp4xViO6+HeklnqR3QGQG2iUD0='
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', data));
});

req.on('error', (e) => console.error('Request Error:', e));
req.end();
