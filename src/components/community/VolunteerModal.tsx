import React, { useState } from 'react';
import { X, HeartHandshake, ShieldCheck, CheckCircle2, User, Phone, Sparkles } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { VolunteerActivity } from '../../types';

interface VolunteerModalProps {
  isOpen: boolean;
  activity: VolunteerActivity | null;
  onClose: () => void;
}

export const VolunteerModal: React.FC<VolunteerModalProps> = ({
  isOpen,
  activity,
  onClose,
}) => {
  const { registerForVolunteerActivity } = useCivicData();
  const { currentUser, isAuthenticated } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [equipment, setEquipment] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !activity) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }

    try {
      registerForVolunteerActivity(activity.challengeId, activity.id);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
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
            <h3 className="text-lg font-black text-navy mb-1">Registration Confirmed!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              You are signed up for <strong>{activity.title}</strong>. We look forward to seeing you!
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-navy">Volunteer Registration</h3>
                <p className="text-[11px] text-slate-500">Join hands with fellow residents</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs">
              <p className="font-bold text-navy text-xs">{activity.title}</p>
              <p className="text-slate-600 text-[11px] mt-0.5">{activity.location}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                <span>Coordinator: <strong>{activity.coordinatorName}</strong></span>
                <span className="text-emerald-700 font-bold">
                  {activity.registeredUserIds.length} / {activity.maxVolunteers} Joined
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sundaram"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Number (Optional)</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Equipment / Notes (Optional)</label>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="e.g. Bringing extra safety gloves and trash bags"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/60 text-[11px] text-teal-900 flex items-start gap-2">
                <ShieldCheck size={14} className="text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Guaranteed:</strong> Contact info is strictly used for emergency contact and drive coordination by the nodal coordinator.
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
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
