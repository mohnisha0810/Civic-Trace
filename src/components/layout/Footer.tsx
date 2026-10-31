import React from 'react';
import { CivicTraceLogo } from './CivicTraceLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/90 bg-white/80 py-8 px-4 sm:px-8 text-xs text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CivicTraceLogo size="sm" showTagline={false} />
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="font-semibold text-slate-700">
            Every Issue Tracked. Every Resolution Verified.
          </span>
        </div>

        <div className="text-[11px] text-slate-500 text-center sm:text-right font-medium">
          Autonomous Civic Issue Intelligence & Transparent Verification.
        </div>
      </div>
    </footer>
  );
};
