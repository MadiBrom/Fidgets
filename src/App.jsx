import React from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar/Navbar"
import Home from "./components/home/Home";
import Buttons from "./components/buttons/Buttons";
import Confetti from "./components/confetti/Confetti";
import Bubbles from "./components/pops/Bubbles";
import Birds from "./components/Birds";
import Lines from "./components/Lines";
import Ocean from "./components/Ocean";
import Rainbow from "./components/Rainbow";
import Drips from "./components/Drips";
// import Slime from "./components/slime/Slime";
// import Spiral from "./components/Spiral";


function App() {
  const playRef = React.useRef(null);
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/slime" element={
        <main ref={playRef} className="slime-play">
          <Slime fieldRef={playRef} preset="toy" blobCount={18} quality={1.0} />
        </main>
        } />        */}
        <Route path="/buttons" element={<Buttons />} />
        <Route path="/birds" element={<Birds />} />
        <Route path="/pops" element={<Bubbles />} />
        <Route path="/lines" element={<Lines />} />
        <Route path="/ocean" element={<Ocean />} />
        <Route path="/rainbow" element={<Rainbow />} />
        <Route path="/drips" element={<Drips />} />
        {/* <Route path="/spiral" element={<Spiral />} /> */}
        <Route path="/confetti" element={<Confetti />} />
      </Routes>
    </div>
  );
}

export default App;

