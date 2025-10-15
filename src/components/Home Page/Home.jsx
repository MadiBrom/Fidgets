import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import "./Home.css";

const PALETTE = ["#00F5FF", "#7DFF00", "#FF2E88", "#FFD400", "#6C3BFF"];
const CONFETTI = [
  "#00B3FF", "#FF00C3", "#1100ffff",
  "#a200ffff", "#d9ff00ff", "#00ff88ff", "#ff0000ff"
];

const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];
const clamp = (min, v, max) => Math.max(min, Math.min(v, max));
const nextPaletteColor = (current) => {
  const i = PALETTE.indexOf(current);
  return i >= 0 ? PALETTE[(i + 1) % PALETTE.length] : pickColor();
};

function Home() {
  const playRef = useRef(null);

  // overlay canvas for bursts
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);
  const fishTimersRef = useRef([]);
  const [spawnerColor, setSpawnerColor] = useState(pickColor());
  const spawnerTrackRef = useRef({ active: false, startX: 0, startY: 0, createdId: null });
  // custom fish canvas + system
  const fishCanvasRef = useRef(null);
  const fishCtxRef = useRef(null);
  const fishListRef = useRef([]); // array of fish particles
  const fishRafRef = useRef(0);

  // circles live in play-area coords
  const [circles, setCircles] = useState([]);
  const circlesRef = useRef(circles);
  useEffect(() => { circlesRef.current = circles; }, [circles]);

  // unified responsive circle size (spawner + placed)
  const responsiveSize = () => (window.innerWidth < 640 ? 72 : 100);
  const [circleSize, setCircleSize] = useState(responsiveSize());

  // drag state
  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  // title gradient with easing
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 });
  const targetPosRef = useRef({ x: 50, y: 50 });
  const rafRef = useRef(0);
  // tilt hover (mobile) and wind influence
  const tiltRef = useRef({ x: 0, y: 0 }); // normalized [-1,1]

  // viewport helpers
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  // unified size now updates with viewport

  // track viewport and re-clamp circles; update sizes to new responsive size
  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      // update responsive size and propagate to placed circles
      const newSize = responsiveSize();
      setCircleSize(prev => (prev !== newSize ? newSize : prev));
      // next frame so DOM has updated layout
      requestAnimationFrame(() => {
        const rect = playRef.current?.getBoundingClientRect();
        if (!rect) return;
        setCircles(prev =>
          prev.map(c => {
            const maxX = rect.width - newSize - 8;
            const maxY = rect.height - newSize - 8;
            return {
              ...c,
              size: newSize,
              x: clamp(8, c.x, Math.max(8, maxX)),
              y: clamp(8, c.y, Math.max(8, maxY)),
            };
          })
        );
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // confetti instance
  useEffect(() => {
    if (!canvasRef.current) return;
    confettiRef.current = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true
    });
    return () => { confettiRef.current = null; };
  }, []);

  // fish canvas setup + loop
  useEffect(() => {
    const cvs = fishCanvasRef.current;
    if (!cvs) return;

    const ctx = cvs.getContext("2d");
    fishCtxRef.current = ctx;

    const setupSize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      cvs.style.width = "100vw";
      cvs.style.height = "100dvh";
      cvs.width = Math.floor(window.innerWidth * dpr);
      cvs.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupSize();
    window.addEventListener("resize", setupSize);

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); // seconds, clamp to 50ms
      last = now;

      // clear fully so the screen never darkens
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      // draw fish (standard alpha, no additive blend)
      ctx.globalCompositeOperation = "source-over";
      const fish = fishListRef.current;
      for (let i = fish.length - 1; i >= 0; i--) {
        const f = fish[i];
        f.t += dt;

        // two-stage motion: explode then swim
        if (!f.swim && f.t >= f.explodeTime) {
          f.swim = true;
          f.speed = f.swimSpeed;
          // capture current heading as starting swim heading
          f.angle += 0; // no-op; keeps continuity
        }

        if (!f.swim) {
          // EXPLOSION PHASE: fast radial push with slight gravity/drag
          f.speed *= 1 - f.explodeDrag * dt;
          const windX = tiltRef.current.x * 30; // px/s from tilt
          const windY = tiltRef.current.y * 15;
          f.vx = Math.cos(f.angle) * f.speed + windX;
          f.vy = Math.sin(f.angle) * f.speed + f.explodeGravity * dt + windY;
        } else {
          // SWIM PHASE: oscillatory heading change + breeze
          const turn = Math.sin(f.t * f.freq + f.phase) * f.turnRate;
          f.angle += turn * dt;
          f.speed *= 1 - f.drag * dt;
          const windX = tiltRef.current.x * 40; // slightly stronger in swim
          const windY = tiltRef.current.y * 20;
          f.vx = Math.cos(f.angle) * f.speed + f.breezeX + windX;
          f.vy = Math.sin(f.angle) * f.speed + f.breezeY + f.gravity * dt + windY;
        }

        f.x += f.vx * dt;
        f.y += f.vy * dt;

        // life fade
        f.life -= dt;
        const alpha = Math.max(0, Math.min(1, f.life / f.maxLife)) * f.alpha;

        // cull offscreen or dead
        if (f.life <= 0 || f.x < -20 || f.y < -20 || f.x > window.innerWidth + 20 || f.y > window.innerHeight + 20) {
          fish.splice(i, 1);
          continue;
        }

        // draw spark
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      fishRafRef.current = requestAnimationFrame(loop);
    };
    fishRafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(fishRafRef.current);
      window.removeEventListener("resize", setupSize);
      fishListRef.current = [];
    };
  }, []);

  const spawnFlyingFishAt = (px, py, countHint) => {
    // viewport scaling
    const s = Math.min(1.25, Math.max(0.75, window.innerWidth / 1280));
    const base = countHint && countHint > 0 ? countHint : 52; // match pop by default
    const count = Math.max(10, Math.round(base * s)); // number of fish

    for (let i = 0; i < count; i++) {
      // explode: random ring with slight upward bias, but allow all directions
      const biasUp = Math.random() < 0.6;
      const baseAngleDeg = biasUp ? 240 + Math.random() * 100 : Math.random() * 360;
      const angle = (baseAngleDeg * Math.PI) / 180;

      // stronger radial kick so it clearly explodes before swimming
      const r0 = 12 + Math.random() * 18;
      const startX = px + Math.cos(angle) * r0;
      const startY = py + Math.sin(angle) * r0;

      // speeds: fast explode, then slower swim
      const explodeSpeed = 540 + Math.random() * 160; // px/s
      const swimSpeed = 180 + Math.random() * 120; // px/s
      const size = (0.9 + Math.random() * 0.6) * (s * 0.9 + 0.2);
      const maxLife = 0.7 + Math.random() * 0.35; // seconds: dissipate before confetti fades

      const fish = {
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        angle,
        speed: explodeSpeed,
        size,
        t: 0,
        maxLife,
        life: maxLife,
        // explosion timing then frantic swim
        explodeTime: 0.12 + Math.random() * 0.12,
        explodeGravity: 280 + Math.random() * 80,
        explodeDrag: 0.25 + Math.random() * 0.15,
        swim: false,
        swimSpeed,
        // more frantic swim: higher freq + turn
        freq: 8 + Math.random() * 7, // wiggles per second
        phase: Math.random() * Math.PI * 2,
        turnRate: 3.2 + Math.random() * 3.0, // radians/sec amplitude
        drag: 0.38 + Math.random() * 0.25,
        gravity: 120 + Math.random() * 50, // px/s^2 (applied scaled by dt)
        // breeze for diverging paths (tilt adds on top in loop)
        breezeX: (Math.random() * 60 - 30) * (0.5 + Math.random() * 0.7),
        breezeY: (Math.random() * 20 - 10) * 0.4,
        alpha: 0.95
      };
      fishListRef.current.push(fish);
    }
  };

  // clear any scheduled fish timers on unmount
  useEffect(() => {
    return () => {
      fishTimersRef.current.forEach(t => clearTimeout(t));
      fishTimersRef.current = [];
    };
  }, []);

  const launchFlyingFish = origin => {
    if (!confettiRef.current) return;

    // lightweight scaling for different viewport widths
    const s = Math.min(1.15, Math.max(0.85, window.innerWidth / 1280));

    const trails = 3 + Math.floor(Math.random() * 2); // 3-4 trails
    for (let t = 0; t < trails; t++) {
      // Upward-biased launch so fish swim up and away
      const roll = Math.random();
      const baseAngle = roll < 0.75 ? 260 + Math.random() * 50 : Math.random() * 360; // degrees
      const bend = 6 + Math.random() * 12; // slight turn
      const driftBase = (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.75);

      const pc = Math.max(5, Math.round(7 * s)); // particles per pulse
      const velBase = (24 + Math.random() * 8) * (0.9 + 0.2 * s);
      const ticksBase = Math.round(140 * (0.9 + 0.2 * s));

      const pulses = [
        { delay: 0 + t * 40, angle: baseAngle - bend * 0.6, velocity: velBase },
        { delay: 90 + t * 40, angle: baseAngle + bend * 0.6, velocity: velBase * 0.95 }
      ];

      pulses.forEach(p => {
        const timeout = setTimeout(() => {
          if (!confettiRef.current) return;
          confettiRef.current({
            particleCount: pc,
            spread: 6,
            angle: p.angle,
            startVelocity: p.velocity,
            gravity: 0.58,
            ticks: ticksBase,
            decay: 0.94,
            drift: driftBase,
            scalar: 0.24,
            origin,
            colors: ["#FFFFFF", "#FFF7D1", "#EAF6FF"],
            shapes: ["circle"]
          });
        }, p.delay);
        fishTimersRef.current.push(timeout);
      });

      // soft crackle at the end of the fish run
      const crackle = setTimeout(() => {
        if (!confettiRef.current) return;
        confettiRef.current({
          particleCount: Math.max(4, Math.round(6 * s)),
          spread: 22,
          angle: baseAngle,
          startVelocity: 18,
          gravity: 0.65,
          ticks: Math.round(80 * (0.9 + 0.2 * s)),
          decay: 0.92,
          drift: driftBase * 0.6,
          scalar: 0.22,
          origin,
          colors: ["#FFFFFF"],
          shapes: ["square"]
        });
      }, 220 + t * 40);
      fishTimersRef.current.push(crackle);
    }
  };

  const fireBurstAtCircleCenter = circle => {
    if (!confettiRef.current || !playRef.current || !circle) return;
    const rectPlay = playRef.current.getBoundingClientRect();
    const centerWinX = rectPlay.left + circle.x + circle.size / 2;
    const centerWinY = rectPlay.top + circle.y + circle.size / 2;

    const origin = {
      x: centerWinX / window.innerWidth,
      y: centerWinY / window.innerHeight
    };

    // estimate travel for a given velocity, decay, and ticks
    const estTravel = (v0, decay, ticks) =>
      v0 * (1 - Math.pow(decay, ticks)) / (1 - decay);

    // colorful burst reference
    const colorfulV = 20;
    const colorfulDecay = 0.9;
    const colorfulTicks = 240;
    const colorfulMax = estTravel(colorfulV, colorfulDecay, colorfulTicks);

    // solve ticks so sparks stay inside the colorful travel
    const solveTicks = (v0, decay, maxDist) => {
      const a = 1 - (maxDist * (1 - decay)) / v0;
      const clamped = Math.min(Math.max(a, 0.0001), 0.9999);
      return Math.max(6, Math.floor(Math.log(clamped) / Math.log(decay)));
    };

    // scale visual intensity with circle size, normalized per device class
    const baseSize = window.innerWidth < 640 ? 72 : 100;
    const sizeScale = clamp(0.8, circle.size / baseSize, 1.6);
    const c1 = Math.max(60, Math.round(120 * sizeScale));
    const c2 = Math.max(8, Math.round(14 * sizeScale));
    const scalar1 = 0.9 + 0.3 * sizeScale; // particle size
    const scalar2 = scalar1 * 1.2;
    const v = 18 + 3 * (sizeScale - 1);

    // colorful burst scaled
    confettiRef.current({
      particleCount: c1,
      spread: 360,
      startVelocity: v,
      gravity: 0.95,
      ticks: 240,
      scalar: scalar1,
      origin,
      colors: CONFETTI
    });
    confettiRef.current({
      particleCount: c2,
      spread: 360,
      startVelocity: v,
      gravity: 0.96,
      ticks: 240,
      scalar: scalar2,
      origin,
      colors: CONFETTI
    });

    // single-system white particles: explode first, then swim (count scaled)
    const fishBase = Math.max(28, Math.round(52 * sizeScale));
    spawnFlyingFishAt(centerWinX, centerWinY, fishBase);
  };

  // removed one-time center circle spawn; we render a persistent spawner instead

  // spawn a new draggable circle from the center spawner
  const onSpawnerPointerDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const rect = playRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    spawnerTrackRef.current = { active: true, startX, startY, createdId: null };

    const handleMove = (ev) => {
      if (!spawnerTrackRef.current.active || spawnerTrackRef.current.createdId) return;
      const dx = ev.clientX - spawnerTrackRef.current.startX;
      const dy = ev.clientY - spawnerTrackRef.current.startY;
      if (dx * dx + dy * dy < 36) return; // 6px threshold

      // Create a new circle at center and start dragging it
      const w = rect.width;
      const h = rect.height;
      const size = circleSize;
      const cx = (w - size) / 2;
      const cy = (h - size) / 2;
      const newCircle = {
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x: clamp(8, cx, w - size - 8),
        y: clamp(8, cy, h - size - 8),
        color: spawnerColor,
        size
      };
      spawnerTrackRef.current.createdId = newCircle.id;
      setCircles(prev => [...prev, newCircle]);
      // auto-advance spawner color for the next placement
      setSpawnerColor(prev => nextPaletteColor(prev));

      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      setDragOffset({ x: px - newCircle.x, y: py - newCircle.y });
      setDragId(newCircle.id);
      dragStartRef.current = { x: newCircle.x, y: newCircle.y };
    };

    const handleUp = () => {
      const tracker = spawnerTrackRef.current;
      if (tracker.active && !tracker.createdId) {
        // Treat as a click: explode at center
        const w = rect.width;
        const h = rect.height;
        const size = circleSize;
        const cx = (w - size) / 2;
        const cy = (h - size) / 2;
        const tempCircle = { x: cx, y: cy, size };
        fireBurstAtCircleCenter(tempCircle);
        // advance spawner color only when center is clicked (not when dragging)
        const idx = PALETTE.indexOf(spawnerColor);
        const next = idx >= 0 ? PALETTE[(idx + 1) % PALETTE.length] : pickColor();
        setSpawnerColor(next);
      }
      spawnerTrackRef.current = { active: false, startX: 0, startY: 0, createdId: null };
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  // start drag
  const onPointerDown = (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = playRef.current?.getBoundingClientRect();
    if (!rect) return;

    const circle = circlesRef.current.find(c => c.id === id);
    if (!circle) return;

    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    setDragOffset({ x: px - circle.x, y: py - circle.y });
    setDragId(id);
    // remember starting circle position to decide if it was a real drag
    dragStartRef.current = { x: circle.x, y: circle.y };
  };

  // global drag listeners
  useEffect(() => {
    if (!dragId) return;

    const handleMove = e => {
      const rect = playRef.current?.getBoundingClientRect();
      if (!rect) return;

      const c = circlesRef.current.find(cc => cc.id === dragId);
      if (!c) return;

      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // bounds use THIS circle's own size
      const minX = 8;
      const minY = 8;
      const maxX = rect.width - c.size - 8;
      const maxY = rect.height - c.size - 8;

      const newX = clamp(minX, px - dragOffset.x, Math.max(minX, maxX));
      const newY = clamp(minY, py - dragOffset.y, Math.max(minY, maxY));

      setCircles(prev => prev.map(ci => (ci.id === dragId ? { ...ci, x: newX, y: newY } : ci)));
    };

    const handleUp = () => {
      const circle = circlesRef.current.find(c => c.id === dragId);
      if (circle) {
        // Always explode on release of a circle (click or drag)
        fireBurstAtCircleCenter(circle);
      }
      setDragId(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragId, dragOffset]);

  // interactive title follow with easing
  useEffect(() => {
    const updateTarget = e => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      targetPosRef.current = { x, y };
    };
    window.addEventListener("pointermove", updateTarget, { passive: true });

    const animate = () => {
      setGradientPosition(prev => {
        const { x: tx, y: ty } = targetPosRef.current;
        const lerp = 0.15;
        return { x: prev.x + (tx - prev.x) * lerp, y: prev.y + (ty - prev.y) * lerp };
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", updateTarget);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // mobile tilt-as-hover (and slight wind influence for fish)
  useEffect(() => {
    const handleOrientation = (e) => {
      const beta = e.beta ?? 0;  // front/back [-90..90]
      const gamma = e.gamma ?? 0; // left/right [-90..90]
      const nx = Math.max(-1, Math.min(1, gamma / 45));
      const ny = Math.max(-1, Math.min(1, beta / 45));
      tiltRef.current = { x: nx, y: ny };
      const x = Math.max(0, Math.min(100, (nx * 0.5 + 0.5) * 100));
      const y = Math.max(0, Math.min(100, (ny * 0.5 + 0.5) * 100));
      targetPosRef.current = { x, y };
    };

    let listening = false;
    const start = async () => {
      try {
        if (
          typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res !== "granted") return;
        }
        window.addEventListener("deviceorientation", handleOrientation);
        listening = true;
      } catch {}
    };

    const onFirstTouch = () => {
      start();
      window.removeEventListener("touchstart", onFirstTouch);
    };
    window.addEventListener("touchstart", onFirstTouch, { once: true });

    return () => {
      if (listening) window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("touchstart", onFirstTouch);
    };
  }, []);

  const resetBoard = () => {
    setCircles([]);
  };

  return (
    <div className="home">
      {/* fixed overlay canvas for bursts */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          pointerEvents: "none",
          zIndex: 5
        }}
        aria-hidden="true"
      />

      {/* custom fish overlay canvas */}
      <canvas
        ref={fishCanvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100dvh",
          pointerEvents: "none",
          zIndex: 6
        }}
        aria-hidden="true"
      />

      <header className="hero">
        <h1 className="title" style={{ "--gx": `${gradientPosition.x}%`, "--gy": `${gradientPosition.y}%` }}>
          Interactive Fidget Playground
        </h1>
        <p className="subtitle">Tap, drag, explore</p>

        <div className="hud">
          <span>{circles.length} circles</span>
          <button className="btn" onClick={resetBoard} aria-label="Reset board">
            Reset
          </button>
        </div>
      </header>

      <main ref={playRef} className="play">
        {/* Persistent center spawner (non-draggable), always centered */}
        <div
          className="circle"
          onPointerDown={onSpawnerPointerDown}
          style={{
            width: `${circleSize}px`,
            height: `${circleSize}px`,
            left: `50%`,
            top: `50%`,
            transform: `translate(-50%, -50%)`,
            backgroundColor: spawnerColor,
            position: 'absolute',
            boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
            touchAction: 'none'
          }}
          aria-label="Center spawner"
        />

        {circles.map(circle => (
          <div
            key={circle.id}
            className="circle"
            onPointerDown={e => onPointerDown(e, circle.id)}
            style={{
              width: `${circle.size}px`,
              height: `${circle.size}px`,
              left: `${circle.x}px`,
              top: `${circle.y}px`,
              backgroundColor: circle.color,
              boxShadow: dragId === circle.id ? `0 0 12px ${circle.color}` : `0 4px 8px rgba(0,0,0,0.2)`,
              touchAction: "none"
            }}
          />
        ))}
      </main>
    </div>
  );
}

export default Home;
