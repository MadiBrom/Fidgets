import React, { useEffect, useRef } from "react";

const Ocean = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const width = canvas.width;
    const height = canvas.height;

    
    const shallowColor = "#76c6c6";
    const deepColor = "#00416A";

    
    const oceanColors = [
      "rgba(118, 198, 198, 0.8)", 
      "rgba(0, 65, 106, 0.8)", 
      "rgba(173, 216, 230, 0.8)", 
      "rgba(255, 255, 255, 0.8)", 
    ];

    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, shallowColor);
    gradient.addColorStop(1, deepColor);

    
    const waveCount = 15;
    const waves = Array.from({ length: waveCount }, () => ({
      yOffset: Math.random() * height,
      amplitude: 15 + Math.random() * 20,
      frequency: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
      defaultAmplitude: 15 + Math.random() * 20, 
    }));

    
    const particles = [];

    
    const getRandomOceanColor = () => {
      return oceanColors[Math.floor(Math.random() * oceanColors.length)];
    };

    
    const createParticles = (wave) => {
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * width; 

        
        const y =
          wave.yOffset +
          Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;

        particles.push({
          wave, 
          x, 
          y, 
          initialY: y, 
          amplitude: 10 + Math.random() * 10, 
          frequency: 0.2 + Math.random() * 0.2, 
          color: getRandomOceanColor(),
          alpha: 1, 
          decay: 0.95, 
        });
      }
    };

    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, wave.yOffset);

        
        wave.phase += wave.speed;

        
        for (let x = 0; x < width; x++) {
          const y =
            wave.yOffset +
            Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.stroke();

        
        wave.amplitude += (wave.defaultAmplitude - wave.amplitude) * 0.1;
      });

      
      particles.forEach((particle, index) => {
        const { wave } = particle;

        
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

        
        particle.amplitude *= particle.decay; 
        particle.alpha -= 0.02; 

        
        if (particle.alpha <= 0) {
          particles.splice(index, 1);
        }
      });

      requestAnimationFrame(animate);
    };

    animate(); 

    
    const handleMouseMove = (event) => {
      const mouseY = event.clientY;

      
      waves.forEach((wave) => {
        const distance = Math.abs(wave.yOffset - mouseY);
        if (distance < 50) {
          wave.amplitude = wave.defaultAmplitude * 2; 
          createParticles(wave); 
        }
      });
    };

    
    canvas.addEventListener("mousemove", handleMouseMove);

    
    return () => {
      cancelAnimationFrame(animate); 
      canvas.removeEventListener("mousemove", handleMouseMove); 
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
