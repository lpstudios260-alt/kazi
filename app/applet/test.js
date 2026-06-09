const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(`STATUS: ${res.statusCode} HEADERS: ${JSON.stringify(res.headers)} BODY: ${data}`));
});

req.on('error', e => console.error(e));

req.write(JSON.stringify({
  contents: [ { role: 'user', parts: [ { text: 'hi' } ] } ]
}));
req.end();
