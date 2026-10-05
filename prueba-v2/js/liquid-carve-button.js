/* ============================================================
   Liquid Carve Button — Originkit
   Vanilla-JS port (no React / framer-motion) of the shared
   component, applied to the "View project" CTAs in prueba-v2.

   The component itself is generic: call enhance(el, cfg) on any
   button-like element and it injects the goo-filtered SVG overlay
   (a solid "blobColor" rect behind a "fillColor" rect that's
   masked by a circle chasing the cursor), wraps the existing text
   in a label span, and wires up the pointer physics. Only the
   .pv-ghost-btn wiring at the bottom is site-specific.
   ============================================================ */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var GOO_STRENGTH = 8;

  var FOLLOW_TAU_MIN = 0.02;
  var FOLLOW_TAU_MAX = 0.4;
  var SQUASH_TAU = 0.09;
  var SQUASH_PER_PX_PER_SEC = 0.0011;
  var SQUASH_MAX = 1.6;

  var BITE_MS = 800;
  var BITE_EASE = "cubic-bezier(0.44, 0, 0.56, 1)";

  var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function radiusFromPercent(w, h, pct) {
    return (Math.min(w, h) / 2) * (Math.max(0, Math.min(100, pct)) / 100);
  }

  var uid = 0;

  function enhance(btn, cfg) {
    uid += 1;
    var filterId = "liquid-goo-" + uid;
    var maskId = "liquid-bite-" + uid;

    var w0 = btn.offsetWidth || 160;
    var h0 = btn.offsetHeight || 44;
    var blobDiameter = Math.max(1, Math.max(w0, h0) * (cfg.blobScale || 1.3));

    // Preserve the existing text/content, wrap it in a label span
    // that always sits above the SVG and never intercepts pointer
    // events itself (the <a> element is what tracks the cursor).
    var label = document.createElement("span");
    label.className = "pv-liquid-label";
    while (btn.firstChild) label.appendChild(btn.firstChild);
    label.style.position = "relative";
    label.style.zIndex = "2";
    label.style.pointerEvents = "none";
    label.style.display = "inline-flex";
    label.style.alignItems = "center";
    label.style.color = cfg.textColor;

    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.inset = "0";
    svg.style.overflow = "visible";
    svg.style.zIndex = "1";

    var defs = document.createElementNS(SVG_NS, "defs");

    var filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", filterId);
    var blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("in", "SourceGraphic");
    blur.setAttribute("stdDeviation", String(GOO_STRENGTH));
    blur.setAttribute("result", "blur");
    var colorMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
    colorMatrix.setAttribute("in", "blur");
    colorMatrix.setAttribute("mode", "matrix");
    colorMatrix.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9");
    filter.appendChild(blur);
    filter.appendChild(colorMatrix);

    var mask = document.createElementNS(SVG_NS, "mask");
    mask.setAttribute("id", maskId);
    var maskBg = document.createElementNS(SVG_NS, "rect");
    maskBg.setAttribute("x", "0");
    maskBg.setAttribute("y", "0");
    maskBg.setAttribute("width", "100%");
    maskBg.setAttribute("height", "100%");
    maskBg.setAttribute("fill", "#fff");

    var follow = document.createElementNS(SVG_NS, "g");
    follow.style.transformBox = "fill-box";
    follow.style.transformOrigin = "center";

    var squash = document.createElementNS(SVG_NS, "g");
    squash.style.transformBox = "fill-box";
    squash.style.transformOrigin = "center";

    var bite = document.createElementNS(SVG_NS, "g");
    bite.style.transformBox = "fill-box";
    bite.style.transformOrigin = "center";
    bite.style.transition = reducedMotion ? "none" : "transform " + BITE_MS + "ms " + BITE_EASE;
    bite.style.transform = "scale(0)";

    var circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", "50%");
    circle.setAttribute("cy", "50%");
    circle.setAttribute("r", String(blobDiameter / 2));
    circle.setAttribute("fill", "#000");

    bite.appendChild(circle);
    squash.appendChild(bite);
    follow.appendChild(squash);
    mask.appendChild(maskBg);
    mask.appendChild(follow);
    defs.appendChild(filter);
    defs.appendChild(mask);
    svg.appendChild(defs);

    var gBlob = document.createElementNS(SVG_NS, "g");
    gBlob.setAttribute("filter", "url(#" + filterId + ")");
    var rectBlob = document.createElementNS(SVG_NS, "rect");
    rectBlob.setAttribute("x", "0");
    rectBlob.setAttribute("y", "0");
    rectBlob.setAttribute("width", "100%");
    rectBlob.setAttribute("height", "100%");
    rectBlob.setAttribute("fill", cfg.blobColor);
    gBlob.appendChild(rectBlob);

    var gFill = document.createElementNS(SVG_NS, "g");
    gFill.setAttribute("filter", "url(#" + filterId + ")");
    var rectFill = document.createElementNS(SVG_NS, "rect");
    rectFill.setAttribute("x", "0");
    rectFill.setAttribute("y", "0");
    rectFill.setAttribute("width", "100%");
    rectFill.setAttribute("height", "100%");
    rectFill.setAttribute("fill", cfg.fillColor);
    rectFill.setAttribute("mask", "url(#" + maskId + ")");
    gFill.appendChild(rectFill);

    svg.appendChild(gBlob);
    svg.appendChild(gFill);

    btn.classList.add("pv-liquid-host");
    btn.appendChild(svg);
    btn.appendChild(label);

    function updateRadius() {
      var w = btn.offsetWidth;
      var h = btn.offsetHeight;
      var r = Math.max(0, Math.floor(radiusFromPercent(w, h, 50)));
      rectBlob.setAttribute("rx", r);
      rectBlob.setAttribute("ry", r);
      rectFill.setAttribute("rx", r);
      rectFill.setAttribute("ry", r);
    }
    updateRadius();
    if (window.ResizeObserver) {
      new ResizeObserver(updateRadius).observe(btn);
    } else {
      window.addEventListener("resize", updateRadius);
    }

    var chase = { x: 0, y: 0, tx: 0, ty: 0, squash: 1, angle: 0 };
    var hovered = false;
    var last = 0;

    function offset(e) {
      var r = btn.getBoundingClientRect();
      return { dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
    }

    function tick(now) {
      requestAnimationFrame(tick);
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;

      var t = Math.max(0, Math.min(100, cfg.smoothness)) / 100;
      var tau = FOLLOW_TAU_MIN + t * (FOLLOW_TAU_MAX - FOLLOW_TAU_MIN);
      var k = reducedMotion ? 1 : 1 - Math.exp(-dt / tau);
      var dx = (chase.tx - chase.x) * k;
      var dy = (chase.ty - chase.y) * k;
      chase.x += dx;
      chase.y += dy;

      var speed = Math.hypot(dx, dy) / dt;
      var want = reducedMotion ? 1 : Math.min(SQUASH_MAX, 1 + speed * SQUASH_PER_PX_PER_SEC);
      chase.squash += (want - chase.squash) * (1 - Math.exp(-dt / SQUASH_TAU));
      if (speed > 8) chase.angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      follow.style.transform = "translate(" + chase.x + "px, " + chase.y + "px)";
      squash.style.transform = "rotate(" + chase.angle + "deg) scale(" + chase.squash + ", " + (1 / chase.squash) + ")";
    }
    requestAnimationFrame(tick);

    btn.addEventListener("pointerenter", function (e) {
      hovered = true;
      var o = offset(e);
      chase.tx = o.dx;
      chase.ty = o.dy;
      if (reducedMotion) {
        chase.x = o.dx;
        chase.y = o.dy;
        follow.style.transform = "translate(" + o.dx + "px, " + o.dy + "px)";
      }
      bite.style.transform = "scale(1)";
    });
    btn.addEventListener("pointermove", function (e) {
      if (!hovered) return;
      var o = offset(e);
      chase.tx = o.dx;
      chase.ty = o.dy;
    });
    btn.addEventListener("pointerleave", function () {
      hovered = false;
      bite.style.transform = "scale(0)";
    });
  }

  function init() {
    // Site palette: the pill's resting fill matches the dark Lab
    // card it sits on, the text stays the existing ghost-button
    // blue-gray, and the liquid that "carves" through on hover is
    // the site's orange accent (same one used on the header role
    // text and the Liquid Film background).
    var cfg = {
      fillColor: "#0C0C0C",
      textColor: "#D7E2EA",
      blobColor: "#FE8457",
      smoothness: 50,
      blobScale: 1.3,
    };
    document.querySelectorAll(".pv-ghost-btn").forEach(function (btn) {
      enhance(btn, cfg);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
