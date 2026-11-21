// Tiny static server for local play-testing: serves game/ at http://localhost:8080.
// Not part of the graded hand-in; main.ts only copies game/ and screenshots/.

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'game');
const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

createServer((req, res) => {
  const url = decodeURIComponent(req.url?.split('?')[0] ?? '/');
  const path = join(root, url === '/' ? 'index.html' : url);
  if (!path.startsWith(root) || !existsSync(path)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(8080, () => console.log('MOTHLIGHT at http://localhost:8080'));
