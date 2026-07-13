/**
 * Ink pad — a small desk toy. Not related to the profile.
 * Click / drag on the paper to drip ink. Purely for fun.
 */
(function () {
  var canvas = document.getElementById("inkpad");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var drips = [];
  var drawing = false;
  var reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLORS = ["#7c2d12", "#141210", "#2c2825", "#9a3412", "#44403c"];

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintPaper(rect.width, rect.height);
  }

  function paintPaper(w, h) {
    ctx.fillStyle = "#f3efe6";
    ctx.fillRect(0, 0, w, h);
    // subtle grain lines
    ctx.strokeStyle = "rgba(20,18,16,0.04)";
    ctx.lineWidth = 1;
    for (var y = 0; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
  }

  function addDrip(x, y, force) {
    var r = force ? 10 + Math.random() * 18 : 4 + Math.random() * 10;
    drips.push({
      x: x,
      y: y,
      r: r * 0.25,
      max: r,
      life: 1,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      grow: 0.4 + Math.random() * 0.55
    });
  }

  function pointerPos(e) {
    var rect = canvas.getBoundingClientRect();
    var src = e.touches && e.touches[0] ? e.touches[0] : e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top
    };
  }

  function onDown(e) {
    e.preventDefault();
    drawing = true;
    var p = pointerPos(e);
    addDrip(p.x, p.y, true);
    // a few satellites
    for (var i = 0; i < 3; i++) {
      addDrip(p.x + (Math.random() - 0.5) * 28, p.y + (Math.random() - 0.5) * 28, false);
    }
  }

  function onMove(e) {
    if (!drawing) return;
    e.preventDefault();
    var p = pointerPos(e);
    if (Math.random() > 0.45) addDrip(p.x, p.y, false);
  }

  function onUp() {
    drawing = false;
  }

  function frame() {
    var rect = canvas.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;

    // soft fade of previous ink for motion (skip if reduced motion)
    if (!reduced) {
      ctx.fillStyle = "rgba(243,239,230,0.06)";
      ctx.fillRect(0, 0, w, h);
    }

    for (var i = drips.length - 1; i >= 0; i--) {
      var d = drips[i];
      d.r += (d.max - d.r) * d.grow * (reduced ? 1 : 0.15);
      d.life -= reduced ? 0.02 : 0.006;
      if (d.life <= 0) {
        drips.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = hexAlpha(d.color, Math.max(0, d.life * 0.55));
      ctx.arc(d.x, d.y, Math.max(0.5, d.r), 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  function hexAlpha(hex, a) {
    var h = hex.replace("#", "");
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  function clearPad() {
    var rect = canvas.getBoundingClientRect();
    drips = [];
    paintPaper(rect.width, rect.height);
  }

  function splash() {
    var rect = canvas.getBoundingClientRect();
    for (var i = 0; i < 12; i++) {
      addDrip(Math.random() * rect.width, Math.random() * rect.height, true);
    }
  }

  var clearBtn = document.getElementById("inkpadClear");
  var splashBtn = document.getElementById("inkpadSplash");
  if (clearBtn) clearBtn.addEventListener("click", clearPad);
  if (splashBtn) splashBtn.addEventListener("click", splash);

  canvas.addEventListener("mousedown", onDown);
  canvas.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onUp);
  window.addEventListener("resize", resize);

  resize();
  // starter blots so it isn't empty
  splash();
  requestAnimationFrame(frame);
})();
