import React, { useState } from 'react';
import { X, Upload, MapPin, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { Complaint } from '../../types';
import { validateResolutionGeofence } from '../../lib/geofence';

interface ResolveComplaintModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResolveComplaintModal: React.FC<ResolveComplaintModalProps> = ({
  complaint,
  isOpen,
  onClose,
}) => {
  const { submitResolutionProof } = useCivicData();

  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');
  const [completedLat, setCompletedLat] = useState<number>(complaint?.latitude || 28.6139);
  const [completedLng, setCompletedLng] = useState<number>(complaint?.longitude || 77.2090);
  const [notes, setNotes] = useState(
    'Hot-mix asphalt compaction completed with vibrating roller (>95% Proctor density). Surface leveled to existing road grade.'
  );

  if (!isOpen || !complaint) return null;

  // Real-time geofence calculation
  const geofence = validateResolutionGeofence(
    complaint.latitude,
    complaint.longitude,
    completedLat,
    completedLng
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAfterPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseExactGps = () => {
    // Exact or slight 3m realistic field offset
    setCompletedLat(Math.round((complaint.latitude + 0.00003) * 100000) / 100000);
    setCompletedLng(Math.round((complaint.longitude + 0.00002) * 100000) / 100000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!afterPhotoUrl) return;

    submitResolutionProof(complaint.id, {
      afterPhotoUrl,
      completedLatitude: completedLat,
      completedLongitude: completedLng,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-forest/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-softwhite rounded-3xl max-w-lg w-full border border-sage shadow-elevated p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-charcoal-muted hover:text-forest hover:bg-sage/40"
        >
          <X size={20} />
        </button>

        <div className="border-b border-sage/60 pb-3 mb-5">
          <span className="text-[10px] font-bold uppercase text-forest tracking-wider">
            Contractor Proof-of-Fix Submission
          </span>
          <h2 className="text-base font-bold text-forest">
            Submit Resolution Evidence for #{complaint.id}
          </h2>
          <p className="text-xs text-charcoal-muted mt-0.5 truncate">{complaint.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Photo Upload */}
          <div className="space-y-1.5">
            <label className="font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Camera size={14} className="text-forest" />
              <span>Completed Resolution Photo</span>
            </label>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-ivory hover:bg-sage/40 border border-sage rounded-xl font-semibold text-charcoal transition-colors">
                <Upload size={14} />
                <span>Select After Photo</span>
                <input
                  type="file"
                  required={!afterPhotoUrl}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {afterPhotoUrl && (
                <div className="w-16 h-12 rounded-lg overflow-hidden border border-sage bg-ivory flex-shrink-0">
                  <img src={afterPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Coordinates & Geofence Audit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-charcoal uppercase tracking-wider">
                Completion GPS Coordinates
              </label>
              <button
                type="button"
                onClick={handleUseExactGps}
                className="text-[11px] font-bold text-burnt hover:underline"
              >
                Match Defect Geofence
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.000001"
                required
                value={completedLat}
                onChange={e => setCompletedLat(parseFloat(e.target.value))}
                className="px-3 py-2 bg-ivory rounded-xl border border-sage font-mono text-xs text-charcoal focus:outline-none"
              />
              <input
                type="number"
                step="0.000001"
                required
                value={completedLng}
                onChange={e => setCompletedLng(parseFloat(e.target.value))}
                className="px-3 py-2 bg-ivory rounded-xl border border-sage font-mono text-xs text-charcoal focus:outline-none"
              />
            </div>

            {/* Geofence Live Audit Badge */}
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-[11px] font-semibold ${
                geofence.isValid
                  ? 'bg-sage border-forest/30 text-forest'
                  : 'bg-peach border-burnt/30 text-burnt'
              }`}
            >
              {geofence.isValid ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              <span>{geofence.message}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-bold text-charcoal uppercase tracking-wider">
              Field Completion Notes
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage font-medium text-charcoal focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-sage/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-softwhite border border-sage text-charcoal hover:bg-ivory rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!afterPhotoUrl}
              className={`px-5 py-2.5 rounded-xl font-bold shadow-card transition-all ${
                afterPhotoUrl
                  ? 'bg-forest hover:bg-forest-hover text-softwhite'
                  : 'bg-sage text-charcoal-muted cursor-not-allowed'
              }`}
            >
              Upload Proof & Open Verification Gate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
