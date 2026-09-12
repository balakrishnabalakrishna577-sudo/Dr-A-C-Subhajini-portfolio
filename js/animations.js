/* ============================================================
   ANIMATIONS.JS  –  Scroll-triggered reveals, parallax,
                     3D tilt cards, counters, skill bars,
                     radial charts, scroll-progress bar
   No external dependencies – pure Intersection Observer + RAF
   ============================================================ */

(function () {
  'use strict';

  const prefReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ──────────────────────────────────────────────────────────
     1. SCROLL PROGRESS BAR
  ────────────────────────────────────────────────────────── */
  function initScrollProgress () {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Page scroll progress');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    document.body.prepend(bar);

    function update () {
      const scrollTop  = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width  = pct.toFixed(1) + '%';
      bar.setAttribute('aria-valuenow', Math.round(pct));
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ──────────────────────────────────────────────────────────
     2. INTERSECTION OBSERVER – SCROLL REVEAL
     Watches elements with .reveal-up / .reveal-left /
     .reveal-right / .reveal-timeline and adds .visible
  ────────────────────────────────────────────────────────── */
  function initReveal () {
    if (prefReduced) {
      /* Immediately show everything if user prefers reduced motion */
      document.querySelectorAll(
        '.reveal-up, .reveal-left, .reveal-right, .reveal-timeline'
      ).forEach(el => el.classList.add('visible'));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);   /* fire once */
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll(
      '.reveal-up, .reveal-left, .reveal-right, .reveal-timeline'
    ).forEach(el => revealObserver.observe(el));
  }

  /* ──────────────────────────────────────────────────────────
     3. COUNTER ANIMATION (About highlights)
     Animates data-count="N" elements when they scroll into view
  ────────────────────────────────────────────────────────── */
  function animateCounter (el, target, duration) {
    const start     = performance.now();
    const startVal  = 0;

    function step (now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      /* Ease-out cubic */
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(startVal + (target - startVal) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters () {
    const counters = document.querySelectorAll('.highlight-number[data-count]');
    if (!counters.length) return;

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el     = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const dur    = prefReduced ? 0 : 1600;
            animateCounter(el, target, dur);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => counterObserver.observe(el));
  }

  /* ──────────────────────────────────────────────────────────
     4. RADIAL COUNTER (Skills section)
     Animates .radial-pct[data-count] numbers
  ────────────────────────────────────────────────────────── */
  function initRadialCounters () {
    const els = document.querySelectorAll('.radial-pct[data-count]');
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el     = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const dur    = prefReduced ? 0 : 1400;
            animateCounter(el, target, dur);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );

    els.forEach(el => obs.observe(el));
  }

  /* ──────────────────────────────────────────────────────────
     5. SKILL BARS – animate width on scroll into view
  ────────────────────────────────────────────────────────── */
  function initSkillBars () {
    const bars = document.querySelectorAll('.skill-bar-fill[data-width]');
    if (!bars.length) return;

    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const w  = el.dataset.width;
            /* Small delay so reveal animation finishes first */
            setTimeout(() => {
              el.style.width = (prefReduced ? w : w) + '%';
            }, prefReduced ? 0 : 200);
            barObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );

    bars.forEach(el => barObserver.observe(el));
  }

  /* ──────────────────────────────────────────────────────────
     6. RADIAL SKILL CHARTS – SVG stroke-dashoffset animation
     Circumference = 2 * π * r = 2 * 3.14159 * 40 ≈ 251.2
  ────────────────────────────────────────────────────────── */
  function initRadialCharts () {
    /* Inject SVG gradient definition once */
    injectSvgGradient();

    const fills = document.querySelectorAll('.radial-fill[data-pct]');
    if (!fills.length) return;

    const C = 2 * Math.PI * 40;   /* circumference */

    const chartObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el  = entry.target;
            const pct = parseFloat(el.dataset.pct) / 100;
            const offset = C - pct * C;

            /* Apply gradient stroke */
            el.style.stroke = 'url(#radialGrad)';

            setTimeout(() => {
              el.style.strokeDashoffset = prefReduced ? offset : offset;
            }, prefReduced ? 0 : 300);

            chartObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );

    fills.forEach(el => {
      el.style.strokeDasharray  = C;
      el.style.strokeDashoffset = C;   /* start hidden */
      chartObserver.observe(el);
    });
  }

  function injectSvgGradient () {
    if (document.getElementById('svgDefsPortfolio')) return;

    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('id',     'svgDefsPortfolio');
    svg.setAttribute('width',  '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;overflow:hidden;width:0;height:0';

    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', 'radialGrad');
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '100%');

    const stop1 = document.createElementNS(ns, 'stop');
    stop1.setAttribute('offset',     '0%');
    stop1.setAttribute('stop-color', '#4f46e5');

    const stop2 = document.createElementNS(ns, 'stop');
    stop2.setAttribute('offset',     '100%');
    stop2.setAttribute('stop-color', '#f59e0b');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }

  /* ──────────────────────────────────────────────────────────
     7. 3D TILT CARDS (Project cards)
     Vanilla JS tilt – no library needed
  ────────────────────────────────────────────────────────── */
  function initTiltCards () {
    if (prefReduced) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;     /* skip on touch devices */

    const MAX_TILT    = 12;   /* degrees */
    const MAX_GLARE   = 0.25;
    const PERSPECTIVE = 900;

    document.querySelectorAll('.tilt-card').forEach(card => {
      const inner = card.querySelector('.project-card-inner') || card;

      /* Glare element */
      const glare = document.createElement('div');
      glare.style.cssText = [
        'position:absolute', 'inset:0', 'border-radius:inherit',
        'pointer-events:none', 'z-index:2',
        'background:radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, transparent 70%)',
        'opacity:0', 'transition:opacity 0.3s ease',
      ].join(';');
      card.style.position = 'relative';
      card.appendChild(glare);

      function onMove (e) {
        const rect   = card.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = (e.clientX - cx) / (rect.width  / 2);
        const dy     = (e.clientY - cy) / (rect.height / 2);

        const rotX   = -dy * MAX_TILT;
        const rotY   =  dx * MAX_TILT;

        card.style.transform =
          `perspective(${PERSPECTIVE}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`;
        card.style.transition = 'transform 0.1s ease';

        /* Glare follows pointer */
        const glareX = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        const glareY = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        glare.style.background =
          `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,${MAX_GLARE}) 0%, transparent 65%)`;
        glare.style.opacity = '1';
      }

      function onLeave () {
        card.style.transform  = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1,1,1)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        glare.style.opacity   = '0';
      }

      card.addEventListener('mousemove',  onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  /* ──────────────────────────────────────────────────────────
     8. SECTION PARALLAX  (subtle background shift on scroll)
  ────────────────────────────────────────────────────────── */
  function initParallax () {
    if (prefReduced) return;

    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;

    let ticking = false;

    function update () {
      const sy = window.scrollY;
      /* Hero content drifts up slightly as user scrolls */
      if (sy < window.innerHeight) {
        heroContent.style.transform = `translateY(${sy * 0.25}px)`;
        heroContent.style.opacity   = Math.max(0, 1 - sy / (window.innerHeight * 0.65));
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────────────────
     9. SECTION ENTRANCE – stagger child items
     Adds staggered reveal to timeline items and pub cards
     that enter the viewport together
  ────────────────────────────────────────────────────────── */
  function initStaggerGroups () {
    if (prefReduced) return;

    /* Stagger pub cards individually as they enter */
    document.querySelectorAll('.pub-card').forEach((card, i) => {
      card.style.transitionDelay = (i * 0.08) + 's';
    });

    /* Stagger timeline items */
    document.querySelectorAll('.timeline-item').forEach((item, i) => {
      const content = item.querySelector('.timeline-content');
      if (content) content.style.transitionDelay = (i * 0.12) + 's';
    });
  }

  /* ──────────────────────────────────────────────────────────
     10. ACTIVE NAV LINK HIGHLIGHTING on scroll
     Updates which nav link has .active class
  ────────────────────────────────────────────────────────── */
  function initActiveNav () {
    const sections  = document.querySelectorAll('section[id]');
    const navLinks  = document.querySelectorAll('.nav-link:not(.nav-link--cta)');
    const NAV_H     = 80;

    function setActive () {
      const scrollY = window.scrollY + NAV_H + 20;

      let current = '';
      sections.forEach(sec => {
        if (scrollY >= sec.offsetTop) current = sec.id;
      });

      navLinks.forEach(link => {
        const href = link.getAttribute('href')?.replace('#', '');
        link.classList.toggle('active', href === current);
      });
    }

    window.addEventListener('scroll', setActive, { passive: true });
    setActive();
  }

  /* ──────────────────────────────────────────────────────────
     11. HERO REVEAL SEQUENCE (staggered on load)
  ────────────────────────────────────────────────────────── */
  function initHeroReveal () {
    if (prefReduced) return;

    const items = [
      '.hero-pre-title',
      '.hero-title',
      '.hero-tagline',
      '.hero-subtitle',
      '.hero-cta-group',
    ];

    items.forEach((selector, i) => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.style.opacity   = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = `opacity 0.7s ease ${0.2 + i * 0.15}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.15}s`;

      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        }, 80);
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     12. SMOOTH HOVER LIFT for highlight cards and social links
         (CSS handles it, but we add a subtle shadow pulse here)
  ────────────────────────────────────────────────────────── */
  function initCardHoverSound () {
    /* No audio – kept as no-op placeholder */
  }

  /* ──────────────────────────────────────────────────────────
     INIT – run all after DOM is ready
  ────────────────────────────────────────────────────────── */
  function init () {
    initScrollProgress();
    initReveal();
    initCounters();
    initRadialCounters();
    initSkillBars();
    initRadialCharts();
    initTiltCards();
    initParallax();
    initStaggerGroups();
    initActiveNav();
    initHeroReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
