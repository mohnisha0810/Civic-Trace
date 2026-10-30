import React from 'react';
import { AlertCircle, Copy, FileWarning, ArrowDown } from 'lucide-react';

export const TheProblemSection: React.FC = () => {
  const problems = [
    {
      num: '01',
      title: 'The Civic Black Hole',
      subtitle: 'Opaque Bureaucracy',
      icon: AlertCircle,
      description:
        'Citizens submit grievances via webforms or chatbots and receive an automated ticket number. Months pass with zero status updates, breeding civic frustration and disengagement.',
    },
    {
      num: '02',
      title: 'Municipal Duplicate Flooding',
      subtitle: 'Alert Fatigue',
      icon: Copy,
      description:
        'A single crater on an arterial road triggers dozens of redundant complaints across portals. Databases get clogged with identical tickets, blinding field dispatchers to genuine emergencies.',
    },
    {
      num: '03',
      title: 'Ghost Resolutions',
      subtitle: 'Unverified Closures',
      icon: FileWarning,
      description:
        'Tickets are marked "Resolved" to satisfy internal SLA metrics without verifiable photographic evidence, location validation, or independent resident confirmation.',
    },
  ];

  return (
    <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <span className="text-[11px] font-bold text-burnt uppercase tracking-wider px-3 py-1 bg-peach rounded-full">
          The Structural Challenge
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-forest">
          Why Traditional Municipal Portals Break Down
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
          Civic grievance systems fail not because officials don't care, but because traditional workflows lack objective prioritization, deduplication, and independent verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {problems.map(p => {
          const Icon = p.icon;
          return (
            <div
              key={p.num}
              className="bg-softwhite rounded-3xl p-6 sm:p-7 border border-sage shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-burnt">{p.num}</span>
                  <div className="w-10 h-10 rounded-xl bg-peach/70 text-burnt flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase text-charcoal-muted">
                  {p.subtitle}
                </span>
                <h3 className="text-base font-bold text-forest mt-0.5">{p.title}</h3>
                <p className="text-xs text-charcoal-muted mt-2 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-3 border-t border-sage/60 text-[11px] font-semibold text-forest flex items-center gap-1">
                <span>CivicTrace Solves This</span>
                <ArrowDown size={12} className="text-burnt" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
