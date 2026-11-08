/* ねむりひめRe:  /  shared scripts */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ *
   * Star field
   * ------------------------------------------------------------------ */
  const canvas = document.getElementById("stars");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let meteors = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = null;
    let lastSpawn = 0;

    const palette = [
      [255, 255, 255],
      [200, 182, 255],
      [233, 211, 161],
      [169, 214, 255],
    ];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(240, Math.max(90, Math.floor((width * height) / 8500)));
      stars = Array.from({ length: count }, () => {
        const c = palette[Math.floor(Math.random() * palette.length)];
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.25 + 0.25,
          base: Math.random() * 0.55 + 0.25,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.8 + 0.25,
          color: c,
          drift: (Math.random() - 0.5) * 0.02,
        };
      });
    }

    function drawStars(t) {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const twinkle = 0.62 + 0.38 * Math.sin(t * 0.001 * s.speed + s.phase);
        const alpha = s.base * twinkle;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (s.r > 1.05) {
          ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${alpha * 0.16})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function spawnMeteor() {
      const startX = Math.random() * width * 0.7 + width * 0.15;
      const startY = Math.random() * height * 0.35;
      meteors.push({
        x: startX,
        y: startY,
        vx: -(Math.random() * 2.2 + 2.4),
        vy: Math.random() * 1.2 + 0.7,
        life: 1,
        len: Math.random() * 70 + 70,
      });
    }

    function drawMeteors(dt) {
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt * 0.05;
        m.y += m.vy * dt * 0.05;
        m.life -= dt * 0.00035;

        if (m.life <= 0) {
          meteors.splice(i, 1);
          continue;
        }

        const nx = m.x - m.vx * 8;
        const ny = m.y - m.vy * 8;
        const grad = ctx.createLinearGradient(m.x, m.y, nx, ny);
        grad.addColorStop(0, `rgba(255, 248, 220, ${m.life * 0.85})`);
        grad.addColorStop(1, "rgba(255, 248, 220, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
    }

    let prev = performance.now();

    function frame(t) {
      const dt = Math.min(t - prev, 48);
      prev = t;
      drawStars(t);
      drawMeteors(dt);

      if (!reduceMotion && t - lastSpawn > 7000 + Math.random() * 6000) {
        lastSpawn = t;
        if (meteors.length < 2) spawnMeteor();
      }

      rafId = requestAnimationFrame(frame);
    }

    function start() {
      resize();
      if (reduceMotion) {
        drawStars(0);
      } else {
        rafId = requestAnimationFrame(frame);
      }
    }

    start();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reduceMotion) drawStars(0);
      }, 180);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!reduceMotion && !rafId) {
        prev = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Header scroll state
   * ------------------------------------------------------------------ */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * Mobile navigation
   * ------------------------------------------------------------------ */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    const closeNav = () => {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ------------------------------------------------------------------ *
   * Scroll reveal
   * ------------------------------------------------------------------ */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
      );
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* ------------------------------------------------------------------ *
   * Menu filter
   * ------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll("[data-filter]");
  const menuItems = document.querySelectorAll("[data-category]");
  if (filterBtns.length && menuItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
        menuItems.forEach((item) => {
          item.hidden = filter !== "all" && !item.dataset.category.split(" ").includes(filter);
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Footer year
   * ------------------------------------------------------------------ */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
