import React from 'react';

interface CivicTraceLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'emblem-text' | 'emblem-only' | 'full-lockup';
}

export const CivicTraceLogo: React.FC<CivicTraceLogoProps> = ({
  className = '',
  showTagline = false,
  size = 'md',
  variant = 'emblem-text',
}) => {
  const emblemSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  if (variant === 'full-lockup') {
    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <img
          src="/civictrace-logo-transparent.png"
          alt="CivicTrace — Every Issue Tracked. Every Resolution Verified."
          className="h-20 w-auto object-contain"
        />
      </div>
    );
  }

  if (variant === 'emblem-only') {
    return (
      <div className={`select-none flex-shrink-0 ${className}`}>
        <img
          src="/civictrace-emblem-transparent.png"
          alt="CivicTrace Emblem"
          className={`${emblemSizes[size]} object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official CivicTrace Uploaded Emblem */}
      <img
        src="/civictrace-emblem-transparent.png"
        alt="CivicTrace Emblem"
        className={`${emblemSizes[size]} object-contain flex-shrink-0`}
      />

      <div className="flex flex-col justify-center">
        <div className={`font-black tracking-tight leading-none ${titleSizes[size]}`}>
          <span className="text-[#0F3A36]">Civic</span>
          <span className="text-[#E05B2D]">Trace</span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-semibold text-slate-500 tracking-tight mt-1">
            Every Issue Tracked. Every Resolution Verified.
          </span>
        )}
      </div>
    </div>
  );
};
