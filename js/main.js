document.addEventListener('DOMContentLoaded', function () {
  /* ------------------------------------------------------------
     1. Generic reveal-on-scroll (fades/translates elements with
        the .pv-reveal class once they enter the viewport)
     ------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('.pv-reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -50px 0px' }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ------------------------------------------------------------
     2. Marquee: two rows scroll horizontally based on page
        scroll position (row 1 right, row 2 left)
     ------------------------------------------------------------ */
  var marqueeSection = document.querySelector('.pv-marquee');
  var rowRight = document.querySelector('[data-marquee="right"]');
  var rowLeft = document.querySelector('[data-marquee="left"]');

  function updateMarquee() {
    if (!marqueeSection) return;
    var rect = marqueeSection.getBoundingClientRect();
    var sectionTop = window.scrollY + rect.top;
    var offset = (window.scrollY - sectionTop + window.innerHeight) * 0.3;

    if (rowRight) rowRight.style.transform = 'translateX(' + (offset - 200) + 'px)';
    if (rowLeft) rowLeft.style.transform = 'translateX(' + (-(offset - 200)) + 'px)';
  }

  /* ------------------------------------------------------------
     3. Floating nav bar: transparent over the header, gains a
        solid (blurred) background once the page is scrolled.
     ------------------------------------------------------------ */
  var navBar = document.querySelector('.nav-bar');
  var NAV_SCROLL_THRESHOLD = 40;

  function updateNavBackground() {
    if (!navBar) return;
    navBar.classList.toggle('is-scrolled', window.scrollY > NAV_SCROLL_THRESHOLD);
  }

  /* ------------------------------------------------------------
     4. Projects: sticky stacking cards that scale down slightly
        as the next card scrolls over them
     ------------------------------------------------------------ */
  var stackWraps = Array.prototype.slice.call(document.querySelectorAll('.pv-stack-wrap'));
  var stackCards = stackWraps.map(function (wrap) {
    return wrap.querySelector('.pv-stack-card');
  });

  function updateStack() {
    if (!stackWraps.length) return;
    var vh = window.innerHeight;

    for (var i = 0; i < stackCards.length - 1; i++) {
      var nextWrap = stackWraps[i + 1];
      var nextRect = nextWrap.getBoundingClientRect();
      var progress = (vh - nextRect.top) / vh;
      progress = Math.max(0, Math.min(1, progress));

      var remaining = stackCards.length - 1 - i;
      var scale = 1 - progress * 0.05 * Math.min(remaining, 1);
      stackCards[i].style.transform = 'scale(' + scale + ')';
    }
  }

  /* ------------------------------------------------------------
     5. Nav bar: highlight the active menu item depending on the
        current page / section in view
     ------------------------------------------------------------ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-bar-ul a'));

  function setActiveNavLink(matchFn) {
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', matchFn(link.getAttribute('href') || ''));
    });
  }

  var isProjectPage = /proyecto-/.test(window.location.pathname);
  var updateActiveSection = function () {};

  if (isProjectPage) {
    /* Project detail pages live under the Lab/Projects section */
    setActiveNavLink(function (href) {
      return /#lab$/.test(href);
    });
  } else {
    var spySections = [
      { hrefTest: /#approach$/, el: document.getElementById('approach') },
      { hrefTest: /#lab$/, el: document.getElementById('lab') },
      { hrefTest: /#schedule$/, el: document.getElementById('schedule') }
    ].filter(function (entry) {
      return !!entry.el;
    });

    updateActiveSection = function () {
      if (!spySections.length) return;
      var triggerLine = window.innerHeight * 0.35;
      var current = null;

      spySections.forEach(function (entry) {
        var rect = entry.el.getBoundingClientRect();
        if (rect.top <= triggerLine) {
          current = entry;
        }
      });

      if (!current) {
        setActiveNavLink(function (href) {
          return /index\.html$/.test(href);
        });
      } else {
        setActiveNavLink(function (href) {
          return current.hrefTest.test(href);
        });
      }
    };
  }

  /* ------------------------------------------------------------
     Scroll loop (throttled with requestAnimationFrame)
     ------------------------------------------------------------ */
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateMarquee();
      updateNavBackground();
      updateStack();
      updateActiveSection();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
});
