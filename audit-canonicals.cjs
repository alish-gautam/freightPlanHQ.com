const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir) {
  let results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(findHtmlFiles(full));
    } else if (item.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const files = findHtmlFiles('./dist');
console.log('Total HTML files in dist:', files.length);

const canonicals = [];
const slashlessLinksFound = [];
const nonTrailingCanonicals = [];
const missingCanonicals = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const rel = path.relative('./dist', file).replace(/\\/g, '/');
  
  // Find canonical
  const match = content.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const canon = match ? match[1] : null;
  
  // Check canonical presence and trailing slash (except 404.html which should NOT have canonical)
  if (rel === '404.html') {
    if (canon) {
      console.warn(`WARNING: 404.html has canonical: ${canon}`);
    }
  } else {
    if (!canon) {
      missingCanonicals.push(rel);
    } else {
      canonicals.push({ file: rel, canonical: canon });
      if (!canon.endsWith('/')) {
        nonTrailingCanonicals.push({ file: rel, canonical: canon });
      }
    }
  }

  // Find slashless internal root-relative links like href="/something" (excluding assets like .css, .js, .svg, .ico, .png, #anchors)
  const hrefMatches = content.matchAll(/href="(\/[a-zA-Z0-9_\-]+)"/g);
  for (const m of hrefMatches) {
    slashlessLinksFound.push({ file: rel, link: m[1] });
  }
}

console.log(`Audited ${canonicals.length} pages with canonical tags.`);
console.log(`Missing canonicals (excluding 404): ${missingCanonicals.length}`);
if (missingCanonicals.length > 0) {
  console.log('Missing canonicals:', missingCanonicals);
}

console.log(`Non-trailing slash canonicals: ${nonTrailingCanonicals.length}`);
if (nonTrailingCanonicals.length > 0) {
  console.log('Non-trailing canonicals:', nonTrailingCanonicals);
}

console.log(`Slashless internal links found: ${slashlessLinksFound.length}`);
if (slashlessLinksFound.length > 0) {
  console.log('Slashless links:', slashlessLinksFound);
}

// Sitemap validation
const sitemapContent = fs.readFileSync('./dist/sitemap-0.xml', 'utf-8');
const locMatches = [...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
console.log(`Total URLs in sitemap: ${locMatches.length}`);
const nonTrailingSitemap = locMatches.filter(u => !u.endsWith('/'));
console.log(`Sitemap URLs without trailing slash: ${nonTrailingSitemap.length}`);
if (nonTrailingSitemap.length > 0) {
  console.log('Non-trailing sitemap entries:', nonTrailingSitemap);
}
const legacyInSitemap = locMatches.filter(u => u.includes('nmfc-density-class-changes'));
console.log(`Legacy NMFC URL in sitemap: ${legacyInSitemap.length}`);
const fourOhFourInSitemap = locMatches.filter(u => u.includes('404'));
console.log(`404 page in sitemap: ${fourOhFourInSitemap.length}`);

