import React from 'react';
import { ShieldCheck, FileCheck, Lock, Users, ArrowRight } from 'lucide-react';

interface AccountabilitySectionProps {
  onOpenReportModal: () => void;
  onOpenCivicLens: () => void;
}

export const AccountabilitySection: React.FC<AccountabilitySectionProps> = ({
  onOpenReportModal,
  onOpenCivicLens,
}) => {
  return (
    <section className="py-14 px-4 sm:px-8 border-t border-sage bg-softwhite/90">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-5">
          <span className="text-[11px] font-bold text-burnt uppercase tracking-wider px-3 py-1 bg-peach rounded-full">
            Transparent Governance
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-forest leading-tight">
            Accountability Is Not an Afterthought. It Is Baked Into Every Record.
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            In CivicTrace, no complaint can be silently deleted, re-routed without an audit trail, or closed by contractor fiat. Every transition generates an immutable cryptographic ledger entry.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-ivory rounded-2xl border border-sage space-y-1">
              <div className="font-bold text-forest text-sm flex items-center gap-1.5">
                <FileCheck size={16} className="text-burnt" />
                <span>Binding Work Orders</span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                Contractors are tied to legal SLA countdown timers and named field crews.
              </p>
            </div>

            <div className="p-4 bg-ivory rounded-2xl border border-sage space-y-1">
              <div className="font-bold text-forest text-sm flex items-center gap-1.5">
                <Users size={16} className="text-emerald-800" />
                <span>Citizen Consensus Gate</span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                Residents hold final veto power over contractor completion claims.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onOpenCivicLens}
              className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck size={14} className="text-burnt" />
              <span>Launch Civic Lens</span>
            </button>
          </div>
        </div>

        {/* Visual Proof Card Graphic */}
        <div className="lg:col-span-6 bg-ivory rounded-3xl p-6 sm:p-8 border-2 border-forest/20 shadow-card space-y-4 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-sage/60 pb-3">
            <span className="font-bold text-forest uppercase">Cryptographic Audit Ledger</span>
            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
              VERIFIED COMPLIANT
            </span>
          </div>

          <div className="space-y-2 text-[11px] text-charcoal leading-relaxed">
            <div className="p-2.5 bg-softwhite rounded-xl border border-sage flex items-start gap-2">
              <span className="text-burnt font-bold">01</span>
              <div>
                <strong>Intake Evidence:</strong> Photo + Device GPS Tagged
                <div className="text-[10px] text-charcoal-muted">Hash: 0x7fa2...8e11</div>
              </div>
            </div>

            <div className="p-2.5 bg-softwhite rounded-xl border border-sage flex items-start gap-2">
              <span className="text-burnt font-bold">02</span>
              <div>
                <strong>Priority Formulation:</strong> EDPS Score Computed
                <div className="text-[10px] text-charcoal-muted">VH: 85 | ZW: 70 | CV: 40 | EQ: 60</div>
              </div>
            </div>

            <div className="p-2.5 bg-softwhite rounded-xl border border-sage flex items-start gap-2">
              <span className="text-burnt font-bold">03</span>
              <div>
                <strong>Resolution Evidence:</strong> GPS Validated (Tolerance ≤ 25m)
                <div className="text-[10px] text-charcoal-muted">Deviation: 8.4 meters • PASS</div>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2 text-emerald-950">
              <span className="text-emerald-700 font-bold">04</span>
              <div>
                <strong>Community Consensus:</strong> 24h Consensus Passed
                <div className="text-[10px] text-emerald-800">Permanent Record Sealed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
