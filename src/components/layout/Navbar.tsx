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
    <header className="sticky top-0 z-40 bg-softwhite/95 backdrop-blur-md border-b border-sage px-4 sm:px-8 py-3.5">
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
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-charcoal">
          <button
            onClick={() => handleNav('home')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'home'
                ? 'bg-sage text-forest font-bold'
                : 'hover:text-forest hover:bg-sage/40'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => handleNav('track')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'track'
                ? 'bg-sage text-forest font-bold'
                : 'hover:text-forest hover:bg-sage/40'
            }`}
          >
            Track Complaints
          </button>

          <button
            onClick={() => handleNav('map')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'map'
                ? 'bg-sage text-forest font-bold'
                : 'hover:text-forest hover:bg-sage/40'
            }`}
          >
            Live Civic Map
          </button>

          <button
            onClick={() => handleNav('official_dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'official_dashboard'
                ? 'bg-forest text-softwhite font-bold shadow-xs'
                : 'bg-sage/60 text-forest hover:bg-sage font-bold'
            }`}
          >
            <ShieldCheck size={14} className="text-burnt" />
            <span>Government Portal</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Primary Action Button */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-forest-hover text-softwhite rounded-xl text-xs font-bold transition-all shadow-card hover:shadow-elevated active:scale-95"
          >
            <PlusCircle size={15} className="text-burnt" />
            <span className="hidden sm:inline">Report an Issue</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* Authentication & Profile Controls */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-ivory hover:bg-sage/40 rounded-xl border border-sage transition-colors text-xs font-bold text-forest"
              >
                <div className="w-6 h-6 rounded-lg bg-forest text-softwhite flex items-center justify-center text-[10px] font-black">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                <ChevronDown size={12} className="text-charcoal-muted" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-softwhite rounded-2xl border border-sage shadow-elevated p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-sage/60">
                    <div className="font-bold text-forest truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-charcoal-muted truncate">{currentUser.identifier}</div>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-burnt px-2 py-0.5 bg-peach rounded-md">
                      {currentUser.role === 'citizen' ? 'Citizen' : 'Government Official'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition-colors mt-1"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 bg-ivory hover:bg-sage/40 text-forest border border-sage rounded-xl font-bold text-xs transition-colors"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-charcoal hover:text-forest hover:bg-sage/40 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-sage/60 space-y-1.5 text-xs font-semibold text-charcoal animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'home' ? 'bg-sage text-forest font-bold' : 'hover:bg-sage/40'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('track')}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'track' ? 'bg-sage text-forest font-bold' : 'hover:bg-sage/40'
            }`}
          >
            Track Complaints
          </button>
          <button
            onClick={() => handleNav('map')}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'map' ? 'bg-sage text-forest font-bold' : 'hover:bg-sage/40'
            }`}
          >
            Live Civic Map
          </button>
          <button
            onClick={() => handleNav('official_dashboard')}
            className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 font-bold ${
              activeTab === 'official_dashboard' ? 'bg-forest text-softwhite' : 'bg-sage/60 text-forest'
            }`}
          >
            <ShieldCheck size={14} className="text-burnt" />
            <span>Government Portal</span>
          </button>
        </div>
      )}
    </header>
  );
};
