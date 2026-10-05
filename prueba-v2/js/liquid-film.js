/* ============================================================
   Liquid Film — Originkit
   Vanilla-JS port of the React/WebGL2 component shared by the
   user. All shader source and animation constants are kept
   verbatim; only the React wrapper (hooks, JSX, props) is
   replaced with a plain init() that mounts into #particles-container
   and runs full-page, taking over from the old particles.js +
   header video.
   ============================================================ */
(function () {
  "use strict";

  var MAX_DPR = 2;
  var NAME = "LiquidFilm";

  var LAYERS = 90;

  var CURRENT = 0.2;
  var DRAG = 0.09;
  var RING_SPEED = 260;
  var RING_WIDTH = 70;
  var RING_WAVE = 0.075;
  var RING_DECAY = 1.1;
  var RING_PUSH = 22;
  var MAX_RIPPLES = 8;
  var CLICK_LIFE = 5;
  var WAKE_LIFE = 2.4;
  var WAKE_STEP = 70;
  var WAKE_GAP = 0.3;
  var WAKE_AMP = 0.4;
  var FADE_OUT = 0.6;

  var VERT_SRC = "#version 300 es\n" +
    "const vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));\n" +
    "void main() { gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }\n";

  var FIELD_SRC = "#version 300 es\n" +
    "precision highp float;\n" +
    "uniform vec2 uRes;\n" +
    "uniform float uTime;\n" +
    "uniform vec3 uC1;\n" +
    "uniform vec3 uC2;\n" +
    "uniform float uSize;\n" +
    "uniform float uAngle;\n" +
    "out vec4 o;\n" +
    "\n" +
    "const float TAU = 6.28318530718;\n" +
    "const float LAYERS = " + LAYERS.toFixed(1) + ";\n" +
    "const float GAIN = 0.62;\n" +
    "\n" +
    "const vec2 CENTRE = vec2(-0.5, -0.05);\n" +
    "const float TILT = -3.3;\n" +
    "const float ZOOM = 1.05;\n" +
    "const float THETA = 2.14;\n" +
    "const float SHEAR = 0.967;\n" +
    "const float SHRINK = 0.955;\n" +
    "const vec2 WARP_FREQ = vec2(0.36, 2.2);\n" +
    "const vec2 WARP_AMP = vec2(0.12, 0.024);\n" +
    "const vec2 ASPECT = vec2(2.4, 0.15);\n" +
    "const float OFFSET = 0.39;\n" +
    "const float GLOW = 0.0021;\n" +
    "const float SOFT = 0.0019;\n" +
    "const float FALLOFF = 0.37;\n" +
    "const float PHASE = 71.0;\n" +
    "const float CYCLE = 0.16;\n" +
    "const float HUE_TRAVEL = 2.0;\n" +
    "\n" +
    "mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }\n" +
    "\n" +
    "void main() {\n" +
    "  vec2 R = uRes;\n" +
    "  vec2 pos = (gl_FragCoord.xy - 0.5 * R) / R.y;\n" +
    "\n" +
    "  pos = rot(uAngle) * pos / uSize;\n" +
    "  float t = uTime * 0.49 + PHASE;\n" +
    "  float breath = (-sin(uTime * 0.735) + sin(uTime * 0.49 + 1.0)) * 0.25 + 0.5;\n" +
    "  vec2 u = rot(TILT) * ((pos - CENTRE) * (ZOOM - breath * 0.085));\n" +
    "  mat2 fold = mat2(cos(THETA), sin(THETA), -SHEAR, cos(THETA));\n" +
    "\n" +
    "  vec3 col = vec3(0.0);\n" +
    "  for (float i = 1.0; i <= LAYERS; i += 1.0) {\n" +
    "    u.x -= sin(u.y * WARP_FREQ.x + t + i * 0.007) * WARP_AMP.x;\n" +
    "    u.y -= sin(u.x * WARP_FREQ.y - t + i * 0.02) * WARP_AMP.y;\n" +
    "    u = fold * u * SHRINK;\n" +
    "    vec2 q = (u - vec2(OFFSET + breath * 0.1, 0.0)) * ASPECT;\n" +
    "    float g = GLOW / (dot(q, q) + SOFT) * (0.25 + breath * 0.4);\n" +
    "    float r = length(u);\n" +
    "    float k = sin(i * CYCLE + t * 1.2 + r * HUE_TRAVEL) * 0.5 + 0.5;\n" +
    "    col += g * mix(uC1, uC2, k) * (0.62 + 0.5 * k) * exp2(-r * FALLOFF);\n" +
    "  }\n" +
    "  vec3 x = max(col * GAIN, 0.0);\n" +
    "  col = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);\n" +
    "  col = pow(clamp(col, 0.0, 1.0), vec3(0.85, 0.92, 0.98));\n" +
    "  col *= 1.0 - smoothstep(0.5, 1.6, length(pos)) * 0.07;\n" +
    "  o = vec4(col, 1.0);\n" +
    "}\n";

  var FINISH_SRC = "#version 300 es\n" +
    "precision highp float;\n" +
    "uniform sampler2D uField;\n" +
    "uniform vec2 uRes;\n" +
    "uniform float uTime;\n" +
    "uniform vec3 uBg;\n" +
    "uniform float uPaper;\n" +
    "uniform float uPR;\n" +
    "uniform vec2 uMouse;\n" +
    "uniform float uOn;\n" +
    "uniform float uReach;\n" +
    "uniform vec2 uVel;\n" +
    "uniform vec4 uRip[" + MAX_RIPPLES + "];\n" +
    "uniform int uRipN;\n" +
    "uniform float uFlow;\n" +
    "out vec4 o;\n" +
    "\n" +
    "const float CURRENT = " + CURRENT.toFixed(3) + ";\n" +
    "const float DRAG = " + DRAG.toFixed(3) + ";\n" +
    "const float RING_SPEED = " + RING_SPEED.toFixed(1) + ";\n" +
    "const float RING_WIDTH = " + RING_WIDTH.toFixed(1) + ";\n" +
    "const float RING_WAVE = " + RING_WAVE.toFixed(4) + ";\n" +
    "const float RING_DECAY = " + RING_DECAY.toFixed(3) + ";\n" +
    "const float RING_PUSH = " + RING_PUSH.toFixed(1) + ";\n" +
    "\n" +
    "float ign(vec2 p, float f) { p += 5.588238 * mod(f, 64.0); return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y)); }\n" +
    "\n" +
    "vec3 scene(vec2 uv) { return texture(uField, clamp(uv, 0.0, 1.0)).rgb; }\n" +
    "\n" +
    "float near(vec2 p) { vec2 d = (p - uMouse) / (uPR * uReach); return uOn * exp(-dot(d, d)); }\n" +
    "\n" +
    "vec2 current(vec2 p, float t) {\n" +
    "  vec2 q = p + 0.2 * vec2(sin(p.y * 2.9 + t * 0.23), sin(p.x * 2.5 - t * 0.19));\n" +
    "  vec2 a = vec2(0.932, 0.362), b = vec2(-0.622, 0.783), c = vec2(0.249, 0.968);\n" +
    "  return 0.36 * cos(dot(q, a) * 9.0 - t * 0.6) * a\n" +
    "       + 0.22 * cos(dot(q, b) * 15.0 - t * 0.8 + 2.0) * b\n" +
    "       + 0.12 * cos(dot(q, c) * 22.0 - t * 1.05 + 4.1) * c;\n" +
    "}\n" +
    "\n" +
    "void main() {\n" +
    "  vec2 frag = gl_FragCoord.xy;\n" +
    "  vec2 uv = frag / uRes;\n" +
    "  vec2 css = uRes / uPR;\n" +
    "  float aspect = uRes.x / uRes.y;\n" +
    "  vec2 p = (frag - 0.5 * uRes) / uRes.y;\n" +
    "\n" +
    "  vec2 shift = current(p, uTime) * (CURRENT * uFlow) * vec2(1.0 / aspect, 1.0);\n" +
    "\n" +
    "  float w = near(frag);\n" +
    "  if (w > 1e-4) shift -= uVel / css * w * DRAG;\n" +
    "\n" +
    "  for (int i = 0; i < " + MAX_RIPPLES + "; i++) {\n" +
    "    if (i >= uRipN) break;\n" +
    "    vec4 r = uRip[i];\n" +
    "    vec2 dv = (frag - r.xy) / uPR;\n" +
    "    float dist = length(dv);\n" +
    "    float s = dist - RING_SPEED * r.z;\n" +
    "    float env = exp(-s * s / (RING_WIDTH * RING_WIDTH)) * exp(-RING_DECAY * r.z) * r.w * smoothstep(0.0, 0.2, r.z);\n" +
    "    shift += dv / max(dist, 1.0) * sin(s * RING_WAVE) * env * RING_PUSH / css;\n" +
    "  }\n" +
    "\n" +
    "  vec3 L = max(scene(uv + shift), 0.0);\n" +
    "\n" +
    "  vec3 dark = uBg + L * (1.0 - uBg);\n" +
    "  float strength = clamp(max(L.r, max(L.g, L.b)), 0.0, 1.0);\n" +
    "  vec3 paper = uBg * (1.0 - strength) + L * 0.96;\n" +
    "  vec3 col = mix(dark, paper, uPaper);\n" +
    "  col += (ign(frag, floor(uTime * 24.0)) - 0.5) / 255.0;\n" +
    "  o = vec4(clamp(col, 0.0, 1.0), 1.0);\n" +
    "}\n";

  var colorCache = new Map();

  function parseColor(input) {
    if (!input) return null;
    var key = String(input);
    if (colorCache.has(key)) return colorCache.get(key) || null;
    var s = key.trim();
    var v = s.match(/^var\(\s*--[^,]+,\s*(.+)\)$/);
    if (v) s = v[1].trim();
    var out = null;
    if (s.charAt(0) === "#") {
      var h = s.slice(1);
      if (h.length === 3 || h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      if (h.length >= 6) {
        var r = parseInt(h.slice(0, 2), 16);
        var g = parseInt(h.slice(2, 4), 16);
        var b = parseInt(h.slice(4, 6), 16);
        if (isFinite(r) && isFinite(g) && isFinite(b)) out = [r / 255, g / 255, b / 255];
      }
    } else {
      var m = s.match(/^(rgba?|hsla?)\(([^)]*)\)/i);
      if (m) {
        var parts = m[2].split(/[\s,/]+/).filter(Boolean);
        var f = function (i) { return parseFloat(parts[i]); };
        if (parts.length >= 3 && [0, 1, 2].every(function (i) { return isFinite(f(i)); })) {
          if (m[1].toLowerCase().indexOf("rgb") === 0) {
            var ch = function (i) { return parts[i].indexOf("%") === parts[i].length - 1 ? f(i) / 100 : f(i) / 255; };
            out = [ch(0), ch(1), ch(2)];
          } else {
            var hh = (((f(0) % 360) + 360) % 360) / 360;
            var ss = f(1) / 100;
            var ll = f(2) / 100;
            var q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
            var p = 2 * ll - q;
            var hue = function (t) {
              t = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
              if (t < 1 / 6) return p + (q - p) * 6 * t;
              if (t < 1 / 2) return q;
              if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
              return p;
            };
            out = [hue(hh + 1 / 3), hue(hh), hue(hh - 1 / 3)];
          }
          out = out.map(function (c) { return Math.min(1, Math.max(0, c)); });
        }
      }
    }
    colorCache.set(key, out);
    return out;
  }

  function color(input, fallback) {
    return parseColor(input) || parseColor(fallback);
  }

  function clampN(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function link(gl, frag, label) {
    function shader(type, src) {
      var sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(NAME + " " + label + " shader:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT_SRC);
    var fs = shader(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(NAME + " " + label + " link:", gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  }

  function locations(gl, prog, names) {
    var out = {};
    for (var i = 0; i < names.length; i++) out[names[i]] = gl.getUniformLocation(prog, names[i]);
    return out;
  }

  function fieldTarget(gl) {
    var fbo = gl.createFramebuffer();
    var tex = null;
    var w = 0;
    var h = 0;
    var half = !!gl.getExtension("EXT_color_buffer_float");
    return {
      fbo: fbo,
      texture: function () { return tex; },
      width: function () { return w; },
      height: function () { return h; },
      resize: function (nw, nh) {
        if (nw === w && nh === h && tex) return;
        for (var attempt = 0; attempt < 2; attempt++) {
          if (tex) gl.deleteTexture(tex);
          tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, half ? gl.RGBA16F : gl.RGBA8, nw, nh, 0, gl.RGBA, half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
          var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          if (ok || !half) break;
          half = false;
        }
        w = nw;
        h = nh;
      },
      dispose: function () {
        if (tex) gl.deleteTexture(tex);
        gl.deleteFramebuffer(fbo);
      },
    };
  }

  function trackPointer(root, onDown) {
    var p = { tx: 0, ty: 0, inside: false, seen: false };
    function read(e) {
      var r = root.getBoundingClientRect();
      var sx = root.offsetWidth / (r.width || 1);
      var sy = root.offsetHeight / (r.height || 1);
      p.tx = (e.clientX - r.left) * sx;
      p.ty = (e.clientY - r.top) * sy;
      p.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      p.seen = true;
    }
    function down(e) {
      read(e);
      if (p.inside && onDown) onDown(p.tx, p.ty);
    }
    function out(e) {
      if (!e.relatedTarget) p.inside = false;
    }
    window.addEventListener("pointermove", read, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerout", out);
    return {
      p: p,
      dispose: function () {
        window.removeEventListener("pointermove", read);
        window.removeEventListener("pointerdown", down);
        document.removeEventListener("pointerout", out);
      },
    };
  }

  // Site palette: near-black background, the site's orange accent
  // (#FE8457, used on header-role / the old particles) as color1,
  // and the purple from the contact-button gradient as color2.
  var DEFAULTS = {
    background: "#0C0C0C",
    color1: "#FE8457",
    color2: "#7621B0",
  };

  function init() {
    var root = document.getElementById("particles-container");
    if (!root) return;

    var canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    root.appendChild(canvas);

    var gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false });
    if (!gl) {
      console.error(NAME + ": WebGL2 unavailable");
      return;
    }

    // Matches the component's own defaults (speed/size/angle/flow/
    // ripple/hover/reach) — only the palette is site-specific.
    var raw = { speed: 50, size: 147, angle: 73, flow: 200, ripple: 200, hover: 100, reach: 300 };
    var v = {
      background: DEFAULTS.background,
      color1: DEFAULTS.color1,
      color2: DEFAULTS.color2,
      speed: clampN(raw.speed, 0, 100) / 50,
      size: clampN(raw.size, 50, 200) / 100,
      angle: (clampN(raw.angle, -180, 180) * Math.PI) / 180,
      flow: clampN(raw.flow, 0, 200) / 100,
      ripple: clampN(raw.ripple, 0, 200) / 100,
      hover: clampN(raw.hover, 0, 200) / 100,
      reach: clampN(raw.reach, 10, 800),
    };

    var field = link(gl, FIELD_SRC, "field");
    var finish = link(gl, FINISH_SRC, "finish");
    if (!field || !finish) return;
    var uf = locations(gl, field, ["uRes", "uTime", "uC1", "uC2", "uSize", "uAngle"]);
    var un = locations(gl, finish, ["uField", "uRes", "uTime", "uBg", "uPaper", "uPR", "uMouse", "uOn", "uReach", "uVel", "uRip", "uRipN", "uFlow"]);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    var target = fieldTarget(gl);

    var ripples = [];
    var RIP = new Float32Array(MAX_RIPPLES * 4);
    function addRipple(rp, click) {
      if (ripples.length >= MAX_RIPPLES) {
        var i = ripples.findIndex(function (q) { return q.life === WAKE_LIFE; });
        if (i < 0) {
          if (!click) return;
          i = 0;
        }
        ripples.splice(i, 1);
      }
      ripples.push(rp);
    }
    var pointer = trackPointer(root, function (x, y) {
      addRipple({ x: x, y: y, age: 0, amp: 1, life: CLICK_LIFE }, true);
    });
    var ptr = pointer.p;

    var mx = 0, my = 0, vx = 0, vy = 0, on = 0, raf = 0, last = -1, clock = 0, travel = 0, sinceWake = WAKE_GAP;

    function render(now) {
      raf = requestAnimationFrame(render);
      var dt = last < 0 ? 0 : clampN((now - last) / 1000, 0, 0.05);
      last = now;
      clock = (clock + dt * v.speed) % 3600;

      var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      var cw = canvas.clientWidth || 1200;
      var ch = canvas.clientHeight || 800;
      var bw = Math.max(1, Math.round(cw * dpr));
      var bh = Math.max(1, Math.round(ch * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      target.resize(Math.max(1, Math.round(bw / 2)), Math.max(1, Math.round(bh / 2)));

      var present = ptr.inside ? 1 : 0;
      if (present && on < 0.02) {
        mx = ptr.tx;
        my = ptr.ty;
      }
      on += (present - on) * (1 - Math.exp(-dt * 5));
      var k = 1 - Math.exp(-dt * 16);
      var nx = mx + (ptr.tx - mx) * k;
      var ny = my + (ptr.ty - my) * k;
      if (dt > 0) {
        var kv = 1 - Math.exp(-dt * 8);
        vx += ((nx - mx) / dt - vx) * kv;
        vy += ((ny - my) / dt - vy) * kv;
      }

      sinceWake += dt;
      if (present && v.hover > 0) {
        travel += Math.hypot(nx - mx, ny - my);
        if (travel >= WAKE_STEP && sinceWake >= WAKE_GAP) {
          addRipple({ x: nx, y: ny, age: 0, amp: WAKE_AMP * v.hover, life: WAKE_LIFE }, false);
          travel = 0;
          sinceWake = 0;
        }
      } else {
        travel = 0;
      }
      mx = nx;
      my = ny;
      var vLen = Math.hypot(vx, vy) / ch;
      var vCap = vLen > 3 ? 3 / vLen : 1;

      for (var i = ripples.length - 1; i >= 0; i--) {
        ripples[i].age += dt;
        if (ripples[i].age > ripples[i].life) ripples.splice(i, 1);
      }

      var c1 = color(v.color1, DEFAULTS.color1);
      var c2 = color(v.color2, DEFAULTS.color2);
      var bg = color(v.background, DEFAULTS.background);
      var bgLum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];

      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width(), target.height());
      gl.useProgram(field);
      gl.uniform2f(uf.uRes, target.width(), target.height());
      gl.uniform1f(uf.uTime, clock);
      gl.uniform3f(uf.uC1, c1[0], c1[1], c1[2]);
      gl.uniform3f(uf.uC2, c2[0], c2[1], c2[2]);
      gl.uniform1f(uf.uSize, v.size);
      gl.uniform1f(uf.uAngle, v.angle);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      var sx = bw / cw;
      var sy = bh / ch;
      var n = 0;
      if (v.ripple > 0) {
        for (var j = 0; j < ripples.length; j++) {
          var r = ripples[j];
          var t = clampN((r.age - (r.life - FADE_OUT)) / FADE_OUT, 0, 1);
          RIP[n * 4] = r.x * sx;
          RIP[n * 4 + 1] = bh - r.y * sy;
          RIP[n * 4 + 2] = r.age;
          RIP[n * 4 + 3] = r.amp * v.ripple * (1 - t * t * (3 - 2 * t));
          n++;
        }
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(finish);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, target.texture());
      gl.uniform1i(un.uField, 0);
      gl.uniform2f(un.uRes, bw, bh);
      gl.uniform1f(un.uTime, clock);
      gl.uniform3f(un.uBg, bg[0], bg[1], bg[2]);
      gl.uniform1f(un.uPaper, clampN((bgLum - 0.35) / 0.3, 0, 1));
      gl.uniform1f(un.uPR, sx);
      gl.uniform2f(un.uMouse, mx * sx, bh - my * sy);
      gl.uniform1f(un.uOn, on * v.hover);
      gl.uniform1f(un.uReach, v.reach);
      gl.uniform2f(un.uVel, vx * vCap, -vy * vCap);
      gl.uniform4fv(un.uRip, RIP);
      gl.uniform1i(un.uRipN, n);
      gl.uniform1f(un.uFlow, v.flow);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    raf = requestAnimationFrame(render);

    window.addEventListener("pagehide", function () {
      cancelAnimationFrame(raf);
      pointer.dispose();
      target.dispose();
      gl.deleteVertexArray(vao);
      gl.deleteProgram(field);
      gl.deleteProgram(finish);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
