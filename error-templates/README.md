# FreightPlanHQ Hosting-Level Error Handling & Deployment Guide

This directory contains standalone, production-ready, self-contained HTTP error templates for FreightPlanHQ (`FreightPlanHQ.com`).

---

## 1. Architecture & Status-Code Integrity

FreightPlanHQ is built with Astro in **Static Generation Mode (`output: 'static'`)**.

### How 404 Errors Work
* **Mechanism**: Astro compiles `src/pages/404.astro` directly to `dist/404.html`.
* **Behavior**: Modern static hosting platforms (Cloudflare Pages, Netlify, Vercel, AWS S3/CloudFront, GitHub Pages, Nginx) detect `dist/404.html` and automatically serve it with a genuine **HTTP 404 Not Found** status code for unmatched routes.
* **SEO Integrity**: It specifies `<meta name="robots" content="noindex, nofollow" />`, omits canonical tags to prevent Soft-404 alias conflicts, and is excluded from `sitemap-0.xml`.

### Why 5xx, 403, and 429 Require Hosting/Edge-Level Configuration
* In a purely static site, all pages and calculators run client-side in the visitor's browser. The origin server does not execute server-side Node.js or edge runtime code per calculation request.
* Therefore, Astro's `500.astro` (which is only for on-demand server rendering) is not applicable.
* Adding routes like `src/pages/500.astro` or `src/pages/403.astro` would generate ordinary static files (`/500/index.html`) that return **HTTP 200 OK**, creating soft-error traps and duplicate indexable pages.
* Genuine HTTP 500, 502, 503, 504, 403, and 429 responses originate at the **CDN, Edge Proxy, WAF, or Hosting Infrastructure** layer (when an upstream origin fails, rate limits trigger, or DNS/routing timeouts occur).
* The templates in this directory (`error-templates/*.html`) are designed for installation into your hosting platform's custom error response mechanism.

---

## 2. Design & Technical Standards of Standalone Templates

Each template in this directory is engineered to withstand complete origin/asset failures:
1. **Zero External Asset Dependencies**: Zero external stylesheets, zero third-party fonts, zero external JavaScript bundles, zero external raster images.
2. **Inline SVG Branding**: Full FreightPlanHQ 3D isometric cargo container planning mark and geometric logistics motifs are rendered as pure inline SVG.
3. **Dual Theme Support**: Implements FreightPlanHQ's exact design tokens (`DESIGN.md`) in CSS custom properties with `@media (prefers-color-scheme: dark)` and automatic synchronization with `localStorage.getItem('theme')`.
4. **WCAG AA Contrast**: High-contrast palettes meeting and exceeding WCAG AA and AAA requirements (Ink > 15:1, Body > 9:1, Accents > 4.5:1).
5. **No Loops or Fake Timers**: Safe, debounced retry buttons that prevent uncontrolled refresh loops. No invented recovery deadlines or fake maintenance schedules.
6. **No Diagnostic Leaks**: Displays only clean diagnostic status codes (`HTTP_500_SERVER_ERROR`, `HTTP_403_FORBIDDEN`, etc.) with zero stack traces, server paths, or environment variables.

---

## 3. Hosting Platform Configuration Instructions

### A. Cloudflare (Cloudflare CDN / DNS / Workers / Pages)

Cloudflare enables custom error pages at the zone level:

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select your domain (`freightplanhq.com`).
3. Navigate to **Custom Pages** (under **Rules** or **Account / Configurations** depending on your plan):
   - **500 Class Errors** (covers 500, 502, 503, 504, 520–527): Upload the contents of `error-templates/500.html`.
   - **1000 Class Errors** (DNS and connection failures): Upload `error-templates/502.html` or `error-templates/504.html`.
   - **1020 / WAF Block (403)**: Upload `error-templates/403.html`.
   - **Rate Limiting (429)**: Upload `error-templates/429.html`.
4. Click **Publish** and test via Cloudflare's preview tool.

*Note: If using Cloudflare Workers or Pages Functions as a reverse proxy, you can return these HTML templates using:*
```ts
return new Response(htmlContent, {
  status: 500,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' }
});
```

---

### B. AWS CloudFront & Amazon S3

When hosting the `dist/` directory on Amazon S3 distributed via CloudFront:

1. Open the [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/).
2. Select your distribution for `freightplanhq.com`.
3. Select the **Error pages** tab and click **Create custom error response**:
   - **HTTP error code**: Select `403: Forbidden` (if S3 returns 403 on missing objects) or `500: Internal Server Error`.
   - **Error caching minimum TTL**: `10` seconds.
   - **Customize error response**: Select **Yes**.
   - **Response page path**: Specify the S3 path where the template is stored (e.g., `/error-templates/500.html` or `/404.html`).
   - **HTTP response code**: Select the true corresponding status code (e.g. `500` or `404`).
4. Repeat for `502: Bad Gateway`, `503: Service Unavailable`, and `504: Gateway Timeout`.
5. Save changes and invalidate CloudFront cache.

---

### C. Nginx (Self-Hosted / VPS / Reverse Proxy)

If deploying the static `dist/` bundle on an Nginx server, place the `error-templates` files into your web root (or an internal error directory) and configure your `nginx.conf` or site block:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name freightplanhq.com www.freightplanhq.com;
    root /var/www/freightplanhq/dist;

    # Clean URLs & Trailing Slash Support
    location / {
        try_files $uri $uri/ =404;
    }

    # Custom 404 Page (Native Astro Output)
    error_page 404 /404.html;
    location = /404.html {
        internal;
        add_header Cache-Control "no-cache";
        add_header X-Robots-Tag "noindex, nofollow";
    }

    # Custom Server Error Pages
    error_page 500 /error-templates/500.html;
    error_page 502 /error-templates/502.html;
    error_page 503 /error-templates/503.html;
    error_page 504 /error-templates/504.html;
    error_page 403 /error-templates/403.html;
    error_page 429 /error-templates/429.html;

    location ^~ /error-templates/ {
        internal; # Prevents visitors from accessing these files directly via HTTP 200
        add_header Cache-Control "no-cache";
        add_header X-Robots-Tag "noindex, nofollow";
    }
}
```

---

### D. Apache / `.htaccess`

```apache
ErrorDocument 404 /404.html
ErrorDocument 500 /error-templates/500.html
ErrorDocument 502 /error-templates/502.html
ErrorDocument 503 /error-templates/503.html
ErrorDocument 504 /error-templates/504.html
ErrorDocument 403 /error-templates/403.html
ErrorDocument 429 /error-templates/429.html
```

---

### E. Netlify / Vercel

* **404 Support**: Automatic out-of-the-box. `dist/404.html` is automatically served for any 404 with HTTP status 404.
* **5xx Support**: Netlify and Vercel static hosting tiers do not support custom static 500 pages for CDN-level platform outages unless an Edge Function / Middleware rewrite is configured.
* If deploying on Netlify or Vercel Edge Middleware:
  ```ts
  // Example Edge Middleware catch block
  try {
    return await next();
  } catch (err) {
    return new Response(error500Html, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  ```
