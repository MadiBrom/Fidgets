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

    
    function createRipples() {
      const newRipples = Array.from({ length: 5 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1,
        alpha: 0.5,
      }));
      setRipples((prevRipples) => [...prevRipples, ...newRipples]);
    }

    
    const dropInterval = setInterval(createRipples, 100); 

    
    function handleClick(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const largeRipple = {
        x: x,
        y: y,
        radius: 10, 
        alpha: 0.8, 
      };

      setRipples((prevRipples) => [...prevRipples, largeRipple]);
    }

    canvas.addEventListener("click", handleClick);

    function draw() {
      ctx.clearRect(0, 0, width, height);

      ripples.forEach((ripple, index) => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, 2 * Math.PI);
        
        ctx.strokeStyle = `rgba(173, 216, 230, ${ripple.alpha})`; 
        ctx.lineWidth = 2;
        ctx.stroke();

        
        ripple.radius += rippleSpeed;
        
        ripple.alpha -= 0.01;

        
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
