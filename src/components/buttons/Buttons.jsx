import React, { useState, useEffect } from "react";
import "./buttons.css"; // Importing the CSS file

const Buttons = () => {
  const [stars, setStars] = useState([]);

  // Generate stars with random properties when the component mounts
  useEffect(() => {
    const generatedStars = Array.from({ length: 20 }, (_, index) => ({
      id: `star${index + 1}`,
      size: Math.floor(Math.random() * 50) + 50, // Random size between 50px and 100px
      color: getRandomColor(),
      position: getRandomPosition(),
    }));
    setStars(generatedStars);
  }, []);

  // Function to get a random position within the viewport that keeps the shape visible
  const getRandomPosition = () => {
    return {
      top: Math.max(0, Math.random() * (window.innerHeight - 100)),
      left: Math.max(0, Math.random() * (window.innerWidth - 100)),
    };
  };

  // Function to get a random color
  const getRandomColor = () => {
    const colors = [
      "#39ff14", // Neon Green
      "#ff073a", // Neon Red
      "#00ffff", // Electric Cyan
      "#ff00ff", // Neon Magenta
      "#ff5f1f", // Neon Orange
      "#0afff1", // Bright Aqua
      "#f4f930", // Neon Yellow
      "#fe019a", // Hot Pink
      "#adff2f", // Neon Lime
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Function to handle the button click: spin out and fade out, teleport, then fade in while spinning
  const handleClick = (id) => {
    const button = document.querySelector(`.${id}`);
    if (button) {
      // Add spin and fade-out animation
      button.classList.add("spin-out-fade");

      // After the spin-out fade, move the button to a new position while it is invisible
      setTimeout(() => {
        setStars((prevStars) =>
          prevStars.map((star) =>
            star.id === id
              ? {
                  ...star,
                  position: getRandomPosition(),
                }
              : star
          )
        );

        // Remove spin-out-fade class and add fade-in-spin class for reappearance
        button.classList.remove("spin-out-fade");
        button.classList.add("fade-in-spin");

        // Remove the fade-in-spin class after animation completes
        setTimeout(() => {
          button.classList.remove("fade-in-spin");
        }, 600);
      }, 600); // Duration matches the spin-out fade animation duration
    }
  };

  return (
    <div className="shapes-container">
      {stars.map((star) => (
        <button
          key={star.id}
          className={`shape-button star ${star.id}`}
          onClick={() => handleClick(star.id)}
          style={{
            top: `${star.position.top}px`,
            left: `${star.position.left}px`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            color: star.color,
          }}
        ></button>
      ))}
    </div>
  );
};

export default Buttons;
