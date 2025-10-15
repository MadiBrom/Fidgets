import React, { useEffect, useRef } from "react";

const Slime = () => {
  const bubblefieldRef = useRef(null);
  const bubbles = [];

  useEffect(() => {
    const bubblefield = bubblefieldRef.current;
    const bubbleCount = 300;

    // Function to make shapes float around smoothly across the whole screen
    const floatBubble = (bubble) => {
      const moveBubble = () => {
        // Adjust the randomness to be smaller for slower motion
        const deltaX = (Math.random() * 2 - 1) * 0.2;
        const deltaY = (Math.random() * 2 - 1) * 0.2;

        // Apply damping for smoother, slower float effect
        bubble.velocityX = (bubble.velocityX || 0) * 0.99 + deltaX;
        bubble.velocityY = (bubble.velocityY || 0) * 0.99 + deltaY;

        let newX = parseFloat(bubble.style.left) + bubble.velocityX;
        let newY = parseFloat(bubble.style.top) + bubble.velocityY;

        // Wrap around if out of bounds
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

    // Function to create a bubble element
    const createBubble = () => {
      const bubble = document.createElement("div");

      // Randomly assign a class for different types, but style them all as circles
      const shapeTypes = ["bubble", "square", "triangle"];
      const shapeClass =
        shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      bubble.classList.add(shapeClass);

      bubble.style.width = `${Math.random() * 10 + 5}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.top = `${Math.random() * window.innerHeight}px`;
      bubble.style.left = `${Math.random() * window.innerWidth}px`;

      bubblefield.appendChild(bubble);
      bubbles.push(bubble);

      floatBubble(bubble);
    };

    // Create initial bubbles
    for (let i = 0; i < bubbleCount; i++) {
      createBubble();
    }

    // Handle mouse movement to attract bubbles
    const handleMouseMove = (event) => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      bubbles.forEach((bubble) => {
        const bubbleX = bubble.offsetLeft + bubble.offsetWidth / 2;
        const bubbleY = bubble.offsetTop + bubble.offsetHeight / 2;
        const deltaX = mouseX - bubbleX;
        const deltaY = mouseY - bubbleY;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const attractionSpeed = 30; // Slower attraction for smoother behavior

        if (distance > 0) {
          const moveX = (deltaX / distance) * attractionSpeed;
          const moveY = (deltaY / distance) * attractionSpeed;

          bubble.style.transform = `translate(${moveX}px, ${moveY}px)`;
          bubble.classList.add("attracted");
        }
      });
    };

    // Handle mouse click to repulse nearby bubbles
    const handleMouseClick = (event) => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const repulsionRadius = 300;

      bubbles.forEach((bubble) => {
        const bubbleX = bubble.offsetLeft + bubble.offsetWidth / 2;
        const bubbleY = bubble.offsetTop + bubble.offsetHeight / 2;
        const deltaX = bubbleX - mouseX;
        const deltaY = bubbleY - mouseY;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        if (distance < repulsionRadius && distance > 0) {
          const repulsionStrength =
            (repulsionRadius - distance) / repulsionRadius;
          const repulsionDistance = repulsionStrength * 500;

          const moveX = (deltaX / distance) * repulsionDistance;
          const moveY = (deltaY / distance) * repulsionDistance;

          let newX = bubble.offsetLeft + moveX;
          let newY = bubble.offsetTop + moveY;

          if (newX < 0) newX = window.innerWidth;
          if (newX > window.innerWidth) newX = 0;
          if (newY < 0) newY = window.innerHeight;
          if (newY > window.innerHeight) newY = 0;

          bubble.style.left = `${newX}px`;
          bubble.style.top = `${newY}px`;
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
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: -1;
          pointer-events: none;
        }

        .bubble,
        .square,
        .triangle {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(173, 216, 230, 0.7);
          box-shadow: 0 0 8px rgba(173, 216, 230, 0.5);
          transition: transform 0.2s ease-out;
        }

        .bubble.attracted,
        .square.attracted,
        .triangle.attracted {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default Slime;
