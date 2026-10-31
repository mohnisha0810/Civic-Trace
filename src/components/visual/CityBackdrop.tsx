import React from 'react';

interface CityBackdropProps {
  variant?: 'skyline' | 'street' | 'community' | 'civic_grid' | 'monument';
  className?: string;
  opacity?: number;
}

/**
 * CityBackdrop provides subtle, high-quality architectural and urban imagery
 * inspired directly by the official CivicTrace logo (cityscape + curving roadway).
 * Rendered at low visual intensity so text and cards remain 100% accessible and crisp.
 */
export const CityBackdrop: React.FC<CityBackdropProps> = ({
  variant = 'skyline',
  className = '',
  opacity = 0.06,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {variant === 'skyline' && (
        <svg
          viewBox="0 0 1440 460"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover object-bottom"
          preserveAspectRatio="xMidYMax slice"
        >
          {/* Distant Skyline Silhouettes */}
          <g fill="#103533" opacity="0.6">
            <rect x="40" y="240" width="45" height="180" rx="2" />
            <rect x="95" y="200" width="60" height="220" rx="2" />
            <rect x="165" y="270" width="40" height="150" rx="2" />
            <rect x="215" y="160" width="75" height="260" rx="2" />
            <polygon points="252,110 248,160 257,160" />
            <rect x="300" y="220" width="55" height="200" rx="2" />
            <rect x="365" y="180" width="80" height="240" rx="2" />
            <rect x="455" y="250" width="50" height="170" rx="2" />
            <rect x="515" y="140" width="85" height="280" rx="2" />
            <polygon points="557,90 553,140 562,140" />
            <rect x="610" y="210" width="70" height="210" rx="2" />
            <rect x="690" y="170" width="90" height="250" rx="2" />
            <rect x="790" y="230" width="65" height="190" rx="2" />
            <rect x="865" y="150" width="80" height="270" rx="2" />
            <polygon points="905,100 901,150 910,150" />
            <rect x="955" y="220" width="55" height="200" rx="2" />
            <rect x="1020" y="180" width="85" height="240" rx="2" />
            <rect x="1115" y="260" width="50" height="160" rx="2" />
            <rect x="1175" y="160" width="75" height="260" rx="2" />
            <polygon points="1212,110 1208,160 1217,160" />
            <rect x="1260" y="210" width="60" height="210" rx="2" />
            <rect x="1330" y="240" width="70" height="180" rx="2" />
          </g>

          {/* Architectural Window Grids on High-Rises */}
          <g stroke="#FAF7EF" strokeWidth="1.5" opacity="0.4" strokeDasharray="3 4">
            <line x1="230" y1="180" x2="275" y2="180" />
            <line x1="230" y1="200" x2="275" y2="200" />
            <line x1="230" y1="220" x2="275" y2="220" />
            <line x1="230" y1="240" x2="275" y2="240" />

            <line x1="380" y1="200" x2="430" y2="200" />
            <line x1="380" y1="220" x2="430" y2="220" />
            <line x1="380" y1="240" x2="430" y2="240" />

            <line x1="530" y1="160" x2="585" y2="160" />
            <line x1="530" y1="180" x2="585" y2="180" />
            <line x1="530" y1="200" x2="585" y2="200" />
            <line x1="530" y1="220" x2="585" y2="220" />
            <line x1="530" y1="240" x2="585" y2="240" />

            <line x1="705" y1="190" x2="765" y2="190" />
            <line x1="705" y1="210" x2="765" y2="210" />
            <line x1="705" y1="230" x2="765" y2="230" />

            <line x1="880" y1="170" x2="930" y2="170" />
            <line x1="880" y1="190" x2="930" y2="190" />
            <line x1="880" y1="210" x2="930" y2="210" />

            <line x1="1035" y1="200" x2="1090" y2="200" />
            <line x1="1035" y1="220" x2="1090" y2="220" />

            <line x1="1190" y1="180" x2="1235" y2="180" />
            <line x1="1190" y1="200" x2="1235" y2="200" />
          </g>

          {/* Curving Road Arterial Inspired by Logo */}
          <path
            d="M -50 460 C 350 450, 600 360, 780 340 C 980 320, 1250 380, 1500 460 L 1500 460 L -50 460 Z"
            fill="#103533"
            opacity="0.8"
          />
          <path
            d="M 300 460 C 580 440, 720 370, 850 350 C 1020 330, 1220 390, 1450 460"
            stroke="#D86230"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M 320 460 C 600 440, 730 375, 860 355 C 1030 335, 1210 395, 1430 460"
            stroke="#FAF7EF"
            strokeWidth="2.5"
            strokeDasharray="14 12"
            fill="none"
            opacity="0.9"
          />

          {/* Civic Location Pin Highlight */}
          <g transform="translate(850, 310) scale(0.9)">
            <path
              d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z"
              fill="#D86230"
            />
            <circle cx="12" cy="12" r="5" fill="#FAF7EF" />
          </g>
        </svg>
      )}

      {variant === 'community' && (
        <svg
          viewBox="0 0 1440 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover object-bottom"
          preserveAspectRatio="xMidYMax slice"
        >
          {/* Neighbourhood Houses, Trees and Clean Pathways */}
          <g fill="#103533" opacity="0.6">
            {/* Tree silhouettes */}
            <circle cx="120" cy="280" r="35" />
            <rect x="115" y="280" width="10" height="60" />
            <circle cx="280" cy="270" r="40" />
            <rect x="275" y="270" width="10" height="70" />
            <circle cx="560" cy="285" r="30" />
            <rect x="555" y="285" width="10" height="55" />
            <circle cx="820" cy="275" r="38" />
            <rect x="815" y="275" width="10" height="65" />
            <circle cx="1120" cy="280" r="35" />
            <rect x="1115" y="280" width="10" height="60" />
            <circle cx="1320" cy="265" r="45" />
            <rect x="1315" y="265" width="10" height="75" />

            {/* Low-rise municipal buildings and civic center */}
            <polygon points="180,240 220,200 260,240" />
            <rect x="190" y="240" width="60" height="100" />
            <polygon points="380,220 440,170 500,220" />
            <rect x="400" y="220" width="80" height="120" />
            <polygon points="680,230 730,190 780,230" />
            <rect x="695" y="230" width="70" height="110" />
            <polygon points="940,210 1000,160 1060,210" />
            <rect x="960" y="210" width="80" height="130" />
            <polygon points="1200,230 1240,190 1280,230" />
            <rect x="1210" y="230" width="60" height="110" />
          </g>

          {/* Curving Community Green Path */}
          <path
            d="M 0 360 Q 360 320, 720 350 T 1440 330 L 1440 400 L 0 400 Z"
            fill="#103533"
            opacity="0.7"
          />
          <path
            d="M 0 375 Q 360 335, 720 365 T 1440 345"
            stroke="#D86230"
            strokeWidth="4"
            fill="none"
            opacity="0.8"
          />
        </svg>
      )}

      {variant === 'civic_grid' && (
        <svg
          viewBox="0 0 1200 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
        >
          {/* Spatial Grid & GIS Coordinate Nodes */}
          <g stroke="#103533" strokeWidth="1" opacity="0.3">
            {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map((x) => (
              <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="600" strokeDasharray="4 8" />
            ))}
            {[80, 160, 240, 320, 400, 480, 560].map((y) => (
              <line key={`h-${y}`} x1="0" y1={y} x2="1200" y2={y} strokeDasharray="4 8" />
            ))}
          </g>
          {/* GIS Contour Rings */}
          <circle cx="600" cy="300" r="140" stroke="#D86230" strokeWidth="1.5" opacity="0.25" fill="none" />
          <circle cx="600" cy="300" r="240" stroke="#103533" strokeWidth="1" opacity="0.2" fill="none" />
          <circle cx="600" cy="300" r="340" stroke="#D86230" strokeWidth="1" strokeDasharray="6 6" opacity="0.15" fill="none" />
        </svg>
      )}

      {variant === 'monument' && (
        <svg
          viewBox="0 0 800 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover object-bottom"
        >
          {/* Municipal Assembly / Governance Hall Architecture */}
          <g fill="#103533" opacity="0.5">
            {/* Pillars */}
            {[260, 300, 340, 380, 420, 460, 500, 540].map((x) => (
              <rect key={x} x={x} y="260" width="16" height="150" rx="2" />
            ))}
            {/* Pediment & Dome */}
            <polygon points="230,260 400,160 570,260" />
            <path d="M 330 160 Q 400 70, 470 160 Z" />
            {/* Base Steps */}
            <rect x="200" y="410" width="400" height="15" rx="1" />
            <rect x="170" y="425" width="460" height="20" rx="1" />
          </g>
          <path
            d="M 50 480 C 250 450, 550 450, 750 480"
            stroke="#D86230"
            strokeWidth="4"
            fill="none"
            opacity="0.6"
          />
        </svg>
      )}

      {variant === 'street' && (
        <svg
          viewBox="0 0 1000 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover object-bottom"
        >
          {/* Urban Streetscape Silhouette with Streetlights and Crosswalk */}
          <g fill="#103533" opacity="0.5">
            <rect x="100" y="160" width="80" height="180" />
            <rect x="200" y="120" width="100" height="220" />
            <rect x="320" y="190" width="90" height="150" />
            <rect x="600" y="150" width="110" height="190" />
            <rect x="730" y="100" width="120" height="240" />
            <rect x="870" y="180" width="90" height="160" />
            {/* Streetlights */}
            <path d="M 450 340 L 450 200 L 480 185" stroke="#103533" strokeWidth="4" fill="none" />
            <circle cx="482" cy="185" r="6" fill="#D86230" />
            <path d="M 550 340 L 550 200 L 520 185" stroke="#103533" strokeWidth="4" fill="none" />
            <circle cx="518" cy="185" r="6" fill="#D86230" />
          </g>
          <rect x="0" y="340" width="1000" height="60" fill="#103533" opacity="0.7" />
          {/* Crosswalk Zebra Stripes */}
          <g fill="#FAF7EF" opacity="0.8">
            {[420, 450, 480, 510, 540, 570].map((x) => (
              <rect key={x} x={x} y="355" width="16" height="35" rx="1" />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
};
