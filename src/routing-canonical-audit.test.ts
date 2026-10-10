import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { calculators } from './lib/calculators/registry';
import { guides } from './lib/guides/registry';
import { site } from './lib/site';

describe('Routing, Trailing-Slash, and Canonical URL SEO Audit', () => {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const redirectsFile = path.join(rootDir, 'public/_redirects');

  it('preserves all 14 calculator routes with trailing slashes', () => {
    expect(calculators).toHaveLength(14);
    for (const calc of calculators) {
      expect(calc.path).toMatch(/^\/[a-z0-9-]+\/$/);
      expect(calc.path.endsWith('/')).toBe(true);
    }
  });

  it('preserves all 19 guide routes with trailing slashes', () => {
    expect(guides).toHaveLength(19);
    for (const guide of guides) {
      expect(guide.path).toMatch(/^\/guides\/[a-z0-9-]+\/$/);
      expect(guide.path.endsWith('/')).toBe(true);
    }
  });

  it('includes nmfc-2025-changes as the canonical guide route and excludes legacy slug from registry', () => {
    const canonicalGuide = guides.find((g) => g.slug === 'nmfc-2025-changes');
    expect(canonicalGuide).toBeDefined();
    expect(canonicalGuide?.path).toBe('/guides/nmfc-2025-changes/');

    const legacyGuide = guides.find((g) => g.slug === 'nmfc-density-class-changes');
    expect(legacyGuide).toBeUndefined();
  });

  it('verifies public/_redirects contains exact 301 rules for all known routes and legacy NMFC routes', () => {
    expect(fs.existsSync(redirectsFile)).toBe(true);
    const content = fs.readFileSync(redirectsFile, 'utf-8');
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));

    // Check legacy redirects
    expect(lines).toContain('/guides/nmfc-density-class-changes /guides/nmfc-2025-changes/ 301');
    expect(lines).toContain('/guides/nmfc-density-class-changes/ /guides/nmfc-2025-changes/ 301');

    // Check calculator slashless redirects
    for (const calc of calculators) {
      const slashless = calc.path.slice(0, -1);
      expect(lines).toContain(`${slashless} ${calc.path} 301`);
    }

    // Check guide slashless redirects
    for (const guide of guides) {
      const slashless = guide.path.slice(0, -1);
      expect(lines).toContain(`${slashless} ${guide.path} 301`);
    }

    // Ensure NO catch-all/wildcard redirect exists that would mask 404s
    const wildcardLines = lines.filter((l) => l.startsWith('/*') || l.includes(':splat'));
    expect(wildcardLines).toHaveLength(0);
  });

  it('verifies sitemap contains only canonical trailing-slash URLs and excludes legacy NMFC and 404', () => {
    const sitemapPath = path.join(distDir, 'sitemap-0.xml');
    if (!fs.existsSync(sitemapPath)) {
      // If not yet built, skip or warn
      return;
    }
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    const urls = [...content.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    // All URLs must end with a slash
    for (const u of urls) {
      expect(u.endsWith('/')).toBe(true);
      expect(u.startsWith(site.url)).toBe(true);
    }

    // Legacy NMFC route must be excluded
    expect(urls.some((u) => u.includes('nmfc-density-class-changes'))).toBe(false);

    // 404 page must be excluded
    expect(urls.some((u) => u.includes('404'))).toBe(false);

    // Exactly 42 indexable pages: 1 home + 14 calculators + 1 guides index + 19 guides + 7 static pages
    expect(urls).toHaveLength(42);
  });

  it('verifies all generated HTML files (except 404 and redirect) have trailing-slash canonical URLs', () => {
    if (!fs.existsSync(distDir)) return;

    function getHtmlFiles(dir: string): string[] {
      let results: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(getHtmlFiles(full));
        } else if (entry.name.endsWith('.html')) {
          results.push(full);
        }
      }
      return results;
    }

    const htmlFiles = getHtmlFiles(distDir);
    for (const file of htmlFiles) {
      const rel = path.relative(distDir, file).replace(/\\/g, '/');
      const content = fs.readFileSync(file, 'utf-8');
      const canonMatch = content.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);

      if (rel === '404.html') {
        expect(canonMatch).toBeNull();
      } else if (rel === 'guides/nmfc-density-class-changes/index.html') {
        // Legacy redirect template has canonical pointing to new target
        expect(canonMatch?.[1]).toBe(`${site.url}/guides/nmfc-2025-changes/`);
      } else {
        expect(canonMatch).not.toBeNull();
        expect(canonMatch![1].endsWith('/')).toBe(true);
        expect(canonMatch![1].startsWith(site.url)).toBe(true);
      }
    }
  });

  it('verifies no internal links in HTML use slashless paths', () => {
    if (!fs.existsSync(distDir)) return;

    function getHtmlFiles(dir: string): string[] {
      let results: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(getHtmlFiles(full));
        } else if (entry.name.endsWith('.html')) {
          results.push(full);
        }
      }
      return results;
    }

    const htmlFiles = getHtmlFiles(distDir);
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Root-relative hrefs that are slashless route paths (excluding static assets and anchors)
      const matches = [...content.matchAll(/href="(\/[a-zA-Z0-9_-]+)"/g)].map((m) => m[1]);
      expect(matches).toEqual([]);
    }
  });
});
