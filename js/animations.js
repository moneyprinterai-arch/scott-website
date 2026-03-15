import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// registerPlugin is called once in main.js — no need to duplicate here

/**
 * Dark panel (Page 1 / About) peeks from the bottom of the hero,
 * then rises on scroll to fill the viewport.
 * The panel is a CSS border-radius card, NOT a 3D sphere.
 */
export function initHeroTransition() {
  const hero = document.querySelector('#hero');
  const darkReveal = document.querySelector('.hero__dark-reveal');
  const heroPanel = document.querySelector('.hero-panel');

  if (!hero || !darkReveal) return;

  // ── Load entrance: pill peeks from bottom on page load ──
  // The shape is 46% tall. At rest it shows ~16% of viewport (the pill top peek).
  // yPercent: 58 hides 58% of the element below the viewport bottom.
  gsap.set(darkReveal, { yPercent: 58 });

  // Fade in dark-info content — starts hidden
  gsap.set('.dark-info__content', { opacity: 0, y: 30 });
  gsap.set('.dark-info__stats .stat-inline', { opacity: 0, y: 20 });
  gsap.set('.dark-info__play-btn', { opacity: 0, scale: 0.6 });
  gsap.set('.dark-info__logo', { opacity: 0 });
  gsap.set('.dark-info__section-label', { opacity: 0 });
  gsap.set('.dark-info__scroll-indicator', { opacity: 0 });

  // ── ScrollTrigger timeline ──
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=220%',
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    },
  });

  // Phase 1 (0→0.55): pill rises and expands to fill viewport
  tl.to(darkReveal, {
    yPercent: 0,
    left: '0%',
    right: '0%',
    height: '100%',
    duration: 0.55,
    ease: 'none',
  }, 0);

  tl.to(heroPanel, {
    scale: 0.96,
    opacity: 0.88,
    duration: 0.55,
    ease: 'none',
  }, 0);

  // Phase 2 (0.45→0.70): dark content fades in as dome reaches top
  tl.to('.dark-info__logo', {
    opacity: 1,
    duration: 0.12,
    ease: 'power2.out',
  }, 0.45);

  tl.to('.dark-info__content', {
    opacity: 1,
    y: 0,
    duration: 0.15,
    ease: 'power2.out',
  }, 0.48);

  tl.to('.dark-info__stats .stat-inline', {
    opacity: 1,
    y: 0,
    stagger: 0.06,
    duration: 0.12,
    ease: 'power2.out',
  }, 0.55);

  tl.to('.dark-info__play-btn', {
    opacity: 1,
    scale: 1,
    duration: 0.12,
    ease: 'back.out(1.5)',
  }, 0.58);

  tl.to('.dark-info__section-label', {
    opacity: 1,
    duration: 0.1,
  }, 0.62);

  tl.to('.dark-info__scroll-indicator', {
    opacity: 1,
    duration: 0.1,
  }, 0.62);

  // Phase 3 (0.70→1.0): hold — reading time, no movement
  tl.to({}, { duration: 0.30 }, 0.70);
}

/**
 * Dark info reveal is now handled within initHeroTransition.
 * This function is kept as a no-op for backwards compatibility.
 */
export function initDarkInfoReveal() {
  // Dark info content animations are now part of the hero transition timeline
}

/**
 * "Be Your Own Bank" section with phone sliding in from left,
 * heading from right.
 */
export function initBankSection() {
  const section = document.querySelector('#bank');
  if (!section) return;

  // Pin the section briefly
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=80%',
    pin: true,
  });

  // Phone slides in from left
  gsap.from('.bank__phone-area', {
    scrollTrigger: {
      trigger: section,
      start: 'top 65%',
      toggleActions: 'play none none none',
    },
    x: -120,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
  });

  // Heading slides in from right
  gsap.from('.bank__heading', {
    scrollTrigger: {
      trigger: section,
      start: 'top 65%',
      toggleActions: 'play none none none',
    },
    x: 80,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    delay: 0.15,
  });

  // Tabs fade in
  gsap.from('.bank__tabs', {
    scrollTrigger: {
      trigger: '.bank__tabs',
      start: 'top 90%',
    },
    y: 20,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    delay: 0.3,
  });

  // Body text
  gsap.from('.bank__body', {
    scrollTrigger: {
      trigger: '.bank__body',
      start: 'top 90%',
    },
    y: 20,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    delay: 0.4,
  });
}

/**
 * Credit cards fly in with 3D rotation, then gently float.
 */
export function initCardsAnimation() {
  const section = document.querySelector('#cards');
  if (!section) return;

  // Heading reveal
  gsap.from('.cards__heading', {
    scrollTrigger: {
      trigger: section,
      start: 'top 70%',
    },
    y: 60,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
  });

  // Feature text
  gsap.from('.cards__feature', {
    scrollTrigger: {
      trigger: '.cards__feature',
      start: 'top 90%',
    },
    y: 20,
    opacity: 0,
    duration: 0.5,
    delay: 0.2,
  });

  gsap.from('.cards__body', {
    scrollTrigger: {
      trigger: '.cards__body',
      start: 'top 90%',
    },
    y: 20,
    opacity: 0,
    duration: 0.5,
    delay: 0.3,
  });

  // Cards stagger entrance, then float
  const cards = gsap.utils.toArray('.credit-card');
  cards.forEach((card, i) => {
    const entrance = gsap.from(card, {
      scrollTrigger: {
        trigger: section,
        start: 'top 60%',
      },
      y: 150 + i * 40,
      x: 100,
      rotateX: -20,
      rotateY: -40,
      opacity: 0,
      duration: 1.2,
      delay: i * 0.15,
      ease: 'power3.out',
      onComplete() {
        // Start floating only after entrance finishes
        gsap.to(card, {
          y: `+=${8 + i * 3}`,
          duration: 2.5 + i * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      },
    });
  });
}

/**
 * Stats section: white panel text reveals.
 * Ring animation handled separately in stats-ring.js.
 */
export function initStatsReveal() {
  const section = document.querySelector('#statistics');
  if (!section) return;

  gsap.from('.stats__heading', {
    scrollTrigger: {
      trigger: section,
      start: 'top 60%',
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
  });

  gsap.from('.stats__body', {
    scrollTrigger: {
      trigger: '.stats__body',
      start: 'top 85%',
    },
    y: 30,
    opacity: 0,
    duration: 0.6,
    delay: 0.2,
  });

  gsap.from('.stats__partners', {
    scrollTrigger: {
      trigger: '.stats__partners',
      start: 'top 90%',
    },
    y: 20,
    opacity: 0,
    duration: 0.5,
    delay: 0.3,
  });
}

/**
 * Testimonial section content fades in.
 */
export function initTestimonial() {
  const section = document.querySelector('#testimonial');
  if (!section) return;

  gsap.from('.testimonial__quote', {
    scrollTrigger: {
      trigger: section,
      start: 'top 60%',
    },
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
  });

  gsap.from('.testimonial__attribution', {
    scrollTrigger: {
      trigger: '.testimonial__attribution',
      start: 'top 90%',
    },
    y: 20,
    opacity: 0,
    duration: 0.5,
    delay: 0.3,
  });

  gsap.from('.testimonial__card', {
    scrollTrigger: {
      trigger: '.testimonial__card',
      start: 'top 80%',
    },
    y: 60,
    opacity: 0,
    scale: 0.9,
    duration: 0.8,
    ease: 'power3.out',
    delay: 0.2,
  });
}
