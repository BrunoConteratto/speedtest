console.clear();
process.stdout.write('\x1Bc');

if (process.env.NODE_ENV !== 'production') require('dotenv').config({ path: '.env' });

// const fs = require('fs');
const app = require('./app');
// const https = require('https');

// const server = https.createServer({
//   key: fs.readFileSync('./certificates/key.pem'),
//   cert: fs.readFileSync('./certificates/cert.pem'),
// }, app);

const http = require('http');
const server = http.createServer(app);

server.listen(process.env.PORT || 3333, () => {
  console.log(`Server running on 127.0.0.1:${process.env.PORT || 3333}`);
});

// server.listen(443, () => {
//   console.log(`Server running on 127.0.0.1:443`);
// });
