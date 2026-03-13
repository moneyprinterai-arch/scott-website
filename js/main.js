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
import { createCopperSphere } from './sphere.js';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Expose for Playwright screenshot script
window.__gsap = gsap;
window.__ScrollTrigger = ScrollTrigger;

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

  // ── Navigation Overlay ──
  initNavigation();

  // ── 3D Copper Spheres ──
  // Hero sphere (partially visible at bottom of panel)
  const heroCanvas = document.getElementById('hero-sphere');
  if (heroCanvas) {
    createCopperSphere(heroCanvas, {
      particleCount: 8000,
      radius: 2.8,
      pointSize: 2.0,
      rotationSpeed: 0.0006,
      cameraZ: 5,
    });
  }

  // Dark info background mesh
  const darkCanvas = document.getElementById('dark-mesh-canvas');
  if (darkCanvas) {
    createCopperSphere(darkCanvas, {
      particleCount: 12000,
      radius: 3.5,
      pointSize: 1.8,
      rotationSpeed: 0.0004,
      noiseAmplitude: 0.15,
      cameraZ: 4.5,
    });
  }

  // Nav overlay sphere
  const navCanvas = document.getElementById('nav-sphere');
  if (navCanvas) {
    createCopperSphere(navCanvas, {
      particleCount: 10000,
      radius: 3.0,
      pointSize: 2.2,
      rotationSpeed: 0.0005,
      cameraZ: 5,
    });
  }

  // ── Sidebar Label Update ──
  const sidebarLabel = document.querySelector('[data-sidebar-label]');
  if (sidebarLabel) {
    const sections = {
      hero: '01. Introduction',
      'dark-info': '01. Introduction',
      bank: '02. Features',
      cards: '02. Features',
      statistics: '03. Numbers',
      testimonial: '04. Payments',
    };

    Object.entries(sections).forEach(([id, label]) => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        onEnter: () => { sidebarLabel.textContent = label; },
        onEnterBack: () => { sidebarLabel.textContent = label; },
      });
    });
  }

  // ── Refresh ScrollTrigger after all content loaded ──
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
});
