import React from 'react';
import {
  Camera,
  Layers,
  Cpu,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Report',
      sub: 'Intake Evidence',
      description: 'Upload geotagged photographic evidence and confirmed Indian coordinates.',
      icon: Camera,
    },
    {
      num: '02',
      title: 'Detect',
      sub: 'Duplicate Shield',
      description: '50-meter Haversine spatial radar catches nearby duplicates and links crowd signals.',
      icon: Layers,
    },
    {
      num: '03',
      title: 'Prioritize',
      sub: 'EDPS Engine',
      description: 'Calculates objective mathematical priority from visual hazard depth and crowd velocity.',
      icon: Cpu,
    },
    {
      num: '04',
      title: 'Assign',
      sub: 'Work Order SLA',
      description: 'Dispatches binding digital contracts to certified field contractors with deadline hours.',
      icon: Wrench,
    },
    {
      num: '05',
      title: 'Resolve',
      sub: 'Proof-of-Fix',
      description: 'Field crews complete physical repairs and submit photographic proof with GPS validation.',
      icon: CheckCircle2,
    },
    {
      num: '06',
      title: 'Verify',
      sub: 'Community Consensus',
      description: 'Local residents inspect and vote. 2+ dispute flags auto-reopen the ticket at Priority 95.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-14 px-4 sm:px-8 border-y border-sage bg-softwhite/80">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold text-burnt uppercase tracking-wider px-3 py-1 bg-peach rounded-full">
            Closed-Loop Accountability Lifecycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-forest">
            How CivicTrace Works
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            Every complaint moves through a transparent, 6-stage operational pipeline governed by mathematics and citizen consensus.
          </p>
        </div>

        {/* 6 Steps Grid with Connecting Line */}
        <div className="relative">
          {/* Animated Connecting Line on Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 bg-sage -translate-y-6 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
            {steps.map(s => {
              const Icon = s.icon;
              return (
                <div
                  key={s.num}
                  className="bg-ivory rounded-3xl p-5 border border-sage shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-burnt">{s.num}</span>
                      <div className="w-8 h-8 rounded-xl bg-sage/70 text-forest flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-charcoal-muted block">
                      {s.sub}
                    </span>
                    <h3 className="text-sm font-extrabold text-forest mt-0.5">{s.title}</h3>
                    <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
