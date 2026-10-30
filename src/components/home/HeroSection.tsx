import React, { useState } from 'react';
import { PlusCircle, Search, ArrowRight, ShieldCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { StippleType } from '../ui/stipple-type';

interface HeroSectionProps {
  onOpenReportModal: () => void;
  onOpenCivicLens?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenReportModal,
  onOpenCivicLens,
}) => {
  const { complaints, setActiveTab, setSelectedComplaintId } = useCivicData();
  const [trackQuery, setTrackQuery] = useState('');
  const [trackError, setTrackError] = useState(false);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackQuery.trim().toUpperCase();
    if (!clean) return;

    const found = complaints.find(c => c.id.toUpperCase() === clean);
    if (found) {
      setSelectedComplaintId(found.id);
      setActiveTab('track');
    } else {
      setTrackError(true);
      setTimeout(() => setTrackError(false), 3000);
    }
  };

  // Real counts from actual database
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
  const verifiedCount = complaints.filter(c => c.status === 'verified').length;

  return (
    <section className="relative pt-12 sm:pt-20 pb-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
        {/* Official Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sage/70 rounded-full border border-sage text-xs font-semibold text-forest shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-burnt animate-radar-pulse" />
          <span>Every Issue Tracked. Every Resolution Verified.</span>
        </div>

        {/* Main Headline with Stipple Type Interactive Marbled Ink */}
        <div className="py-1">
          <StippleType
            text="From Civic Complaints to Verified Resolutions."
            textColor="#0F3A36"
            accentColor="#E05B2D"
            stippleColor="#1D534D"
            fontSize={42}
          />
        </div>

        <p className="text-sm sm:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          Report municipal defects with GPS and photographic evidence, track operations under objective mathematical priority scoring, and confirm physical repairs through neighborhood consensus.
        </p>

        {/* Action Controls: Report Button & Quick Track Input */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
          {/* Primary Action Button */}
          <button
            onClick={onOpenReportModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card hover:shadow-elevated transition-all flex-shrink-0"
          >
            <PlusCircle size={16} className="text-burnt" />
            <span>Report a Civic Issue</span>
          </button>

          {/* Quick Track Input Bar */}
          <form
            onSubmit={handleTrackSubmit}
            className="w-full sm:flex-1 relative flex items-center"
          >
            <input
              type="text"
              value={trackQuery}
              onChange={e => {
                setTrackQuery(e.target.value);
                setTrackError(false);
              }}
              placeholder="Track Complaint ID (e.g. CT-1001)"
              className={`w-full pl-3.5 pr-20 py-3.5 bg-ivory rounded-xl border text-xs font-medium text-charcoal focus:outline-none ${
                trackError ? 'border-burnt ring-1 ring-burnt' : 'border-sage focus:border-forest'
              }`}
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-2 bg-softwhite hover:bg-sage/40 text-forest border border-sage rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <span>Track</span>
              <ArrowRight size={12} />
            </button>
          </form>
        </div>

        {trackError && (
          <div className="text-xs text-burnt font-semibold animate-in fade-in">
            No complaint found matching "{trackQuery}". Check ID or explore the registry below.
          </div>
        )}

        {/* Real Live Database Summary Bar */}
        <div className="pt-6 grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <div className="p-3 bg-softwhite rounded-2xl border border-sage shadow-subtle text-center">
            <span className="text-[10px] font-bold text-charcoal-muted uppercase">Total Filed</span>
            <div className="text-xl sm:text-2xl font-extrabold text-forest mt-0.5">{totalCount}</div>
          </div>
          <div className="p-3 bg-softwhite rounded-2xl border border-sage shadow-subtle text-center">
            <span className="text-[10px] font-bold text-burnt uppercase">In Progress</span>
            <div className="text-xl sm:text-2xl font-extrabold text-burnt mt-0.5">{inProgressCount}</div>
          </div>
          <div className="p-3 bg-softwhite rounded-2xl border border-sage shadow-subtle text-center">
            <span className="text-[10px] font-bold text-forest uppercase">Verified Closed</span>
            <div className="text-xl sm:text-2xl font-extrabold text-forest mt-0.5">{verifiedCount}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
