import React from 'react';
import { CivicTraceLogo } from './CivicTraceLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-sage bg-softwhite/80 py-8 px-4 sm:px-8 text-xs text-charcoal-muted mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CivicTraceLogo size="sm" showTagline={false} />
          <span className="hidden sm:inline">•</span>
          <span className="font-medium text-charcoal">
            Every Issue Tracked. Every Resolution Verified.
          </span>
        </div>

        <div className="text-[11px] text-charcoal-muted text-center sm:text-right">
          Autonomous Civic Issue Intelligence & Transparent Verification.
        </div>
      </div>
    </footer>
  );
};
