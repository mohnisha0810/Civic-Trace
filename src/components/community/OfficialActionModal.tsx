import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, FileText, Camera, AlertCircle } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { CommunityChallenge, VolunteerActivity } from '../../types';

interface OfficialActionModalProps {
  isOpen: boolean;
  challenge: CommunityChallenge | null;
  mode: 'update' | 'verify' | 'complete_activity';
  targetActivity?: VolunteerActivity | null;
  onClose: () => void;
}

export const OfficialActionModal: React.FC<OfficialActionModalProps> = ({
  isOpen,
  challenge,
  mode,
  targetActivity,
  onClose,
}) => {
  const {
    postChallengeOfficialUpdate,
    verifyChallengeImprovement,
    completeVolunteerActivity,
  } = useCivicData();
  const { currentUser } = useAuth();

  const [details, setDetails] = useState('');
  const [metricUnit, setMetricUnit] = useState('450 kg debris cleared');
  const [completionNotes, setCompletionNotes] = useState('Drive completed with 32 volunteers. Handled through BBMP waste management division.');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !challenge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'update') {
        if (!details.trim()) {
          setError('Please provide bulletin details.');
          return;
        }
        postChallengeOfficialUpdate(challenge.id, {
          type: 'official_update',
          details: details.trim(),
        });
      } else if (mode === 'verify') {
        if (!details.trim()) {
          setError('Please describe the verified physical improvement.');
          return;
        }
        const targetComplaintId = challenge.associatedComplaintIds[0] || 'CP-8492';
        verifyChallengeImprovement(
          challenge.id,
          targetComplaintId,
          `${details.trim()} [Metric: ${metricUnit.trim()}]`
        );
      } else if (mode === 'complete_activity' && targetActivity) {
        completeVolunteerActivity(
          challenge.id,
          targetActivity.id,
          completionNotes.trim() || 'Drive successfully completed with high community turnout.'
        );
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-navy p-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-black text-navy mb-1">
              {mode === 'complete_activity'
                ? 'Activity Marked Completed'
                : mode === 'verify'
                ? 'Improvement Audited & Verified'
                : 'Official Bulletin Posted'}
            </h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              The municipal ledger and Community Progress Score have been refreshed.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                <ShieldCheck size={20} className="text-teal-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-navy">
                  {mode === 'complete_activity'
                    ? 'Record Activity Completion'
                    : mode === 'verify'
                    ? 'Verify Physical Improvement'
                    : 'Post Official Bulletin'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {challenge.ward} &bull; {challenge.title}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === 'update' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Update Text *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="e.g. BBMP compactor deployed to 4th block. Secondary garbage collection cleared 1.2 metric tons today."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>
              )}

              {mode === 'verify' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Inspection & Audit Notes *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="e.g. On-site physical inspection confirmed sidewalk completely cleared of debris and commercial dumping. Geofence GPS verified within 15 meters."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Metric / Volume Cleared
                    </label>
                    <input
                      type="text"
                      value={metricUnit}
                      onChange={(e) => setMetricUnit(e.target.value)}
                      placeholder="e.g. 450 kg debris cleared"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                    />
                  </div>
                </>
              )}

              {mode === 'complete_activity' && targetActivity && (
                <div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3">
                    <p className="font-bold text-navy">{targetActivity.title}</p>
                    <p className="text-slate-600 text-[11px]">{targetActivity.location}</p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Registered: {targetActivity.registeredUserIds.length} volunteers
                    </p>
                  </div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Completion Report & Outcomes *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Record turnout, weight of waste collected, or repairs completed..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck size={14} className="text-teal-700 shrink-0" />
                <span>
                  Signed digitally as <strong>{currentUser?.name || 'Ward Officer'}</strong> ({currentUser?.role || 'authorized official'}).
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-surface text-white font-extrabold shadow-sm active:scale-95 transition-all"
                >
                  Confirm & Post
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
