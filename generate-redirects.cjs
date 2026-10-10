const fs = require('fs');
const path = require('path');

// Read calculator routes
const calcRegistryPath = path.join(__dirname, 'src/lib/calculators/registry.ts');
const calcContent = fs.readFileSync(calcRegistryPath, 'utf-8');
const calcMatches = [...calcContent.matchAll(/path:\s*'([^']+)'/g)].map(m => m[1]);

// Read guide routes
const guideRegistryPath = path.join(__dirname, 'src/lib/guides/registry.ts');
const guideContent = fs.readFileSync(guideRegistryPath, 'utf-8');
const guideMatches = [...guideContent.matchAll(/path:\s*'([^']+)'/g)].map(m => m[1]);

// Additional static pages
const staticPages = [
  '/guides/',
  '/about/',
  '/contact/',
  '/disclaimer/',
  '/methodology/',
  '/privacy/',
  '/sources/',
  '/terms/',
];

const allRoutes = Array.from(new Set([...calcMatches, ...guideMatches, ...staticPages])).sort();

console.log(`Found ${allRoutes.length} genuine canonical routes.`);

const lines = [
  '# FreightPlanHQ — Host & CDN Redirect Rules',
  '# Generated from project route inventory to enforce canonical trailing slashes (HTTP 301)',
  '# and provide edge-level permanent redirection for legacy URLs.',
  '',
  '# 1. Legacy Route Redirections (NMFC guide slug change)',
  '/guides/nmfc-density-class-changes /guides/nmfc-2025-changes/ 301',
  '/guides/nmfc-density-class-changes/ /guides/nmfc-2025-changes/ 301',
  '',
  '# 2. Canonical Trailing-Slash Enforcements for Genuine Routes',
  '# Maps each known slashless URL to its canonical trailing-slash URL.',
  '# Note: Nonexistent routes are omitted so the host returns a true HTTP 404.',
];

for (const r of allRoutes) {
  if (r === '/' || !r.endsWith('/')) continue;
  const slashless = r.slice(0, -1);
  lines.push(`${slashless} ${r} 301`);
}

lines.push(''); // newline at end

const outputPath = path.join(__dirname, 'public/_redirects');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
console.log(`Wrote ${lines.length} lines to ${outputPath}`);
