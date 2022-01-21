console.clear();
process.stdout.write('\x1Bc');

if (process.env.NODE_ENV !== 'production') require('dotenv').config({ path: '.env' });

const app = require('./app');
const http = require('http');

const server = http.createServer(app);

server.listen(process.env.PORT, () => {
  console.log(`Server running on 127.0.0.1:${process.env.PORT}`);
});
