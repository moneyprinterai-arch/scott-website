# CLAUDE.md — Scōtt Landing Page

This file is read automatically before every task. Do not skip it.

---

## RULE #1 — LOOK BEFORE YOU CODE

Before touching any file:
1. Screenshot the live build at http://localhost:3000 (hero + scroll to Page 1)
2. Screenshot the reference frames in `refs/` (run `npm run ref` if stale)
3. Only write code after you understand exactly what is wrong
4. Screenshot again after your change and compare

Do not ship anything until your screenshots match the reference.

---

## REFERENCE SOURCE OF TRUTH

The design reference is a GIF broken into 30 numbered frames located at:
```
/Users/yuliiaparashchyn/Documents/NUANS DESIGN FILES/Video 1 - website and opening animation - page 0 and 1 /ezgif-60eb36bcc5bc084b-jpg/
```
Files: `ezgif-frame-001.jpg` through `ezgif-frame-030.jpg`

Key frames to study every time:
- **frame-001**: Hero at rest — white panel, heading upper-right, dome peeking at bottom
- **frame-009**: Hero mid-animation — dome fully visible as a wide stadium-arch rising from bottom, halftone dots on right side
- **frame-012**: Page 1 (dark section) fully visible — rounded-corner card, text left, halftone canvas right, white corners visible at top
- **frame-025**: Scroll transition mid-way — dark section rising over hero with large rounded top edge, hero text still partially visible above

Run `npm run ref` to regenerate screenshots from the live build for comparison.

---

## FILE STRUCTURE
```
index.html
css/
  tokens.css       ← CSS custom properties (colours, type, spacing)
  base.css         ← Reset, body, global rules
  layout.css       ← Section layout, white-panel, hero, dark-reveal, sidebar
  components.css   ← Logo, buttons, cards, typography components
  animations.css   ← CSS keyframes only (GSAP handles scroll logic)
js/
  main.js          ← Entry point, imports all modules, DOMContentLoaded init
  animations.js    ← GSAP ScrollTrigger logic (hero transition, bank, cards, stats)
  halftone.js      ← 2D canvas halftone wave renderer (amber/copper dots)
  navigation.js    ← Nav overlay open/close + GSAP
  sphere.js        ← Three.js sphere — ONLY used in the nav overlay, lazy-loaded
  stats-ring.js    ← SVG ring animation for statistics section
scripts/
  ref.js           ← Playwright: captures reference frames
  check.js         ← Playwright: screenshots the live build
  diff.js          ← pixelmatch: diffs ref vs build, outputs diff-*.png
```

---

## CSS TOKENS (tokens.css) — DO NOT CHANGE THESE VALUES
```css
--color-bg-dark:        #1A0503
--color-bg-dark-alt:    #120003
--color-panel-white:    #FFFFFF
--color-text-primary:   #1A1A1A
--color-text-secondary: #555555
--color-accent-copper:  #C8780A

--fw-light:   300
--fw-regular: 400
--fw-bold:    700

--fs-heading:  clamp(2.5rem, 3.8vw, 3.75rem)
--fs-body:     clamp(0.875rem, 1vw, 1rem)
--fs-small:    0.75rem
--fs-logo:     1.375rem

--panel-radius:    1.75rem   (28px)
--sidebar-width:   4.5rem
--panel-padding-x: clamp(2.5rem, 5vw, 5rem)
--lh-heading:  1.05
--ls-heading:  -0.03em
--gradient-bg-vignette: radial-gradient(ellipse at 30% 50%, #2a0808 0%, #1A0503 40%, #120003 100%)
```

---

## SECTION HTML IDs
```
#hero        → .section.section--hero        (white panel, full viewport)
#bank        → .section.section--dark.section--bank   (dark, Page 1 / About)
#cards       → .section.section--dark.section--cards
#statistics  → .section.section--stats
#testimonial → .section.section--testimonial
```

---

## VISUAL SPEC: HERO SECTION (#hero)

### Outer wrapper
- Body/page background: `#FFFFFF` (white — the brown frame in the reference GIF is from Behance, NOT the website)
- `.section--hero` is `position: fixed` during the scroll pin (GSAP ScrollTrigger handles this)
- Inside it is `.white-panel.hero-panel`: `background: white`, `width: 100%`, `min-height: 100vh`, `overflow: hidden` (fills the full viewport, no margins)

### Nav bar (.panel-header)
- Left: `.logo` wordmark "Scōtt" — `color: #2D0A00`, `font-weight: 700`, `font-size: 1.375rem`
- Right: `.cta-wallet` — "Create Wallet" text + `.cta-dot` (small SVG circle button)
- Sits at the very top inside the white panel with `margin-bottom: var(--space-xl)`

### Heading (.hero__heading)
- Positioned at `margin-left: 43%`, `max-width: 50%` relative to the panel
- Sits `margin-top: 8vh` from top of panel content area
- `font-size: var(--fs-heading)` = `clamp(2.5rem, 3.8vw, 3.75rem)`
- Line 1: "The world's first" — `font-weight: 300`, `color: #9A9A9A` (light grey)
- Line 2: `<strong>`"flexible currency."` — `font-weight: 700`, `color: #1A0503` (near-black dark brown)
- The `<strong>` tag must be `display: block` so it sits on its own line

### Info row (.hero__info-row)
Two columns, `display: flex`, `gap: 2rem`, `align-items: flex-start`:
- **Left column (.hero__tag):** `◇ Meet Scōtt` — `font-size: 0.75rem`, `color: #555`, `white-space: nowrap`, `flex-shrink: 0`
- **Right column (.hero__body):** "Scōtt is a stable, decentralized currency that does not discriminate. Any individual or business can realize the advantages of digital money." — `font-size: var(--fs-body)`, `color: #666`, `max-width: 340px`, `line-height: 1.6`

### Partners row (.hero__partners)
- `display: flex`, `align-items: center`, `gap: 2rem`, `margin-top: 2.5rem`
- 5 small logo items, all `color: #BBBBBB`, `opacity: 0.7`
- SVG icons at height `18px` each — person icon, card-arc icon, target/crosshair, em-dash text, small outlined circle

### THE PILL / STADIUM SHAPE (.hero__dark-reveal) — READ CAREFULLY

This is the most important shape. It is NOT a canvas, NOT a sphere, NOT 3D, NOT a dome/arch.
It is a **plain div with a large fixed-pixel border-radius** — a PILL / STADIUM / CAPSULE shape.
The top is mostly FLAT with large rounded corners — NOT a parabolic dome or elliptical arch.

**Correct CSS:**
```css
.hero__dark-reveal {
  position: absolute;
  bottom: 0;
  left: 2.5%;                               /* narrower than viewport — visible white gap */
  right: 2.5%;                              /* matches left gap — pill is ~95% viewport width */
  height: 46%;
  border-radius: 200px 200px 28px 28px;     /* ← PILL top + card bottom corners */
  background: #1A0500;
  z-index: 3;
  overflow: hidden;
  will-change: transform;                    /* GSAP controls transform — do NOT set here */
}
```

**CRITICAL: `border-radius: 200px 200px 28px 28px` is FIXED PIXEL values.**
- Do NOT use percentage-based `50% 50% 0 0 / 100% 100% 0 0` — that creates a DOME, not a pill.
- The result is a flat-topped rectangle with large rounded top corners (pill/stadium/capsule) and small rounded bottom corners (card).
- At 1440px width, each top corner curves 200px — leaving a flat center section.
- The pill is NARROWER than the viewport (2.5% gap on each side).
- During scroll, GSAP animates `left` and `right` to `0%` so the pill expands to fill the viewport.

**Inside the pill shape:**
- LEFT ~30%: smooth solid dark brown `#1A0500` — NO dots, NO texture
- RIGHT ~70%: the `.dark-info__canvas` halftone animation (position: absolute; right: 0; top: 0; width: 70%; height: 100%)
- The `.dark-info__content` (text, stats) lives here, initially hidden (opacity: 0), revealed during scroll

**Initial state (set by GSAP in animations.js):**
The pill is positioned with `gsap.set(darkReveal, { yPercent: 58 })` — showing about 19% of the
viewport height (the top peek). During scroll, yPercent animates to 0, left/right animate to 0%,
and height grows from 46% to 100% — filling the entire viewport as a rounded-corner card.

---

## VISUAL SPEC: PAGE 1 — DARK SECTION (#bank)

This is the dark section the user scrolls into. It is NOT a separate floating card —
it is a full-width section that slides up over the hero via GSAP translateY.

### Top shape
The top edge of this section has a large border-radius to create a stadium/pill shape:
```css
.section--dark.section--bank {
  border-radius: 120px 120px 0 0;   /* large pill/stadium on top only */
  position: relative;
  z-index: 4;
  overflow: hidden;
  padding: var(--space-2xl) var(--panel-padding-x);
  padding-left: calc(var(--sidebar-width) + var(--panel-padding-x));
}
```

The bottom has NO border-radius (it bleeds to the page bottom).
The white body background shows in the two arch-corners at the top.

### Background
`background: radial-gradient(ellipse at 30% 50%, #2a0808 0%, #1A0503 40%, #120003 100%)`
Plus a subtle warm glow overlay for the halftone canvas area (handled in halftone.js).

### Layout
Two-column flex:
- **Left column (~45% width):** all text content
- **Right column (~55%):** halftone canvas, absolutely positioned `right: 0; top: 0; width: 65%; height: 100%`

### Left column content (top to bottom)
1. `.dark-info__logo` "Scōtt" — white, `position: absolute; top: 2.5rem; left: [sidebar + padding]`
2. `.dark-info__body` — large paragraph, `font-size: clamp(1.5rem, 2.2vw, 1.85rem)`, `font-weight: 500`, `color: #FFF`, `line-height: 1.4`, `max-width: 480px`
   Text: "Scōtt is the most widely integrated digital-to-fiat currency today. Buy, sell, and use Scōtt tokens at our exchange and service providers."
3. `.dark-info__rule` — `<hr>` at `width: 40%`, `border-top: 1px solid rgba(255,255,255,0.15)`, `margin: 2.5rem 0`
4. `.dark-info__stats` — two `.stat-inline` blocks side-by-side, `gap: 4rem`
   - `.stat-inline__title`: `font-size: 15px`, `font-weight: 600`, `color: #FFF`
   - `.stat-inline__desc`: `font-size: 11px`, `color: rgba(255,255,255,0.5)`, `line-height: 1.4`

### Play button (.dark-info__play-btn)
- `position: absolute; left: 62%; top: 50%; transform: translateY(-50%)`
- `width: 52px; height: 52px; border-radius: 50%; background: white`
- Dark filled right-pointing triangle inside
- Appears ABOVE the halftone canvas in z-index

### Halftone canvas (.dark-info__canvas)
- Rendered by `js/halftone.js` — 2D Canvas API, NOT Three.js
- Dots flow diagonally; warm copper glow at upper-right (~88% X, 10% Y)
- Fades from dark/invisible on the left edge to copper/metallic brown on the right
- Color palette: dark brown → bronze → copper → warm gold (NOT orange)
- `position: absolute; right: 0; top: 0; width: 70%; height: 100%`

### Side labels
- `.dark-info__section-label` "01 About" — `position: absolute; bottom: 2rem; left: [sidebar]`, rotated 90° CCW, `font-size: 10px`, `color: rgba(255,255,255,0.3)`
- `.dark-info__scroll-indicator` down-arrow — `position: absolute; bottom: 1.5rem; right: 2.5rem`, `color: rgba(255,255,255,0.4)`

---

## SCROLL TRANSITION (animations.js → initHeroTransition)

The dark section (#bank) rises from the bottom of the viewport and covers the hero.

The GSAP timeline is pinned to `#hero`, runs over `220%` of scroll:
```
Phase 1 (0–55% of timeline):
  darkReveal: yPercent 58→0, left 2.5%→0%, right 2.5%→0%, height 46%→100%
  Simultaneously: hero white panel scale(1)→scale(0.96), opacity(1)→opacity(0.88)
  The pill rises, expands to fill edges, and grows to full viewport height

Phase 2 (45–65%):
  dark-info content fades in (logo, body text, stats, play button)
  Each element: opacity(0)→opacity(1), staggered

Phase 3 (70–100%):
  Hold — reading time for Page 1 content
```

The `.section--bank` is NOT part of this animation — it is a static section below.
The `.hero__dark-reveal` IS the visual proxy for Page 1 during the scroll transition.
When the reveal is fully up, it looks identical to the dark section.

**Critical:** The pill/stadium shape (`border-radius: 200px 200px 28px 28px`) must be on `.hero__dark-reveal`, and `120px 120px 0 0` on `.section--bank`.

---

## THE HALFTONE CANVAS (halftone.js)

- Used in TWO places: inside `.hero__dark-reveal` and inside `#bank` section
- Both use the same `createHalftone(canvasElement)` function
- It's a 2D Canvas API animation — animated dots arranged in curved rows
- Do NOT replace with Three.js, WebGL, or any 3D renderer
- The `.dark-info__canvas` canvas element appears in the HTML in both places

Key visual properties the canvas must produce:
- Dots increase in size from upper-left (tiny) to lower-right (large)
- Color fades from invisible on the left → copper/metallic brown on the right (NOT orange)
- A warm copper glow (like light hitting metal at `x: 88%, y: 10%`) using `createRadialGradient` overlay
- Dots have a subtle wave/ripple animation driven by `time` variable (~30fps via frame skip)
- Color palette: dark brown (rgb 35,10,3) → bronze (rgb 134,47,16) → copper (rgb 184,85,30) → warm gold (rgb 210,127,52)
- Left 15% of canvas is masked (no dots) — dots fade in from 15% to 33% of canvas width

---

## WHAT CLAUDE CODE MUST NEVER DO

- Never put a Three.js sphere or WebGL canvas in the hero or Page 1 sections
  (Three.js is only used in the nav overlay sphere, lazy-loaded in sphere.js)
- Never use percentage-based border-radius like `50% 50% 0 0 / 100% 100% 0 0` on the dark reveal
  — that creates a DOME/ARCH shape. The shape is a PILL/STADIUM with `border-radius: 200px 200px 28px 28px`
- Never add a dark body background — the body is WHITE (#FFFFFF). The brown frame in the reference GIF is from Behance presentation, NOT the website
- Never make the halftone dots orange — they must be copper/metallic/brown
- Never let hero text (heading, info-row, partners) overlap the dark pill shape
- Never give the dark section a uniform straight top edge — it must have rounded top corners (pill/stadium)
- Never change token values in tokens.css without being explicitly asked
- Never use `border-radius: 50%` — that makes a circle. Use fixed pixel values for pill/stadium shapes
- Never render the halftone as a static image — it must animate

---

## COMMON FAILURE PATTERNS

| Symptom | Root cause | Fix |
|---|---|---|
| Shape looks like a dome/arch | Percentage-based border-radius (`50% / 100%`) | Use `border-radius: 200px 200px 28px 28px` (fixed px = pill/stadium) |
| Dark section has flat top | Missing `border-radius: 120px 120px 0 0` on `.section--bank` | Add it to layout.css |
| Dark brown frame around site | body background not white | Set `body { background: #FFFFFF }` — brown frame is Behance presentation |
| Halftone dots look orange | Color palette too saturated/warm | Use copper/metallic: max highlight rgb(210,127,52), not orange rgb(240,152,53) |
| Pill fills edge to edge | left/right not set on `.hero__dark-reveal` | Use `left: 2.5%; right: 2.5%` — pill is 95% width, expands via GSAP |
| Hero text is centred | `.hero__content` missing `margin-left: 44%` | Restore margin-left |
| "flexible currency." is grey | `strong` not getting `color: #1A0503` | Check `.hero__heading strong` in components.css |
| Page 1 text is tiny | `.dark-info__body` font-size overridden | Restore `clamp(1.5rem, 2.2vw, 1.85rem)` |
| Shape appears but no dots | Canvas not initialised for hero reveal | Call `createHalftone` on `.dark-info__canvas` inside hero |
| Scroll transition jumps | ScrollTrigger `scrub` value wrong | Use `scrub: 1` (smooth), not `scrub: true` |
| Play button hidden behind canvas | z-index | `.dark-info__play-btn { z-index: 2 }`, canvas z-index: 0 |
| Partners row hidden by dark shape | Content too low, dark peek too high | Use `margin-top: 8vh` on `.hero__content`, not `justify-content: center` |

---

## NPM SCRIPTS
```json
"dev":   "vite",
"build": "vite build",
"ref":   "node scripts/ref.js",
"check": "node scripts/check.js && node scripts/diff.js"
```

Install diff deps once: `npm install pixelmatch pngjs playwright`

Workflow every time:
```
npm run dev          # start dev server
npm run ref          # capture reference screenshots (once, or if refs are stale)
[make your change]
npm run check        # screenshot build + diff vs refs
# open refs/diff-hero.png and refs/diff-page1.png
# red pixels = still wrong — go back and fix
```

---

## VIEWPORT

All reference screenshots are at **1440 × 900**. Always set Playwright viewport to `{ width: 1440, height: 900 }`. The live build at `localhost:3000` should be checked at the same size.
