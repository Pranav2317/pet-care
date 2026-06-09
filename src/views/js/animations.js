/**
 * Gray Pet Shop – Shared Animation Script
 * Include this after DOM is ready on every page.
 * Usage: <script src="../js/animations.js"></script>
 */
(function () {
  // ── Scroll Reveal ──────────────────────────────────────────────────
  function initScrollReveal() {
    const els = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    );
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01 }
    );
    els.forEach((el) => io.observe(el));
  }

  // ── Navbar scroll effect ───────────────────────────────────────────
  function initNavbarScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Ripple on buttons ──────────────────────────────────────────────
  function initRipple() {
    document.querySelectorAll('button, a.btn-ripple, .btn-ripple').forEach((btn) => {
      btn.classList.add('btn-ripple');
    });
  }

  // ── Page entrance fade ─────────────────────────────────────────────
  function initPageEntrance() {
    const main = document.querySelector('main');
    if (main) main.classList.add('page-enter');
  }

  // ── Card hover class auto-attach ──────────────────────────────────
  function initCardHover() {
    document.querySelectorAll(
      '.product-card, .cat-card, .order-card, .stat-card'
    ).forEach((c) => c.classList.add('card-hover'));
  }

  // ── Stagger children of grid/list ─────────────────────────────────
  function initStagger() {
    document.querySelectorAll('[data-stagger]').forEach((parent) => {
      Array.from(parent.children).forEach((child, i) => {
        child.classList.add('reveal');
        child.classList.add(`delay-${Math.min(i + 1, 6)}`);
      });
    });
  }

  // ── Init all ──────────────────────────────────────────────────────
  function init() {
    initStagger();
    initScrollReveal();
    initNavbarScroll();
    initPageEntrance();
    initCardHover();
  }

  // ── Expose global interface ───────────────────────────────────────
  window.XamAnimations = {
    initScrollReveal,
    initNavbarScroll,
    initRipple,
    initPageEntrance,
    initCardHover,
    initStagger,
    init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
