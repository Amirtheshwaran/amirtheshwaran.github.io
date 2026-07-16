// portfolio/main.js — GSAP master timeline, ScrollTrigger wiring, DOM behavior.
// Pose map (scene.js): 0 scattered · 1 monolith · 2 splitCore · 3 grid · 4 helix · 5 screens · 6 beacon
// Section s (0..5) rests at pose s+1; entering section s scrubs pose s → s+1.

import { initScene } from './scene.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;

const SECTIONS = ['#hero', '#about', '#stack', '#experience', '#projects', '#contact'];

/* ── 3D world ── */
const canvas = document.getElementById('webgl');
let api = null;
try {
  api = initScene(canvas, { mobile: isMobile });
} catch (e) {
  api = null;
}
if (!api) document.body.classList.add('no-webgl');
window.__api = api;

/* ── Custom cursor ── */
const cursor = document.getElementById('cursor');
if (!reducedMotion && !('ontouchstart' in window)) {
  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function cursorLoop() {
    cx += (mx - cx) * 0.13;
    cy += (my - cy) * 0.13;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
    requestAnimationFrame(cursorLoop);
  })();
  document.querySelectorAll('a, button, .chip, .proj-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
  });
}

/* ── Nav hide/show + active link ── */
const nav = document.getElementById('nav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('nav-hidden', y > lastScroll && y > 120);
  lastScroll = y;
}, { passive: true });

const navLinks = document.querySelectorAll('.nav-links a[data-section]');
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === entry.target.id));
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('section[id]').forEach(s => io.observe(s));

/* ── Show-more projects + copy email (always active) ── */
const showMoreBtn = document.getElementById('show-more-btn');
const projectsList = document.getElementById('projects-list');
let listOpen = false;
showMoreBtn.addEventListener('click', () => {
  listOpen = !listOpen;
  projectsList.classList.toggle('open', listOpen);
  projectsList.setAttribute('aria-hidden', String(!listOpen));
  showMoreBtn.setAttribute('aria-expanded', String(listOpen));
  showMoreBtn.textContent = listOpen ? '− Hide projects' : '+ Show 11 more projects';
  ScrollTrigger.refresh();
});

document.getElementById('copy-email').addEventListener('click', () => {
  navigator.clipboard.writeText('amirthesh14@gmail.com').then(() => {
    const confirm = document.getElementById('copy-confirm');
    confirm.classList.add('visible');
    setTimeout(() => confirm.classList.remove('visible'), 2000);
  });
});

/* ── Reduced motion: static world, everything visible, done ── */
if (reducedMotion) {
  if (api) { api.blend(1, 1, 1); api.renderOnce(); window.addEventListener('resize', () => api.renderOnce()); }
  document.querySelectorAll('.stat-num').forEach(el => { el.textContent = el.dataset.target; });
  gsap.set('.hero-name-line', { clipPath: 'inset(0 0% 0 0)' });
  gsap.set('.hero-divider', { width: 480 });
  gsap.set('.hero-sub, .hero-ctas, .hero-footer', { opacity: 1 });
} else {

  if (api) api.start();

  /* ── Mouse parallax feeds the camera ── */
  if (api && !isMobile) {
    document.addEventListener('mousemove', e => {
      api.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    });
  }

  /* ── Hero on-load: scattered panels assemble into the monolith ── */
  const heroTl = gsap.timeline({ delay: 0.15 });
  if (api) {
    const asm = { t: 0 };
    if (window.scrollY < 60) {
      heroTl.to(asm, {
        t: 1, duration: 1.9, ease: 'power3.inOut',
        onUpdate: () => api.blend(0, 1, asm.t),
      }, 0);
    } else {
      api.blend(0, 1, 1);
    }
  }
  heroTl
    .fromTo('.hero-eyebrow', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.3)
    .to('.hero-name-line', { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'power3.inOut' }, 0.55)
    .to('.hero-divider', { width: 480, duration: 0.5, ease: 'power2.inOut' }, 1.0)
    .fromTo('.hero-sub', { y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.2)
    .fromTo('.hero-ctas', { y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.35)
    .to('.hero-footer', { opacity: 1, duration: 0.4 }, 1.5);

  /* ── Scrubbed pose transitions — the heart of the reference effect.
     Scroll down plays each morph, scroll up reverses it. ── */
  if (api) {
    for (let s = 1; s < SECTIONS.length; s++) {
      const st = { t: 0 };
      gsap.fromTo(st, { t: 0 }, {
        t: 1,
        ease: 'none',
        immediateRender: false,
        onUpdate: () => api.blend(s, s + 1, st.t),
        scrollTrigger: {
          trigger: SECTIONS[s],
          start: 'top bottom',
          end: 'top 15%',
          scrub: 0.6, // slight lag = fluid, weighty motion
        },
      });
    }

    /* Continuous spin tied to overall page progress — the object re-orients
       with every scroll tick, even while a pose is holding. */
    const spin = { v: 0 };
    gsap.to(spin, {
      v: 1,
      ease: 'none',
      onUpdate: () => api.setSpin(spin.v * Math.PI * 0.7),
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.8 },
    });
  }

  /* ── Content reveals, scrubbed so they reverse with scroll ── */
  ['#about .scene-content', '#stack .scene-content', '#experience .scene-content', '#contact .scene-content']
    .forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, y: 60 }, {
        opacity: 1, y: 0,
        ease: 'none',
        immediateRender: true,
        scrollTrigger: {
          trigger: el.closest('section'),
          start: 'top 70%',
          end: 'top 25%',
          scrub: 0.4,
        },
      });
    });

  /* Projects flow normally — per-card scrubbed reveals */
  gsap.utils.toArray('#projects .reveal').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 65%', scrub: 0.4 },
    });
  });

  /* Chips stagger in with scroll inside the stack card */
  gsap.fromTo('#stack .chip', { opacity: 0, y: 10 }, {
    opacity: 1, y: 0,
    stagger: 0.02,
    ease: 'none',
    scrollTrigger: { trigger: '#stack', start: 'top 55%', end: 'top 10%', scrub: 0.4 },
  });

  /* ── Stat counters — count up once when About settles ── */
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: '#about',
      start: 'top 45%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: target, duration: 1, ease: 'power1.out',
          onUpdate: () => { el.textContent = Math.round(obj.val); },
        });
      },
    });
  });
}
