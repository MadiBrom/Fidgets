import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => {
    setMobileOpen(false);
  };

  useEffect(() => {
    if (mobileOpen) document.body.classList.add("menu-open");
    else document.body.classList.remove("menu-open");
    return () => document.body.classList.remove("menu-open");
  }, [mobileOpen]);

  return (
    <header className="site-header" role="banner">
      <nav className="navbar" aria-label="Primary">
        <ul className="nav-list">
          <li className="nav-item">
            <Link className="nav-link home" to="/" aria-label="Home" title="Home">🏠︎</Link>
          </li>
        </ul>
      </nav>

      <button
        className="menu-icon"
        aria-label="Open menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
        onClick={() => setMobileOpen(true)}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {mobileOpen && (
        <div id="mobile-menu" className="menu-overlay" role="dialog" aria-modal="true">
          <div className="menu-panel">
            <div className="menu-header">
              <span className="menu-title">Menu</span>
              <button className="menu-close" aria-label="Close menu" onClick={closeMobile}>✕</button>
            </div>

            

            <details className="menu-group">
              <summary>Fidgets</summary>
              <nav className="menu-links">
                <Link className="menu-link" to="/buttons" onClick={closeMobile}>Buttons</Link>
                <Link className="menu-link" to="/slime" onClick={closeMobile}>Slime</Link>
                <Link className="menu-link" to="/birds" onClick={closeMobile}>Birds</Link>
                <Link className="menu-link" to="/pops" onClick={closeMobile}>Pops</Link>
                <Link className="menu-link" to="/lines" onClick={closeMobile}>Lines</Link>
              </nav>
            </details>

            <details className="menu-group">
              <summary>Visuals</summary>
              <nav className="menu-links">
                <Link className="menu-link" to="/ocean" onClick={closeMobile}>Ocean</Link>
                <Link className="menu-link" to="/rainbow" onClick={closeMobile}>Rainbow</Link>
                <Link className="menu-link" to="/drips" onClick={closeMobile}>Drips</Link>
              </nav>
            </details>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;





