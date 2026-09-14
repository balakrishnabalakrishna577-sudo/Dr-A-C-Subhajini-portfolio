/* ============================================================
   MAIN.JS  –  Nav, theme, carousel, form, back-to-top
   ============================================================ */
(function () {
  'use strict';

  const qs  = (s, c = document) => c.querySelector(s);
  const qsa = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ── 1. FOOTER YEAR ── */
  function initFooterYear () {
    const el = qs('#footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── 2. STICKY NAV SHADOW ── */
  function initNav () {
    const header = qs('#nav-header');
    if (!header) return;
    const fn = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
  }

  /* ── 3. HAMBURGER ── */
  function initHamburger () {
    const btn   = qs('#nav-hamburger');
    const links = qs('#nav-links');
    if (!btn || !links) return;

    // Create backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    const open  = () => {
      links.classList.add('open');
      btn.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      document.body.style.overflow = 'hidden';
      backdrop.classList.add('visible');
    };
    const close = () => {
      links.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
      backdrop.classList.remove('visible');
    };

    btn.addEventListener('click', () => btn.getAttribute('aria-expanded')==='true' ? close() : open());
    qsa('.nav-link', links).forEach(l => l.addEventListener('click', close));
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key==='Escape') close(); });

    // Close menu if viewport grows past the breakpoint
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) close();
    }, { passive: true });
  }

  /* ── 4. THEME TOGGLE ── */
  function initTheme () {
    const btn  = qs('#theme-toggle');
    const html = document.documentElement;

    const getStored = () => {
      const s = localStorage.getItem('portfolio-theme');
      return (s === 'dark' || s === 'light') ? s : 'light';
    };

    const apply = (theme) => {
      html.setAttribute('data-theme', theme);
      localStorage.setItem('portfolio-theme', theme);
      if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    };

    apply(getStored());
    if (btn) btn.addEventListener('click', () => apply(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('portfolio-theme')) apply(e.matches ? 'dark' : 'light');
    });
  }

  /* ── 5. SMOOTH SCROLL ── */
  function initSmooth () {
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '72', 10);
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
    });
  }

  /* ── 6. BACK TO TOP ── */
  function initBackToTop () {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>`;
    Object.assign(btn.style, {
      position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:'900',
      width:'42px', height:'42px', borderRadius:'50%',
      background:'var(--clr-accent)', color:'#fff',
      display:'grid', placeItems:'center',
      boxShadow:'0 4px 18px rgba(79,70,229,.4)',
      opacity:'0', transform:'translateY(14px)',
      transition:'opacity .3s ease, transform .35s cubic-bezier(.34,1.56,.64,1)',
      pointerEvents:'none', border:'none', cursor:'pointer', fontFamily:'inherit'
    });
    document.body.appendChild(btn);

    const update = () => {
      const show = window.scrollY > 400;
      btn.style.opacity = show ? '1' : '0';
      btn.style.transform = show ? 'translateY(0)' : 'translateY(14px)';
      btn.style.pointerEvents = show ? 'all' : 'none';
    };
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    update();
  }

  /* ── 7. CERTIFICATE CAROUSEL + LIGHTBOX ── */
  function initCertCarousel () {
    const track    = qs('#cert-track');
    const prevBtn  = qs('#cert-prev');
    const nextBtn  = qs('#cert-next');
    const dotsWrap = qs('#cert-dots');
    const lightbox = qs('#cert-lightbox');
    const lbImg    = qs('#cert-lb-img');
    const lbCap    = qs('#cert-lb-cap');
    const lbClose  = qs('#cert-lb-close');
    const backdrop = qs('.cert-lb-backdrop');
    if (!track) return;

    const slides = qsa('.cert-slide', track);
    const total  = slides.length;
    let current  = 0;
    let timer    = null;

    const POS = ['active','next1','next2','hidden','prev2','prev1'];
    const pos = i => POS[((i - current) % total + total) % total] || 'hidden';

    const render = () => {
      slides.forEach((s, i) => s.setAttribute('data-pos', pos(i)));
      qsa('.cert-dot', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === current));
    };

    const goTo = i => { current = ((i % total) + total) % total; render(); };
    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);
    const resetTimer = () => { clearInterval(timer); timer = setInterval(next, 3500); };

    /* Dots */
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'cert-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Certificate ' + (i + 1));
      d.addEventListener('click', () => { goTo(i); resetTimer(); });
      dotsWrap.appendChild(d);
    });

    prevBtn.addEventListener('click', () => { prev(); resetTimer(); });
    nextBtn.addEventListener('click', () => { next(); resetTimer(); });

    slides.forEach((s, i) => s.addEventListener('click', () => {
      if (s.getAttribute('data-pos') === 'active') openLB(i);
      else { goTo(i); resetTimer(); }
    }));

    document.addEventListener('keydown', e => {
      if (lightbox?.classList.contains('open')) return;
      if (e.key === 'ArrowLeft')  { prev(); resetTimer(); }
      if (e.key === 'ArrowRight') { next(); resetTimer(); }
    });

    let tX = 0;
    track.addEventListener('touchstart', e => { tX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => { const d = tX - e.changedTouches[0].clientX; if (Math.abs(d) > 40) { d > 0 ? next() : prev(); resetTimer(); } }, { passive: true });
    track.addEventListener('mouseenter', () => clearInterval(timer));
    track.addEventListener('mouseleave', resetTimer);

    /* Lightbox */
    let lastFocus = null;
    function openLB (i) {
      if (!lightbox) return;
      lastFocus = document.activeElement;
      const img = slides[i].querySelector('img');
      lbCap.textContent = slides[i].querySelector('.cert-lbl').textContent;
      lbImg.classList.add('loading'); lbImg.src = '';
      lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      const tmp = new Image();
      tmp.onload = () => { lbImg.src = img.src; lbImg.alt = img.alt; lbImg.classList.remove('loading'); };
      tmp.src = img.src;
      setTimeout(() => lbClose?.focus(), 60);
    }
    function closeLB () {
      if (!lightbox) return;
      lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
      lastFocus?.focus();
    }
    lbClose?.addEventListener('click', closeLB);
    backdrop?.addEventListener('click', closeLB);
    document.addEventListener('keydown', e => { if (lightbox?.classList.contains('open') && e.key === 'Escape') closeLB(); });

    render();
    resetTimer();
  }

  /* ── 8. CONTACT FORM ── */
  function initContactForm () {
    const form = qs('#contact-form');
    if (!form) return;

    const fields = {
      name   : { el: qs('#cf-name'),    err: qs('#error-name'),    rule: v => v.trim().length >= 2,                        msg: 'Please enter your name.' },
      email  : { el: qs('#cf-email'),   err: qs('#error-email'),   rule: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Please enter a valid email address.' },
      message: { el: qs('#cf-message'), err: qs('#error-message'), rule: v => v.trim().length >= 10,                       msg: 'Please write a message (min 10 characters).' },
    };

    const validate = key => {
      const { el, err, rule, msg } = fields[key];
      if (!el) return true;
      const ok = rule(el.value);
      el.classList.toggle('invalid', !ok);
      if (err) err.textContent = ok ? '' : msg;
      return ok;
    };

    Object.keys(fields).forEach(k => {
      const { el } = fields[k];
      el?.addEventListener('blur',  () => validate(k));
      el?.addEventListener('input', () => { if (el.classList.contains('invalid')) validate(k); });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!Object.keys(fields).every(k => validate(k))) return;
      const name    = fields.name.el.value.trim();
      const email   = fields.email.el.value.trim();
      const subject = (qs('#cf-subject')?.value.trim()) || 'Portfolio Enquiry';
      const message = fields.message.el.value.trim();
      window.location.href = `mailto:drsubhajiniac@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Opening email client…';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = orig; btn.disabled = false; form.reset();
          Object.values(fields).forEach(f => { f.el?.classList.remove('invalid'); if (f.err) f.err.textContent = ''; });
        }, 3000);
      }
    });
  }

  /* ── 9. DISABLE RIGHT-CLICK ── */
  function initDisableRightClick () {
    document.addEventListener('contextmenu', e => { e.preventDefault(); return false; });
  }

  /* ── 10. DISABLE DEV SHORTCUTS ── */
  function initDisableDevTools () {
    document.addEventListener('keydown', e => {
      if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) { e.preventDefault(); return false; }
      if (e.ctrlKey && ['U','u','S','s'].includes(e.key)) { e.preventDefault(); return false; }
    });
  }

  /* ── 11. SKIP LINK ── */
  function initSkipLink () {
    const a = document.createElement('a');
    a.href = '#main-content';
    a.textContent = 'Skip to main content';
    a.style.cssText = 'position:fixed;top:-100%;left:1rem;z-index:9999;padding:.5rem 1rem;background:var(--clr-accent);color:#fff;border-radius:0 0 var(--r-md) var(--r-md);font-weight:600;font-size:.85rem;transition:top .2s ease;text-decoration:none;';
    a.addEventListener('focus',  () => { a.style.top = '0'; });
    a.addEventListener('blur',   () => { a.style.top = '-100%'; });
    document.body.prepend(a);
  }

  /* ── INIT ── */
  function init () {
    initFooterYear();
    initNav();
    initHamburger();
    initTheme();
    initSmooth();
    initBackToTop();
    initCertCarousel();
    initContactForm();
    initDisableRightClick();
    initDisableDevTools();
    initSkipLink();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
