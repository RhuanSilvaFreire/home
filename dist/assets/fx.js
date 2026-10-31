/* fx.js — base compartilhada: Lenis + ScrollTrigger, header, âncoras, reveal, texto que reage ao mouse, vídeos lazy. */
(function () {
  "use strict";
  var doc = document.documentElement;
  // Decisão: efeitos de scroll rodam mesmo com prefers-reduced-motion; só preloader e loops infinitos respeitam a preferência (CSS).
  var REDUCED = false;
  var FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var HEADER_THRESHOLD = 120;
  var CURTAIN_MS = 320;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  var FX = { reduced: REDUCED, finePointer: FINE_POINTER, lenis: null, gsap: hasGsap };
  window.FX = FX;

  /* ---------- Smooth scroll (iniciado uma única vez) ---------- */
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!REDUCED && typeof window.Lenis !== "undefined") {
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    FX.lenis = lenis;
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }

  /* ---------- Indicador de progresso do scroll ---------- */
  var bar = document.createElement("div");
  bar.className = "fx-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var syncBar = function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0).toFixed(4) + ")";
  };
  window.addEventListener("scroll", syncBar, { passive: true });
  window.addEventListener("resize", syncBar);
  syncBar();

  /* ---------- Âncoras internas com Lenis ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"], a[href^="/#"]');
    if (!a) return;
    var href = a.getAttribute("href");
    if (href.indexOf("/#") === 0) {
      if (location.pathname !== "/") return;
      href = href.slice(1);
    }
    var target = href.length > 1 && document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    history.replaceState(null, "", href);
    if (!FX.lenis) { target.scrollIntoView({ behavior: "smooth" }); return; }
    var distance = Math.abs(target.getBoundingClientRect().top);
    // Perto: rola suave. Longe: atravessar pins e scrubs trava, então corta com um fade rápido.
    if (distance < window.innerHeight * 1.5) { FX.lenis.scrollTo(target, { offset: -40, duration: 1.2 }); return; }
    jumpWithCurtain(target);
  });

  var curtain = null;
  function jumpWithCurtain(target) {
    if (!curtain) {
      curtain = document.createElement("div");
      curtain.className = "fx-curtain";
      curtain.setAttribute("aria-hidden", "true");
      document.body.appendChild(curtain);
    }
    curtain.classList.add("is-on");
    setTimeout(function () {
      FX.lenis.scrollTo(target, { offset: -40, immediate: true, force: true });
      if (hasGsap) ScrollTrigger.update();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { curtain.classList.remove("is-on"); });
      });
    }, CURTAIN_MS);
  }

  /* ---------- Header: some no topo da hero, aparece após 120px ---------- */
  if (doc.hasAttribute("data-header-auto")) {
    var syncHeader = function () { doc.classList.toggle("fx-header-hide", window.scrollY < HEADER_THRESHOLD); };
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
  }

  /* ---------- Divisão de texto (acessível) ---------- */
  // Mantém a marcação interna (em, br, a); cada palavra vira um bloco sem quebra.
  // mode "chars" → .char por letra; mode "words" → .word por palavra.
  FX.split = function (el, mode) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = mode;
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var pieces = [];
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) { child.setAttribute("aria-hidden", "true"); walk(child); return; }
        if (child.nodeType !== 3 || !child.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (token) {
          if (!token) return;
          if (/^\s+$/.test(token)) { frag.appendChild(document.createTextNode(" ")); return; }
          var word = document.createElement("span");
          word.className = "word";
          word.setAttribute("aria-hidden", "true");
          if (mode === "chars") {
            Array.prototype.forEach.call(token, function (ch) {
              var c = document.createElement("span");
              c.className = "char";
              c.textContent = ch;
              word.appendChild(c);
              pieces.push(c);
            });
          } else {
            word.textContent = token;
            pieces.push(word);
          }
          frag.appendChild(word);
        });
        node.replaceChild(frag, child);
      });
    };
    walk(el);
    return pieces;
  };

  /* ---------- Lente HUD no texto: letras perto do cursor sobem um pouco e acendem (só desktop com mouse) ---------- */
  var RADIUS = 140, LIFT = 10, LERP = 0.12, EPSILON = 0.01;
  var repelItems = [];
  var mouse = { x: -9999, y: -9999 };
  var running = false;

  function measure() {
    repelItems.forEach(function (it) {
      var prev = it.el.style.translate;
      it.el.style.translate = "0px 0px";
      var r = it.el.getBoundingClientRect();
      it.ox = r.left + r.width / 2 + window.scrollX;
      it.oy = r.top + r.height / 2 + window.scrollY;
      it.el.style.translate = prev;
    });
  }

  function tick() {
    var moving = false;
    var px = mouse.x + window.scrollX, py = mouse.y + window.scrollY;
    repelItems.forEach(function (it) {
      var dist = Math.hypot(it.ox - px, it.oy - py);
      // curva suave (smoothstep): 1 no cursor, 0 na borda do raio
      var k = dist < RADIUS ? 1 - dist / RADIUS : 0;
      var target = k * k * (3 - 2 * k);
      it.h += (target - it.h) * LERP;
      if (Math.abs(it.h) < EPSILON && target === 0) {
        if (it.h !== 0) { it.h = 0; it.el.style.translate = ""; it.el.style.removeProperty("--heat"); }
        return;
      }
      moving = true;
      // "translate" (propriedade individual) compõe com o transform usado pelo GSAP
      it.el.style.translate = "0px " + (-it.h * LIFT).toFixed(2) + "px";
      it.el.style.setProperty("--heat", it.h.toFixed(3));
    });
    running = moving;
    if (moving) requestAnimationFrame(tick);
  }

  FX.repel = function (pieces) {
    if (REDUCED || !FINE_POINTER || !pieces.length) return;
    pieces.forEach(function (el) { repelItems.push({ el: el, ox: 0, oy: 0, h: 0 }); });
    if (repelItems.length === pieces.length) {
      document.addEventListener("mousemove", function (e) {
        mouse.x = e.clientX; mouse.y = e.clientY;
        if (!running) { running = true; requestAnimationFrame(tick); }
      }, { passive: true });
      document.addEventListener("mouseleave", function () { mouse.x = mouse.y = -9999; });
      window.addEventListener("resize", measure);
      window.addEventListener("load", measure);
      if (hasGsap) ScrollTrigger.addEventListener("refresh", measure);
    }
    setTimeout(measure, 100);
  };

  /* ---------- Reveal genérico das páginas internas ---------- */
  FX.autoReveal = function (selector) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    if (REDUCED || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("fx-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(els, function (el, i) {
      el.classList.add("fx-rv");
      el.style.transitionDelay = (i % 4) * 0.08 + "s";
      io.observe(el);
    });
  };

  /* ---------- Vídeos: só tocam perto da viewport ---------- */
  FX.lazyVideos = function () {
    var vids = document.querySelectorAll("video[data-lazy-play]");
    if (!vids.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (v.ended) return; // vídeos sem loop congelam no último quadro
          if (!v.src && v.dataset.src) v.src = v.dataset.src;
          v.play().catch(function () {});
        } else if (!v.ended) {
          v.pause();
        }
      });
    }, { threshold: 0.3 });
    // carrega antes de chegar na tela, para começar a tocar sem espera
    var preload = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (!en.isIntersecting || v.src || !v.dataset.src) return;
        v.preload = "auto";
        v.src = v.dataset.src;
        preload.unobserve(v);
      });
    }, { rootMargin: "800px 0px" });
    Array.prototype.forEach.call(vids, function (v) { preload.observe(v); io.observe(v); });
  };

  /* ---------- Autoplay bloqueado (economia de bateria/dados no celular): tenta de novo no 1º gesto ---------- */
  FX.ensurePlay = function (v) {
    if (!v) return;
    v.muted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    var tryPlay = function () { if (!v.ended && v.paused) v.play().catch(function () {}); };
    tryPlay();
    v.addEventListener("loadeddata", tryPlay, { once: true });
    ["touchstart", "pointerdown", "scroll", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, tryPlay, { once: true, passive: true });
    });
  };

  /* ---------- Páginas internas: aplica reveal e título com letras ---------- */
  if (!doc.hasAttribute("data-fx-home")) {
    var h1 = document.querySelector(".hero h1, .blog-header h1, main h1, h1");
    if (h1 && !REDUCED) {
      var chars = FX.split(h1, "words");
      FX.repel(chars);
      if (hasGsap) {
        gsap.from(chars, { opacity: 0, x: -60, filter: "blur(10px)", duration: 1.6, stagger: 0.06, ease: "power4.out" });
      }
    }
    FX.autoReveal([
      ".hero .eyebrow", ".hero-desc", ".meta-table", ".hero-img",
      ".content > h2", ".content > h3", ".content > p", ".content > ul", ".content > ol", ".content > pre", ".tags",
      ".impact-card", ".case-nav-link", ".grid-cell",
      "article > h2", "article > h3", "article > p", "article > pre", "article > ul",
      "main section > h2", "main section > p"
    ].join(","));
    FX.lazyVideos();
  }

  window.addEventListener("load", function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
