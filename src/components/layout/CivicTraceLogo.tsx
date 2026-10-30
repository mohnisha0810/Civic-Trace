import React from 'react';
import { motion } from 'motion/react';

interface CivicTraceLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const CivicTraceLogo: React.FC<CivicTraceLogoProps> = ({
  className = '',
  showTagline = false,
  size = 'md',
  animated = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official CivicTrace Emblem: City silhouettes converging into roadway with pin */}
      <motion.div
        whileHover={animated ? { scale: 1.04, y: -1 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`${iconSizes[size]} relative rounded-xl bg-forest flex items-center justify-center shadow-card overflow-hidden flex-shrink-0`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          {/* Skyline Buildings */}
          <rect x="7" y="20" width="5.5" height="18" rx="1" fill="#1D534D" />
          <rect x="15" y="13" width="6.5" height="25" rx="1" fill="#24645C" />
          <rect x="24.5" y="16" width="6.5" height="22" rx="1" fill="#1D534D" />
          <rect x="34" y="22" width="5.5" height="16" rx="1" fill="#24645C" />
          
          {/* Converging Roadway */}
          <path d="M12 42L20 28H28L36 42H12Z" fill="#E2EDE7" opacity="0.9" />
          <line
            x1="24"
            y1="29"
            x2="24"
            y2="41"
            stroke="#0F3A36"
            strokeWidth="1.6"
            strokeDasharray="2 2"
          />
          
          {/* Pin Marker with Subtle Reveal */}
          <motion.g
            initial={animated ? { scale: 0.6, y: -4, opacity: 0 } : false}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <path
              d="M24 14C21.79 14 20 15.79 20 18C20 21.2 24 25.5 24 25.5C24 25.5 28 21.2 28 18C28 15.79 26.21 14 24 14Z"
              fill="#E05B2D"
            />
            <circle cx="24" cy="18" r="1.8" fill="#FFFDF8" />
          </motion.g>
        </svg>
      </motion.div>

      <div className="flex flex-col justify-center">
        <div className={`font-bold tracking-tight leading-none ${titleSizes[size]}`}>
          <span className="text-forest">Civic</span>
          <span className="text-burnt">Trace</span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-medium text-charcoal-muted tracking-wide mt-1">
            Every Issue Tracked. Every Resolution Verified.
          </span>
        )}
      </div>
    </div>
  );
};
