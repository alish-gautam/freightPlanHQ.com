/**
 * Single source of truth for brand, domain, and deployment metadata.
 * Configurable via environment variables (PUBLIC_SITE_URL / SITE_URL / PREVIEW_MODE).
 * 
 * Production Target: https://freightplanhq.com (Pending Purchase & Configuration)
 */
export const BRAND_NAME = 'FreightPlanHQ';

const envSiteUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '';
const cfPagesUrl = process.env.CF_PAGES_URL || '';

// Detect preview environments to prevent accidental indexing of preview copies
export const isPreview = Boolean(
  process.env.PREVIEW_MODE === 'true' ||
  process.env.PUBLIC_IS_PREVIEW === 'true' ||
  (process.env.CF_PAGES === '1' && process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'production' && process.env.IS_PRODUCTION !== 'true') ||
  envSiteUrl.includes('.pages.dev') ||
  cfPagesUrl.includes('.pages.dev')
);

// Resolve site base URL (defaulting cleanly to the target production domain)
const targetUrl = envSiteUrl || (isPreview && cfPagesUrl ? cfPagesUrl : 'https://freightplanhq.com');
const cleanUrl = targetUrl.replace(/\/+$/, '');

let resolvedDomain = 'freightplanhq.com';
try {
  resolvedDomain = new URL(cleanUrl).hostname;
} catch {
  resolvedDomain = 'freightplanhq.com';
}

export const DOMAIN = resolvedDomain;

export const site = {
  brandName: BRAND_NAME,
  domain: DOMAIN,
  url: cleanUrl,
  isPreview,
  title: `${BRAND_NAME} — Freight & Packaging Planning Tools`,
  description:
    'Practical calculators for measuring, packing, palletizing and planning freight before shipment.',
  author: BRAND_NAME,
  contactEmail: '' as string, // Blocked pending freightplanhq.com domain purchase & MX configuration
  twitterHandle: '' as string,
  ogImage: '/favicon.svg',
  copyright: `© ${new Date().getFullYear()} ${BRAND_NAME}`,
} as const;
