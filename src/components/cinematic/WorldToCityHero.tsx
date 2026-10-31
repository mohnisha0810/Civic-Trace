import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe2,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  VolumeX,
  X,
  Layers,
  Activity,
  ShieldCheck,
} from 'lucide-react';

interface WorldToCityHeroProps {
  onComplete: () => void;
  onOpenReportModal?: () => void;
  forcePlay?: boolean;
}

export const WorldToCityHero: React.FC<WorldToCityHeroProps> = ({
  onComplete,
  onOpenReportModal,
  forcePlay = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentScene, setCurrentScene] = useState<1 | 2 | 3 | 4>(1);
  const [sceneProgress, setSceneProgress] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleSkip = useCallback(() => {
    setIsSkipped(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    localStorage.setItem('civictrace_seen_cinematic_v2', 'true');
    onComplete();
  }, [onComplete]);

  // If user prefers reduced motion, skip automatically
  useEffect(() => {
    if (prefersReducedMotion && !forcePlay) {
      handleSkip();
    }
  }, [prefersReducedMotion, forcePlay, handleSkip]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const DURATION = 8200; // 8.2 seconds total sequence

    // Generate procedural continent points around sphere
    const spherePoints: { lat: number; lon: number; isCity: boolean; isIndia: boolean }[] = [];
    // Generate base globe mesh points
    for (let lat = -70; lat <= 70; lat += 7) {
      const ringRadius = Math.cos((lat * Math.PI) / 180);
      const lonStep = Math.max(8, Math.round(14 / (ringRadius + 0.1)));
      for (let lon = -180; lon < 180; lon += lonStep) {
        // High density around India (Lat: 8-32, Lon: 68-90)
        const inIndia = lat >= 8 && lat <= 32 && lon >= 68 && lon <= 92;
        // In other major landmasses
        const isEurasia = lat >= 15 && lat <= 65 && lon >= 10 && lon <= 130;
        const isAmericas = lat >= -45 && lat <= 60 && lon >= -125 && lon <= -40;
        const isAfrica = lat >= -30 && lat <= 35 && lon >= -15 && lon <= 45;

        if (inIndia || isEurasia || isAmericas || isAfrica || Math.random() < 0.2) {
          spherePoints.push({
            lat,
            lon,
            isCity: Math.random() < 0.35,
            isIndia: inIndia,
          });
        }
      }
    }

    // Procedural City Grid for Scene 2 & 3
    const cityBlocks: { x: number; y: number; w: number; h: number; type: 'road' | 'building' | 'transit' }[] = [];
    for (let i = -15; i <= 15; i++) {
      for (let j = -12; j <= 12; j++) {
        const bx = i * 42;
        const by = j * 36;
        if (Math.abs(i) % 3 === 0 || Math.abs(j) % 3 === 0) {
          cityBlocks.push({ x: bx, y: by, w: 36, h: 30, type: 'road' });
        } else {
          cityBlocks.push({ x: bx + 4, y: by + 4, w: 28, h: 22, type: 'building' });
        }
      }
    }

    const render = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / DURATION);
      setSceneProgress(progress);

      // Scene stage determination
      let scene: 1 | 2 | 3 | 4 = 1;
      if (progress < 0.28) {
        scene = 1; // Scene 1: The World Awakens (0 - 28%)
      } else if (progress < 0.58) {
        scene = 2; // Scene 2: Camera Approaches Earth / City Grid (28 - 58%)
      } else if (progress < 0.82) {
        scene = 3; // Scene 3: Civic Issue Identified & Resolved (58 - 82%)
      } else {
        scene = 4; // Scene 4: CivicTrace Identity Reveal (82 - 100%)
      }
      setCurrentScene(scene);

      // Deep Space Midnight Canvas Background (#050B14)
      ctx.fillStyle = '#050B14';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // ======================================================================
      // SCENE 1: THE WORLD AWAKENS (Cosmic emergence, atmospheric cyan limb)
      // ======================================================================
      if (scene === 1) {
        const s1Progress = progress / 0.28; // 0 to 1

        // Initial awakening light point & shockwave pulse
        const shockwaveRadius = s1Progress * Math.max(width, height) * 0.7;
        const shockwaveAlpha = Math.max(0, 1 - s1Progress);
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 254, ${shockwaveAlpha * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Core central awakening flare
        const flareGlow = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          180 * s1Progress
        );
        flareGlow.addColorStop(0, 'rgba(0, 242, 254, 0.45)');
        flareGlow.addColorStop(0.5, 'rgba(15, 58, 54, 0.2)');
        flareGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = flareGlow;
        ctx.fillRect(0, 0, width, height);

        // Globe sphere geometry
        const globeRadius = Math.min(width, height) * 0.28 * Math.min(1, s1Progress * 1.2);
        const rotationAngle = s1Progress * 0.4; // Gentle rotation

        // Atmospheric outer limb glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, globeRadius + 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
        ctx.fill();

        // Globe dark body shadow
        ctx.beginPath();
        ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#071520';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.clip();

        // Latitude & Longitude Coordinate Lines
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
        ctx.lineWidth = 0.8;
        for (let lat = -60; lat <= 60; lat += 30) {
          const y = centerY + Math.sin((lat * Math.PI) / 180) * globeRadius;
          const r = Math.cos((lat * Math.PI) / 180) * globeRadius;
          ctx.beginPath();
          ctx.ellipse(centerX, y, r, r * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Render rotating landmass points
        for (const pt of spherePoints) {
          const radLat = (pt.lat * Math.PI) / 180;
          const radLon = ((pt.lon + rotationAngle * 60) * Math.PI) / 180;

          // 3D sphere projection to 2D
          const z = Math.cos(radLat) * Math.cos(radLon);
          if (z > 0) {
            // Front facing hemisphere
            const px = centerX + Math.cos(radLat) * Math.sin(radLon) * globeRadius;
            const py = centerY - Math.sin(radLat) * globeRadius;

            ctx.beginPath();
            const pointRadius = pt.isIndia ? 2.2 : pt.isCity ? 1.8 : 1.2;
            ctx.arc(px, py, pointRadius, 0, Math.PI * 2);

            if (pt.isIndia) {
              ctx.fillStyle = 'rgba(224, 91, 45, 0.95)'; // Luminous Burnt Orange Indian hub
            } else if (pt.isCity) {
              ctx.fillStyle = 'rgba(255, 179, 71, 0.85)'; // City amber
            } else {
              ctx.fillStyle = 'rgba(0, 242, 254, 0.65)'; // Electric cyan landmass point
            }
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // ======================================================================
      // SCENE 2: CAMERA APPROACHES EARTH & TRANSITIONS TO CITY GRID
      // ======================================================================
      else if (scene === 2) {
        const s2Progress = (progress - 0.28) / (0.58 - 0.28); // 0 to 1
        const zoom = 1 + Math.pow(s2Progress, 2.2) * 8; // Accelerated exponential zoom

        // Background subtle grid lines
        ctx.strokeStyle = `rgba(0, 242, 254, ${0.08 + s2Progress * 0.1})`;
        ctx.lineWidth = 1;

        // Radiating perspective highway grid
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(zoom, zoom);

        // Transition from globe curvature into urban grid
        const cityAlpha = Math.min(1, Math.max(0, (s2Progress - 0.25) * 1.4));

        for (const block of cityBlocks) {
          if (block.type === 'road') {
            ctx.fillStyle = `rgba(15, 58, 54, ${cityAlpha * 0.35})`;
            ctx.fillRect(block.x, block.y, block.w, block.h);
            ctx.strokeStyle = `rgba(0, 242, 254, ${cityAlpha * 0.4})`;
            ctx.strokeRect(block.x, block.y, block.w, block.h);
          } else {
            ctx.fillStyle = `rgba(7, 21, 32, ${cityAlpha * 0.8})`;
            ctx.fillRect(block.x, block.y, block.w, block.h);
            ctx.strokeStyle = `rgba(226, 237, 231, ${cityAlpha * 0.15})`;
            ctx.strokeRect(block.x, block.y, block.w, block.h);
          }
        }

        // Luminous civic node coordinate locking in at center
        ctx.beginPath();
        ctx.arc(0, 0, 8 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#E05B2D';
        ctx.fill();
        ctx.restore();
      }

      // ======================================================================
      // SCENE 3: A CIVIC ISSUE BECOMES VISIBLE (Telemetric Resolution Path)
      // ======================================================================
      else if (scene === 3) {
        const s3Progress = (progress - 0.58) / (0.82 - 0.58); // 0 to 1

        // Render stable urban vector blueprint underneath
        ctx.save();
        ctx.translate(centerX, centerY);

        for (const block of cityBlocks) {
          if (Math.abs(block.x) < 300 && Math.abs(block.y) < 220) {
            ctx.fillStyle = 'rgba(7, 21, 32, 0.7)';
            ctx.fillRect(block.x, block.y, block.w, block.h);
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.18)';
            ctx.strokeRect(block.x, block.y, block.w, block.h);
          }
        }

        // Animated target focal ring around coordinate
        const pulseRing = ((s3Progress * 4) % 1) * 60;
        ctx.beginPath();
        ctx.arc(0, 0, pulseRing, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(224, 91, 45, ${1 - pulseRing / 60})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4-Stage Connected Telemetry Path drawing between checkpoints
        // Point 1 (Reported) -> Point 2 (Triage) -> Point 3 (In Progress) -> Point 4 (Resolved)
        const waypoints = [
          { x: -140, y: -40, label: '1. REPORTED', color: '#E05B2D' },
          { x: -40, y: 30, label: '2. TRIAGE EDPS', color: '#00F2FE' },
          { x: 50, y: -30, label: '3. FIELD CREW', color: '#38BDF8' },
          { x: 150, y: 20, label: '4. VERIFIED', color: '#10B981' },
        ];

        // Draw connecting vector beam
        ctx.beginPath();
        ctx.moveTo(waypoints[0].x, waypoints[0].y);
        const activeIndex = Math.min(3, Math.floor(s3Progress * 4));
        for (let i = 1; i <= activeIndex; i++) {
          ctx.lineTo(waypoints[i].x, waypoints[i].y);
        }
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00F2FE';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Draw waypoint beacons
        for (let i = 0; i < waypoints.length; i++) {
          const wp = waypoints[i];
          const isReached = i <= activeIndex;
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, isReached ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = isReached ? wp.color : 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      // ======================================================================
      // SCENE 4: THE CIVICTRACE IDENTITY REVEAL
      // ======================================================================
      else if (scene === 4) {
        const s4Progress = (progress - 0.82) / (1 - 0.82); // 0 to 1

        // Atmospheric radiating ambient glow behind logo
        const logoBackglow = ctx.createRadialGradient(
          centerX,
          centerY - 30,
          0,
          centerX,
          centerY - 30,
          240
        );
        logoBackglow.addColorStop(0, 'rgba(0, 242, 254, 0.2)');
        logoBackglow.addColorStop(0.6, 'rgba(15, 58, 54, 0.1)');
        logoBackglow.addColorStop(1, 'transparent');
        ctx.fillStyle = logoBackglow;
        ctx.fillRect(0, 0, width, height);

        // Subtle converging network lines leading into center symbol
        ctx.save();
        ctx.translate(centerX, centerY - 30);
        ctx.strokeStyle = `rgba(0, 242, 254, ${0.15 * Math.min(1, s4Progress * 1.5)})`;
        ctx.lineWidth = 1;

        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 260, Math.sin(a) * 260);
          ctx.lineTo(Math.cos(a) * 60, Math.sin(a) * 60);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Continue animation loop unless completed or skipped
      if (progress < 1 && !isSkipped) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else if (progress >= 1 && !isSkipped) {
        localStorage.setItem('civictrace_seen_cinematic_v2', 'true');
        onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [onComplete, isSkipped]);

  if (isSkipped) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050B14] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* 2D / WebGL Accelerated Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Top Header: Telemetry Status & Immediate Skip Control */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between border-b border-cyan-500/15 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono tracking-widest uppercase text-cyan-300 font-bold">
            CivicTrace Spatial Engine
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-200">
            {currentScene === 1 && 'SCENE 1: THE WORLD AWAKENS'}
            {currentScene === 2 && 'SCENE 2: URBAN DESCENT (INDIA • 28.61° N, 77.20° E)'}
            {currentScene === 3 && 'SCENE 3: CIVIC TELEMETRY TRACE'}
            {currentScene === 4 && 'SCENE 4: RESOLUTION VERIFIED'}
          </span>
        </div>

        {/* Immediate Skip Button */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-400/30 text-xs font-bold text-cyan-200 transition-all shadow-card hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>Skip to Platform</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Floating Center Narrative Content (Synchronized with Canvas Scenes) */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center my-auto pointer-events-none">
        <AnimatePresence mode="wait">
          {currentScene === 1 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-extrabold bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30 inline-block">
                Global Perspective
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
                Every Location Has a Story.
              </h1>
              <p className="text-xs sm:text-sm text-cyan-100/75 max-w-lg mx-auto font-medium">
                From satellite coordinates to local streets, public infrastructure connects us all.
              </p>
            </motion.div>
          )}

          {currentScene === 2 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-extrabold bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30 inline-block">
                Urban Descent • Central Delhi
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Every Civic Issue Deserves Attention.
              </h2>
              <p className="text-xs sm:text-sm text-cyan-100/75 max-w-md mx-auto">
                Roadways, drainage networks, water supply, and streetlights mapped in real-time.
              </p>
            </motion.div>
          )}

          {currentScene === 3 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4 }}
              className="space-y-3 pointer-events-auto"
            >
              <div className="inline-block bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 text-left max-w-md mx-auto shadow-elevated">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-cyan-300 border-b border-cyan-500/20 pb-2 mb-2">
                  <span>TELEMETRY: CT-SAMPLE-01</span>
                  <span className="text-emerald-400">STATUS: VERIFIED</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1 rounded bg-burnt/20 border border-burnt/40 text-burnt font-bold">
                    Reported
                  </div>
                  <div className="p-1 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
                    EDPS 88
                  </div>
                  <div className="p-1 rounded bg-sky-950 border border-sky-400/40 text-sky-300 font-bold">
                    Dispatched
                  </div>
                  <div className="p-1 rounded bg-emerald-950 border border-emerald-400/40 text-emerald-300 font-bold">
                    Resolved ✓
                  </div>
                </div>
                <span className="text-[9px] text-cyan-200/50 block text-center mt-2 italic">
                  Illustrative civic resolution lifecycle demonstration
                </span>
              </div>
            </motion.div>
          )}

          {currentScene === 4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-4 pointer-events-auto"
            >
              {/* CivicTrace Brand Emblem Reveal */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest via-teal-900 to-cyan-950 border-2 border-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,242,254,0.4)]">
                <ShieldCheck size={36} className="text-cyan-300" />
              </div>

              <div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  Civic<span className="text-burnt">Trace</span>
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-cyan-200 tracking-wider uppercase mt-1">
                  Every Issue Tracked. Every Resolution Verified.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleSkip}
                  className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl shadow-card transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Enter Platform</span>
                  <ArrowRight size={14} />
                </button>

                {onOpenReportModal && (
                  <button
                    onClick={() => {
                      handleSkip();
                      onOpenReportModal();
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-black/60 hover:bg-black/80 border border-cyan-400/40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Report an Issue Now
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Timeline Indicator */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between border-t border-cyan-500/15 backdrop-blur-xs text-[11px] font-mono text-cyan-300">
        <div className="flex items-center gap-2">
          <span>PROGRESS</span>
          <div className="w-32 sm:w-48 h-1.5 bg-cyan-950 rounded-full overflow-hidden border border-cyan-500/30">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-100 ease-linear"
              style={{ width: `${sceneProgress * 100}%` }}
            />
          </div>
          <span>{Math.round(sceneProgress * 100)}%</span>
        </div>

        <span className="text-[10px] text-cyan-200/60 hidden sm:inline">
          Continuous Spatial Sequence • Press Skip Anytime
        </span>
      </div>
    </div>
  );
};
