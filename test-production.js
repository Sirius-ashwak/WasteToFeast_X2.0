// Simple script to serve the production build locally for testing
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 5000;
const DIST_FOLDER = join(__dirname, 'dist');

console.log('Starting production test server...');
console.log(`Serving from: ${resolve(DIST_FOLDER)}`);

// Check if dist folder exists
if (!existsSync(DIST_FOLDER)) {
  console.error(`Error: Build folder (${DIST_FOLDER}) does not exist!`);
  console.error('Please run "npm run build" first to create a production build.');
  process.exit(1);
}

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

// Create a simple HTTP server
const server = createServer((req, res) => {
  console.log(`Requesting: ${req.url}`);
  
  // Default to index.html for the root or for client-side routing paths without file extensions
  let filePath = req.url === '/' 
    ? join(DIST_FOLDER, 'index.html') 
    : join(DIST_FOLDER, req.url);
  
  // If the path doesn't have a file extension and doesn't exist,
  // it's likely a client-side route, so serve index.html
  if (!extname(filePath) || !existsSync(filePath)) {
    filePath = join(DIST_FOLDER, 'index.html');
  }
  
  try {
    const data = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(data);
  } catch (err) {
    console.error(`Error serving ${filePath}:`, err);
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
}); 