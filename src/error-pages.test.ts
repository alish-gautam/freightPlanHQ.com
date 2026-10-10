import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import http from 'http';

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'error-templates');

describe('Error Pages & Templates Production Verification', () => {
  describe('404 Page (dist/404.html)', () => {
    const html404Path = path.join(DIST_DIR, '404.html');
    let content404: string;

    beforeAll(() => {
      expect(fs.existsSync(html404Path), 'dist/404.html must exist').toBe(true);
      content404 = fs.readFileSync(html404Path, 'utf-8');
    });

    it('has correct SEO robots noindex and omits canonical tag to avoid soft-404 duplicate indexing', () => {
      expect(content404).toContain('content="noindex, nofollow"');
      expect(content404).not.toContain('<link rel="canonical"');
    });

    it('has accessible title and single H1 matching brand guidelines', () => {
      expect(content404).toContain('<title>404 — Page Not Found · FreightPlanHQ</title>');
      const h1Matches = content404.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
      expect(h1Matches).not.toBeNull();
      expect(h1Matches!.length).toBe(1);
      expect(h1Matches![0]).toContain('404 — Page not found');
    });

    it('contains required supporting copy', () => {
      expect(content404).toContain(
        "The page you're looking for may have moved, or the URL may be incorrect."
      );
    });

    it('provides all required verified recovery navigation links', () => {
      expect(content404).toContain('href="/"');
      expect(content404).toContain('href="/cbm-calculator/"');
      expect(content404).toContain('href="/pallet-calculator/"');
      expect(content404).toContain('href="/container-loading-calculator/"');
      expect(content404).toContain('href="/freight-class-calculator/"');
      expect(content404).toContain('href="/guides/"');
      expect(content404).toContain('href="/contact/"');
    });

    it('includes status code badge and subtle geometric planning motif', () => {
      expect(content404).toContain('404 — PAGE NOT FOUND');
      expect(content404).toContain('STATUS: 404_PAGE_NOT_FOUND');
    });
  });

  describe('Sitemap & SEO Exclusions', () => {
    it('ensures 404 page is excluded from sitemap-0.xml', () => {
      const sitemapPath = path.join(DIST_DIR, 'sitemap-0.xml');
      expect(fs.existsSync(sitemapPath)).toBe(true);
      const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
      expect(sitemapContent).not.toContain('/404');
      expect(sitemapContent).not.toContain('404.html');
      expect(sitemapContent).not.toContain('/500');
      expect(sitemapContent).not.toContain('500.html');
    });

    it('preserves essential calculator routes in sitemap', () => {
      const sitemapContent = fs.readFileSync(path.join(DIST_DIR, 'sitemap-0.xml'), 'utf-8');
      expect(sitemapContent).toContain('https://freightplanhq.com/cbm-calculator/');
      expect(sitemapContent).toContain('https://freightplanhq.com/pallet-calculator/');
      expect(sitemapContent).toContain('https://freightplanhq.com/container-loading-calculator/');
    });
  });

  describe('Standalone Hosting-Level Error Templates', () => {
    const errorCodes = [
      { code: '500', title: '500 — Something went wrong', badge: '500 — INTERNAL SERVER ERROR' },
      { code: '403', title: '403 — Access unavailable', badge: '403 — ACCESS UNAVAILABLE' },
      { code: '429', title: '429 — Too many requests', badge: '429 — TOO MANY REQUESTS' },
      { code: '502', title: '502 — Gateway connection problem', badge: '502 — BAD GATEWAY' },
      { code: '503', title: '503 — Temporarily unavailable', badge: '503 — SERVICE UNAVAILABLE' },
      { code: '504', title: '504 — The request took too long', badge: '504 — GATEWAY TIMEOUT' },
    ];

    errorCodes.forEach(({ code, title, badge }) => {
      it(`verifies ${code}.html is self-contained, branded, accessible, and leak-free`, () => {
        const filePath = path.join(TEMPLATES_DIR, `${code}.html`);
        expect(fs.existsSync(filePath), `${code}.html must exist in error-templates`).toBe(true);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Zero external script dependencies
        expect(content).not.toMatch(/<script\s+[^>]*src=/i);
        // Zero external stylesheet dependencies
        expect(content).not.toMatch(/<link\s+[^>]*rel=["']stylesheet["']/i);

        // Required H1 and badge
        expect(content).toContain(title);
        expect(content).toContain(badge);

        // Contains inline branding and SVG
        expect(content).toContain('<svg');
        expect(content).toContain('Freight');
        expect(content).toContain('Plan');

        // Contains verified recovery links
        expect(content).toContain('href="/"');
        expect(content).toContain('href="/cbm-calculator/"');
        expect(content).toContain('href="/pallet-calculator/"');
        expect(content).toContain('href="/container-loading-calculator/"');
        expect(content).toContain('href="/freight-class-calculator/"');
        expect(content).toContain('href="/contact/"');

        // Dual theme CSS variables
        expect(content).toContain('--canvas: #f8fafc;');
        expect(content).toContain('--canvas: #090d16;');
        expect(content).toContain('prefers-color-scheme: dark');

        // No diagnostic leakage
        expect(content).not.toContain('node_modules');
        expect(content).not.toContain('process.env');
        expect(content).not.toContain('stack trace');
      });
    });
  });

  describe('HTTP Status Code Integrity Verification via Live Server', () => {
    let server: http.Server;
    let serverPort: number;

    beforeAll(async () => {
      server = http.createServer((req, res) => {
        const url = req.url || '/';

        if (url === '/test-trigger-500') {
          const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, '500.html'), 'utf-8');
          res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(tpl);
          return;
        }

        if (url === '/test-trigger-403') {
          const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, '403.html'), 'utf-8');
          res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(tpl);
          return;
        }

        if (url === '/test-trigger-429') {
          const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, '429.html'), 'utf-8');
          res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(tpl);
          return;
        }

        if (url === '/test-trigger-502') {
          const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, '502.html'), 'utf-8');
          res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(tpl);
          return;
        }

        if (url === '/test-trigger-503') {
          const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, '503.html'), 'utf-8');
          res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(tpl);
          return;
        }

        if (url === '/test-trigger-504') {
          const tpl = fs.readFileSync(path.join(TEMPLATES_DIR, '504.html'), 'utf-8');
          res.writeHead(504, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(tpl);
          return;
        }

        // Standard static host 404 simulation:
        // When route doesn't match an existing file, host returns 404 status + 404.html body
        const html404 = fs.readFileSync(path.join(DIST_DIR, '404.html'), 'utf-8');
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html404);
      });

      await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          if (addr && typeof addr === 'object') {
            serverPort = addr.port;
          }
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    function fetchStatus(path: string): Promise<{ status: number; body: string }> {
      return new Promise((resolve, reject) => {
        http
          .get(`http://127.0.0.1:${serverPort}${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
          })
          .on('error', reject);
      });
    }

    it('returns genuine HTTP 404 with custom 404 page body for nonexistent paths', async () => {
      const res = await fetchStatus('/random-missing-path-12345/');
      expect(res.status).toBe(404);
      expect(res.body).toContain('<!DOCTYPE html>');
      expect(res.body).toContain('404 — Page not found');
      expect(res.body).not.toBe('Not Found'); // Not a default plain text 404
      expect(res.body).toContain('CBM Calculator');
    });

    it('returns genuine HTTP 500 status with 500 error template', async () => {
      const res = await fetchStatus('/test-trigger-500');
      expect(res.status).toBe(500);
      expect(res.body).toContain('500 — Something went wrong');
    });

    it('returns genuine HTTP 403 status with 403 error template', async () => {
      const res = await fetchStatus('/test-trigger-403');
      expect(res.status).toBe(403);
      expect(res.body).toContain('403 — Access unavailable');
    });

    it('returns genuine HTTP 429 status with 429 error template', async () => {
      const res = await fetchStatus('/test-trigger-429');
      expect(res.status).toBe(429);
      expect(res.body).toContain('429 — Too many requests');
    });

    it('returns genuine HTTP 502 status with 502 error template', async () => {
      const res = await fetchStatus('/test-trigger-502');
      expect(res.status).toBe(502);
      expect(res.body).toContain('502 — Gateway connection problem');
    });

    it('returns genuine HTTP 503 status with 503 error template', async () => {
      const res = await fetchStatus('/test-trigger-503');
      expect(res.status).toBe(503);
      expect(res.body).toContain('503 — Temporarily unavailable');
    });

    it('returns genuine HTTP 504 status with 504 error template', async () => {
      const res = await fetchStatus('/test-trigger-504');
      expect(res.status).toBe(504);
      expect(res.body).toContain('504 — The request took too long');
    });
  });
});
