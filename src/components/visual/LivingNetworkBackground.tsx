import React, { useEffect, useRef } from 'react';

interface LivingNetworkBackgroundProps {
  isSubdued?: boolean; // When Civic Lens is active, subdue background
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
  isOrange: boolean;
}

interface Particle {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

export const LivingNetworkBackground: React.FC<LivingNetworkBackgroundProps> = ({
  isSubdued = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReducedMotion = mediaQuery.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', onMotionChange);

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNetwork();
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initialize Network Nodes
    let nodes: Node[] = [];
    let particles: Particle[] = [];

    const initNetwork = () => {
      const isMobile = width < 768;
      const count = isMobile ? 22 : 46;
      nodes = [];

      for (let i = 0; i < count; i++) {
        const isOrange = Math.random() < 0.22; // ~22% nodes have burnt orange pulse
        const baseRadius = isOrange ? 2.5 : 2.0;

        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.4),
          vy: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.4),
          radius: baseRadius,
          baseRadius,
          color: isOrange ? '#0D9488' : '#0B192C',
          pulseSpeed: 0.02 + Math.random() * 0.03,
          pulsePhase: Math.random() * Math.PI * 2,
          isOrange,
        });
      }

      // Initialize travelling data packets/particles
      particles = [];
      const particleCount = isMobile ? 8 : 16;
      for (let p = 0; p < particleCount; p++) {
        const fromNode = Math.floor(Math.random() * nodes.length);
        let toNode = Math.floor(Math.random() * nodes.length);
        while (toNode === fromNode) toNode = Math.floor(Math.random() * nodes.length);

        particles.push({
          fromNode,
          toNode,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.005,
          color: Math.random() < 0.5 ? '#14B8A6' : '#0D9488',
        });
      }
    };

    initNetwork();

    let wavePhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Global opacity modifier if Civic Lens is active
      ctx.globalAlpha = isSubdued ? 0.18 : 1.0;

      // 1. Draw Organic Harmonic Background Waves
      wavePhase += isReducedMotion ? 0.0005 : 0.003;
      const waveCount = 3;

      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseAmp = 35 + w * 20;
        const freq = 0.0012 + w * 0.0008;
        const yOffset = height * (0.35 + w * 0.25);

        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= width; x += 15) {
          const y =
            yOffset +
            Math.sin(x * freq + wavePhase * (w % 2 === 0 ? 1 : -1) + w) * baseAmp +
            Math.cos(x * 0.0006 - wavePhase * 0.5) * 15;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle =
          w === 0
            ? 'rgba(13, 148, 136, 0.04)' // Ambient Teal
            : w === 1
            ? 'rgba(11, 25, 44, 0.03)' // Ambient Navy
            : 'rgba(20, 184, 166, 0.03)'; // Vibrant Accent glow
        ctx.lineWidth = w === 1 ? 1.5 : 1.0;
        ctx.stroke();
      }

      // If reduced motion, stop node movements here and draw gently static nodes
      const maxDistance = width < 768 ? 120 : 160;

      // 2. Draw Connections Between Close Nodes
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // Animate pulse
        nodeA.pulsePhase += nodeA.pulseSpeed;
        const pulse = Math.sin(nodeA.pulsePhase);
        nodeA.radius = nodeA.baseRadius + pulse * 1.2;

        // Move Node
        if (!isReducedMotion) {
          nodeA.x += nodeA.vx;
          nodeA.y += nodeA.vy;

          // Bounce off boundaries
          if (nodeA.x < 0 || nodeA.x > width) nodeA.vx *= -1;
          if (nodeA.y < 0 || nodeA.y > height) nodeA.vy *= -1;

          // Mouse gentle gravitation
          if (mousePosRef.current.active) {
            const dx = mousePosRef.current.x - nodeA.x;
            const dy = mousePosRef.current.y - nodeA.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180 && dist > 10) {
              nodeA.x += (dx / dist) * 0.4;
              nodeA.y += (dy / dist) * 0.4;
            }
          }
        }

        // Draw connections to neighboring nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.16;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);

            if (nodeA.isOrange || nodeB.isOrange) {
              ctx.strokeStyle = `rgba(13, 148, 136, ${alpha * 1.2})`;
            } else {
              ctx.strokeStyle = `rgba(11, 25, 44, ${alpha})`;
            }
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Draw Travelling Data Packets (Information Flow)
      if (!isReducedMotion) {
        for (const p of particles) {
          p.progress += p.speed;
          if (p.progress >= 1) {
            p.progress = 0;
            p.fromNode = p.toNode;
            p.toNode = Math.floor(Math.random() * nodes.length);
            while (p.toNode === p.fromNode) {
              p.toNode = Math.floor(Math.random() * nodes.length);
            }
          }

          const nodeA = nodes[p.fromNode];
          const nodeB = nodes[p.toNode];
          if (nodeA && nodeB) {
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only render particle if nodes are reasonably connected
            if (dist < maxDistance * 1.5) {
              const px = nodeA.x + dx * p.progress;
              const py = nodeA.y + dy * p.progress;

              ctx.beginPath();
              ctx.arc(px, py, 1.8, 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 6;
              ctx.fill();
              ctx.shadowBlur = 0; // reset
            }
          }
        }
      }

      // 4. Draw Nodes with subtle halos
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1, node.radius), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Glowing outer aura for orange pulses
        if (node.isOrange) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(224, 91, 45, 0.08)';
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      mediaQuery.removeEventListener('change', onMotionChange);
    };
  }, [isSubdued]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
        isSubdued ? 'opacity-25' : 'opacity-100'
      }`}
      aria-hidden="true"
    />
  );
};
