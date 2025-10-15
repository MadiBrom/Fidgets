import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import "./Home.css";

const PALETTE = ["#71d15b", "#c7a859", "#6ecbff", "#b28dff", "#ff7ab6", "#ffd166"];
const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];
const clamp = (min, v, max) => Math.max(min, Math.min(v, max));

function Home() {
  const playRef = useRef(null);

  // overlay canvas for confetti bursts
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);

  // circles live in play-area coords
  const [circles, setCircles] = useState([]);
  const [spawnId, setSpawnId] = useState(null); // the current center “spawn circle”
  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 });

  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const isMobile = viewport.w < 640;
  const CIRCLE_SIZE = isMobile ? 72 : 100;

  // keep latest circles for window listeners
  const circlesRef = useRef(circles);
  useEffect(() => {
    circlesRef.current = circles;
  }, [circles]);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // confetti instance on fixed overlay canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeCanvas = () => {
      const c = canvasRef.current;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    confettiRef.current = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      confettiRef.current = null;
    };
  }, []);

  useEffect(() => {
    spawnCenterCircleAsSpawner(); // create the first center circle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spawnCenterCircleAsSpawner = () => {
    const rect = playRef.current?.getBoundingClientRect();
    const w = rect?.width ?? viewport.w;
    const h = rect?.height ?? viewport.h;

    const cx = (w - CIRCLE_SIZE) / 2;
    const cy = (h - CIRCLE_SIZE) / 2;

    const circle = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: clamp(8, cx, w - CIRCLE_SIZE - 8),
      y: clamp(8, cy, h - CIRCLE_SIZE - 8),
      color: pickColor(),      // color set once at creation
      size: CIRCLE_SIZE,
    };

    setCircles((prev) => [...prev, circle]);
    setSpawnId(circle.id);     // mark this one as the current spawn circle
  };

  // start drag
  const onPointerDown = (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = playRef.current?.getBoundingClientRect();
    if (!rect) return;

    const circle = circlesRef.current.find((c) => c.id === id);
    if (!circle) return;

    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    setDragOffset({ x: px - circle.x, y: py - circle.y });
    setDragId(id);
  };

  // global drag listeners so we never miss the drop
  useEffect(() => {
    if (!dragId) return;

    const handleMove = (e) => {
      const rect = playRef.current?.getBoundingClientRect();
      if (!rect) return;

      const w = rect.width;
      const h = rect.height;

      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const newX = clamp(8, px - dragOffset.x, w - CIRCLE_SIZE - 8);
      const newY = clamp(8, py - dragOffset.y, h - CIRCLE_SIZE - 8);

      setCircles((prev) =>
        prev.map((c) => (c.id === dragId ? { ...c, x: newX, y: newY } : c))
      );
    };

    const handleUp = () => {
      const rectPlay = playRef.current?.getBoundingClientRect();
      const circle = circlesRef.current.find((c) => c.id === dragId);

      if (rectPlay && circle && confettiRef.current) {
        // burst EXACT center of the dropped circle
        const centerWinX = rectPlay.left + circle.x + circle.size / 2;
        const centerWinY = rectPlay.top + circle.y + circle.size / 2;
        const originX = centerWinX / window.innerWidth;
        const originY = centerWinY / window.innerHeight;

        // slower, punchy burst + a few big chunks
        confettiRef.current({
          particleCount: isMobile ? 120 : 220,
          spread: 360,
          startVelocity: 20,
          gravity: 0.95,
          ticks: 240,
          scalar: 1,
          origin: { x: originX, y: originY },
          colors: PALETTE,
        });
        confettiRef.current({
          particleCount: isMobile ? 12 : 20,
          spread: 360,
          startVelocity: 36,
          gravity: 0.96,
          ticks: 250,
          scalar: 1.4,
          origin: { x: originX, y: originY },
          colors: PALETTE,
        });

        // Only create a NEW center spawn when the one you dropped was the spawn
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
  }, [dragId, dragOffset, CIRCLE_SIZE, isMobile, spawnId]);

  const handleMouseMoveTitle = (e) => {
    setGradientPosition({
      x: (e.clientX / viewport.w) * 100,
      y: (e.clientY / viewport.h) * 100,
    });
  };

  const resetBoard = () => {
    // wipe everything and create exactly one new center spawn
    setCircles([]);
    setSpawnId(null);
    // next tick to ensure state cleared before spawn
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
          zIndex: 5,
        }}
        aria-hidden="true"
      />

      <header className="hero">
        <h1
          className="title"
          onMouseMove={handleMouseMoveTitle}
          style={{ "--gx": `${gradientPosition.x}%`, "--gy": `${gradientPosition.y}%` }}
        >
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
        {circles.map((circle) => (
          <div
            key={circle.id}
            className="circle"
            onPointerDown={(e) => onPointerDown(e, circle.id)}
            style={{
              width: `${circle.size}px`,
              height: `${circle.size}px`,
              left: `${circle.x}px`,
              top: `${circle.y}px`,
              backgroundColor: circle.color, // stays fixed after spawn
              touchAction: "none",
            }}
          />
        ))}
      </main>
    </div>
  );
}

export default Home;
