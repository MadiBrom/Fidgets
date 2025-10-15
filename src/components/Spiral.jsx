import React from "react";
import Particles from "react-tsparticles";

const Spiral = () => {
  return (
    <Particles
      options={{
        fullScreen: { enable: true },
        background: {
          color: { value: "#000000" },
        },
        particles: {
          number: {
            value: 150,
          },
          color: {
            value: "#ffffff",
          },
          shape: {
            type: "circle",
          },
          opacity: {
            value: 0.3,
            random: true,
          },
          size: {
            value: 20,
            random: true,
          },
          move: {
            enable: true,
            speed: 1.5,
            outMode: "out",
            angle: {
              value: 360,
              random: false,
            },
            attract: {
              enable: true,
              rotateX: 600,
              rotateY: 1200,
            },
            trail: {
              enable: true,
              length: 0.5,
              fillColor: "#000000",
            },
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
            onClick: { enable: true, mode: "push" },
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
            push: { quantity: 2 },
          },
        },
      }}
    />
  );
};

export default Spiral;
