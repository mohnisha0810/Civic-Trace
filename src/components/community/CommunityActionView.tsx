import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Filter,
  FileText,
  Send,
  Info,
  CheckCircle,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { CommunityChallenge, ComplaintCategory } from '../../types';
import { CityBackdrop } from '../visual/CityBackdrop';
import { ALL_INDIAN_STATES } from '../../lib/indiaGeoService';

interface CommunityActionViewProps {
  onOpenReportModal?: () => void;
}

export const CommunityActionView: React.FC<CommunityActionViewProps> = ({
  onOpenReportModal,
}) => {
  const {
    challenges,
    selectedChallengeId,
    setSelectedChallengeId,
    joinChallenge,
    leaveChallenge,
    createNewChallenge,
    approveChallenge,
    rejectChallenge,
  } = useCivicData();

  const { currentUser, isAuthenticated } = useAuth();

  // Active view tab: 'all' | 'my_proposals' | 'pending_review'
  const [activeFilter, setActiveFilter] = useState<'all' | 'my_proposals' | 'pending_review'>('all');

  // Create Campaign Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  // Form Fields
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignCategory, setCampaignCategory] = useState<ComplaintCategory>('garbage_waste');
  const [campaignState, setCampaignState] = useState('Rajasthan');
  const [campaignDistrict, setCampaignDistrict] = useState('Neemrana / Kotputli-Behror');
  const [campaignWard, setCampaignWard] = useState('Ward 1 - Industrial & Market Belt');
  const [campaignStartDate, setCampaignStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [campaignEndDate, setCampaignEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [campaignTargetOutcome, setCampaignTargetOutcome] = useState('');
  const [campaignActivities, setCampaignActivities] = useState('');
  const [campaignCoordinator, setCampaignCoordinator] = useState('');

  // Modals for Registration and Details
  const [confirmModalChallenge, setConfirmModalChallenge] = useState<CommunityChallenge | null>(null);
  const [detailModalChallenge, setDetailModalChallenge] = useState<CommunityChallenge | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Distinguish official/authorized user
  const isOfficial =
    currentUser?.role === 'government' ||
    currentUser?.role === 'official' ||
    currentUser?.role === 'super_admin';

  // Count user's submitted proposals
  const myProposals = useMemo(() => {
    if (!currentUser) return [];
    return challenges.filter((c) => c.creatorUserId === currentUser.id);
  }, [challenges, currentUser]);

  // Count pending reviews for officials
  const pendingReviews = useMemo(() => {
    return challenges.filter((c) => c.approvalStatus === 'pending_review');
  }, [challenges]);

  // Published campaigns visible to general public
  const publishedCampaigns = useMemo(() => {
    return challenges.filter((c) => (c.approvalStatus || 'approved') === 'approved');
  }, [challenges]);

  // Filtered list based on active tab
  const displayedCampaigns = useMemo(() => {
    if (activeFilter === 'my_proposals') return myProposals;
    if (activeFilter === 'pending_review' && isOfficial) return pendingReviews;
    return publishedCampaigns;
  }, [activeFilter, myProposals, pendingReviews, publishedCampaigns, isOfficial]);

  const handleOpenCreateModal = () => {
    if (!isAuthenticated || !currentUser) {
      setSuccessToast('Please sign in to create or propose a community campaign.');
      setTimeout(() => setSuccessToast(null), 3500);
      return;
    }
    setCreateFormError(null);
    setCampaignCoordinator(currentUser.name || '');
    setIsCreateModalOpen(true);
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !currentUser) {
      setCreateFormError('Authentication required.');
      return;
    }

    if (!campaignTitle.trim() || !campaignGoal.trim() || !campaignDescription.trim()) {
      setCreateFormError('Please complete all required campaign title, goal, and description fields.');
      return;
    }

    try {
      const created = createNewChallenge({
        title: campaignTitle.trim(),
        tagline: campaignGoal.trim(),
        description: campaignDescription.trim(),
        targetProblemCategory: campaignCategory,
        ward: campaignWard.trim() || 'Civic Ward Area',
        district: campaignDistrict.trim() || 'District Area',
        state: campaignState.trim() || 'Rajasthan',
        startDate: new Date(campaignStartDate).toISOString(),
        endDate: new Date(campaignEndDate).toISOString(),
        organizerName: campaignCoordinator.trim() || currentUser.name,
        organizerRole: isOfficial ? 'Municipal Coordinator' : 'Community Volunteer Lead',
        isOfficial: isOfficial,
        isDemoData: false,
        targets: {
          targetHotspotsToAddress: 10,
          targetVolunteerCleanups: 2,
          targetResidentParticipation: 50,
        },
        targetOutcome: campaignTargetOutcome.trim(),
        proposedActivities: campaignActivities.trim(),
        coordinatorContact: campaignCoordinator.trim(),
      });

      setIsCreateModalOpen(false);
      // Reset fields
      setCampaignTitle('');
      setCampaignGoal('');
      setCampaignDescription('');
      setCampaignTargetOutcome('');
      setCampaignActivities('');

      if (isOfficial) {
        setSuccessToast(`Campaign "${created.title}" successfully created and published!`);
      } else {
        setSuccessToast(`Campaign proposal submitted! It is now Pending Review by the municipal administration.`);
        setActiveFilter('my_proposals');
      }
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setCreateFormError(err.message || 'Failed to submit campaign proposal.');
    }
  };

  const handleRegisterClick = (challenge: CommunityChallenge, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setSuccessToast('Please sign in to join a community campaign.');
      setTimeout(() => setSuccessToast(null), 3500);
      return;
    }
    setConfirmModalChallenge(challenge);
  };

  const handleConfirmRegistration = () => {
    if (!confirmModalChallenge) return;

    try {
      joinChallenge(confirmModalChallenge.id);
      setSuccessToast(`You are now registered for "${confirmModalChallenge.title}"!`);
      setTimeout(() => setSuccessToast(null), 3500);
      setConfirmModalChallenge(null);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleUnregisterClick = (challengeId: string) => {
    try {
      leaveChallenge(challengeId);
      setSuccessToast('Registration cancelled.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Unregister failed:', err);
    }
  };

  const handleApproveProposal = (challengeId: string, title: string) => {
    try {
      approveChallenge(challengeId);
      setSuccessToast(`Campaign "${title}" approved and published to the public!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleRejectProposal = (challengeId: string) => {
    try {
      rejectChallenge(challengeId);
      setSuccessToast('Campaign proposal declined.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  return (
    <div className="relative min-h-[80vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Subtle Community Neighbourhood Background Backdrop */}
      <CityBackdrop variant="community" opacity={0.06} />

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-navy text-white border border-terracotta/40 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-3">
          <CheckCircle2 size={16} className="text-terracotta shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Clean Header with Create a Campaign Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage/80 pb-6 relative z-10">
        <div className="space-y-1.5 text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Community Action
          </h1>
          <p className="text-sm font-medium text-charcoal/80">
            Bring your neighbourhood together to create real change.
          </p>
        </div>

        {/* Clear "Create a Campaign" Action Button */}
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <PlusCircle size={15} className="text-white" />
          <span>Create a Campaign</span>
        </button>
      </div>

      {/* Filter Tabs: All Campaigns | My Proposals | Review Proposals */}
      <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto pb-1 relative z-10">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-navy text-white shadow-xs'
              : 'bg-white/80 text-charcoal/70 hover:bg-white hover:text-navy border border-sage/60'
          }`}
        >
          All Campaigns ({publishedCampaigns.length})
        </button>

        {isAuthenticated && (
          <button
            onClick={() => setActiveFilter('my_proposals')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'my_proposals'
                ? 'bg-navy text-white shadow-xs'
                : 'bg-white/80 text-charcoal/70 hover:bg-white hover:text-navy border border-sage/60'
            }`}
          >
            <span>My Proposals</span>
            {myProposals.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-terracotta text-white flex items-center justify-center text-[10px]">
                {myProposals.length}
              </span>
            )}
          </button>
        )}

        {isOfficial && (
          <button
            onClick={() => setActiveFilter('pending_review')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'pending_review'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <ShieldCheck size={13} className="text-amber-700" />
            <span>Review Proposals</span>
            {pendingReviews.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">
                {pendingReviews.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Campaigns Grid / Honest Empty State */}
      <div className="relative z-10">
        {displayedCampaigns.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-10 border border-sage text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-spruce-light text-navy flex items-center justify-center mx-auto">
              <Users size={24} className="text-terracotta" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-navy text-base">
                {activeFilter === 'my_proposals'
                  ? 'No Campaign Proposals Submitted Yet'
                  : activeFilter === 'pending_review'
                  ? 'All Campaign Proposals Have Been Reviewed'
                  : 'No Campaigns Currently Published in This Area'}
              </h3>
              <p className="text-xs text-charcoal/70 max-w-xs mx-auto">
                {activeFilter === 'my_proposals'
                  ? 'You have not submitted any community campaigns yet. Propose one for your neighbourhood.'
                  : 'Propose a 7-day challenge to unite your ward around a verified civic solution.'}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Create a Campaign</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedCampaigns.map((challenge) => {
              const isRegistered =
                currentUser && challenge.participatingUserIds.includes(currentUser.id);

              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
              );

              const endDateFormatted = new Date(challenge.endDate).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const isPending = challenge.approvalStatus === 'pending_review';

              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-3xl p-6 border border-sage shadow-sm hover:shadow-md hover:border-terracotta/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Ward, Area, and Status Badge */}
                    <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-navy bg-spruce-light px-2.5 py-1 rounded-full border border-sage">
                        <MapPin size={12} className="text-terracotta" />
                        <span>{challenge.ward || `${challenge.district}, ${challenge.state}`}</span>
                      </span>

                      {/* Approval Status or Duration Pill */}
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock size={11} className="text-amber-600" />
                          <span>Pending Review</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
                          <Clock size={12} className="text-slate-400" />
                          <span>{daysLeft} days remaining</span>
                        </span>
                      )}
                    </div>

                    {/* Campaign Title */}
                    <h3 className="text-lg font-black text-navy tracking-tight leading-snug">
                      {challenge.title}
                    </h3>

                    {/* One-Line Description */}
                    <p className="text-xs text-charcoal/80 font-medium leading-relaxed line-clamp-2">
                      {challenge.tagline || challenge.description}
                    </p>

                    {/* Source / Date info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 font-bold text-navy">
                        <Users size={13} className="text-terracotta" />
                        <span>
                          {challenge.participatingUserIds.length}{' '}
                          {challenge.participatingUserIds.length === 1 ? 'participant' : 'participants'}
                        </span>
                      </div>
                      <span>Ends: {endDateFormatted}</span>
                    </div>

                    {/* Source attribution if provided */}
                    {challenge.source && (
                      <p className="text-[10px] text-slate-400 italic">
                        Source: {challenge.source}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                    {/* Official Review Controls (When Viewing Pending Reviews) */}
                    {isOfficial && isPending ? (
                      <div className="w-full flex items-center gap-2">
                        <button
                          onClick={() => handleApproveProposal(challenge.id, challenge.title)}
                          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve & Publish</span>
                        </button>
                        <button
                          onClick={() => handleRejectProposal(challenge.id)}
                          className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Normal Citizen Join / Registered Button */}
                        {isRegistered ? (
                          <button
                            onClick={() => handleUnregisterClick(challenge.id)}
                            className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Click to cancel registration"
                          >
                            <Check size={14} className="text-emerald-700" />
                            <span>Registered ✓</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleRegisterClick(challenge, e)}
                            disabled={isPending}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                              isPending
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-navy hover:bg-spruce-surface text-white shadow-xs cursor-pointer active:scale-98'
                            }`}
                          >
                            <span>Join Campaign</span>
                            <ArrowRight size={13} className="text-terracotta" />
                          </button>
                        )}

                        {/* View Details Button */}
                        <button
                          onClick={() => setDetailModalChallenge(challenge)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          View Campaign
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE A CAMPAIGN MODAL FLOW */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-sage shadow-2xl space-y-5 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-navy tracking-tight">
                  Propose a Community Campaign
                </h3>
                <p className="text-xs text-charcoal/70">
                  Mobilize your neighbourhood to resolve a shared municipal issue.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {createFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{createFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
              {/* Campaign Title */}
              <div>
                <label className="block font-bold text-navy mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7-Day Clean Street Challenge"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:border-terracotta focus:outline-hidden"
                />
              </div>

              {/* Goal or Problem */}
              <div>
                <label className="block font-bold text-navy mb-1">Problem or Goal *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clear chronic commercial waste along pedestrian corridors"
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:border-terracotta focus:outline-hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-navy mb-1">Short Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe the shared neighbourhood action and why community participation matters..."
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:border-terracotta focus:outline-hidden"
                />
              </div>

              {/* State, District, Ward */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-navy mb-1">State *</label>
                  <select
                    value={campaignState}
                    onChange={(e) => setCampaignState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                  >
                    {ALL_INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-navy mb-1">District / City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kotputli-Behror / Neemrana"
                    value={campaignDistrict}
                    onChange={(e) => setCampaignDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Ward or Neighbourhood *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward 1 - Industrial & Market Belt"
                  value={campaignWard}
                  onChange={(e) => setCampaignWard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-navy mb-1">Start Date</label>
                  <input
                    type="date"
                    value={campaignStartDate}
                    onChange={(e) => setCampaignStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-navy mb-1">End Date</label>
                  <input
                    type="date"
                    value={campaignEndDate}
                    onChange={(e) => setCampaignEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* Target / Intended Outcome */}
              <div>
                <label className="block font-bold text-navy mb-1">Target / Intended Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. 5 chronic waste hotspots cleared, 30 volunteers mobilised"
                  value={campaignTargetOutcome}
                  onChange={(e) => setCampaignTargetOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* Proposed Activities */}
              <div>
                <label className="block font-bold text-navy mb-1">Proposed Activities</label>
                <input
                  type="text"
                  placeholder="e.g. Saturday 8 AM segregation drive; municipal compactor pickup"
                  value={campaignActivities}
                  onChange={(e) => setCampaignActivities(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* Coordinator contact */}
              <div>
                <label className="block font-bold text-navy mb-1">Coordinator / Contact Details</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sundaram (+91 98450 12345)"
                  value={campaignCoordinator}
                  onChange={(e) => setCampaignCoordinator(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* Notice */}
              <div className="p-3 bg-spruce-light/80 border border-sage rounded-xl flex items-start gap-2 text-[11px] text-charcoal">
                <Info size={14} className="text-terracotta shrink-0 mt-0.5" />
                <span>
                  {isOfficial
                    ? 'As an authorized municipal official, this campaign will be published directly to the public.'
                    : 'Normal citizen campaigns are submitted as "Pending Review" to ensure verified municipal coordination.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Submit Campaign Proposal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM JOIN MODAL */}
      {confirmModalChallenge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-sage shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-spruce-light text-navy flex items-center justify-center">
              <Users size={22} className="text-terracotta" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-navy text-base">
                Join {confirmModalChallenge.title}?
              </h3>
              <p className="text-xs text-charcoal/80">
                You will be registered as a community participant for{' '}
                <span className="font-bold text-navy">{confirmModalChallenge.ward}</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmModalChallenge(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegistration}
                className="flex-1 py-2.5 bg-navy hover:bg-spruce-surface text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Confirm Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT DETAILS MODAL */}
      {detailModalChallenge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-sage shadow-2xl space-y-5 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-navy bg-spruce-light px-2.5 py-0.5 rounded-full border border-sage">
                  {detailModalChallenge.ward}
                </span>
                {detailModalChallenge.isOfficial && (
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Official Campaign
                  </span>
                )}
              </div>
              <button
                onClick={() => setDetailModalChallenge(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-navy tracking-tight">
                {detailModalChallenge.title}
              </h3>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                {detailModalChallenge.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold">Registered</p>
                <p className="font-black text-navy text-sm mt-0.5">
                  {detailModalChallenge.participatingUserIds.length} Residents
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold">Scheduled End</p>
                <p className="font-black text-navy text-sm mt-0.5">
                  {new Date(detailModalChallenge.endDate).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {detailModalChallenge.targetOutcome && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <p className="text-[11px] text-slate-400 font-semibold mb-0.5">Target Outcome</p>
                <p className="font-semibold text-navy">{detailModalChallenge.targetOutcome}</p>
              </div>
            )}

            {detailModalChallenge.proposedActivities && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <p className="text-[11px] text-slate-400 font-semibold mb-0.5">Planned Activities</p>
                <p className="font-semibold text-navy">{detailModalChallenge.proposedActivities}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setDetailModalChallenge(null)}
                className="px-5 py-2.5 bg-navy text-white font-bold rounded-xl text-xs hover:bg-spruce-surface transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
