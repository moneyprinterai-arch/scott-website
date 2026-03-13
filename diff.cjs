const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  const refPage = await ctx.newPage();
  await refPage.goto('https://scott-website-alpha.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
  await refPage.waitForTimeout(5000);
  await refPage.screenshot({ path: 'screenshots/diff-ref-hero.png' });
  await refPage.evaluate(() => window.scrollTo({ top: 1800, behavior: 'instant' }));
  await refPage.waitForTimeout(1500);
  await refPage.screenshot({ path: 'screenshots/diff-ref-page1.png' });
  await refPage.close();

  const buildPage = await ctx.newPage();
  await buildPage.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
  await buildPage.waitForTimeout(5000);
  await buildPage.screenshot({ path: 'screenshots/diff-build-hero.png' });
  await buildPage.evaluate(() => window.scrollTo({ top: 1800, behavior: 'instant' }));
  await buildPage.waitForTimeout(1500);
  await buildPage.screenshot({ path: 'screenshots/diff-build-page1.png' });
  await buildPage.close();

  await browser.close();

  const pairs = [
    ['screenshots/diff-ref-hero.png', 'screenshots/diff-build-hero.png', 'screenshots/diff-hero.png'],
    ['screenshots/diff-ref-page1.png', 'screenshots/diff-build-page1.png', 'screenshots/diff-page1.png'],
  ];

  for (const [a, b, out] of pairs) {
    const imgA = PNG.sync.read(fs.readFileSync(a));
    const imgB = PNG.sync.read(fs.readFileSync(b));
    const w = Math.min(imgA.width, imgB.width);
    const h = Math.min(imgA.height, imgB.height);
    const diff = new PNG({ width: w, height: h });
    const n = pixelmatch(imgA.data, imgB.data, diff.data, w, h, { threshold: 0.15 });
    fs.writeFileSync(out, PNG.sync.write(diff));
    console.log(out + ': ' + ((n / (w * h)) * 100).toFixed(2) + '% different (' + n + ' pixels)');
  }
})().catch(e => { console.error(e.message); process.exit(1); });
