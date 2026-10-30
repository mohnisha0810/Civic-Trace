import React from 'react';
import { motion } from 'motion/react';
import { MapPin, ThumbsUp, ArrowRight, PlusCircle, Clock, CheckCircle2, Wrench } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';

interface RecentComplaintsSectionProps {
  onOpenReportModal: () => void;
}

export const RecentComplaintsSection: React.FC<RecentComplaintsSectionProps> = ({
  onOpenReportModal,
}) => {
  const { complaints, setActiveTab, setSelectedComplaintId, upvoteComplaint } = useCivicData();
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? currentUser.id : 'guest_upvoter';

  const recent = complaints.slice(0, 6);

  const getStatusBadge = (status: string) => {
    if (status === 'resolved' || status === 'awaiting_verification' || status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={10} className="text-emerald-600" />
          Resolved
        </span>
      );
    }
    if (status === 'assigned' || status === 'in_progress' || status === 'reopened' || status === 'disputed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
          <Wrench size={10} className="text-teal-600" />
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
        <Clock size={10} className="text-amber-600" />
        Pending
      </span>
    );
  };

  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-bold text-burnt uppercase tracking-wider">
            Verified Community Feed
          </span>
          <h2 className="text-2xl font-bold text-forest mt-1">Recently Reported Complaints</h2>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Transparent registry of grievances logged by verified citizens.
          </p>
        </div>

        {complaints.length > 0 && (
          <button
            onClick={() => setActiveTab('track')}
            className="text-xs font-bold text-forest hover:text-burnt flex items-center gap-1.5 transition-colors"
          >
            <span>View All in Tracker</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {recent.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recent.map((complaint) => {
            const hasUpvoted = complaint.upvotedByUserIds.includes(currentUserId);

            return (
              <motion.div
                key={complaint.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="bg-softwhite rounded-2xl border border-sage shadow-card hover:shadow-elevated transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-ivory border border-sage text-forest">
                      #{complaint.id}
                    </span>
                    {getStatusBadge(complaint.status)}
                  </div>

                  {complaint.photoUrl && (
                    <div className="h-36 rounded-xl overflow-hidden border border-sage bg-ivory">
                      <img
                        src={complaint.photoUrl}
                        alt={complaint.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div>
                    <h3
                      onClick={() => {
                        setSelectedComplaintId(complaint.id);
                        setActiveTab('track');
                      }}
                      className="text-sm font-bold text-forest hover:text-burnt transition-colors cursor-pointer line-clamp-1"
                    >
                      {CATEGORY_LABELS[complaint.category] || complaint.title}
                    </h3>
                    {complaint.description && (
                      <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">
                        {complaint.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-charcoal-muted truncate">
                    <MapPin size={13} className="text-forest flex-shrink-0" />
                    <span className="truncate">{complaint.address}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-ivory/60 border-t border-sage/60 flex items-center justify-between text-xs">
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => upvoteComplaint(complaint.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      hasUpvoted
                        ? 'bg-burnt text-softwhite shadow-xs font-bold'
                        : 'text-charcoal-muted hover:text-burnt'
                    }`}
                  >
                    <ThumbsUp size={13} className={hasUpvoted ? 'text-softwhite' : 'text-burnt'} />
                    <span>{complaint.upvotes} {complaint.upvotes === 1 ? 'Upvote' : 'Upvotes'}</span>
                  </motion.button>

                  <button
                    onClick={() => {
                      setSelectedComplaintId(complaint.id);
                      setActiveTab('track');
                    }}
                    className="font-bold text-forest hover:text-burnt flex items-center gap-1 transition-colors"
                  >
                    <span>Track</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-softwhite rounded-3xl p-10 border border-sage shadow-card text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sage flex items-center justify-center text-forest mx-auto">
            <PlusCircle size={24} className="text-burnt" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-forest">No Civic Complaints Reported Yet</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              CivicTrace is connected to your persistent database. Be the first citizen to report an infrastructure defect in your ward.
            </p>
          </div>
          <button
            onClick={onOpenReportModal}
            className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card transition-all"
          >
            File First Complaint
          </button>
        </div>
      )}
    </section>
  );
};
