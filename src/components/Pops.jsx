import React, { useEffect, useRef, useState } from "react";

const Pops = () => {
  const popfieldRef = useRef(null);
  const [pops, setPops] = useState([]);
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    const popCount = 20;
    const spawnInterval = 2000;

    const generateRandomGradient = () => {
      const colors = [
        "rgba(255, 154, 158, 0.7)",
        "rgba(250, 208, 196, 0.7)",
        "rgba(173, 216, 230, 0.7)",
        "rgba(248, 194, 235, 0.7)",
        "rgba(161, 140, 209, 0.7)",
        "rgba(248, 194, 235, 0.7)",
        "rgba(143, 211, 244, 0.7)",
        "rgba(132, 250, 176, 0.7)",
        "rgba(207, 217, 223, 0.7)",
        "rgba(161, 196, 253, 0.7)",
        "rgba(250, 232, 171, 0.7)",
        "rgba(255, 221, 225, 0.7)",
        "rgba(212, 252, 121, 0.7)",
        "rgba(150, 230, 161, 0.7)",
      ];
      const randomColor1 = colors[Math.floor(Math.random() * colors.length)];
      const randomColor2 = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.floor(Math.random() * 360);
      return `linear-gradient(${angle}deg, ${randomColor1}, ${randomColor2})`;
    };

    const createPop = (offScreen = false) => {
      const id = Math.random().toString(36).substr(2, 9);
      const size = Math.random() * 50 + 30;
      const initialX = offScreen
        ? Math.random() > 0.5
          ? -size
          : window.innerWidth + size
        : Math.random() * window.innerWidth;
      const initialY = offScreen
        ? Math.random() > 0.5
          ? -size
          : window.innerHeight + size
        : Math.random() * window.innerHeight;
      const gradient = generateRandomGradient();
      const pop = {
        id,
        size,
        x: initialX,
        y: initialY,
        gradient,
        velocityX: (Math.random() * 2 - 1) * 0.2,
        velocityY: (Math.random() * 2 - 1) * 0.2,
        popped: false,
      };
      setPops((prev) => [...prev, pop]);
    };

    for (let i = 0; i < popCount; i++) {
      createPop();
    }

    const updatePositions = () => {
      setPops((prev) =>
        prev.map((pop) => {
          if (pop.popped) return pop;
          let newX = pop.x + pop.velocityX;
          let newY = pop.y + pop.velocityY;

          if (newX < 0) newX = window.innerWidth;
          if (newX > window.innerWidth) newX = 0;
          if (newY < 0) newY = window.innerHeight;
          if (newY > window.innerHeight) newY = 0;

          return { ...pop, x: newX, y: newY };
        })
      );
      requestAnimationFrame(updatePositions);
    };

    updatePositions();

    const intervalId = setInterval(() => {
      createPop(true);
    }, spawnInterval);

    return () => {
      clearInterval(intervalId);
      setPops([]);
      setConfetti([]);
    };
  }, []);

  const handlePop = (id, x, y) => {
    setPops((prev) =>
      prev.map((pop) => (pop.id === id ? { ...pop, popped: true } : pop))
    );

    const particles = Array.from({ length: 15 }, () => ({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      size: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 70%)`,
      velocityX: (Math.random() * 2 - 1) * 4,
      velocityY: (Math.random() * 2 - 1) * 4,
    }));
    setConfetti((prev) => [...prev, ...particles]);

    setTimeout(() => {
      setPops((prev) => prev.filter((pop) => pop.id !== id));
      createPop(true);
    }, 500);

    setTimeout(() => {
      setConfetti((prev) =>
        prev.filter((particle) => !particles.includes(particle))
      );
    }, 1000);
  };

  return (
    <div ref={popfieldRef} className="popfield">
      {pops.map((pop) => (
        <div
          key={pop.id}
          className={`pop ${pop.popped ? "popped" : ""}`}
          style={{
            width: pop.size,
            height: pop.size,
            left: pop.x,
            top: pop.y,
            position: "absolute",
            background: pop.gradient,
            borderRadius: "50%",
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)",
            transform: pop.popped ? "scale(0)" : "scale(1)",
            opacity: pop.popped ? 0 : 1,
            transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
            zIndex: 2,
            cursor: "pointer",
            pointerEvents: "auto",
          }}
          onClick={() =>
            handlePop(pop.id, pop.x + pop.size / 2, pop.y + pop.size / 2)
          }
        />
      ))}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="confetti"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            position: "absolute",
            left: particle.x,
            top: particle.y,
            borderRadius: "50%",
            transform: `translate(${particle.velocityX * 100}px, ${
              particle.velocityY * 100
            }px)`,
            opacity: 0,
            animation: "scatter 1s ease-out forwards",
          }}
        />
      ))}
      <style jsx>{`
        .popfield {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: 1;
          pointer-events: none;
        }

        .pop {
          pointer-events: auto;
        }

        .confetti {
          pointer-events: none;
        }

        @keyframes scatter {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Pops;
