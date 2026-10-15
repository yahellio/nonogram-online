import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve(import.meta.dirname, '../public');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export async function serveStatic(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  const filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    const type = CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}
