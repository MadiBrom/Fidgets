import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import "./Home.css";

const PALETTE = ["#71d15b", "#c7a859", "#6ecbff", "#b28dff", "#ff7ab6", "#ffd166"];
const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];
const clamp = (min, v, max) => Math.max(min, Math.min(v, max));

function Home() {
  const playRef = useRef(null);

  // overlay canvas for bursts
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);

  // circles live in play-area coords
  const [circles, setCircles] = useState([]);
  const circlesRef = useRef(circles);
  useEffect(() => { circlesRef.current = circles; }, [circles]);

  // current center spawn id
  const [spawnId, setSpawnId] = useState(null);

  // drag state
  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // title gradient with easing
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 });
  const targetPosRef = useRef({ x: 50, y: 50 });
  const rafRef = useRef(0);

  // viewport helpers
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  // lock the spawn size for this session so it never changes mid-game
  const spawnSizeRef = useRef(null);
  if (spawnSizeRef.current == null) {
    spawnSizeRef.current = window.innerWidth < 640 ? 72 : 100;
  }

  // track viewport and re-clamp circles inside new bounds without changing size
  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      // next frame so DOM has updated layout
      requestAnimationFrame(() => {
        const rect = playRef.current?.getBoundingClientRect();
        if (!rect) return;
        setCircles(prev =>
          prev.map(c => {
            const maxX = rect.width - c.size - 8;
            const maxY = rect.height - c.size - 8;
            return {
              ...c,
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

  // first center circle
  useEffect(() => {
    spawnCenterCircleAsSpawner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spawnCenterCircleAsSpawner = () => {
    const rect = playRef.current?.getBoundingClientRect();
    const w = rect?.width ?? viewport.w;
    const h = rect?.height ?? viewport.h;

    const size = spawnSizeRef.current; // locked for the whole session
    const cx = (w - size) / 2;
    const cy = (h - size) / 2;

    const circle = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: clamp(8, cx, w - size - 8),
      y: clamp(8, cy, h - size - 8),
      color: pickColor(),
      size
    };

    setCircles(prev => [...prev, circle]);
    setSpawnId(circle.id);
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

    const fireBurstAtCircleCenter = circle => {
      if (!confettiRef.current || !playRef.current || !circle) return;
      const rectPlay = playRef.current.getBoundingClientRect();
      const centerWinX = rectPlay.left + circle.x + circle.size / 2;
      const centerWinY = rectPlay.top + circle.y + circle.size / 2;

      const origin = {
        x: centerWinX / window.innerWidth,
        y: centerWinY / window.innerHeight
      };

      confettiRef.current({
        particleCount: 120,
        spread: 360,
        startVelocity: 20,
        gravity: 0.95,
        ticks: 240,
        scalar: 1,
        origin,
        colors: PALETTE
      });
      confettiRef.current({
        particleCount: 14,
        spread: 360,
        startVelocity: 20,
        gravity: 0.96,
        ticks: 240,
        scalar: 1.4,
        origin,
        colors: PALETTE
      });
    };

    const handleUp = () => {
      const circle = circlesRef.current.find(c => c.id === dragId);
      if (circle) {
        fireBurstAtCircleCenter(circle);
        if (dragId === spawnId) {
          spawnCenterCircleAsSpawner();
        }
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
  }, [dragId, dragOffset, spawnId]);

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

  const resetBoard = () => {
    setCircles([]);
    setSpawnId(null);
    requestAnimationFrame(() => {
      spawnCenterCircleAsSpawner();
    });
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
              touchAction: "none"
            }}
          />
        ))}
      </main>
    </div>
  );
}

export default Home;
