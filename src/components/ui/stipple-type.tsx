import React, { useRef, useEffect, useState } from 'react';

export interface StippleTypeProps {
  text: string;
  className?: string;
  textColor?: string;
  stippleColor?: string;
  accentColor?: string;
  fontSize?: number;
  stippleRadius?: number;
  swirlStrength?: number;
  damping?: number;
}

interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  stippleRatio: number;
}

/**
 * StippleType
 * 
 * A marbled-ink headline that swirls and breaks into stipple as you stir it.
 * Tracks pointer stirring dynamics and uses fluid displacement to organically
 * scatter text pixels into fine pointillist stipple dots that gracefully
 * relax back into crisp typography.
 */
export const StippleType: React.FC<StippleTypeProps> = ({
  text,
  className = '',
  textColor = '#0F3A36',
  stippleColor = '#1D534D',
  accentColor = '#E05B2D',
  fontSize = 44,
  stippleRadius = 1.6,
  swirlStrength = 3.5,
  damping = 0.92,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const pointerRef = useRef({
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    vx: 0,
    vy: 0,
    isHovered: false,
    stirTime: 0,
  });

  const [dimensions, setDimensions] = useState({ width: 700, height: 120 });

  // Handle Resize and Container Bounds
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      // Estimate height based on font size and text wrap
      const height = Math.max(100, Math.floor(fontSize * 2.2));
      setDimensions({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [fontSize]);

  // Rasterize Text and Generate Stipple Particle Grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const offscreen = document.createElement('canvas');
    offscreen.width = dimensions.width;
    offscreen.height = dimensions.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Render Crisp Headline to Offscreen Canvas
    offCtx.clearRect(0, 0, dimensions.width, dimensions.height);
    const responsiveFontSize = dimensions.width < 500 ? Math.floor(fontSize * 0.72) : fontSize;
    offCtx.font = `800 ${responsiveFontSize}px Inter, -apple-system, sans-serif`;
    offCtx.fillStyle = '#000000';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';

    // Word wrap if text is wider than canvas
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      const metrics = offCtx.measureText(testLine);
      if (metrics.width > dimensions.width - 32) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = responsiveFontSize * 1.25;
    const totalHeight = lines.length * lineHeight;
    const startY = (dimensions.height - totalHeight) / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      offCtx.fillText(line, dimensions.width / 2, startY + index * lineHeight);
    });

    // Sample raster mask to create ink stipple particles
    const imgData = offCtx.getImageData(0, 0, dimensions.width, dimensions.height);
    const data = imgData.data;
    const particles: Particle[] = [];
    const step = dimensions.width < 500 ? 4 : 3; // Grid density

    for (let y = 0; y < dimensions.height; y += step) {
      for (let x = 0; x < dimensions.width; x += step) {
        const index = (y * dimensions.width + x) * 4;
        const alpha = data[index + 3];

        if (alpha > 80) {
          // Color distribution: Marbled teal with occasional burnt orange ink vein
          const isVein = Math.sin(x * 0.04 + y * 0.05) > 0.82;
          const particleColor = isVein ? accentColor : textColor;

          particles.push({
            originX: x,
            originY: y,
            x: x + (Math.random() - 0.5) * 1.5,
            y: y + (Math.random() - 0.5) * 1.5,
            vx: 0,
            vy: 0,
            size: stippleRadius + (Math.random() - 0.5) * 0.6,
            color: particleColor,
            alpha: alpha / 255,
            stippleRatio: 0,
          });
        }
      }
    }

    particlesRef.current = particles;
  }, [dimensions, text, fontSize, textColor, accentColor, stippleRadius]);

  // Animation Loop (Fluid Stirring & Stipple Dispersion)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const pointer = pointerRef.current;
      const particles = particlesRef.current;

      // Pointer velocity decay
      pointer.vx *= 0.85;
      pointer.vy *= 0.85;
      const stirVelocity = Math.sqrt(pointer.vx * pointer.vx + pointer.vy * pointer.vy);
      const stirRadius = 85;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Distance from pointer
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Stirring Vortex Force (tangential & radial marbled fluid displacement)
        if (dist < stirRadius && dist > 1) {
          const factor = (1 - dist / stirRadius);
          const angle = Math.atan2(dy, dx);

          // Vortex swirl perpendicular to pointer velocity + fluid turbulence
          const swirlAngle = angle + Math.PI / 2;
          const swirlForce = factor * swirlStrength * (stirVelocity * 0.25 + 0.8);

          p.vx += Math.cos(swirlAngle) * swirlForce + (Math.sin(time * 3 + p.y * 0.05) * factor * 0.6);
          p.vy += Math.sin(swirlAngle) * swirlForce + (Math.cos(time * 3 + p.x * 0.05) * factor * 0.6);

          // Break into stipple dots under shear stress
          p.stippleRatio = Math.min(1, p.stippleRatio + factor * 0.4);
        } else {
          // Relax back to origin text formation
          p.stippleRatio = Math.max(0, p.stippleRatio - 0.025);
        }

        // Spring tension returning particle to origin
        const homeDx = p.originX - p.x;
        const homeDy = p.originY - p.y;
        p.vx += homeDx * 0.07;
        p.vy += homeDy * 0.07;

        // Velocity damping
        p.vx *= damping;
        p.vy *= damping;

        p.x += p.vx;
        p.y += p.vy;

        // Render ink stipple dot
        const currentSize = p.stippleRatio > 0.2
          ? p.size * (1 + p.stippleRatio * 0.4)
          : p.size;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [damping, swirlStrength]);

  // Pointer Event Handlers for "Stirring"
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pointer = pointerRef.current;
    if (pointer.prevX !== -9999) {
      pointer.vx = x - pointer.prevX;
      pointer.vy = y - pointer.prevY;
    }

    pointer.prevX = x;
    pointer.prevY = y;
    pointer.x = x;
    pointer.y = y;
    pointer.isHovered = true;
  };

  const handlePointerLeave = () => {
    const pointer = pointerRef.current;
    pointer.x = -9999;
    pointer.y = -9999;
    pointer.prevX = -9999;
    pointer.prevY = -9999;
    pointer.vx = 0;
    pointer.vy = 0;
    pointer.isHovered = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full overflow-visible select-none cursor-grab active:cursor-grabbing flex items-center justify-center ${className}`}
      title="Hover or stir cursor across the headline to swirl the marbled ink into stipple dots"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      {/* Screen reader accessible fallback */}
      <span className="sr-only">{text}</span>
    </div>
  );
};
