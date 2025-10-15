import React, { useEffect, useRef } from "react";

const Birds = () => {
  const bubblefieldRef = useRef(null);
  const bubbles = [];

  useEffect(() => {
    const bubblefield = bubblefieldRef.current;
    const bubbleCount = 400;

    // Function to make shapes float around smoothly across the whole screen
    const floatBubble = (bubble) => {
      const moveBubble = () => {
        const deltaX = (Math.random() * 2 - 1) * 0.2;
        const deltaY = (Math.random() * 2 - 1) * 0.2;

        bubble.velocityX += deltaX;
        bubble.velocityY += deltaY;

        bubble.velocityX *= 0.98;
        bubble.velocityY *= 0.98;

        let newX = parseFloat(bubble.style.left) + bubble.velocityX || 0;
        let newY = parseFloat(bubble.style.top) + bubble.velocityY || 0;

        if (newX < 0) newX = window.innerWidth;
        if (newX > window.innerWidth) newX = 0;
        if (newY < 0) newY = window.innerHeight;
        if (newY > window.innerHeight) newY = 0;

        bubble.style.left = `${newX}px`;
        bubble.style.top = `${newY}px`;

        requestAnimationFrame(moveBubble);
      };

      moveBubble();
    };

    const createBubble = () => {
      const bubble = document.createElement("div");
      bubble.classList.add("bubble");

      bubble.style.width = `${Math.random() * 10 + 5}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.top = `${Math.random() * window.innerHeight}px`;
      bubble.style.left = `${Math.random() * window.innerWidth}px`;

      bubble.velocityX = 0;
      bubble.velocityY = 0;

      bubblefield.appendChild(bubble);
      bubbles.push(bubble);

      floatBubble(bubble);
    };

    for (let i = 0; i < bubbleCount; i++) {
      createBubble();
    }

    const handleMouseMove = (event) => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      bubbles.forEach((bubble) => {
        const bubbleX = bubble.offsetLeft + bubble.offsetWidth / 2;
        const bubbleY = bubble.offsetTop + bubble.offsetHeight / 2;
        const deltaX = mouseX - bubbleX;
        const deltaY = mouseY - bubbleY;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const attractionStrength = 0.1;

        if (distance > 0) {
          bubble.velocityX += (deltaX / distance) * attractionStrength;
          bubble.velocityY += (deltaY / distance) * attractionStrength;
        }
      });
    };

    const handleMouseClick = (event) => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const repulsionRadius = 200;

      bubbles.forEach((bubble) => {
        const bubbleX = bubble.offsetLeft + bubble.offsetWidth / 2;
        const bubbleY = bubble.offsetTop + bubble.offsetHeight / 2;
        const deltaX = bubbleX - mouseX;
        const deltaY = bubbleY - mouseY;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const repulsionStrength = 1.5;

        if (distance < repulsionRadius && distance > 0) {
          bubble.velocityX += (deltaX / distance) * repulsionStrength;
          bubble.velocityY += (deltaY / distance) * repulsionStrength;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleMouseClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleMouseClick);
      bubbles.forEach((bubble) => bubble.remove());
    };
  }, []);

  return (
    <div ref={bubblefieldRef} className="bubblefield">
      <style jsx>{`
        .bubblefield {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }
        .bubble {
          position: absolute;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5); /* Soft blue */
          box-shadow: 0 0 6px rgba(0, 123, 255, 0.7); /* Subtle glow */
          transition: transform 0.3s ease; /* Smooth transformation */
        }
      `}</style>
    </div>
  );
};

export default Birds;
