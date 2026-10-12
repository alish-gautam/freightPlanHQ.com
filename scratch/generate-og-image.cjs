const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_PATH = path.join(__dirname, '../public/og-image.png');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    background: #090d16;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72px 80px;
    position: relative;
    overflow: hidden;
  }
  /* Blueprint Grid Background */
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at 75% 30%, black, transparent 80%);
  }
  .glow {
    position: absolute;
    top: -100px;
    right: -100px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0) 70%);
    border-radius: 50%;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 10;
  }
  .logo-box {
    width: 56px;
    height: 56px;
    background: #ffffff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
  .brand-text {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
  }
  .brand-blue { color: #38bdf8; }
  .badge {
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 6px 14px;
    border-radius: 9999px;
    margin-left: 12px;
  }
  .content {
    z-index: 10;
    max-width: 860px;
  }
  .title {
    font-size: 54px;
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: -0.03em;
    color: #ffffff;
    margin-bottom: 20px;
  }
  .description {
    font-size: 24px;
    font-weight: 400;
    line-height: 1.45;
    color: #94a3b8;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
    border-top: 1px solid #1e293b;
    padding-top: 28px;
  }
  .tools-strip {
    display: flex;
    gap: 20px;
    font-size: 15px;
    font-weight: 600;
    color: #cbd5e1;
  }
  .tools-strip span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .domain {
    font-size: 18px;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.02em;
  }
</style>
</head>
<body>
  <div class="grid-pattern"></div>
  <div class="glow"></div>
  
  <div class="brand">
    <div class="logo-box">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <polygon points="16,4 27.5,9.8 16,15.5 4.5,9.8" fill="#38bdf8"/>
        <line x1="16" y1="4" x2="16" y2="15.5" stroke="#0f172a" stroke-width="1.2"/>
        <line x1="10.25" y1="6.9" x2="21.75" y2="12.65" stroke="#0f172a" stroke-width="1.2"/>
        <polygon points="4.5,11.2 14.5,16.5 14.5,27.5 4.5,22.2" fill="#1d4ed8"/>
        <line x1="8" y1="13.1" x2="8" y2="24.1" stroke="#0f172a" stroke-width="1"/>
        <line x1="11.5" y1="14.9" x2="11.5" y2="25.9" stroke="#0f172a" stroke-width="1"/>
        <polygon points="17.5,16.5 27.5,11.2 27.5,22.2 17.5,27.5" fill="#2563eb"/>
        <line x1="20.8" y1="14.8" x2="20.8" y2="25.8" stroke="#0f172a" stroke-width="1"/>
        <line x1="24.2" y1="13" x2="24.2" y2="24" stroke="#0f172a" stroke-width="1"/>
        <rect x="19.5" y="17.5" width="4.5" height="3" rx="0.75" fill="#f59e0b" stroke="#0f172a" stroke-width="0.75"/>
      </svg>
    </div>
    <div class="brand-text">Freight<span class="brand-blue">Plan</span>HQ</div>
    <div class="badge">14 Dedicated Logistics Calculators</div>
  </div>

  <div class="content">
    <h1 class="title">Freight & Packaging Planning Utility</h1>
    <p class="description">Accurate calculation tools for measuring cargo, right-sizing packaging, pallet stacking (TI×HI), and container loading before quoting.</p>
  </div>

  <div class="footer">
    <div class="tools-strip">
      <span>✓ Freight Class & Density</span>
      <span>✓ CBM & Pallet Stacking</span>
      <span>✓ Dimensional Weight</span>
      <span>✓ 3D Container Loading</span>
    </div>
    <div class="domain">freightplanhq.com</div>
  </div>
</body>
</html>
`;

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.setContent(htmlContent);
  await page.screenshot({ path: OUTPUT_PATH, type: 'png' });
  await browser.close();
  console.log('Successfully generated:', OUTPUT_PATH);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
