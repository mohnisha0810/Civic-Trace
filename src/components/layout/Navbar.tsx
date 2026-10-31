import React, { useState } from 'react';
import {
  PlusCircle,
  Search,
  MapPin,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Activity,
  Users,
} from 'lucide-react';
import { CivicTraceLogo } from './CivicTraceLogo';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { ViewTab } from '../../types';

interface NavbarProps {
  onOpenAuthModal: () => void;
  onOpenReportModal: () => void;
  onOpenCivicLens?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuthModal,
  onOpenReportModal,
}) => {
  const { activeTab, setActiveTab } = useCivicData();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleNav = (tab: ViewTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => handleNav('home')}
          className="cursor-pointer"
          title="CivicTrace Home"
        >
          <CivicTraceLogo size="md" showTagline={false} />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <button
            onClick={() => handleNav('home')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-xs'
                : 'hover:text-navy hover:bg-slate-100'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => handleNav('civic_pulse')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'civic_pulse' || activeTab === 'map'
                ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-xs'
                : 'hover:text-navy hover:bg-slate-100'
            }`}
          >
            CivicPulse
          </button>

          <button
            onClick={() => handleNav('community_action')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'community_action'
                ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-xs'
                : 'hover:text-navy hover:bg-slate-100'
            }`}
          >
            <Users size={14} className={activeTab === 'community_action' ? 'text-teal-700' : 'text-slate-500'} />
            <span>Community Action</span>
          </button>

          <button
            onClick={() => handleNav('track')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'track'
                ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/80 shadow-xs'
                : 'hover:text-navy hover:bg-slate-100'
            }`}
          >
            Track Complaints
          </button>

          <button
            onClick={() => handleNav('official_dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'official_dashboard'
                ? 'bg-navy text-white font-bold shadow-xs'
                : 'bg-slate-100 text-navy hover:bg-slate-200/80 font-bold'
            }`}
          >
            <ShieldCheck size={14} className="text-teal-600" />
            <span>Government Portal</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Primary Action Button */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-navy hover:bg-navy-surface text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <PlusCircle size={15} className="text-teal-accent" />
            <span>Report an Issue</span>
          </button>

          {/* User Account / Single Authentication Action */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-bold text-navy transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-navy truncate">{currentUser.name}</p>
                    <span className="inline-block text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full mt-1 capitalize border border-teal-200/60">
                      {currentUser.role} Account
                    </span>
                  </div>

                  <div className="py-1 border-b border-slate-100 space-y-0.5">
                    <button
                      onClick={() => handleNav('my_complaints')}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-colors text-left cursor-pointer"
                    >
                      <User size={13} className="text-teal-600" />
                      <span>My Grievances</span>
                    </button>
                    <button
                      onClick={() => handleNav('citizen_profile')}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-colors text-left cursor-pointer"
                    >
                      <ShieldCheck size={13} className="text-teal-600" />
                      <span>Profile & Privacy</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition-colors mt-1 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-bold text-navy transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-navy hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-slate-200 mt-3 space-y-2 text-xs font-semibold">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'home' ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('civic_pulse')}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'civic_pulse' || activeTab === 'map' ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700'
            }`}
          >
            CivicPulse Operations
          </button>
          <button
            onClick={() => handleNav('community_action')}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === 'community_action' ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700'
            }`}
          >
            <Users size={14} className={activeTab === 'community_action' ? 'text-teal-700' : 'text-slate-500'} />
            <span>Community Action</span>
          </button>
          <button
            onClick={() => handleNav('track')}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'track' ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700'
            }`}
          >
            Track Complaints
          </button>
          <button
            onClick={() => handleNav('official_dashboard')}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'official_dashboard' ? 'bg-navy text-white font-bold' : 'text-navy'
            }`}
          >
            Government Operations Portal
          </button>
        </div>
      )}
    </header>
  );
};
