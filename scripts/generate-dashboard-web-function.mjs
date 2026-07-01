import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..');
const projectRef = process.env.PROJECT_REF || 'ochhwfntlpzwjextvxsh';
const bucket = process.env.SITE_BUCKET || 'dashboard-site';
const release = process.env.SITE_RELEASE;

if (!release) {
  throw new Error('SITE_RELEASE is required');
}

const storageBase = `https://${projectRef}.supabase.co/storage/v1/object/public/${bucket}/releases/${release}`;
const indexPath = resolve(rootDir, 'dist/index.html');
const functionPath = resolve(rootDir, 'supabase/functions/dashboard-web/index.ts');

let html = readFileSync(indexPath, 'utf8')
  .replaceAll('href="./favicon.svg"', `href="${storageBase}/favicon.svg"`)
  .replaceAll('src="./assets/', `src="${storageBase}/assets/`)
  .replaceAll('href="./assets/', `href="${storageBase}/assets/`);

const source = `const html = ${JSON.stringify(html)};

Deno.serve(() => {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
`;

mkdirSync(dirname(functionPath), { recursive: true });
writeFileSync(functionPath, source);
