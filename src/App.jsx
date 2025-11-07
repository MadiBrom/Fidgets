import React from "react";
import { Route, Routes } from "react-router-dom";
import Slime from "./components/slime/Slime";
import Navbar from "./navbar/Navbar";
import Buttons from "./components/buttons/Buttons";
import Birds from "./components/Birds";
import Lines from "./components/Lines";
import Ocean from "./components/Ocean";
import Rainbow from "./components/Rainbow";
import Drips from "./components/Drips";
import Spiral from "./components/Spiral";
import Home from "./components/start/Home";
import Confetti from "./components/confetti/Confetti";
import Bubbles from "./components/Pops/bubbles";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/slime" element={<Slime />} />
        <Route path="/buttons" element={<Buttons />} />
        <Route path="/birds" element={<Birds />} />
        <Route path="/pops" element={<Bubbles />} />
        <Route path="/lines" element={<Lines />} />
        <Route path="/ocean" element={<Ocean />} />
        <Route path="/rainbow" element={<Rainbow />} />
        <Route path="/drips" element={<Drips />} />
        <Route path="/spiral" element={<Spiral />} />
        <Route path="/confetti" element={<Confetti />} />
      </Routes>
    </div>
  );
}

export default App;

