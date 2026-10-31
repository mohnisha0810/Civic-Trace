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
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { CommunityChallenge } from '../../types';

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
  } = useCivicData();

  const { currentUser, isAuthenticated } = useAuth();

  // Registration Confirm Modal State
  const [confirmModalChallenge, setConfirmModalChallenge] = useState<CommunityChallenge | null>(null);
  // Compact Details View Modal State
  const [detailModalChallenge, setDetailModalChallenge] = useState<CommunityChallenge | null>(null);
  // Success toast state
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleRegisterClick = (challenge: CommunityChallenge, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-3">
          <CheckCircle2 size={16} className="text-white shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Clean Minimal Header */}
      <div className="space-y-1.5 text-left border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
          Community Action
        </h1>
        <p className="text-sm font-medium text-slate-600">
          Join your neighbourhood to solve shared civic problems.
        </p>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map((challenge) => {
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

          return (
            <div
              key={challenge.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Ward & Status Pill */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/70">
                    <MapPin size={12} className="text-teal-700" />
                    <span>{challenge.ward}</span>
                  </span>

                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Clock size={12} />
                    <span>{daysLeft > 0 ? `${daysLeft} days remaining` : 'Concluded'}</span>
                  </span>
                </div>

                {/* Challenge Name */}
                <h2 className="text-lg font-black text-navy leading-snug">
                  {challenge.title}
                </h2>

                {/* One-Line Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {challenge.tagline || challenge.description}
                </p>

                {/* Meta details */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-bold text-navy">
                    <Users size={14} className="text-teal-700" />
                    <span>
                      {challenge.participatingUserIds.length}{' '}
                      {challenge.participatingUserIds.length === 1
                        ? 'resident registered'
                        : 'residents registered'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">Ends: {endDateFormatted}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                {isRegistered ? (
                  <button
                    onClick={() => handleUnregisterClick(challenge.id)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
                    title="Click to cancel registration"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600 group-hover:hidden" />
                    <span className="group-hover:hidden">Registered ✓</span>
                    <span className="hidden group-hover:inline">Leave Challenge</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleRegisterClick(challenge, e)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black bg-navy hover:bg-navy-surface text-white shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Register</span>
                    <ArrowRight size={13} className="text-teal-accent" />
                  </button>
                )}

                <button
                  onClick={() => setDetailModalChallenge(challenge)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  View Challenge
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =======================================================================
          SIMPLE CONFIRMATION MODAL FOR REGISTRATION
         ======================================================================= */}
      {confirmModalChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
            <button
              onClick={() => setConfirmModalChallenge(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-navy rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
                <Users size={20} className="text-teal-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-navy">Confirm Registration</h3>
                <p className="text-[11px] text-slate-500">{confirmModalChallenge.ward}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <p className="font-bold text-navy">{confirmModalChallenge.title}</p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {confirmModalChallenge.tagline}
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              By registering, you support this neighbourhood initiative. Your account (
              <strong>{currentUser?.name || 'Citizen'}</strong>) will be counted in the ward
              participation tally.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModalChallenge(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRegistration}
                className="px-5 py-2 rounded-xl text-xs font-black bg-navy hover:bg-navy-surface text-white shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Confirm & Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          COMPACT CHALLENGE DETAILS MODAL
         ======================================================================= */}
      {detailModalChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailModalChallenge(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-navy rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {detailModalChallenge.ward}
              </span>
              <h3 className="text-xl font-black text-navy mt-1">
                {detailModalChallenge.title}
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                {detailModalChallenge.tagline}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {detailModalChallenge.description}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Organizing Body</span>
                <span className="font-bold text-navy">{detailModalChallenge.organizerName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Participants</span>
                <span className="font-bold text-navy">
                  {detailModalChallenge.participatingUserIds.length} Registered
                </span>
              </div>
            </div>

            {/* If Volunteer cleanups exist, show clean list */}
            {detailModalChallenge.volunteerActivities.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
                  Upcoming Community Drives
                </h4>
                <div className="space-y-2">
                  {detailModalChallenge.volunteerActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-navy">{act.title}</p>
                        <p className="text-[11px] text-slate-500">{act.location}</p>
                      </div>
                      <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {act.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalChallenge(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              {currentUser &&
              detailModalChallenge.participatingUserIds.includes(currentUser.id) ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={14} />
                  <span>You are Registered</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const ch = detailModalChallenge;
                    setDetailModalChallenge(null);
                    setConfirmModalChallenge(ch);
                  }}
                  className="px-5 py-2.5 bg-navy hover:bg-navy-surface text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  Register for Challenge
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
