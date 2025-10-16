import React, { useEffect, useRef, useState } from "react";
import "./buttons.css";

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
  "#00FFFF", "#00E5FF", "#00D1FF", "#00FFC8", "#00FFEA",
  "#00B3FF", "#1A7CFF", "#3D5AFE", "#2E7DFF",
  "#6C3BFF", "#7A00FF", "#9D00FF", "#B300FF", "#B28DFF",
  "#FF00FF", "#FF00C8", "#FF2E88", "#FF77FF",
  "#ADFF2F", "#FF6B00"
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
const SAFE_TOP = () => (window.innerWidth <= 640 ? 96 : 56);
const EDGE_PAD = 8;
const getRandomPosition = () => ({
  top: Math.max(SAFE_TOP(), Math.random() * (window.innerHeight - 100 - SAFE_TOP())),
  left: Math.max(EDGE_PAD, Math.random() * (window.innerWidth - 100 - EDGE_PAD)),
});
const getRandomPositionForSize = (size) => {
  const safeTop = SAFE_TOP();
  const maxTop = Math.max(safeTop, window.innerHeight - size - EDGE_PAD);
  const maxLeft = Math.max(EDGE_PAD, window.innerWidth - size - EDGE_PAD);
  const top = safeTop + Math.random() * Math.max(0, maxTop - safeTop);
  const left = EDGE_PAD + Math.random() * Math.max(0, maxLeft - EDGE_PAD);
  return { top, left };
};

const Buttons = () => {
  const [stars, setStars] = useState([]);
  const timersRef = useRef(new Map()); 
  const [focusMode, setFocusMode] = useState(true);
  const [target, setTarget] = useState(30); 
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const completeTimerRef = useRef(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const breatherTimerRef = useRef(null);
  const countedRef = useRef(new Set());

  const [breathPhase, setBreathPhase] = useState("in"); 
  const [breathCount, setBreathCount] = useState(1);    
  const phaseTickRef = useRef(0);
  const [breatherStage, setBreatherStage] = useState("idle"); 
  const introTimeoutRef = useRef(null);
  const introWords = ["Take", "a", "breath"];
  const [introIndex, setIntroIndex] = useState(0);
  const introWordTimerRef = useRef(null);
  const [showGame, setShowGame] = useState(true);

  useEffect(() => {
    const vw = window.innerWidth;
    let count = 24;
    if (vw < 420) count = 20;
    else if (vw < 768) count = 26;
    else if (vw < 1200) count = 32;
    else count = 40;

    const generated = Array.from({ length: count }, (_, i) => {
      const size = Math.floor(Math.random() * 70) + 70;
      return {
        id: `star${i + 1}`,
        size,
        color: getRandomColor(),
        position: getRandomPositionForSize(size),
        phase: "idle",
        key: 0,
      };
    });
    setStars(generated);
  }, []);

  const handleClick = (id) => {
    if (paused) return; 
    if (countedRef.current.has(id)) return;
    const OUT_MS = 1000;
    const IN_MS = 1000;

  
    const t = timersRef.current.get(id);
    if (t) {
      if (t.toIn) clearTimeout(t.toIn);
      if (t.toIdle) clearTimeout(t.toIdle);
      timersRef.current.delete(id);
    }

    countedRef.current.add(id);

    setStars(prev => prev.map(s => s.id === id ? { ...s, phase: "out", key: s.key + 1 } : s));

    if (focusMode) {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= target) {
          setCompleted(true);
          if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
          completeTimerRef.current = setTimeout(() => setCompleted(false), 1200);
          setShowToast(true);
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => setShowToast(false), 2800);

          setPaused(true);
          setShowGame(false);
          setBreatherStage("intro");
          setIntroIndex(0);
          if (introWordTimerRef.current) clearInterval(introWordTimerRef.current);
          introWordTimerRef.current = setInterval(() => {
            setIntroIndex(prev => {
              if (prev >= introWords.length - 1) {
                clearInterval(introWordTimerRef.current);
                introWordTimerRef.current = null;
                if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
                introTimeoutRef.current = setTimeout(() => {
                  setBreatherStage("breathing");
                  setCountdown(24);
                  setBreathPhase("in");
                  phaseTickRef.current = 0;
                  if (breatherTimerRef.current) clearInterval(breatherTimerRef.current);
                  breatherTimerRef.current = setInterval(() => {
                    setCountdown(prevC => {
                      const nextC = prevC - 1;
                      phaseTickRef.current += 1;
                      if (phaseTickRef.current >= 4) {
                        phaseTickRef.current = 0;
                        setBreathPhase(p => (p === "in" ? "out" : "in"));
                      }
                      if (nextC <= 0) {
                        clearInterval(breatherTimerRef.current);
                        breatherTimerRef.current = null;
                        setPaused(false);
                        setBreatherStage("idle");
                        setShowGame(true);
                        countedRef.current.clear();
                        return 0;
                      }
                      return nextC;
                    });
                  }, 1000);
                }, 500);
                return prev; 
              }
              return prev + 1;
            });
          }, 500);
          return 0;
        }
        return next;
      });
    }

    const toIn = setTimeout(() => {
      setStars(prev => prev.map(s => s.id === id ? {
        ...s,
        position: getRandomPositionForSize(s.size),
        phase: "in",
        key: s.key + 1,
      } : s));

      const toIdle = setTimeout(() => {
        setStars(prev => prev.map(s => s.id === id ? { ...s, phase: "idle" } : s));
        countedRef.current.delete(id);
        timersRef.current.delete(id);
      }, IN_MS);
      timersRef.current.set(id, { toIn: null, toIdle });
    }, OUT_MS);

    timersRef.current.set(id, { toIn, toIdle: null });
  };

  useEffect(() => () => {
    timersRef.current.forEach(({ toIn, toIdle }) => {
      if (toIn) clearTimeout(toIn);
      if (toIdle) clearTimeout(toIdle);
    });
    timersRef.current.clear();
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    if (breatherTimerRef.current) clearInterval(breatherTimerRef.current);
    if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    if (introWordTimerRef.current) clearInterval(introWordTimerRef.current);
  }, []);

  const d = roundedStarPath({ points: 5, outer: 56, inner: 36, round: 14 });

  return (
    <div className="shapes-container">

      {!paused && (
      <div className="focus-hud" onClick={() => setFocusMode(f => !f)} role="button" aria-label="Toggle focus mode">
        <div className="hud-bar">
          <div className="hud-bar-fill" style={{ width: `${Math.min(100, (progress / target) * 100)}%` }} />
        </div>
        <span className="hud-label">{focusMode ? `${progress}/${target}` : "focus off"}</span>
      </div>
      )}
      {completed && <div className="completion-glow" aria-hidden="true" />}
      {paused && (
        <div className="breather-overlay" role="status" aria-live="polite">
          <div className="breather-pulse" aria-hidden="true" />
          <div className={`breather-fill ${breatherStage === 'breathing' ? breathPhase : ''}`} aria-hidden="true" />
          <div className={`breather-ring ${breatherStage === 'breathing' ? breathPhase : ''}`} aria-hidden="true" />
          <div className="breather-sub">
            {breatherStage === 'intro' ? introWords[introIndex] : `${breathPhase}`}
          </div>
        </div>
      )}
      {showGame && stars.map(star => (
        <button
          key={`${star.id}-${star.key}`}
          className={`shape-button ${star.phase === "out" ? "spin-out-fade" : ""} ${star.phase === "in" ? "fade-in-spin" : ""}`}
          onPointerDown={(e) => {
            e.currentTarget.style.pointerEvents = 'none';
            e.currentTarget.style.zIndex = '0';
            handleClick(star.id);
          }}
          style={{
            top: `${star.position.top}px`,
            left: `${star.position.left}px`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            color: star.color,
            pointerEvents: star.phase === "idle" ? "auto" : "none",
            zIndex: star.phase === "idle" ? 2 : 0
          }}
          aria-label={star.id}
        >
          <span
            className="lift-shadow"
            aria-hidden="true"
            style={{
              background: `radial-gradient(50% 60% at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0) 70%)`
            }}
          />
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
      <linearGradient id={`${star.id}-liftTop`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
        <stop offset="35%" stopColor="rgba(255,255,255,0.18)" />
        <stop offset="70%" stopColor="rgba(255,255,255,0.02)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <linearGradient id={`${star.id}-rim`} gradientUnits="userSpaceOnUse" x1="100" y1="100" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
        <stop offset="35%" stopColor="rgba(255,255,255,0.06)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <radialGradient id={`${star.id}-hot`} gradientUnits="userSpaceOnUse" cx="34" cy="28" r="20">
        <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
        <stop offset="60%" stopColor="rgba(255,255,255,0.12)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      <radialGradient id={`${star.id}-shade`} gradientUnits="userSpaceOnUse" cx="50" cy="50" r="48">
        <stop offset="0%" stopColor="rgba(0,0,0,0.22)" />
        <stop offset="70%" stopColor="rgba(0,0,0,0.10)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
    </defs>
    <path className="spin-geo" d={d} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="3" strokeLinejoin="round" pointerEvents="none"/>
    <path
      className="spin-geo"
      d={d}
      fill="currentColor"
      fillOpacity="0.78"
      shapeRendering="geometricPrecision"
    />
    <rect width="100" height="100" fill={`url(#${star.id}-edge)`} clipPath={`url(#${star.id}-clip)`} style={{ mixBlendMode: "screen", opacity: 0.8 }} pointerEvents="none" />
    <rect width="100" height="100" fill={`url(#${star.id}-hot)`}  clipPath={`url(#${star.id}-clip)`} style={{ mixBlendMode: "screen", opacity: 0.85 }} pointerEvents="none" />
    <rect width="100" height="100" fill={`url(#${star.id}-liftTop)`} clipPath={`url(#${star.id}-clip)`} style={{ mixBlendMode: "screen", opacity: 0.65 }} />
    <rect width="100" height="100" fill={`url(#${star.id}-rim)`}   clipPath={`url(#${star.id}-clip)`} style={{ mixBlendMode: "screen", opacity: 0.5 }} pointerEvents="none" />
    <rect width="100" height="100" fill={`url(#${star.id}-shade)`} clipPath={`url(#${star.id}-clip)`} style={{ mixBlendMode: "multiply", opacity: 0.6 }} pointerEvents="none" />
  </svg>
</button>
      ))}
    </div>
  );
};

export default Buttons;
