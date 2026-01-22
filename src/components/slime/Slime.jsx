import React, { useEffect, useRef, useState } from "react";
import "./slime.css";

const Slime = () => {
  const playRef = useRef(null);
  const fieldRef = useRef(null);
  const canvasRef = useRef(null);

  const rafRef = useRef(0);
  const dataRef = useRef({ bubbles: [], rect: { width: 0, height: 0, left: 0, top: 0 } });

  const mouseRef = useRef({ x: 0, y: 0, active: false, down: false });

  const imprintsRef = useRef([]);
  const lastImprintT = useRef(0);

  const createAllRef = useRef(null);
  const [count, setCount] = useState(0);

  const makeConfig = () => {
    const isCoarse = typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches;
    const prefersReduce = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cfg = {
      BUBBLE_COUNT: 240,
      TIME_SCALE: 0.45,
      HOME_K: 0.002,
      POINTER_K_IDLE: 0.008,
      POINTER_K_DOWN: 0.02,
      DAMPING: 0.96,
      JITTER: 0.0006,
      RADIUS: 180,
      MIN_GAP: 70,
      MAX_SPEED: 0.7,

      PRESSURE_ADD_EVERY_MS: 18,
      PRESSURE_R_HOVER: 90,
      PRESSURE_R_DOWN: 140,
      PRESSURE_DECAY: 0.92,
      PRESSURE_K: 0.045,
      PRESSURE_SIGMA_SCALE: 0.6
    };

    if (isCoarse) {
      cfg.TIME_SCALE = 0.40;
      cfg.RADIUS = 220;
      cfg.MIN_GAP = 90;
      cfg.MAX_SPEED = 0.6;
    }
    if (prefersReduce) {
      cfg.TIME_SCALE *= 0.6;
      cfg.MAX_SPEED *= 0.7;
      cfg.JITTER *= 0.5;
    }
    return cfg;
  };

  const cfgRef = useRef(makeConfig());

  useEffect(() => {
    const m1 = matchMedia("(pointer: coarse)");
    const m2 = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { cfgRef.current = makeConfig(); };
    m1.addEventListener?.("change", update);
    m2.addEventListener?.("change", update);
    return () => {
      m1.removeEventListener?.("change", update);
      m2.removeEventListener?.("change", update);
    };
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const readRect = () => {
      const r = field.getBoundingClientRect();
      dataRef.current.rect = { width: r.width, height: r.height, left: r.left, top: r.top };
      const c = canvasRef.current;
      if (c) {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        c.width = Math.max(1, Math.floor(r.width * dpr));
        c.height = Math.max(1, Math.floor(r.height * dpr));
        c.style.width = `${r.width}px`;
        c.style.height = `${r.height}px`;
      }
    };

    readRect();
    let ro = null;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(readRect);
      ro.observe(field);
    } else {
      window.addEventListener("resize", readRect);
    }

    const createAll = () => {
      cancelAnimationFrame(rafRef.current);
      field.querySelectorAll(".bubble").forEach((b) => b.remove());
      dataRef.current.bubbles = [];
      imprintsRef.current = [];

      const frag = document.createDocumentFragment();
      const { width, height } = dataRef.current.rect;
      const { BUBBLE_COUNT } = cfgRef.current;

      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const el = document.createElement("div");
        el.className = "bubble";
        const size = 5 + Math.random() * 10;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;

        const x = Math.random() * width;
        const y = Math.random() * height;

        dataRef.current.bubbles.push({ el, x, y, vx: 0, vy: 0, size, homeX: x, homeY: y });
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        frag.appendChild(el);
      }

      field.appendChild(frag);
      setCount(dataRef.current.bubbles.length);

      let last = performance.now();
      const tick = (t) => {
        const dtMs = t - last;
        const dt = cfgRef.current.TIME_SCALE * Math.max(0.5, Math.min(1.2, dtMs / 16.6667));
        last = t;

        const { width, height } = dataRef.current.rect;
        const {
          HOME_K, POINTER_K_IDLE, POINTER_K_DOWN, DAMPING, JITTER,
          RADIUS, MIN_GAP, MAX_SPEED,
          PRESSURE_ADD_EVERY_MS, PRESSURE_R_HOVER, PRESSURE_R_DOWN,
          PRESSURE_DECAY, PRESSURE_K, PRESSURE_SIGMA_SCALE
        } = cfgRef.current;

        const mr = mouseRef.current;

        if (mr.active && t - lastImprintT.current >= PRESSURE_ADD_EVERY_MS) {
          const r = mr.down ? PRESSURE_R_DOWN : PRESSURE_R_HOVER;
          imprintsRef.current.push({ x: mr.x, y: mr.y, r, life: 1 });
          if (imprintsRef.current.length > 48) imprintsRef.current.shift();
          lastImprintT.current = t;
        }
        for (let i = imprintsRef.current.length - 1; i >= 0; i--) {
          const p = imprintsRef.current[i];
          p.life *= PRESSURE_DECAY;
          p.r *= 0.998;
          if (p.life < 0.05) imprintsRef.current.splice(i, 1);
        }

        for (const b of dataRef.current.bubbles) {
          let fx = 0;
          let fy = 0;

          fx += (Math.random() * 2 - 1) * JITTER;
          fy += (Math.random() * 2 - 1) * JITTER;

          fx += (b.homeX - b.x) * HOME_K;
          fy += (b.homeY - b.y) * HOME_K;

          if (mr.active) {
            const dx = mr.x - b.x;
            const dy = mr.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < RADIUS) {
              const t0 = Math.max(0, Math.min(1, (dist - MIN_GAP) / Math.max(1, RADIUS - MIN_GAP)));
              const soft = t0 * t0 * (3 - 2 * t0);
              const k = (mr.down ? POINTER_K_DOWN : POINTER_K_IDLE) * soft;
              fx += dx * k;
              fy += dy * k;
              if (dist < RADIUS && dist > MIN_GAP * 0.5) b.el.classList.add("attracted");
              else b.el.classList.remove("attracted");
            } else {
              b.el.classList.remove("attracted");
            }
          } else {
            b.el.classList.remove("attracted");
          }

          if (imprintsRef.current.length) {
            const n = imprintsRef.current.length;
            for (let i = n - 1; i >= Math.max(0, n - 8); i--) {
              const p = imprintsRef.current[i];
              const dx = b.x - p.x;
              const dy = b.y - p.y;
              const r = Math.max(8, p.r);
              const sigma = r * PRESSURE_SIGMA_SCALE;
              const invSigma2 = 1 / (sigma * sigma);
              const dist2 = dx * dx + dy * dy;
              const g = Math.exp(-dist2 * 0.5 * invSigma2);
              const k = PRESSURE_K * p.life * g * invSigma2;
              fx += dx * k;
              fy += dy * k;
            }
          }

          b.vx = (b.vx + fx * dt) * Math.pow(DAMPING, dt);
          b.vy = (b.vy + fy * dt) * Math.pow(DAMPING, dt);

          const sp = Math.hypot(b.vx, b.vy);
          if (sp > MAX_SPEED) {
            const s = MAX_SPEED / sp;
            b.vx *= s;
            b.vy *= s;
          }

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.4; }
          if (b.x > width - b.size) { b.x = width - b.size; b.vx = -Math.abs(b.vx) * 0.4; }
          if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy) * 0.4; }
          if (b.y > height - b.size) { b.y = height - b.size; b.vy = -Math.abs(b.vy) * 0.4; }

          b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
        }

        renderPressure();

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    const renderPressure = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const { width, height } = dataRef.current.rect;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const p of imprintsRef.current) {
        const r = p.r;

        ctx.globalCompositeOperation = "multiply";
        const rShadow = r * 0.95;
        const shadow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rShadow);
        shadow.addColorStop(0.0, `rgba(10, 20, 10, ${0.25 * p.life})`);
        shadow.addColorStop(1.0, `rgba(10, 20, 10, 0)`);
        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rShadow, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "screen";
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0.0, `rgba(180, 255, 210, ${0.25 * p.life})`);
        g.addColorStop(0.25, `rgba(140, 245, 190, ${0.18 * p.life})`);
        g.addColorStop(0.75, `rgba(113, 209, 91, ${0.10 * p.life})`);
        g.addColorStop(1.0, `rgba(113, 209, 91, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "lighter";
        const s = r * 0.25;
        const h = ctx.createRadialGradient(p.x + s * 0.15, p.y - s * 0.15, 0, p.x + s * 0.15, p.y - s * 0.15, s);
        h.addColorStop(0, `rgba(255,255,255, ${0.08 * p.life})`);
        h.addColorStop(1, `rgba(255,255,255, 0)`);
        ctx.fillStyle = h;
        ctx.beginPath();
        ctx.arc(p.x + s * 0.15, p.y - s * 0.15, s, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    createAllRef.current = createAll;
    createAll();

    const onPointerMove = (e) => {
      const r = dataRef.current.rect;
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;
      mouseRef.current.active = true;
    };
    const onPointerLeave = () => { mouseRef.current.active = false; };
    const onPointerDown = () => { mouseRef.current.down = true; mouseRef.current.active = true; };
    const onPointerUp = () => { mouseRef.current.down = false; };

    field.addEventListener("pointermove", onPointerMove);
    field.addEventListener("pointerleave", onPointerLeave);
    field.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      if (ro) ro.disconnect(); else window.removeEventListener("resize", readRect);
      cancelAnimationFrame(rafRef.current);
      dataRef.current.bubbles = [];
      field.removeEventListener("pointermove", onPointerMove);
      field.removeEventListener("pointerleave", onPointerLeave);
      field.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const reset = () => {
    if (createAllRef.current) createAllRef.current();
  };

  return (
    <div className="slime">
      <header className="slime-header">
        <h1 className="slime-title">Floating Glass Field</h1>
      </header>

      <main ref={playRef} className="slime-play">
        <div className="slime-hud" role="status" aria-live="polite">
          <div className="slime-hud-left" title="Bubble count">
            <span className="slime-hud-star" aria-hidden="true">●</span>
            <span className="slime-hud-count" aria-label={`Bubble count ${count}`}>{count}</span>
          </div>
          <button className="slime-icon-btn slime-reset-btn" onClick={reset} aria-label="Reset field">
            <span aria-hidden="true">↺</span>
          </button>
        </div>

        <div ref={fieldRef} className="slime-field" aria-hidden="false">
          <svg className="slime-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="slimeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1b4412"/>
                <stop offset="60%" stopColor="#2c671e"/>
                <stop offset="100%" stopColor="#0b0b0b"/>
              </linearGradient>
              <filter id="slimeNoise">
                <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="3" seed="7">
                  <animate attributeName="baseFrequency" dur="30s"
                    values="0.006 0.012;0.004 0.010;0.006 0.012" repeatCount="indefinite" />
                </feTurbulence>
                <feColorMatrix type="matrix" values="
                  0.3 0   0   0 0
                  0   0.9 0   0 0
                  0   0   0.4 0 0
                  0   0   0   0.8 0"/>
                <feGaussianBlur stdDeviation="0.6" />
              </filter>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#slimeGrad)" />
            <rect x="0" y="0" width="100" height="100" filter="url(#slimeNoise)" opacity="0.45" />
          </svg>

          <canvas ref={canvasRef} className="slime-canvas" />
        </div>
      </main>
    </div>
  );
};

export default Slime;
