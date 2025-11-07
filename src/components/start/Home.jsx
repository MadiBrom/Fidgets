import React from "react";
import { Link } from "react-router-dom";
import { FIDGETS } from "./fidgets";
import "./Home.css";

const Home = () => {
  return (
    <main className="home-page">
      <h1 className="home-title">The Digital Respite 🍵🍃</h1>
      <section className="home-grid" aria-label="Game picks">
        {FIDGETS.map((t) => (
          <Link key={t.path} to={t.path} className="home-tile" aria-label={t.title}>
            <div className="home-thumb" style={{ background: t.bg }}>
              <span className="home-emoji" aria-hidden>{t.emoji}</span>
            </div>
            <div className="home-label">{t.title}</div>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default Home;
