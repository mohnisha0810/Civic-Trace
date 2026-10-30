import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Camera,
  MapPin,
  Cpu,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Complaint } from '../../types';

interface BehindTheResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComplaint: Complaint | null;
}

export const BehindTheResolutionModal: React.FC<BehindTheResolutionModalProps> = ({
  isOpen,
  onClose,
  selectedComplaint,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const isRealComplaint = !!selectedComplaint;

  // The 5-stage architectural walkthrough
  const steps = [
    {
      title: '1. Geotagged Intake & Spatial Deduplication',
      subtitle: 'Capturing Ground Truth Evidence',
      icon: Camera,
      color: 'bg-forest text-softwhite',
      badge: isRealComplaint ? `Real Record: #${selectedComplaint.id}` : 'Educational Walkthrough',
      description: isRealComplaint
        ? `Registered at ${selectedComplaint.address} (${selectedComplaint.latitude.toFixed(4)}°, ${selectedComplaint.longitude.toFixed(4)}°) with photographic evidence. Checked against 50m spatial radar.`
        : 'A citizen spots an infrastructure defect (e.g., deep pothole, exposed wire) and captures a photo with browser GPS coordinates. CivicTrace instantly checks a 50-meter Haversine radius to catch redundant duplicates.',
      technicalNote:
        'Haversine spherical distance calculation: d = 2R · arcsin(√(sin²(Δφ/2) + cos(φ₁)cos(φ₂)sin²(Δλ/2))). If d ≤ 50m and category matches, Duplicate Shield converts submission to a +1 upvote.',
    },
    {
      title: '2. Explainable Dynamic Priority Scoring (EDPS)',
      subtitle: 'Removing Bureaucratic Bias with Mathematics',
      icon: Cpu,
      color: 'bg-burnt text-softwhite',
      badge: isRealComplaint ? `Computed Score: ${selectedComplaint.edpsScore}/100` : 'Algorithmic Engine',
      description: isRealComplaint
        ? selectedComplaint.edpsExplanation
        : 'Rather than first-come-first-served, CivicTrace computes an objective mathematical score out of 100 based on Visual Hazard depth, Proximity Kernel to schools/hospitals, Crowd Velocity upvotes, and Ward Equity balance.',
      technicalNote:
        'Mathematical formulation: EDPS = 0.30·VH + 0.25·ZW + 0.20·CV + 0.15·EQ + 0.10·SLA. High-velocity cluster grievances automatically jump the municipal queue.',
    },
    {
      title: '3. Enforceable Contractor Work Order Dispatch',
      subtitle: 'Binding Legal SLA & Field Unit Allocation',
      icon: Wrench,
      color: 'bg-amber-700 text-softwhite',
      badge: isRealComplaint && selectedComplaint.workOrder
        ? `Contract: ${selectedComplaint.workOrder.id}`
        : 'Operations Governance',
      description: isRealComplaint && selectedComplaint.workOrder
        ? `Work order ${selectedComplaint.workOrder.id} issued to ${selectedComplaint.workOrder.contractor} (${selectedComplaint.workOrder.crew}). Target SLA: ${selectedComplaint.workOrder.slaHours} hours.`
        : 'The responsible municipal department (e.g., PWD, Water Board) issues a binding digital work order with strict SLA target deadlines (e.g. 24h, 48h, 72h). If overdue, the ticket triggers supervisory escalation.',
      technicalNote:
        'Contractual binding: Tracks contractor ID, crew dispatch, and exact completion deadlines with real-time countdown timers.',
    },
    {
      title: '4. Physical Remediation & GPS Geofence Proof',
      subtitle: 'Proof-of-Fix Verification Gate (≤ 25m)',
      icon: MapPin,
      color: 'bg-emerald-700 text-softwhite',
      badge: isRealComplaint && selectedComplaint.resolutionProof
        ? `GPS Deviation: ${selectedComplaint.resolutionProof.geofenceDistanceMeters}m`
        : 'Geofence Verification',
      description: isRealComplaint && selectedComplaint.resolutionProof
        ? `Contractor uploaded physical proof. Verified within ${selectedComplaint.resolutionProof.geofenceDistanceMeters}m of original defect.`
        : 'Upon physical completion, the contractor must take a geotagged photo on site. The system calculates the distance between intake coordinates and completion coordinates. If the distance exceeds 25 meters, the proof is rejected as invalid.',
      technicalNote:
        'Geofence rule: Distance ≤ 25m. Eliminates "Ghost Resolutions" where contractors mark tickets resolved from remote offices.',
    },
    {
      title: '5. 24-Hour Democratic Community Consensus',
      subtitle: 'Permanent Cryptographic Ledger Sealing',
      icon: ShieldCheck,
      color: 'bg-forest text-softwhite',
      badge: isRealComplaint && selectedComplaint.verificationGate
        ? `${selectedComplaint.verificationGate.consensusPercentage}% Community Approval`
        : 'Cryptographic Closure',
      description: isRealComplaint
        ? `Status: ${selectedComplaint.status.toUpperCase().replace(/_/g, ' ')}. 2-vote dispute threshold guarantees automatic reopening if repairs fail inspection.`
        : 'Local neighbors receive an inspection vote: "Fixed", "Still Broken", or "Partially Fixed". If 2 or more citizens flag it as Still Broken, the complaint auto-reopens at Priority 95. If approved, it is sealed with an immutable SHA-256 hash.',
      technicalNote:
        'SHA-256 hash links timestamp, actor role, before/after coordinates, and consensus outcome into an append-only audit trail.',
    },
  ];

  const current = steps[activeStep];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-forest/80 backdrop-blur-md flex items-center justify-center p-4 text-xs animate-in fade-in duration-200">
      <div className="bg-softwhite rounded-3xl max-w-2xl w-full border border-sage shadow-elevated p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-sage/60 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-peach text-burnt flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-forest text-sm sm:text-base">
                  Behind the Resolution
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sage text-forest">
                  Step {activeStep + 1} of 5
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {isRealComplaint
                  ? `Analyzing live audit events for Complaint #${selectedComplaint.id}`
                  : 'Educational illustration of the CivicTrace closed-loop architecture'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-muted hover:text-forest hover:bg-sage/40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Visual Indicator */}
        <div className="grid grid-cols-5 gap-1.5">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeStep
                  ? 'bg-burnt'
                  : idx < activeStep
                  ? 'bg-forest'
                  : 'bg-sage'
              }`}
            />
          ))}
        </div>

        {/* Step Body Card */}
        <div className="bg-ivory rounded-2xl p-5 border border-sage shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl ${current.color} flex items-center justify-center shadow-xs`}>
                <Icon size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-forest text-sm">{current.title}</h4>
                <div className="text-[11px] text-charcoal-muted">{current.subtitle}</div>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-burnt px-2 py-0.5 bg-peach rounded-md">
              {current.badge}
            </span>
          </div>

          <p className="text-xs text-charcoal leading-relaxed">{current.description}</p>

          <div className="p-3 bg-softwhite rounded-xl border border-sage/80 text-[11px] space-y-1">
            <span className="font-bold text-forest flex items-center gap-1">
              <Info size={12} className="text-burnt" />
              <span>Architectural Logic & Guardrails:</span>
            </span>
            <p className="font-mono text-charcoal-muted leading-relaxed">{current.technicalNote}</p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 bg-ivory hover:bg-sage/40 disabled:opacity-40 border border-sage text-forest rounded-xl font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Previous Step</span>
          </button>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep(activeStep + 1)}
              className="px-5 py-2 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold flex items-center gap-1.5 shadow-card transition-all"
            >
              <span>Next Architecture Stage</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-softwhite rounded-xl font-bold flex items-center gap-1.5 shadow-card transition-all"
            >
              <span>Finish Walkthrough</span>
              <CheckCircle2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
