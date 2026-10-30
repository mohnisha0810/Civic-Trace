import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ThumbsUp,
  Save,
  RotateCw,
  Building,
  ShieldCheck,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintStatus } from '../../types';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';

export const OfficialDashboard: React.FC = () => {
  const { complaints, updateComplaintStatus } = useCivicData();
  const { currentUser, loginWithPassword } = useAuth();

  const [filterPriority, setFilterPriority] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Map database status to 3 clean canonical stages
  const getCanonicalStatus = (status: ComplaintStatus): 'submitted' | 'in_progress' | 'resolved' => {
    if (status === 'resolved' || status === 'awaiting_verification' || status === 'verified') {
      return 'resolved';
    }
    if (status === 'assigned' || status === 'in_progress' || status === 'reopened' || status === 'disputed') {
      return 'in_progress';
    }
    return 'submitted';
  };

  // 1. Calculate four exact counts from real database records
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => getCanonicalStatus(c.status) === 'submitted').length;
  const inProgressCount = complaints.filter(c => getCanonicalStatus(c.status) === 'in_progress').length;
  const resolvedCount = complaints.filter(c => getCanonicalStatus(c.status) === 'resolved').length;

  // 2. Priority calculation engine (severity + safety risk + age + crowd upvotes)
  const getPriorityData = (c: Complaint) => {
    let severity = 20;
    if (c.category === 'drainage_sewage' || c.category === 'water_supply') severity = 35;
    else if (c.category === 'road_damage') severity = 30;
    else if (c.category === 'streetlight_electrical') severity = 25;

    const safetyRisk = c.edpsScore > 75 ? 25 : c.edpsScore > 50 ? 15 : 10;
    const upvotesScore = Math.min(20, (c.upvotes || 0) * 4);
    const hoursOld = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
    const ageScore = Math.min(20, Math.floor(hoursOld * 0.5));

    const totalScore = severity + safetyRisk + upvotesScore + ageScore;
    let level: 'High' | 'Medium' | 'Low' = 'Low';
    if (totalScore >= 65) level = 'High';
    else if (totalScore >= 45) level = 'Medium';

    return { score: totalScore, level };
  };

  // Sort complaints by priority score descending
  const sortedComplaints = [...complaints]
    .map(c => ({ ...c, priorityData: getPriorityData(c) }))
    .sort((a, b) => b.priorityData.score - a.priorityData.score);

  const filteredComplaints = sortedComplaints.filter(c => {
    if (filterPriority === 'all') return true;
    return c.priorityData.level === filterPriority;
  });

  // Handle direct status change
  const handleStatusChange = (complaintId: string, newStatus: 'submitted' | 'in_progress' | 'resolved') => {
    setUpdatingId(complaintId);
    const ok = updateComplaintStatus(complaintId, newStatus);
    setTimeout(() => {
      setUpdatingId(null);
      if (ok) {
        const label = newStatus === 'submitted' ? 'Pending' : newStatus === 'in_progress' ? 'In Progress' : 'Resolved';
        setSuccessToast(`Complaint #${complaintId} updated to "${label}"`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    }, 300);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 sm:right-8 bg-forest text-softwhite px-4 py-3 rounded-2xl shadow-elevated border border-sage z-50 flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-softwhite rounded-3xl p-6 sm:p-7 border border-sage shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-burnt px-2.5 py-0.5 bg-peach rounded-full">
            Municipal Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest mt-1">
            Government Operations Portal
          </h1>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Priority-ordered intake queue with real-time status dispatch.
          </p>
        </div>

        {/* Demo Fast Login Helper if not authenticated as official */}
        {(!currentUser || (currentUser.role !== 'government' && currentUser.role !== 'official' && currentUser.role !== 'super_admin')) && (
          <button
            onClick={() => loginWithPassword('gov@civictrace.gov.in', 'OfficialPWD2026!')}
            className="px-4 py-2 bg-ivory hover:bg-sage/40 border border-sage rounded-xl text-xs font-bold text-forest transition-colors self-start md:self-auto"
          >
            Sign In as Authorized Official
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 2.A FOUR COMPLAINT STATISTICS (FROM REAL DATABASE RECORDS)           */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-softwhite rounded-2xl border border-sage p-4 shadow-card space-y-1"
        >
          <div className="flex items-center justify-between text-charcoal-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Issues</span>
            <FileText size={16} className="text-forest" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-forest">
            {totalCount}
          </div>
          <span className="text-[10px] text-charcoal-muted">Registered in database</span>
        </motion.div>

        {/* Pending Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-softwhite rounded-2xl border border-amber-200 p-4 shadow-card space-y-1"
        >
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
            {pendingCount}
          </div>
          <span className="text-[10px] text-amber-600">Awaiting triage & work</span>
        </motion.div>

        {/* In-Progress Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-softwhite rounded-2xl border border-teal-200 p-4 shadow-card space-y-1"
        >
          <div className="flex items-center justify-between text-teal-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <Wrench size={16} className="text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700">
            {inProgressCount}
          </div>
          <span className="text-[10px] text-teal-600">Field crews deployed</span>
        </motion.div>

        {/* Resolved Complaints */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-softwhite rounded-2xl border border-emerald-200 p-4 shadow-card space-y-1"
        >
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {resolvedCount}
          </div>
          <span className="text-[10px] text-emerald-600">Completed & verified</span>
        </motion.div>
      </div>

      {/* ==================================================================== */}
      {/* 2.B PRIORITY-ORDERED COMPLAINTS LIST                                 */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-forest">Priority-Ordered Queue</h2>
            <p className="text-xs text-charcoal-muted">
              Ordered by composite severity, public safety risk, complaint age, and citizen upvotes.
            </p>
          </div>

          {/* Priority Filter Chips */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {(['all', 'High', 'Medium', 'Low'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterPriority(lvl)}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  filterPriority === lvl
                    ? 'bg-forest text-softwhite border-forest shadow-xs'
                    : 'bg-ivory hover:bg-sage/40 text-charcoal border-sage'
                }`}
              >
                {lvl === 'all' ? 'All Priorities' : `${lvl} Priority`}
              </button>
            ))}
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12 bg-softwhite rounded-3xl border border-sage p-6">
            <p className="text-xs text-charcoal-muted">No complaints match this priority filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((complaint) => {
              const canonical = getCanonicalStatus(complaint.status);
              const { level } = complaint.priorityData;
              const isUpdating = updatingId === complaint.id;

              return (
                <motion.div
                  key={complaint.id}
                  layout
                  className="bg-softwhite rounded-2xl border border-sage p-4 shadow-card hover:shadow-elevated transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Thumbnail */}
                    {complaint.photoUrl ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-sage flex-shrink-0">
                        <img
                          src={complaint.photoUrl}
                          alt="Evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-ivory border border-sage flex items-center justify-center flex-shrink-0 text-charcoal-muted">
                        <FileText size={22} />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-forest bg-sage/60 px-2 py-0.5 rounded">
                          {complaint.id}
                        </span>

                        {/* Priority Level Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            level === 'High'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : level === 'Medium'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-sage/40 text-forest border-sage'
                          }`}
                        >
                          {level} Priority
                        </span>

                        {/* Upvotes */}
                        <span className="text-[10px] font-bold text-burnt flex items-center gap-1 bg-peach px-2 py-0.5 rounded-full">
                          <ThumbsUp size={10} />
                          {complaint.upvotes} upvotes
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-forest truncate">
                        {CATEGORY_LABELS[complaint.category] || complaint.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-charcoal">
                        <MapPin size={12} className="text-burnt flex-shrink-0" />
                        <span className="truncate">{complaint.address}</span>
                      </div>

                      {complaint.description && (
                        <p className="text-[11px] text-charcoal-muted line-clamp-1">
                          "{complaint.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* 2.C STATUS CHANGER (PENDING, IN PROGRESS, RESOLVED)        */}
                  {/* ========================================================== */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-sage/60 flex-shrink-0">
                    <span className="text-xs font-bold text-charcoal-muted mr-1 hidden sm:inline">
                      Status:
                    </span>

                    <div className="inline-flex rounded-xl border border-sage p-0.5 bg-ivory text-xs font-semibold">
                      {/* Pending */}
                      <button
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(complaint.id, 'submitted')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          canonical === 'submitted'
                            ? 'bg-amber-600 text-softwhite shadow-xs font-bold'
                            : 'hover:text-amber-700 text-charcoal-muted'
                        }`}
                      >
                        Pending
                      </button>

                      {/* In Progress */}
                      <button
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(complaint.id, 'in_progress')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          canonical === 'in_progress'
                            ? 'bg-teal-700 text-softwhite shadow-xs font-bold'
                            : 'hover:text-teal-700 text-charcoal-muted'
                        }`}
                      >
                        In Progress
                      </button>

                      {/* Resolved */}
                      <button
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(complaint.id, 'resolved')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          canonical === 'resolved'
                            ? 'bg-emerald-700 text-softwhite shadow-xs font-bold'
                            : 'hover:text-emerald-700 text-charcoal-muted'
                        }`}
                      >
                        Resolved
                      </button>
                    </div>

                    {isUpdating && (
                      <RotateCw size={14} className="animate-spin text-burnt ml-1" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
