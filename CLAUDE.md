CLAUDE.md

Save this file as CLAUDE.md in the project root. Claude Code reads this automatically before every task.

—

## RULE #1 — LOOK BEFORE YOU CODE

You must screenshot the reference videos and your local build before making any change, and again after. You do not ship anything until the screenshots match. No exceptions.

—

## REFERENCE VIDEOS (the source of truth)

Sphere animation:
https://player.vimeo.com/video/557996685?background=1&loop=1

Hero + Page 1 transition:
https://player.vimeo.com/video/566009706?background=1&loop=1


—

## MANDATORY LOOP — RUN THIS EVERY TIME

### 1. Capture references

```
node scripts/ref.js
```

```js
// scripts/ref.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });

  // Sphere reference
  await p.goto('https://player.vimeo.com/video/557996685?background=1&loop=1');
  await p.waitForTimeout(14000);
  await p.screenshot({ path: 'refs/ref-sphere.png' });

  // Hero reference (video starts on hero)
  await p.goto('https://player.vimeo.com/video/566009706?background=1&loop=1');
  await p.waitForTimeout(3000);
  await p.screenshot({ path: 'refs/ref-hero.png' });

  // Page 1 reference (video shows page 1 after ~2s)
  await p.waitForTimeout(9000);
  await p.screenshot({ path: 'refs/ref-page1.png' });

  await b.close();
  console.log('Done. Open refs/ and study every image before writing code.');
})();
```

### 2. Write your code. Start dev server.

### 3. Capture your build

```
node scripts/check.js
```

```js
// scripts/check.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:3000');
  await p.waitForTimeout(3000);

  await p.screenshot({ path: 'refs/build-hero.png' });

  await p.evaluate(() => window.scrollTo(0, 500));
  await p.waitForTimeout(600);
  await p.screenshot({ path: 'refs/build-transition.png' });

  await p.evaluate(() => window.scrollTo(0, window.innerHeight));
  await p.waitForTimeout(600);
  await p.screenshot({ path: 'refs/build-page1.png' });

  await b.close();
  console.log('Done. Compare refs/build-*.png against refs/ref-*.png');
})();
```

### 4. Diff the images

```
node scripts/diff.js
```

```js
// scripts/diff.js
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const fs = require('fs');
if (!fs.existsSync('refs')) fs.mkdirSync('refs');

const pairs = [
  ['refs/ref-hero.png',   'refs/build-hero.png',   'refs/diff-hero.png'],
  ['refs/ref-page1.png',  'refs/build-page1.png',  'refs/diff-page1.png'],
];

for (const [a, b, out] of pairs) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) { console.log('Missing:', a, b); continue; }
  const imgA = PNG.sync.read(fs.readFileSync(a));
  const imgB = PNG.sync.read(fs.readFileSync(b));
  const w = imgA.width, h = imgA.height;
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(imgA.data, imgB.data, diff.data, w, h, { threshold: 0.1 });
  fs.writeFileSync(out, PNG.sync.write(diff));
  console.log(`${out}: ${((n/(w*h))*100).toFixed(1)}% different`);
}
```

Install once: `npm install pixelmatch pngjs`

### 5. Open the diff images. Red pixels = wrong. Go back to step 2.

Do not move on until the diff is near zero.

—

## WHAT THE REFERENCE SHOWS — READ THIS

### The sphere (video 1)
Background: very dark warm brown #1a0503 — not black, not grey
- The sphere is built from thousands of tiny dots (~3px) arranged in curved horizontal rows — like latitude lines on a globe
- Light source is upper-left: bright amber/gold #f2a12e on the left face, deep shadow #1a0503 on the right
- The dot rows slowly undulate with a wave motion (like a slow liquid wobble)
- The sphere slowly rotates on its Y axis
- It is large — fills most of the frame

### Hero (video 2, first ~1.5 seconds)
Pure white background #ffffff
- Sphere sits at bottom-center — only the top dome is visible, cropped by viewport bottom
- Text block is right of center, in clean white space — does NOT overlap the sphere
- "The world's first" — gray #9a9a9a, light weight 300, ~52px
- "flexible currency." — dark warm brown #1a0503, bold 700, ~56px
- Below: "◇ Meet Scōtt" label left, body paragraph right (~13px, #666)
- Below that: a row of 5 faded gray partner icons (Amazon, Coinbase, Slack, Uber, Bitcoin)
- Header: "Scōtt" bold top-left, "Create Wallet" + thin circle button top-right
- Left side: 3x3 dot grid circle button, fixed, vertically centered

### Transition (video 2, ~1.2–1.8 seconds)
A dark panel #1a0503 with a large rounded top edge slides UP from the bottom as user scrolls
- Same sphere canvas continues — now visible against the dark background
- Hero text fades out during scroll
- Header text flips from dark to white

### Page 1 (video 2, after ~2 seconds)
Full dark background #1a0503
- Sphere has dissolved into a glowing particle cloud — bright amber glow on right side
- LEFT side white text:
  - "Scōtt" logo white top-left
  - Large body ~26px medium: "Scōtt is the most widely integrated digital-to-fiat currency today. Buy, sell, and use Scōtt tokens at our exchange and service providers."
  - Thin horizontal rule below
  - Stats side by side: "$620B Transactions" and "71M+ Wallets" with small subtext below each
  - White filled circle play button (▶) to the right of stats
- "01 Introduction" rotated vertically on far left edge, white, faint

—

## PACKAGE.JSON SCRIPTS

Add these:

```json
"ref":   "node scripts/ref.js",
"check": "node scripts/check.js && node scripts/diff.js"
```

Usage: `npm run ref` once. Then `npm run check` after every change.

—

## CURRENT PROBLEMS WITH THE BUILD

1. Sphere is flat 2D scattered dots — needs to be a proper 3D latitude-row dot mesh with wave animation and upper-left amber lighting
2. Sphere fills the left half of the hero and overlaps the text — it should sit at bottom-center, cropped, as a rising dome
3. Section 2 is white — it must be dark #1a0503 with the sphere glowing as a particle cloud
4. There is no scroll transition animation — the dark section must rise from the bottom with a rounded-top edge
5. "flexible currency." colour is close but should be #1a0503 not pure black
6. Hero text is overlapping sphere — needs clean white space on left, text block on right starting at ~50% from left

Fix these in order. Use npm run check after each fix.
