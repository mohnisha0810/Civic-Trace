import React, { useState } from 'react';
import {
  FileText,
  MapPin,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Bell,
  ThumbsUp,
  Filter,
  Eye,
  Check,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../../lib/db';
import { ComplaintStatus } from '../../types';

interface MyComplaintsViewProps {
  onOpenReportModal: () => void;
}

export const MyComplaintsView: React.FC<MyComplaintsViewProps> = ({ onOpenReportModal }) => {
  const { complaints, setActiveTab, setSelectedComplaintId } = useCivicData();
  const { currentUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'in_progress' | 'resolved'>('all');

  const userComplaints = complaints.filter(
    c => c.reportedByUserId === currentUser?.id || c.reportedByIdentifier === currentUser?.identifier
  );

  const notifications = currentUser ? getUserNotifications(currentUser.id) : [];

  // Metrics
  const totalCount = userComplaints.length;
  const inProgressCount = userComplaints.filter(c => c.status === 'in_progress' || c.status === 'assigned').length;
  const verifiedCount = userComplaints.filter(c => c.status === 'verified').length;
  const totalUpvotes = userComplaints.reduce((acc, c) => acc + (c.upvotes || 0), 0);

  // Filtered List
  const filteredComplaints = userComplaints.filter(c => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return c.status === 'submitted' || c.status === 'verified_intake';
    if (statusFilter === 'in_progress') return c.status === 'assigned' || c.status === 'in_progress';
    if (statusFilter === 'resolved') return c.status === 'resolved' || c.status === 'verified';
    return true;
  });

  const getStageNumber = (status: ComplaintStatus): number => {
    switch (status) {
      case 'submitted': return 1;
      case 'verified_intake': return 2;
      case 'assigned': return 3;
      case 'in_progress': return 4;
      case 'resolved':
      case 'awaiting_verification': return 5;
      case 'verified': return 6;
      default: return 1;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Citizen Header Banner */}
      <div className="bg-softwhite rounded-3xl p-6 sm:p-7 border border-sage shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-burnt uppercase tracking-wider px-2.5 py-0.5 bg-peach rounded-full">
              Citizen Grievance Portfolio
            </span>
            {currentUser && (
              <span className="text-[10px] font-semibold text-charcoal-muted">
                {currentUser.identifier}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-forest">
            {currentUser ? `Welcome back, ${currentUser.name}` : 'Citizen Grievance Dashboard'}
          </h1>
          <p className="text-xs text-charcoal-muted max-w-xl">
            Track real progress, municipal work orders, and photographic evidence for public issues you filed across India.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-5 py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-2xl font-bold text-xs shadow-card hover:shadow-elevated transition-all self-start sm:self-auto shrink-0"
        >
          <PlusCircle size={16} className="text-burnt" />
          <span>Report New Grievance</span>
        </button>
      </div>

      {/* Quick Portfolio Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-softwhite p-4 rounded-2xl border border-sage shadow-xs space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted text-[11px] font-semibold">
            <span>Total Reported</span>
            <FileText size={15} className="text-forest" />
          </div>
          <div className="text-2xl font-black text-forest">{totalCount}</div>
          <p className="text-[10px] text-charcoal-muted">Entered into official ledger</p>
        </div>

        <div className="bg-softwhite p-4 rounded-2xl border border-sage shadow-xs space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted text-[11px] font-semibold">
            <span>In Field Execution</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{inProgressCount}</div>
          <p className="text-[10px] text-charcoal-muted">Work orders active</p>
        </div>

        <div className="bg-softwhite p-4 rounded-2xl border border-sage shadow-xs space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted text-[11px] font-semibold">
            <span>Verified Resolutions</span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{verifiedCount}</div>
          <p className="text-[10px] text-charcoal-muted">Citizen confirmed closures</p>
        </div>

        <div className="bg-softwhite p-4 rounded-2xl border border-sage shadow-xs space-y-1">
          <div className="flex items-center justify-between text-charcoal-muted text-[11px] font-semibold">
            <span>Community Support</span>
            <ThumbsUp size={15} className="text-burnt" />
          </div>
          <div className="text-2xl font-black text-burnt">+{totalUpvotes}</div>
          <p className="text-[10px] text-charcoal-muted">Citizen priority upvotes</p>
        </div>
      </div>

      {/* Notifications Drawer if any exist */}
      {notifications.length > 0 && (
        <div className="bg-softwhite rounded-2xl p-4 sm:p-5 border border-sage shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-forest" />
              <h2 className="text-xs font-bold text-forest uppercase tracking-wider">
                Recent Ledger Notifications ({notifications.filter(n => !n.read).length} Unread)
              </h2>
            </div>
            <span className="text-[10px] text-charcoal-muted">Real-time status updates</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {notifications.slice(0, 4).map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  if (notif.complaintId) {
                    setSelectedComplaintId(notif.complaintId);
                    setActiveTab('track');
                  }
                }}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-ivory/50 border-sage/60 text-charcoal-muted'
                    : 'bg-cyan-50/70 border-cyan-200 text-charcoal font-semibold'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-forest flex items-center gap-1.5">
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-burnt shrink-0" />}
                    <span className="truncate">{notif.title}</span>
                  </div>
                  <p className="text-[11px] text-charcoal-muted truncate">{notif.message}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-forest font-bold shrink-0">
                  <span>Track</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grievance Management Section */}
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-forest">Filter by Stage:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-forest text-softwhite font-bold'
                    : 'bg-softwhite border border-sage text-charcoal hover:bg-sage/30'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'active'
                    ? 'bg-forest text-softwhite font-bold'
                    : 'bg-softwhite border border-sage text-charcoal hover:bg-sage/30'
                }`}
              >
                Triage ({userComplaints.filter(c => c.status === 'submitted' || c.status === 'verified_intake').length})
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'in_progress'
                    ? 'bg-forest text-softwhite font-bold'
                    : 'bg-softwhite border border-sage text-charcoal hover:bg-sage/30'
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'resolved'
                    ? 'bg-forest text-softwhite font-bold'
                    : 'bg-softwhite border border-sage text-charcoal hover:bg-sage/30'
                }`}
              >
                Resolved ({userComplaints.filter(c => c.status === 'resolved' || c.status === 'verified').length})
              </button>
            </div>
          </div>

          <span className="text-[11px] text-charcoal-muted self-end sm:self-auto">
            Showing {filteredComplaints.length} records
          </span>
        </div>

        {/* Complaints Listing */}
        {filteredComplaints.length > 0 ? (
          <div className="space-y-3">
            {filteredComplaints.map((complaint) => {
              const stage = getStageNumber(complaint.status);
              return (
                <div
                  key={complaint.id}
                  onClick={() => {
                    setSelectedComplaintId(complaint.id);
                    setActiveTab('track');
                  }}
                  className="bg-softwhite rounded-2xl p-5 border border-sage hover:border-forest/40 shadow-card hover:shadow-elevated transition-all cursor-pointer space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-ivory border border-sage text-forest">
                          #{complaint.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            complaint.edpsBand === 'critical'
                              ? 'bg-peach text-burnt'
                              : complaint.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sage text-forest'
                          }`}
                        >
                          EDPS {complaint.edpsScore} • {complaint.status.replace(/_/g, ' ')}
                        </span>
                        {complaint.workOrder && (
                          <span className="text-[10px] font-semibold text-charcoal-muted hidden sm:inline">
                            Assigned: {complaint.workOrder.department}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-forest truncate">{complaint.title}</h3>

                      <div className="flex items-center gap-1.5 text-xs text-charcoal-muted">
                        <MapPin size={12} className="text-forest flex-shrink-0" />
                        <span className="truncate">{complaint.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                      <span className="text-charcoal-muted font-semibold">+{complaint.upvotes} upvotes</span>
                      <span className="font-bold text-forest hover:text-burnt flex items-center gap-1 bg-ivory border border-sage px-3 py-1.5 rounded-xl transition-colors">
                        <span>Track Details</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>

                  {/* 6-Stage Visual Progress Bar */}
                  <div className="pt-2 border-t border-sage/50">
                    <div className="flex items-center justify-between text-[10px] text-charcoal-muted font-medium mb-1.5">
                      <span className="font-bold text-forest">Stage {stage} of 6:</span>
                      <span>
                        {stage === 1 && 'Intake Submitted'}
                        {stage === 2 && 'Triage Verified'}
                        {stage === 3 && 'Work Order Dispatched'}
                        {stage === 4 && 'Field Crew In Progress'}
                        {stage === 5 && 'Contractor Resolved (Pending Verification)'}
                        {stage === 6 && 'Closed & Citizen Verified'}
                      </span>
                    </div>
                    <div className="w-full bg-sage/60 rounded-full h-1.5 overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 h-full transition-all ${
                            step <= stage
                              ? step === 6
                                ? 'bg-emerald-600'
                                : 'bg-forest'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-softwhite rounded-3xl p-12 border border-sage shadow-card text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sage/80 flex items-center justify-center text-forest mx-auto">
              <FileText size={26} className="text-forest" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-forest">
                {totalCount === 0 ? "You Haven't Reported Any Issues Yet" : 'No Complaints in this Stage'}
              </h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                {totalCount === 0
                  ? 'Any public defect you file with geotagged photos will be tracked here from intake to verified closure.'
                  : 'Try selecting another stage filter above or view all complaints.'}
              </p>
            </div>
            {totalCount === 0 ? (
              <button
                onClick={onOpenReportModal}
                className="px-6 py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card transition-all"
              >
                File Your First Grievance
              </button>
            ) : (
              <button
                onClick={() => setStatusFilter('all')}
                className="px-4 py-2 bg-ivory border border-sage text-forest rounded-xl font-bold text-xs"
              >
                Clear Stage Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Security & Cryptographic Integrity Guarantee */}
      <div className="bg-ivory rounded-2xl p-4 border border-sage flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-charcoal-muted">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
          <span>
            <strong className="text-forest font-bold">Cryptographic Ledger Assurance:</strong> All complaints are timestamped with SHA-256 state digests and geofence-validated closure coordinates.
          </span>
        </div>
        <button
          onClick={() => setActiveTab('citizen_profile')}
          className="text-burnt font-bold hover:underline shrink-0 text-left sm:text-right"
        >
          View Security Settings →
        </button>
      </div>
    </div>
  );
};
