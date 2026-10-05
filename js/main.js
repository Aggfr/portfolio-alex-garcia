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
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
});
