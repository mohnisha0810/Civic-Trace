import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Living Network Animated Background
import { LivingNetworkBackground } from './components/visual/LivingNetworkBackground';

// Minimal, Modern & Clean Homepage
import { MinimalHomePage } from './components/home/MinimalHomePage';

// Dedicated CivicPulse Analytics & Live Map View
import { CivicPulseView } from './components/analytics/CivicPulseView';

// Dedicated Community Action View (First-class collective civic problem solving)
import { CommunityActionView } from './components/community/CommunityActionView';

// Citizen & Government views
import { TrackComplaintView } from './components/citizen/TrackComplaintView';
import { ReportComplaintModal } from './components/citizen/ReportComplaintModal';
import { MyComplaintsView } from './components/citizen/MyComplaintsView';
import { CitizenProfileView } from './components/citizen/CitizenProfileView';
import { OfficialDashboard } from './components/official/OfficialDashboard';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Auth Modal
import { AuthModal } from './components/auth/AuthModal';

// Optional Cinematic Preview (Preserved for development/preview testing via ?preview=cinematic)
import { CinematicLandingPage } from './components/cinematic/CinematicLandingPage';

import { useCivicData } from './context/CivicDataContext';
import { useAuth } from './context/AuthContext';

export const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useCivicData();
  const { isAuthenticated, currentUser } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Check if preview mode is explicitly requested via query parameter (?preview=cinematic)
  // This safely separates the experimental animation from the production website.
  const isPreviewMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === 'cinematic';
  const [showPreview, setShowPreview] = useState(isPreviewMode);

  const handleOpenReport = () => {
    setIsReportModalOpen(true);
  };

  // 1. ISOLATED DEVELOPMENT PREVIEW: Only rendered when explicitly requested via ?preview=cinematic
  if (showPreview) {
    return (
      <CinematicLandingPage
        onEnterGuest={() => setShowPreview(false)}
        initialPhase="cinematic"
      />
    );
  }

  // 2. PRODUCTION WEBSITE: Pure CivicTrace experience without any cinematic world animation
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] font-sans text-navy relative">
      {/* Living Animated Background Canvas */}
      <LivingNetworkBackground isSubdued={activeTab === 'official_dashboard'} />

      {/* Navbar */}
      <Navbar
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenReportModal={handleOpenReport}
      />

      {/* Main Viewport */}
      <main className="flex-1 relative z-10 pb-16 md:pb-0">
        {/* MINIMAL HOMEPAGE VIEW: Clean, restrained, single-action focus */}
        {activeTab === 'home' && (
          <MinimalHomePage
            onOpenReportModal={handleOpenReport}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* CIVICPULSE VIEW: Dedicated citywide map, EDPS radar, hotspot clusters, & incident registry */}
        {(activeTab === 'civic_pulse' || activeTab === 'map') && (
          <CivicPulseView onOpenReportModal={handleOpenReport} />
        )}

        {/* COMMUNITY ACTION: Ward Challenges, Volunteer Drives & Verified Progress Scores */}
        {activeTab === 'community_action' && (
          <CommunityActionView onOpenReportModal={handleOpenReport} />
        )}

        {/* TRACK COMPLAINT VIEW */}
        {activeTab === 'track' && (
          <div className="pt-8 px-4 sm:px-8">
            <TrackComplaintView />
          </div>
        )}

        {/* CITIZEN GRIEVANCE DASHBOARD */}
        {(activeTab === 'citizen_dashboard' || activeTab === 'my_complaints') && (
          <div className="pt-8 px-4 sm:px-8">
            <MyComplaintsView onOpenReportModal={handleOpenReport} />
          </div>
        )}

        {/* CITIZEN PROFILE & ACCOUNT SETTINGS */}
        {activeTab === 'citizen_profile' && (
          <div className="pt-8 px-4 sm:px-8">
            <CitizenProfileView onOpenReportModal={handleOpenReport} />
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

      {/* Mobile Bottom Navigation Bar (thumb-friendly for viewports <= 768px) */}
      <MobileBottomNav
        onOpenReportModal={handleOpenReport}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportComplaintModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
};
