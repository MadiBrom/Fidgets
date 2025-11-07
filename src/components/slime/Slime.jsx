import React, { useEffect, useRef, useState } from "react";
import "./slime.css";

const Slime = () => {
  const playRef = useRef(null);
  const fieldRef = useRef(null);
  const rafRef = useRef(0);
  const dataRef = useRef({ bubbles: [], rect: { width: 0, height: 0 } });
  const mouseRef = useRef({ x: 0, y: 0, active: false, down: false });
  const createAllRef = useRef(null);
  const [count, setCount] = useState(0);

  const BUBBLE_COUNT = 240;
  const HOME_K = 0.003;
  const POINTER_K_IDLE = 0.02;
  const POINTER_K_DOWN = 0.06;
  const DAMPING = 0.90;
  const JITTER = 0.002;
  const RADIUS = 140;
  const MIN_GAP = 110;      

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const readRect = () => {
      const r = field.getBoundingClientRect();
      dataRef.current.rect = { width: r.width, height: r.height, left: r.left, top: r.top };
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
      field.innerHTML = "";
      dataRef.current.bubbles = [];

      const frag = document.createDocumentFragment();
      const { width, height } = dataRef.current.rect;

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
        const dtFrames = Math.max(0.5, Math.min(2, dtMs / 16.6667));
        last = t;

        const { width, height } = dataRef.current.rect;
        const mr = mouseRef.current;

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

          b.vx = (b.vx + fx * dtFrames) * Math.pow(DAMPING, dtFrames);
          b.vy = (b.vy + fy * dtFrames) * Math.pow(DAMPING, dtFrames);

          const speed = Math.hypot(b.vx, b.vy);
          if (speed > MAX_SPEED) {
            const s = MAX_SPEED / speed;
            b.vx *= s;
            b.vy *= s;
          }

          b.x += b.vx * dtFrames;
          b.y += b.vy * dtFrames;

          if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.4; }
          if (b.x > width - b.size) { b.x = width - b.size; b.vx = -Math.abs(b.vx) * 0.4; }
          if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy) * 0.4; }
          if (b.y > height - b.size) { b.y = height - b.size; b.vy = -Math.abs(b.vy) * 0.4; }

          b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
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

        <div ref={fieldRef} className="slime-field" aria-hidden="false" />
      </main>
    </div>
  );
};

export default Slime;
