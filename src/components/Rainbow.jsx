import React, { useRef, useEffect } from "react";

const Ocean = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ripples = [];
    const maxRadius = 100;
    const rippleSpeed = 0.5;

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener("resize", resizeCanvas);

    function createRipple(x, y) {
      ripples.push({ x, y, radius: 1 });
    }

    canvas.addEventListener("mousemove", (event) => {
      createRipple(event.clientX, event.clientY);
    });

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);

      ripples.forEach((ripple, index) => {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `hsla(${(ripple.radius * 2) % 360}, 100%, 50%, 0.5)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ripple.radius += rippleSpeed;

        if (ripple.radius > maxRadius) {
          ripples.splice(index, 1);
        }
      });

      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", createRipple);
    };
  }, []);

  return <canvas ref={canvasRef} className="ocean-canvas" />;
};

export default Ocean;
