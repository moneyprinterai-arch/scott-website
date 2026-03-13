const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    args: ['--font-render-hinting=none', '--use-gl=angle', '--enable-gpu-rasterization']
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  // Single CDP session for all screenshots
  const client = await page.context().newCDPSession(page);

  async function snap(name) {
    const { data } = await client.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 900, scale: 1 },
    });
    fs.writeFileSync(`screenshots/${name}.png`, Buffer.from(data, 'base64'));
    console.log(`  done: ${name}`);
  }

  console.log('Loading page...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // 1. Hero screenshot (visible by default)
  console.log('Taking hero...');
  await snap('01-hero');

  // Kill GSAP
  console.log('Killing GSAP...');
  await page.evaluate(() => {
    try {
      if (window.__ScrollTrigger) {
        window.__ScrollTrigger.getAll().forEach(st => st.kill());
        window.__ScrollTrigger.refresh();
      }
      if (window.__gsap) {
        window.__gsap.killTweensOf('*');
      }
    } catch(e) { console.log('GSAP kill error:', e); }
  });
  await page.waitForTimeout(300);

  // For each section: move it to viewport as a fixed overlay, force children visible, screenshot, then reset
  const sections = [
    { id: 'dark-info', name: '02-dark-info' },
    { id: 'bank', name: '03-bank' },
    { id: 'cards', name: '04-cards' },
    { id: 'statistics', name: '05-stats' },
    { id: 'testimonial', name: '06-testimonial' },
  ];

  for (const { id, name } of sections) {
    console.log(`Preparing ${id}...`);
    await page.evaluate((sectionId) => {
      const section = document.getElementById(sectionId);
      if (!section) return;

      // Store original styles
      section.dataset.origStyle = section.getAttribute('style') || '';
      section.dataset.origClass = section.className;

      // Move section to fill viewport as fixed overlay
      section.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 99999 !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        overflow: hidden !important;
        display: flex !important;
      `;

      // Force ALL descendants visible
      section.querySelectorAll('*').forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.transform = el.style.transform === 'none' ? '' : 'none';
      });
    }, id);

    await page.waitForTimeout(300);
    console.log(`Taking ${name}...`);
    await snap(name);

    // Reset section
    await page.evaluate((sectionId) => {
      const section = document.getElementById(sectionId);
      if (!section) return;
      section.style.cssText = section.dataset.origStyle || '';
      section.className = section.dataset.origClass || '';
      section.querySelectorAll('*').forEach(el => {
        el.style.opacity = '';
        el.style.visibility = '';
        el.style.transform = '';
      });
    }, id);
  }

  // 7. Nav overlay
  console.log('Opening nav overlay...');
  await page.evaluate(() => {
    const overlay = document.querySelector('[data-nav-overlay]');
    if (overlay) {
      overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 100000 !important;
        display: flex !important;
        opacity: 1 !important;
        visibility: visible !important;
        clip-path: none !important;
        background: #2B0D07 !important;
      `;
      overlay.querySelectorAll('*').forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.clipPath = 'none';
        if (el.style.transform) el.style.transform = 'none';
      });
    }
  });
  await page.waitForTimeout(500);
  console.log('Taking nav...');
  await snap('07-nav');

  await client.detach();
  await browser.close();
  console.log('All 7 screenshots done!');
})().catch(e => { console.error(e); process.exit(1); });
