import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// registerPlugin is called once in main.js

export function initStatsRing() {
  const ring = document.querySelector('.ring-progress');
  const counter = document.querySelector('[data-counter]');

  if (!ring || !counter) return;

  const radius = 160;
  const circumference = 2 * Math.PI * radius; // ~1005.31

  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference;

  const obj = { val: 0 };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#statistics',
      start: 'top 55%',
      toggleActions: 'play none none none',
    },
  });

  // Animate ring fill (95% filled)
  tl.to(ring, {
    strokeDashoffset: circumference * 0.05,
    duration: 2,
    ease: 'power2.out',
  });

  // Animate counter 0 -> 12.8
  tl.to(obj, {
    val: 12.8,
    duration: 2,
    ease: 'power1.out',
    onUpdate() {
      const v = obj.val;
      if (v < 0.1) {
        counter.textContent = '0';
      } else {
        counter.textContent = v.toFixed(1) + 'k';
      }
    },
  }, 0); // start at same time as ring
}
