import React from 'react';
import {
  Layers,
  Cpu,
  MapPin,
  ShieldCheck,
  Sparkles,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface SmartFeaturesSectionProps {
  onOpenReportModal: () => void;
  onOpenCivicLens: () => void;
}

export const SmartFeaturesSection: React.FC<SmartFeaturesSectionProps> = ({
  onOpenReportModal,
  onOpenCivicLens,
}) => {
  const features = [
    {
      title: 'Duplicate Shield',
      category: 'Spatial Deduplication',
      icon: Layers,
      highlight: '50-Meter Haversine Radar',
      description:
        'Prevents alert fatigue by detecting nearby complaints of the same category and allowing citizens to +1 upvote existing issues rather than filing redundant tickets.',
    },
    {
      title: 'Explainable Dynamic Priority Scoring',
      category: 'Objective Prioritization',
      icon: Cpu,
      highlight: 'EDPS Multi-Vector Engine',
      description:
        'Mathematically prioritizes grievances using visual hazard depth, proximity to hospitals/schools, crowd signals, and demographic ward equity. Never a black box.',
    },
    {
      title: 'Proof-of-Fix Verification',
      category: 'Anti-Ghost Resolution',
      icon: MapPin,
      highlight: '≤ 25m Geofence Validation',
      description:
        'Contractors must submit geotagged photographic proof taken on site. If the completion coordinates diverge beyond 25 meters, the resolution claim is flagged invalid.',
    },
    {
      title: 'Democratic Community Consensus Gate',
      category: 'Citizen Accountability',
      icon: ShieldCheck,
      highlight: '2-Vote Dispute Rule',
      description:
        'A 24-hour verification window where neighborhood residents vote on repairs. If 2 or more citizens flag work as "Still Broken", the ticket auto-reopens at Priority 95.',
    },
    {
      title: 'The Civic Impact Trail',
      category: 'Signature Feature',
      icon: Sparkles,
      highlight: 'Cryptographic SHA-256 Ledger',
      description:
        'Chronological visual trace tracking intake evidence, mathematical triage, contractor work orders, field progress, and community consensus sign-off.',
    },
    {
      title: 'India-Wide Location Intelligence',
      category: 'Geospatial Search',
      icon: Compass,
      highlight: '36 States & UTs Covered',
      description:
        'Search landmarks, universities (e.g. NIID, IIT Delhi), municipal corporations, and districts, or use browser GPS with reverse-geocoded Indian address validation.',
    },
  ];

  return (
    <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-burnt uppercase tracking-wider px-3 py-1 bg-peach rounded-full">
            Intelligent Governance Infrastructure
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-forest mt-2">
            Smart Features Built for Real Operations
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5">
            Every feature executes in real TypeScript code with persistent database storage.
          </p>
        </div>

        <button
          onClick={onOpenCivicLens}
          className="text-xs font-bold text-burnt hover:text-forest flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <span>Explore in Civic Lens Mode</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="bg-softwhite rounded-3xl p-6 border border-sage shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted">
                    {f.category}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-forest">{f.title}</h3>
                <div className="text-[11px] font-bold text-burnt mt-0.5">{f.highlight}</div>
                <p className="text-xs text-charcoal-muted mt-2 leading-relaxed">{f.description}</p>
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-mono font-bold text-forest bg-ivory px-2 py-0.5 rounded border border-sage">
                  Active in Platform
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
