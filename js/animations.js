/* ============================================================
   ANIMATIONS.JS  –  Scroll reveals, counters, skill bars,
                     radial charts, parallax, tilt, active nav
   ============================================================ */
(function () {
  'use strict';

  const prefReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. SCROLL PROGRESS BAR ── */
  function initScrollProgress () {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Page scroll progress');
    document.body.prepend(bar);
    window.addEventListener('scroll', () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
      bar.style.width = Math.min(pct, 100).toFixed(1) + '%';
    }, { passive: true });
  }

  /* ── 2. SCROLL REVEAL ── */
  function initReveal () {
    const els = document.querySelectorAll('.fade-up, .fade-left, .fade-right');
    if (prefReduced) { els.forEach(el => el.classList.add('visible')); return; }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => obs.observe(el));
  }

  /* ── 3. COUNTER ANIMATION ── */
  function animateCount (el, target, duration) {
    const start = performance.now();
    function tick (now) {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters () {
    const els = document.querySelectorAll('.stat-num[data-count], .ach-num[data-count], .radial-pct[data-count]');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target, parseInt(entry.target.dataset.count, 10), prefReduced ? 0 : 1500);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    els.forEach(el => obs.observe(el));
  }

  /* ── 4. SKILL BARS ── */
  function initSkillBars () {
    const fills = document.querySelectorAll('.skill-fill[data-w]');
    if (!fills.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => { entry.target.style.width = entry.target.dataset.w + '%'; }, prefReduced ? 0 : 150);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    fills.forEach(el => obs.observe(el));
  }

  /* ── 5. RADIAL CHARTS ── */
  function injectSvgDefs () {
    if (document.getElementById('svgDefs')) return;
    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.id = 'svgDefs';
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.id = 'radialGrad';
    grad.setAttribute('x1','0%'); grad.setAttribute('y1','0%');
    grad.setAttribute('x2','100%'); grad.setAttribute('y2','100%');
    [['0%','#4f46e5'],['100%','#f59e0b']].forEach(([offset,color]) => {
      const s = document.createElementNS(ns, 'stop');
      s.setAttribute('offset', offset);
      s.setAttribute('stop-color', color);
      grad.appendChild(s);
    });
    defs.appendChild(grad); svg.appendChild(defs);
    document.body.appendChild(svg);
  }

  function initRadialCharts () {
    injectSvgDefs();
    const fills = document.querySelectorAll('.radial-fill[data-pct]');
    if (!fills.length) return;
    const C = 2 * Math.PI * 40;
    fills.forEach(el => {
      el.style.strokeDasharray  = C;
      el.style.strokeDashoffset = C;
      el.style.stroke = 'url(#radialGrad)';
    });
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const offset = C - (parseFloat(el.dataset.pct) / 100) * C;
          setTimeout(() => { el.style.strokeDashoffset = offset; }, prefReduced ? 0 : 200);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    fills.forEach(el => obs.observe(el));
  }

  /* ── 6. ACTIVE NAV LINK ── */
  function initActiveNav () {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-link:not(.nav-link--cta)');
    function update () {
      const scrollY = window.scrollY + 85;
      let current = '';
      sections.forEach(s => { if (scrollY >= s.offsetTop) current = s.id; });
      links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href')?.slice(1) === current);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── 7. HERO PARALLAX ── */
  function initParallax () {
    if (prefReduced) return;
    const content = document.querySelector('.hero-content');
    if (!content) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        if (sy < window.innerHeight) {
          content.style.transform = `translateY(${sy * 0.22}px)`;
          content.style.opacity   = Math.max(0, 1 - sy / (window.innerHeight * 0.6));
        }
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  /* ── 8. 3D TILT on research blocks hover ── */
  function initTilt () {
    if (prefReduced) return;
    const isMobile = window.matchMedia('(max-width:768px)').matches;
    if (isMobile) return;

    document.querySelectorAll('.tl-body, .ach-card, .stat-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r  = card.getBoundingClientRect();
        const dx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
        const dy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
        card.style.transform = `perspective(700px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg) translateY(-4px)`;
        card.style.transition = 'transform .1s ease';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform  = '';
        card.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
      });
    });
  }

  /* ── INIT ── */
  function init () {
    initScrollProgress();
    initReveal();
    initCounters();
    initSkillBars();
    initRadialCharts();
    initActiveNav();
    initParallax();
    initTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
