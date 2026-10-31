import React from 'react';
import {
  Activity,
  ArrowLeft,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { LiveMapSection } from '../home/LiveMapSection';
import { RecentComplaintsSection } from '../home/RecentComplaintsSection';
import { useCivicData } from '../../context/CivicDataContext';

interface CivicPulseViewProps {
  onOpenReportModal: () => void;
}

export const CivicPulseView: React.FC<CivicPulseViewProps> = ({ onOpenReportModal }) => {
  const { complaints, setActiveTab } = useCivicData();

  const totalComplaints = complaints.length;
  const inProgress = complaints.filter(
    (c) => c.status === 'in_progress' || c.status === 'assigned'
  ).length;
  const verified = complaints.filter(
    (c) => c.status === 'verified' || c.status === 'resolved'
  ).length;
  const criticalCount = complaints.filter((c) => c.edpsBand === 'critical').length;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Navigation & Context */}
      <div className="bg-white border-b border-slate-200/90 py-6 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-navy mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center shadow-sm">
                <Activity size={20} className="text-teal-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-navy tracking-tight">
                  CivicPulse Operations Radar
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Citywide spatial map, explainable AI priority triage, and transparent resolution verification.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
            <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[84px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Filed</span>
              <div className="text-lg font-black text-navy">{totalComplaints}</div>
            </div>
            <div className="px-3.5 py-2 bg-amber-50 rounded-xl border border-amber-200/80 text-center min-w-[84px]">
              <span className="text-[10px] font-bold text-amber-700 uppercase">In Progress</span>
              <div className="text-lg font-black text-amber-700">{inProgress}</div>
            </div>
            <div className="px-3.5 py-2 bg-teal-50 rounded-xl border border-teal-200/80 text-center min-w-[84px]">
              <span className="text-[10px] font-bold text-teal-800 uppercase">Verified</span>
              <div className="text-lg font-black text-teal-800">{verified}</div>
            </div>
            <div className="px-3.5 py-2 bg-rose-50 rounded-xl border border-rose-200 text-center min-w-[84px]">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Critical</span>
              <div className="text-lg font-black text-rose-700">{criticalCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Interactive GIS Map & Radar */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm">
          <LiveMapSection />
        </section>

        {/* Filterable Incident Registry & Details */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm">
          <RecentComplaintsSection onOpenReportModal={onOpenReportModal} />
        </section>
      </div>
    </div>
  );
};
