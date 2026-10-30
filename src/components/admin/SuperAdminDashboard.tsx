import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Building,
  UserCheck,
  FileText,
  BarChart3,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Clock,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCivicData } from '../../context/CivicDataContext';
import { getAllAuditLogs } from '../../lib/db';
import { User, GovernmentVerificationStatus } from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const {
    currentUser,
    allUsers,
    approveGovernmentApplicant,
    rejectGovernmentApplicant,
    requestMoreInfoGovernmentApplicant,
    refreshUsers,
  } = useAuth();

  const { complaints, reopenComplaint, setSelectedComplaintId, setActiveTab } = useCivicData();

  const [activeSection, setActiveSection] = useState<
    'verification' | 'complaints' | 'users' | 'analytics' | 'audit'
  >('verification');

  // Modals / Action drawers
  const [selectedApplicant, setSelectedApplicant] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [infoRequestText, setInfoRequestText] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [celebrationUserId, setCelebrationUserId] = useState<string | null>(null);

  // Filter government applicants
  const pendingApplicants = allUsers.filter(
    u => (u.role === 'government' || u.role === 'official') &&
      u.governmentProfile?.verificationStatus === 'pending_verification'
  );

  const allGovUsers = allUsers.filter(
    u => (u.role === 'government' || u.role === 'official') && u.governmentProfile
  );

  // Real Analytics calculations
  const totalComplaints = complaints.length;
  const verifiedComplaints = complaints.filter(c => c.status === 'verified').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in_progress').length;
  const disputedComplaints = complaints.filter(c => c.status === 'reopened' || c.status === 'disputed').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((verifiedComplaints / totalComplaints) * 100) : 0;

  // Real Audit logs
  const auditLogs = getAllAuditLogs();

  const handleApprove = (userId: string) => {
    const ok = approveGovernmentApplicant(userId, 'Official credentials confirmed by Super Admin Directorate.');
    if (ok) {
      setCelebrationUserId(userId);
      setActionNotice('Government Profile Successfully Approved & Verified!');
      setTimeout(() => setCelebrationUserId(null), 3000);
      setSelectedApplicant(null);
    }
  };

  const handleReject = (userId: string) => {
    if (!rejectReason.trim()) return;
    const ok = rejectGovernmentApplicant(userId, rejectReason.trim());
    if (ok) {
      setActionNotice('Government Profile Application Rejected.');
      setSelectedApplicant(null);
      setRejectReason('');
    }
  };

  const handleRequestInfo = (userId: string) => {
    if (!infoRequestText.trim()) return;
    const ok = requestMoreInfoGovernmentApplicant(userId, infoRequestText.trim());
    if (ok) {
      setActionNotice('Additional Verification Documents Requested from Applicant.');
      setSelectedApplicant(null);
      setInfoRequestText('');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-xs">
      {/* Super Admin Directorate Header */}
      <div className="bg-softwhite rounded-3xl p-6 sm:p-8 border border-sage shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-burnt px-2.5 py-0.5 bg-peach rounded-full">
              Highest Privilege Administration
            </span>
            <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              Directorate Command Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-forest mt-1.5">
            National Super Admin Command Center
          </h1>
          <p className="text-charcoal-muted mt-0.5">
            Authorized administrator: <span className="font-bold text-forest">{currentUser?.name}</span> ({currentUser?.identifier}). Managing national jurisdiction, government approvals, and platform integrity.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-ivory p-1.5 rounded-2xl border border-sage self-start sm:self-auto font-bold">
          <button
            onClick={() => setActiveSection('verification')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSection === 'verification'
                ? 'bg-forest text-softwhite shadow-card'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Gov Verification ({pendingApplicants.length})
          </button>
          <button
            onClick={() => setActiveSection('complaints')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSection === 'complaints'
                ? 'bg-forest text-softwhite shadow-card'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Complaint Oversight ({complaints.length})
          </button>
          <button
            onClick={() => setActiveSection('users')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSection === 'users'
                ? 'bg-forest text-softwhite shadow-card'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Users ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveSection('analytics')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSection === 'analytics'
                ? 'bg-forest text-softwhite shadow-card'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveSection('audit')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSection === 'audit'
                ? 'bg-forest text-softwhite shadow-card'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-sage border border-forest/30 rounded-2xl text-forest font-bold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1: GOVERNMENT PROFILE VERIFICATION                         */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'verification' && (
        <div className="bg-softwhite rounded-3xl border border-sage shadow-card overflow-hidden">
          <div className="p-5 border-b border-sage/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-forest">
                Government Officer Registration Requests
              </h2>
              <p className="text-charcoal-muted text-[11px]">
                Review official credentials, verify authority jurisdiction, and approve municipal operational privileges.
              </p>
            </div>
            <span className="font-mono font-bold text-burnt px-2.5 py-1 bg-peach rounded-xl">
              {pendingApplicants.length} Pending Review
            </span>
          </div>

          {allGovUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory border-b border-sage text-charcoal-muted font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Representative</th>
                    <th className="py-3 px-4">Organization & Type</th>
                    <th className="py-3 px-4">Jurisdiction</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage/60">
                  {allGovUsers.map(u => {
                    const profile = u.governmentProfile!;
                    const isPending = profile.verificationStatus === 'pending_verification';
                    const isApproved = profile.verificationStatus === 'approved';
                    const isRejected = profile.verificationStatus === 'rejected';

                    return (
                      <tr key={u.id} className="hover:bg-ivory/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-forest">{u.name}</div>
                          <div className="text-[11px] text-charcoal-muted">{u.identifier}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-charcoal">{profile.organizationName}</div>
                          <div className="text-[10px] text-charcoal-muted uppercase">
                            {profile.organizationType.replace(/_/g, ' ')}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-forest">
                            {profile.district}, {profile.state}
                          </div>
                          {profile.city && (
                            <div className="text-[10px] text-charcoal-muted">{profile.city}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-charcoal">{profile.department}</div>
                          <div className="text-[11px] text-charcoal-muted">{profile.designation}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-peach text-burnt animate-pulse'
                                : isRejected
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {profile.verificationStatus.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(u.id)}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-softwhite rounded-xl font-bold text-[11px] shadow-xs transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setSelectedApplicant(u)}
                                className="px-2.5 py-1.5 bg-ivory border border-sage text-charcoal rounded-xl font-semibold text-[11px] hover:bg-sage/40 transition-colors"
                              >
                                Review / Reject
                              </button>
                            </>
                          )}
                          {!isPending && (
                            <span className="text-[11px] text-charcoal-muted italic">
                              Reviewed: {profile.reviewedAt ? new Date(profile.reviewedAt).toLocaleDateString() : 'Active'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-charcoal-muted space-y-2">
              <Building size={24} className="text-burnt mx-auto" />
              <p>No government registration requests in queue.</p>
            </div>
          )}
        </div>
      )}

      {/* Review Modal for Selected Applicant */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-softwhite rounded-3xl max-w-md w-full border border-sage shadow-elevated p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-sage/60 pb-3">
              <h3 className="font-bold text-forest text-sm">
                Administrative Action: {selectedApplicant.name}
              </h3>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-1 text-charcoal-muted hover:text-forest"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-forest block mb-1">
                  Reason for Rejection (Recorded in Audit Ledger)
                </label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Official email domain does not match municipal directorate records."
                  className="w-full px-3 py-2 bg-ivory rounded-xl border border-sage text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleReject(selectedApplicant.id)}
                  className="mt-2 w-full py-2 bg-red-700 hover:bg-red-800 text-softwhite rounded-xl font-bold text-xs"
                >
                  Confirm Rejection
                </button>
              </div>

              <div className="pt-2 border-t border-sage/60">
                <label className="font-bold text-forest block mb-1">
                  Request Additional Documents / Information
                </label>
                <textarea
                  rows={2}
                  value={infoRequestText}
                  onChange={e => setInfoRequestText(e.target.value)}
                  placeholder="e.g. Please provide gazetted officer authorization certificate or department ID copy."
                  className="w-full px-3 py-2 bg-ivory rounded-xl border border-sage text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRequestInfo(selectedApplicant.id)}
                  className="mt-2 w-full py-2 bg-amber-700 hover:bg-amber-800 text-softwhite rounded-xl font-bold text-xs"
                >
                  Send Document Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2: COMPLAINT OVERSIGHT & ESCALATIONS                       */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'complaints' && (
        <div className="bg-softwhite rounded-3xl border border-sage shadow-card overflow-hidden">
          <div className="p-5 border-b border-sage/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-forest">National Complaint Oversight</h2>
              <p className="text-charcoal-muted text-[11px]">
                Monitor all recorded grievances across Indian administrative zones. Escalate overdue or disputed issues.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-forest">
              {complaints.length} Total Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-sage text-charcoal-muted font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Title & Location</th>
                  <th className="py-3 px-4">EDPS Priority</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4 text-right">Oversight Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/60">
                {complaints.map(c => (
                  <tr key={c.id} className="hover:bg-ivory/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest">#{c.id}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-forest truncate">{c.title}</div>
                      <div className="text-[11px] text-charcoal-muted truncate">
                        {c.address} ({c.state})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          c.edpsBand === 'critical'
                            ? 'bg-peach text-burnt'
                            : c.edpsBand === 'high'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-sage text-forest'
                        }`}
                      >
                        {c.edpsScore} ({c.edpsBand.toUpperCase()})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-charcoal">
                      {c.status.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.workOrder ? (
                        <span className="font-semibold text-forest">{c.workOrder.department}</span>
                      ) : (
                        <span className="text-burnt text-[11px] font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedComplaintId(c.id);
                          setActiveTab('track');
                        }}
                        className="px-2.5 py-1.5 bg-ivory border border-sage text-charcoal rounded-xl font-semibold text-[11px] hover:bg-sage/40 transition-colors"
                      >
                        Track Trail
                      </button>

                      {c.status !== 'verified' && (
                        <button
                          onClick={() =>
                            reopenComplaint(c.id, 'Administrative Directorate Escalation: Priority boosted to 95.')
                          }
                          className="px-2.5 py-1.5 bg-peach text-burnt border border-burnt/30 rounded-xl font-bold text-[11px] hover:bg-burnt hover:text-softwhite transition-all"
                        >
                          Escalate (P95)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3: USERS DIRECTORY                                         */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'users' && (
        <div className="bg-softwhite rounded-3xl border border-sage shadow-card overflow-hidden">
          <div className="p-5 border-b border-sage/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-forest">Registered Platform Accounts</h2>
              <p className="text-charcoal-muted text-[11px]">
                Citizens, Government Officers, and Supervisory Administrators.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-forest">
              {allUsers.length} Total Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-sage text-charcoal-muted font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Ward / Jurisdiction</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/60">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-ivory/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-forest">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-charcoal-muted">
                      {u.identifier}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sage text-forest">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal">{u.ward || 'General'}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4: PLATFORM ANALYTICS                                      */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-softwhite rounded-3xl border border-sage shadow-card">
              <span className="text-[10px] font-bold uppercase text-charcoal-muted">Total Complaints</span>
              <div className="text-2xl font-extrabold text-forest mt-1">{totalComplaints}</div>
              <span className="text-[10px] text-charcoal-muted">Across all Indian states</span>
            </div>

            <div className="p-5 bg-softwhite rounded-3xl border border-sage shadow-card">
              <span className="text-[10px] font-bold uppercase text-burnt">In Field Remediation</span>
              <div className="text-2xl font-extrabold text-burnt mt-1">{inProgressComplaints}</div>
              <span className="text-[10px] text-charcoal-muted">Under active work orders</span>
            </div>

            <div className="p-5 bg-softwhite rounded-3xl border border-sage shadow-card">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Verified Closed</span>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">{verifiedComplaints}</div>
              <span className="text-[10px] text-emerald-700 font-bold">{resolutionRate}% Resolution Rate</span>
            </div>

            <div className="p-5 bg-softwhite rounded-3xl border border-sage shadow-card">
              <span className="text-[10px] font-bold uppercase text-amber-900">Disputed / Escalated</span>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">{disputedComplaints}</div>
              <span className="text-[10px] text-amber-800 font-semibold">Community consensus flagged</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 5: IMMUTABLE AUDIT LOGS                                    */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'audit' && (
        <div className="bg-softwhite rounded-3xl border border-sage shadow-card overflow-hidden">
          <div className="p-5 border-b border-sage/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-forest">Administrative Audit Ledger</h2>
              <p className="text-charcoal-muted text-[11px]">
                Immutable, append-only record of administrative approvals, rejections, work orders, and escalations.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-burnt">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="divide-y divide-sage/60">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-ivory/50 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-forest">{log.actionType.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sage text-forest uppercase">
                      {log.actorRole}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal">{log.details}</p>
                  <div className="text-[11px] text-charcoal-muted flex items-center gap-2">
                    <span>Actor: {log.actorName}</span>
                    <span>•</span>
                    <span>Target: {log.targetType} ({log.targetId})</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-[10px] text-charcoal-muted">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
