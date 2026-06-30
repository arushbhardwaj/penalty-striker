const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const ROOT = __dirname;
const START_PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name in ifaces) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

function tryListen(port) {
  server.listen(port, '0.0.0.0', () => {
    const localIP = getLocalIP();
    const url = `http://localhost:${port}`;
    const networkUrl = `http://${localIP}:${port}`;

    console.log('===================================');
    console.log(' Penalty Striker - Local Server');
    console.log('===================================\n');
    console.log(`  Local:    ${url}`);
    console.log(`  Network:  ${networkUrl}\n`);
    console.log('Open the URL above in your browser.');
    console.log('Use the Network URL from other devices on the same WiFi.\n');
    console.log('Press Ctrl+C to stop the server.\n');

    exec(`start "" "${url}"`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      tryListen(port + 1);
    } else {
      console.error('Failed to start server:', e.message);
    }
  });
}

tryListen(START_PORT);
