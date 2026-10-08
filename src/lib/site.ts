/**
 * Single source of truth for brand and site metadata.
 * BRAND_NAME and DOMAIN are TEMPORARY development constants.
 * The owner must verify domain, trademark and handle availability before launch.
 */
export const BRAND_NAME = 'FreightPlanHQ';
export const DOMAIN = 'FreightPlanHQ.com';

export const site = {
  brandName: BRAND_NAME,
  domain: DOMAIN,
  url: `https://${DOMAIN.toLowerCase()}`,
  title: `${BRAND_NAME} — Freight & Packaging Planning Tools`,
  description:
    'Practical calculators for measuring, packing, palletizing and planning freight before shipment.',
  author: BRAND_NAME,
  contactEmail: '' as string, // Not supplied by the project owner; do not invent.
  twitterHandle: '' as string,
  ogImage: '/favicon.svg',
  copyright: `© ${new Date().getFullYear()} ${BRAND_NAME}`,
} as const;
