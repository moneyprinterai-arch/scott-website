import {
  initHeroTransition,
  initDarkInfoReveal,
  initBankSection,
  initCardsAnimation,
  initStatsReveal,
  initTestimonial,
} from './animations.js';
import { initNavigation } from './navigation.js';
import { initStatsRing } from './stats-ring.js';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Expose for Playwright screenshot script
window.__gsap = gsap;
window.__ScrollTrigger = ScrollTrigger;

// Track sphere instances for visibility control
const spheres = {};

// Lazy-load sphere module (pulls in Three.js ~500KB)
let createCopperSphere = null;
function loadSphereModule() {
  if (createCopperSphere) return Promise.resolve(createCopperSphere);
  return import('./sphere.js').then(mod => {
    createCopperSphere = mod.createCopperSphere;
    return createCopperSphere;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // ── GSAP Scroll Animations ──
  initHeroTransition();
  initDarkInfoReveal();
  initBankSection();
  initCardsAnimation();
  initStatsReveal();
  initTestimonial();

  // ── Stats Ring ──
  initStatsRing();

  // ── Navigation Overlay (with lazy sphere init) ──
  initNavigation({
    onOpen() {
      loadSphereModule().then(create => {
        if (!spheres.nav) {
          const navCanvas = document.getElementById('nav-sphere');
          if (navCanvas) {
            spheres.nav = create(navCanvas, {
              particleCount: 5000,
              radius: 3.0,
              rotationSpeed: 0.0005,
              cameraZ: 5,
              lightDirection: [0.5, 0.4, 0.7],
            });
          }
        } else {
          spheres.nav.resume();
        }
      });
    },
    onClose() {
      if (spheres.nav) spheres.nav.pause();
    },
  });

  // ── Sidebar Label + Theme Update ──
  const sidebar = document.querySelector('.sidebar');
  const sidebarLabel = document.querySelector('[data-sidebar-label]');
  if (sidebarLabel && sidebar) {
    const sections = {
      hero: { label: '01. Introduction', dark: false },
      'dark-info': { label: '01. Introduction', dark: true },
      bank: { label: '02. Features', dark: true },
      cards: { label: '02. Features', dark: true },
      statistics: { label: '03. Numbers', dark: false },
      testimonial: { label: '04. Payments', dark: true },
    };

    Object.entries(sections).forEach(([id, { label, dark }]) => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        onEnter: () => {
          sidebarLabel.textContent = label;
          sidebar.classList.toggle('sidebar--dark', dark);
        },
        onEnterBack: () => {
          sidebarLabel.textContent = label;
          sidebar.classList.toggle('sidebar--dark', dark);
        },
      });
    });
  }

  ScrollTrigger.refresh();

  // ── Defer 3D spheres — load after first paint ──
  requestAnimationFrame(() => {
    loadSphereModule().then(create => {
      const heroCanvas = document.getElementById('hero-sphere');
      if (heroCanvas) {
        spheres.hero = create(heroCanvas, {
          particleCount: 6000,
          radius: 2.8,
          rotationSpeed: 0.0006,
          cameraZ: 5,
          lightDirection: [0.6, 0.5, 0.7], // upper-right
          useAdditiveBlending: false, // normal blending on white bg
        });
      }

      const darkCanvas = document.getElementById('dark-mesh-canvas');
      if (darkCanvas) {
        spheres.dark = create(darkCanvas, {
          particleCount: 6000,
          radius: 3.2,
          rotationSpeed: 0.0004,
          noiseAmplitude: 0.1,
          cameraZ: 4.5,
          lightDirection: [-0.6, 0.4, 0.7], // upper-LEFT (facing content)
        });
      }

      // Pause spheres when off-screen
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const key = entry.target.dataset.sphereKey;
            if (!key || !spheres[key]) return;
            if (entry.isIntersecting) {
              spheres[key].resume();
            } else {
              spheres[key].pause();
            }
          });
        }, { threshold: 0.05 });

        if (heroCanvas) {
          heroCanvas.dataset.sphereKey = 'hero';
          observer.observe(heroCanvas);
        }
        if (darkCanvas) {
          darkCanvas.dataset.sphereKey = 'dark';
          observer.observe(darkCanvas);
        }
      }
    });
  });
});
