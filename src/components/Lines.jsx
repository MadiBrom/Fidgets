import React, { useEffect, useRef, useState } from "react";

const Lines = () => {
  const canvasRef = useRef(null);
  const [scaleFactor, setScaleFactor] = useState(1); // Scaling factor for stars
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 5 + 3, // Default size
    color: `hsl(${Math.random() * 360}, 100%, 75%)`,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Function to adjust scaling based on screen size
    const adjustScaleFactor = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Adjust scaling factor based on width
      const scale = width < 600 ? 0.5 : 1; // Scale down on smaller screens
      setScaleFactor(scale);
    };

    const adjustStarSizes = () => {
      stars.forEach((star) => {
        star.size = (Math.random() * 5 + 3) * scaleFactor; // Adjust size based on screen size
      });
    };

    const draw = (mouseX, mouseY) => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw each star, scaled
      stars.forEach(({ x, y, size, color }) => {
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();
        context.closePath();
      });

      const proximityRadius = 150 * scaleFactor; // Adjust proximity radius based on screen size
      const nearbyStars = stars.filter(
        ({ x, y }) => Math.hypot(mouseX - x, mouseY - y) < proximityRadius
      );

      // Draw lines between nearby stars, reduced connections on smaller screens
      nearbyStars.forEach((star, index) => {
        for (let i = index + 1; i < nearbyStars.length; i++) {
          const nextStar = nearbyStars[i];
          const distance = Math.hypot(star.x - nextStar.x, star.y - nextStar.y);

          // Decrease number of lines by checking distance and screen size
          if (distance < (100 * scaleFactor)) {
            context.beginPath();
            context.moveTo(star.x, star.y);
            context.lineTo(nextStar.x, nextStar.y);
            context.strokeStyle = `rgba(255, 255, 255, ${1 - distance / (100 * scaleFactor)})`;
            context.lineWidth = 2 * scaleFactor; // Scale line thickness
            context.stroke();
            context.closePath();
          }
        }

        // Draw a line from the mouse to each nearby star
        const distanceToMouse = Math.hypot(mouseX - star.x, mouseY - star.y);
        if (distanceToMouse < proximityRadius) {
          context.beginPath();
          context.moveTo(mouseX, mouseY);
          context.lineTo(star.x, star.y);
          context.strokeStyle = `rgba(255, 255, 255, ${
            1 - distanceToMouse / proximityRadius
          })`;
          context.lineWidth = 2 * scaleFactor; // Scale line thickness
          context.stroke();
          context.closePath();
        }
      });
    };

    const handleMouseMove = (event) => {
      draw(event.clientX, event.clientY);
    };

    const handleMouseClick = (event) => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      // Pull only the stars connected to the mouse towards it
      const proximityRadius = 150 * scaleFactor;
      const connectedStars = stars.filter(
        ({ x, y }) => Math.hypot(mouseX - x, mouseY - y) < proximityRadius
      );

      connectedStars.forEach((star) => {
        const deltaX = mouseX - star.x;
        const deltaY = mouseY - star.y;
        const pullStrength = 0.1; // Adjust for how quickly they move towards the mouse

        star.x += deltaX * pullStrength;
        star.y += deltaY * pullStrength;
      });

      draw(mouseX, mouseY); // Redraw with updated positions
    };

    const handleTouchMove = (event) => {
      const touch = event.touches[0]; // Get the first touch
      draw(touch.clientX, touch.clientY);
    };

    const handleTouchStart = (event) => {
      const touch = event.touches[0]; // Get the first touch
      draw(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleMouseClick);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });

    // Set canvas dimensions and adjust scaling
    const setCanvasSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1; // Device pixel ratio

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.scale(dpr, dpr); // Adjust for pixel density
      adjustScaleFactor(); // Adjust scaling based on window size
      adjustStarSizes(); // Adjust star sizes
    };

    setCanvasSize(); // Set initial size
    window.addEventListener("resize", setCanvasSize); // Handle resize

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleMouseClick);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("resize", setCanvasSize);
    };
  }, [stars, scaleFactor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none" }}
    />
  );
};

export default Lines;
