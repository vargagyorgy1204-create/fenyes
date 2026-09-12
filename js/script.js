(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var headerButton = document.querySelector('.nav-actions > a.btn-primary');
  if (headerButton) {
    var headerButtonText = headerButton.textContent.trim();
    var letterGroup = document.createElement('span');
    letterGroup.className = 'header-button-letter-group';
    headerButton.textContent = '';

    Array.from(headerButtonText).forEach(function (character, index) {
      var letter = document.createElement('span');
      letter.className = 'header-button-letter';
      letter.textContent = character === ' ' ? '\u00a0' : character;
      letter.style.setProperty('--letter-index', index);
      letterGroup.appendChild(letter);
    });

    headerButton.appendChild(letterGroup);
  }

  /* ---------------------------------------------------------
     Unified scroll loop — header shadow, back-to-top, progress
     bar and parallax all read/write in one rAF-batched pass so
     scrolling stays smooth instead of running several separate
     scroll listeners.
  --------------------------------------------------------- */
  var header = document.getElementById('header');
  var backToTop = document.getElementById('backToTop');
  var scrollProgress = document.getElementById('scrollProgress');
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('.parallax'));

  var scrollTicking = false;

  function updateOnScroll() {
    scrollTicking = false;
    var y = window.scrollY || document.documentElement.scrollTop;

    if (header) header.classList.toggle('scrolled', y > 8);
    if (backToTop) backToTop.classList.toggle('visible', y > 600);

    if (scrollProgress) {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? Math.min(100, Math.max(0, (y / docHeight) * 100)) : 0;
      scrollProgress.style.width = pct + '%';
    }

    if (!reduceMotion && parallaxEls.length) {
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
        var factor = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        el.style.transform = 'translateY(' + (centerOffset * factor * -1) + 'px)';
      });
    }

    updateServicesStep();
    updateProcessStep();
  }

  function onScroll() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateOnScroll);
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  // Initial sync happens at the very end of this file, after the
  // step-scroller sections below are set up (updateOnScroll calls into
  // them, and they need to exist first).

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  var navOverlay = document.getElementById('navOverlay');

  function closeNav() {
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
    navOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function toggleNav() {
    var isOpen = navLinks.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navOverlay.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  if (navToggle) navToggle.addEventListener('click', toggleNav);
  if (navOverlay) navOverlay.addEventListener('click', closeNav);

  var navLinkItems = navLinks ? navLinks.querySelectorAll('a') : [];
  navLinkItems.forEach(function (link) {
    link.addEventListener('click', function () {
      closeNav();
      navLinkItems.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ---------------------------------------------------------
     Scroll reveal animations
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-zoom');

  if ('IntersectionObserver' in window && !reduceMotion) {
    revealEls.forEach(function (el) { el.classList.remove('in-view'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Animated stat counters
  --------------------------------------------------------- */
  var counters = document.querySelectorAll('.counter');

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (reduceMotion) { el.textContent = target; return; }

    var duration = 1400;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------------------------------------------------------
     Testimonials slider
  --------------------------------------------------------- */
  var track = document.getElementById('tTrack');
  var dotsWrap = document.getElementById('tDots');
  var prevBtn = document.getElementById('tPrev');
  var nextBtn = document.getElementById('tNext');

  if (track && dotsWrap) {
    var cards = Array.prototype.slice.call(track.children);
    var testimonialIndex = 0;

    cards.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 't-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Vélemény ' + (i + 1));
      dot.addEventListener('click', function () { setTestimonial(i); });
      dotsWrap.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(dotsWrap.children);

    function wrapIndex(index) {
      return (index + cards.length) % cards.length;
    }

    function setCardState(card, state, index) {
      card.classList.remove('is-active', 'is-prev', 'is-next', 'is-hidden');
      card.classList.add(state);
      card.setAttribute('aria-current', state === 'is-active' ? 'true' : 'false');
      card.setAttribute('aria-label', 'Vélemény ' + (index + 1));
    }

    function setTestimonial(index) {
      testimonialIndex = wrapIndex(index);
      var previousIndex = wrapIndex(testimonialIndex - 1);
      var nextIndex = wrapIndex(testimonialIndex + 1);

      cards.forEach(function (card, i) {
        if (i === testimonialIndex) setCardState(card, 'is-active', i);
        else if (i === previousIndex) setCardState(card, 'is-prev', i);
        else if (i === nextIndex) setCardState(card, 'is-next', i);
        else setCardState(card, 'is-hidden', i);
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === testimonialIndex);
        dot.setAttribute('aria-current', i === testimonialIndex ? 'true' : 'false');
      });
    }

    cards.forEach(function (card) {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', function () { setTestimonial(testimonialIndex + 1); });
      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setTestimonial(testimonialIndex + 1);
        }
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () {
      setTestimonial(testimonialIndex - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      setTestimonial(testimonialIndex + 1);
    });

    setTestimonial(0);
  }

  /* ---------------------------------------------------------
     Newsletter form (client-side only demo)
  --------------------------------------------------------- */
  var newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = newsletterForm.querySelector('input');
      var btn = newsletterForm.querySelector('button');
      if (!input.value) return;
      btn.textContent = 'Sikeres Feliratkozás!';
      newsletterForm.classList.add('success');
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = 'Feliratkozás';
        newsletterForm.classList.remove('success');
        btn.disabled = false;
        input.value = '';
      }, 3200);
    });
  }

  /* ---------------------------------------------------------
     Active nav link on scroll (scrollspy)
  --------------------------------------------------------- */
  var sections = ['top', 'rolunk', 'szolgaltatasok', 'velemenyek', 'csapat', 'kapcsolat']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if (sections.length) {
    var spyTicking = false;

    function updateActiveSection() {
      spyTicking = false;
      var probeY = 140; // just below the sticky header
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top - probeY <= 0) {
          current = sections[i];
        }
      }
      var nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      if (nearBottom) current = sections[sections.length - 1];

      var id = current.id;
      navLinkItems.forEach(function (l) {
        l.classList.toggle('active', l.getAttribute('href') === '#' + id);
      });
    }

    document.addEventListener('scroll', function () {
      if (!spyTicking) {
        spyTicking = true;
        requestAnimationFrame(updateActiveSection);
      }
    }, { passive: true });

    updateActiveSection();
  }

  /* ---------------------------------------------------------
     Lucide icons
  --------------------------------------------------------- */
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
  }

  /* ---------------------------------------------------------
     Before / After comparison slider
  --------------------------------------------------------- */
  var baSlider = document.getElementById('baSlider');
  var baBeforeImg = document.getElementById('baBeforeImg');
  var baDivider = document.getElementById('baDivider');
  var baHandle = document.getElementById('baHandle');

  if (baSlider && baBeforeImg && baDivider && baHandle) {
    var baDragging = false;

    function baSetPosition(pct) {
      pct = Math.min(100, Math.max(0, pct));
      baBeforeImg.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      baDivider.style.left = pct + '%';
      baHandle.setAttribute('aria-valuenow', Math.round(pct));
    }

    function baPercentFromClientX(clientX) {
      var rect = baSlider.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function baPointerMove(e) {
      if (!baDragging) return;
      var clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
      baSetPosition(baPercentFromClientX(clientX));
    }

    function baStopDrag() {
      if (!baDragging) return;
      baDragging = false;
      baSlider.classList.remove('dragging');
      window.removeEventListener('pointermove', baPointerMove);
      window.removeEventListener('pointerup', baStopDrag);
    }

    function baStartDrag(e) {
      baDragging = true;
      baSlider.classList.add('dragging');
      window.addEventListener('pointermove', baPointerMove);
      window.addEventListener('pointerup', baStopDrag);
      var clientX = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
      if (typeof clientX === 'number') baSetPosition(baPercentFromClientX(clientX));
      e.preventDefault();
      baHandle.focus();
    }

    baHandle.addEventListener('pointerdown', baStartDrag);

    // Allow grabbing anywhere on the slider, not just the handle
    baSlider.addEventListener('pointerdown', function (e) {
      if (baHandle.contains(e.target)) return;
      baStartDrag(e);
    });

    baHandle.addEventListener('keydown', function (e) {
      var current = parseFloat(baHandle.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        baSetPosition(current - 5);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        baSetPosition(current + 5);
        e.preventDefault();
      } else if (e.key === 'Home') {
        baSetPosition(0);
        e.preventDefault();
      } else if (e.key === 'End') {
        baSetPosition(100);
        e.preventDefault();
      }
    });

    baSetPosition(50);
  }

  /* ---------------------------------------------------------
     Scroll-progress-driven sticky panel (Services + Process).

     A per-row IntersectionObserver (the original approach) can
     advance the active step as soon as a row nears the viewport
     centre — which can fire before the panel has even finished
     becoming sticky, so the highlight races ahead of the pin.
     Instead: each .sticky-row's outer .process-row is a tall
     (80vh) scroll slot (see CSS), making the section itself
     roughly steps*80vh tall. The panel pins naturally via CSS
     `position: sticky` inside that tall track; this only
     computes *which step* is active, as a 0-1 scroll fraction
     through the section mapped onto the row count.

     Returns an `update` function to be called from the shared
     rAF scroll loop above (no per-section scroll listener) — a
     no-op if the section/panel/rows aren't found.
  --------------------------------------------------------- */
  function createStepScroller(sectionId) {
    var section = document.getElementById(sectionId);
    var rows = section ? Array.prototype.slice.call(section.querySelectorAll('.sticky-row')) : [];
    var panel = section ? section.querySelector('.sticky-panel-inner') : null;
    var content = panel ? panel.querySelector('.process-fade') : null;
    var badge = content ? content.querySelector('.sticky-badge') : null;
    var numEl = content ? content.querySelector('.sticky-num') : null;
    var titleEl = content ? content.querySelector('.sticky-title') : null;
    var bgNumEl = panel ? panel.querySelector('.sticky-bg-num') : null;
    var currentIndex = -1;
    var fadeTimer = null;

    if (!section || !panel || !rows.length) return function () {};

    function applyStep(index) {
      var row = rows[index];
      if (!row) return;
      var iconName = row.getAttribute('data-icon');
      badge.innerHTML = '<i data-lucide="' + iconName + '" class="icon icon--lg"></i>';
      numEl.textContent = row.getAttribute('data-num');
      titleEl.textContent = row.getAttribute('data-title');
      if (bgNumEl) bgNumEl.textContent = row.getAttribute('data-num');
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
      }
    }

    // Soft two-phase transition: slide+fade the old content up and out,
    // swap the text/icon once it's gone, then slide+fade the new
    // content in from below. Opacity + translate only (compositor-
    // friendly), driven by toggling classes — see CSS for the timing.
    function setStep(index) {
      if (index === currentIndex) return;
      currentIndex = index;
      rows.forEach(function (r, i) { r.classList.toggle('is-active', i === index); });

      if (reduceMotion || !content) {
        applyStep(index);
        return;
      }

      clearTimeout(fadeTimer);
      content.classList.remove('is-entering');
      content.classList.add('is-leaving');

      fadeTimer = setTimeout(function () {
        applyStep(index);
        content.classList.remove('is-leaving');
        content.classList.add('is-entering');
        // Force a reflow so the "entering" starting position (translated
        // down, transparent) is actually painted before we remove the
        // class — otherwise both class changes would batch into one
        // frame and no transition would play.
        void content.offsetWidth;
        content.classList.remove('is-entering');
      }, 200);
    }

    function update() {
      if (reduceMotion) return;

      var y = window.scrollY || document.documentElement.scrollTop;
      var rect = section.getBoundingClientRect();
      var sectionTop = rect.top + y;
      var scrollable = section.offsetHeight - window.innerHeight;
      var progress = scrollable > 0 ? (y - sectionTop) / scrollable : 0;
      progress = Math.min(1, Math.max(0, progress));

      var index = Math.floor(progress * rows.length);
      if (index >= rows.length) index = rows.length - 1;
      if (index < 0) index = 0;

      setStep(index);
    }

    // Reduced motion: lock to step 1, matching the static two-column
    // fallback layout — no rAF-driven progress tracking needed.
    if (reduceMotion) setStep(0);

    return update;
  }

  var updateServicesStep = createStepScroller('servicesSticky');
  var updateProcessStep = createStepScroller('processSticky');

  // Now that the step-scrollers above exist, run the initial sync for
  // header/back-to-top/progress-bar/parallax/step-scrollers all at once.
  updateOnScroll();

})();
