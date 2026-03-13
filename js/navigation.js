import gsap from 'gsap';

let isOpen = false;

export function initNavigation() {
  const trigger = document.querySelector('[data-menu-trigger]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const overlay = document.querySelector('[data-nav-overlay]');

  if (!trigger || !closeBtn || !overlay) return;

  function open() {
    if (isOpen) return;
    isOpen = true;

    // Show overlay
    overlay.style.display = 'flex';

    gsap.timeline()
      .fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo('.nav-overlay__panel', {
        clipPath: 'inset(2% 2% 2% 100%)',
      }, {
        clipPath: 'inset(2% 2% 2% 2%)',
        duration: 0.7,
        ease: 'power3.inOut',
      }, 0)
      .fromTo('.nav-overlay__sphere canvas', {
        scale: 0.5,
        opacity: 0,
      }, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
      }, 0.2)
      .fromTo('.nav-item', {
        y: 50,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.07,
        duration: 0.5,
        ease: 'power3.out',
      }, 0.3)
      .fromTo('.nav-overlay__footer', {
        opacity: 0,
        y: 20,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.4,
      }, 0.5)
      .fromTo('.nav-overlay__close', {
        scale: 0,
        opacity: 0,
      }, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: 'back.out(2)',
      }, 0.4);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    gsap.timeline({
      onComplete() {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      },
    })
      .to('.nav-item', {
        y: -30,
        opacity: 0,
        stagger: 0.04,
        duration: 0.25,
        ease: 'power2.in',
      })
      .to('.nav-overlay__panel', {
        clipPath: 'inset(2% 2% 2% 100%)',
        duration: 0.5,
        ease: 'power3.inOut',
      }, 0.1)
      .to(overlay, {
        opacity: 0,
        duration: 0.3,
      }, 0.3);
  }

  trigger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  // Close on nav item click
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      close();
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });

  // Nav item hover effects
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      gsap.to(item, {
        x: 10,
        color: '#B87333',
        duration: 0.3,
        ease: 'power2.out',
      });
    });
    item.addEventListener('mouseleave', () => {
      const isActive = item.classList.contains('nav-item--active');
      gsap.to(item, {
        x: 0,
        color: isActive ? '#A0522D' : '#1A1A1A',
        duration: 0.3,
        ease: 'power2.out',
      });
    });
  });
}
