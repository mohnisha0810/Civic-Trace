import React, { useState } from 'react';
import { Sparkles, Eye, Sliders, Layers } from 'lucide-react';
import { LiquidGlassDemo } from '../ui/liquid-glass-demo';

export const LiquidGlassSection: React.FC = () => {
  const [shape, setShape] = useState<'circle' | 'pill'>('pill');
  const [aberration, setAberration] = useState(14);
  const [scale, setScale] = useState(48);

  return (
    <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-burnt uppercase tracking-wider px-3 py-1 bg-peach rounded-full inline-flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>Aceternity UI • Liquid Glass Engine</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-forest mt-2">
            Refracting Truth: The CivicTrace Optics
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5 max-w-2xl">
            A Snell&apos;s-law refractive displacement lens demonstrating digital transparency. Drag the liquid glass lens to bend and inspect the civic data grid underneath.
          </p>
        </div>

        {/* Shape & Lens Controls */}
        <div className="flex items-center gap-2 bg-ivory p-1.5 rounded-2xl border border-sage self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setShape('pill')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              shape === 'pill'
                ? 'bg-forest text-softwhite shadow-xs'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Pill Lens
          </button>
          <button
            onClick={() => setShape('circle')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              shape === 'circle'
                ? 'bg-forest text-softwhite shadow-xs'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Circle Lens
          </button>
        </div>
      </div>

      {/* The Liquid Glass Component Frame */}
      <div className="rounded-3xl overflow-hidden shadow-elevated">
        <LiquidGlassDemo
          shape={shape}
          scale={scale}
          aberration={aberration}
          bevelDepth={37}
          frost={0.4}
          tint={0.12}
          title="Every Issue Tracked. Every Resolution Verified."
          subtitle="Drag the refractive liquid glass lens to inspect the underlying municipal ledger."
          badgeText="CivicTrace Optical Ledger"
          className="h-[30rem] sm:h-[34rem]"
        />
      </div>

      {/* Optical Tuning Controls Footer */}
      <div className="bg-softwhite rounded-2xl p-4 border border-sage shadow-subtle flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-charcoal-muted uppercase">
              Chromatic Aberration:
            </span>
            <input
              type="range"
              min="0"
              max="24"
              value={aberration}
              onChange={e => setAberration(Number(e.target.value))}
              className="w-24 accent-burnt cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-burnt">{aberration}px</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-charcoal-muted uppercase">
              Displacement Scale:
            </span>
            <input
              type="range"
              min="20"
              max="70"
              value={scale}
              onChange={e => setScale(Number(e.target.value))}
              className="w-24 accent-forest cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-forest">{scale}px</span>
          </div>
        </div>

        <div className="text-[11px] font-medium text-charcoal-muted flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Active Snell&apos;s-law SVG backdrop filter displacement map</span>
        </div>
      </div>
    </section>
  );
};
