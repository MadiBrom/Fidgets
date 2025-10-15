import React, { useEffect, useRef } from "react";

const Ocean = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const width = canvas.width;
    const height = canvas.height;

    // Colors for shallow and deep water
    const shallowColor = "#76c6c6";
    const deepColor = "#00416A";

    // Ocean-themed colors for particles
    const oceanColors = [
      "rgba(118, 198, 198, 0.8)", // Turquoise
      "rgba(0, 65, 106, 0.8)", // Deep blue
      "rgba(173, 216, 230, 0.8)", // Light blue
      "rgba(255, 255, 255, 0.8)", // White
    ];

    // Create a linear gradient for depth effect
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, shallowColor);
    gradient.addColorStop(1, deepColor);

    // Variables for wave properties
    const waveCount = 15;
    const waves = Array.from({ length: waveCount }, () => ({
      yOffset: Math.random() * height,
      amplitude: 15 + Math.random() * 20,
      frequency: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
      defaultAmplitude: 15 + Math.random() * 20, // Store default amplitude for reset
    }));

    // Array to hold emitted vibrating particles
    const particles = [];

    // Function to pick a random color from ocean-themed colors
    const getRandomOceanColor = () => {
      return oceanColors[Math.floor(Math.random() * oceanColors.length)];
    };

    // Function to create particles along the curve of a wave
    const createParticles = (wave) => {
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * width; // Random x position along wave

        // Calculate the initial y position based on wave sine curve
        const y =
          wave.yOffset +
          Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;

        particles.push({
          wave, // Reference to the wave for curvature following
          x, // Starting x position along the wave
          y, // Starting y position along the wave
          initialY: y, // Store initial y for oscillation
          amplitude: 10 + Math.random() * 10, // Initial oscillation amplitude
          frequency: 0.2 + Math.random() * 0.2, // Frequency of vibration
          color: getRandomOceanColor(),
          alpha: 1, // Opacity starts at 1
          decay: 0.95, // Amplitude decay factor for damping effect
        });
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw each wave
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, wave.yOffset);

        // Adjust phase for smooth movement
        wave.phase += wave.speed;

        // Draw smooth continuous sine wave
        for (let x = 0; x < width; x++) {
          const y =
            wave.yOffset +
            Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.stroke();

        // Gradually reset amplitude to default if altered
        wave.amplitude += (wave.defaultAmplitude - wave.amplitude) * 0.1;
      });

      // Draw and update vibrating particles
      particles.forEach((particle, index) => {
        const { wave } = particle;

        // Calculate oscillating y position along the wave curve
        const newY =
          particle.initialY +
          Math.sin(Date.now() * particle.frequency) * particle.amplitude;

        ctx.beginPath();
        ctx.moveTo(particle.x, particle.initialY);
        ctx.lineTo(particle.x, newY);
        ctx.strokeStyle = particle.color.replace(
          "0.8",
          particle.alpha.toString()
        );
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update particle properties for damping effect
        particle.amplitude *= particle.decay; // Dampen amplitude over time
        particle.alpha -= 0.02; // Fade out over time

        // Remove particle if it’s faded out
        if (particle.alpha <= 0) {
          particles.splice(index, 1);
        }
      });

      requestAnimationFrame(animate);
    };

    animate(); // Start the animation loop

    // Mouse move event listener for strumming effect
    const handleMouseMove = (event) => {
      const mouseY = event.clientY;

      // Increase amplitude for waves near the mouse's Y position and emit particles
      waves.forEach((wave) => {
        const distance = Math.abs(wave.yOffset - mouseY);
        if (distance < 50) {
          wave.amplitude = wave.defaultAmplitude * 2; // Amplify wave temporarily
          createParticles(wave); // Emit vibrating particles along the wave
        }
      });
    };

    // Attach mousemove event listener
    canvas.addEventListener("mousemove", handleMouseMove);

    // Cleanup function to remove event listener on unmount
    return () => {
      cancelAnimationFrame(animate); // Stop animation
      canvas.removeEventListener("mousemove", handleMouseMove); // Remove event listener
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
};

export default Ocean;
