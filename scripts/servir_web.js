// Sirve salida/web en http://localhost:4321 para revisar la web localmente.
const http = require('http'); const fs = require('fs'); const path = require('path');
const DIR = path.join(__dirname, '..', 'salida', 'web');
http.createServer((req, res) => {
  const ruta = path.join(DIR, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!ruta.startsWith(DIR) || !fs.existsSync(ruta)) { res.writeHead(404); return res.end('No encontrado'); }
  const html = fs.readFileSync(ruta);
  res.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': ruta.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  res.end(ruta.endsWith('.html') ? Buffer.concat([Buffer.from('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'), html]) : html);
}).listen(4321, () => console.log('http://localhost:4321'));
