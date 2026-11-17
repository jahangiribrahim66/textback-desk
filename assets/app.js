/* TextBack Desk — lightweight UI + simulated product demo. No dependencies, no network calls. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };

  /* ---------- Mobile navigation ---------- */
  var toggle = $(".nav-toggle"), nav = $("#site-nav");
  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setNav(false); toggle.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 820) setNav(false); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduced.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Card spotlight ---------- */
  $$(".card").forEach(function (c) {
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
    }, { passive: true });
  });

  /* ---------- Simulated conversation scripts (examples only) ---------- */
  var SCRIPTS = {
    hvac: {
      ai1: "Hi! Sorry we missed your call. How can we help you today?",
      c1: "I need AC repair. It's blowing warm air.",
      ai2: "Absolutely! What is your ZIP code?",
      c2: "75001",
      ai3: "Thanks! Your details are with the team and someone will call you back shortly. Reply STOP to opt out.",
      lead: "AC repair · ZIP 75001"
    },
    plumbing: {
      ai1: "Hi! Sorry we missed your call. How can we help you today?",
      c1: "Kitchen sink is leaking under the cabinet.",
      ai2: "Sorry to hear that! What is your ZIP code?",
      c2: "30301",
      ai3: "Thanks! Your details are with the team and someone will call you back shortly. Reply STOP to opt out.",
      lead: "Sink leak · ZIP 30301"
    },
    electrical: {
      ai1: "Hi! Sorry we missed your call. How can we help you today?",
      c1: "Half the outlets in my kitchen stopped working.",
      ai2: "Thanks for letting us know. What is your ZIP code?",
      c2: "85001",
      ai3: "Thanks! Your details are with the team and someone will call you back shortly. Reply STOP to opt out.",
      lead: "Outlets down · ZIP 85001"
    }
  };
  var trade = doc.body.getAttribute("data-trade") || "hvac";
  var script = SCRIPTS[trade] || SCRIPTS.hvac;

  function sleep(ms, tok) {
    return new Promise(function (res, rej) {
      setTimeout(function () { tok.cancelled ? rej(tok) : res(); }, ms);
    });
  }

  function Sim(el) {
    this.el = el;
    this.tok = { cancelled: false };
    this.running = false;
    this.q = function (r) { return $('[data-role="' + r + '"]', el); };
  }
  Sim.prototype.reset = function () {
    var call = this.q("call");
    call.setAttribute("data-s", "idle");
    this.q("callstate").textContent = "Waiting for calls";
    this.q("thread").innerHTML = "";
    this.q("lead").classList.remove("on");
    this.q("orb").classList.remove("busy");
    this.q("sub").textContent = "Watching your line";
    var rt = this.q("rt"); if (rt) rt.textContent = "Reply time: —";
  };
  Sim.prototype.bubble = function (who, text, meta) {
    var b = doc.createElement("div");
    b.className = "bubble " + who;
    b.appendChild(doc.createTextNode(text));
    if (meta) { var s = doc.createElement("small"); s.textContent = meta; b.appendChild(s); }
    this.q("thread").appendChild(b);
    return b;
  };
  Sim.prototype.typing = function (who) {
    var b = doc.createElement("div");
    b.className = "bubble " + who + " typing";
    b.setAttribute("aria-hidden", "true");
    b.innerHTML = "<i></i><i></i><i></i>";
    this.q("thread").appendChild(b);
    return b;
  };
  Sim.prototype.final = function () {
    /* Static completed state (reduced motion / no loop) */
    this.reset();
    this.q("call").setAttribute("data-s", "missed");
    this.q("callstate").textContent = "Missed call · 6:42 PM";
    this.bubble("ai", script.ai1, "Sent 28s after the missed call (demo)");
    this.bubble("cust", script.c1);
    this.bubble("ai", script.ai2);
    this.bubble("cust", script.c2);
    this.bubble("ai", script.ai3);
    this.q("lead").classList.add("on");
    this.q("lead-detail").textContent = script.lead + " (example)";
    var rt = this.q("rt"); if (rt) rt.textContent = "Reply time: 0:28 (demo)";
  };
  Sim.prototype.play = async function (opts) {
    opts = opts || {};
    if (this.running) return;
    if (reduced.matches) { this.final(); if (opts.onDone) opts.onDone(); return; }
    this.running = true;
    this.tok = { cancelled: false };
    var t = this.tok, self = this, pace = opts.fast ? 0.8 : 1;
    var w = function (ms) { return sleep(ms * pace, t); };
    try {
      do {
        this.reset();
        await w(opts.first ? 600 : 900);
        var call = this.q("call");
        call.setAttribute("data-s", "ringing");
        this.q("callstate").textContent = "Incoming call…";
        await w(2000);
        call.setAttribute("data-s", "missed");
        this.q("callstate").textContent = "Missed call · 6:42 PM";
        await w(800);
        this.q("sub").textContent = "Responding to call";
        this.q("orb").classList.add("busy");
        var ty = this.typing("ai"); await w(1300); ty.remove();
        this.bubble("ai", script.ai1, "Sent 28s after the missed call (demo)");
        var rt = this.q("rt"); if (rt) rt.textContent = "Reply time: 0:28 (demo)";
        await w(1500);
        ty = this.typing("cust"); await w(1100); ty.remove();
        this.bubble("cust", script.c1);
        await w(900);
        ty = this.typing("ai"); await w(1200); ty.remove();
        this.bubble("ai", script.ai2);
        await w(1300);
        ty = this.typing("cust"); await w(800); ty.remove();
        this.bubble("cust", script.c2);
        await w(900);
        ty = this.typing("ai"); await w(1200); ty.remove();
        this.bubble("ai", script.ai3);
        await w(700);
        this.q("orb").classList.remove("busy");
        this.q("sub").textContent = "Lead captured";
        this.q("lead-detail").textContent = script.lead + " (example)";
        this.q("lead").classList.add("on");
        await w(opts.loop ? 5200 : 0);
      } while (opts.loop);
    } catch (e) { if (this.tok !== t) return; /* superseded by a newer run */ }
    this.running = false;
    if (opts.onDone && !t.cancelled) opts.onDone();
  };
  Sim.prototype.stop = function () { this.tok.cancelled = true; this.running = false; };

  /* Hero: loops while visible */
  var heroEl = $("#hero-sim");
  if (heroEl) {
    var hero = new Sim(heroEl);
    if (reduced.matches) { hero.final(); }
    else {
      hero.reset();
      var visible = true, firstRun = true;
      var start = function () { if (visible && !doc.hidden && !hero.running) { hero.play({ loop: true, first: firstRun }); firstRun = false; } };
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          visible = en[0].isIntersecting;
          visible ? start() : hero.stop();
        }, { threshold: 0.15 }).observe(heroEl);
      } else { start(); }
      doc.addEventListener("visibilitychange", function () { doc.hidden ? hero.stop() : start(); });
    }
  }

  /* Demo section: runs on click */
  var demoEl = $("#demo-sim"), btn = $("#sim-btn");
  if (demoEl && btn) {
    var demo = new Sim(demoEl);
    demo.reset();
    demo.q("thread").innerHTML = '<p class="hint">Press \u201cSimulate Missed Call\u201d to watch an example conversation.</p>';
    var idle = btn.innerHTML;
    btn.addEventListener("click", function () {
      if (demo.running) return;
      btn.disabled = true;
      btn.querySelector("span").textContent = "Simulating…";
      demo.play({
        fast: true,
        onDone: function () {
          btn.disabled = false;
          btn.innerHTML = idle;
          btn.querySelector("span").textContent = "Run it again";
        }
      });
    });
  }

  /* ---------- Subtle particles (paused when off-screen, off for reduced motion) ---------- */
  var cv = $("#particles");
  if (cv && !reduced.matches && cv.getContext) {
    var ctx = cv.getContext("2d"), pts = [], W = 0, H = 0, raf = 0, on = false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var size = function () {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(46, Math.max(14, W / 30)));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .4, vx: (Math.random() - .5) * .16, vy: -Math.random() * .22 - .04, a: Math.random() * .5 + .2 });
    };
    var frame = function () {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -4) p.x = W + 4; if (p.x > W + 4) p.x = -4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = "rgba(150,170,255," + p.a + ")"; ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    var run = function (v) { if (v && !on) { on = true; raf = requestAnimationFrame(frame); } else if (!v && on) { on = false; cancelAnimationFrame(raf); } };
    size();
    var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(size, 200); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { run(e[0].isIntersecting && !doc.hidden); }).observe(cv);
    else run(true);
    doc.addEventListener("visibilitychange", function () { run(!doc.hidden); });
  }

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
