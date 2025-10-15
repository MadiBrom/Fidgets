import React, { useEffect, useState } from "react";
import "./buttons.css";

// Generate a rounded 5-point star path (normalized to 100x100 viewBox)
const roundedStarPath = ({ points = 5, outer = 48, inner = 26, round = 7 }) => {
  const cx = 50, cy = 50;
  const step = Math.PI / points;
  const verts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + i * step;
    verts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  const moveToward = (from, to, d) => {
    const vx = to.x - from.x;
    const vy = to.y - from.y;
    const len = Math.hypot(vx, vy) || 1;
    const nx = vx / len, ny = vy / len;
    return { x: from.x + nx * Math.min(d, len / 2), y: from.y + ny * Math.min(d, len / 2) };
  };

  let d = "";
  for (let i = 0; i < verts.length; i++) {
    const cur = verts[i];
    const prev = verts[(i - 1 + verts.length) % verts.length];
    const next = verts[(i + 1) % verts.length];
    const p1 = moveToward(cur, prev, round);
    const p2 = moveToward(cur, next, round);
    if (i === 0) {
      d += `M ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
    } else {
      d += `L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `;
      d += `Q ${cur.x.toFixed(2)} ${cur.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
    }
  }
  const cur = verts[0];
  const prev = verts[verts.length - 1];
  const next = verts[1];
  const p1 = moveToward(cur, prev, round);
  const p2 = moveToward(cur, next, round);
  d += `L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Q ${cur.x.toFixed(2)} ${cur.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
  return d;
};

const COLORS = [
  "#39ff14", "#ff073a", "#00ffff", "#ff00ff", "#ff5f1f",
  "#0afff1", "#f4f930", "#fe019a", "#adff2f",
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const getRandomPosition = () => ({
  top: Math.max(0, Math.random() * (window.innerHeight - 100)),
  left: Math.max(0, Math.random() * (window.innerWidth - 100)),
});

const Buttons = () => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: `star${i + 1}`,
      size: Math.floor(Math.random() * 50) + 50,
      color: getRandomColor(),
      position: getRandomPosition(),
      phase: "idle", // idle, out, in
      key: 0,        // bump to retrigger CSS animations
    }));
    setStars(generated);
  }, []);

  const handleClick = (id) => {
    // phase 1 spin out and fade
    setStars(prev => prev.map(s => s.id === id ? { ...s, phase: "out", key: s.key + 1 } : s));

    // after out animation, teleport and spin in
    setTimeout(() => {
      setStars(prev => prev.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          position: getRandomPosition(),
          phase: "in",
          key: s.key + 1,
        };
      }));
      // clear back to idle after spin in
      setTimeout(() => {
        setStars(prev => prev.map(s => s.id === id ? { ...s, phase: "idle" } : s));
      }, 600); // matches fade-in time
    }, 600);   // matches spin-out time
  };

  const d = roundedStarPath({ points: 5, outer: 48, inner: 30, round: 9 });

  return (
    <div className="shapes-container">
      {stars.map(star => (
// inside the map render
<button
  key={`${star.id}-${star.key}`}
  className={`shape-button ${star.phase === "out" ? "spin-out-fade" : ""} ${star.phase === "in" ? "fade-in-spin" : ""}`}
  onClick={() => handleClick(star.id)}
  style={{
    top: `${star.position.top}px`,
    left: `${star.position.left}px`,
    width: `${star.size}px`,
    height: `${star.size}px`,
    color: star.color,
  }}
  aria-label={star.id}
>
  <svg
    className="star-shape"
    viewBox="0 0 100 100"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <clipPath id={`${star.id}-clip`}>
        <path className="spin-geo" d={d} />
      </clipPath>
      <linearGradient id={`${star.id}-edge`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
        <stop offset="45%" stopColor="rgba(255,255,255,0.16)" />
        <stop offset="55%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </linearGradient>
      <radialGradient id={`${star.id}-hot`} gradientUnits="userSpaceOnUse" cx="34" cy="28" r="20">
        <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0.12)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>

    <path className="spin-geo" d={d} fill="currentColor" shapeRendering="geometricPrecision" />
    <rect width="100" height="100" fill={`url(#${star.id}-edge)`} clipPath={`url(#${star.id}-clip)`} style={{ mixBlendMode: "screen", opacity: 0.8 }} />
    <rect width="100" height="100" fill={`url(#${star.id}-hot)`}  clipPath={`url(#${star.id}-clip)`} style={{ mixBlendMode: "screen", opacity: 0.85 }} />
  </svg>
</button>
      ))}
    </div>
  );
};

export default Buttons;
