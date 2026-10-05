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
     3. About paragraph: character-by-character opacity reveal
        driven by scroll progress through the paragraph.
        NOTE: every space must stay a plain ASCII space (code 32),
        never a non-breaking space, or the paragraph cannot wrap.
     ------------------------------------------------------------ */
  var SPACE_CHAR = String.fromCharCode(32);
  var aboutText = document.querySelector('[data-char-reveal]');
  var aboutSection = document.querySelector('.pv-about');
  var charSpans = [];

  if (aboutText) {
    var raw = aboutText.textContent;
    aboutText.textContent = '';
    raw.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'pv-about-char';
      span.textContent = ch === SPACE_CHAR ? SPACE_CHAR : ch;
      aboutText.appendChild(span);
      charSpans.push(span);
    });
  }

  function updateCharReveal() {
    if (!aboutText || !charSpans.length || !aboutSection) return;
    var vh = window.innerHeight;

    /* progress 0 -> 1 driven by how far we've scrolled through the
       section's OWN scrollable range (its height minus one viewport),
       not by the paragraph's own position. The paragraph sits inside
       a sticky wrapper, so its on-screen position freezes once stuck —
       tying progress to that would leave the reveal stuck mid-way on
       short sections. Tying it to the section's scroll range instead
       guarantees the text finishes revealing exactly as the section
       runs out of scroll room, regardless of how tall the section is. */
    var sectionRect = aboutSection.getBoundingClientRect();
    var scrollable = aboutSection.offsetHeight - vh;
    var progress;
    if (scrollable <= 0) {
      progress = sectionRect.top <= 0 ? 1 : 0;
    } else {
      progress = (-sectionRect.top) / scrollable;
    }
    progress = Math.max(0, Math.min(1, progress));

    var total = charSpans.length;
    charSpans.forEach(function (span, i) {
      var charProgress = (progress * total - i);
      var opacity = Math.max(0.2, Math.min(1, 0.2 + charProgress * 0.8));
      span.style.opacity = opacity;
    });
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
      updateCharReveal();
      updateStack();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
});
