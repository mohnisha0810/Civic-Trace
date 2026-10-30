import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Lock,
  Compass,
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../../types';
import { formatShaBadge } from '../../lib/cryptoAuth';
import { LiquidGlass } from '../ui/liquid-glass';

interface CivicLensOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComplaint: Complaint | null;
  onOpenBehindTheResolution: () => void;
}

const STATUS_EXPLANATIONS: Record<
  string,
  { label: string; meaning: string; verificationLevel: string; color: string }
> = {
  submitted: {
    label: 'Reported / Intake',
    meaning: 'Complaint has been logged into the municipal ledger with intake photograph and GPS coordinates.',
    verificationLevel: 'Unverified Citizen Report',
    color: 'bg-sage text-forest',
  },
  verified_intake: {
    label: 'Intake Verified',
    meaning: 'Municipal triage team has reviewed the grievance and confirmed jurisdiction classification under EDPS.',
    verificationLevel: 'Departmental Triage Validated',
    color: 'bg-sage text-forest',
  },
  assigned: {
    label: 'Work Order Dispatched',
    meaning: 'Binding work order generated for a certified field contractor with enforceable SLA deadline.',
    verificationLevel: 'Contractual Commitment Issued',
    color: 'bg-amber-100 text-amber-900',
  },
  in_progress: {
    label: 'Field Work In Progress',
    meaning: 'Remediation crew is actively on site conducting physical repairs.',
    verificationLevel: 'Physical Work Underway',
    color: 'bg-burnt text-softwhite',
  },
  resolved: {
    label: 'Resolution Proof Uploaded',
    meaning:
      'Contractor has finished work and uploaded after-photos. IMPORTANT: This is a completion claim, NOT yet an independently verified closure.',
    verificationLevel: 'Contractor Claim (Awaiting Community Consensus)',
    color: 'bg-peach text-burnt',
  },
  awaiting_verification: {
    label: '24-Hour Community Consensus Gate',
    meaning:
      'Neighbors and local residents inspect physical work and vote whether the defect is genuinely repaired.',
    verificationLevel: 'Active Community Audit (Democratic Consensus)',
    color: 'bg-amber-50 border border-amber-300 text-amber-900',
  },
  verified: {
    label: 'Verified Resolution',
    meaning:
      'Permanent closure achieved! Community consensus confirmed physical remediation or municipal lead engineer officially audited the fix.',
    verificationLevel: 'Permanently Sealed & Cryptographically Audited',
    color: 'bg-emerald-100 text-emerald-800',
  },
  reopened: {
    label: 'Disputed / Reopened',
    meaning:
      '2 or more citizens flagged the resolution as "Still Broken". Complaint automatically escalated to Priority 95.',
    verificationLevel: 'Escalated Quality Dispute',
    color: 'bg-red-100 text-red-800',
  },
};

export const CivicLensOverlay: React.FC<CivicLensOverlayProps> = ({
  isOpen,
  onClose,
  selectedComplaint,
  onOpenBehindTheResolution,
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      // 'B' key shortcut for Behind the Resolution
      if ((e.key === 'b' || e.key === 'B') && isOpen) {
        const activeEl = document.activeElement;
        const isInput =
          activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
        if (!isInput) {
          onOpenBehindTheResolution();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onOpenBehindTheResolution]);

  if (!isOpen) return null;

  const currentStatusInfo = selectedComplaint
    ? STATUS_EXPLANATIONS[selectedComplaint.status] || STATUS_EXPLANATIONS.submitted
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-forest/80 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200 text-xs overflow-y-auto">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between border-b border-softwhite/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-burnt text-softwhite flex items-center justify-center shadow-card">
            <Compass size={20} className="animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-softwhite">
                Civic Lens Mode
              </h2>
              <LiquidGlass
                radius={999}
                scale={20}
                aberration={6}
                bevelDepth={12}
                frost={0.2}
                tint={0.15}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-peach/80 text-burnt border border-burnt/30"
              >
                Focused Transparency View
              </LiquidGlass>
            </div>
            <p className="text-[11px] text-pale text-sage">
              Inspecting civic accountability, verification criteria, and evidence validation. Press{' '}
              <kbd className="px-1.5 py-0.5 bg-softwhite/20 text-softwhite rounded font-mono text-[10px]">
                Esc
              </kbd>{' '}
              to exit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Behind the Resolution trigger button */}
          <button
            onClick={onOpenBehindTheResolution}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-burnt hover:bg-burnt-hover text-softwhite rounded-xl font-bold transition-all shadow-card"
            title="Press 'B' key or click to launch walkthrough"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Behind the Resolution</span>
            <kbd className="hidden sm:inline px-1 py-0.2 bg-black/20 rounded font-mono text-[9px]">
              B
            </kbd>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-softwhite/80 hover:text-softwhite hover:bg-softwhite/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Focus Area */}
      <div className="max-w-7xl mx-auto w-full my-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Critical Distinction & Status Meaning Guide */}
        <div className="lg:col-span-5 bg-softwhite/95 rounded-3xl p-6 border border-sage shadow-elevated space-y-5 text-charcoal">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-burnt">
              Core Civic Guarantee
            </span>
            <h3 className="text-base font-extrabold text-forest mt-0.5">
              Completed Work vs. Verified Resolution
            </h3>
            <p className="text-charcoal-muted mt-1 leading-relaxed">
              Traditional complaint portals mark complaints "Resolved" as soon as a contractor
              submits an internal ticket. CivicTrace strictly bifurcates this into two distinct
              gates:
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-ivory rounded-2xl border border-sage space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-burnt">
                <Clock size={14} />
                <span>Stage 1: Work Completion Claim</span>
              </div>
              <p className="text-[11px] text-charcoal-muted leading-relaxed">
                The field crew finishes work and uploads photographic proof. Coordinates are validated
                against a strict 25-meter GPS geofence. The status moves to <em>Awaiting Verification</em>.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 size={14} />
                <span>Stage 2: Verified Resolution (Permanent Seal)</span>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                A 24-hour community consensus gate allows local neighbors to vote. Only if consensus
                passes (or lead municipal engineer executes audited sign-off) is the ticket sealed with
                an immutable SHA-256 ledger digest.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-sage/60">
            <h4 className="font-bold text-forest mb-2">Platform Status Glossary:</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {Object.entries(STATUS_EXPLANATIONS).map(([key, val]) => (
                <div key={key} className="p-2.5 bg-ivory/60 rounded-xl border border-sage/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest">{val.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${val.color}`}>
                      {val.verificationLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-muted mt-1">{val.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Complaint Under the Lens */}
        <div className="lg:col-span-7 bg-softwhite/95 rounded-3xl p-6 border border-sage shadow-elevated space-y-5 text-charcoal">
          {selectedComplaint ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sage/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-forest px-3 py-1 bg-ivory rounded-xl border border-sage">
                    #{selectedComplaint.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      currentStatusInfo?.color || 'bg-sage text-forest'
                    }`}
                  >
                    {currentStatusInfo?.label}
                  </span>
                </div>
                <div className="font-mono text-burnt font-bold">
                  Priority Score: {selectedComplaint.edpsScore}/100 ({selectedComplaint.edpsBand.toUpperCase()})
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-forest">{selectedComplaint.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-charcoal-muted mt-1">
                  <MapPin size={13} className="text-forest flex-shrink-0" />
                  <span>
                    {selectedComplaint.address} ({selectedComplaint.district}, {selectedComplaint.state})
                  </span>
                </div>
              </div>

              {/* Photos Under the Lens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-charcoal-muted">
                    Intake Evidence
                  </span>
                  <div className="h-40 rounded-xl overflow-hidden border border-sage bg-ivory">
                    {selectedComplaint.photoUrl ? (
                      <img
                        src={selectedComplaint.photoUrl}
                        alt="Intake"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-charcoal-muted text-[11px]">
                        No photograph attached
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-800">
                    Resolution Proof (GPS Validated)
                  </span>
                  <div className="h-40 rounded-xl overflow-hidden border border-emerald-300 bg-ivory">
                    {selectedComplaint.resolutionProof?.afterPhotoUrl ? (
                      <img
                        src={selectedComplaint.resolutionProof.afterPhotoUrl}
                        alt="Resolution"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-charcoal-muted text-[11px] p-4 text-center">
                        <Lock size={16} className="mb-1 text-charcoal-muted" />
                        <span>Awaiting contractor proof upload</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Verification Gate Status */}
              {selectedComplaint.verificationGate && (
                <div className="p-3.5 bg-ivory rounded-2xl border border-sage space-y-2">
                  <div className="flex items-center justify-between font-bold text-forest">
                    <span>24h Community Consensus Audit:</span>
                    <span className="font-mono text-burnt">
                      {selectedComplaint.verificationGate.consensusPercentage}% Approval (
                      {selectedComplaint.verificationGate.totalVotes} Votes)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-sage overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${selectedComplaint.verificationGate.consensusPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Explainable EDPS Audit */}
              <div className="p-3.5 bg-ivory rounded-2xl border border-sage text-[11px] space-y-1">
                <span className="font-bold text-forest">EDPS Priority Breakdown:</span>
                <p className="text-charcoal-muted leading-relaxed">
                  {selectedComplaint.edpsExplanation}
                </p>
              </div>

              {/* Cryptographic SHA-256 Digest Badge */}
              <div className="flex items-center justify-between text-[11px] text-charcoal-muted pt-2 border-t border-sage/60 font-mono">
                <span>Latest Ledger Seal:</span>
                <span className="bg-ivory px-2.5 py-0.5 rounded border border-sage text-forest font-bold">
                  {formatShaBadge(
                    selectedComplaint.history[selectedComplaint.history.length - 1]?.hash ||
                      '0xCIVICTRACE'
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Compass size={32} className="text-burnt mx-auto" />
              <h4 className="text-sm font-bold text-forest">No Specific Complaint Selected</h4>
              <p className="text-xs text-charcoal-muted max-w-md">
                Select any complaint marker on the map or enter a Complaint ID to inspect its
                detailed transparency trail through the Civic Lens.
              </p>
              <button
                onClick={onOpenBehindTheResolution}
                className="px-4 py-2 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold shadow-card transition-all"
              >
                Launch "Behind the Resolution" Walkthrough
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Tip */}
      <div className="max-w-7xl mx-auto w-full pt-3 border-t border-softwhite/20 text-center text-[11px] text-sage">
        Civic Lens protects public transparency. No personal identity records, passwords, or
        confidential internal directives are accessible through this view.
      </div>
    </div>
  );
};
