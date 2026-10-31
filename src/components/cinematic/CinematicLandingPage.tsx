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
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Compass,
  AlertCircle,
  Building,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OrganizationType } from '../../types';
import { checkRateLimit, sanitizeTextInput } from '../../lib/securityService';
import { ALL_INDIAN_STATES } from '../../lib/indiaGeoService';

interface CinematicLandingPageProps {
  onEnterGuest: () => void;
  initialPhase?: 'cinematic' | 'login';
}

const ORG_TYPES: { id: OrganizationType; label: string }[] = [
  { id: 'municipal_corporation', label: 'Municipal Corporation (e.g. MCD, BMC, BBMP)' },
  { id: 'municipality', label: 'Municipality / Municipal Council' },
  { id: 'state_government', label: 'State Government Department' },
  { id: 'central_government', label: 'Central Government Agency' },
  { id: 'union_territory', label: 'Union Territory Administration' },
  { id: 'panchayat', label: 'Panchayati Raj Institution' },
  { id: 'directorate', label: 'Directorate / Executive Board' },
  { id: 'other', label: 'Other Statutory Civic Body' },
];

export const CinematicLandingPage: React.FC<CinematicLandingPageProps> = ({
  onEnterGuest,
  initialPhase = 'cinematic',
}) => {
  const { loginWithPassword, signupCitizen, signupGovernment, authError, clearError } = useAuth();

  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialReqPhase = (queryParams?.get('phase') as 'cinematic' | 'login') || initialPhase;
  const initialReqScene = (Number(queryParams?.get('scene')) as 1 | 2 | 3 | 4) || 1;

  const [phase, setPhase] = useState<'cinematic' | 'login'>(initialReqPhase);
  const [currentScene, setCurrentScene] = useState<1 | 2 | 3 | 4>(initialReqScene);
  const [sceneProgress, setSceneProgress] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  // Authentication Form States
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [accountType, setAccountType] = useState<'citizen' | 'government'>('citizen');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Government Registration Fields
  const [orgType, setOrgType] = useState<OrganizationType>('municipal_corporation');
  const [orgName, setOrgName] = useState('');
  const [state, setState] = useState('Delhi');
  const [district, setDistrict] = useState('New Delhi');
  const [department, setDepartment] = useState('Public Works Department (PWD & Roads)');
  const [designation, setDesignation] = useState('Executive Engineer');
  const [officialPhone, setOfficialPhone] = useState('');

  // Video State
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleSkipToLogin = useCallback(() => {
    setIsSkipped(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setPhase('login');
  }, []);

  const handleReplayIntro = () => {
    setIsSkipped(false);
    startTimeRef.current = null;
    setSceneProgress(0);
    setCurrentScene(1);
    setPhase('cinematic');
  };

  // If user prefers reduced motion, jump directly to login
  useEffect(() => {
    if (prefersReducedMotion && initialPhase === 'cinematic') {
      setPhase('login');
    }
  }, [prefersReducedMotion, initialPhase]);

  // Canvas Cinematic Animation Loop
  useEffect(() => {
    if (phase !== 'cinematic') return;

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

    const DURATION = 8600; // 8.6 seconds total sequence
    const initialOffsetMs =
      initialReqScene === 2 ? 3000 : initialReqScene === 3 ? 5500 : initialReqScene === 4 ? 7500 : 0;

    // Procedural globe points
    const spherePoints: { lat: number; lon: number; isCity: boolean; isIndia: boolean }[] = [];
    for (let lat = -70; lat <= 70; lat += 7) {
      const ringRadius = Math.cos((lat * Math.PI) / 180);
      const lonStep = Math.max(8, Math.round(14 / (ringRadius + 0.1)));
      for (let lon = -180; lon < 180; lon += lonStep) {
        const inIndia = lat >= 8 && lat <= 32 && lon >= 68 && lon <= 92;
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

    // Procedural city grid blocks for Scene 2 & 3
    const cityBlocks: { x: number; y: number; w: number; h: number; type: 'road' | 'building' }[] = [];
    for (let i = -14; i <= 14; i++) {
      for (let j = -10; j <= 10; j++) {
        const bx = i * 44;
        const by = j * 38;
        if (Math.abs(i) % 3 === 0 || Math.abs(j) % 3 === 0) {
          cityBlocks.push({ x: bx, y: by, w: 38, h: 32, type: 'road' });
        } else {
          cityBlocks.push({ x: bx + 4, y: by + 4, w: 30, h: 24, type: 'building' });
        }
      }
    }

    const render = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp - initialOffsetMs;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / DURATION);
      setSceneProgress(progress);

      let scene: 1 | 2 | 3 | 4 = 1;
      if (progress < 0.28) {
        scene = 1; // Scene 1: The World Awakens
      } else if (progress < 0.58) {
        scene = 2; // Scene 2: Camera Approaches Earth / City Grid
      } else if (progress < 0.82) {
        scene = 3; // Scene 3: Civic Issue Identified & Resolved
      } else {
        scene = 4; // Scene 4: CivicTrace Identity Reveal
      }
      setCurrentScene(scene);

      // Deep Space Midnight Canvas Background (#050B14)
      ctx.fillStyle = '#050B14';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // ======================================================================
      // SCENE 1: THE WORLD AWAKENS
      // ======================================================================
      if (scene === 1) {
        const s1Progress = progress / 0.28;

        const shockwaveRadius = s1Progress * Math.max(width, height) * 0.7;
        const shockwaveAlpha = Math.max(0, 1 - s1Progress);
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 254, ${shockwaveAlpha * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        const flareGlow = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          200 * s1Progress
        );
        flareGlow.addColorStop(0, 'rgba(0, 242, 254, 0.45)');
        flareGlow.addColorStop(0.5, 'rgba(15, 58, 54, 0.2)');
        flareGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = flareGlow;
        ctx.fillRect(0, 0, width, height);

        const globeRadius = Math.min(width, height) * 0.28 * Math.min(1, s1Progress * 1.2);
        const rotationAngle = s1Progress * 0.4;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, globeRadius + 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
        ctx.fill();

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
          const z = Math.cos(radLat) * Math.cos(radLon);
          if (z > 0) {
            const px = centerX + Math.cos(radLat) * Math.sin(radLon) * globeRadius;
            const py = centerY - Math.sin(radLat) * globeRadius;

            ctx.beginPath();
            const pointRadius = pt.isIndia ? 2.4 : pt.isCity ? 1.8 : 1.2;
            ctx.arc(px, py, pointRadius, 0, Math.PI * 2);

            if (pt.isIndia) {
              ctx.fillStyle = 'rgba(224, 91, 45, 0.95)';
            } else if (pt.isCity) {
              ctx.fillStyle = 'rgba(255, 179, 71, 0.85)';
            } else {
              ctx.fillStyle = 'rgba(0, 242, 254, 0.45)';
            }
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // ======================================================================
      // SCENE 2: CAMERA APPROACHES EARTH / URBAN DESCENT
      // ======================================================================
      if (scene === 2) {
        const s2Progress = (progress - 0.28) / 0.3;
        const zoomScale = 1 + s2Progress * 2.8;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(zoomScale, zoomScale);

        ctx.fillStyle = 'rgba(6, 19, 31, 0.85)';
        ctx.fillRect(-width, -height, width * 2, height * 2);

        // Render City Blocks Grid
        for (const blk of cityBlocks) {
          if (blk.type === 'road') {
            ctx.fillStyle = 'rgba(14, 58, 71, 0.35)';
            ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.18)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
          } else {
            ctx.fillStyle = 'rgba(10, 32, 45, 0.8)';
            ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
          }
        }

        // Luminous Indian Target Node
        const targetRadius = 6 + Math.sin(timestamp * 0.008) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, targetRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#E05B2D';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, 18 + s2Progress * 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(224, 91, 45, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }

      // ======================================================================
      // SCENE 3: CIVIC TELEMETRY & DIGITAL TWIN
      // ======================================================================
      if (scene === 3) {
        const s3Progress = (progress - 0.58) / 0.24;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Static crisp city blueprint
        for (const blk of cityBlocks) {
          if (blk.type === 'road') {
            ctx.fillStyle = 'rgba(14, 58, 71, 0.4)';
            ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
          }
        }

        // Radar telemetry beam sweep
        const sweepAngle = timestamp * 0.003;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 140, sweepAngle, sweepAngle + 0.5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
        ctx.fill();

        // Range rings
        [40, 80, 120].forEach((r) => {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        });

        // Center Pulsing Issue Node
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = s3Progress > 0.6 ? '#10B981' : '#E05B2D';
        ctx.fill();

        ctx.restore();
      }

      // ======================================================================
      // SCENE 4: CIVICTRACE BRAND IDENTITY REVEAL
      // ======================================================================
      if (scene === 4) {
        const s4Progress = (progress - 0.82) / 0.18;

        const ambientAura = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          Math.min(width, height) * 0.55
        );
        ambientAura.addColorStop(0, 'rgba(0, 242, 254, 0.2)');
        ambientAura.addColorStop(0.6, 'rgba(15, 58, 54, 0.12)');
        ambientAura.addColorStop(1, 'transparent');
        ctx.fillStyle = ambientAura;
        ctx.fillRect(0, 0, width, height);

        // Subtle geometric grid
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
        ctx.lineWidth = 0.8;
        const step = 60;
        for (let x = 0; x < width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Loop or transition to login at completion
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        // Automatic transition to login after Scene 4 completes
        setTimeout(() => {
          setPhase('login');
        }, 1200);
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase]);

  // Rate-limited Login Handler
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = sanitizeTextInput(identifier).trim();
    if (!cleanId || !password) return;

    const rateCheck = checkRateLimit(`auth_login_${cleanId.toLowerCase()}`, 5, 120000);
    if (!rateCheck.allowed) {
      setRateLimitMessage(
        `Too many login attempts. Cooldown active. Please wait ${rateCheck.retryAfterSeconds}s.`
      );
      return;
    }

    setIsSubmitting(true);
    setRateLimitMessage(null);
    clearError();

    const ok = loginWithPassword(cleanId, password);
    setIsSubmitting(false);
    if (!ok) {
      // Login failed, error will display via authError
    }
  };

  // Registration Handler
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = sanitizeTextInput(identifier).trim();
    const cleanName = sanitizeTextInput(name).trim();
    if (!cleanId || !password || !cleanName) return;

    setIsSubmitting(true);
    clearError();

    let res: { success: boolean; error?: string };
    if (accountType === 'citizen') {
      res = signupCitizen({
        name: cleanName,
        identifier: cleanId,
        password,
        phone: phone.trim() || undefined,
      });
    } else {
      res = signupGovernment({
        name: cleanName,
        identifier: cleanId,
        password,
        details: {
          organizationType: orgType,
          organizationName: orgName.trim() || 'Municipal Department',
          state,
          district,
          city: district,
          department,
          designation,
          officialEmail: cleanId,
          officialPhone: officialPhone.trim() || phone.trim() || '9999999999',
          jurisdictionBoundary: {
            state,
            district,
            city: district,
          },
        },
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white relative overflow-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* ==================================================================== */}
      {/* STAGE A: CINEMATIC WORLD-TO-CITY SEQUENCE (Scenes 1 - 4)             */}
      {/* ==================================================================== */}
      {phase === 'cinematic' && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between">
          <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full block" />

          {/* Top Bar: Brand & Instant Skip Control */}
          <div className="relative z-10 px-6 py-5 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.4)]">
                <ShieldCheck size={18} className="text-cyan-300" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white font-mono">
                CIVIC<span className="text-burnt">TRACE</span>
              </span>
            </div>

            <button
              onClick={handleSkipToLogin}
              className="px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-all hover:scale-105 shadow-card flex items-center gap-1.5 cursor-pointer"
            >
              <span>Skip to Sign In</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Center Stage Scene Captions */}
          <div className="relative z-10 text-center px-4 max-w-xl mx-auto my-auto pointer-events-none">
            <AnimatePresence mode="wait">
              {currentScene === 1 && (
                <motion.div
                  key="scene-1"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-3"
                >
                  <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-extrabold bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30 inline-block">
                    Scene 1 • World Awakening
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    Every Location Has a Story.
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-100/75 max-w-md mx-auto">
                    Global civic telemetry active across 28 States and 8 Union Territories.
                  </p>
                </motion.div>
              )}

              {currentScene === 2 && (
                <motion.div
                  key="scene-2"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3"
                >
                  <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-extrabold bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30 inline-block">
                    Scene 2 • Urban Descent to India
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    Every Civic Issue Deserves Attention.
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-100/75 max-w-md mx-auto">
                    Arterial roadways, drainage systems, water supply, and streetlights mapped in real-time.
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
                  <div className="inline-block bg-black/70 backdrop-blur-md p-5 rounded-2xl border border-cyan-500/40 text-left max-w-md mx-auto shadow-elevated">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-300 border-b border-cyan-500/20 pb-2 mb-2">
                      <span>INCIDENT TELEMETRY: CT-1001</span>
                      <span className="text-emerald-400">RESOLVED & VERIFIED ✓</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                      <div className="p-1.5 rounded bg-burnt/25 border border-burnt/50 text-burnt font-bold">
                        1. Reported
                      </div>
                      <div className="p-1.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
                        2. EDPS 88
                      </div>
                      <div className="p-1.5 rounded bg-sky-950 border border-sky-400/40 text-sky-300 font-bold">
                        3. Dispatched
                      </div>
                      <div className="p-1.5 rounded bg-emerald-950 border border-emerald-400/40 text-emerald-300 font-bold">
                        4. Verified
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan-200/60 block text-center mt-2.5">
                      6-Stage Tamper-Evident Resolution Journey with Geotagged Proof
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
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest via-teal-900 to-cyan-950 border-2 border-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,242,254,0.4)]">
                    <ShieldCheck size={36} className="text-cyan-300" />
                  </div>

                  <div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono">
                      CIVIC<span className="text-burnt">TRACE</span>
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold text-cyan-200 tracking-wider uppercase mt-1">
                      Every Issue Tracked. Every Resolution Verified.
                    </p>
                  </div>

                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleSkipToLogin}
                      className="w-full sm:w-auto px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl shadow-card transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      onClick={onEnterGuest}
                      className="w-full sm:w-auto px-6 py-3 bg-black/60 hover:bg-black/80 border border-cyan-400/40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Explore Platform as Guest
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Timeline Indicator */}
          <div className="relative z-10 px-6 py-4 flex items-center justify-between border-t border-cyan-500/15 backdrop-blur-xs text-[11px] font-mono text-cyan-300">
            <div className="flex items-center gap-2.5">
              <span>SEQUENCE</span>
              <div className="w-32 sm:w-48 h-1.5 bg-cyan-950 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-100 ease-linear"
                  style={{ width: `${sceneProgress * 100}%` }}
                />
              </div>
              <span>{Math.round(sceneProgress * 100)}%</span>
            </div>

            <span className="text-[10px] text-cyan-200/60 hidden sm:inline">
              Continuous 4-Scene Spatial Sequence • India Spatial Kernel Active
            </span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STAGE B: CINEMATIC SPLIT-SCREEN AUTHENTICATION GATEWAY               */}
      {/* ==================================================================== */}
      {phase === 'login' && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen relative z-10">
          {/* LEFT PANEL: VIDEO / TELEMETRY CINEMATIC VIEWPORT */}
          <div className="lg:w-7/12 relative flex flex-col justify-between p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-cyan-500/20 bg-gradient-to-br from-[#06131f] via-[#040e17] to-[#02060b] overflow-hidden">
            {/* Ambient Animated Video / Poster Viewport Container */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <video
                ref={videoRef}
                src="/assets/auth-cinematic.mp4"
                poster="/assets/auth-video-poster.svg"
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/40 to-transparent" />
            </div>

            {/* Top Brand Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-forest border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.4)]">
                  <ShieldCheck size={20} className="text-cyan-300" />
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-white font-mono block leading-none">
                    CIVIC<span className="text-burnt">TRACE</span>
                  </span>
                  <span className="text-[9px] font-semibold text-cyan-300 uppercase tracking-widest">
                    Municipal Intelligence
                  </span>
                </div>
              </div>

              {/* Replay Cinematic Intro Trigger */}
              <button
                onClick={handleReplayIntro}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer hover:scale-105"
                title="Watch the Cinematic World-to-City Transformation"
              >
                <RotateCcw size={13} className="text-cyan-400" />
                <span className="hidden sm:inline">Replay Intro</span>
              </button>
            </div>

            {/* Bottom Cinematic Telemetry HUD */}
            <div className="relative z-10 mt-12 lg:mt-0 space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>STATE TELEMETRY ACTIVE • 28 STATES & 8 UTs</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Every Issue Tracked. <br />
                <span className="text-cyan-400">Every Resolution Verified.</span>
              </h1>

              <p className="text-xs sm:text-sm text-cyan-100/75 leading-relaxed">
                India's autonomous civic grievance platform featuring explainable EDPS priority scoring, Haversine duplicate shields, and geotagged contractor verification.
              </p>

              {/* Live Status Pill Bar */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 text-[11px] font-mono">
                <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 backdrop-blur-xs">
                  <div className="text-cyan-400 font-bold">100% AUDIT</div>
                  <div className="text-[10px] text-cyan-200/60 mt-0.5">SHA-256 Chained</div>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 backdrop-blur-xs">
                  <div className="text-emerald-400 font-bold">25M GEOFENCE</div>
                  <div className="text-[10px] text-cyan-200/60 mt-0.5">GPS Verification</div>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 backdrop-blur-xs">
                  <div className="text-burnt font-bold">EDPS SCORING</div>
                  <div className="text-[10px] text-cyan-200/60 mt-0.5">Hazard Weighted</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: AUTHENTICATION FORM CARD */}
          <div className="lg:w-5/12 bg-[#06131F]/90 backdrop-blur-md p-6 sm:p-10 flex flex-col justify-center relative">
            <div className="max-w-md w-full mx-auto space-y-6">
              {/* Form Header */}
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {authMode === 'login'
                    ? 'Access Civic Portal'
                    : authMode === 'signup'
                    ? 'Register as Verified Citizen'
                    : 'Recover Account'}
                </h2>
                <p className="text-xs text-cyan-200/70">
                  {authMode === 'login'
                    ? 'Sign in with your registered email or mobile number.'
                    : 'Create your account to file grievances with cryptographic verification.'}
                </p>
              </div>

              {/* Mode Switcher Pills */}
              <div className="flex p-1 bg-black/40 rounded-xl border border-cyan-500/30 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    clearError();
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    authMode === 'login'
                      ? 'bg-cyan-500 text-black shadow-card'
                      : 'text-cyan-200 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    clearError();
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    authMode === 'signup'
                      ? 'bg-cyan-500 text-black shadow-card'
                      : 'text-cyan-200 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Rate Limit Alert */}
              {rateLimitMessage && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{rateLimitMessage}</span>
                </div>
              )}

              {/* Backend Error Alert */}
              {authError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {authMode === 'login' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                      Email or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-cyan-400/60" />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. citizen@example.com or 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-cyan-200/30 focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3.5 text-cyan-400/60" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-black/50 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-cyan-200/30 focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-cyan-400/60 hover:text-cyan-300"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-card transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
                    <ArrowRight size={14} />
                  </button>

                  {/* Quick Demo Credentials */}
                  <div className="pt-2 border-t border-cyan-500/20 space-y-2">
                    <span className="text-[10px] text-cyan-300/60 uppercase font-mono block">
                      Quick Demo Credentials:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier('admin@civictrace.gov.in');
                          setPassword('AdminCivicTrace2026!');
                        }}
                        className="p-2 rounded-lg bg-black/40 hover:bg-black/70 border border-cyan-500/30 text-left text-[11px] text-cyan-200 font-mono transition-colors"
                      >
                        <div className="font-bold text-white">Super Admin</div>
                        <div className="text-[9px] text-cyan-400">admin@civictrace.gov.in</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier('citizen.delhi@civictrace.gov.in');
                          setPassword('CitizenSecure2026!');
                        }}
                        className="p-2 rounded-lg bg-black/40 hover:bg-black/70 border border-cyan-500/30 text-left text-[11px] text-cyan-200 font-mono transition-colors"
                      >
                        <div className="font-bold text-white">Citizen Account</div>
                        <div className="text-[9px] text-cyan-400">citizen.delhi@...</div>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* REGISTRATION FORM */}
              {authMode === 'signup' && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountType('citizen')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        accountType === 'citizen'
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                          : 'bg-black/30 border-cyan-500/20 text-cyan-400/50'
                      }`}
                    >
                      Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('government')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        accountType === 'government'
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                          : 'bg-black/30 border-cyan-500/20 text-cyan-400/50'
                      }`}
                    >
                      Official / Official
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2 bg-black/50 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-cyan-200/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                      Email or Mobile
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. user@example.com"
                      className="w-full px-3.5 py-2 bg-black/50 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-cyan-200/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3.5 py-2 bg-black/50 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-cyan-200/30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {accountType === 'government' && (
                    <div className="space-y-2.5 pt-2 border-t border-cyan-500/20">
                      <div>
                        <label className="block text-[10px] font-bold text-cyan-300 uppercase">
                          Organization Type
                        </label>
                        <select
                          value={orgType}
                          onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                          className="w-full px-3 py-1.5 bg-black/60 border border-cyan-500/30 rounded-xl text-xs text-white"
                        >
                          {ORG_TYPES.map((o) => (
                            <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-cyan-300 uppercase">
                            State
                          </label>
                          <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/60 border border-cyan-500/30 rounded-xl text-xs text-white"
                          >
                            {ALL_INDIAN_STATES.map((s) => (
                              <option key={s} value={s} className="bg-slate-900 text-white">
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-cyan-300 uppercase">
                            District
                          </label>
                          <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/60 border border-cyan-500/30 rounded-xl text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-card transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Register Account'}
                  </button>
                </form>
              )}

              {/* Guest Access Alternative */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onEnterGuest}
                  className="w-full py-2.5 px-4 bg-black/40 hover:bg-black/70 border border-cyan-500/30 rounded-xl text-xs font-bold text-cyan-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass size={14} className="text-burnt" />
                  <span>Continue as Guest / Explore Public Ledger</span>
                </button>
                <p className="text-[10px] text-cyan-200/50 mt-2">
                  Browse public grievances, live civic radar, and resolution timelines without signing in.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
