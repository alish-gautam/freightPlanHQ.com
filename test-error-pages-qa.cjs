const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'error-templates');
const SCREENSHOT_DIR = path.join(__dirname, 'qa-screenshots', 'error-pages');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 4329;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = req.url.split('?')[0];

      // Error template simulation routes
      if (url === '/simulated-500') {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(TEMPLATES_DIR, '500.html')).pipe(res);
        return;
      }
      if (url === '/simulated-403') {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(TEMPLATES_DIR, '403.html')).pipe(res);
        return;
      }
      if (url === '/simulated-429') {
        res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(TEMPLATES_DIR, '429.html')).pipe(res);
        return;
      }
      if (url === '/simulated-502') {
        res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(TEMPLATES_DIR, '502.html')).pipe(res);
        return;
      }
      if (url === '/simulated-503') {
        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(TEMPLATES_DIR, '503.html')).pipe(res);
        return;
      }
      if (url === '/simulated-504') {
        res.writeHead(504, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(TEMPLATES_DIR, '504.html')).pipe(res);
        return;
      }

      // Static file lookup
      let reqPath = decodeURI(url);
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      let filePath = path.join(DIST_DIR, reqPath);

      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }

      // If file exists, return 200 with mime type
      if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      // Production-grade 404 behavior: return 404 HTTP status with dist/404.html
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(path.join(DIST_DIR, '404.html')).pipe(res);
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Test server running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function runAudit() {
  const server = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const viewports = [320, 390, 768, 1024, 1440];

  const results = {
    checks: [],
    errors: [],
    overflows: []
  };

  try {
    console.log('\n--- 1. Testing Genuine 404 HTTP Response ---');
    const test404Url = `http://127.0.0.1:${PORT}/this-route-does-not-exist-qa/`;
    const response = await page.goto(test404Url, { waitUntil: 'networkidle0' });
    const status = response.status();
    console.log(`Requested: ${test404Url} -> HTTP Status: ${status}`);

    if (status !== 404) {
      results.errors.push(`Expected 404 status, got ${status}`);
    } else {
      results.checks.push(`HTTP 404 status verified on nonexistent path`);
    }

    const title = await page.title();
    console.log(`Page title: "${title}"`);
    if (!title.includes('404')) {
      results.errors.push(`Title does not contain '404': ${title}`);
    }

    const h1Text = await page.$eval('h1', el => el.textContent.trim());
    console.log(`H1 content: "${h1Text}"`);
    if (!h1Text.includes('404 — Page not found')) {
      results.errors.push(`H1 text mismatch: ${h1Text}`);
    }

    console.log('\n--- 2. Responsive & Overflow Checks for 404 Page ---');
    for (const w of viewports) {
      await page.setViewport({ width: w, height: 900 });

      // Light mode check
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await new Promise(r => setTimeout(r, 100));
      let overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) {
        results.overflows.push(`404 page overflows at ${w}px in Light Mode`);
      }
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `404-${w}px-light.png`), fullPage: false });

      // Dark mode check
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await new Promise(r => setTimeout(r, 100));
      overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) {
        results.overflows.push(`404 page overflows at ${w}px in Dark Mode`);
      }
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `404-${w}px-dark.png`), fullPage: false });

      console.log(`Viewport ${w}px: OK (No horizontal overflow: ${!overflow})`);
    }

    console.log('\n--- 3. Testing Recovery Navigation Links on 404 Page ---');
    const links = await page.$$eval('a', els => els.map(a => a.getAttribute('href')));
    const expectedLinks = [
      '/',
      '/guides/',
      '/cbm-calculator/',
      '/pallet-calculator/',
      '/container-loading-calculator/',
      '/freight-class-calculator/',
      '/contact/'
    ];

    for (const expected of expectedLinks) {
      if (links.includes(expected)) {
        results.checks.push(`Verified link exists: ${expected}`);
        console.log(`Found verified link: ${expected}`);
      } else {
        results.errors.push(`Missing link: ${expected}`);
      }
    }

    console.log('\n--- 4. Testing Standalone Hosting-Level Error Templates ---');
    const serverStatuses = [
      { path: '/simulated-500', expectedStatus: 500, heading: '500 — Something went wrong' },
      { path: '/simulated-403', expectedStatus: 403, heading: '403 — Access unavailable' },
      { path: '/simulated-429', expectedStatus: 429, heading: '429 — Too many requests' },
      { path: '/simulated-502', expectedStatus: 502, heading: '502 — Gateway connection problem' },
      { path: '/simulated-503', expectedStatus: 503, heading: '503 — Temporarily unavailable' },
      { path: '/simulated-504', expectedStatus: 504, heading: '504 — The request took too long' },
    ];

    for (const test of serverStatuses) {
      const res = await page.goto(`http://127.0.0.1:${PORT}${test.path}`, { waitUntil: 'networkidle0' });
      const statusCode = res.status();
      const pageH1 = await page.$eval('h1', el => el.textContent.trim());

      console.log(`Route ${test.path}: Status=${statusCode} (Expected: ${test.expectedStatus}), H1="${pageH1}"`);

      if (statusCode !== test.expectedStatus) {
        results.errors.push(`Status mismatch on ${test.path}: got ${statusCode}, expected ${test.expectedStatus}`);
      } else {
        results.checks.push(`HTTP ${statusCode} response verified with branded template`);
      }

      if (!pageH1.includes(test.heading)) {
        results.errors.push(`H1 mismatch on ${test.path}: "${pageH1}"`);
      }

      // Check responsive at 390px and 1024px
      for (const w of [390, 1024]) {
        await page.setViewport({ width: w, height: 800 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        if (overflow) {
          results.overflows.push(`${test.path} template overflows at ${w}px`);
        }
      }
    }

    console.log('\n=======================================');
    console.log('AUDIT SUMMARY');
    console.log('=======================================');
    console.log(`Total checks passed: ${results.checks.length}`);
    console.log(`Total errors: ${results.errors.length}`);
    console.log(`Total overflows: ${results.overflows.length}`);
    if (results.errors.length > 0) {
      console.log('Errors:', results.errors);
    }
    if (results.overflows.length > 0) {
      console.log('Overflows:', results.overflows);
    }
    console.log('=======================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
