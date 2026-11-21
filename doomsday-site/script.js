/* ================= PROJECT DOOMSDAY — CINEMATIC SCROLL ENGINE ================= */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Image loader: local file first, then OpenArt fallback ---------- */
  (function () {
    var BASE = "https://cdn.openart.ai/watermarked_images/Ek65ILTSaO2sOsYso6Gb/";
    var REMOTE = {
      sentinel: BASE + "thumbnail_69b9dc4f_1795228707137.webp",
      students: BASE + "thumbnail_99d83ffa_1795228704482.webp",
      burst: BASE + "thumbnail_57f719bb_1795228700444.webp"
    };
    var EXT = ["jpg", "jpeg", "png", "webp"];

    document.querySelectorAll("img[data-img]").forEach(function (img) {
      var name = img.getAttribute("data-img");
      var queue = EXT.map(function (e) { return "images/" + name + "." + e; });
      if (REMOTE[name]) queue.push(REMOTE[name]);
      function next() {
        if (!queue.length) { img.style.display = "none"; return; }
        img.src = queue.shift();
      }
      img.addEventListener("error", next);
      img.addEventListener("load", function () { img.classList.add("ready"); });
      next();
    });
  })();

  /* ---------- Background videos: autoplay, loop, reveal when ready ---------- */
  (function () {
    document.querySelectorAll("video.bg-video").forEach(function (v) {
      v.muted = true;
      function ready() { v.classList.add("ready"); }
      v.addEventListener("loadeddata", ready, { once: true });
      v.addEventListener("canplay", ready, { once: true });
      v.addEventListener("error", function () { v.style.display = "none"; });
      if (v.readyState >= 2) ready();
      var play = v.play();
      if (play && play.catch) play.catch(function () {});
    });
  })();

  /* ---------- Countdown to 12 Dec 2026, 10:15 AM IST ---------- */
  (function () {
    var target = new Date("2026-12-12T10:15:00+05:30").getTime();
    var d = document.getElementById("cd-d"),
        h = document.getElementById("cd-h"),
        m = document.getElementById("cd-m"),
        s = document.getElementById("cd-s"),
        note = document.getElementById("cd-note"),
        title = document.querySelector(".cd-title");
    function pad(n) { return String(n).padStart(2, "0"); }
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        d.textContent = h.textContent = m.textContent = s.textContent = "00";
        if (title) title.textContent = "DOOMSDAY IS HERE";
        if (note) note.textContent = "The event has begun. Good luck, heroes.";
        return;
      }
      var days = Math.floor(diff / 86400000);
      var hrs = Math.floor(diff % 86400000 / 3600000);
      var min = Math.floor(diff % 3600000 / 60000);
      var sec = Math.floor(diff % 60000 / 1000);
      d.textContent = pad(days);
      h.textContent = pad(hrs);
      m.textContent = pad(min);
      s.textContent = pad(sec);
      setTimeout(tick, 1000);
    }
    tick();
  })();

  /* ---------- Registration frame: show a note until src is set ---------- */
  (function () {
    var f = document.getElementById("regFrame");
    if (f && !f.getAttribute("src")) f.classList.add("empty");
  })();

  /* ---------- Reduced motion: show everything, skip the scroll engine ---------- */
  if (reduce) {
    var heroEl = document.querySelector(".hero");
    if (heroEl) heroEl.classList.add("loaded");
    document.querySelectorAll(".split-target,.reveal").forEach(function (e) { e.classList.add("in"); });
    return;
  }

  /* ---------- Split text into animated words ---------- */
  function split(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    var frag = document.createDocumentFragment();
    var i = 0;
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          var outer = document.createElement("span"); outer.className = "w";
          var inner = document.createElement("span"); inner.className = "wi";
          inner.textContent = w;
          inner.style.setProperty("--wd", (i++ * 45) + "ms");
          outer.appendChild(inner); frag.appendChild(outer);
        });
      } else if (node.nodeType === 1) {
        split(node); frag.appendChild(node);
      } else {
        frag.appendChild(document.createTextNode(node.textContent));
      }
    });
    el.innerHTML = "";
    el.appendChild(frag);
    el.classList.add("split-text");
  }
  document.querySelectorAll(".split-target").forEach(split);

  /* ---------- Scroll-triggered reveals with variants + stagger ---------- */
  var revealItems = [];
  function collect(sel, type, stagger) {
    document.querySelectorAll(sel).forEach(function (el, idx) {
      el.classList.add("reveal");
      if (type) el.setAttribute("data-rv", type);
      if (stagger) el.style.setProperty("--d", (idx * 90) + "ms");
      revealItems.push(el);
    });
  }
  collect(".about-img", "left", false);
  collect(".about-text > p, .about-text > .chips", "right", true);
  collect(".section .h2, .cd-title, .wide-cap h2", "up", false);
  collect(".lead", "up", false);
  collect(".strip-grid div", "scale", true);
  collect(".phase-grid .card", "up", true);
  collect(".act-grid .act", "up", true);
  collect(".tl li", "left", true);
  collect(".wide-cap p", "up", false);
  collect(".form-frame", "blur", false);

  function animateCount(el) {
    var raw = el.textContent.trim();
    var num = parseInt(raw, 10);
    if (isNaN(num)) return;
    var suffix = raw.replace(/[0-9]/g, "");
    var start = performance.now(), dur = 1400;
    function frame(t) {
      var p = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(num * e) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = raw;
    }
    requestAnimationFrame(frame);
  }

  var pendingReveals = revealItems.concat(Array.prototype.slice.call(document.querySelectorAll(".split-target")));
  function checkReveals() {
    for (var i = pendingReveals.length - 1; i >= 0; i--) {
      var el = pendingReveals[i];
      var r = el.getBoundingClientRect();
      if (r.top > vh * 0.94 || r.bottom < 0) continue;
      el.classList.add("in");
      if (el.matches(".strip-grid div")) {
        var b = el.querySelector("b");
        if (b) animateCount(b);
      }
      pendingReveals.splice(i, 1);
    }
  }

  /* ---------- Hero intro on load ---------- */
  window.addEventListener("load", function () {
    var hero = document.querySelector(".hero");
    if (hero) hero.classList.add("loaded");
    document.querySelectorAll(".hero .split-target").forEach(function (el) { el.classList.add("in"); });
    onScroll();
  });

  /* ---------- Chapter rail (scroll-spy) ---------- */
  var rail = document.querySelector(".chapter-rail");
  var sections = ["about", "activities", "schedule", "register"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var links = [];
  sections.forEach(function (sec) {
    var a = document.createElement("a");
    a.href = "#" + sec.id;
    a.title = sec.id.toUpperCase();
    a.setAttribute("aria-label", "Jump to " + sec.id);
    rail.appendChild(a);
    links.push(a);
  });
  function updateRail() {
    if (!rail) return;
    var active = 0;
    sections.forEach(function (sec, i) {
      if (sec.getBoundingClientRect().top <= vh * 0.4) active = i;
    });
    links.forEach(function (a, i) { a.classList.toggle("active", i === active); });
    rail.classList.toggle("show", scrollY > vh * 0.6);
  }

  /* ---------- Scroll-linked effects (single rAF loop) ---------- */
  var progress = document.querySelector(".scroll-progress span");
  var nav = document.querySelector(".nav");
  var hero = document.querySelector(".hero");
  var heroBg = document.querySelector(".hero-bg");
  var heroInner = document.querySelector(".hero-inner");
  var vignette = document.querySelector(".hero-vignette");
  var cue = document.querySelector(".scroll-cue");
  var tl = document.querySelector(".tl");
  var tlProgress = document.querySelector(".tl-progress");

  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]")).map(function (el) {
    return {
      el: el,
      speed: parseFloat(el.getAttribute("data-parallax")) || 0.15,
      base: el.tagName !== "IMG" ? 1 : (el.classList.contains("wide-panel-img") ? 1.28 : 1.22)
    };
  });

  var vh = window.innerHeight;
  var scrollY = window.pageYOffset || document.documentElement.scrollTop;
  var ticking = false;

  function render() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - vh;
    var p = max > 0 ? scrollY / max : 0;
    if (progress) progress.style.transform = "scaleX(" + p + ")";
    if (nav) nav.classList.toggle("scrolled", scrollY > 40);
    checkReveals();

    if (hero && scrollY < hero.offsetHeight * 1.25) {
      var hh = hero.offsetHeight;
      var hp = Math.min(1, scrollY / hh);
      if (heroBg) heroBg.style.transform = "translate3d(0," + (scrollY * 0.42) + "px,0) scale(" + (1 + hp * 0.28) + ")";
      if (heroInner) {
        heroInner.style.opacity = Math.max(0, 1 - hp * 1.5);
        heroInner.style.transform = "translate3d(0," + (-scrollY * 0.16) + "px,0) scale(" + (1 - hp * 0.14) + ")";
        heroInner.style.filter = "blur(" + (hp * 7) + "px)";
      }
      if (vignette) vignette.style.opacity = Math.min(1, hp * 1.3);
      if (cue) cue.style.opacity = Math.max(0, 1 - hp * 3);
    }

    parallaxEls.forEach(function (o) {
      var r = o.el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) return;
      var center = (r.top + r.height / 2 - vh / 2) / vh;
      var y = -center * o.speed * 170;
      o.el.style.transform = "translate3d(0," + y + "px,0) scale(" + o.base + ")";
    });

    if (tl && tlProgress) {
      var tr = tl.getBoundingClientRect();
      var total = tr.height || 1;
      var passed = Math.min(total, Math.max(0, vh * 0.65 - tr.top));
      tlProgress.style.transform = "scaleY(" + (passed / total) + ")";
    }

    updateRail();
  }

  function onScroll() {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { vh = window.innerHeight; onScroll(); });

  /* ---------- Subtle 3D tilt on cards ---------- */
  document.querySelectorAll(".card, .cd-box").forEach(function (card) {
    card.classList.add("tilt");
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
      var ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
      card.style.transform = "perspective(700px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
    });
    card.addEventListener("mouseleave", function () { card.style.transform = ""; });
  });

  /* ---------- Mobile burger menu ---------- */
  (function () {
    var b = document.getElementById("burger"),
        m = document.getElementById("mobileMenu");
    if (!b || !m) return;
    function close() {
      b.classList.remove("open");
      m.classList.remove("open");
      b.setAttribute("aria-expanded", "false");
      m.setAttribute("aria-hidden", "true");
    }
    b.addEventListener("click", function () {
      var open = !m.classList.contains("open");
      b.classList.toggle("open", open);
      m.classList.toggle("open", open);
      b.setAttribute("aria-expanded", open ? "true" : "false");
      m.setAttribute("aria-hidden", open ? "false" : "true");
    });
    m.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    document.addEventListener("click", function (e) {
      if (m.classList.contains("open") && !m.contains(e.target) && !b.contains(e.target)) close();
    });
  })();

  render();
})();
