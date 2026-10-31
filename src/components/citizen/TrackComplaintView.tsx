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
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  HardHat,
  FileCheck2,
  Building2,
  Layers,
  Calendar,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { Complaint, ComplaintStatus, ComplaintHistoryEntry } from '../../types';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';
import { calculateResolutionEstimate, ResolutionEstimate } from '../../lib/resolutionEstimates';
import { LiveMapSection } from '../home/LiveMapSection';

// -----------------------------------------------------------------------------
// DELIVERY-STYLE 6-STAGE DEFINITION
// -----------------------------------------------------------------------------
export interface DeliveryStageInfo {
  number: number;
  key: 'reported' | 'acknowledged' | 'assigned' | 'in_progress' | 'resolution_submitted' | 'verified_resolved';
  label: string;
  sublabel: string;
  isCompleted: boolean;
  isActive: boolean;
  isPending: boolean;
  timestamp?: string;
  actorName?: string;
  actorRole?: string;
  details?: string;
}

export function getDeliveryStages(complaint: Complaint): DeliveryStageInfo[] {
  // Determine current progression index (1 to 6)
  let currentStageIndex = 1;

  switch (complaint.status) {
    case 'submitted':
      currentStageIndex = 1;
      break;
    case 'verified_intake':
      currentStageIndex = 2;
      break;
    case 'assigned':
      currentStageIndex = 3;
      break;
    case 'in_progress':
    case 'reopened':
    case 'disputed':
      currentStageIndex = 4;
      break;
    case 'resolved':
    case 'awaiting_verification':
      currentStageIndex = 5;
      break;
    case 'verified':
      currentStageIndex = 6;
      break;
    default:
      currentStageIndex = 1;
  }

  // Helper to extract matching history entry
  const findHist = (stageKey: string) => {
    return complaint.history.find((h) => {
      if (stageKey === 'reported') return h.stage === 'reported';
      if (stageKey === 'acknowledged') return h.stage === 'verified';
      if (stageKey === 'assigned') return h.stage === 'assigned';
      if (stageKey === 'in_progress') return h.stage === 'in_progress';
      if (stageKey === 'resolution_submitted') return h.stage === 'resolved';
      if (stageKey === 'verified_resolved') return h.stage === 'verified_resolution';
      return false;
    });
  };

  const hReported = findHist('reported');
  const hAck = findHist('acknowledged');
  const hAssigned = findHist('assigned');
  const hProgress = findHist('in_progress');
  const hResolved = findHist('resolution_submitted');
  const hVerified = findHist('verified_resolved');

  const formatTime = (isoString?: string) => {
    if (!isoString) return undefined;
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return undefined;
    }
  };

  const stages: DeliveryStageInfo[] = [
    {
      number: 1,
      key: 'reported',
      label: 'Reported',
      sublabel: 'Citizen Photo & GPS Submission',
      isCompleted: currentStageIndex > 1,
      isActive: currentStageIndex === 1,
      isPending: currentStageIndex < 1,
      timestamp: formatTime(hReported?.timestamp || complaint.createdAt),
      actorName: hReported?.actorName || complaint.reportedByName || 'Citizen Reporter',
      actorRole: 'Citizen Submitter',
      details: hReported?.details || `Registered at ${complaint.address}. Initial EDPS score computed.`,
    },
    {
      number: 2,
      key: 'acknowledged',
      label: 'Acknowledged',
      sublabel: 'AI Triage & Jurisdiction Check',
      isCompleted: currentStageIndex > 2,
      isActive: currentStageIndex === 2,
      isPending: currentStageIndex < 2,
      timestamp: formatTime(hAck?.timestamp),
      actorName: hAck?.actorName || 'CivicTrace AI Triage Engine',
      actorRole: hAck?.actorRole || 'System Automated',
      details: hAck?.details || 'Deduplication scan passed. Priority validated and mapped to municipal ward.',
    },
    {
      number: 3,
      key: 'assigned',
      label: 'Assigned',
      sublabel: 'Work Order Dispatched to Field Crew',
      isCompleted: currentStageIndex > 3,
      isActive: currentStageIndex === 3,
      isPending: currentStageIndex < 3,
      timestamp: formatTime(hAssigned?.timestamp || complaint.workOrder?.assignedAt),
      actorName: hAssigned?.actorName || complaint.workOrder?.officialName || 'Municipal Authority',
      actorRole: complaint.workOrder?.department || 'Department Dispatcher',
      details:
        hAssigned?.details ||
        (complaint.workOrder
          ? `Work order issued to ${complaint.workOrder.contractor} with target SLA of ${complaint.workOrder.slaHours}h.`
          : 'Pending contractor allocation.'),
    },
    {
      number: 4,
      key: 'in_progress',
      label: 'In Progress',
      sublabel: 'Field Crew On-Site Repair',
      isCompleted: currentStageIndex > 4,
      isActive: currentStageIndex === 4,
      isPending: currentStageIndex < 4,
      timestamp: formatTime(hProgress?.timestamp),
      actorName: hProgress?.actorName || complaint.workOrder?.crew || 'Field Maintenance Crew',
      actorRole: 'Field Contractor',
      details:
        hProgress?.details ||
        'Physical remediation work commenced at coordinates. Material compaction and site safety protocols active.',
    },
    {
      number: 5,
      key: 'resolution_submitted',
      label: 'Resolution Submitted',
      sublabel: 'Geofenced Photographic Evidence',
      isCompleted: currentStageIndex > 5,
      isActive: currentStageIndex === 5,
      isPending: currentStageIndex < 5,
      timestamp: formatTime(hResolved?.timestamp || complaint.resolutionProof?.completedAt),
      actorName: hResolved?.actorName || complaint.resolutionProof?.contractorName || 'Assigned Contractor',
      actorRole: 'Field Contractor',
      details:
        hResolved?.details ||
        (complaint.resolutionProof
          ? `After-repair photo uploaded. Geofence valid (${complaint.resolutionProof.geofenceDistanceMeters}m from site). Community verification gate active.`
          : 'Awaiting completion proof upload.'),
    },
    {
      number: 6,
      key: 'verified_resolved',
      label: 'Verified Resolved',
      sublabel: 'Community Consensus Verified',
      isCompleted: currentStageIndex === 6,
      isActive: false,
      isPending: currentStageIndex < 6,
      timestamp: formatTime(hVerified?.timestamp),
      actorName: hVerified?.actorName || 'Community Consensus Gate',
      actorRole: 'Citizen Consensus Audit',
      details:
        hVerified?.details ||
        'Dual-layer consensus audit completed. Issue officially verified and closed in public ledger.',
    },
  ];

  return stages;
}

// -----------------------------------------------------------------------------
// DELIVERY-STYLE PROGRESS STEPPER COMPONENT
// -----------------------------------------------------------------------------
export const DeliveryProgressPipeline: React.FC<{ complaint: Complaint }> = ({ complaint }) => {
  const stages = getDeliveryStages(complaint);

  return (
    <div className="w-full py-4">
      {/* Desktop / Tablet Horizontal Stepper */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
          {/* Background Connecting Bar */}
          <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 z-0 rounded-full" />

          {/* Active / Completed Connecting Bar */}
          {(() => {
            const completedCount = stages.filter((s) => s.isCompleted).length;
            const activeIndex = stages.findIndex((s) => s.isActive);
            let percent = 0;
            if (completedCount === 6) percent = 100;
            else if (activeIndex >= 0) percent = (activeIndex / 5) * 100;
            else percent = (completedCount / 6) * 100;

            return (
              <div
                className="absolute top-5 left-8 h-1 bg-teal-600 z-0 rounded-full transition-all duration-700 ease-out"
                style={{ width: `calc(${percent}% - 2rem)` }}
              />
            );
          })()}

          {/* 6 Step Nodes */}
          {stages.map((stage) => {
            return (
              <div
                key={stage.key}
                className="relative z-10 flex flex-col items-center text-center max-w-[120px]"
              >
                {/* Node Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                    stage.isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                      : stage.isActive
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100 animate-pulse'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {stage.isCompleted ? (
                    <Check size={18} className="stroke-[3]" />
                  ) : stage.isActive ? (
                    <Wrench size={16} className="animate-spin" />
                  ) : (
                    <span>{stage.number}</span>
                  )}
                </div>

                {/* Stage Title */}
                <span
                  className={`mt-2.5 text-xs font-bold leading-tight ${
                    stage.isActive
                      ? 'text-teal-900 font-extrabold'
                      : stage.isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>

                {/* Active Indicator Pill */}
                {stage.isActive && (
                  <span className="mt-1 px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                    Current Stage
                  </span>
                )}

                {/* Timestamp */}
                {stage.timestamp && (
                  <span className="mt-1 text-[10px] font-medium text-slate-500">
                    {stage.timestamp}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Stepper (thumb-friendly for viewports < 768px) */}
      <div className="md:hidden space-y-4">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.key} className="relative flex items-start gap-3.5">
              {/* Vertical Connecting Line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] ${
                    stage.isCompleted ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Node Circle */}
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs relative z-10 ${
                  stage.isCompleted
                    ? 'bg-emerald-600 text-white'
                    : stage.isActive
                    ? 'bg-teal-600 text-white ring-4 ring-teal-100 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {stage.isCompleted ? (
                  <Check size={14} className="stroke-[3]" />
                ) : stage.isActive ? (
                  <Wrench size={13} className="animate-spin" />
                ) : (
                  <span>{stage.number}</span>
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        stage.isActive
                          ? 'text-teal-900 font-extrabold'
                          : stage.isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {stage.isActive && (
                      <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[9px] font-extrabold rounded uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  {stage.timestamp && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      {stage.timestamp}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-0.5">{stage.sublabel}</p>
                {stage.actorName && (
                  <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                    By: {stage.actorName} ({stage.actorRole})
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Reusable compact 3-stage status journey for cards
export const ComplaintStatusJourney: React.FC<{ status: ComplaintStatus; isCompact?: boolean }> = ({
  status,
  isCompact = false,
}) => {
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

  const progressPercent = activeStage === 1 ? '20%' : activeStage === 2 ? '60%' : '100%';

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: progressPercent }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            activeStage === 3
              ? 'bg-emerald-600'
              : activeStage === 2
              ? 'bg-teal-600'
              : 'bg-amber-500'
          }`}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
        <span className={activeStage >= 1 ? 'text-navy font-bold' : ''}>1. Reported</span>
        <span className={activeStage >= 2 ? 'text-teal-700 font-bold' : ''}>2. In Progress</span>
        <span className={activeStage === 3 ? 'text-emerald-700 font-bold' : ''}>3. Verified</span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// MAIN TRACK COMPLAINT VIEW
// -----------------------------------------------------------------------------
export const TrackComplaintView: React.FC = () => {
  const {
    complaints,
    selectedComplaintId,
    setSelectedComplaintId,
    setActiveTab,
    upvoteComplaint,
  } = useCivicData();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState(selectedComplaintId || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [detailModalComplaint, setDetailModalComplaint] = useState<Complaint | null>(null);
  const [activeProofView, setActiveProofView] = useState<'before' | 'after'>('after');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentUserId = currentUser ? currentUser.id : 'guest_upvoter';

  // Handle Copy ID
  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Canonical status grouping
  const getCanonicalStatus = (status: ComplaintStatus): 'pending' | 'in_progress' | 'resolved' => {
    if (status === 'resolved' || status === 'awaiting_verification' || status === 'verified') {
      return 'resolved';
    }
    if (status === 'assigned' || status === 'in_progress' || status === 'reopened' || status === 'disputed') {
      return 'in_progress';
    }
    return 'pending';
  };

  // Identify if there is a spotlighted complaint (from selectedComplaintId or exact search match)
  const spotlightComplaint = complaints.find(
    (c) =>
      c.id.toUpperCase() === (selectedComplaintId || searchQuery).trim().toUpperCase()
  );

  // Filter complaints list
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
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* =======================================================================
          TOP SEARCH & QUICK TICKETS HEADER
         ======================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200/70 rounded-full text-xs font-bold text-teal-900 mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span>Delivery-Style Issue Progression</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Track Civic Issues
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-normal">
            Follow municipal complaints from photo submission through contractor dispatch, on-site repairs, and photographic community verification.
          </p>
        </div>

        {/* Search & Fast-Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Complaint ID (e.g. CP-8492, CP-3884, CT-1001), category, or area..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-navy placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-xs"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            {(['all', 'pending', 'in_progress', 'resolved'] as const).map((st) => {
              const label =
                st === 'all'
                  ? 'All Records'
                  : st === 'pending'
                  ? 'Reported'
                  : st === 'in_progress'
                  ? 'In Progress'
                  : 'Resolved';
              const isSelected = statusFilter === st;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-navy text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold">Quick Demonstrations:</span>
          {[
            { id: 'CP-8492', label: 'CP-8492 (Pothole · In Progress)' },
            { id: 'CT-1004', label: 'CT-1004 (Punjab Pothole · In Progress)' },
            { id: 'CP-3884', label: 'CP-3884 (Streetlight · Verified Closed)' },
            { id: 'CT-1001', label: 'CT-1001 (Drainage · Awaiting Audit)' },
            { id: 'CT-1002', label: 'CT-1002 (Waste · Assigned)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedComplaintId(item.id);
                setSearchQuery(item.id);
              }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg text-[11px] font-semibold text-slate-600 transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher: List vs Map */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-navy shadow-xs'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              📋 Grievance List ({filteredComplaints.length})
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              <MapPin size={13} />
              <span>🗺️ Interactive Map (All States)</span>
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            Interactive GIS coverage for all 28 Indian States & 8 Union Territories
          </span>
        </div>
      </section>

      {/* =======================================================================
          INTERACTIVE MAP VIEW IN TRACK COMPLAINTS
         ======================================================================= */}
      {viewMode === 'map' && (
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-fadeIn">
          <LiveMapSection />
        </section>
      )}

      {/* =======================================================================
          LIST VIEW: SPOTLIGHT & COMPLAINTS GRID
         ======================================================================= */}
      {viewMode === 'list' && (
        <>
          {/* SPOTLIGHT SECTION: FULL DELIVERY TRACKING EXPERIENCE */}
          {spotlightComplaint && (
            <section className="bg-white rounded-3xl border-2 border-teal-600/30 p-6 sm:p-8 shadow-lg space-y-6 animate-fadeIn">
          {/* Spotlight Header: Complaint ID, Copy Button, Status & Map Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-black font-mono text-navy">
                  #{spotlightComplaint.id}
                </span>

                <button
                  onClick={(e) => handleCopyId(spotlightComplaint.id, e)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy Complaint ID"
                >
                  {copiedId === spotlightComplaint.id ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                  {CATEGORY_LABELS[spotlightComplaint.category] || spotlightComplaint.title}
                </span>
              </div>

              <h2 className="text-lg font-bold text-navy mt-1.5">
                {spotlightComplaint.title}
              </h2>
            </div>

            {/* Map Action Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedComplaintId(spotlightComplaint.id);
                  setViewMode('map');
                }}
                className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <MapPin size={15} className="text-teal-700" />
                <span>View on Interactive Map</span>
              </button>
            </div>
          </div>

          {/* 6-Stage Delivery Progress Pipeline */}
          <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-6 border border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Delivery-Style Resolution Pipeline
            </h3>
            <DeliveryProgressPipeline complaint={spotlightComplaint} />
          </div>

          {/* Dynamic Resolution Estimate Badge Callout */}
          {(() => {
            const estimate: ResolutionEstimate = calculateResolutionEstimate(spotlightComplaint);

            return (
              <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${estimate.badgeColor}`}>
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    {estimate.isOverdue ? (
                      <AlertCircle size={20} className="text-rose-600" />
                    ) : estimate.type === 'resolved' ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <Clock size={20} className="text-teal-700" />
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm leading-tight">
                      {estimate.displayText}
                    </div>
                    <div className="text-xs opacity-90 mt-0.5">
                      {estimate.basisText}
                    </div>
                  </div>
                </div>

                {estimate.targetDate && (
                  <div className="text-left sm:text-right flex-shrink-0 text-xs font-semibold">
                    <span className="block text-[10px] opacity-75 uppercase">Target Completion</span>
                    <span>{estimate.targetDate}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Latest Official Update Callout Box */}
          {spotlightComplaint.history.length > 0 && (() => {
            const latest = spotlightComplaint.history[spotlightComplaint.history.length - 1];
            const formatted = new Date(latest.timestamp).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div className="bg-navy rounded-2xl p-5 text-white shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-accent animate-ping" />
                    <span className="font-bold text-teal-accent text-[11px] uppercase tracking-wider">
                      Latest Official Redressal Update
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{formatted}</span>
                </div>

                <p className="text-sm font-semibold text-slate-100">
                  {latest.action}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  "{latest.details}"
                </p>

                <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Authorized by:</span>
                  <span className="font-bold text-slate-200">{latest.actorName}</span>
                  <span>({latest.actorRole})</span>
                </div>
              </div>
            );
          })()}

          {/* Dual-Column Details: Responsible Department / Contractor & Location / Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsible Department & Contractor Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-teal-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Responsible Department & Field Crew
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Department Authority</span>
                  <span className="font-bold text-navy">
                    {spotlightComplaint.workOrder?.department ||
                      (spotlightComplaint.category === 'road_damage'
                        ? 'Public Works Department (PWD) - Roads'
                        : spotlightComplaint.category === 'garbage_waste'
                        ? 'Municipal Solid Waste Management (SWM)'
                        : spotlightComplaint.category === 'streetlight_electrical'
                        ? 'Electricity & Public Lighting Utility'
                        : 'City Municipal Corporation')}
                  </span>
                </div>

                {spotlightComplaint.workOrder ? (
                  <>
                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">Assigned Contractor</span>
                      <span className="font-bold text-teal-900">{spotlightComplaint.workOrder.contractor}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">Field Crew & Vehicle</span>
                      <span className="font-semibold text-slate-700">{spotlightComplaint.workOrder.crew}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block text-[11px]">Service Level Agreement (SLA)</span>
                      <span className="font-semibold text-slate-700">{spotlightComplaint.workOrder.slaHours} hours contracted window</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Department triage acknowledged. Contractor work order generation currently queued.
                  </p>
                )}
              </div>
            </div>

            {/* Location & Photographic Audit Proof */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-coral" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Location & Evidence
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-700 font-medium leading-relaxed">
                  {spotlightComplaint.address}
                </p>
                <p className="text-[11px] text-slate-500">
                  Ward: <span className="font-semibold text-navy">{spotlightComplaint.ward}</span> · Coordinates: ({spotlightComplaint.latitude.toFixed(4)}, {spotlightComplaint.longitude.toFixed(4)})
                </p>

                {spotlightComplaint.photoUrl && (
                  <div
                    onClick={() => {
                      setDetailModalComplaint(spotlightComplaint);
                      setActiveProofView(spotlightComplaint.resolutionProof ? 'after' : 'before');
                    }}
                    className="relative h-28 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group"
                  >
                    <img
                      src={spotlightComplaint.photoUrl}
                      alt="Defect evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      <span>Click to Inspect Full Photo Audit</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =======================================================================
          NEIGHBOURHOOD GRIEVANCES REGISTRY GRID
         ======================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-navy">
            Neighbourhood Issues ({filteredComplaints.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click any ticket to inspect its delivery progression
          </span>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <AlertCircle size={36} className="mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-navy">No Grievances Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                const estimate = calculateResolutionEstimate(complaint);
                const isSelected = spotlightComplaint?.id === complaint.id;

                return (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.04, 0.25) }}
                    whileHover={{ y: -2 }}
                    onClick={() => {
                      setSelectedComplaintId(complaint.id);
                      setSearchQuery(complaint.id);
                    }}
                    className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 ring-2 ring-teal-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header: ID, Copy & Canonical Status */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-navy bg-slate-100 px-2.5 py-1 rounded-md">
                            #{complaint.id}
                          </span>
                          <button
                            onClick={(e) => handleCopyId(complaint.id, e)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-navy transition-colors"
                            title="Copy ID"
                          >
                            {copiedId === complaint.id ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>

                        {canonical === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={11} className="text-amber-600 animate-pulse" />
                            Reported
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

                      <h3 className="text-sm font-bold text-navy mt-2.5 line-clamp-1">
                        {CATEGORY_LABELS[complaint.category] || complaint.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{complaint.address}</span>
                      </p>
                    </div>

                    {/* Progress Journey Track */}
                    <ComplaintStatusJourney status={complaint.status} isCompact={true} />

                    {/* Resolution Estimate Micro-Callout */}
                    <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-600 font-medium truncate">
                        {estimate.displayText}
                      </span>
                      <span className="text-[10px] font-bold text-teal-700 flex-shrink-0 ml-2">
                        Inspect →
                      </span>
                    </div>

                    {/* Footer: Upvote & Full Details Modal */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          upvoteComplaint(complaint.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          hasUpvoted
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <ThumbsUp size={12} className={hasUpvoted ? 'text-white' : 'text-slate-500'} />
                        <span>{complaint.upvotes}</span>
                      </motion.button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModalComplaint(complaint);
                          setActiveProofView(complaint.resolutionProof ? 'after' : 'before');
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-navy flex items-center gap-1 transition-colors"
                      >
                        <span>Full Audit & Proof</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
      </>
      )}

      {/* =======================================================================
          COMPREHENSIVE COMPLAINT AUDIT MODAL (Before / After Evidence)
         ======================================================================= */}
      {detailModalComplaint && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 relative my-6 space-y-4 max-h-[90vh] overflow-y-auto text-navy"
          >
            <button
              onClick={() => setDetailModalComplaint(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors z-20 cursor-pointer"
              title="Close details"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black text-navy bg-slate-100 px-3 py-1 rounded-md">
                #{detailModalComplaint.id}
              </span>
              <span className="text-[11px] font-bold text-teal-800 px-2.5 py-0.5 bg-teal-50 border border-teal-200 rounded-md">
                EDPS Priority Score: {detailModalComplaint.edpsScore}/100
              </span>
            </div>

            <h2 className="text-xl font-black text-navy">
              {CATEGORY_LABELS[detailModalComplaint.category] || detailModalComplaint.title}
            </h2>

            {/* Delivery Progress Pipeline inside modal */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <DeliveryProgressPipeline complaint={detailModalComplaint} />
            </div>

            {/* Photographic Verification Evidence (Before vs After) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-navy">Photographic Audit Trail</span>
                {detailModalComplaint.resolutionProof && (
                  <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px]">
                    <button
                      onClick={() => setActiveProofView('before')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        activeProofView === 'before'
                          ? 'bg-navy text-white'
                          : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      Reported Defect
                    </button>
                    <button
                      onClick={() => setActiveProofView('after')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                        activeProofView === 'after'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      Resolution Proof ✓
                    </button>
                  </div>
                )}
              </div>

              {/* Photo Display */}
              <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative">
                <img
                  src={
                    activeProofView === 'after' && detailModalComplaint.resolutionProof?.afterPhotoUrl
                      ? detailModalComplaint.resolutionProof.afterPhotoUrl
                      : detailModalComplaint.photoUrl
                  }
                  alt="Evidence"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-navy/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-md shadow-xs">
                  {activeProofView === 'after' && detailModalComplaint.resolutionProof
                    ? `Contractor After-Repair Evidence (${detailModalComplaint.resolutionProof.geofenceDistanceMeters}m geofence valid)`
                    : 'Original Citizen Intake Geotagged Evidence'}
                </div>
              </div>
            </div>

            {/* Location & Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-start gap-2 font-semibold text-navy">
                <MapPin size={15} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <span>{detailModalComplaint.address}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Jurisdiction: {detailModalComplaint.district}, {detailModalComplaint.state} • Coordinates: ({detailModalComplaint.latitude.toFixed(4)}, {detailModalComplaint.longitude.toFixed(4)})
              </div>
              {detailModalComplaint.description && (
                <div className="pt-1 text-slate-700 leading-relaxed">
                  <span className="font-bold text-navy block text-[11px]">Citizen Description:</span>
                  "{detailModalComplaint.description}"
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedComplaintId(detailModalComplaint.id);
                  setDetailModalComplaint(null);
                  setViewMode('map');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MapPin size={14} className="text-teal-600" />
                <span>View on Map</span>
              </button>

              <button
                onClick={() => setDetailModalComplaint(null)}
                className="px-5 py-2.5 bg-navy hover:bg-navy-surface text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
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
