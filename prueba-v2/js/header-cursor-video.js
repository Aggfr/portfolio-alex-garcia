/* ============================================================
   Header cursor video — ported from the Trenzas KG header
   effect ("el video se mueve con el cursor"): the video does
   not literally play on its own timeline, instead its current
   frame is scrubbed based on the cursor's horizontal position
   inside the header. Moving the mouse left/right "rotates"
   through the clip; it eases back to the center frame on
   mouseleave.

   This coexists with the Liquid Film WebGL background (which
   keeps animating on its own independent rAF loop) — this
   script only ever touches the .header-visual-video element.
   ============================================================ */
(function () {
  "use strict";

  function init() {
    var header = document.querySelector(".header");
    var video = document.querySelector(".header-visual-video");

    if (!header || !video) return;

    var CENTER_RATIO = 0.5;
    var EASE = 0.12; // smoothing, independent of mousemove frequency

    var targetRatio = CENTER_RATIO;
    var currentRatio = CENTER_RATIO;
    var metadataReady = video.readyState >= 1; // HAVE_METADATA
    var seeking = false;
    var pendingRatio = null;

    video.addEventListener("loadedmetadata", function () {
      metadataReady = true;
    });

    // Avoid flooding the video with seeks: if a new target arrives
    // while a previous seek is still in flight, queue it.
    function seekTo(ratio) {
      if (!metadataReady || !video.duration) return;
      var clamped = Math.min(Math.max(ratio, 0), 1);
      var targetTime = clamped * video.duration;
      if (seeking) {
        pendingRatio = clamped;
        return;
      }
      seeking = true;
      video.currentTime = targetTime;
    }

    video.addEventListener("seeked", function () {
      seeking = false;
      if (pendingRatio !== null) {
        var next = pendingRatio;
        pendingRatio = null;
        seekTo(next);
      }
    });

    function animate() {
      currentRatio += (targetRatio - currentRatio) * EASE;
      seekTo(currentRatio);
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    // On touch (no real mouse) stay on the center frame (poster).
    var hasMouse = window.matchMedia("(pointer: fine)").matches;
    if (!hasMouse) return;

    header.addEventListener("mousemove", function (event) {
      var rect = header.getBoundingClientRect();
      var relX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      // Inverted so the frame scrub matches the head's turn
      // direction on screen (cursor right -> head turns toward
      // the right-hand side of the clip, and vice versa).
      targetRatio = 1 - relX;
    });

    header.addEventListener("mouseleave", function () {
      targetRatio = CENTER_RATIO;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
