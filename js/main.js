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
import { createHalftone } from './halftone.js';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Expose for Playwright screenshot script
window.__gsap = gsap;
window.__ScrollTrigger = ScrollTrigger;

// Track instances for visibility control
const spheres = {};
let halftoneInstance = null;

// Lazy-load sphere module (only needed for nav overlay)
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
              rows: 80,
              colsBase: 160,
              radius: 1,
              rotationSpeed: 0.0008,
              waveAmplitude: 0.03,
              cameraZ: 2.6,
              lightDirection: [-1.0, 0.8, 0.5],
              basePointSize: 3.0,
              useAdditiveBlending: true,
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
    // Hero scroll progress controls dark/light switch during transition
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      ScrollTrigger.create({
        trigger: heroEl,
        start: 'top top',
        end: '+=250%',
        onUpdate: (self) => {
          const isDark = self.progress > 0.2;
          sidebar.classList.toggle('sidebar--dark', isDark);
          sidebarLabel.textContent = '01. Introduction';
        },
        onLeaveBack: () => {
          sidebar.classList.remove('sidebar--dark');
          sidebarLabel.textContent = '01. Introduction';
        },
      });
    }

    // Remaining sections (after hero/dark-info transition)
    const sections = {
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

  // ── 2D Halftone texture for dark info panel (replaces 3D sphere) ──
  const darkCanvas = document.getElementById('dark-mesh-canvas');
  if (darkCanvas) {
    halftoneInstance = createHalftone(darkCanvas);

    // Pause when off-screen
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!halftoneInstance) return;
          if (entry.isIntersecting) {
            halftoneInstance.resume();
          } else {
            halftoneInstance.pause();
          }
        });
      }, { threshold: 0.05 });
      observer.observe(darkCanvas);
    }
  }
});
