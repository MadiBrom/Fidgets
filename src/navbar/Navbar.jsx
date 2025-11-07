import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./navbar.css";

const getInitialDark = () => {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
  } catch {}
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
};

const applyHtmlClass = (isDark) => {
  const root = document.documentElement;
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
};

const Navbar = () => {
  const [isDark, setIsDark] = useState(getInitialDark);

  useEffect(() => {
    applyHtmlClass(isDark);
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  }, [isDark]);

  const onToggle = () => setIsDark((v) => !v);

  return (
    <>
      <Link to="/" aria-label="Home" title="Home" className="home-fixed">🏠︎</Link>

      <div className="theme-toggle" aria-hidden="false">
        <button
          type="button"
          className={`theme-toggle-btn ${isDark ? "is-dark" : ""}`}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={isDark}
          onClick={onToggle}
        >
          <span className="icon sun" aria-hidden="true">𖤓</span>
          <span className="icon moon" aria-hidden="true">☾</span>
          <span className="toggle-thumb" aria-hidden="true" />
        </button>
      </div>
    </>
  );
};

export default Navbar;
