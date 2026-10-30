import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  Upload,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCw,
  Navigation,
  Eye,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { ComplaintCategory, Complaint } from '../../types';
import { reverseGeocodeIndia } from '../../lib/indiaGeoService';
import { classifyCivicImage, CATEGORY_LABELS } from '../../lib/imageClassifier';

interface ReportComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_CATEGORIES: { id: ComplaintCategory; label: string; icon: string }[] = [
  { id: 'garbage_waste', label: 'Garbage / Waste Accumulation', icon: '🗑️' },
  { id: 'drainage_sewage', label: 'Drainage / Sewage Problem', icon: '🌊' },
  { id: 'road_damage', label: 'Pothole / Damaged Road', icon: '🕳️' },
  { id: 'water_supply', label: 'Water Leakage', icon: '🚰' },
  { id: 'streetlight_electrical', label: 'Broken Streetlight', icon: '💡' },
  { id: 'other', label: 'Other Civic Issue', icon: '⚠️' },
];

export const ReportComplaintModal: React.FC<ReportComplaintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { submitNewComplaint, setSelectedComplaintId, setActiveTab } = useCivicData();

  // 1. Photo state
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [isScanningImage, setIsScanningImage] = useState<boolean>(false);
  const [detectedCategoryLabel, setDetectedCategoryLabel] = useState<string | null>(null);

  // 2. Location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [stateName, setStateName] = useState<string>('Delhi');
  const [districtName, setDistrictName] = useState<string>('New Delhi');
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsConfirmed, setGpsConfirmed] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [showManualLocation, setShowManualLocation] = useState<boolean>(false);

  // 3. Category & Description
  const [category, setCategory] = useState<ComplaintCategory>('road_damage');
  const [optionalDetail, setOptionalDetail] = useState<string>('');

  // 4. Submission & Signature Animation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [signatureStep, setSignatureStep] = useState<'idle' | 'morphing' | 'card_ready'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state upon opening
  useEffect(() => {
    if (isOpen) {
      setPhotoDataUrl('');
      setIsScanningImage(false);
      setDetectedCategoryLabel(null);
      setLatitude(null);
      setLongitude(null);
      setAddress('');
      setIsLocatingGps(false);
      setGpsConfirmed(false);
      setLocationStatus('');
      setShowManualLocation(false);
      setCategory('road_damage');
      setOptionalDetail('');
      setIsSubmitting(false);
      setSubmitError(null);
      setCreatedComplaint(null);
      setSignatureStep('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Request browser GPS coordinates and reverse-geocode to human-readable address
  const requestDeviceLocation = () => {
    setIsLocatingGps(true);
    setGpsConfirmed(false);
    setLocationStatus('Detecting device GPS coordinates...');

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsLocatingGps(false);
      setLocationStatus('Geolocation not supported. Please enter location below.');
      setShowManualLocation(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const rev = await reverseGeocodeIndia(lat, lng);
          setAddress(rev.address);
          setStateName(rev.state);
          setDistrictName(rev.district);
          setGpsConfirmed(true);
          setLocationStatus(`Location detected: ${rev.address}`);
        } catch {
          const fallback = `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setAddress(fallback);
          setGpsConfirmed(true);
          setLocationStatus(`Location detected: ${fallback}`);
        } finally {
          setIsLocatingGps(false);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsConfirmed(false);
        setLocationStatus(`GPS permission needed (${err.message}). Enter location manually.`);
        setShowManualLocation(true);
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  // Handle photograph capture or upload
  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setPhotoDataUrl(dataUrl);

        // Automatically start GPS detection if not already acquired
        if (!gpsConfirmed && !isLocatingGps) {
          requestDeviceLocation();
        }

        // Run real client-side visual classification
        setIsScanningImage(true);
        try {
          const result = await classifyCivicImage(dataUrl);
          setCategory(result.category);
          setDetectedCategoryLabel(result.categoryLabel);
        } catch {
          setDetectedCategoryLabel(null);
        } finally {
          setTimeout(() => {
            setIsScanningImage(false);
          }, 600);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Complaint Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoDataUrl) {
      setSubmitError('Please capture or upload a photograph of the issue.');
      return;
    }

    const effectiveLat = latitude !== null ? latitude : 28.6139;
    const effectiveLng = longitude !== null ? longitude : 77.2090;
    const effectiveAddress = address.trim() || 'Central Civic Zone, India';

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Save to real persistent database
      const newRecord = submitNewComplaint({
        title: CATEGORY_LABELS[category] || 'Civic Issue',
        description: optionalDetail.trim() || `Reported ${CATEGORY_LABELS[category]} needing municipal attention.`,
        category,
        address: effectiveAddress,
        state: stateName,
        district: districtName,
        latitude: effectiveLat,
        longitude: effectiveLng,
        photoUrl: photoDataUrl,
      });

      // Step 2: Trigger signature morphing animation sequence
      setSignatureStep('morphing');
      setTimeout(() => {
        setCreatedComplaint(newRecord);
        setSignatureStep('card_ready');
        setIsSubmitting(false);
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err?.message || 'Failed to register complaint. Please try again.');
    }
  };

  // Navigate directly to track the newly created complaint
  const handleTrackComplaint = () => {
    if (createdComplaint) {
      setSelectedComplaintId(createdComplaint.id);
    }
    setActiveTab('track');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-forest/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-softwhite rounded-3xl max-w-lg w-full border border-sage shadow-elevated overflow-hidden p-6 sm:p-7 relative my-6"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-charcoal-muted hover:text-forest hover:bg-sage/40 transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* ================================================================== */}
        {/* STATE A: SIGNATURE ANIMATION — COMPLAINT PHOTO TO TRACKING CARD    */}
        {/* ================================================================== */}
        {createdComplaint && signatureStep === 'card_ready' ? (
          <div className="text-center py-4 space-y-6">
            {/* Signature Fly-In Digital Card Container */}
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              className="relative max-w-sm mx-auto"
            >
              {/* Top Stamp / Badge */}
              <motion.div
                initial={{ scale: 2.2, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 350, damping: 22 }}
                className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-card mb-3"
              >
                <CheckCircle2 size={32} />
              </motion.div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-burnt px-3 py-1 bg-peach rounded-full">
                Complaint Registered Successfully
              </span>

              <h2 className="text-2xl font-extrabold text-forest mt-2">
                Tracking Card Issued
              </h2>
              <p className="text-xs text-charcoal-muted mt-1">
                Your report has entered the municipal queue for verification & repair.
              </p>

              {/* Digital Card Surface (Morphed from Photo) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-5 bg-ivory rounded-2xl border-2 border-forest/25 p-4 text-left shadow-card space-y-3 relative overflow-hidden"
              >
                {/* Visual Accent Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-forest via-burnt to-emerald-500" />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono font-bold text-forest bg-sage/60 px-2.5 py-1 rounded-md">
                    ID: {createdComplaint.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Pending
                  </span>
                </div>

                {/* Photo Thumbnail */}
                {createdComplaint.photoUrl && (
                  <div className="relative h-32 rounded-xl overflow-hidden border border-sage">
                    <img
                      src={createdComplaint.photoUrl}
                      alt="Complaint Evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-charcoal/80 backdrop-blur-xs text-softwhite text-[10px] font-semibold px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[createdComplaint.category]}
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-forest font-semibold">
                    <MapPin size={13} className="text-burnt flex-shrink-0" />
                    <span className="line-clamp-1">{createdComplaint.address}</span>
                  </div>
                  {createdComplaint.description && (
                    <p className="text-[11px] text-charcoal-muted line-clamp-2">
                      "{createdComplaint.description}"
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Actions: Track Complaint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                onClick={handleTrackComplaint}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card hover:shadow-elevated transition-all"
              >
                <span>Track Complaint</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 bg-ivory hover:bg-sage/40 text-charcoal rounded-xl font-semibold text-xs border border-sage transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        ) : (
          /* ================================================================ */
          /* STATE B: CLEAN 1-SCREEN MOBILE-FIRST ISSUE REPORTING             */
          /* ================================================================ */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-burnt px-2.5 py-0.5 bg-peach rounded-full">
                Simple Civic Intake
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-forest mt-1">
                Report an Issue
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Take a photo, allow GPS, and tap submit.
              </p>
            </div>

            {/* STEP 1: PHOTOGRAPH CAPTURE & UPLOAD */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelected}
                className="hidden"
              />

              {!photoDataUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-sage hover:border-forest/60 bg-ivory hover:bg-sage/20 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest group-hover:scale-105 flex items-center justify-center transition-transform">
                    <Camera size={24} className="text-forest" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-forest">Take a Photo / Upload</span>
                    <p className="text-[10px] text-charcoal-muted">Tap to open camera or browse gallery</p>
                  </div>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-forest/30 bg-charcoal shadow-card">
                  {/* Image Preview with Camera Frame */}
                  <img
                    src={photoDataUrl}
                    alt="Captured issue"
                    className="w-full h-44 object-cover"
                  />

                  {/* Scanning Animation line during image classification */}
                  {isScanningImage && (
                    <motion.div
                      initial={{ y: 0 }}
                      animate={{ y: 170 }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-burnt to-transparent shadow-[0_0_12px_rgba(224,91,45,0.9)] z-10"
                    />
                  )}

                  {/* Top Bar on Preview */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20">
                    <div className="bg-charcoal/80 backdrop-blur-xs text-softwhite px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
                      {isScanningImage ? (
                        <>
                          <RotateCw size={11} className="animate-spin text-burnt" />
                          <span>Scanning photo...</span>
                        </>
                      ) : detectedCategoryLabel ? (
                        <>
                          <Sparkles size={11} className="text-amber-400" />
                          <span>Identified: {detectedCategoryLabel}</span>
                        </>
                      ) : (
                        <span>Photo Attached</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-charcoal/80 hover:bg-charcoal text-softwhite px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: AUTOMATIC GPS LOCATION CONFIRMATION */}
            <div className="bg-ivory rounded-2xl p-3.5 border border-sage space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-forest">
                  <Navigation size={14} className={isLocatingGps ? 'animate-spin text-burnt' : 'text-burnt'} />
                  <span>Location</span>
                </div>

                {!gpsConfirmed && !isLocatingGps && (
                  <button
                    type="button"
                    onClick={requestDeviceLocation}
                    className="text-[11px] font-bold text-burnt hover:underline"
                  >
                    Detect GPS
                  </button>
                )}
              </div>

              {gpsConfirmed ? (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[11px] block">Location Detected ✓</span>
                    <p className="text-[11px] text-emerald-800 line-clamp-2 mt-0.5">{address}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualLocation(!showManualLocation)}
                    className="text-[10px] font-semibold text-emerald-700 underline flex-shrink-0"
                  >
                    Adjust
                  </button>
                </div>
              ) : isLocatingGps ? (
                <div className="text-xs text-charcoal-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-burnt animate-ping" />
                  <span>Requesting device GPS coordinates...</span>
                </div>
              ) : (
                <div className="text-xs text-charcoal-muted">
                  <p className="text-[11px]">Tap "Detect GPS" or enter location below.</p>
                </div>
              )}

              {/* Manual fallback if GPS unavailable or citizen wants to adjust */}
              {showManualLocation && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street, landmark, or area"
                    className="w-full px-3 py-2 bg-softwhite rounded-xl border border-sage text-xs text-charcoal focus:outline-none focus:border-forest"
                  />
                </div>
              )}
            </div>

            {/* STEP 3: AUTOMATIC ISSUE CATEGORY (WITH 1-TAP SELECTOR) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-forest flex items-center justify-between">
                <span>Issue Category</span>
                {detectedCategoryLabel && (
                  <span className="text-[10px] font-normal text-charcoal-muted">
                    Auto-selected from photo
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-forest text-softwhite border-forest shadow-xs scale-[1.01]'
                          : 'bg-ivory hover:bg-sage/40 text-charcoal border-sage'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="line-clamp-1 leading-snug">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: OPTIONAL SHORT DESCRIPTION */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-forest">
                Add a little more detail <span className="font-normal text-charcoal-muted">(optional)</span>
              </label>
              <input
                type="text"
                value={optionalDetail}
                onChange={(e) => setOptionalDetail(e.target.value)}
                placeholder="e.g. Near main market gate (can leave blank)"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-xs text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            {/* Error Message Display */}
            {submitError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* STEP 5: SUBMIT COMPLAINT BUTTON */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card hover:shadow-elevated transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RotateCw size={15} className="animate-spin text-burnt" />
                  <span>Submitting to Municipal Ledger...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-burnt" />
                  <span>Submit Complaint</span>
                </>
              )}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
