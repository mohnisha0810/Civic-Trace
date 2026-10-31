import { Complaint, ComplaintCategory } from '../types';

export interface ResolutionEstimate {
  type: 'confirmed' | 'preliminary' | 'overdue' | 'resolved' | 'unavailable';
  displayText: string;
  targetDate?: string;
  basisText: string;
  isOverdue: boolean;
  hoursRemaining?: number;
  badgeColor: string;
}

// Category Standard Municipal Service Level Agreements (in hours)
export const CATEGORY_STANDARD_SLA: Record<ComplaintCategory, { hours: number; label: string }> = {
  road_damage: { hours: 48, label: 'Standard Road Maintenance SLA (48h)' },
  garbage_waste: { hours: 24, label: 'Rapid Sanitation Clearance SLA (24h)' },
  streetlight_electrical: { hours: 72, label: 'Electrical Grid Repair SLA (72h)' },
  water_supply: { hours: 36, label: 'Water Utility Emergency SLA (36h)' },
  drainage_sewage: { hours: 48, label: 'Public Drainage & Sewer SLA (48h)' },
  traffic_signals: { hours: 24, label: 'Traffic Safety & Signals SLA (24h)' },
  public_infrastructure: { hours: 72, label: 'Public Works Infrastructure SLA (72h)' },
  other: { hours: 72, label: 'General Civic Redressal SLA (72h)' },
};

/**
 * Calculates a reliable resolution estimate for a complaint
 * based on work order SLA deadlines, category standard targets, and current status.
 */
export function calculateResolutionEstimate(complaint: Complaint): ResolutionEstimate {
  // 1. If already resolved or verified
  if (complaint.status === 'resolved' || complaint.status === 'verified') {
    const resolvedEntry = complaint.history.find(
      (h) => h.stage === 'resolved' || h.stage === 'verified_resolution'
    );
    const resolvedAt = resolvedEntry ? new Date(resolvedEntry.timestamp) : new Date(complaint.updatedAt);
    const createdAt = new Date(complaint.createdAt);
    const totalHours = Math.max(1, Math.round((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)));

    return {
      type: 'resolved',
      displayText: `Resolved in ${totalHours} hours`,
      targetDate: resolvedAt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      basisText: 'Resolution verified with photographic proof and citizen consensus.',
      isOverdue: false,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  const now = new Date();

  // 2. Confirmed Work Order SLA from Department
  if (complaint.workOrder && complaint.workOrder.deadlineDate) {
    const deadline = new Date(complaint.workOrder.deadlineDate);
    const diffMs = deadline.getTime() - now.getTime();
    const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

    if (hoursRemaining < 0) {
      return {
        type: 'overdue',
        displayText: 'Expected resolution time has passed. Awaiting the next official update.',
        targetDate: deadline.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        basisText: `Work Order SLA (${complaint.workOrder.slaHours}h) assigned to ${complaint.workOrder.contractor || 'contractor'}.`,
        isOverdue: true,
        hoursRemaining,
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    }

    let timeText = `Within ${hoursRemaining} hours`;
    if (hoursRemaining > 48) {
      const days = Math.ceil(hoursRemaining / 24);
      timeText = `${days} working days (Target: ${deadline.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`;
    } else if (hoursRemaining <= 1) {
      timeText = 'Within 1 hour (Crew on-site)';
    }

    return {
      type: 'confirmed',
      displayText: `Estimated resolution: ${timeText}`,
      targetDate: deadline.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      basisText: `Confirmed dispatch: ${complaint.workOrder.department} · ${complaint.workOrder.contractor}`,
      isOverdue: false,
      hoursRemaining,
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    };
  }

  // 3. Preliminary estimate based on category SLA rules
  const slaRule = CATEGORY_STANDARD_SLA[complaint.category] || CATEGORY_STANDARD_SLA.other;
  const createdAt = new Date(complaint.createdAt);
  const preliminaryDeadline = new Date(createdAt.getTime() + slaRule.hours * 60 * 60 * 1000);
  const diffMs = preliminaryDeadline.getTime() - now.getTime();
  const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

  if (hoursRemaining < 0) {
    return {
      type: 'overdue',
      displayText: 'Standard service window exceeded. Priority escalated.',
      targetDate: preliminaryDeadline.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      basisText: `Exceeded standard ${slaRule.hours}h municipal intake benchmark.`,
      isOverdue: true,
      hoursRemaining,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }

  const days = Math.ceil(slaRule.hours / 24);
  return {
    type: 'preliminary',
    displayText: `Preliminary estimate: Within ${days === 1 ? '24 hours' : `${days} working days`}`,
    targetDate: preliminaryDeadline.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    basisText: `${slaRule.label} (subject to department work order dispatch).`,
    isOverdue: false,
    hoursRemaining,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
  };
}
