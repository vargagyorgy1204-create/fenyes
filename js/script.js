(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    updateProcessProgress();
  }

  function onScroll() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateOnScroll);
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  updateOnScroll();

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

    cards.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 't-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Vélemény ' + (i + 1));
      dot.addEventListener('click', function () { scrollToCard(i); });
      dotsWrap.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(dotsWrap.children);

    function activeIndex() {
      var scrollLeft = track.scrollLeft;
      var cardWidth = cards[0].getBoundingClientRect().width + 24;
      return Math.round(scrollLeft / cardWidth);
    }

    function updateDots() {
      var idx = Math.min(activeIndex(), dots.length - 1);
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }

    function scrollToCard(i) {
      var cardWidth = cards[0].getBoundingClientRect().width + 24;
      track.scrollTo({ left: i * cardWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateDots);
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener('click', function () {
      scrollToCard(Math.max(0, activeIndex() - 1));
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      scrollToCard(Math.min(cards.length - 1, activeIndex() + 1));
    });
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
     Sticky split panel (Services)
     Left panel content follows whichever row is centered in
     the viewport, tracked with IntersectionObserver — no
     scroll-position math, no easing/physics.
     (Process uses its own scroll-progress version below —
     IntersectionObserver-per-row desynced from when the panel
     actually pins, so it gets a dedicated implementation.)
  --------------------------------------------------------- */
  function initStickyPanel(section) {
    if (!section) return;
    var rows = Array.prototype.slice.call(section.querySelectorAll('.sticky-row'));
    var panel = section.querySelector('.sticky-panel-inner');
    if (!rows.length || !panel) return;

    var badge = panel.querySelector('.sticky-badge');
    var numEl = panel.querySelector('.sticky-num');
    var titleEl = panel.querySelector('.sticky-title');
    var currentRow = null;
    var fadeTimer = null;

    function applyContent(row) {
      var iconName = row.getAttribute('data-icon');
      badge.innerHTML = '<i data-lucide="' + iconName + '" class="icon icon--lg"></i>';
      numEl.textContent = row.getAttribute('data-num');
      titleEl.textContent = row.getAttribute('data-title');
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
      }
    }

    function setActive(row) {
      if (row === currentRow) return;
      currentRow = row;
      rows.forEach(function (r) { r.classList.toggle('is-active', r === row); });

      if (reduceMotion) {
        applyContent(row);
        return;
      }

      panel.classList.add('is-fading');
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(function () {
        applyContent(row);
        panel.classList.remove('is-fading');
      }, 160);
    }

    // Reduced motion: static two-column layout, content fixed to the
    // first row — no IntersectionObserver, no scroll-tracking.
    if (reduceMotion || !('IntersectionObserver' in window)) {
      setActive(rows[0]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    rows.forEach(function (row) { io.observe(row); });
  }

  initStickyPanel(document.getElementById('servicesSticky'));

  /* ---------------------------------------------------------
     Process section — scroll-progress-driven sticky panel.

     The old per-row IntersectionObserver advanced the active
     step as soon as a row neared the viewport centre, which
     could fire before the panel had even finished becoming
     sticky — the highlight raced ahead of the pin. Instead:
     each .process-row is a tall (80vh) scroll slot (see CSS),
     making #processSticky itself roughly steps*80vh tall. The
     panel pins naturally via CSS `position: sticky` inside
     that tall track; we only compute *which step* is active,
     as a 0-1 scroll fraction through the track mapped onto
     the step count. Runs inside the shared rAF scroll loop
     above — no separate scroll listener.
  --------------------------------------------------------- */
  var processSection = document.getElementById('processSticky');
  var processRows = processSection
    ? Array.prototype.slice.call(processSection.querySelectorAll('.sticky-row'))
    : [];
  var processPanel = processSection ? processSection.querySelector('.sticky-panel-inner') : null;
  var processBadge = processPanel ? processPanel.querySelector('.sticky-badge') : null;
  var processNumEl = processPanel ? processPanel.querySelector('.sticky-num') : null;
  var processTitleEl = processPanel ? processPanel.querySelector('.sticky-title') : null;
  var processBgNumEl = processPanel ? processPanel.querySelector('.sticky-bg-num') : null;
  var processCurrentIndex = -1;
  var processFadeTimer = null;

  function applyProcessStep(index) {
    var row = processRows[index];
    if (!row) return;
    var iconName = row.getAttribute('data-icon');
    processBadge.innerHTML = '<i data-lucide="' + iconName + '" class="icon icon--lg"></i>';
    processNumEl.textContent = row.getAttribute('data-num');
    processTitleEl.textContent = row.getAttribute('data-title');
    if (processBgNumEl) processBgNumEl.textContent = row.getAttribute('data-num');
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
    }
  }

  function setProcessStep(index) {
    if (index === processCurrentIndex) return;
    processCurrentIndex = index;
    processRows.forEach(function (r, i) { r.classList.toggle('is-active', i === index); });

    if (reduceMotion) {
      applyProcessStep(index);
      return;
    }

    processPanel.classList.add('is-fading');
    clearTimeout(processFadeTimer);
    processFadeTimer = setTimeout(function () {
      applyProcessStep(index);
      processPanel.classList.remove('is-fading');
    }, 160);
  }

  function updateProcessProgress() {
    if (!processSection || !processPanel || !processRows.length || reduceMotion) return;

    var y = window.scrollY || document.documentElement.scrollTop;
    var rect = processSection.getBoundingClientRect();
    var sectionTop = rect.top + y;
    var scrollable = processSection.offsetHeight - window.innerHeight;
    var progress = scrollable > 0 ? (y - sectionTop) / scrollable : 0;
    progress = Math.min(1, Math.max(0, progress));

    var index = Math.floor(progress * processRows.length);
    if (index >= processRows.length) index = processRows.length - 1;
    if (index < 0) index = 0;

    setProcessStep(index);
  }

  if (processSection && processPanel && processRows.length) {
    // Reduced motion: lock to step 1, matching the static two-column
    // fallback layout — no rAF-driven progress tracking needed.
    if (reduceMotion) {
      setProcessStep(0);
    } else {
      updateProcessProgress();
    }
  }

})();
