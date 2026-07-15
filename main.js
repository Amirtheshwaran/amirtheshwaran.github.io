// portfolio/main.js
gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────
   UTILS
   ───────────────────────────────────────── */

// Split text node into individual .letter spans
function splitLetters(el) {
  const wrap = el.querySelector('.word-wrap') || el;
  const text = wrap.textContent.trim();
  wrap.innerHTML = text.split('').map(ch =>
    `<span class="letter" aria-hidden="true">${ch}</span>`
  ).join('');
  el.setAttribute('aria-label', text);
  return wrap.querySelectorAll('.letter');
}

// Linear interpolation
function lerp(a, b, t) { return a + (b - a) * t; }

/* ─────────────────────────────────────────
   CUSTOM CURSOR
   ───────────────────────────────────────── */
const cursor = document.getElementById('cursor');
let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

(function loop() {
  curX = lerp(curX, mouseX, 0.13);
  curY = lerp(curY, mouseY, 0.13);
  cursor.style.left = curX + 'px';
  cursor.style.top  = curY + 'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a, button, .chip, .proj-card').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
});

/* ─────────────────────────────────────────
   NAV
   ───────────────────────────────────────── */
const nav = document.getElementById('nav');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('nav-hidden', y > lastScrollY && y > 80);
  lastScrollY = y;
}, { passive: true });

const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('.nav-links a[data-section]').forEach(link => {
        link.classList.toggle('active', link.dataset.section === e.target.id);
      });
    }
  });
}, { threshold: 0.35 });
document.querySelectorAll('section[id]').forEach(s => sectionObs.observe(s));

/* ─────────────────────────────────────────
   HERO — letter-by-letter with spring
   ───────────────────────────────────────── */
const line1Letters = splitLetters(document.getElementById('hero-line-1'));

// Set initial states
gsap.set('.hero-eyebrow', { opacity: 0, y: 20 });
gsap.set(line1Letters,    { y: '110%', opacity: 0 });
gsap.set('#hero-divider', { scaleX: 0, transformOrigin: 'left center' });
gsap.set('#hero-sub',     { opacity: 0, y: 24 });
gsap.set('#hero-ctas',    { opacity: 0, y: 24 });
gsap.set('#hero-footer',  { opacity: 0, y: 10 });

const heroTl = gsap.timeline({ delay: 0.1 });

heroTl
  .to('.hero-eyebrow', {
    opacity: 1, y: 0,
    duration: 0.6, ease: 'back.out(2.5)'
  })
  .to(line1Letters, {
    y: '0%', opacity: 1,
    duration: 0.65,
    stagger: { each: 0.028, ease: 'power2.inOut' },
    ease: 'back.out(2.8)'
  }, 0.2)
  .to('#hero-divider', {
    scaleX: 1,
    duration: 0.7, ease: 'expo.inOut'
  }, 0.62)
  .to('#hero-sub', {
    opacity: 1, y: 0,
    duration: 0.55, ease: 'back.out(2)'
  }, 0.75)
  .to('#hero-ctas', {
    opacity: 1, y: 0,
    duration: 0.55, ease: 'back.out(2)'
  }, 0.9)
  .to('#hero-footer', {
    opacity: 1, y: 0,
    duration: 0.45, ease: 'power3.out'
  }, 1.05);

/* ─────────────────────────────────────────
   SCROLL ANIMATIONS
   ───────────────────────────────────────── */

/* ── Eyebrows ── */
document.querySelectorAll('.eyebrow:not(.hero-eyebrow)').forEach(el => {
  gsap.set(el, { opacity: 0, x: -16 });
  gsap.to(el, {
    opacity: 1, x: 0,
    duration: 0.5, ease: 'back.out(2)',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  });
});

/* ── Section headings — scale + translate spring ── */
document.querySelectorAll('.section-heading').forEach(el => {
  gsap.set(el, { opacity: 0, y: 40, scale: 0.94 });
  gsap.to(el, {
    opacity: 1, y: 0, scale: 1,
    duration: 0.75, ease: 'back.out(1.8)',
    delay: 0.05,
    scrollTrigger: { trigger: el, start: 'top 87%', once: true }
  });
});

/* ── About: glass card pops in ── */
gsap.set('.about-right', { opacity: 0, y: 50, scale: 0.96 });
gsap.to('.about-right', {
  opacity: 1, y: 0, scale: 1,
  duration: 0.8, ease: 'back.out(1.6)',
  scrollTrigger: { trigger: '.about-right', start: 'top 84%', once: true }
});

/* ── About: decorative number slides in ── */
gsap.set('.about-bg-num', { opacity: 0, x: -40 });
gsap.to('.about-bg-num', {
  opacity: 1, x: 0,
  duration: 0.9, ease: 'expo.out',
  scrollTrigger: { trigger: '.about-bg-num', start: 'top 88%', once: true }
});

/* ── Stat counters with spring ── */
document.querySelectorAll('.stat-item').forEach((item, i) => {
  const numEl = item.querySelector('.stat-num');
  const target = parseInt(numEl.dataset.target, 10);
  const obj = { val: 0 };

  gsap.set(item, { opacity: 0, x: -20 });
  ScrollTrigger.create({
    trigger: item,
    start: 'top 86%',
    once: true,
    onEnter: () => {
      gsap.to(item, { opacity: 1, x: 0, duration: 0.5, ease: 'back.out(2)', delay: i * 0.12 });
      gsap.to(obj, {
        val: target,
        duration: 1.2,
        delay: i * 0.12 + 0.1,
        ease: 'expo.out',
        onUpdate: () => { numEl.textContent = Math.round(obj.val); }
      });
    }
  });
});

/* ── Stack section heading ── */
gsap.set('.projects-sub', { opacity: 0, y: 10 });
gsap.to('.projects-sub', {
  opacity: 1, y: 0,
  duration: 0.4, ease: 'power3.out',
  scrollTrigger: { trigger: '.projects-sub', start: 'top 90%', once: true }
});

/* ── Skill chips — stagger with scale pop ── */
document.querySelectorAll('.stack-row').forEach((row, ri) => {
  const chips = row.querySelectorAll('.chip');
  const cat   = row.querySelector('.stack-category');

  gsap.set(cat, { opacity: 0, x: -12 });
  gsap.to(cat, {
    opacity: 1, x: 0,
    duration: 0.4, ease: 'power3.out',
    scrollTrigger: { trigger: row, start: 'top 89%', once: true }
  });

  gsap.set(chips, { opacity: 0, scale: 0.7, y: 12 });
  gsap.to(chips, {
    opacity: 1, scale: 1, y: 0,
    duration: 0.4,
    stagger: { each: 0.055, ease: 'power1.inOut' },
    ease: 'back.out(2.2)',
    scrollTrigger: { trigger: row, start: 'top 89%', once: true }
  });
});

/* ── Timeline line draw ── */
gsap.to('#timeline-line', {
  scaleY: 1,
  duration: 1.4, ease: 'expo.inOut',
  scrollTrigger: { trigger: '#timeline-line', start: 'top 78%', once: true }
});

/* ── Timeline items ── */
document.querySelectorAll('.timeline-item').forEach((item, i) => {
  gsap.set(item, { opacity: 0, x: -30, scale: 0.97 });
  gsap.to(item, {
    opacity: 1, x: 0, scale: 1,
    duration: 0.65,
    delay: i * 0.2,
    ease: 'back.out(1.7)',
    scrollTrigger: { trigger: item, start: 'top 85%', once: true }
  });
});

/* ── Project cards — 3D flip reveal ── */
const projCards = document.querySelectorAll('.proj-card');
gsap.set(projCards, { opacity: 0, y: 50, rotateX: 12, transformPerspective: 800 });
gsap.to(projCards, {
  opacity: 1, y: 0, rotateX: 0,
  duration: 0.7,
  stagger: { each: 0.12, ease: 'power2.inOut' },
  ease: 'back.out(1.5)',
  scrollTrigger: { trigger: '.projects-grid', start: 'top 80%', once: true }
});

/* ── 3D card tilt on mouse move ── */
projCards.forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect   = card.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2);  // -1 → 1
    const dy     = (e.clientY - cy) / (rect.height / 2);  // -1 → 1
    const rotY   =  dx * 6;
    const rotX   = -dy * 4;

    gsap.to(card, {
      rotateX: rotX, rotateY: rotY,
      translateY: -6,
      transformPerspective: 900,
      duration: 0.35, ease: 'power2.out'
    });
  });

  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      rotateX: 0, rotateY: 0, translateY: 0,
      duration: 0.55, ease: 'elastic.out(1, 0.5)'
    });
  });
});

/* ── Contact section ── */
gsap.set('.contact-heading', { opacity: 0, y: 50, scale: 0.93 });
gsap.to('.contact-heading', {
  opacity: 1, y: 0, scale: 1,
  duration: 0.85, ease: 'back.out(1.6)',
  scrollTrigger: { trigger: '.contact-heading', start: 'top 85%', once: true }
});

gsap.set('.contact-sub', { opacity: 0, y: 20 });
gsap.to('.contact-sub', {
  opacity: 1, y: 0,
  duration: 0.5, ease: 'power3.out', delay: 0.12,
  scrollTrigger: { trigger: '.contact-sub', start: 'top 88%', once: true }
});

gsap.set('.contact-email-row', { opacity: 0, y: 20 });
gsap.to('.contact-email-row', {
  opacity: 1, y: 0,
  duration: 0.5, ease: 'back.out(1.8)', delay: 0.22,
  scrollTrigger: { trigger: '.contact-email-row', start: 'top 90%', once: true }
});

const contactLinks = document.querySelectorAll('.contact-link');
gsap.set(contactLinks, { opacity: 0, y: 20, scale: 0.95 });
gsap.to(contactLinks, {
  opacity: 1, y: 0, scale: 1,
  duration: 0.5,
  stagger: 0.1,
  ease: 'back.out(2)',
  scrollTrigger: { trigger: '.contact-links', start: 'top 90%', once: true }
});

/* ─────────────────────────────────────────
   SHOW MORE PROJECTS
   ───────────────────────────────────────── */
const showMoreBtn  = document.getElementById('show-more-btn');
const projectsList = document.getElementById('projects-list');
let listOpen = false;

showMoreBtn.addEventListener('click', () => {
  listOpen = !listOpen;
  projectsList.classList.toggle('open', listOpen);
  projectsList.setAttribute('aria-hidden',  String(!listOpen));
  showMoreBtn.setAttribute('aria-expanded', String(listOpen));
  showMoreBtn.textContent = listOpen ? '− Hide projects' : '+ Show 11 more projects';

  if (listOpen) {
    const rows = projectsList.querySelectorAll('tr');
    gsap.set(rows, { opacity: 0, y: 14, scale: 0.97 });
    gsap.to(rows, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.38,
      stagger: 0.05,
      ease: 'back.out(1.8)',
      delay: 0.12
    });
  }
});

/* ─────────────────────────────────────────
   COPY EMAIL
   ───────────────────────────────────────── */
document.getElementById('copy-email').addEventListener('click', () => {
  navigator.clipboard.writeText('amirthesh14@gmail.com').then(() => {
    const confirm = document.getElementById('copy-confirm');
    confirm.classList.add('visible');
    // Tiny bounce on the button
    gsap.fromTo('#copy-email', { scale: 0.96 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
    setTimeout(() => confirm.classList.remove('visible'), 2000);
  }).catch(() => { window.location.href = 'mailto:amirthesh14@gmail.com'; });
});

/* ─────────────────────────────────────────
   MAGNETIC BUTTONS
   ───────────────────────────────────────── */
document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const dx   = e.clientX - (rect.left + rect.width  / 2);
    const dy   = e.clientY - (rect.top  + rect.height / 2);
    gsap.to(btn, { x: dx * 0.25, y: dy * 0.25, duration: 0.3, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
  });
});

/* ─────────────────────────────────────────
   HERO SCROLL PARALLAX (subtle depth)
   ───────────────────────────────────────── */
gsap.to('.hero-inner', {
  yPercent: 18,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true
  }
});

gsap.to('.hero-footer', {
  yPercent: 30,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true
  }
});
