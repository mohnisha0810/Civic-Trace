import React, { useState } from 'react';
import { X, PlusCircle, Calendar, MapPin, Users, Target, ShieldCheck, AlertCircle } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { ComplaintCategory } from '../../types';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (challengeId: string) => void;
}

const CATEGORIES: { id: ComplaintCategory; label: string; icon: string }[] = [
  { id: 'garbage_waste', label: 'Garbage & Waste Accumulation', icon: '🗑️' },
  { id: 'streetlight_electrical', label: 'Streetlights & Electrical', icon: '💡' },
  { id: 'drainage_sewage', label: 'Drainage & Sewage Clearing', icon: '🌊' },
  { id: 'water_supply', label: 'Water Supply & Leakage', icon: '🚰' },
  { id: 'road_damage', label: 'Road Repair & Potholes', icon: '🕳️' },
  { id: 'other', label: 'Other Ward Initiative', icon: '🎯' },
];

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createNewChallenge, setSelectedChallengeId } = useCivicData();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('garbage_waste');
  const [ward, setWard] = useState('Ward 151 - Koramangala');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [state, setState] = useState('Karnataka');
  const [durationDays, setDurationDays] = useState(7);
  const [targetHotspots, setTargetHotspots] = useState(15);
  const [targetActivities, setTargetActivities] = useState(3);
  const [targetResidents, setTargetResidents] = useState(100);
  const [organizerName, setOrganizerName] = useState(currentUser?.name || 'Ward Resident Coalition');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a challenge title.');
      return;
    }
    if (!tagline.trim()) {
      setError('Please provide a short summary/tagline.');
      return;
    }

    try {
      const now = new Date();
      const end = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const created = createNewChallenge({
        title: title.trim(),
        tagline: tagline.trim(),
        description:
          description.trim() ||
          `${title.trim()} launched for ${ward}. Citizen-led collective initiative tracking verified civic improvements.`,
        targetProblemCategory: category,
        ward: ward.trim(),
        district: district.trim(),
        state: state.trim(),
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        organizerName: organizerName.trim(),
        organizerRole: currentUser?.role === 'government' ? 'Municipal Authority' : 'Community Lead',
        isOfficial: currentUser?.role === 'government' || currentUser?.role === 'official',
        isDemoData: false,
        targets: {
          targetHotspotsToAddress: Number(targetHotspots) || 10,
          targetVolunteerCleanups: Number(targetActivities) || 2,
          targetResidentParticipation: Number(targetResidents) || 50,
        },
        participationRules: [
          'All reported hotspots must include photographic evidence with verified location.',
          'Cleanup drives must adhere to safety protocols and local municipal guidelines.',
          'Consensus verification requires confirmation from at least two local residents.',
        ],
      });

      setSelectedChallengeId(created.id);
      if (onSuccess) onSuccess(created.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch challenge.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-navy p-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
            <PlusCircle size={22} className="text-teal-700" />
          </div>
          <div>
            <h2 className="text-xl font-black text-navy tracking-tight">Launch a Community Challenge</h2>
            <p className="text-xs text-slate-500">Unite your ward to resolve a shared civic problem</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Challenge Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. 7-Day Clean Street Challenge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tagline / Mission *</label>
            <input
              type="text"
              required
              placeholder="e.g. Clear illegal sidewalk dumping along main market corridors."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Problem Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Duration (Days)</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium bg-white"
              >
                <option value={3}>3 Days (Flash Drive)</option>
                <option value={7}>7 Days (Weekly Challenge)</option>
                <option value={14}>14 Days (Two-Week Push)</option>
                <option value={30}>30 Days (Monthly Ward Drive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ward</label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="Ward 151"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">District / City</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Bengaluru"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Karnataka"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-navy mb-2 flex items-center gap-1.5">
              <Target size={14} className="text-teal-700" />
              <span>Measurable Goals</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Target Hotspots</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetHotspots}
                  onChange={(e) => setTargetHotspots(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Target Drives</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={targetActivities}
                  onChange={(e) => setTargetActivities(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Residents Joined</label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={targetResidents}
                  onChange={(e) => setTargetResidents(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Organizer / Lead</label>
            <input
              type="text"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="e.g. Ward 151 Community Taskforce"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the scope, meeting points, and expected outcomes..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-surface text-white font-extrabold shadow-sm active:scale-95 transition-all"
            >
              Launch Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
