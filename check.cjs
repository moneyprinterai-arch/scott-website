const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);

  // Hero state
  await page.screenshot({ path: 'check-hero.png' });

  // Mid-scroll transition
  await page.evaluate(() => window.scrollTo({ top: 550, behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'check-transition.png' });

  // Page 1 fully visible
  await page.evaluate(() => window.scrollTo({ top: 1400, behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'check-page1.png' });

  await browser.close();
  console.log('Screenshots saved: check-hero.png, check-transition.png, check-page1.png');
})();
