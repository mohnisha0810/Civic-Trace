import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { StippleType } from '../ui/stipple-type';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';
import { CityBackdrop } from '../visual/CityBackdrop';

interface HeroSectionProps {
  onOpenReportModal: () => void;
  onOpenCivicLens?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenReportModal,
}) => {
  const { complaints, setActiveTab, setSelectedComplaintId } = useCivicData();
  const [trackQuery, setTrackQuery] = useState('');
  const [trackError, setTrackError] = useState(false);
  const [activeSignalIndex, setActiveSignalIndex] = useState<number | null>(null);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackQuery.trim().toUpperCase();
    if (!clean) return;

    const found = complaints.find((c) => c.id.toUpperCase() === clean);
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
  const inProgressCount = complaints.filter(
    (c) => c.status === 'in_progress' || c.status === 'assigned'
  ).length;
  const verifiedCount = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'verified'
  ).length;

  // Real sample active complaints for interactive network node preview
  const livePreviewComplaint =
    complaints.length > 0
      ? complaints[activeSignalIndex !== null ? activeSignalIndex % complaints.length : 0]
      : null;

  return (
    <section className="relative pt-10 sm:pt-16 pb-10 px-4 sm:px-8 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Subtle City Skyline Architectural Backdrop inspired by official CivicTrace logo */}
      <CityBackdrop variant="skyline" opacity={0.07} />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.12 },
          },
        }}
        className="max-w-3xl mx-auto text-center space-y-6 relative z-10"
      >
        {/* 1. Official Tagline Badge */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: -8 },
            visible: { opacity: 1, y: 0 },
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-spruce-light rounded-full border border-sage text-xs font-semibold text-navy shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
          <span>Every Issue Tracked. Every Resolution Verified.</span>
        </motion.div>

        {/* 2. Main Headline with Stipple Type Interactive Marbled Ink */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          className="py-1"
        >
          <StippleType
            text="From Civic Complaints to Verified Resolutions."
            textColor="#103533"
            accentColor="#D86230"
            stippleColor="#164240"
            fontSize={42}
          />
        </motion.div>

        {/* 3. Subtitle / Narrative */}
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          className="text-sm sm:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed"
        >
          A civic grievance platform where reported defects enter an objective priority ledger, municipal operations deploy field contractors, and final repairs are confirmed by citizens.
        </motion.p>

        {/* 4. Action Controls: Report Button & Quick Track Bar */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto"
        >
          {/* Primary Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenReportModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card hover:shadow-elevated transition-all flex-shrink-0"
          >
            <PlusCircle size={16} className="text-burnt" />
            <span>Report a Civic Issue</span>
          </motion.button>

          {/* Quick Track Input Bar */}
          <form
            onSubmit={handleTrackSubmit}
            className="w-full sm:flex-1 relative flex items-center"
          >
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => {
                setTrackQuery(e.target.value);
                setTrackError(false);
              }}
              placeholder="Track Complaint ID (e.g. CT-1001)"
              className={`w-full pl-3.5 pr-20 py-3.5 bg-ivory rounded-xl border text-xs font-medium text-charcoal focus:outline-none transition-all ${
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
        </motion.div>

        {trackError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-burnt font-semibold"
          >
            No complaint found matching "{trackQuery}". Check ID or explore the registry below.
          </motion.div>
        )}

        {/* 5. A Meaningful Hero Interaction: Interactive Civic Network Node Card */}
        {complaints.length > 0 && livePreviewComplaint && (
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            className="pt-2 max-w-md mx-auto"
          >
            <div
              onMouseEnter={() => setActiveSignalIndex((prev) => (prev === null ? 0 : prev + 1))}
              onClick={() => {
                setSelectedComplaintId(livePreviewComplaint.id);
                setActiveTab('track');
              }}
              className="bg-softwhite/90 backdrop-blur-xs rounded-2xl border border-sage/80 p-3 shadow-subtle hover:shadow-card transition-all cursor-pointer flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-forest text-softwhite flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Activity size={18} className="text-burnt" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono font-bold text-forest">
                    Live Record #{livePreviewComplaint.id}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-peach text-burnt rounded">
                    Score {livePreviewComplaint.edpsScore}
                  </span>
                </div>
                <p className="text-xs font-bold text-charcoal truncate mt-0.5">
                  {CATEGORY_LABELS[livePreviewComplaint.category] || livePreviewComplaint.title}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-charcoal-muted truncate">
                  <MapPin size={11} className="text-burnt flex-shrink-0" />
                  <span className="truncate">{livePreviewComplaint.address}</span>
                </div>
              </div>

              <div className="text-charcoal-muted group-hover:text-forest transition-colors pr-1">
                <ChevronRight size={16} />
              </div>
            </div>
            <span className="text-[10px] text-charcoal-muted mt-1 block">
              Hover or tap to cycle through live community complaints
            </span>
          </motion.div>
        )}

        {/* 6. Real Live Database Summary Bar */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          className="pt-4 grid grid-cols-3 gap-3 max-w-lg mx-auto"
        >
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
        </motion.div>
      </motion.div>
    </section>
  );
};
