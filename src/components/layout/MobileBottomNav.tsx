import React from 'react';
import {
  Compass,
  Search,
  PlusCircle,
  Activity,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { ViewTab } from '../../types';

interface MobileBottomNavProps {
  onOpenReportModal: () => void;
  onOpenAuthModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenReportModal,
}) => {
  const { activeTab, setActiveTab } = useCivicData();
  const { currentUser } = useAuth();

  const isOfficial = currentUser?.role === 'government' || currentUser?.role === 'official' || currentUser?.role === 'super_admin';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation bar"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {/* 1. Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-navy font-bold'
              : 'text-slate-400 hover:text-navy'
          }`}
        >
          <Compass size={20} className={activeTab === 'home' ? 'text-teal-600 stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* 2. Track Grievances */}
        <button
          onClick={() => setActiveTab('track')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'track'
              ? 'text-navy font-bold'
              : 'text-slate-400 hover:text-navy'
          }`}
        >
          <Search size={20} className={activeTab === 'track' ? 'text-teal-600 stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5">Track</span>
        </button>

        {/* 3. Center Prominent Report Button */}
        <button
          onClick={onOpenReportModal}
          className="flex flex-col items-center justify-center -mt-5 min-w-[56px] min-h-[56px] rounded-2xl bg-navy text-white shadow-lg border-2 border-white active:scale-95 transition-all cursor-pointer"
          title="Report Civic Issue"
        >
          <PlusCircle size={24} className="text-teal-accent" />
          <span className="text-[9px] font-extrabold uppercase tracking-tight mt-0.5">Report</span>
        </button>

        {/* 4. CivicPulse */}
        <button
          onClick={() => setActiveTab('civic_pulse')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'civic_pulse' || activeTab === 'map'
              ? 'text-navy font-bold'
              : 'text-slate-400 hover:text-navy'
          }`}
        >
          <Activity size={20} className={activeTab === 'civic_pulse' || activeTab === 'map' ? 'text-teal-600 stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5">Pulse</span>
        </button>

        {/* 5. Citizen Grievances / Government Portal */}
        {isOfficial ? (
          <button
            onClick={() => setActiveTab('official_dashboard')}
            className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'official_dashboard'
                ? 'text-navy font-bold'
                : 'text-slate-400 hover:text-navy'
            }`}
          >
            <ShieldCheck size={20} className={activeTab === 'official_dashboard' ? 'text-teal-600 stroke-[2.5]' : ''} />
            <span className="text-[10px] mt-0.5">Official</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('my_complaints')}
            className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'my_complaints' || activeTab === 'citizen_dashboard'
                ? 'text-navy font-bold'
                : 'text-slate-400 hover:text-navy'
            }`}
          >
            <FileText size={20} className={activeTab === 'my_complaints' || activeTab === 'citizen_dashboard' ? 'text-teal-600 stroke-[2.5]' : ''} />
            <span className="text-[10px] mt-0.5">Grievances</span>
          </button>
        )}
      </div>
    </nav>
  );
};
