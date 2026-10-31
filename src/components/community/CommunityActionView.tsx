import React, { useState, useMemo } from 'react';
import {
  Users,
  Target,
  Sparkles,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  PlusCircle,
  Share2,
  ShieldCheck,
  ChevronRight,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Award,
  HeartHandshake,
  FileCheck,
  ExternalLink,
  Flame,
  Info,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  CommunityChallenge,
  ComplaintCategory,
  VolunteerActivity,
  ChallengeActivityUpdate,
} from '../../types';
import { calculateCommunityScore } from '../../lib/communityScoreEngine';
import { CreateChallengeModal } from './CreateChallengeModal';
import { VolunteerModal } from './VolunteerModal';
import { OfficialActionModal } from './OfficialActionModal';

interface CommunityActionViewProps {
  onOpenReportModal: () => void;
}

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  garbage_waste: { label: 'Garbage & Sanitation', icon: '🗑️', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  drainage_sewage: { label: 'Drainage & Sewage', icon: '🌊', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  road_damage: { label: 'Roads & Potholes', icon: '🕳️', color: 'bg-stone-100 text-stone-800 border-stone-300' },
  water_supply: { label: 'Water Supply', icon: '🚰', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  streetlight_electrical: { label: 'Streetlights', icon: '💡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  other: { label: 'Civic Improvement', icon: '🏛️', color: 'bg-slate-100 text-slate-800 border-slate-300' },
};

export const CommunityActionView: React.FC<CommunityActionViewProps> = ({
  onOpenReportModal,
}) => {
  const {
    challenges,
    selectedChallengeId,
    setSelectedChallengeId,
    complaints,
    joinChallenge,
    leaveChallenge,
    setSelectedComplaintId,
    setActiveTab,
  } = useCivicData();

  const { currentUser, isAuthenticated } = useAuth();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeVolunteerModalActivity, setActiveVolunteerModalActivity] = useState<VolunteerActivity | null>(null);
  const [officialActionState, setOfficialActionState] = useState<{
    isOpen: boolean;
    mode: 'update' | 'verify' | 'complete_activity';
    activity?: VolunteerActivity | null;
  }>({ isOpen: false, mode: 'update', activity: null });

  // Detail view active sub-tab
  const [detailTab, setDetailTab] = useState<'overview' | 'activities' | 'hotspots' | 'updates'>('overview');
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active challenge selected
  const activeChallenge = useMemo(() => {
    return challenges.find((c) => c.id === selectedChallengeId) || null;
  }, [challenges, selectedChallengeId]);

  // Score metric for the active challenge
  const activeScoreMetric = useMemo(() => {
    if (!activeChallenge) return null;
    return calculateCommunityScore(activeChallenge, complaints);
  }, [activeChallenge, complaints]);

  // Aggregate stats across all challenges
  const overallStats = useMemo(() => {
    const totalActive = challenges.filter((c) => c.status === 'active').length;
    const totalParticipants = challenges.reduce((sum, c) => sum + c.participatingUserIds.length, 0);
    const totalActivities = challenges.reduce(
      (sum, c) => sum + c.volunteerActivities.filter((a) => a.status === 'completed').length,
      0
    );
    const totalHotspots = challenges.reduce((sum, c) => sum + c.associatedComplaintIds.length, 0);
    return { totalActive, totalParticipants, totalActivities, totalHotspots };
  }, [challenges]);

  // Filtered challenges list
  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      const matchSearch =
        challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.district.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || challenge.targetProblemCategory === selectedCategory;

      const matchStatus =
        selectedStatus === 'all' || challenge.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [challenges, searchQuery, selectedCategory, selectedStatus]);

  // User joined status
  const isUserJoined = useMemo(() => {
    if (!activeChallenge || !currentUser) return false;
    return activeChallenge.participatingUserIds.includes(currentUser.id);
  }, [activeChallenge, currentUser]);

  const handleToggleJoin = () => {
    if (!activeChallenge) return;
    if (isUserJoined) {
      leaveChallenge(activeChallenge.id);
    } else {
      joinChallenge(activeChallenge.id);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && activeChallenge) {
      const url = `${window.location.origin}/?tab=community_action&challenge=${activeChallenge.id}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
      });
    }
  };

  const handleViewComplaint = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    setActiveTab('track');
  };

  const isOfficial =
    currentUser?.role === 'government' ||
    currentUser?.role === 'official' ||
    currentUser?.role === 'super_admin';

  // ==========================================
  // RENDER: CHALLENGE DETAIL VIEW
  // ==========================================
  if (activeChallenge && activeScoreMetric) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(activeChallenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    const linkedComplaintsList = complaints.filter((c) =>
      activeChallenge.associatedComplaintIds.includes(c.id)
    );

    const catMeta = CATEGORY_MAP[activeChallenge.targetProblemCategory] || CATEGORY_MAP.other;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-in fade-in duration-300">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedChallengeId(null);
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'community_action');
                url.searchParams.delete('challenge');
                window.history.pushState({}, '', url.toString());
              }
            }}
            className="flex items-center gap-2 text-xs font-bold text-teal-800 hover:text-navy transition-colors px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200/60 cursor-pointer"
          >
            <span>&larr;</span>
            <span>All Community Challenges</span>
          </button>

          {/* Demonstration Record Badge */}
          {activeChallenge.isDemoData && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Interactive Demonstration Challenge
            </span>
          )}
        </div>

        {/* Hero Challenge Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${catMeta.color}`}
                >
                  <span>{catMeta.icon}</span>
                  <span>{catMeta.label}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200/60">
                  <MapPin size={13} className="text-teal-700" />
                  <span>{activeChallenge.ward}</span>
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    activeChallenge.status === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : activeChallenge.status === 'completed'
                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <Clock size={12} />
                  <span className="capitalize">{activeChallenge.status}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Calendar size={12} />
                  <span>{daysLeft > 0 ? `${daysLeft} Days Remaining` : 'Challenge Concluded'}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
                {activeChallenge.title}
              </h1>
              <p className="text-sm font-semibold text-slate-600 max-w-3xl leading-relaxed">
                {activeChallenge.tagline}
              </p>
              <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                {activeChallenge.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-teal-700" />
                  <span>Organized by: <strong>{activeChallenge.organizerName}</strong></span>
                </span>
                <span className="text-slate-300">&bull;</span>
                <span>{activeChallenge.district}, {activeChallenge.state}</span>
              </div>
            </div>

            {/* Citizen Action Panel */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 sm:w-auto lg:w-64 shrink-0">
              <button
                onClick={handleToggleJoin}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
                  isUserJoined
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-navy hover:bg-navy-surface text-white'
                }`}
              >
                {isUserJoined ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Joined Challenge ✓</span>
                  </>
                ) : (
                  <>
                    <Users size={16} className="text-teal-accent" />
                    <span>Join This Challenge ({activeChallenge.participatingUserIds.length})</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenReportModal}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-teal-50 hover:bg-teal-100/90 text-teal-900 border border-teal-200 transition-all cursor-pointer"
              >
                <PlusCircle size={16} className="text-teal-700" />
                <span>Report Hotspot in Ward</span>
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              >
                <Share2 size={14} />
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Share Challenge'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TRANSPARENT MATHEMATICAL COMMUNITY PROGRESS SCORE CARD     */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-br from-teal-900 via-navy to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 border-b border-white/10 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Target size={15} />
                <span>Mathematical Community Progress Score</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Ward Verified Resolution Index
              </h2>
              <p className="text-xs text-slate-300 max-w-xl mt-1">
                Objective score derived strictly from reviewed hotspots, completed volunteer drives, and geofence-audited physical fixes. Never inflated by upvotes or social popularity.
              </p>
            </div>

            {/* Score Ring Display */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/15">
              <div className="text-center">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {activeScoreMetric.isDataSufficient ? activeScoreMetric.score : '—'}
                </span>
                <span className="text-sm font-semibold text-teal-300"> / 100</span>
                <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                  {activeScoreMetric.isDataSufficient
                    ? activeScoreMetric.score >= 70
                      ? 'High Community Progress'
                      : activeScoreMetric.score >= 40
                      ? 'Steady Progress'
                      : 'Intake Stage'
                    : 'Awaiting Verified Data'}
                </div>
              </div>
            </div>
          </div>

          {/* Insufficient Data State vs Sufficient Data Metrics */}
          {!activeScoreMetric.isDataSufficient ? (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-100 flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-white">Not enough verified data yet</p>
                <p className="text-amber-200">
                  This challenge is in its initial setup or upcoming phase. CivicTrace requires at least one registered resident hotspot, municipal triage, or completed field action before calculating a verified mathematical progress score.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* 4 Transparent Mathematical Factors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {activeScoreMetric.factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-200">{factor.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30">
                        {factor.weight}% Weight
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-white">{factor.achieved}%</span>
                      <span className="text-[11px] text-slate-300">
                        {factor.achieved >= 80 ? 'Target Exceeded' : factor.achieved >= 50 ? 'Substantial' : 'In Progress'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, factor.achieved)}%` }}
                      ></div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug">{factor.description}</p>
                  </div>
                ))}
              </div>

              {/* Collapsible Mathematical Breakdown Accordion */}
              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={() => setShowFormulaDetails(!showFormulaDetails)}
                  className="flex items-center justify-between w-full text-xs font-bold text-teal-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Info size={14} />
                    <span>How is this score computed? (Transparent Mathematical Formula)</span>
                  </span>
                  {showFormulaDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showFormulaDetails && (
                  <div className="mt-3 p-4 rounded-2xl bg-black/30 border border-white/10 text-xs text-slate-300 space-y-2 font-mono">
                    <p className="font-sans font-bold text-white text-xs">
                      Formula: Total Score = (35% &times; Hotspots Reviewed) + (30% &times; Verified Physical Fixes) + (25% &times; Approved Activities) + (10% &times; Resident Participation)
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 font-sans">
                      <li>
                        <strong>Hotspots Reviewed (35%):</strong> Evaluates percentage of submitted grievances triaged by the nodal desk against the challenge target ({activeChallenge.targets.targetHotspotsToAddress} hotspots).
                      </li>
                      <li>
                        <strong>Verified Physical Fixes (30%):</strong> Requires GPS geofenced before/after photographs and municipal clearance confirmation.
                      </li>
                      <li>
                        <strong>Completed Approved Activities (25%):</strong> Measures volunteer sanitation drives, bin placements, or repair audits completed.
                      </li>
                      <li>
                        <strong>Resident Participation (10%):</strong> Counts registered citizens residing in the ward participating in collective action.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation for Detailed Sections */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 text-xs font-bold overflow-x-auto pb-1">
          <button
            onClick={() => setDetailTab('overview')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              detailTab === 'overview'
                ? 'bg-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Volunteer Cleanups & Drives ({activeChallenge.volunteerActivities.length})
          </button>
          <button
            onClick={() => setDetailTab('hotspots')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              detailTab === 'hotspots'
                ? 'bg-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ward Hotspots & Grievances ({linkedComplaintsList.length})
          </button>
          <button
            onClick={() => setDetailTab('updates')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              detailTab === 'updates'
                ? 'bg-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Official Audit Feed ({activeChallenge.updates.length})
          </button>
        </div>

        {/* SECTION 1: VOLUNTEER DRIVES */}
        {detailTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-navy">Volunteer Cleanup Drives & Field Operations</h3>
                <p className="text-xs text-slate-500">
                  Approved community action drives organized in coordination with municipal departments
                </p>
              </div>

              {isOfficial && (
                <button
                  onClick={() =>
                    setOfficialActionState({
                      isOpen: true,
                      mode: 'update',
                      activity: null,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-navy text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-navy-surface cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-teal-accent" />
                  <span>Post Official Bulletin</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallenge.volunteerActivities.map((act) => {
                const isRegistered = currentUser && act.registeredUserIds.includes(currentUser.id);
                return (
                  <div
                    key={act.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            act.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {act.status}
                        </span>
                        {act.isOfficiallyApproved && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                            <ShieldCheck size={12} className="text-teal-600" />
                            <span>Municipal Approved</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-navy">{act.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{act.description}</p>

                      <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{act.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(act.scheduledDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={13} className="text-slate-400" />
                          <span>
                            Coordinator: <strong>{act.coordinatorName}</strong> ({act.coordinatorRole})
                          </span>
                        </div>
                      </div>

                      {act.status === 'completed' && act.completedNotes && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 mt-2">
                          <p className="font-bold flex items-center gap-1.5 mb-1">
                            <CheckCircle2 size={14} className="text-emerald-700" />
                            <span>Drive Verified & Completed</span>
                          </p>
                          <p className="text-[11px] text-emerald-800">{act.completedNotes}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-600">
                        <span className="text-navy font-black text-sm">
                          {act.registeredUserIds.length}
                        </span>
                        <span className="text-slate-400 font-normal"> / {act.maxVolunteers} Volunteers</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {act.status !== 'completed' && (
                          <button
                            onClick={() => setActiveVolunteerModalActivity(act)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              isRegistered
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-navy hover:bg-navy-surface text-white'
                            }`}
                          >
                            {isRegistered ? 'Registered ✓' : 'Register as Volunteer'}
                          </button>
                        )}

                        {isOfficial && act.status !== 'completed' && (
                          <button
                            onClick={() =>
                              setOfficialActionState({
                                isOpen: true,
                                mode: 'complete_activity',
                                activity: act,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200 text-xs font-bold cursor-pointer"
                          >
                            Record Completion
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: WARD HOTSPOTS */}
        {detailTab === 'hotspots' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-navy">Ward Hotspots & Grievances Registry</h3>
                <p className="text-xs text-slate-500">
                  Citizen reports linked to this challenge and monitored for verified municipal resolution
                </p>
              </div>

              <button
                onClick={onOpenReportModal}
                className="px-4 py-2 rounded-xl bg-navy text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-navy-surface cursor-pointer"
              >
                <PlusCircle size={14} className="text-teal-accent" />
                <span>Report Hotspot for this Ward</span>
              </button>
            </div>

            {linkedComplaintsList.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
                <h4 className="font-black text-navy text-sm">No Hotspots Linked Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Be the first citizen to report an issue in {activeChallenge.ward} and contribute to this challenge!
                </p>
                <button
                  onClick={onOpenReportModal}
                  className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold shadow-sm"
                >
                  File Complaint Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedComplaintsList.map((c) => {
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-teal-300 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-navy px-2 py-0.5 rounded-lg bg-slate-100">
                            #{c.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              c.status === 'verified'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : c.status === 'resolved'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {c.status.replace('_', ' ')}
                          </span>
                          {c.edpsScore && (
                            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                              Priority: {c.edpsScore}/100
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-navy">{c.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-1">{c.description}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin size={11} />
                          <span>{c.address}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleViewComplaint(c.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Track Grievance</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: OFFICIAL AUDIT LOG */}
        {detailTab === 'updates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-navy">Official Audit & Progress Feed</h3>
                <p className="text-xs text-slate-500">
                  Chronological tamper-evident updates logged by officials and community coordinators
                </p>
              </div>

              {isOfficial && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setOfficialActionState({
                        isOpen: true,
                        mode: 'verify',
                        activity: null,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-emerald-800 cursor-pointer"
                  >
                    <CheckCircle2 size={13} />
                    <span>Verify Physical Fix</span>
                  </button>
                  <button
                    onClick={() =>
                      setOfficialActionState({
                        isOpen: true,
                        mode: 'update',
                        activity: null,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-navy text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-navy-surface cursor-pointer"
                  >
                    <PlusCircle size={13} />
                    <span>Post Bulletin</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
              {activeChallenge.updates.map((upd) => (
                <div
                  key={upd.id}
                  className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    {upd.type === 'improvement_verified' ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : upd.type === 'activity_completed' ? (
                      <Award size={16} className="text-teal-700" />
                    ) : (
                      <FileCheck size={16} className="text-navy" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy">{upd.actorName}</span>
                        <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                          {upd.actorRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(upd.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{upd.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modals for Action */}
        <VolunteerModal
          isOpen={activeVolunteerModalActivity !== null}
          activity={activeVolunteerModalActivity}
          onClose={() => setActiveVolunteerModalActivity(null)}
        />

        <OfficialActionModal
          isOpen={officialActionState.isOpen}
          challenge={activeChallenge}
          mode={officialActionState.mode}
          targetActivity={officialActionState.activity}
          onClose={() => setOfficialActionState({ isOpen: false, mode: 'update', activity: null })}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER: COMMUNITY CHALLENGES CATALOG / HUB
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-in fade-in duration-300">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-br from-navy via-slate-900 to-[#0B2523] text-white rounded-3xl p-6 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-accent/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-400/20 text-teal-300 border border-teal-300/30">
            <Flame size={14} className="text-teal-accent" />
            <span>Civic Collective Action</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            One Ward. One Goal. <br className="hidden sm:inline" />
            Real Change.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Bring neighbours together to tackle shared civic problems. Report hotspots, join volunteer cleanups, coordinate with municipal teams, and track verified improvements through honest data.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-teal-accent hover:bg-teal-accent/90 text-navy font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <PlusCircle size={16} />
              <span>Start a Community Challenge</span>
            </button>

            <button
              onClick={onOpenReportModal}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Report an Issue</span>
            </button>
          </div>
        </div>

        {/* Global Impact Summary Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 text-xs">
          <div>
            <p className="text-slate-400 text-[11px]">Active Challenges</p>
            <p className="text-2xl font-black text-white mt-0.5">{overallStats.totalActive}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Citizens Participating</p>
            <p className="text-2xl font-black text-teal-300 mt-0.5">{overallStats.totalParticipants}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Drives Completed</p>
            <p className="text-2xl font-black text-white mt-0.5">{overallStats.totalActivities}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Hotspots Tracked</p>
            <p className="text-2xl font-black text-white mt-0.5">{overallStats.totalHotspots}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ward, city, or challenge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Problem Categories</option>
            <option value="garbage_waste">Garbage & Sanitation</option>
            <option value="streetlight_electrical">Streetlights</option>
            <option value="drainage_sewage">Drainage & Sewage</option>
            <option value="water_supply">Water Supply</option>
            <option value="road_damage">Roads & Potholes</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Now</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-surface transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
          >
            <PlusCircle size={14} className="text-teal-accent" />
            <span>Launch Challenge</span>
          </button>
        </div>
      </div>

      {/* Challenges Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredChallenges.map((challenge) => {
          const cat = CATEGORY_MAP[challenge.targetProblemCategory] || CATEGORY_MAP.other;
          const scoreMetric = calculateCommunityScore(challenge, complaints);
          const daysLeft = Math.max(
            0,
            Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );

          return (
            <div
              key={challenge.id}
              onClick={() => {
                setSelectedChallengeId(challenge.id);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', 'community_action');
                  url.searchParams.set('challenge', challenge.id);
                  window.history.pushState({}, '', url.toString());
                }
              }}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header Pills */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cat.color}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {challenge.isDemoData && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Demo
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        challenge.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : challenge.status === 'completed'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {challenge.status}
                    </span>
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-xl font-black text-navy group-hover:text-teal-800 transition-colors">
                    {challenge.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {challenge.tagline}
                  </p>
                </div>

                {/* Ward and Dates */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <MapPin size={13} className="text-teal-700" />
                    <span>{challenge.ward}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Finished'}</span>
                  </span>
                </div>

                {/* Progress Score Indicator */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Target size={14} className="text-teal-700" />
                      <span>Community Progress Score</span>
                    </span>
                    {scoreMetric.isDataSufficient ? (
                      <span className="font-black text-teal-800 text-sm">
                        {scoreMetric.score} <span className="text-[10px] text-slate-500">/ 100</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        Awaiting verified data
                      </span>
                    )}
                  </div>

                  {scoreMetric.isDataSufficient && (
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, scoreMetric.score)}%` }}
                      ></div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-500">
                    <div>
                      <span className="block font-bold text-navy">{challenge.participatingUserIds.length}</span>
                      <span>Joined</span>
                    </div>
                    <div>
                      <span className="block font-bold text-navy">{challenge.volunteerActivities.length}</span>
                      <span>Drives</span>
                    </div>
                    <div>
                      <span className="block font-bold text-navy">{challenge.associatedComplaintIds.length}</span>
                      <span>Hotspots</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 group-hover:underline flex items-center gap-1">
                  <span>View Challenge Details</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[11px] text-slate-400">
                  {challenge.organizerName.slice(0, 24)}...
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Creation Modal */}
      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(id) => {
          setSelectedChallengeId(id);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'community_action');
            url.searchParams.set('challenge', id);
            window.history.pushState({}, '', url.toString());
          }
        }}
      />
    </div>
  );
};
