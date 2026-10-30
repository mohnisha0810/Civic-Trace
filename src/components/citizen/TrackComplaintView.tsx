import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  ThumbsUp,
  Wrench,
  AlertCircle,
  Sparkles,
  ChevronRight,
  X,
  Filter,
  ShieldCheck,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintStatus } from '../../types';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';

// Reusable 3-Stage Visual Complaint Status Journey Component
export const ComplaintStatusJourney: React.FC<{ status: ComplaintStatus; isCompact?: boolean }> = ({
  status,
  isCompact = false,
}) => {
  // Map database status to 3 canonical stages
  let activeStage: 1 | 2 | 3 = 1;
  if (status === 'resolved' || status === 'awaiting_verification' || status === 'verified') {
    activeStage = 3;
  } else if (
    status === 'assigned' ||
    status === 'in_progress' ||
    status === 'reopened' ||
    status === 'disputed'
  ) {
    activeStage = 2;
  } else {
    activeStage = 1;
  }

  const progressPercent = activeStage === 1 ? '16%' : activeStage === 2 ? '50%' : '100%';

  if (isCompact) {
    return (
      <div className="space-y-1.5 w-full">
        {/* Progress track line */}
        <div className="relative h-1.5 bg-sage/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: progressPercent }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              activeStage === 3
                ? 'bg-emerald-600'
                : activeStage === 2
                ? 'bg-teal-700'
                : 'bg-amber-500'
            }`}
          />
        </div>
        {/* Stage Labels */}
        <div className="flex items-center justify-between text-[10px] font-semibold text-charcoal-muted">
          <span className={activeStage >= 1 ? 'text-forest font-bold' : ''}>Intake</span>
          <span className={activeStage >= 2 ? 'text-teal-800 font-bold' : ''}>In Progress</span>
          <span className={activeStage === 3 ? 'text-emerald-700 font-bold' : ''}>Resolved</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory rounded-2xl p-4 border border-sage space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted">
          Resolution Lifecycle
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            activeStage === 3
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : activeStage === 2
              ? 'bg-teal-100 text-teal-800 border border-teal-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}
        >
          {activeStage === 3
            ? 'Verified Resolution'
            : activeStage === 2
            ? 'Active Field Crew'
            : 'Pending Triage'}
        </span>
      </div>

      {/* Visual Journey Track */}
      <div className="relative pt-2 pb-1">
        {/* Background track line */}
        <div className="absolute top-5 left-4 right-4 h-1 bg-sage rounded-full z-0" />
        {/* Active progress track */}
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: activeStage === 1 ? '10%' : activeStage === 2 ? '50%' : '100%',
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`absolute top-5 left-4 h-1 rounded-full z-0 ${
            activeStage === 3 ? 'bg-emerald-500' : activeStage === 2 ? 'bg-teal-600' : 'bg-amber-500'
          }`}
        />

        {/* 3 Step Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Stage 1: Reported */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                activeStage >= 1
                  ? 'bg-forest text-softwhite shadow-xs'
                  : 'bg-sage text-charcoal-muted'
              }`}
            >
              1
            </div>
            <span className="text-[10px] font-bold text-forest">Reported</span>
          </div>

          {/* Stage 2: In Progress */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                activeStage >= 2
                  ? 'bg-teal-700 text-softwhite shadow-xs'
                  : 'bg-sage text-charcoal-muted'
              }`}
            >
              {activeStage === 2 ? <Wrench size={13} className="animate-spin" /> : '2'}
            </div>
            <span
              className={`text-[10px] font-bold ${
                activeStage >= 2 ? 'text-teal-800' : 'text-charcoal-muted'
              }`}
            >
              Field Action
            </span>
          </div>

          {/* Stage 3: Resolved */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                activeStage === 3
                  ? 'bg-emerald-600 text-softwhite shadow-xs ring-4 ring-emerald-100'
                  : 'bg-sage text-charcoal-muted'
              }`}
            >
              {activeStage === 3 ? <CheckCircle2 size={15} /> : '3'}
            </div>
            <span
              className={`text-[10px] font-bold ${
                activeStage === 3 ? 'text-emerald-700 font-extrabold' : 'text-charcoal-muted'
              }`}
            >
              Resolved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TrackComplaintView: React.FC = () => {
  const {
    complaints,
    selectedComplaintId,
    setSelectedComplaintId,
    upvoteComplaint,
  } = useCivicData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState(selectedComplaintId || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [detailModalComplaint, setDetailModalComplaint] = useState<Complaint | null>(null);
  const [activeProofView, setActiveProofView] = useState<'before' | 'after'>('after');

  const getCanonicalStatus = (status: ComplaintStatus): 'pending' | 'in_progress' | 'resolved' => {
    if (status === 'resolved' || status === 'awaiting_verification' || status === 'verified') {
      return 'resolved';
    }
    if (status === 'assigned' || status === 'in_progress' || status === 'reopened' || status === 'disputed') {
      return 'in_progress';
    }
    return 'pending';
  };

  const currentUserId = currentUser ? currentUser.id : 'guest_upvoter';

  // Filter complaints based on query and status filter
  const filteredComplaints = complaints.filter((c) => {
    const canonical = getCanonicalStatus(c.status);
    if (statusFilter !== 'all' && canonical !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = c.id.toLowerCase().includes(q);
      const matchCat = (CATEGORY_LABELS[c.category] || c.category).toLowerCase().includes(q);
      const matchAddr = c.address.toLowerCase().includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      return matchId || matchCat || matchAddr || matchDesc;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header & Search */}
      <div className="bg-softwhite rounded-3xl p-6 sm:p-7 border border-sage shadow-card space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-burnt px-2.5 py-0.5 bg-peach rounded-full">
            Transparent Grievance Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest mt-1">
            Track Civic Issues
          </h1>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Follow municipal complaints from photo submission through contractor repair and community verification.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Complaint ID (e.g. CT-1001), category, or area..."
              className="w-full pl-10 pr-4 py-2.5 bg-ivory rounded-xl border border-sage text-xs text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:border-forest transition-colors"
            />
          </div>

          {/* 3-State Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            {(['all', 'pending', 'in_progress', 'resolved'] as const).map((st) => {
              const label =
                st === 'all'
                  ? 'All Records'
                  : st === 'pending'
                  ? 'Pending'
                  : st === 'in_progress'
                  ? 'In Progress'
                  : 'Resolved';
              const isSelected = statusFilter === st;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 rounded-xl transition-all duration-150 whitespace-nowrap ${
                    isSelected
                      ? 'bg-forest text-softwhite shadow-xs font-bold'
                      : 'bg-ivory hover:bg-sage/40 text-charcoal border border-sage'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complaints Grid with Staggered Entrance */}
      {filteredComplaints.length === 0 ? (
        <div className="text-center py-16 bg-softwhite rounded-3xl border border-sage p-8 space-y-3">
          <AlertCircle size={36} className="mx-auto text-charcoal-muted" />
          <h3 className="text-base font-bold text-forest">No Grievances Found</h3>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
            {searchQuery
              ? `No complaints match "${searchQuery}". Try searching another area or ID.`
              : 'No complaints match the selected status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredComplaints.map((complaint, index) => {
              const canonical = getCanonicalStatus(complaint.status);
              const hasUpvoted = complaint.upvotedByUserIds.includes(currentUserId);

              return (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  whileHover={{ y: -3 }}
                  className="bg-softwhite rounded-2xl border border-sage p-4 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-3 group"
                >
                  {/* Top Header: ID, Category & Canonical Status Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-extrabold text-forest bg-sage/70 px-2.5 py-0.5 rounded-md">
                        {complaint.id}
                      </span>

                      {/* Canonical Status Badge */}
                      {canonical === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={11} className="text-amber-600 animate-pulse" />
                          Pending
                        </span>
                      )}
                      {canonical === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                          <Wrench size={11} className="text-teal-600 animate-spin" />
                          In Progress
                        </span>
                      )}
                      {canonical === 'resolved' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          Resolved
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-forest mt-2 line-clamp-1">
                      {CATEGORY_LABELS[complaint.category] || complaint.title}
                    </h3>
                  </div>

                  {/* Photo Thumbnail */}
                  {complaint.photoUrl && (
                    <div
                      onClick={() => {
                        setDetailModalComplaint(complaint);
                        setActiveProofView(complaint.resolutionProof ? 'after' : 'before');
                      }}
                      className="relative h-40 rounded-xl overflow-hidden border border-sage/70 cursor-pointer group-hover:border-forest/40 transition-colors"
                    >
                      <img
                        src={complaint.photoUrl}
                        alt="Issue Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                        <span className="text-[10px] font-semibold text-softwhite flex items-center gap-1">
                          Inspect Resolution Track <ChevronRight size={12} />
                        </span>
                        {complaint.resolutionProof && (
                          <span className="text-[9px] font-bold bg-emerald-600 text-softwhite px-2 py-0.5 rounded">
                            Verified Proof Available
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Visual Status Journey Bar */}
                  <ComplaintStatusJourney status={complaint.status} isCompact={true} />

                  {/* Location & Details */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-charcoal font-medium">
                      <MapPin size={13} className="text-burnt flex-shrink-0" />
                      <span className="line-clamp-1">{complaint.address}</span>
                    </div>

                    {complaint.description && (
                      <p className="text-[11px] text-charcoal-muted line-clamp-2">
                        "{complaint.description}"
                      </p>
                    )}
                  </div>

                  {/* Bottom Footer: Upvote Button & View Details */}
                  <div className="pt-2 border-t border-sage/60 flex items-center justify-between">
                    {/* Upvote Button with Tactile Feedback */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => upvoteComplaint(complaint.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        hasUpvoted
                          ? 'bg-burnt text-softwhite shadow-xs'
                          : 'bg-ivory hover:bg-sage/40 text-charcoal border border-sage'
                      }`}
                      title={hasUpvoted ? 'Remove your upvote' : 'Upvote this complaint to raise municipal priority'}
                    >
                      <motion.div
                        animate={hasUpvoted ? { scale: [1, 1.35, 1] } : {}}
                        transition={{ duration: 0.25 }}
                      >
                        <ThumbsUp size={13} className={hasUpvoted ? 'text-softwhite' : 'text-burnt'} />
                      </motion.div>
                      <span>{complaint.upvotes}</span>
                      <span className="text-[10px] font-normal">{complaint.upvotes === 1 ? 'vote' : 'votes'}</span>
                    </motion.button>

                    <button
                      onClick={() => {
                        setDetailModalComplaint(complaint);
                        setActiveProofView(complaint.resolutionProof ? 'after' : 'before');
                      }}
                      className="text-xs font-bold text-forest hover:text-burnt flex items-center gap-1 transition-colors"
                    >
                      <span>Full Journey</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Comprehensive Complaint Detail Modal */}
      {detailModalComplaint && (
        <div className="fixed inset-0 bg-forest/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-softwhite rounded-3xl max-w-xl w-full border border-sage shadow-elevated p-6 relative my-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setDetailModalComplaint(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-charcoal-muted hover:text-forest hover:bg-sage/40 transition-colors z-20"
              title="Close details"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-forest bg-sage/70 px-3 py-1 rounded-md">
                ID: {detailModalComplaint.id}
              </span>
              <span className="text-[11px] font-bold text-burnt px-2 py-0.5 bg-peach rounded-md">
                EDPS Priority: {detailModalComplaint.edpsScore}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-forest">
              {CATEGORY_LABELS[detailModalComplaint.category] || detailModalComplaint.title}
            </h2>

            {/* Visual Status Journey Component */}
            <ComplaintStatusJourney status={detailModalComplaint.status} isCompact={false} />

            {/* Evidence Photo Toggle (Before vs After) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-forest">Photographic Verification Evidence</span>
                {detailModalComplaint.resolutionProof && (
                  <div className="flex rounded-lg border border-sage bg-ivory p-0.5 text-[10px]">
                    <button
                      onClick={() => setActiveProofView('before')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                        activeProofView === 'before'
                          ? 'bg-forest text-softwhite'
                          : 'text-charcoal-muted hover:text-charcoal'
                      }`}
                    >
                      Reported Defect
                    </button>
                    <button
                      onClick={() => setActiveProofView('after')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                        activeProofView === 'after'
                          ? 'bg-emerald-600 text-softwhite'
                          : 'text-charcoal-muted hover:text-charcoal'
                      }`}
                    >
                      Resolution Proof ✓
                    </button>
                  </div>
                )}
              </div>

              {/* Photo Display */}
              <div className="h-52 rounded-2xl overflow-hidden border border-sage bg-ivory relative">
                <img
                  src={
                    activeProofView === 'after' && detailModalComplaint.resolutionProof?.afterPhotoUrl
                      ? detailModalComplaint.resolutionProof.afterPhotoUrl
                      : detailModalComplaint.photoUrl
                  }
                  alt="Evidence"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-charcoal/85 backdrop-blur-xs text-softwhite text-[10px] font-semibold px-2 py-0.5 rounded">
                  {activeProofView === 'after' && detailModalComplaint.resolutionProof
                    ? 'Contractor After-Repair Evidence'
                    : 'Original Citizen Intake Photo'}
                </div>
              </div>
            </div>

            {/* Location & Details Card */}
            <div className="bg-ivory rounded-2xl p-4 border border-sage space-y-2 text-xs">
              <div className="flex items-start gap-2 text-forest font-semibold">
                <MapPin size={15} className="text-burnt flex-shrink-0 mt-0.5" />
                <span>{detailModalComplaint.address}</span>
              </div>
              <div className="text-[11px] text-charcoal-muted">
                Jurisdiction: {detailModalComplaint.district}, {detailModalComplaint.state} • Coordinates: ({detailModalComplaint.latitude.toFixed(4)}, {detailModalComplaint.longitude.toFixed(4)})
              </div>
              {detailModalComplaint.description && (
                <div className="pt-1 text-charcoal leading-relaxed">
                  <span className="font-bold text-forest block">Citizen Statement:</span>
                  "{detailModalComplaint.description}"
                </div>
              )}
            </div>

            {/* Work Order / Contractor info if present */}
            {detailModalComplaint.workOrder && (
              <div className="bg-teal-50/60 rounded-2xl p-3.5 border border-teal-200 text-xs space-y-1 text-teal-900">
                <span className="font-bold text-[11px] text-teal-950 block">Municipal Work Order Dispatched</span>
                <p className="text-[11px]">
                  Assigned Contractor: <span className="font-semibold">{detailModalComplaint.workOrder.contractor}</span> ({detailModalComplaint.workOrder.crew})
                </p>
                <p className="text-[10px] text-teal-700">
                  Target SLA: {detailModalComplaint.workOrder.slaHours} hours • Assigned by {detailModalComplaint.workOrder.officialName}
                </p>
              </div>
            )}

            {/* Upvote & Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-sage/60">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => upvoteComplaint(detailModalComplaint.id)}
                className="flex items-center gap-2 px-4 py-2 bg-ivory hover:bg-sage/40 border border-sage rounded-xl font-bold text-xs text-charcoal transition-colors"
              >
                <ThumbsUp size={14} className="text-burnt" />
                <span>{detailModalComplaint.upvotes} Upvotes</span>
              </motion.button>

              <button
                onClick={() => setDetailModalComplaint(null)}
                className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
