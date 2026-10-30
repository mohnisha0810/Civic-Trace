import React, { useState } from 'react';
import { PlusCircle, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';

interface FinalActionSectionProps {
  onOpenReportModal: () => void;
}

export const FinalActionSection: React.FC<FinalActionSectionProps> = ({
  onOpenReportModal,
}) => {
  const { complaints, setSelectedComplaintId, setActiveTab } = useCivicData();
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

  return (
    <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto w-full text-center">
      <div className="bg-gradient-to-b from-forest to-forest-hover text-softwhite rounded-3xl p-8 sm:p-14 shadow-elevated max-w-4xl mx-auto space-y-6 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-burnt/10 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-sage/10 pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-burnt px-3 py-1 bg-peach/20 rounded-full inline-block">
            Take Civic Action Today
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-softwhite">
            Ready to Track an Issue or Verify a Repair?
          </h2>
          <p className="text-xs sm:text-sm text-pale text-sage max-w-xl mx-auto leading-relaxed">
            Every reported defect increases municipal accountability. Join verified residents across India tracking public infrastructure.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto relative z-10">
          <button
            onClick={onOpenReportModal}
            className="w-full sm:w-auto px-6 py-3.5 bg-burnt hover:bg-burnt-hover text-softwhite rounded-xl font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2 flex-shrink-0"
          >
            <PlusCircle size={16} />
            <span>Report a Civic Issue</span>
          </button>

          <form onSubmit={handleTrackSubmit} className="w-full sm:flex-1 relative flex items-center">
            <input
              type="text"
              value={trackQuery}
              onChange={e => {
                setTrackQuery(e.target.value);
                setTrackError(false);
              }}
              placeholder="Track Complaint ID (e.g. CT-1001)"
              className="w-full pl-3.5 pr-20 py-3.5 bg-softwhite rounded-xl text-xs font-semibold text-charcoal focus:outline-none placeholder:text-charcoal-muted"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-2 bg-forest text-softwhite hover:bg-forest-hover rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <span>Track</span>
              <ArrowRight size={12} />
            </button>
          </form>
        </div>

        {trackError && (
          <div className="text-xs text-burnt font-semibold">
            No complaint found matching "{trackQuery}". Check ID or inspect recent complaints.
          </div>
        )}
      </div>
    </section>
  );
};
