import React from "react";
import { useEffect, useRef, useState } from "react";

const Pops = () => {
  const popfieldRef = useRef(null);
  const rafRef = useRef(0);
  const [pops, setPops] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const [ripples, setRipples] = useState([]);
  const audioCtxRef = useRef(null);
  const confettiRef = useRef([]);
  const lastTimeRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const ensureAudio = async () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    try { await ctx.resume(); } catch {}
    return ctx;
  };

  const playPop = async (size = 60) => {
    const ctx = await ensureAudio();
    if (!ctx) return;
    const duration = 0.09 + Math.random() * 0.02;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.4);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 800 + Math.random() * 900;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + duration + 0.01);
  };

  const rippleAt = (x, y, size = 60) => {
    const id = Math.random().toString(36).slice(2, 11);
    setRipples(prev => [...prev, { id, x, y, size }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 300);
  };

  const createPop = (offScreen = false) => {
    const id = Math.random().toString(36).slice(2, 11);
    const size = Math.random() * 50 + 30;
    const initialX = offScreen
      ? Math.random() > 0.5 ? -size : window.innerWidth + size
      : Math.random() * window.innerWidth;
    const initialY = offScreen
      ? Math.random() > 0.5 ? -size : window.innerHeight + size
      : Math.random() * window.innerHeight;
    const spin = Math.random() * 10 + 8;
    const pop = {
      id,
      size,
      x: initialX,
      y: initialY,
      spin,
      velocityX: (Math.random() * 2 - 1) * 0.2,
      velocityY: (Math.random() * 2 - 1) * 0.2,
      popped: false
    };
    setPops(prev => [...prev, pop]);
  };

  useEffect(() => {
    const popCount = 20;
    const spawnInterval = 2000;

    for (let i = 0; i < popCount; i++) createPop();

    const updatePositions = () => {
      setPops(prev =>
        prev.map(pop => {
          if (pop.popped) return pop;
          let newX = pop.x + pop.velocityX;
          let newY = pop.y + pop.velocityY;
          if (newX < 0) newX = window.innerWidth;
          if (newX > window.innerWidth) newX = 0;
          if (newY < 0) newY = window.innerHeight;
          if (newY > window.innerHeight) newY = 0;
          return { ...pop, x: newX, y: newY };
        })
      );
      rafRef.current = requestAnimationFrame(updatePositions);
    };
    rafRef.current = requestAnimationFrame(updatePositions);

    const intervalId = setInterval(() => createPop(true), spawnInterval);

    return () => {
      clearInterval(intervalId);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const burstAt = (x, y, size = 60) => {
    const count = 18;
    const born = Array.from({ length: count }, () => {
      const id = Math.random().toString(36).slice(2, 11);
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const psize = 2 + Math.random() * 3.5;
      const tint = Math.floor(180 + Math.random() * 80);
      const color = `hsla(${tint}, 90%, 85%, 0.9)`;
      return {
        id,
        x: x - psize / 2,
        y: y - psize / 2,
        vx,
        vy,
        size: psize,
        color,
        age: 0,
        life: 0.95 + Math.random() * 0.55,
        drag: 1.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        freq: 6 + Math.random() * 4,
        opacity: 1
      };
    });

    confettiRef.current.push(...born);
    setConfetti([...confettiRef.current]);
    if (!lastTimeRef.current) lastTimeRef.current = performance.now();

    const tick = (t) => {
      const prev = lastTimeRef.current || t;
      let dt = (t - prev) / 1000;
      lastTimeRef.current = t;
      if (dt > 0.033) dt = 0.033;

      const arr = confettiRef.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.age += dt;
        const u = Math.min(1, p.age / p.life);
        const g = lerp(-30, 380, easeOutCubic(u));
        p.vx *= Math.exp(-p.drag * dt);
        p.vy *= Math.exp(-p.drag * dt);
        const swirl = 28 * Math.sin(p.freq * p.age + p.phase);
        const breeze = 12;
        p.vx += (swirl + breeze) * dt;
        p.vy += g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.opacity = 1 - easeInCubic(Math.max(0, (p.age - p.life * 0.7) / (p.life * 0.3)));
        if (p.age >= p.life || p.opacity <= 0) {
          arr.splice(i, 1);
        }
      }

      if (mountedRef.current) setConfetti([...arr]);

      if (confettiRef.current.length > 0) {
        requestAnimationFrame(tick);
      } else {
        lastTimeRef.current = 0;
      }
    };

    requestAnimationFrame(tick);
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;

  return (
    <div ref={popfieldRef} className="pops-field">
      {pops.map(pop => (
        <div
          key={pop.id}
          className={`pops-bubble ${pop.popped ? "is-popped" : ""}`}
          style={{
            width: pop.size,
            height: pop.size,
            left: pop.x,
            top: pop.y,
            position: "absolute",
            borderRadius: "50%",
            ["--size"]: `${Math.round(pop.size)}px`,
            ["--spin"]: `${pop.spin}s`,
            zIndex: 2,
            cursor: "pointer",
            pointerEvents: "auto"
          }}
          onClick={ev => {
            ev.stopPropagation();
            const cx = pop.x + pop.size / 2;
            const cy = pop.y + pop.size / 2;
            setPops(prev => prev.map(p => (p.id === pop.id ? { ...p, popped: true } : p)));
            rippleAt(cx, cy, pop.size);
            burstAt(cx, cy, pop.size);
            playPop(pop.size);
            if (navigator.vibrate) { try { navigator.vibrate(8); } catch {} }
            setTimeout(() => {
              setPops(prev => prev.filter(p => p.id !== pop.id));
              createPop(true);
            }, 500);
          }}
        >
          <span className="highlight" />
        </div>
      ))}

      {ripples.map(r => (
        <div
          key={r.id}
          className="pops-ripple"
          style={{
            width: r.size,
            height: r.size,
            position: "absolute",
            left: r.x - r.size / 2,
            top: r.y - r.size / 2,
            ["--rsize"]: `${Math.round(r.size)}px`,
            animation: `ripple 260ms ease-out forwards`
          }}
        />
      ))}

      {confetti.map(p => (
        <div
          key={p.id}
          className="pops-confetti"
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            opacity: p.opacity,
            pointerEvents: "none",
            filter: "saturate(1.05) blur(0.2px)",
            boxShadow: "0 0 10px rgba(180, 220, 255, 0.35)"
          }}
        />
      ))}

      <style jsx>{`
        .pops-field {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }
        .pops-bubble {
          pointer-events: auto;
          will-change: transform, opacity;
          transform: translateZ(0);
          animation: floaty 4.5s ease-in-out infinite;
          overflow: hidden;
          clip-path: circle(50% at 50% 50%);
          background:
            radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 8%, rgba(255,255,255,0.15) 18%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.0) 55%),
            radial-gradient(circle at 70% 70%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.0) 70%);
          box-shadow:
            inset 0 0 25px rgba(255,255,255,0.3),
            inset 16px 16px 36px rgba(255,255,255,0.35),
            inset -18px -18px 36px rgba(0,0,0,0.16),
            0 10px 24px rgba(0,0,0,0.15),
            0 0 28px rgba(120,180,255,0.30);
          filter: saturate(1.12) contrast(1.02);
        }
        .pops-bubble::after {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 50%;
          pointer-events: none;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.35) 12%, rgba(255,255,255,0.0) 28%),
            radial-gradient(circle at 70% 70%, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.0) 50%);
          mix-blend-mode: screen;
        }
        .pops-bubble::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          background:
            conic-gradient(
              from 0deg,
              rgba(255, 0,   102, 0.10),
              rgba(255, 153,   0, 0.10),
              rgba(255, 255,   0, 0.10),
              rgba(  0, 255,   0, 0.10),
              rgba(  0, 204, 255, 0.10),
              rgba(102,   0, 255, 0.10),
              rgba(255,   0, 204, 0.10),
              rgba(255,   0,  102, 0.10)
            );
          filter: blur(0.8px);
          mix-blend-mode: screen;
          animation: film-rotate var(--spin, 12s) linear infinite;
          opacity: 0.7;
        }
        .pops-bubble .highlight {
          content: "";
          position: absolute;
          width: calc(var(--size, 60px) * 0.58);
          height: calc(var(--size, 60px) * 0.38);
          left: calc(var(--size, 60px) * 0.12);
          top: calc(var(--size, 60px) * 0.10);
          border-radius: 50% / 45%;
          background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0.0) 70%);
          transform: rotate(-18deg);
          filter: blur(0.6px);
          pointer-events: none;
        }
        .pops-bubble.is-popped {
          animation: pop-burst 160ms cubic-bezier(0.2, 0.7, 0.1, 1) forwards;
          transition: none !important;
          pointer-events: none;
          box-shadow: none;
        }
        .pops-bubble.is-popped::before,
        .pops-bubble.is-popped::after,
        .pops-bubble.is-popped .highlight { display: none; }
        .pops-confetti {
          pointer-events: none;
        }
        .pops-ripple {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 24px rgba(140, 200, 255, 0.35), inset 0 0 12px rgba(255,255,255,0.35);
          pointer-events: none;
          mix-blend-mode: screen;
        }
        @keyframes film-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floaty {
          0%, 100% { transform: translateZ(0) translateY(0); }
          50%      { transform: translateZ(0) translateY(-2px); }
        }
        @keyframes pop-burst {
          0%   { transform: translateZ(0) scale(1);    opacity: 1; }
          12%  { transform: translateZ(0) scale(1.06); opacity: 0.98; }
          38%  { transform: translateZ(0) scale(0.82); opacity: 0.85; }
          100% { transform: translateZ(0) scale(0);    opacity: 0; }
        }
        @keyframes ripple {
          0%   { transform: translateZ(0) scale(0.6); opacity: 0.65; }
          100% { transform: translateZ(0) scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Pops;
