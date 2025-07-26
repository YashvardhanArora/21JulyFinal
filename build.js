import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Build frontend with proper working directory
console.log('🔧 Building frontend...');
try {
  // Ensure we're building from the client directory with correct config
  process.chdir('client');
  execSync('npx vite build --config ./vite.config.js', { stdio: 'inherit' });
  process.chdir('..');
  console.log('✓ Frontend build complete');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Copy production server files instead of bundling
console.log('🔧 Preparing backend...');
try {
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // Copy production server file
  fs.copyFileSync('server/production.ts', 'dist/index.js');
  
  // Replace .ts imports with .js in the copied file and fix all imports
  let content = fs.readFileSync('dist/index.js', 'utf8');
  content = content.replace(/from ["']\.\/routes["']/g, 'from "./routes.js"');
  content = content.replace(/from ["']\.\/([^"']+)\.ts["']/g, 'from "./$1.js"');
  content = content.replace(/import\s+(.+)\s+from\s+["']\.\/([^"']+)\.ts["']/g, 'import $1 from "./$2.js"');
  fs.writeFileSync('dist/index.js', content);
  
  // Copy and fix routes file
  fs.copyFileSync('server/routes.ts', 'dist/routes.js');
  let routesContent = fs.readFileSync('dist/routes.js', 'utf8');
  routesContent = routesContent.replace(/from ["']\.\/([^"']+)\.ts["']/g, 'from "./$1.js"');
  routesContent = routesContent.replace(/import\s+(.+)\s+from\s+["']\.\/([^"']+)\.ts["']/g, 'import $1 from "./$2.js"');
  fs.writeFileSync('dist/routes.js', routesContent);
  
  // Copy other server files
  if (fs.existsSync('server/storage.ts')) {
    fs.copyFileSync('server/storage.ts', 'dist/storage.js');
  }
  if (fs.existsSync('server/db.ts')) {
    fs.copyFileSync('server/db.ts', 'dist/db.js');
  }
  if (fs.existsSync('server/email-service.ts')) {
    fs.copyFileSync('server/email-service.ts', 'dist/email-service.js');
  }
  if (fs.existsSync('shared')) {
    execSync('cp -r shared dist/', { stdio: 'inherit' });
  }
  
  console.log('✓ Backend files prepared');
} catch (error) {
  console.error('❌ Backend preparation failed:', error.message);
  process.exit(1);
}

console.log('✓ Build complete');