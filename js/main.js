/* ============================================================
   MAIN.JS  –  Core UI interactions
   • Sticky nav + scroll-shadow
   • Mobile hamburger menu
   • Dark / Light theme toggle (persisted in localStorage)
   • Publications filter (client-side, no backend)
   • Project detail modals
   • Contact form → mailto handler with validation
   • Footer year
   • Smooth scroll for anchor links
   • Back-to-top button
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     UTILITY HELPERS
  ────────────────────────────────────────────────────────── */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ──────────────────────────────────────────────────────────
     1. FOOTER YEAR
  ────────────────────────────────────────────────────────── */
  function initFooterYear () {
    const el = qs('#footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ──────────────────────────────────────────────────────────
     2. STICKY NAV – add shadow/border on scroll
  ────────────────────────────────────────────────────────── */
  function initStickyNav () {
    const header = qs('#nav-header');
    if (!header) return;

    function onScroll () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ──────────────────────────────────────────────────────────
     3. MOBILE HAMBURGER MENU
  ────────────────────────────────────────────────────────── */
  function initHamburger () {
    const btn   = qs('#nav-hamburger');
    const links = qs('#nav-links');
    if (!btn || !links) return;

    function open () {
      links.classList.add('open');
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close navigation menu');
      document.body.style.overflow = 'hidden';
    }

    function close () {
      links.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open navigation menu');
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', () => {
      btn.getAttribute('aria-expanded') === 'true' ? close() : open();
    });

    /* Close when a link is clicked */
    qsa('.nav-link', links).forEach(link => {
      link.addEventListener('click', close);
    });

    /* Close on outside click */
    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') &&
          !links.contains(e.target) &&
          !btn.contains(e.target)) {
        close();
      }
    });

    /* Close on Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) close();
    });
  }

  /* ──────────────────────────────────────────────────────────
     4. THEME TOGGLE  (light ↔ dark)
     Persisted to localStorage as 'portfolio-theme'
  ────────────────────────────────────────────────────────── */
  function initTheme () {
    const btn  = qs('#theme-toggle');
    const html = document.documentElement;

    /* Resolve initial theme: stored → OS preference → light */
    function getPreferred () {
      const stored = localStorage.getItem('portfolio-theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light';
    }

    function applyTheme (theme) {
      html.setAttribute('data-theme', theme);
      localStorage.setItem('portfolio-theme', theme);
      if (btn) {
        btn.setAttribute('aria-label',
          theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        );
        btn.setAttribute('title',
          theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        );
      }
    }

    applyTheme(getPreferred());

    if (btn) {
      btn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }

    /* React to OS-level preference changes */
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('portfolio-theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     5. PUBLICATIONS FILTER
     Filters .pub-card elements by data-type and data-year
     Filter buttons carry data-filter attribute
  ────────────────────────────────────────────────────────── */
  function initPublicationsFilter () {
    const filterBtns = qsa('.pub-filter-btn');
    const pubCards   = qsa('.pub-card');
    if (!filterBtns.length || !pubCards.length) return;

    function applyFilter (filter) {
      pubCards.forEach(card => {
        const type = card.dataset.type  || '';
        const year = card.dataset.year  || '';
        const show = filter === 'all' || type === filter || year === filter;

        if (show) {
          card.classList.remove('hidden');
          /* Re-trigger reveal if not yet visible */
          if (!card.classList.contains('visible')) {
            card.classList.add('visible');
          }
        } else {
          card.classList.add('hidden');
        }
      });

      /* Update aria-pressed */
      filterBtns.forEach(btn => {
        const active = btn.dataset.filter === filter;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
    });

    /* Init with 'all' */
    applyFilter('all');
  }

  /* ──────────────────────────────────────────────────────────
     6. PROJECT DETAIL MODALS
     Trigger: .project-details-btn[data-modal="modal-pN"]
     Content is defined inline below; add more as needed
  ────────────────────────────────────────────────────────── */
  const MODAL_DATA = {
    'modal-p1': {
      title: 'AI-Based Disease Detection System',
      body: `
        <p><strong>Duration:</strong> 2022 – 2024 (Ongoing)</p>
        <p><strong>Domain:</strong> Artificial Intelligence · Healthcare · Computer Vision</p>
        <p>
          This project develops a deep-learning-based framework for the early and automated
          detection of diseases using medical imaging data (X-rays, CT scans, MRI).
          A custom convolutional neural network (CNN) architecture is trained on curated
          benchmark datasets, achieving state-of-the-art accuracy.
        </p>
        <p><strong>Key contributions:</strong></p>
        <ul>
          <li>Multi-class classification pipeline with data augmentation strategies.</li>
          <li>Explainability layer using Grad-CAM visualisations for clinical interpretability.</li>
          <li>Lightweight model variant suitable for edge deployment in resource-constrained settings.</li>
          <li>Validation on [X] benchmark datasets with [Y]% accuracy.</li>
        </ul>
        <p><strong>Technologies:</strong> Python · TensorFlow · Keras · OpenCV · NumPy</p>
      `
    },
    'modal-p2': {
      title: 'IoT-Based Smart Environmental Monitoring',
      body: `
        <p><strong>Duration:</strong> 2020 – 2022 (Completed)</p>
        <p><strong>Domain:</strong> Internet of Things · Edge Computing · Embedded Systems</p>
        <p>
          A real-time environmental monitoring system deployed across a smart campus,
          using distributed IoT sensor nodes to measure temperature, humidity, air quality
          (PM2.5, CO₂), and noise levels.
        </p>
        <p><strong>Key contributions:</strong></p>
        <ul>
          <li>Low-power sensor node design with Wi-Fi and LoRa connectivity.</li>
          <li>Edge preprocessing to reduce cloud bandwidth by ~60%.</li>
          <li>Cloud dashboard with real-time alerts and historical trend analysis.</li>
          <li>Deployed across [N] nodes on campus; continuous uptime > 99%.</li>
        </ul>
        <p><strong>Technologies:</strong> Arduino · Raspberry Pi · MQTT · Node-RED · Python</p>
      `
    },
    'modal-p3': {
      title: 'Low-Power VLSI Design Optimization',
      body: `
        <p><strong>Duration:</strong> 2019 – 2021 (Completed)</p>
        <p><strong>Domain:</strong> VLSI · Digital Design · Wearable Electronics</p>
        <p>
          Research into novel gate-level and architectural techniques for minimising dynamic
          and static power consumption in digital VLSI circuits, with target applications
          in wearable and implantable biomedical devices.
        </p>
        <p><strong>Key contributions:</strong></p>
        <ul>
          <li>Proposed a modified clock-gating scheme reducing dynamic power by up to 35%.</li>
          <li>Multi-threshold CMOS (MTCMOS) approach for leakage reduction.</li>
          <li>FPGA prototype verified on Xilinx Artix-7 platform.</li>
          <li>Results published in Microelectronics Journal (Elsevier).</li>
        </ul>
        <p><strong>Technologies:</strong> Verilog · VHDL · Cadence · Xilinx Vivado · MATLAB</p>
      `
    },
    'modal-p4': {
      title: 'Computer Vision Surveillance System',
      body: `
        <p><strong>Duration:</strong> 2021 – 2023 (Ongoing)</p>
        <p><strong>Domain:</strong> Computer Vision · Security · Deep Learning</p>
        <p>
          An intelligent, real-time surveillance system using deep-learning-based object
          detection (YOLOv7) and anomaly-identification algorithms for smart campus security.
        </p>
        <p><strong>Key contributions:</strong></p>
        <ul>
          <li>Real-time multi-camera stream processing at 25+ FPS on edge hardware.</li>
          <li>Crowd density estimation and loitering detection modules.</li>
          <li>Privacy-preserving design: face blurring before cloud storage.</li>
          <li>Alert integration with campus security management system.</li>
        </ul>
        <p><strong>Technologies:</strong> Python · OpenCV · YOLOv7 · TensorRT · NVIDIA Jetson</p>
      `
    },
    'modal-p5': {
      title: 'Biomedical Signal Analysis Framework',
      body: `
        <p><strong>Duration:</strong> 2018 – 2020 (Completed)</p>
        <p><strong>Domain:</strong> Signal Processing · Biomedical Engineering · Clinical Diagnostics</p>
        <p>
          Development of a comprehensive signal-processing framework for analysing ECG
          and EEG biomedical signals, aimed at assisting clinicians with automated
          diagnosis of cardiac arrhythmias and neurological disorders.
        </p>
        <p><strong>Key contributions:</strong></p>
        <ul>
          <li>Wavelet-based feature extraction pipeline for ECG/EEG denoising.</li>
          <li>SVM and CNN classifiers for arrhythmia categorisation (MIT-BIH dataset).</li>
          <li>Real-time streaming interface for continuous patient monitoring.</li>
          <li>Sensitivity: [X]%, Specificity: [Y]% on validation set.</li>
        </ul>
        <p><strong>Technologies:</strong> MATLAB · Python · SciPy · Scikit-learn · NumPy</p>
      `
    },
    'modal-p6': {
      title: 'NLP-Based Text Classification Engine',
      body: `
        <p><strong>Duration:</strong> 2023 – Present (Ongoing)</p>
        <p><strong>Domain:</strong> Natural Language Processing · Transformer Models · Information Retrieval</p>
        <p>
          A BERT-based transformer model fine-tuned for the automated classification of
          academic papers, technical reports, and patents into research domains,
          enabling intelligent document management and discovery.
        </p>
        <p><strong>Key contributions:</strong></p>
        <ul>
          <li>Fine-tuned BERT/RoBERTa on a custom labelled corpus of [N] documents.</li>
          <li>Multi-label classification supporting [K] research categories.</li>
          <li>REST API endpoint for integration with institutional repository systems.</li>
          <li>Macro-F1 score: [X]% on held-out test set.</li>
        </ul>
        <p><strong>Technologies:</strong> Python · HuggingFace Transformers · PyTorch · FastAPI · Docker</p>
      `
    },
  };

  function initModals () {
    const overlay   = qs('#modal-overlay');
    const modalBox  = qs('#modal-box');
    const closeBtn  = qs('#modal-close');
    const titleEl   = qs('#modal-title');
    const bodyEl    = qs('#modal-body');

    if (!overlay || !modalBox) return;

    let lastFocused = null;

    function openModal (id) {
      const data = MODAL_DATA[id];
      if (!data) return;

      lastFocused = document.activeElement;

      titleEl.textContent = data.title;
      bodyEl.innerHTML    = data.body;

      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');

      /* Trap focus inside modal */
      setTimeout(() => modalBox.focus(), 50);
      document.body.style.overflow = 'hidden';
    }

    function closeModal () {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    /* Open triggers */
    qsa('.project-details-btn').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.modal));
    });

    /* Close triggers */
    closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    /* Focus trap */
    modalBox.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = qsa(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        modalBox
      ).filter(el => !el.disabled);
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     7. CONTACT FORM – client-side validation + mailto
  ────────────────────────────────────────────────────────── */
  function initContactForm () {
    const form    = qs('#contact-form');
    if (!form) return;

    const fields = {
      name    : { el: qs('#cf-name'),    err: qs('#error-name'),    rule: v => v.trim().length >= 2,   msg: 'Please enter your name (at least 2 characters).' },
      email   : { el: qs('#cf-email'),   err: qs('#error-email'),   rule: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Please enter a valid email address.' },
      message : { el: qs('#cf-message'), err: qs('#error-message'), rule: v => v.trim().length >= 10,  msg: 'Please enter a message (at least 10 characters).' },
    };

    function validateField (key) {
      const { el, err, rule, msg } = fields[key];
      if (!el) return true;
      const valid = rule(el.value);
      el.classList.toggle('invalid', !valid);
      if (err) err.textContent = valid ? '' : msg;
      return valid;
    }

    /* Live validation on blur */
    Object.keys(fields).forEach(key => {
      const { el } = fields[key];
      if (el) {
        el.addEventListener('blur',  () => validateField(key));
        el.addEventListener('input', () => {
          if (el.classList.contains('invalid')) validateField(key);
        });
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const allValid = Object.keys(fields).every(key => validateField(key));
      if (!allValid) {
        /* Focus first invalid field */
        const first = Object.values(fields).find(f => f.el?.classList.contains('invalid'));
        if (first?.el) first.el.focus();
        return;
      }

      /* Build mailto URL */
      const name    = fields.name.el.value.trim();
      const email   = fields.email.el.value.trim();
      const subject = (qs('#cf-subject')?.value.trim()) || 'Portfolio Enquiry';
      const message = fields.message.el.value.trim();

      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        message,
      ].join('\n');

      const mailto = `mailto:drsubhajiniac@gmail.com`
        + `?subject=${encodeURIComponent(subject)}`
        + `&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;

      /* Visual feedback */
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Opening email client…';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          form.reset();
          /* Remove invalid states */
          Object.values(fields).forEach(f => {
            if (f.el) f.el.classList.remove('invalid');
            if (f.err) f.err.textContent = '';
          });
        }, 3000);
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     8. SMOOTH SCROLL for all anchor links (fallback for
        browsers where CSS scroll-behavior isn't supported)
  ────────────────────────────────────────────────────────── */
  function initSmoothScroll () {
    const NAV_H = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '70',
      10
    );

    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_H;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  /* ──────────────────────────────────────────────────────────
     9. BACK-TO-TOP BUTTON
     Injects a floating button that appears after scrolling 400px
  ────────────────────────────────────────────────────────── */
  function initBackToTop () {
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Scroll back to top');
    btn.setAttribute('title', 'Back to top');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           width="20" height="20" aria-hidden="true">
        <polyline points="18 15 12 9 6 15"/>
      </svg>`;
    btn.style.cssText = [
      'position:fixed',
      'bottom:1.5rem',
      'right:1.5rem',
      'z-index:900',
      'width:44px',
      'height:44px',
      'border-radius:50%',
      'background:var(--clr-accent)',
      'color:#fff',
      'display:grid',
      'place-items:center',
      'box-shadow:var(--shadow-accent)',
      'opacity:0',
      'transform:translateY(12px)',
      'transition:opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      'pointer-events:none',
      'border:none',
      'cursor:pointer',
    ].join(';');

    document.body.appendChild(btn);

    function update () {
      const show = window.scrollY > 400;
      btn.style.opacity        = show ? '1' : '0';
      btn.style.transform      = show ? 'translateY(0)' : 'translateY(12px)';
      btn.style.pointerEvents  = show ? 'all' : 'none';
    }

    window.addEventListener('scroll', update, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    update();
  }

  /* ──────────────────────────────────────────────────────────
     10. KEYBOARD ACCESSIBILITY – skip-to-content link
  ────────────────────────────────────────────────────────── */
  function initSkipLink () {
    const skip = document.createElement('a');
    skip.href = '#main-content';
    skip.textContent = 'Skip to main content';
    skip.style.cssText = [
      'position:fixed',
      'top:-100%',
      'left:1rem',
      'z-index:9999',
      'padding:0.5rem 1rem',
      'background:var(--clr-accent)',
      'color:#fff',
      'border-radius:0 0 var(--radius-md) var(--radius-md)',
      'font-weight:600',
      'font-size:0.875rem',
      'transition:top 0.2s ease',
      'text-decoration:none',
    ].join(';');

    skip.addEventListener('focus',  () => { skip.style.top = '0'; });
    skip.addEventListener('blur',   () => { skip.style.top = '-100%'; });

    document.body.prepend(skip);
  }

  /* ──────────────────────────────────────────────────────────
     10. CERTIFICATE LIGHTBOX
  ────────────────────────────────────────────────────────── */
  function initCertLightbox () {
    const lightbox   = qs('#cert-lightbox');
    const lbImg      = qs('#cert-lb-img');
    const lbCaption  = qs('#cert-lb-caption');
    const lbDots     = qs('#cert-lb-dots');
    const closeBtn   = qs('#cert-lb-close');
    const prevBtn    = qs('#cert-lb-prev');
    const nextBtn    = qs('#cert-lb-next');
    const backdrop   = qs('.cert-lightbox-backdrop');

    if (!lightbox) return;

    /* Collect all certificates in order */
    const certs = qsa('.cert-zoom-btn').map(btn => ({
      src    : btn.dataset.src,
      caption: btn.dataset.caption,
    }));

    let current    = 0;
    let lastFocused = null;

    /* Build dots */
    function buildDots () {
      lbDots.innerHTML = '';
      certs.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'cert-lb-dot' + (i === current ? ' active' : '');
        dot.setAttribute('aria-label', `Go to certificate ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        lbDots.appendChild(dot);
      });
    }

    function updateDots () {
      qsa('.cert-lb-dot', lbDots).forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    function goTo (index) {
      current = (index + certs.length) % certs.length;
      lbImg.classList.add('loading');
      const newImg = new Image();
      newImg.onload = () => {
        lbImg.src = certs[current].src;
        lbImg.alt = certs[current].caption;
        lbImg.classList.remove('loading');
      };
      newImg.src = certs[current].src;
      lbCaption.textContent = certs[current].caption;
      updateDots();
    }

    function openLightbox (index) {
      lastFocused = document.activeElement;
      current = index;
      buildDots();
      lbImg.src     = certs[current].src;
      lbImg.alt     = certs[current].caption;
      lbCaption.textContent = certs[current].caption;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeBtn.focus(), 60);
    }

    function closeLightbox () {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    /* Open triggers */
    qsa('.cert-zoom-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => openLightbox(i));
    });

    /* Also open on card click */
    qsa('.cert-card').forEach((card, i) => {
      card.addEventListener('click', () => openLightbox(i));
    });

    /* Controls */
    prevBtn.addEventListener('click',  (e) => { e.stopPropagation(); goTo(current - 1); });
    nextBtn.addEventListener('click',  (e) => { e.stopPropagation(); goTo(current + 1); });
    closeBtn.addEventListener('click', closeLightbox);
    backdrop.addEventListener('click', closeLightbox);

    /* Keyboard */
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    });
  }

  /* ──────────────────────────────────────────────────────────
     11. DISABLE RIGHT-CLICK CONTEXT MENU
  ────────────────────────────────────────────────────────── */
  function initDisableRightClick () {
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      return false;
    });
  }

  /* ──────────────────────────────────────────────────────────
     12. DISABLE KEYBOARD SHORTCUTS (F12, Ctrl+Shift+I/J/U/C)
  ────────────────────────────────────────────────────────── */
  function initDisableDevTools () {
    document.addEventListener('keydown', function (e) {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I  (DevTools)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J  (Console)
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C  (Inspect element)
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U  (View source)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S  (Save page)
      if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        return false;
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────── */
  function init () {
    initFooterYear();
    initStickyNav();
    initHamburger();
    initTheme();
    initPublicationsFilter();
    initModals();
    initContactForm();
    initSmoothScroll();
    initBackToTop();
    initSkipLink();
    initDisableRightClick();
    initDisableDevTools();
    initCertLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
