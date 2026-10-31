import React, { useState } from 'react';
import {
  PlusCircle,
  Search,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  FileCheck,
  Smartphone,
  Eye,
  Users,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';

interface MinimalHomePageProps {
  onOpenReportModal: () => void;
  onOpenAuthModal?: () => void;
}

export const MinimalHomePage: React.FC<MinimalHomePageProps> = ({
  onOpenReportModal,
}) => {
  const {
    complaints,
    setActiveTab,
    setSelectedComplaintId,
    setSelectedChallengeId,
  } = useCivicData();
  const { currentUser, isAuthenticated } = useAuth();
  const [trackQuery, setTrackQuery] = useState('');
  const [trackError, setTrackError] = useState(false);
  const [activeVisualTab, setActiveVisualTab] = useState<'intake' | 'resolution'>('intake');

  // User's complaints (if logged in)
  const userComplaints = complaints.filter(
    (c) =>
      c.reportedByUserId === currentUser?.id ||
      c.reportedByIdentifier === currentUser?.identifier
  );
  const activeUserComplaints = userComplaints.filter(
    (c) => c.status !== 'resolved' && c.status !== 'verified'
  );

  // Summary counts from active state
  const totalActiveIncidents = complaints.filter(
    (c) => c.status !== 'resolved' && c.status !== 'verified'
  ).length;

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
      setTimeout(() => setTrackError(false), 3500);
    }
  };

  const handleSelectComplaint = (id: string) => {
    setSelectedComplaintId(id);
    setActiveTab('track');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-20 space-y-12 sm:space-y-16">
      {/* =========================================================================
          HERO SECTION: TWO-COLUMN HIGH-IMPACT CIVIC EXPERIENCE
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Bold Typography & Direct Actions */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Official Tagline Badge with Authentic Emblem */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/90 backdrop-blur-md border border-teal-200/90 rounded-full shadow-xs">
            <img
              src="/civictrace-emblem-transparent.png"
              alt="CivicTrace"
              className="w-5 h-5 object-contain flex-shrink-0"
            />
            <span className="text-xs font-bold text-teal-950 tracking-wide">
              Every Issue Tracked. Every Resolution Verified.
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy tracking-tight leading-[1.1]">
            Your Neighbourhood. Your Voice.{' '}
            <span className="text-teal-600 underline decoration-teal-300 decoration-wavy decoration-2 underline-offset-4">
              Real Progress.
            </span>
          </h1>

          {/* Supporting Sentence */}
          <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
            Report local issues, follow every update, and see the progress towards a better neighbourhood.
          </p>

          {/* Action Row: Primary Report Button + Track an Issue + Ticket Search */}
          <div className="pt-2 space-y-3 max-w-xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Primary Action */}
              <button
                onClick={onOpenReportModal}
                className="px-8 py-4 bg-navy hover:bg-navy-surface text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 flex-shrink-0 cursor-pointer"
              >
                <PlusCircle size={19} className="text-teal-accent" />
                <span>Report an Issue</span>
              </button>

              {/* Secondary Action: Track an Issue */}
              <button
                onClick={() => {
                  setSelectedComplaintId(null);
                  setActiveTab('track');
                }}
                className="px-6 py-4 bg-white hover:bg-slate-50 text-navy border border-slate-200 rounded-xl font-bold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <Search size={17} className="text-teal-600" />
                <span>Track an Issue</span>
              </button>
            </div>

            {/* Quick Direct Track Input */}
            <form onSubmit={handleTrackSubmit} className="relative w-full">
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Directly track by ID (e.g. CP-8492, CP-3884, CT-1001)..."
                className={`w-full pl-3.5 pr-20 py-3 bg-white/90 backdrop-blur-xs rounded-xl border text-xs font-semibold text-navy placeholder:text-slate-400 shadow-xs focus:outline-none transition-all ${
                  trackError
                    ? 'border-coral ring-2 ring-coral/20'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10'
                }`}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/60 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Track</span>
                <ArrowRight size={13} />
              </button>
            </form>
          </div>

          {trackError && (
            <p className="text-xs text-coral font-semibold">
              Complaint ID "{trackQuery}" not found. Try{' '}
              <button
                onClick={() => {
                  setSelectedComplaintId('CP-8492');
                  setActiveTab('track');
                }}
                className="underline font-bold hover:text-navy"
              >
                CP-8492
              </button>{' '}
              or explore the live registry.
            </p>
          )}

          {/* Trust Indicators */}
          <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-teal-600" />
              <span>GPS Geofence Audited</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-teal-600" />
              <span>Explainable AI Priority</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-teal-600" />
              <span>Citizen Consensus Verification</span>
            </span>
          </div>
        </div>

        {/* Right Column: Integrated Interactive Civic Visual */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Visual Header & Mode Switcher */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-accent animate-ping" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  CIVICTRACE LIVE TELEMETRY
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setActiveVisualTab('intake')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    activeVisualTab === 'intake'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AI Intake
                </button>
                <button
                  onClick={() => setActiveVisualTab('resolution')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    activeVisualTab === 'resolution'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Verified Proof
                </button>
              </div>
            </div>

            {/* Visual Display Container */}
            <div className="relative h-[280px] sm:h-[330px] bg-slate-950 overflow-hidden flex items-center justify-center">
              {activeVisualTab === 'intake' ? (
                <img
                  src="/assets/hero_illustration.jpg"
                  alt="CivicTrace Smartphone AI Defect Intake"
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src="/assets/before_after_proof.png"
                  alt="CivicTrace Before and After Resolution Audit"
                  className="w-full h-full object-contain p-3 bg-[#0B1528]"
                />
              )}

              {/* Status Pill Badge */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold text-teal-light flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-accent" />
                <span>{activeVisualTab === 'intake' ? 'Target: Arterial Pothole #CP-8492' : 'Audited Fix: School Rd #CP-3884'}</span>
              </div>

              <div className="absolute top-3 right-3 bg-teal-950/90 backdrop-blur-md border border-teal-500/40 rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase text-teal-accent shadow-sm">
                {activeVisualTab === 'intake' ? 'Priority 88 · Critical' : 'Within 4.2m Geofence'}
              </div>
            </div>

            {/* Visual Caption */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                {activeVisualTab === 'intake'
                  ? 'Real-time computer vision classification & EXIF geocoding.'
                  : 'Double-blind contractor photo proof & citizen consensus approval.'}
              </span>
              <button
                onClick={() => {
                  setSelectedComplaintId(activeVisualTab === 'intake' ? 'CP-8492' : 'CP-3884');
                  setActiveTab('track');
                }}
                className="text-teal-700 font-bold hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer ml-2"
              >
                <span>Inspect Ticket</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          USER ACTIVE COMPLAINTS (COMPACT OVERVIEW - IF AVAILABLE)
         ========================================================================= */}
      {isAuthenticated && userComplaints.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                Your Active Grievances ({activeUserComplaints.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('my_complaints')}
              className="text-xs font-bold text-teal-700 hover:text-navy transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({userComplaints.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeUserComplaints.slice(0, 2).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectComplaint(item.id)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl px-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy">{item.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {CATEGORY_LABELS[item.category] || item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{item.address}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block text-xs font-bold capitalize text-teal-700">
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          CIVICPULSE GATEWAY CARD: THE MAIN ENTRY POINT TO CITYWIDE INTELLIGENCE
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-navy via-navy-surface to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative Ambient Subtle Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-accent/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-teal-500/20 border border-teal-400/30 rounded-lg text-[11px] font-mono font-bold text-teal-accent">
              <Activity size={14} />
              <span>SPATIAL INTELLIGENCE & MAP</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              CivicPulse Operations Radar
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Explore the citywide interactive GIS map, explainable AI priority triage queue, ward hotspot clusters, and chronic infrastructure defect recurrence alerts.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-accent" />
                <span>{totalActiveIncidents} Active Incidents</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-accent" />
                <span>50m Duplicate Shield</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-accent" />
                <span>Proof-of-Fix Geofencing</span>
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => setActiveTab('civic_pulse')}
              className="px-6 py-3.5 bg-teal-600 hover:bg-teal-hover text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
            >
              <span>Explore CivicPulse</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LATEST IMPORTANT UPDATE / ACTIVE COMMUNITY ACTION SPOTLIGHT
         ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <Users size={20} className="text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                Active Community Challenge
              </span>
              <span className="text-xs font-semibold text-slate-500">Ward 151 &bull; Koramangala</span>
            </div>
            <h3 className="text-sm font-black text-navy mt-1">
              7-Day Clean Street Challenge: Sidewalk & Market Corridor Reclamation
            </h3>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedChallengeId('CH-KOR-01');
            setActiveTab('community_action');
          }}
          className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-surface text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer"
        >
          <span>Join Challenge</span>
          <ArrowRight size={13} />
        </button>
      </section>
    </div>
  );
};
