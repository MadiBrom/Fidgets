import React from "react";
import { useEffect, useRef, useState } from "react";
import "./bubbles.css";

const Bubbles = () => {
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

  const playPop = async () => {
    const ctx = await ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const noiseDur = 0.035 + Math.random() * 0.015;
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDur), ctx.sampleRate);
    const n = noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n.length, 1.25);
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noise;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1600 + Math.random() * 1400;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600 + Math.random() * 1200;
    bp.Q.value = 1.2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(1.0, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    const f0 = 2200 + Math.random() * 800;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(900 + Math.random() * 200, now + 0.018);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(0.75, now + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-16, now);
    comp.knee.setValueAtTime(18, now);
    comp.ratio.setValueAtTime(6, now);
    comp.attack.setValueAtTime(0.002, now);
    comp.release.setValueAtTime(0.06, now);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.9, now);

    noiseSrc.connect(hp);
    hp.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(master);

    osc.connect(clickGain);
    clickGain.connect(master);

    master.connect(comp);
    comp.connect(ctx.destination);

    noiseSrc.start(now);
    noiseSrc.stop(now + noiseDur + 0.01);
    osc.start(now);
    osc.stop(now + 0.024);
  };

  const rippleAt = (x, y, size = 60) => {
    const id = Math.random().toString(36).slice(2, 11);
    setRipples(prev => [...prev, { id, x, y, size: size * 1.15 }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 220);
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
    const count = Math.round(18 + size * 0.14);
    const speedBase = 240 + Math.random() * 180 + size * 1.4;
    const born = Array.from({ length: count }, () => {
      const id = Math.random().toString(36).slice(2, 11);
      const angle = Math.random() * Math.PI * 2;
      const speed = speedBase * (0.82 + Math.random() * 0.36);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const psize = 2 + Math.random() * 3.5;
      const tint = Math.floor(180 + Math.random() * 80);
      const color = `hsla(${tint}, 90%, 85%, 0.95)`;
      return {
        id,
        x: x - psize / 2,
        y: y - psize / 2,
        vx,
        vy,
        size: psize,
        color,
        age: 0,
        life: 0.20 + Math.random() * 0.18,
        drag: 2.1 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        freq: 8 + Math.random() * 5,
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
        const g = -120 + 90 * easeOutCubic(u);
        p.vx *= Math.exp(-p.drag * dt);
        p.vy *= Math.exp(-p.drag * dt);
        const swirl = 26 * Math.sin(p.freq * p.age + p.phase);
        const breeze = 10;
        p.vx += (swirl + breeze) * dt;
        p.vy += g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const s = 0.9 + 0.3 * (1 - u);
        const fadeU = Math.max(0, (u - 0.3) / 0.7);
        p.opacity = 1 - easeInCubic(fadeU);
        p.scale = s;
        if (p.age >= p.life || p.opacity <= 0.03) arr.splice(i, 1);
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
            playPop();
            if (navigator.vibrate) { try { navigator.vibrate(8); } catch {} }
            setTimeout(() => {
              setPops(prev => prev.filter(p => p.id !== pop.id));
              createPop(true);
            }, 420);
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
            animation: `ripple 200ms ease-out forwards`
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
            transform: `translateZ(0) scale(${p.scale ?? 1})`,
            pointerEvents: "none",
            filter: "saturate(1.05) blur(0.2px)",
            boxShadow: "0 0 10px rgba(180, 220, 255, 0.35)"
          }}
        />
      ))}
    </div>
  );
};

export default Bubbles;
