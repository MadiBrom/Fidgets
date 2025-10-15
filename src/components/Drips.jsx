import React, { useRef, useEffect, useState } from "react";

const Drips = () => {
  const canvasRef = useRef(null);
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const maxRadius = 100;
    const rippleSpeed = 1;

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener("resize", resizeCanvas);

    // Function to create multiple ripples at random positions
    function createRipples() {
      const newRipples = Array.from({ length: 5 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1,
        alpha: 0.5,
      }));
      setRipples((prevRipples) => [...prevRipples, ...newRipples]);
    }

    // Generate ripples at regular intervals (simulating raindrops)
    const dropInterval = setInterval(createRipples, 100); // Adjust interval for more or fewer drops

    // Function to handle mouse clicks and add a larger ripple
    function handleClick(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const largeRipple = {
        x: x,
        y: y,
        radius: 10, // Starting radius for large drip
        alpha: 0.8, // Starting opacity for the large drip
      };

      setRipples((prevRipples) => [...prevRipples, largeRipple]);
    }

    canvas.addEventListener("click", handleClick);

    function draw() {
      ctx.clearRect(0, 0, width, height);

      ripples.forEach((ripple, index) => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, 2 * Math.PI);
        // Light blue color for the ripples
        ctx.strokeStyle = `rgba(173, 216, 230, ${ripple.alpha})`; // Light blue color with varying transparency
        ctx.lineWidth = 2;
        ctx.stroke();

        // Increase the ripple's radius
        ripple.radius += rippleSpeed;
        // Decrease the ripple's alpha to fade out as it grows
        ripple.alpha -= 0.01;

        // Remove ripples that have fully faded
        if (ripple.alpha <= 0) {
          ripples.splice(index, 1);
        }
      });

      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearInterval(dropInterval);
      canvas.removeEventListener("click", handleClick);
    };
  }, [ripples]);

  return <canvas ref={canvasRef} className="ocean-canvas" />;
};

export default Drips;
