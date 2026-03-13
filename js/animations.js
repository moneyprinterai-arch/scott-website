import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// registerPlugin is called once in main.js — no need to duplicate here

/**
 * Hero panel slides up, revealing the dark info section beneath.
 * This is the signature animation of the site.
 */
export function initHeroTransition() {
  const hero = document.querySelector('#hero');
  const heroPanel = document.querySelector('.hero-panel');
  if (!hero || !heroPanel) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=150%',
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    },
  });

  // White panel slides up and out
  tl.to(heroPanel, {
    yPercent: -100,
    duration: 1,
    ease: 'none',
  })
  // Hero content fades as panel moves
  .to('.hero__content', {
    opacity: 0,
    y: -50,
    duration: 0.4,
  }, 0)
  // Panel header fades
  .to('.hero-panel .panel-header', {
    opacity: 0,
    duration: 0.3,
  }, 0)
  // Sphere scales up as it's revealed
  .to('.hero__sphere-wrap', {
    scale: 1.8,
    y: -150,
    opacity: 0.3,
    duration: 1,
  }, 0);
}

/**
 * Dark info section content fades in as user scrolls past the hero.
 */
export function initDarkInfoReveal() {
  const section = document.querySelector('#dark-info');
  if (!section) return;

  gsap.from('.dark-info__body', {
    scrollTrigger: {
      trigger: section,
      start: 'top 70%',
      toggleActions: 'play none none none',
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
  });

  gsap.from('.dark-info__stats .stat', {
    scrollTrigger: {
      trigger: '.dark-info__stats',
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
    y: 40,
    opacity: 0,
    stagger: 0.2,
    duration: 0.6,
    ease: 'power3.out',
  });

  gsap.from('.dark-info__panel .play-btn', {
    scrollTrigger: {
      trigger: '.play-btn',
      start: 'top 90%',
    },
    scale: 0,
    opacity: 0,
    duration: 0.5,
    ease: 'back.out(2)',
  });
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
