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
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintStatus } from '../../types';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';

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

  // Map database status to 3 clean canonical stages
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
  const filteredComplaints = complaints.filter(c => {
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
            Real-time status updates from field crews and verified resolution proof.
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
              placeholder="Search by Complaint ID (e.g. CT-1001) or location..."
              className="w-full pl-10 pr-4 py-2.5 bg-ivory rounded-xl border border-sage text-xs text-charcoal placeholder:text-charcoal-muted focus:outline-none focus:border-forest"
            />
          </div>

          {/* 3-State Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            {(['all', 'pending', 'in_progress', 'resolved'] as const).map((st) => {
              const label =
                st === 'all'
                  ? 'All'
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
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-forest text-softwhite shadow-xs'
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
            {searchQuery ? `No complaints match "${searchQuery}".` : 'No complaints match the selected filter.'}
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
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  className="bg-softwhite rounded-2xl border border-sage p-4 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-3 group"
                >
                  {/* Top Header: ID, Category & Status Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-forest bg-sage/60 px-2.5 py-0.5 rounded-md">
                        {complaint.id}
                      </span>

                      {/* Status Badge */}
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
                      onClick={() => setDetailModalComplaint(complaint)}
                      className="relative h-40 rounded-xl overflow-hidden border border-sage/60 cursor-pointer group-hover:border-forest/40 transition-colors"
                    >
                      <img
                        src={complaint.photoUrl}
                        alt="Issue Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <span className="text-[10px] font-semibold text-softwhite flex items-center gap-1">
                          View Details <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Location & Details */}
                  <div className="space-y-1.5 text-xs">
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
                    {/* Upvote Button with Micro-Animation */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => upvoteComplaint(complaint.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        hasUpvoted
                          ? 'bg-burnt text-softwhite shadow-xs'
                          : 'bg-ivory hover:bg-sage/40 text-charcoal border border-sage'
                      }`}
                      title={hasUpvoted ? 'Remove your upvote' : 'Upvote this complaint to raise priority'}
                    >
                      <motion.div
                        animate={hasUpvoted ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.25 }}
                      >
                        <ThumbsUp size={13} className={hasUpvoted ? 'text-softwhite' : 'text-burnt'} />
                      </motion.div>
                      <span>{complaint.upvotes}</span>
                      <span className="text-[10px] font-normal">{complaint.upvotes === 1 ? 'vote' : 'votes'}</span>
                    </motion.button>

                    <button
                      onClick={() => setDetailModalComplaint(complaint)}
                      className="text-xs font-bold text-forest hover:text-forest-hover flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Clean Complaint Detail Modal */}
      {detailModalComplaint && (
        <div className="fixed inset-0 bg-forest/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-softwhite rounded-3xl max-w-lg w-full border border-sage shadow-elevated p-6 relative my-6 space-y-4"
          >
            <button
              onClick={() => setDetailModalComplaint(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-charcoal-muted hover:text-forest hover:bg-sage/40 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-forest bg-sage/60 px-3 py-1 rounded-md">
                ID: {detailModalComplaint.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  getCanonicalStatus(detailModalComplaint.status) === 'resolved'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : getCanonicalStatus(detailModalComplaint.status) === 'in_progress'
                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {getCanonicalStatus(detailModalComplaint.status) === 'resolved'
                  ? 'Resolved'
                  : getCanonicalStatus(detailModalComplaint.status) === 'in_progress'
                  ? 'In Progress'
                  : 'Pending'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-forest">
              {CATEGORY_LABELS[detailModalComplaint.category] || detailModalComplaint.title}
            </h2>

            {/* Photo Preview */}
            {detailModalComplaint.photoUrl && (
              <div className="h-48 rounded-2xl overflow-hidden border border-sage">
                <img
                  src={detailModalComplaint.photoUrl}
                  alt="Complaint Evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Location & Details */}
            <div className="bg-ivory rounded-2xl p-4 border border-sage space-y-2 text-xs">
              <div className="flex items-start gap-2 text-forest font-semibold">
                <MapPin size={15} className="text-burnt flex-shrink-0 mt-0.5" />
                <span>{detailModalComplaint.address}</span>
              </div>
              <div className="text-[11px] text-charcoal-muted">
                Coordinates: {detailModalComplaint.latitude.toFixed(4)}, {detailModalComplaint.longitude.toFixed(4)}
              </div>
              {detailModalComplaint.description && (
                <div className="pt-1 text-charcoal leading-relaxed">
                  <span className="font-bold text-forest block">Description:</span>
                  "{detailModalComplaint.description}"
                </div>
              )}
            </div>

            {/* Upvote in modal */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => upvoteComplaint(detailModalComplaint.id)}
                className="flex items-center gap-2 px-4 py-2 bg-ivory hover:bg-sage/40 border border-sage rounded-xl font-bold text-xs text-charcoal transition-colors"
              >
                <ThumbsUp size={14} className="text-burnt" />
                <span>{detailModalComplaint.upvotes} Upvotes</span>
              </button>

              <button
                onClick={() => setDetailModalComplaint(null)}
                className="px-5 py-2 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
