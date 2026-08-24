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
     Play button (placeholder — no real video wired up)
  --------------------------------------------------------- */
  var playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      playBtn.style.transform = 'scale(0.9)';
      setTimeout(function () { playBtn.style.transform = ''; }, 150);
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

})();
