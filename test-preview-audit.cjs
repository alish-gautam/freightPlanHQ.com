const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 4330;
const BASE = `http://localhost:${PORT}`;

// Read sitemap URLs
const sitemapContent = fs.readFileSync(path.join(__dirname, 'dist/sitemap-0.xml'), 'utf-8');
const sitemapUrls = new Set([...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));

function inSitemap(pathOrUrl) {
  const norm = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `https://freightplanhq.com${pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl}`;
  return sitemapUrls.has(norm);
}

function extractCanonical(html) {
  if (!html) return null;
  const match = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return match ? match[1] : null;
}

async function request(urlStr, redirect = 'manual') {
  return await fetch(urlStr, { redirect });
}

async function runTestCase(label, pathStr) {
  const reqUrl = `${BASE}${pathStr}`;
  // 1. Initial request (manual redirect)
  const initialRes = await request(reqUrl, 'manual');
  const actualStatus = initialRes.status;
  const locationHeader = initialRes.headers.get('location');

  // 2. Follow redirect if needed
  let finalUrl = reqUrl;
  let finalStatus = actualStatus;
  let finalBody = '';

  if ([301, 302, 307, 308].includes(actualStatus) && locationHeader) {
    const target = locationHeader.startsWith('http')
      ? locationHeader
      : `${BASE}${locationHeader.startsWith('/') ? locationHeader : '/' + locationHeader}`;
    const followedRes = await request(target, 'follow');
    finalUrl = followedRes.url.replace(BASE, 'https://freightplanhq.com');
    finalStatus = followedRes.status;
    finalBody = await followedRes.text();
  } else {
    finalBody = await initialRes.text();
    finalUrl = reqUrl.replace(BASE, 'https://freightplanhq.com');
  }

  const finalCanonical = extractCanonical(finalBody);
  const presentInSitemap = inSitemap(finalUrl);

  return {
    label,
    requestedUrl: reqUrl.replace(BASE, 'https://freightplanhq.com'),
    actualStatus,
    locationHeader,
    finalUrl,
    finalStatus,
    finalCanonical,
    presentInSitemap,
  };
}

async function main() {
  console.log(`Starting Astro preview server on port ${PORT}...`);
  const previewProcess = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true,
  });

  previewProcess.stdout.on('data', (d) => process.stdout.write(`[preview] ${d}`));
  previewProcess.stderr.on('data', (d) => process.stderr.write(`[preview err] ${d}`));

  // Wait for server to become ready
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`${BASE}/`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch (_) {}
  }

  if (!ready) {
    console.error('Failed to start Astro preview server within 15 seconds.');
    previewProcess.kill();
    process.exit(1);
  }

  console.log('Preview server ready! Executing audit test cases...\n');

  const testCases = [
    { label: '1. Homepage', path: '/' },
    { label: '2a. Calculator (with slash)', path: '/cbm-calculator/' },
    { label: '2b. Calculator (slashless)', path: '/cbm-calculator' },
    { label: '3a. Guide (with slash)', path: '/guides/nmfc-2025-changes/' },
    { label: '3b. Guide (slashless)', path: '/guides/nmfc-2025-changes' },
    { label: '4a. Legacy NMFC URL (with slash)', path: '/guides/nmfc-density-class-changes/' },
    { label: '4b. Legacy NMFC URL (slashless)', path: '/guides/nmfc-density-class-changes' },
    { label: '5a. Nonexistent URL (slashless)', path: '/definitely-nonexistent-route' },
    { label: '5b. Nonexistent URL (with slash)', path: '/definitely-nonexistent-route/' },
    { label: '6. Static asset (favicon.svg)', path: '/favicon.svg' },
  ];

  const results = [];
  for (const tc of testCases) {
    const rec = await runTestCase(tc.label, tc.path);
    results.push(rec);
  }

  previewProcess.kill();

  console.table(
    results.map((r) => ({
      Test: r.label,
      'Requested URL': r.requestedUrl,
      Status: r.actualStatus,
      Location: r.locationHeader || '—',
      'Final URL': r.finalUrl,
      'Final Status': r.finalStatus,
      'Page Canonical': r.finalCanonical || '—',
      'In Sitemap': r.presentInSitemap ? 'YES' : 'NO',
    }))
  );

  fs.writeFileSync(
    path.join(__dirname, 'audit-test-results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log('\nResults saved to audit-test-results.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
