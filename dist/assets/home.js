/* home.js — coreografia da home (depende de fx.js, GSAP e ScrollTrigger). */
(function () {
  "use strict";
  var FX = window.FX;
  var doc = document.documentElement;
  if (!FX) return;

  var PRELOADER_MS = 2200;
  var MATTER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js";

  function endPreloader() {
    doc.classList.remove("fx-loading");
    try { sessionStorage.setItem("fx-seen", "1"); } catch (e) { /* storage bloqueado: só não lembra */ }
  }

  /* ---------- Texto dividido ---------- */
  var heroTitle = document.querySelector(".hero h1");
  var heroChars = FX.split(heroTitle, "chars");
  FX.repel(heroChars);
  document.querySelectorAll(".anime-text").forEach(function (el) { FX.repel(FX.split(el, "words")); });

  var heroLines = document.querySelectorAll(".hero .hb");

  if (FX.reduced || !FX.gsap) {
    endPreloader();
    heroLines.forEach(function (el) { el.style.opacity = 1; });
    FX.lazyVideos();
    initPhysicsWhenVisible(false);
    return;
  }

  /* ---------- Preloader + entrada da hero ---------- */
  var isLoading = doc.classList.contains("fx-loading");
  var tl = gsap.timeline({ delay: isLoading ? PRELOADER_MS / 1000 - 0.4 : 0.1 });
  if (isLoading) {
    tl.to(".screen-loading", { opacity: 0, filter: "blur(10px)", duration: 0.8, ease: "power4.out", onComplete: endPreloader });
  }
  tl.fromTo(heroLines, { opacity: 0, x: -100, filter: "blur(10px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 2, stagger: 0.25, ease: "power4.out" }, isLoading ? "-=0.5" : 0)
    .from(heroChars, { opacity: 0, x: -60, filter: "blur(10px)", duration: 2.4, stagger: 0.035, ease: "power4.out" }, "<0.2");

  var mm = gsap.matchMedia();

  /* ---------- Reveals no scroll (fade + deslocamento lateral + blur, scrub) ---------- */
  mm.add({ desktop: "(min-width: 961px)", mobile: "(max-width: 960px)" }, function (ctx) {
    var desktop = ctx.conditions.desktop;
    gsap.utils.toArray(".rv").forEach(function (el, i) {
      var dir = el.dataset.from || (i % 2 ? "right" : "left");
      var from = { opacity: 0, ease: "power2.out" };
      if (desktop) {
        from.x = dir === "right" ? 140 : dir === "up" ? 0 : -140;
        from.y = dir === "up" ? 100 : 0;
        from.filter = "blur(12px)";
      } else {
        from.y = 60;
        from.x = dir === "right" ? 30 : -30;
      }
      from.scrollTrigger = { trigger: el, start: "top 100%", end: "top 50%", scrub: 1.5 };
      gsap.from(el, from);
    });

    /* Hero: parallax em camadas (label lento, título médio, texto e CTAs rápidos) e vídeo aproximando */
    var heroScroll = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    var layers = [[".hero .label-line", -40], [".hero h1", -110], [".hero-desc", -170], [".hero-ctas", -230], [".hero .scroll-down", -60]];
    layers.forEach(function (l) {
      gsap.to(l[0], { y: desktop ? l[1] : l[1] * 0.5, ease: "none", scrollTrigger: heroScroll });
    });
    gsap.to(".hero-content", { opacity: 0, filter: desktop ? "blur(8px)" : "none", ease: "power1.in", scrollTrigger: heroScroll });
    gsap.to(".hero-video", { yPercent: 15, ease: "none", scrollTrigger: heroScroll });

    /* Manifesto: palavras acendem uma a uma conforme o scroll */
    var words = gsap.utils.toArray(".manifesto-text .word");
    if (words.length) {
      gsap.fromTo(words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.05, ease: "none",
        scrollTrigger: { trigger: ".manifesto-text", start: "top 85%", end: "bottom 35%", scrub: 1 }
      });
    }

    /* Cards das áreas: sobem em cascata com leve rotação */
    gsap.utils.toArray(".area-card").forEach(function (el, i) {
      gsap.fromTo(el, { y: desktop ? 160 : 60, rotate: desktop ? (i % 2 ? 4 : -4) : 0 }, {
        y: 0, rotate: 0, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 110%", end: "top 55%", scrub: 1.5 }
      });
    });

    /* Fundos com parallax */
    gsap.utils.toArray(".stack-bg img").forEach(function (el) {
      gsap.fromTo(el, { yPercent: -10, scale: 1.15 }, {
        yPercent: 10, ease: "none",
        scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* Lista de tecnologias entrando uma a uma da esquerda */
    gsap.utils.toArray(".stack-item").forEach(function (el) {
      gsap.from(el, {
        x: desktop ? -200 : -40, opacity: 0, filter: desktop ? "blur(10px)" : "none", ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 92%", end: "top 70%", scrub: 2 }
      });
    });

    /* Trabalhos: no desktop vira faixa horizontal fixada; no mobile, entrada lateral simples */
    var workSection = document.querySelector(".work-section");
    var track = workSection && workSection.querySelector("ul");
    if (desktop && track) {
      workSection.classList.add("is-horizontal");
      var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 96); };
      gsap.to(track, {
        x: function () { return -distance(); }, ease: "none",
        scrollTrigger: {
          trigger: workSection, start: "top top", end: function () { return "+=" + distance(); },
          pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: -1
        }
      });
      gsap.utils.toArray(".work-row").forEach(function (el, i) {
        gsap.from(el, { y: 80 + i * 30, rotate: 3, opacity: 0, ease: "power3.out",
          scrollTrigger: { trigger: workSection, start: "top 90%", end: "top 20%", scrub: 1.5 } });
      });
      return function () { workSection.classList.remove("is-horizontal"); };
    }
    gsap.utils.toArray(".work-row").forEach(function (el) {
      gsap.from(el, { x: -40, opacity: 0, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 95%", end: "top 65%", scrub: 2 } });
    });
  });

  /* ---------- Faixas gigantes que se encontram (pin só no desktop) ---------- */
  var bands = gsap.utils.toArray(".services-header");
  if (bands.length === 3) {
    mm.add("(min-width: 961px)", function () {
      ScrollTrigger.create({
        trigger: ".services", start: "top bottom", end: "top top", scrub: 1,
        onUpdate: function (self) {
          var p = self.progress * 40;
          gsap.set(bands[0], { xPercent: 40 - p });
          gsap.set(bands[1], { xPercent: -40 + p });
          gsap.set(bands[2], { xPercent: 40 - p });
        }
      });
      ScrollTrigger.create({
        trigger: ".services", start: "center center", end: function () { return "+=" + window.innerHeight * 1.5; },
        pin: true, scrub: 3, anticipatePin: 1,
        onUpdate: function (self) {
          var p = self.progress;
          if (p <= 0.5) {
            var y = (p / 0.5) * 100;
            gsap.set(bands[0], { yPercent: y, scale: 1 });
            gsap.set(bands[1], { scale: 1 });
            gsap.set(bands[2], { yPercent: -y, scale: 1 });
          } else {
            gsap.set(bands[0], { yPercent: 100 });
            gsap.set(bands[2], { yPercent: -100 });
            var scale = 1 - ((p - 0.5) / 0.5) * 0.4;
            bands.forEach(function (b) { gsap.set(b, { scale: scale }); });
          }
        }
      });
      return function () { gsap.set(bands, { clearProps: "all" }); };
    });
    mm.add("(max-width: 960px)", function () {
      bands.forEach(function (b, i) {
        gsap.fromTo(b, { xPercent: i === 1 ? -60 : 60, opacity: 0 }, {
          xPercent: 0, opacity: 1, ease: "none",
          scrollTrigger: { trigger: b, start: "top 95%", end: "top 55%", scrub: 1.5 }
        });
      });
      return function () { gsap.set(bands, { clearProps: "all" }); };
    });
  }

  FX.lazyVideos();
  initPhysicsWhenVisible(true);

  /* ---------- Pílulas com física no rodapé (Matter.js sob demanda) ---------- */
  function initPhysicsWhenVisible(animated) {
    var container = document.querySelector(".object-container");
    if (!container) return;
    if (!animated) { container.classList.add("is-static"); return; }
    ScrollTrigger.create({
      trigger: container, start: "top 85%", once: true,
      onEnter: function () {
        loadScript(MATTER_SRC).then(function () { initPhysics(container); })
          .catch(function () { container.classList.add("is-static"); });
      }
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.Matter) { resolve(); return; }
      var s = document.createElement("script");
      s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function initPhysics(container) {
    var M = window.Matter;
    var CFG = { restitution: 0.5, friction: 0.15, frictionAir: 0.02, density: 0.002, wall: 200, stiffness: 0.6, maxSpeed: 20 };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var engine = M.Engine.create();
    engine.gravity.y = 1;
    engine.positionIterations = 20;
    engine.velocityIterations = 16;

    var W = container.clientWidth, H = container.clientHeight, t = CFG.wall;
    var walls = [
      M.Bodies.rectangle(W / 2, H + t / 2, W + t * 2, t, { isStatic: true }),
      M.Bodies.rectangle(-t / 2, H / 2, t, H * 5, { isStatic: true }),
      M.Bodies.rectangle(W + t / 2, H / 2, t, H * 5, { isStatic: true })
    ];
    var objs = Array.prototype.map.call(container.querySelectorAll(".object"), function (el, i) {
      var w = el.offsetWidth, h = el.offsetHeight;
      var body = M.Bodies.rectangle(w / 2 + Math.random() * Math.max(1, W - w), -200 - i * 120, w, h, {
        restitution: CFG.restitution, friction: CFG.friction, frictionAir: CFG.frictionAir, density: CFG.density,
        angle: (Math.random() - 0.5) * Math.PI, chamfer: { radius: h / 2 }
      });
      return { el: el, body: body, w: w, h: h };
    });
    M.World.add(engine.world, walls.concat(objs.map(function (o) { return o.body; })));
    setTimeout(function () {
      M.World.add(engine.world, M.Bodies.rectangle(W / 2, -t / 2 - 40, W + t * 2, t, { isStatic: true }));
    }, 3500);

    if (FX.finePointer) {
      var mouse = M.Mouse.create(container);
      mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
      mouse.element.removeEventListener("wheel", mouse.mousewheel);
      var mc = M.MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: CFG.stiffness, render: { visible: false } } });
      M.World.add(engine.world, mc);
      M.Events.on(engine, "beforeUpdate", function () {
        var b = mc.body;
        if (!b) return;
        M.Body.setVelocity(b, { x: clamp(b.velocity.x, -CFG.maxSpeed, CFG.maxSpeed), y: clamp(b.velocity.y, -CFG.maxSpeed, CFG.maxSpeed) });
      });
      container.addEventListener("mouseleave", function () { mc.mouse.button = -1; mc.constraint.bodyB = null; });
      container.classList.add("is-draggable");
    }

    M.Runner.run(M.Runner.create(), engine);
    container.classList.add("is-live");

    var visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(container);
    (function loop() {
      if (visible) {
        objs.forEach(function (o) {
          var p = o.body.position;
          o.el.style.transform = "translate(" + clamp(p.x - o.w / 2, 0, W - o.w).toFixed(1) + "px," +
            clamp(p.y - o.h / 2, -o.h * 4, H - o.h).toFixed(1) + "px) rotate(" + o.body.angle.toFixed(3) + "rad)";
        });
      }
      requestAnimationFrame(loop);
    })();

    window.addEventListener("resize", function () {
      var nW = container.clientWidth, nH = container.clientHeight;
      if (Math.abs(nW - W) < 40 && Math.abs(nH - H) < 40) return;
      M.Body.setPosition(walls[0], { x: nW / 2, y: nH + t / 2 });
      M.Body.setPosition(walls[2], { x: nW + t / 2, y: nH / 2 });
      W = nW; H = nH;
    });
  }
})();
