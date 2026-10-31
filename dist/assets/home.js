/* home.js — coreografia da home (depende de fx.js, GSAP e ScrollTrigger). */
(function () {
  "use strict";
  var FX = window.FX;
  var doc = document.documentElement;
  if (!FX) return;

  var PRELOADER_MIN_S = 2.2;   // tempo mínimo para o giro do logo terminar
  var PRELOADER_MAX_S = 4.5;   // não segura o conteúdo além disso, mesmo sem o load completo
  var MATTER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js";

  function endPreloader() {
    doc.classList.remove("fx-loading");
    try { sessionStorage.setItem("fx-seen", "1"); } catch (e) { /* storage bloqueado: só não lembra */ }
  }

  /* ---------- Texto dividido ---------- */
  var heroTitle = document.querySelector(".hero h1");
  var heroChars = FX.split(heroTitle, "chars");
  FX.repel(heroChars);
  // Manifesto e "Sobre": só divididos em palavras (para o scroll), sem reação ao mouse — mantém o texto legível
  document.querySelectorAll(".anime-text").forEach(function (el) { FX.split(el, "words"); });

  var heroLines = document.querySelectorAll(".hero .hb");
  FX.ensurePlay(document.querySelector(".hero-video"));

  /* Holofote HUD da hero segue o mouse (só desktop com mouse) */
  var hero = document.querySelector(".hero");
  if (hero && !FX.finePointer && FX.gsap && !FX.reduced) {
    hero.classList.add("is-ambient");
    gsap.fromTo(hero, { "--mx": "15%", "--my": "35%" }, { "--mx": "85%", "--my": "60%", duration: 7, ease: "sine.inOut", repeat: -1, yoyo: true });
  }
  if (hero && FX.finePointer) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
      hero.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  if (FX.reduced || !FX.gsap) {
    endPreloader();
    heroLines.forEach(function (el) { el.style.opacity = 1; });
    FX.lazyVideos();
    initPhysicsWhenVisible(false);
    return;
  }

  /* ---------- Preloader + entrada da hero ---------- */
  var isLoading = doc.classList.contains("fx-loading");
  var tl = gsap.timeline({ paused: true });
  tl.fromTo(heroLines, { opacity: 0, x: -100, filter: "blur(10px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 2, stagger: 0.25, ease: "power4.out" })
    .from(heroChars, { opacity: 0, x: -60, filter: "blur(10px)", duration: 2.4, stagger: 0.035, ease: "power4.out" }, "<0.2");

  // Toque (sem mouse para a lente): uma varredura de brilho percorre o título depois da entrada
  if (!FX.finePointer) {
    tl.to(heroChars, { "--heat": 1, duration: 0.35, stagger: 0.035, ease: "sine.out", yoyo: true, repeat: 1 }, ">-0.6");
  }

  if (isLoading) runPreloader(function () { tl.play(); });
  else tl.play();

  /* Tela de carregamento: logo desenhado, contagem segue o load real (com mínimo e teto), saída em cortina que já entrega a hero */
  function runPreloader(done) {
    var screen = document.querySelector(".screen-loading");
    var pct = screen.querySelector(".loader-pct");
    var state = { p: 0 };
    var render = function () {
      pct.textContent = ("00" + Math.round(state.p)).slice(-3);
      gsap.set(".ld-bar i", { scaleX: state.p / 100 });
    };
    gsap.timeline()
      .to(".ld-brace", { strokeDashoffset: 0, duration: 1.1, stagger: 0.12, ease: "power3.inOut" })
      .fromTo(".ld-rf", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, "-=0.45")
      .from(".ld-foot > *", { opacity: 0, y: 18, duration: 0.8, stagger: 0.1, ease: "expo.out" }, 0.2);
    var crawl = gsap.to(state, { p: 86, duration: PRELOADER_MIN_S + 0.8, ease: "power1.inOut", onUpdate: render });
    var started = performance.now();
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      var wait = Math.max(0, PRELOADER_MIN_S - (performance.now() - started) / 1000);
      crawl.kill();
      // a contagem até 100 ocupa o tempo que falta do mínimo, nunca salta
      gsap.timeline({ onComplete: endPreloader })
        .to(state, { p: 100, duration: Math.max(0.45, wait), ease: "power1.inOut", onUpdate: render })
        .to(".ld-mark, .ld-foot", { opacity: 0, y: -24, filter: "blur(8px)", duration: 0.55, ease: "power2.in" }, "+=0.15")
        .to(".ld-panel", { yPercent: -100, duration: 1.05, ease: "expo.inOut" }, "-=0.2")
        .add(done, "-=0.6");
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    setTimeout(finish, PRELOADER_MAX_S * 1000);
  }

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
        from.filter = "blur(6px)";
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

    /* Trabalhos: faixa horizontal fixada (desktop e mobile, só muda o tamanho dos cards) */
    var workSection = document.querySelector(".work-section");
    var track = workSection && workSection.querySelector("ul");
    if (track) {
      workSection.classList.add("is-horizontal");
      var edge = desktop ? 96 : 16;
      var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + edge); };
      gsap.to(track, {
        x: function () { return -distance(); }, ease: "none",
        scrollTrigger: {
          trigger: workSection, start: "top top", end: function () { return "+=" + distance() * 1.35; },
          pin: true, scrub: true, invalidateOnRefresh: true, refreshPriority: -1
        }
      });
      gsap.utils.toArray(".work-row").forEach(function (el, i) {
        gsap.from(el, { y: (desktop ? 60 : 30) + i * (desktop ? 20 : 10), opacity: 0, ease: "power3.out",
          scrollTrigger: { trigger: workSection, start: "top 90%", end: "top 30%", scrub: true } });
      });
      return function () { workSection.classList.remove("is-horizontal"); };
    }
    gsap.utils.toArray(".work-row").forEach(function (el) {
      gsap.from(el, { x: -40, opacity: 0, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 95%", end: "top 65%", scrub: 2 } });
    });
  });

  /* ---------- Faixas: seção fixa; palavras vêm de um zoom grande até encaixar, depois a página segue ---------- */
  var bands = gsap.utils.toArray(".services-header");
  if (bands.length) {
    mm.add({ desktop: "(min-width: 961px)", mobile: "(max-width: 960px)" }, function (ctx) {
      var desktop = ctx.conditions.desktop;
      var zoomFrom = function (i) {
        return { scale: desktop ? 3.2 : 2.2, opacity: 0, filter: "blur(16px)", xPercent: i % 2 ? 18 : -18 };
      };
      var zoomTo = { scale: 1, opacity: 1, filter: "blur(0px)", xPercent: 0, duration: 1, ease: "power3.out" };
      // A primeira faixa já começa a aproximar enquanto o carrossel de tecnologias ainda está saindo da tela
      gsap.fromTo(bands[0], zoomFrom(0), Object.assign({}, zoomTo, {
        scrollTrigger: { trigger: ".services", start: "top 92%", end: "center center", scrub: true }
      }));
      var tlBands = gsap.timeline({
        scrollTrigger: {
          trigger: ".services", start: "center center",
          end: function () { return "+=" + window.innerHeight * (desktop ? 1.1 : 0.8); },
          pin: true, scrub: true
        }
      });
      bands.slice(1).forEach(function (b, i) {
        tlBands.fromTo(b, zoomFrom(i + 1), zoomTo, i * 0.55);
      });
      tlBands.to({}, { duration: 0.35 }); // respiro com as palavras encaixadas antes de soltar o pin
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
    // IntersectionObserver não depende do refresh dos pins, que adiantava o disparo no desktop
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      loadScript(MATTER_SRC).then(function () { initPhysics(container); })
        .catch(function () { container.classList.add("is-static"); });
    }, { threshold: 0.5 });
    io.observe(container);
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
    var CFG = { restitution: 0.5, friction: 0.15, frictionAir: 0.02, density: 0.002, wall: 200, stiffness: 0.6, maxSpeed: 20, gap: 32 };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var engine = M.Engine.create();
    engine.gravity.y = 1;
    engine.positionIterations = 20;
    engine.velocityIterations = 16;

    var W = container.clientWidth, H = container.clientHeight, t = CFG.wall, g = CFG.gap; // g: folga para o brilho não ser cortado
    var makeWalls = function (w, h) {
      return [
        M.Bodies.rectangle(w / 2, h - g + t / 2, w + t * 2, t, { isStatic: true }),
        M.Bodies.rectangle(g - t / 2, h / 2, t, h * 5, { isStatic: true }),
        M.Bodies.rectangle(w - g + t / 2, h / 2, t, h * 5, { isStatic: true })
      ];
    };
    var walls = makeWalls(W, H);
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
    } else {
      container.classList.add("is-tappable");
      objs.forEach(function (o) {
        o.el.addEventListener("pointerdown", function () {
          M.Body.setVelocity(o.body, { x: (Math.random() - 0.5) * 8, y: -14 });
          M.Body.setAngularVelocity(o.body, (Math.random() - 0.5) * 0.3);
        });
      });
    }

    M.Runner.run(M.Runner.create(), engine);
    container.classList.add("is-live");

    var visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(container);
    (function loop() {
      if (visible) {
        objs.forEach(function (o) {
          var p = o.body.position;
          o.el.style.transform = "translate(" + clamp(p.x - o.w / 2, g, W - g - o.w).toFixed(1) + "px," +
            clamp(p.y - o.h / 2, -o.h * 4, H - g - o.h).toFixed(1) + "px) rotate(" + o.body.angle.toFixed(3) + "rad)";
        });
      }
      requestAnimationFrame(loop);
    })();

    // Janela mudou de tamanho (DevTools, maximizar): refaz paredes e reescala a posição das pílulas
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var nW = container.clientWidth, nH = container.clientHeight;
        if (Math.abs(nW - W) < 4 && Math.abs(nH - H) < 4) return;
        var sx = nW / W;
        M.World.remove(engine.world, walls);
        walls = makeWalls(nW, nH);
        M.World.add(engine.world, walls);
        objs.forEach(function (o) {
          var p = o.body.position;
          M.Body.setPosition(o.body, { x: clamp(p.x * sx, g + o.w / 2, nW - g - o.w / 2), y: Math.min(p.y, nH - g - o.h) });
          M.Body.setVelocity(o.body, { x: 0, y: 0 });
        });
        W = nW; H = nH;
      }, 150);
    });
  }
})();
