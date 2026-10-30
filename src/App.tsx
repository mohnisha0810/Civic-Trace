import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Living Network Animated Background
import { LivingNetworkBackground } from './components/visual/LivingNetworkBackground';

// Homepage Sections (Clean, Narrative & Focused)
import { HeroSection } from './components/home/HeroSection';
import { HowItWorks } from './components/home/HowItWorks';
import { LiveMapSection } from './components/home/LiveMapSection';
import { LiquidGlassSection } from './components/home/LiquidGlassSection';
import { RecentComplaintsSection } from './components/home/RecentComplaintsSection';

// Citizen & Government views
import { TrackComplaintView } from './components/citizen/TrackComplaintView';
import { ReportComplaintModal } from './components/citizen/ReportComplaintModal';
import { OfficialDashboard } from './components/official/OfficialDashboard';

// Auth Modal
import { AuthModal } from './components/auth/AuthModal';

import { useCivicData } from './context/CivicDataContext';
import { useAuth } from './context/AuthContext';

export const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useCivicData();
  const { isAuthenticated, currentUser } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleOpenReport = () => {
    setIsReportModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-sans text-charcoal relative">
      {/* Living Animated Background Canvas */}
      <LivingNetworkBackground isSubdued={activeTab === 'official_dashboard'} />

      {/* Navbar */}
      <Navbar
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenReportModal={handleOpenReport}
      />

      {/* Main Viewport */}
      <main className="flex-1 relative z-10">
        {/* HOMEPAGE VIEW: Hero, Signature Journey, Map, Optics, & Recent Complaints */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <HeroSection onOpenReportModal={handleOpenReport} />
            <HowItWorks />
            <LiveMapSection />
            <LiquidGlassSection />
            <RecentComplaintsSection onOpenReportModal={handleOpenReport} />
          </div>
        )}

        {/* TRACK COMPLAINT VIEW */}
        {activeTab === 'track' && (
          <div className="pt-8 px-4 sm:px-8">
            <TrackComplaintView />
          </div>
        )}

        {/* LIVE CIVIC MAP VIEW */}
        {activeTab === 'map' && (
          <div className="pt-8 px-4 sm:px-8 space-y-6">
            <LiveMapSection />
            <RecentComplaintsSection onOpenReportModal={handleOpenReport} />
          </div>
        )}

        {/* GOVERNMENT OPERATIONS PORTAL */}
        {activeTab === 'official_dashboard' && (
          <div className="pt-8 px-4 sm:px-8">
            <OfficialDashboard />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportComplaintModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
};
