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
  FileText,
  Scan,
  ShieldAlert,
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

  // 1. Photo state & drag-and-drop
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
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
  const [showManualLocation, setShowManualLocation] = useState<boolean>(false);

  // 3. Category & Description
  const [category, setCategory] = useState<ComplaintCategory>('road_damage');
  const [optionalDetail, setOptionalDetail] = useState<string>('');

  // 4. Submission & Signature Transformation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [signatureStep, setSignatureStep] = useState<'form' | 'morphing' | 'card_ready'>('form');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state upon opening
  useEffect(() => {
    if (isOpen) {
      setPhotoDataUrl('');
      setIsDragOver(false);
      setIsScanningImage(false);
      setDetectedCategoryLabel(null);
      setLatitude(null);
      setLongitude(null);
      setAddress('');
      setIsLocatingGps(false);
      setGpsConfirmed(false);
      setShowManualLocation(false);
      setCategory('road_damage');
      setOptionalDetail('');
      setIsSubmitting(false);
      setSubmitError(null);
      setCreatedComplaint(null);
      setSignatureStep('form');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Request browser GPS coordinates and reverse-geocode to human-readable address
  const requestDeviceLocation = () => {
    setIsLocatingGps(true);
    setGpsConfirmed(false);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsLocatingGps(false);
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
        } catch {
          const fallback = `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setAddress(fallback);
          setGpsConfirmed(true);
        } finally {
          setIsLocatingGps(false);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsConfirmed(false);
        setShowManualLocation(true);
      },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  // Process chosen or dropped image
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please provide a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setSubmitError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setPhotoDataUrl(dataUrl);

        // Auto-detect GPS if not yet confirmed
        if (!gpsConfirmed && !isLocatingGps) {
          requestDeviceLocation();
        }

        // Run client-side visual classification with scanning animation
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
          }, 700);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
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
      // Step 1: Save complaint to persistent database
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
      }, 750);
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
    <div className="fixed inset-0 bg-forest/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="bg-softwhite rounded-3xl max-w-lg w-full border border-sage shadow-elevated overflow-hidden p-6 sm:p-7 relative my-6"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-charcoal-muted hover:text-forest hover:bg-sage/40 transition-colors z-20"
          title="Close modal"
        >
          <X size={18} />
        </button>

        {/* ================================================================== */}
        {/* SIGNATURE ANIMATION STAGE 1: MORPHING TRANSITION                   */}
        {/* ================================================================== */}
        {signatureStep === 'morphing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <motion.div
              animate={{
                scale: [1, 1.08, 0.96, 1],
                rotate: [0, -2, 2, 0],
              }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-burnt shadow-elevated relative"
            >
              <img
                src={photoDataUrl}
                alt="Morphing Issue"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 to-transparent flex items-end justify-center p-2">
                <span className="text-[10px] font-bold text-softwhite">Encoding Ledger...</span>
              </div>
            </motion.div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-forest">Transforming to Digital Record</h3>
              <p className="text-xs text-charcoal-muted">Assigning cryptographic tracking identifier & EDPS score</p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* SIGNATURE ANIMATION STAGE 2: DIGITAL COMPLAINT TRACKING CARD READY */}
        {/* ================================================================== */}
        {createdComplaint && signatureStep === 'card_ready' && (
          <div className="text-center py-2 space-y-5">
            {/* Signature Fly-In Digital Card Container */}
            <motion.div
              initial={{ scale: 0.82, y: 28, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 22, stiffness: 240 }}
              className="relative max-w-sm mx-auto"
            >
              {/* Top Stamp / Badge with Pop Animation */}
              <motion.div
                initial={{ scale: 2.2, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 350, damping: 22 }}
                className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-card mb-2.5"
              >
                <CheckCircle2 size={32} />
              </motion.div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-burnt px-3 py-1 bg-peach rounded-full">
                Complaint Registered In Ledger
              </span>

              <h2 className="text-2xl font-extrabold text-forest mt-2">
                Tracking Card Issued
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Your photograph has transformed into a structured, trackable civic record.
              </p>

              {/* Digital Card Surface (Morphed from Photo) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 bg-ivory rounded-2xl border-2 border-forest/20 p-4 text-left shadow-card space-y-3 relative overflow-hidden"
              >
                {/* Visual Accent Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-forest via-burnt to-emerald-500" />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono font-extrabold text-forest bg-sage/70 px-2.5 py-1 rounded-md">
                    ID: {createdComplaint.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Stage 1: Pending Triage
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
                    <div className="absolute bottom-2 left-2 bg-charcoal/85 backdrop-blur-xs text-softwhite text-[10px] font-semibold px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[createdComplaint.category]}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 text-xs">
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

                {/* Connected Visual Path Graphic */}
                <div className="pt-2 border-t border-sage/60 flex items-center justify-between text-[10px] text-charcoal-muted">
                  <span className="flex items-center gap-1 text-forest font-bold">
                    <span className="w-2 h-2 rounded-full bg-burnt animate-pulse" />
                    Priority Score: {createdComplaint.edpsScore}
                  </span>
                  <span>En route to field dispatch</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Actions: Track Complaint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                onClick={handleTrackComplaint}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card hover:shadow-elevated transition-all"
              >
                <span>Track My Complaint</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 bg-ivory hover:bg-sage/40 text-charcoal rounded-xl font-semibold text-xs border border-sage transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}

        {/* ================================================================== */}
        {/* NORMAL INTAKE FORM: PHOTO, INSPECTION, LOCATION, AND CATEGORY       */}
        {/* ================================================================== */}
        {signatureStep === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-burnt px-2.5 py-0.5 bg-peach rounded-full">
                Simple Civic Intake
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-forest mt-1">
                Report a Civic Issue
              </h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Capture the problem, verify location, and submit to municipal ledger.
              </p>
            </div>

            {/* STEP 1: PHOTOGRAPH CAPTURE & UPLOAD WITH DRAG-AND-DROP */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!photoDataUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group ${
                    isDragOver
                      ? 'border-burnt bg-peach/40 scale-[1.01]'
                      : 'border-sage hover:border-forest/60 bg-ivory hover:bg-sage/20'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center transition-colors"
                  >
                    <Camera size={24} className="text-forest" />
                  </motion.div>
                  <div className="text-center px-4">
                    <span className="text-xs font-bold text-forest">
                      {isDragOver ? 'Drop photograph to upload' : 'Take a Photo or Drag & Drop'}
                    </span>
                    <p className="text-[10px] text-charcoal-muted mt-0.5">
                      Supports direct camera capture or photo gallery
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="relative rounded-2xl overflow-hidden border border-forest/30 bg-charcoal shadow-card"
                >
                  {/* Image Preview */}
                  <img
                    src={photoDataUrl}
                    alt="Captured issue preview"
                    className="w-full h-44 object-cover"
                  />

                  {/* Corner Inspection Reticles */}
                  {isScanningImage && (
                    <div className="absolute inset-2 pointer-events-none z-10 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <span className="w-3.5 h-3.5 border-t-2 border-l-2 border-burnt" />
                        <span className="w-3.5 h-3.5 border-t-2 border-r-2 border-burnt" />
                      </div>
                      <div className="flex justify-between">
                        <span className="w-3.5 h-3.5 border-b-2 border-l-2 border-burnt" />
                        <span className="w-3.5 h-3.5 border-b-2 border-r-2 border-burnt" />
                      </div>
                    </div>
                  )}

                  {/* Thin Scanning Line during visual issue inspection */}
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
                    <div className="bg-charcoal/85 backdrop-blur-xs text-softwhite px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 shadow-xs">
                      {isScanningImage ? (
                        <>
                          <RotateCw size={11} className="animate-spin text-burnt" />
                          <span>Analyzing visual issue...</span>
                        </>
                      ) : detectedCategoryLabel ? (
                        <>
                          <Sparkles size={11} className="text-amber-400" />
                          <span>Detected: {detectedCategoryLabel}</span>
                        </>
                      ) : (
                        <span>Photograph Attached</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-charcoal/85 hover:bg-charcoal text-softwhite px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* STEP 2: AUTOMATIC GPS LOCATION & CONNECTED PATH */}
            <div className="relative">
              {/* Subtle Connected Line linking photo to location when photo is present */}
              {photoDataUrl && (
                <div className="absolute -top-3 left-6 w-0.5 h-3 bg-sage border-l border-dashed border-forest/30 z-0" />
              )}

              <div className="bg-ivory rounded-2xl p-3.5 border border-sage space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-forest">
                    <Navigation
                      size={14}
                      className={isLocatingGps ? 'animate-spin text-burnt' : 'text-burnt'}
                    />
                    <span>Location Coordinates</span>
                  </div>

                  {!gpsConfirmed && !isLocatingGps && (
                    <button
                      type="button"
                      onClick={requestDeviceLocation}
                      className="text-[11px] font-bold text-burnt hover:underline"
                    >
                      Acquire GPS
                    </button>
                  )}
                </div>

                {gpsConfirmed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900"
                  >
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[11px] block">Location Confirmed ✓</span>
                      <p className="text-[11px] text-emerald-800 line-clamp-2 mt-0.5">{address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualLocation(!showManualLocation)}
                      className="text-[10px] font-semibold text-emerald-700 underline flex-shrink-0"
                    >
                      Adjust
                    </button>
                  </motion.div>
                ) : isLocatingGps ? (
                  <div className="text-xs text-charcoal-muted flex items-center gap-2 py-1">
                    <span className="w-2 h-2 rounded-full bg-burnt animate-ping" />
                    <span>Querying browser GPS sensor...</span>
                  </div>
                ) : (
                  <div className="text-xs text-charcoal-muted">
                    <p className="text-[11px]">Click "Acquire GPS" or type location manually.</p>
                  </div>
                )}

                {/* Manual fallback input */}
                {showManualLocation && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter street, landmark, or ward name"
                      className="w-full px-3 py-2 bg-softwhite rounded-xl border border-sage text-xs text-charcoal focus:outline-none focus:border-forest"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: ISSUE CATEGORY SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-forest flex items-center justify-between">
                <span>Issue Category</span>
                {detectedCategoryLabel && (
                  <span className="text-[10px] font-normal text-charcoal-muted">
                    Auto-selected from image inspection
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
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs font-semibold transition-all duration-150 ${
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

            {/* STEP 4: OPTIONAL SHORT NOTE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-forest">
                Additional Note <span className="font-normal text-charcoal-muted">(optional)</span>
              </label>
              <input
                type="text"
                value={optionalDetail}
                onChange={(e) => setOptionalDetail(e.target.value)}
                placeholder="e.g. Near bus stop, dangerous after sunset"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-xs text-charcoal focus:outline-none focus:border-forest transition-colors"
              />
            </div>

            {/* Error Message Display */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs"
              >
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{submitError}</span>
              </motion.div>
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
