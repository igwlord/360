import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const StarField = () => {
  const { theme, showParticles } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!showParticles) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
        const count = 50; // Number of stars
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2, // Size variance
                speedX: (Math.random() - 0.5) * 0.2, // Slow drift
                speedY: (Math.random() - 0.5) * 0.2,
                opacity: Math.random(),
                pulseSpeed: 0.02 + Math.random() * 0.03
            });
        }
    };

    const drawParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Determine color based on theme
        let color = '255, 255, 255'; // Default white
        if (theme.name === 'Tilo') color = '74, 222, 128'; // Green Neon
        if (theme.name === 'Lirio') color = '251, 191, 36'; // Amber/Gold
        if (theme.name === 'Deep') color = '252, 163, 17'; // Orange

        particles.forEach(p => {
            // Pulse opacity
            p.opacity += p.pulseSpeed;
            if (p.opacity > 1 || p.opacity < 0.2) p.pulseSpeed = -p.pulseSpeed;
            
            // Move
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around screen
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${Math.abs(p.opacity)})`;
            ctx.fill();
        });

        animationFrameId = requestAnimationFrame(drawParticles);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    createParticles();
    drawParticles();

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animationFrameId);
    };
  }, [theme, showParticles]);

  if (!showParticles) return null;

  return (
    <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen"
        style={{ transition: 'opacity 1s ease-in-out' }}
    />
  );
};

export default StarField;
