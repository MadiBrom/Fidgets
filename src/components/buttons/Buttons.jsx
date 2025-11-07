import React, { useEffect, useRef, useState } from "react";
import "./Buttons.css";

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
const EDGE_PAD = 5;
const clamp = (min, v, max) => Math.max(min, Math.min(v, max));

// Reads the current playable area (btn-play) rect
const readPlayRect = (el) => {
  if (!el) return { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 };
  const r = el.getBoundingClientRect();
  return { width: r.width, height: r.height, left: r.left, top: r.top };
};

const getRandomPositionForSize = (size, playEl) => {
  const rect = readPlayRect(playEl);
  const maxTop = Math.max(EDGE_PAD, rect.height - size - EDGE_PAD);
  const maxLeft = Math.max(EDGE_PAD, rect.width - size - EDGE_PAD);
  const top = EDGE_PAD + Math.random() * Math.max(0, maxTop - EDGE_PAD);
  const left = EDGE_PAD + Math.random() * Math.max(0, maxLeft - EDGE_PAD);
  return { top, left };
};

// Derive a scale factor from the play area size.
// Baseline is roughly 1200x700; clamp for sane bounds.
const getScaleForRect = (rect) => {
  const w = Math.max(320, rect.width || window.innerWidth);
  const h = Math.max(360, rect.height || window.innerHeight);
  const s = Math.min(w / 1200, h / 700);
  return Math.max(0.7, Math.min(1.4, s));
};

const Buttons = () => {
  const playRef = useRef(null);
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
  const [showTopTag, setShowTopTag] = useState(false);
  const [topTagText, setTopTagText] = useState("");
  const topTagTimerRef = useRef(null);
  const mountedRef = useRef(false);
  const prevBreakRef = useRef(false);

  useEffect(() => {
    const vw = window.innerWidth;
    let count = 24;
    if (vw < 420) count = 20;
    else if (vw < 768) count = 26;
    else if (vw < 1200) count = 32;
    else count = 40;
    const init = () => {
      const rect = readPlayRect(playRef.current);
      const scale = getScaleForRect(rect);
      const generated = Array.from({ length: count }, (_, i) => {
        const baseSize = Math.floor(Math.random() * 70) + 70; // 70-140 baseline
        const size = Math.round(baseSize * scale);
        return {
          id: `btnStar${i + 1}`,
          baseSize,
          size,
          color: getRandomColor(),
          position: getRandomPositionForSize(size, playRef.current),
          phase: "idle",
          key: 0,
        };
      });
      setStars(generated);
    };

    // wait a frame for layout to stabilize so playRef has size
    requestAnimationFrame(init);
  }, []);

  // Resize-responsive: rescale stars and clamp positions to the play area
  useEffect(() => {
    const onResize = () => {
      const rect = readPlayRect(playRef.current);
      const scale = getScaleForRect(rect);
      setStars(prev => prev.map(s => {
        const size = Math.round((s.baseSize || s.size) * scale);
        return {
          ...s,
          size,
          position: {
            top: clamp(EDGE_PAD, s.position.top, Math.max(EDGE_PAD, rect.height - size - EDGE_PAD)),
            left: clamp(EDGE_PAD, s.position.left, Math.max(EDGE_PAD, rect.width - size - EDGE_PAD)),
          }
        };
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isManualBreak = !focusMode;

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevBreakRef.current = isManualBreak;
      return;
    }
    if (prevBreakRef.current !== isManualBreak) {
      const text = isManualBreak ? "Free Click" : "Breathing Break Acvite";
      setTopTagText(text);
      setShowTopTag(true);
      if (topTagTimerRef.current) clearTimeout(topTagTimerRef.current);
      topTagTimerRef.current = setTimeout(() => setShowTopTag(false), 1000);
      prevBreakRef.current = isManualBreak;
    }
  }, [isManualBreak]);

  const handleClick = (id) => {
    if (paused) return; 
    if (countedRef.current.has(id)) return;
    const OUT_MS = 3000;
    const IN_MS = 3000;

  
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
        // Constrain respawn to the playing field bounds
        position: getRandomPositionForSize(s.size, playRef.current),
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
    if (topTagTimerRef.current) clearTimeout(topTagTimerRef.current);
  }, []);

  const d = roundedStarPath({ points: 5, outer: 56, inner: 36, round: 14 });

  return (
    <div className="btn-container">

      {showTopTag && (
        <div className={`btn-mode-pop ${isManualBreak ? 'on' : 'off'}`} role="status" aria-live="polite">
          {topTagText}
        </div>
      )}

      <header className="btn-header">
        {!paused && (
          <div className="btn-hud">
            <button
              className={`btn-mode-toggle ${isManualBreak ? 'break' : 'focus'}`}
              onClick={() => setFocusMode(f => !f)}
              aria-label="Toggle breaktime"
              aria-pressed={isManualBreak}
            >
              <span className="btn-mode-track" aria-hidden="true" />
              <span className="btn-mode-knob" aria-hidden="true" />
            </button>
            <div className="btn-hud-bar">
              <div className="btn-hud-bar-fill" style={{ width: `${Math.min(100, (progress / target) * 100)}%` }} />
            </div>
            <span className="btn-hud-label">{`${progress}/${target}`}</span>
            <span className="sr-only" aria-live="polite">{showTopTag ? topTagText : ""}</span>
          </div>
        )}
      </header>
      {completed && <div className="btn-complete-glow" aria-hidden="true" />}
      {paused && (
        <div className="btn-breather" role="status" aria-live="polite">
          <div className="btn-breather-pulse" aria-hidden="true" />
          <div className={`btn-breather-fill ${breatherStage === 'breathing' ? breathPhase : ''}`} aria-hidden="true" />
          <div className={`btn-breather-ring ${breatherStage === 'breathing' ? breathPhase : ''}`} aria-hidden="true" />
          <div className="btn-breather-sub">
            {breatherStage === 'intro' ? introWords[introIndex] : `${breathPhase}`}
          </div>
        </div>
      )}
      <main ref={playRef} className="btn-play">
      {showGame && stars.map(star => (
        <button
          key={`${star.id}-${star.key}`}
          className={`btn-star ${star.phase === "out" ? "btn-out" : ""} ${star.phase === "in" ? "btn-in" : ""}`}
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
            className="btn-shadow"
            aria-hidden="true"
            style={{
              background: `radial-gradient(50% 60% at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0) 70%)`
            }}
          />
  <svg
    className="btn-star-shape"
    viewBox="0 0 100 100"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <clipPath id={`${star.id}-clip`}>
        <path className="btn-spin-geo" d={d} />
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
    <path className="btn-spin-geo" d={d} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="3" strokeLinejoin="round" pointerEvents="none"/>
    <path
      className="btn-spin-geo"
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
      </main>
    </div>
  );
};

export default Buttons;
