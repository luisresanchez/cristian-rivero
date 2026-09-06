/* ============================================================
   INTERACTIONS — scroll reveal, counters, bars, hamburger
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Scroll progress bar ── */
  const progressBar = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = `${(scrolled / total) * 100}%`;
  }, { passive: true });

  /* ── Nav scroll state ── */
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ── Hamburger menu ── */
  const hamburger = document.querySelector('.nav__hamburger');
  const navLinks  = document.querySelector('.nav__links');

  if (hamburger && navLinks) {
    const navOverlay = document.getElementById('nav-overlay');

    function closeMenu() {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      if (navOverlay) navOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      if (navOverlay) navOverlay.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    if (navOverlay) navOverlay.addEventListener('click', closeMenu);

    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && navLinks.classList.contains('open')) closeMenu();
    });
  }

  /* ── Scroll reveal (IntersectionObserver) ── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── Animated counters ── */
  function parseNum(str) {
    if (!str) return 0;
    const s    = String(str).trim();
    const unit = s.slice(-1);
    const num  = parseFloat(s);
    if (unit === 'M') return num * 1_000_000;
    if (unit === 'K') return num * 1_000;
    return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
  }

  function formatNum(val, originalStr) {
    const s    = String(originalStr).trim();
    const unit = s.slice(-1);
    if (unit === 'M') return (val / 1_000_000).toFixed(1) + 'M';
    if (unit === 'K') {
      const k = val / 1_000;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K';
    }
    if (s.includes('%')) return val.toFixed(1) + '%';
    if (s.includes(',')) return Math.round(val).toLocaleString('es-PE');
    return Math.round(val).toString();
  }

  function animateCounter(el) {
    const target    = el.dataset.target || el.textContent;
    const targetVal = parseNum(target);
    if (!targetVal) return;

    const duration = 1800;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNum(targetVal * ease, target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.counter').forEach(el => {
    el.dataset.target = el.textContent;
    counterObserver.observe(el);
  });

  /* ── Audience progress bars ── */
  const barObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.bar-fill');
        if (fill) {
          const pct = fill.dataset.pct || '0';
          setTimeout(() => { fill.style.width = pct + '%'; }, 150);
        }
        barObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.bar-track').forEach(bar => barObserver.observe(bar));

  /* ── Active nav link on scroll ── */
  const allSections = document.querySelectorAll('section[id]');
  const allNavLinks = document.querySelectorAll('.nav__links a[href^="#"]');

  const activeSectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        allNavLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });

  allSections.forEach(s => activeSectionObserver.observe(s));

  /* ── Smooth scroll nav links ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── YouTube Episodes Slider (generic, supports multiple) ── */
  function initSlider(trackId, prevId, nextId) {
    const track   = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);
    if (!track || !prevBtn || !nextBtn) return;

    const cards = Array.from(track.querySelectorAll('.episode-yt-card'));
    let idx = 0;

    function getVisible() {
      const w = track.parentElement.offsetWidth;
      if (w < 500) return 1;
      if (w < 900) return 2;
      return 3;
    }

    function updateSlider() {
      const visible = getVisible();
      const gap     = 24;
      const trackW  = track.parentElement.offsetWidth;
      const cardW   = (trackW - gap * (visible - 1)) / visible;
      const maxIdx  = Math.max(0, cards.length - visible);

      idx = Math.max(0, Math.min(idx, maxIdx));
      track.style.transform = `translateX(-${idx * (cardW + gap)}px)`;

      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx >= maxIdx;
    }

    prevBtn.addEventListener('click', () => { idx = Math.max(0, idx - 1); updateSlider(); });
    nextBtn.addEventListener('click', () => { idx++; updateSlider(); });
    window.addEventListener('resize', () => { idx = 0; updateSlider(); }, { passive: true });

    /* Touch/swipe support */
    let touchStartX = 0;
    track.parentElement.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.parentElement.addEventListener('touchend', e => {
      const delta = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 40) {
        if (delta > 0) { idx++; } else { idx = Math.max(0, idx - 1); }
        updateSlider();
      }
    }, { passive: true });

    updateSlider();
  }

  initSlider('episodes-track', 'episodes-prev', 'episodes-next');
  initSlider('metele-track',   'metele-prev',   'metele-next');

  /* ── Cookie Consent ── */
  const COOKIE_KEY = 'cr_cookie_consent';
  const banner     = document.getElementById('cookie-banner');
  const btnAccept  = document.getElementById('cookie-accept');
  const btnDecline = document.getElementById('cookie-decline');

  function loadAnalytics() {
    // Analytics se activa cuando estén configurados GA4 y Meta Pixel
  }

  function hideBanner() {
    banner.style.transform = 'translateY(100%)';
    setTimeout(() => { banner.hidden = true; }, 400);
  }

  if (!localStorage.getItem(COOKIE_KEY)) {
    setTimeout(() => { banner.hidden = false; }, 900);
  } else if (localStorage.getItem(COOKIE_KEY) === 'accepted') {
    loadAnalytics();
  }

  if (btnAccept) btnAccept.addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    loadAnalytics();
    hideBanner();
  });

  if (btnDecline) btnDecline.addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    hideBanner();
  });

});
