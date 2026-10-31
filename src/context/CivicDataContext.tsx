import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  ViewTab,
  WorkOrder,
  ResolutionProof,
  VerificationVoteOption,
  ComplaintHistoryEntry,
  CitizenNotification,
  AuditLogEntry,
  CommunityChallenge,
  VolunteerActivity,
  ChallengeActivityUpdate,
} from '../types';
import {
  getAllComplaints,
  saveAllComplaints,
  createComplaint as dbCreateComplaint,
  updateComplaintRecord,
  addNotification,
  addAuditLogEntry,
  syncFromIndexedDb,
  getAllChallenges,
  saveAllChallenges,
  findChallengeById,
  updateChallengeRecord,
} from '../lib/db';
import { calculateEdps } from '../lib/edpsCalculator';
import { checkDuplicateComplaint, DuplicateCheckResult } from '../lib/duplicateCheck';
import { validateResolutionGeofence, recordCitizenVote } from '../lib/geofence';
import { computeSha256Sync } from '../lib/cryptoAuth';
import { calculateCommunityScore } from '../lib/communityScoreEngine';
import { useAuth } from './AuthContext';

interface CivicDataContextType {
  complaints: Complaint[];
  challenges: CommunityChallenge[];
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;
  selectedChallengeId: string | null;
  setSelectedChallengeId: (id: string | null) => void;
  submitNewComplaint: (data: {
    title: string;
    description: string;
    category: ComplaintCategory;
    address: string;
    state?: string;
    district?: string;
    latitude: number;
    longitude: number;
    ward?: string;
    photoUrl: string;
    linkedChallengeId?: string;
  }) => Complaint;
  checkDuplicates: (lat: number, lng: number, category: ComplaintCategory) => DuplicateCheckResult;
  upvoteComplaint: (complaintId: string) => void;
  verifyIntake: (complaintId: string, notes?: string) => boolean;
  assignWorkOrder: (
    complaintId: string,
    order: {
      department: string;
      contractor: string;
      crew: string;
      slaHours: number;
      instructions: string;
    }
  ) => boolean;
  markInProgress: (complaintId: string, notes?: string) => boolean;
  submitResolutionProof: (
    complaintId: string,
    proof: {
      afterPhotoUrl: string;
      completedLatitude: number;
      completedLongitude: number;
      notes: string;
      contractorName?: string;
    }
  ) => { success: boolean; isGeofenceValid: boolean; distanceMeters: number; message: string };
  verifyComplaintResolution: (complaintId: string, officialNotes: string) => boolean;
  voteVerification: (
    complaintId: string,
    vote: VerificationVoteOption
  ) => { success: boolean; message: string };
  reopenComplaint: (complaintId: string, reason: string) => boolean;
  updateComplaintStatus: (
    complaintId: string,
    newStatus: 'submitted' | 'in_progress' | 'resolved'
  ) => boolean;
  searchComplaintById: (queryId: string) => Complaint | undefined;
  refreshComplaints: () => void;
  // Community Action methods
  refreshChallenges: () => void;
  joinChallenge: (challengeId: string) => boolean;
  leaveChallenge: (challengeId: string) => boolean;
  registerForVolunteerActivity: (challengeId: string, activityId: string) => boolean;
  completeVolunteerActivity: (challengeId: string, activityId: string, notes?: string) => boolean;
  linkComplaintToChallenge: (challengeId: string, complaintId: string) => boolean;
  createNewChallenge: (data: {
    title: string;
    tagline: string;
    description: string;
    targetProblemCategory: ComplaintCategory;
    ward: string;
    district?: string;
    state?: string;
    startDate: string;
    endDate: string;
    organizerName?: string;
    organizerRole?: string;
    isOfficial?: boolean;
    isDemoData?: boolean;
    targets: {
      targetHotspotsToAddress: number;
      targetVolunteerCleanups: number;
      targetResidentParticipation: number;
    };
    participationRules?: string[];
  }) => CommunityChallenge;
  postChallengeOfficialUpdate: (
    challengeId: string,
    update: { details: string; type?: ChallengeActivityUpdate['type'] }
  ) => boolean;
  verifyChallengeImprovement: (challengeId: string, complaintId: string, notes: string) => boolean;
}

const CivicDataContext = createContext<CivicDataContextType | undefined>(undefined);

export const CivicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);

  const getInitialTab = (): ViewTab => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as ViewTab;
      if (
        tabParam &&
        [
          'home',
          'track',
          'map',
          'civic_pulse',
          'community_action',
          'my_complaints',
          'official_dashboard',
        ].includes(tabParam)
      ) {
        return tabParam;
      }
      if (params.get('challenge')) return 'community_action';
      if (params.get('track')) return 'track';
    }
    return 'home';
  };

  const getInitialSelectedId = (): string | null => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('track') || params.get('id') || null;
    }
    return null;
  };

  const getInitialChallengeId = (): string | null => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('challenge') || null;
    }
    return null;
  };

  const [activeTab, setActiveTab] = useState<ViewTab>(getInitialTab);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(getInitialSelectedId);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(getInitialChallengeId);

  const refreshChallenges = () => {
    const rawChallenges = getAllChallenges();
    const currentComplaints = getAllComplaints();
    const scored = rawChallenges.map((ch) => ({
      ...ch,
      progressScore: calculateCommunityScore(ch, currentComplaints),
    }));
    setChallenges(scored);
  };

  const refreshComplaints = () => {
    const records = getAllComplaints();
    setComplaints(records);
    refreshChallenges();
  };

  useEffect(() => {
    refreshComplaints();
    refreshChallenges();
    // Hydrate any complaints stored in IndexedDB asynchronously
    syncFromIndexedDb().then((synced) => {
      if (synced && synced.length > 0) {
        setComplaints(synced);
        refreshChallenges();
      }
    });
  }, []);

  const checkDuplicates = (
    lat: number,
    lng: number,
    category: ComplaintCategory
  ): DuplicateCheckResult => {
    return checkDuplicateComplaint(lat, lng, category, complaints);
  };

  const submitNewComplaint = (data: {
    title: string;
    description: string;
    category: ComplaintCategory;
    address: string;
    state?: string;
    district?: string;
    latitude: number;
    longitude: number;
    ward?: string;
    photoUrl: string;
    linkedChallengeId?: string;
  }): Complaint => {
    const nextNum = 1000 + complaints.length + 1;
    const newId = `CT-${nextNum}`;
    const nowIso = new Date().toISOString();

    const edps = calculateEdps({
      category: data.category,
      upvotes: 0,
      proximityDetail: data.address,
    });

    const initialHistoryEntry: ComplaintHistoryEntry = {
      id: `hist_init_${Date.now()}`,
      timestamp: nowIso,
      action: 'Incident Reported',
      stage: 'reported',
      actorName: currentUser ? currentUser.name : 'Anonymous Citizen',
      actorRole: currentUser ? (currentUser.role === 'citizen' ? 'Verified Citizen' : currentUser.role) : 'Public Citizen',
      details: `Grievance registered at ${data.address}. Initial EDPS priority score computed at ${edps.score} (${edps.band.toUpperCase()}).`,
      hash: computeSha256Sync(`${newId}:${nowIso}:${data.category}:${data.latitude},${data.longitude}`),
    };

    const newComplaint: Complaint = {
      id: newId,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      status: 'submitted',
      address: data.address.trim(),
      state: data.state || 'India',
      district: data.district || 'Local Administration',
      latitude: data.latitude,
      longitude: data.longitude,
      ward: data.ward || 'Central Zone',
      reportedByUserId: currentUser ? currentUser.id : 'guest',
      reportedByName: currentUser ? currentUser.name : 'Verified Citizen',
      reportedByIdentifier: currentUser ? currentUser.identifier : 'Direct Submission',
      photoUrl: data.photoUrl,
      edpsScore: edps.score,
      edpsBand: edps.band,
      edpsExplanation: edps.explanation,
      upvotes: 0,
      upvotedByUserIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [initialHistoryEntry],
    };

    dbCreateComplaint(newComplaint);

    if (data.linkedChallengeId) {
      linkComplaintToChallenge(data.linkedChallengeId, newId);
    }

    // Citizen notification
    if (currentUser) {
      addNotification({
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId: currentUser.id,
        complaintId: newId,
        title: `Complaint Filed: #${newId}`,
        message: `Your report "${data.title.slice(0, 35)}..." has been entered into the municipal ledger at Priority ${edps.score}.`,
        type: 'status_change',
        read: false,
        createdAt: nowIso,
      });
    }

    refreshComplaints();
    return newComplaint;
  };

  const upvoteComplaint = (complaintId: string): void => {
    const userId = currentUser ? currentUser.id : 'guest_upvoter';
    const updated = updateComplaintRecord(complaintId, prev => {
      const alreadyUpvoted = prev.upvotedByUserIds.includes(userId);
      let nextUpvotes = prev.upvotes;
      let nextUpvotedUsers = [...prev.upvotedByUserIds];

      if (alreadyUpvoted) {
        nextUpvotedUsers = nextUpvotedUsers.filter(id => id !== userId);
        nextUpvotes = Math.max(0, prev.upvotes - 1);
      } else {
        nextUpvotedUsers.push(userId);
        nextUpvotes = prev.upvotes + 1;
      }

      const recomputed = calculateEdps({
        category: prev.category,
        upvotes: nextUpvotes,
        proximityDetail: prev.address,
      });

      const upvoteHistory: ComplaintHistoryEntry = {
        id: `hist_upvote_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: alreadyUpvoted ? 'Upvote Removed' : 'Crowd Signal Verified (+1 Upvote)',
        stage: 'verified',
        actorName: currentUser ? currentUser.name : 'Community Resident',
        actorRole: 'Citizen Upvoter',
        details: `Crowd signal adjusted to ${nextUpvotes} votes. Priority updated to ${recomputed.score}.`,
        hash: computeSha256Sync(`${prev.id}:upvote:${nextUpvotes}:${recomputed.score}`),
      };

      return {
        ...prev,
        upvotes: nextUpvotes,
        upvotedByUserIds: nextUpvotedUsers,
        edpsScore: recomputed.score,
        edpsBand: recomputed.band,
        edpsExplanation: recomputed.explanation,
        updatedAt: new Date().toISOString(),
        history: [...prev.history, upvoteHistory],
      };
    });

    if (updated) {
      refreshComplaints();
    }
  };

  const updateComplaintStatus = (
    complaintId: string,
    newStatus: 'submitted' | 'in_progress' | 'resolved'
  ): boolean => {
    const nowIso = new Date().toISOString();
    const updated = updateComplaintRecord(complaintId, prev => {
      const statusLabel =
        newStatus === 'submitted'
          ? 'Pending'
          : newStatus === 'in_progress'
          ? 'In Progress'
          : 'Resolved';

      const historyEntry: ComplaintHistoryEntry = {
        id: `hist_stat_${Date.now()}`,
        timestamp: nowIso,
        action: `Status Updated to ${statusLabel}`,
        stage: newStatus === 'resolved' ? 'resolved' : newStatus === 'in_progress' ? 'in_progress' : 'reported',
        actorName: currentUser?.name || 'Municipal Representative',
        actorRole: currentUser?.role || 'government',
        department: currentUser?.department,
        details: `Complaint status updated to ${statusLabel} in official municipal records.`,
        hash: computeSha256Sync(`${complaintId}:${newStatus}:${nowIso}`),
      };

      return {
        ...prev,
        status: newStatus,
        updatedAt: nowIso,
        history: [...prev.history, historyEntry],
      };
    });

    if (updated) {
      refreshComplaints();
      return true;
    }
    return false;
  };

  // Stage 2: Triage Verification by Department
  const verifyIntake = (complaintId: string, notes?: string): boolean => {
    const nowIso = new Date().toISOString();
    const updated = updateComplaintRecord(complaintId, prev => {
      const historyEntry: ComplaintHistoryEntry = {
        id: `hist_ver_intake_${Date.now()}`,
        timestamp: nowIso,
        action: 'Intake Triage Confirmed',
        stage: 'verified',
        actorName: currentUser?.name || 'Triage Officer',
        actorRole: currentUser?.role || 'government',
        department: currentUser?.department,
        details: notes || 'Defect confirmed against jurisdiction guidelines and dispatched for work allocation.',
        hash: computeSha256Sync(`${prev.id}:intake_verified:${nowIso}`),
      };

      return {
        ...prev,
        status: 'verified_intake',
        updatedAt: nowIso,
        history: [...prev.history, historyEntry],
      };
    });

    if (updated) {
      if (updated.reportedByUserId && updated.reportedByUserId !== 'guest') {
        addNotification({
          id: `notif_${Date.now()}`,
          userId: updated.reportedByUserId,
          complaintId: updated.id,
          title: `Complaint Verified: #${updated.id}`,
          message: `Municipal engineers verified your complaint. Work order dispatch in progress.`,
          type: 'status_change',
          read: false,
          createdAt: nowIso,
        });
      }
      refreshComplaints();
      return true;
    }
    return false;
  };

  // Stage 3: Work Order Dispatch
  const assignWorkOrder = (
    complaintId: string,
    order: {
      department: string;
      contractor: string;
      crew: string;
      slaHours: number;
      instructions: string;
    }
  ): boolean => {
    const now = new Date();
    const deadline = new Date(now.getTime() + order.slaHours * 60 * 60 * 1000);
    const workOrderId = `WO-${Date.now().toString().slice(-6)}`;

    const workOrderRecord: WorkOrder = {
      id: workOrderId,
      assignedToOfficialId: currentUser?.id || 'admin',
      officialName: currentUser?.name || 'Executive Engineer',
      department: order.department,
      contractor: order.contractor,
      crew: order.crew,
      slaHours: order.slaHours,
      deadlineDate: deadline.toISOString(),
      instructions: order.instructions,
      assignedAt: now.toISOString(),
    };

    const historyEntry: ComplaintHistoryEntry = {
      id: `hist_wo_${Date.now()}`,
      timestamp: now.toISOString(),
      action: 'Work Order Dispatched',
      stage: 'assigned',
      actorName: currentUser?.name || 'Lead Engineer',
      actorRole: 'Municipal Official',
      department: order.department,
      details: `Work order ${workOrderId} issued to ${order.contractor} (${order.crew}). Target SLA: ${order.slaHours} hours.`,
      hash: computeSha256Sync(`${complaintId}:${workOrderId}:${order.contractor}`),
    };

    const updated = updateComplaintRecord(complaintId, prev => ({
      ...prev,
      status: 'assigned',
      workOrder: workOrderRecord,
      updatedAt: now.toISOString(),
      history: [...prev.history, historyEntry],
    }));

    if (updated) {
      addAuditLogEntry({
        id: `audit_wo_${Date.now()}`,
        timestamp: now.toISOString(),
        actorId: currentUser?.id || 'system',
        actorName: currentUser?.name || 'Municipal Engineer',
        actorRole: currentUser?.role || 'government',
        actionType: 'work_order_dispatched',
        targetId: complaintId,
        targetType: 'work_order',
        details: `Work order ${workOrderId} dispatched for complaint #${complaintId} to ${order.contractor}.`,
      });

      if (updated.reportedByUserId && updated.reportedByUserId !== 'guest') {
        addNotification({
          id: `notif_${Date.now()}`,
          userId: updated.reportedByUserId,
          complaintId: updated.id,
          title: `Field Crew Dispatched: #${updated.id}`,
          message: `Assigned to ${order.contractor} (${order.department}). SLA deadline: ${order.slaHours}h.`,
          type: 'work_order',
          read: false,
          createdAt: now.toISOString(),
        });
      }

      refreshComplaints();
      return true;
    }
    return false;
  };

  // Stage 4: Mark Field Work in Progress
  const markInProgress = (complaintId: string, notes?: string): boolean => {
    const nowIso = new Date().toISOString();
    const updated = updateComplaintRecord(complaintId, prev => {
      const historyEntry: ComplaintHistoryEntry = {
        id: `hist_prog_${Date.now()}`,
        timestamp: nowIso,
        action: 'Field Work Started',
        stage: 'in_progress',
        actorName: currentUser?.name || 'Field Unit',
        actorRole: 'Contractor Crew',
        department: prev.workOrder?.department,
        details: notes || 'Field crew on site. Physical remediation work actively underway.',
        hash: computeSha256Sync(`${prev.id}:in_progress:${nowIso}`),
      };

      return {
        ...prev,
        status: 'in_progress',
        updatedAt: nowIso,
        history: [...prev.history, historyEntry],
      };
    });

    if (updated) {
      refreshComplaints();
      return true;
    }
    return false;
  };

  // Stage 5: Submit Resolution Proof with GPS Geofence Validation
  const submitResolutionProof = (
    complaintId: string,
    proof: {
      afterPhotoUrl: string;
      completedLatitude: number;
      completedLongitude: number;
      notes: string;
      contractorName?: string;
    }
  ): { success: boolean; isGeofenceValid: boolean; distanceMeters: number; message: string } => {
    const target = complaints.find(c => c.id.toUpperCase() === complaintId.toUpperCase());
    if (!target) {
      return { success: false, isGeofenceValid: false, distanceMeters: 0, message: 'Complaint not found.' };
    }

    const geoResult = validateResolutionGeofence(
      target.latitude,
      target.longitude,
      proof.completedLatitude,
      proof.completedLongitude
    );

    if (!geoResult.isValid) {
      return {
        success: false,
        isGeofenceValid: false,
        distanceMeters: geoResult.distanceMeters,
        message: geoResult.message,
      };
    }

    const nowIso = new Date().toISOString();
    const resolutionProofRecord: ResolutionProof = {
      afterPhotoUrl: proof.afterPhotoUrl,
      completedLatitude: proof.completedLatitude,
      completedLongitude: proof.completedLongitude,
      geofenceDistanceMeters: geoResult.distanceMeters,
      isGeofenceValid: true,
      notes: proof.notes,
      completedAt: nowIso,
      contractorName: proof.contractorName || target.workOrder?.contractor || 'Field Contractor',
    };

    const historyEntry: ComplaintHistoryEntry = {
      id: `hist_proof_${Date.now()}`,
      timestamp: nowIso,
      action: 'Proof of Fix Uploaded (GPS Geofence Verified)',
      stage: 'resolved',
      actorName: currentUser?.name || 'Field Supervisor',
      actorRole: 'Contractor Supervisor',
      department: target.workOrder?.department,
      details: `Resolution photographic proof uploaded. GPS discrepancy: ${geoResult.distanceMeters}m (tolerance <= 25m). 24h Community verification gate opened.`,
      hash: computeSha256Sync(`${complaintId}:${nowIso}:${geoResult.distanceMeters}m`),
    };

    const initialGate = {
      votingOpen: true,
      fixedVotes: 1, // contractor initial sign-off
      stillBrokenVotes: 0,
      partiallyFixedVotes: 0,
      totalVotes: 1,
      consensusPercentage: 100,
      isDisputed: false,
      votedUsers: { [currentUser?.id || 'contractor']: 'fixed' as VerificationVoteOption },
    };

    const updated = updateComplaintRecord(complaintId, prev => ({
      ...prev,
      status: 'awaiting_verification',
      resolutionProof: resolutionProofRecord,
      verificationGate: initialGate,
      updatedAt: nowIso,
      history: [...prev.history, historyEntry],
    }));

    if (updated) {
      addAuditLogEntry({
        id: `audit_proof_${Date.now()}`,
        timestamp: nowIso,
        actorId: currentUser?.id || 'contractor',
        actorName: currentUser?.name || 'Field Contractor',
        actorRole: 'contractor',
        actionType: 'proof_submitted',
        targetId: complaintId,
        targetType: 'complaint',
        details: `Resolution proof uploaded for #${complaintId}. Geofence distance: ${geoResult.distanceMeters}m.`,
      });

      if (updated.reportedByUserId && updated.reportedByUserId !== 'guest') {
        addNotification({
          id: `notif_${Date.now()}`,
          userId: updated.reportedByUserId,
          complaintId: updated.id,
          title: `Resolution Proof Ready for Verification: #${updated.id}`,
          message: `Field repair completed (${geoResult.distanceMeters}m GPS verified). Please inspect and vote in the community check.`,
          type: 'resolution_proof',
          read: false,
          createdAt: nowIso,
        });
      }

      refreshComplaints();
      return {
        success: true,
        isGeofenceValid: true,
        distanceMeters: geoResult.distanceMeters,
        message: geoResult.message,
      };
    }

    return { success: false, isGeofenceValid: true, distanceMeters: geoResult.distanceMeters, message: 'Database write error.' };
  };

  // Stage 6: Final Verification (Sign-off or Community Consensus)
  const verifyComplaintResolution = (complaintId: string, officialNotes: string): boolean => {
    const nowIso = new Date().toISOString();
    const historyEntry: ComplaintHistoryEntry = {
      id: `hist_ver_close_${Date.now()}`,
      timestamp: nowIso,
      action: 'Final Verification Passed & Ticket Closed',
      stage: 'verified_resolution',
      actorName: currentUser?.name || 'Supervisory Engineer',
      actorRole: currentUser?.role || 'super_admin',
      details: officialNotes || 'Defect verified resolved. Work order closed in official records.',
      hash: computeSha256Sync(`${complaintId}:verified_closed:${nowIso}`),
    };

    const updated = updateComplaintRecord(complaintId, prev => ({
      ...prev,
      status: 'verified',
      updatedAt: nowIso,
      history: [...prev.history, historyEntry],
    }));

    if (updated) {
      addAuditLogEntry({
        id: `audit_close_${Date.now()}`,
        timestamp: nowIso,
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.name || 'Official',
        actorRole: currentUser?.role || 'government',
        actionType: 'complaint_verified',
        targetId: complaintId,
        targetType: 'complaint',
        details: `Complaint #${complaintId} verified and permanently closed. Notes: ${officialNotes}`,
      });

      if (updated.reportedByUserId && updated.reportedByUserId !== 'guest') {
        addNotification({
          id: `notif_${Date.now()}`,
          userId: updated.reportedByUserId,
          complaintId: updated.id,
          title: `Issue Successfully Closed: #${updated.id}`,
          message: `Your grievance has reached Verified Resolution and is now permanently sealed.`,
          type: 'verification',
          read: false,
          createdAt: nowIso,
        });
      }

      refreshComplaints();
      return true;
    }
    return false;
  };

  // Citizen Consensus Voting
  const voteVerification = (
    complaintId: string,
    vote: VerificationVoteOption
  ): { success: boolean; message: string } => {
    const target = complaints.find(c => c.id.toUpperCase() === complaintId.toUpperCase());
    if (!target) return { success: false, message: 'Complaint not found.' };

    const gate = target.verificationGate || {
      votingOpen: true,
      fixedVotes: 0,
      stillBrokenVotes: 0,
      partiallyFixedVotes: 0,
      totalVotes: 0,
      consensusPercentage: 0,
      isDisputed: false,
      votedUsers: {},
    };

    const userId = currentUser ? currentUser.id : `voter_${Date.now()}`;
    const voteRes = recordCitizenVote(gate, userId, vote);

    const nowIso = new Date().toISOString();
    const voteHistory: ComplaintHistoryEntry = {
      id: `hist_vote_${Date.now()}`,
      timestamp: nowIso,
      action: `Citizen Consensus Vote: ${vote.toUpperCase().replace(/_/g, ' ')}`,
      stage: 'verified_resolution',
      actorName: currentUser ? currentUser.name : 'Local Resident',
      actorRole: 'Citizen Verifier',
      details: `Citizen submitted inspection vote "${vote}". Consensus approval: ${voteRes.updatedGate.consensusPercentage}%.`,
      hash: computeSha256Sync(`${complaintId}:vote:${vote}:${nowIso}`),
    };

    const nextStatus: ComplaintStatus = voteRes.shouldReopen
      ? 'reopened'
      : voteRes.updatedGate.consensusPercentage >= 80 && voteRes.updatedGate.totalVotes >= 3
      ? 'verified'
      : target.status;

    const updated = updateComplaintRecord(complaintId, prev => ({
      ...prev,
      status: nextStatus,
      edpsScore: voteRes.shouldReopen ? 95 : prev.edpsScore, // Escalate to Priority 95 on dispute!
      edpsBand: voteRes.shouldReopen ? 'critical' : prev.edpsBand,
      verificationGate: voteRes.updatedGate,
      updatedAt: nowIso,
      history: [...prev.history, voteHistory],
    }));

    if (updated) {
      if (voteRes.shouldReopen) {
        addAuditLogEntry({
          id: `audit_dispute_${Date.now()}`,
          timestamp: nowIso,
          actorId: 'system_consensus_gate',
          actorName: 'Community Consensus Gate',
          actorRole: 'system',
          actionType: 'complaint_reopened',
          targetId: complaintId,
          targetType: 'complaint',
          details: `Complaint #${complaintId} automatically reopened due to 2+ "Still Broken" consensus votes. Priority escalated to 95.`,
        });

        if (updated.reportedByUserId && updated.reportedByUserId !== 'guest') {
          addNotification({
            id: `notif_${Date.now()}`,
            userId: updated.reportedByUserId,
            complaintId: updated.id,
            title: `Complaint Reopened: #${updated.id}`,
            message: `Community consensus rejected resolution proof. Reopened at Critical Priority 95.`,
            type: 'escalation',
            read: false,
            createdAt: nowIso,
          });
        }
      }

      refreshComplaints();
      return { success: true, message: voteRes.message };
    }

    return { success: false, message: 'Failed to record consensus vote.' };
  };

  const reopenComplaint = (complaintId: string, reason: string): boolean => {
    const nowIso = new Date().toISOString();
    const historyEntry: ComplaintHistoryEntry = {
      id: `hist_reopen_${Date.now()}`,
      timestamp: nowIso,
      action: 'Administrative Escalation & Reopening',
      stage: 'in_progress',
      actorName: currentUser?.name || 'Administrator',
      actorRole: currentUser?.role || 'super_admin',
      details: reason,
      hash: computeSha256Sync(`${complaintId}:escalated:${nowIso}`),
    };

    const updated = updateComplaintRecord(complaintId, prev => ({
      ...prev,
      status: 'reopened',
      edpsScore: 95,
      edpsBand: 'critical',
      updatedAt: nowIso,
      history: [...prev.history, historyEntry],
    }));

    if (updated) {
      refreshComplaints();
      return true;
    }
    return false;
  };

  // ---------------------------------------------------------------------------
  // COMMUNITY ACTION & CHALLENGE MANAGEMENT METHODS
  // ---------------------------------------------------------------------------
  const joinChallenge = (challengeId: string): boolean => {
    const userId = currentUser ? currentUser.id : 'usr_guest_resident';
    const userName = currentUser ? currentUser.name : 'Neighbourhood Resident';

    const updated = updateChallengeRecord(challengeId, (prev) => {
      if (prev.participatingUserIds.includes(userId)) {
        return prev;
      }

      const nextParticipants = [...prev.participatingUserIds, userId];
      const newUpdate: ChallengeActivityUpdate = {
        id: `upd_join_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'volunteer_joined',
        actorName: userName,
        actorRole: currentUser?.role === 'citizen' ? 'Verified Citizen' : 'Local Resident',
        details: `${userName} joined the community challenge to support neighborhood progress.`,
      };

      const updatedCh = {
        ...prev,
        participatingUserIds: nextParticipants,
        updates: [newUpdate, ...prev.updates],
        updatedAt: new Date().toISOString(),
      };

      return {
        ...updatedCh,
        progressScore: calculateCommunityScore(updatedCh, complaints),
      };
    });

    if (updated) {
      refreshChallenges();
      return true;
    }
    return false;
  };

  const leaveChallenge = (challengeId: string): boolean => {
    const userId = currentUser ? currentUser.id : 'usr_guest_resident';
    const updated = updateChallengeRecord(challengeId, (prev) => {
      const nextParticipants = prev.participatingUserIds.filter((id) => id !== userId);
      const updatedCh = {
        ...prev,
        participatingUserIds: nextParticipants,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...updatedCh,
        progressScore: calculateCommunityScore(updatedCh, complaints),
      };
    });

    if (updated) {
      refreshChallenges();
      return true;
    }
    return false;
  };

  const registerForVolunteerActivity = (challengeId: string, activityId: string): boolean => {
    const userId = currentUser ? currentUser.id : 'usr_guest_volunteer';
    const userName = currentUser ? currentUser.name : 'Community Volunteer';

    const updated = updateChallengeRecord(challengeId, (prev) => {
      const actIndex = prev.volunteerActivities.findIndex((a) => a.id === activityId);
      if (actIndex === -1) return prev;

      const act = prev.volunteerActivities[actIndex];
      if (act.registeredUserIds.includes(userId)) return prev;

      const updatedAct: VolunteerActivity = {
        ...act,
        registeredUserIds: [...act.registeredUserIds, userId],
      };

      const updatedActivities = [...prev.volunteerActivities];
      updatedActivities[actIndex] = updatedAct;

      const newUpdate: ChallengeActivityUpdate = {
        id: `upd_vol_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'volunteer_joined',
        actorName: userName,
        actorRole: 'Registered Volunteer',
        details: `${userName} registered for volunteer activity "${act.title}".`,
        activityId,
      };

      const updatedCh = {
        ...prev,
        volunteerActivities: updatedActivities,
        updates: [newUpdate, ...prev.updates],
        updatedAt: new Date().toISOString(),
      };

      return {
        ...updatedCh,
        progressScore: calculateCommunityScore(updatedCh, complaints),
      };
    });

    if (updated) {
      refreshChallenges();
      return true;
    }
    return false;
  };

  const completeVolunteerActivity = (
    challengeId: string,
    activityId: string,
    notes?: string
  ): boolean => {
    const isAuthorized =
      currentUser?.role === 'government' ||
      currentUser?.role === 'official' ||
      currentUser?.role === 'super_admin';

    const coordinatorName = currentUser?.name || 'Authorized Field Coordinator';

    const updated = updateChallengeRecord(challengeId, (prev) => {
      const actIndex = prev.volunteerActivities.findIndex((a) => a.id === activityId);
      if (actIndex === -1) return prev;

      const act = prev.volunteerActivities[actIndex];
      const updatedAct: VolunteerActivity = {
        ...act,
        status: 'completed',
        completedNotes: notes || 'Activity completed with community volunteer attendance.',
        completedAt: new Date().toISOString(),
        confirmedUserIds: [...act.registeredUserIds],
      };

      const updatedActivities = [...prev.volunteerActivities];
      updatedActivities[actIndex] = updatedAct;

      const newUpdate: ChallengeActivityUpdate = {
        id: `upd_act_done_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'activity_completed',
        actorName: coordinatorName,
        actorRole: isAuthorized ? 'Official Coordinator' : 'Community Lead',
        details: `Volunteer activity "${act.title}" marked completed. ${act.registeredUserIds.length} volunteer participations recorded.`,
        activityId,
      };

      const updatedCh = {
        ...prev,
        volunteerActivities: updatedActivities,
        updates: [newUpdate, ...prev.updates],
        updatedAt: new Date().toISOString(),
      };

      return {
        ...updatedCh,
        progressScore: calculateCommunityScore(updatedCh, complaints),
      };
    });

    if (updated) {
      refreshChallenges();
      return true;
    }
    return false;
  };

  const linkComplaintToChallenge = (challengeId: string, complaintId: string): boolean => {
    const targetComp = complaints.find((c) => c.id.toUpperCase() === complaintId.toUpperCase());
    const actorName = currentUser ? currentUser.name : 'Ward Resident';

    const updated = updateChallengeRecord(challengeId, (prev) => {
      if (prev.associatedComplaintIds.includes(complaintId)) return prev;

      const nextComplaints = [...prev.associatedComplaintIds, complaintId];
      const newUpdate: ChallengeActivityUpdate = {
        id: `upd_link_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'hotspot_reported',
        actorName,
        actorRole: 'Citizen Submitter',
        details: `Civic hotspot #${complaintId} (${targetComp?.title || 'Reported Issue'}) linked to challenge.`,
        complaintId,
      };

      const updatedCh = {
        ...prev,
        associatedComplaintIds: nextComplaints,
        updates: [newUpdate, ...prev.updates],
        updatedAt: new Date().toISOString(),
      };

      return {
        ...updatedCh,
        progressScore: calculateCommunityScore(updatedCh, complaints),
      };
    });

    if (updated) {
      refreshChallenges();
      return true;
    }
    return false;
  };

  const createNewChallenge = (data: {
    title: string;
    tagline: string;
    description: string;
    targetProblemCategory: ComplaintCategory;
    ward: string;
    district?: string;
    state?: string;
    startDate: string;
    endDate: string;
    organizerName?: string;
    organizerRole?: string;
    isOfficial?: boolean;
    isDemoData?: boolean;
    targets: {
      targetHotspotsToAddress: number;
      targetVolunteerCleanups: number;
      targetResidentParticipation: number;
    };
    participationRules?: string[];
  }): CommunityChallenge => {
    const isOfficial =
      data.isOfficial !== undefined
        ? data.isOfficial
        : currentUser?.role === 'government' ||
          currentUser?.role === 'official' ||
          currentUser?.role === 'super_admin';

    const newId = `CH-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const initialUpdate: ChallengeActivityUpdate = {
      id: `upd_init_${Date.now()}`,
      timestamp: nowIso,
      type: 'official_update',
      actorName: data.organizerName || (currentUser ? currentUser.name : 'Community Organizer'),
      actorRole: data.organizerRole || (isOfficial ? 'Municipal Official' : 'Resident Organizer'),
      details: isOfficial
        ? `Challenge "${data.title}" officially published for ${data.ward}.`
        : `Challenge proposal submitted for municipal review and community support.`,
    };

    const newChallenge: CommunityChallenge = {
      id: newId,
      title: data.title.trim(),
      tagline: data.tagline.trim(),
      description: data.description.trim(),
      targetProblemCategory: data.targetProblemCategory,
      ward: data.ward.trim(),
      district: data.district || 'Local Administration',
      state: data.state || 'India',
      status: isOfficial ? 'active' : 'under_review',
      startDate: data.startDate,
      endDate: data.endDate,
      isDemoData: data.isDemoData || false,
      organizerName: data.organizerName || (currentUser ? currentUser.name : 'Ward Resident Taskforce'),
      organizerRole: data.organizerRole || (isOfficial ? (currentUser?.department || 'Municipal Directorate') : 'Citizen Lead'),
      isOfficial,
      targets: data.targets,
      participatingUserIds: currentUser ? [currentUser.id] : [],
      associatedComplaintIds: [],
      volunteerActivities: [],
      updates: [initialUpdate],
      participationRules: data.participationRules && data.participationRules.length > 0
        ? data.participationRules
        : [
            'All reported hotspots must include photographic proof and GPS coordinates.',
            'Volunteers must follow municipal safety guidelines during group drives.',
            'Improvements must be verified through physical consensus or authorized inspection.',
          ],
      progressScore: {
        score: 0,
        baselineScore: 20,
        targetScore: 85,
        hotspotsReportedCount: 0,
        hotspotsReviewedCount: 0,
        cleanupActivitiesCompletedCount: 0,
        totalActivitiesCount: 0,
        verifiedImprovementsCount: 0,
        participatingResidentsCount: currentUser ? 1 : 0,
        factors: [
          {
            name: 'Hotspots Reviewed & Triage',
            weight: 35,
            achieved: 0,
            description: 'Hotspots will be tracked as community members log issues.',
          },
          {
            name: 'Verified Physical Fixes',
            weight: 30,
            achieved: 0,
            description: 'Verified repairs count toward this metric.',
          },
          {
            name: 'Completed Approved Activities',
            weight: 25,
            achieved: 0,
            description: 'Volunteer cleanup drives count toward this metric.',
          },
          {
            name: 'Resident Participation',
            weight: 10,
            achieved: currentUser ? 5 : 0,
            description: 'Resident sign-ups count toward community engagement.',
          },
        ],
        lastCalculatedAt: nowIso,
        isDataSufficient: false,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const all = getAllChallenges();
    all.unshift(newChallenge);
    saveAllChallenges(all);
    refreshChallenges();
    return newChallenge;
  };

  const postChallengeOfficialUpdate = (
    challengeId: string,
    update: { details: string; type?: ChallengeActivityUpdate['type'] }
  ): boolean => {
    const actorName = currentUser ? currentUser.name : 'Ward Operations Desk';
    const actorRole = currentUser ? (currentUser.department || currentUser.role) : 'Municipal Official';

    const updated = updateChallengeRecord(challengeId, (prev) => {
      const newUpd: ChallengeActivityUpdate = {
        id: `upd_off_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: update.type || 'official_update',
        actorName,
        actorRole,
        details: update.details,
      };

      return {
        ...prev,
        updates: [newUpd, ...prev.updates],
        updatedAt: new Date().toISOString(),
      };
    });

    if (updated) {
      refreshChallenges();
      return true;
    }
    return false;
  };

  const verifyChallengeImprovement = (
    challengeId: string,
    complaintId: string,
    notes: string
  ): boolean => {
    // 1. Verify complaint resolution in complaints ledger
    verifyComplaintResolution(complaintId, notes);

    // 2. Add verified improvement entry to challenge
    const actorName = currentUser ? currentUser.name : 'Ward Verification Officer';
    const updated = updateChallengeRecord(challengeId, (prev) => {
      const newUpd: ChallengeActivityUpdate = {
        id: `upd_verif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'improvement_verified',
        actorName,
        actorRole: 'Authorized Verifier',
        details: `Improvement verified for complaint #${complaintId}: "${notes}".`,
        complaintId,
      };

      const updatedCh = {
        ...prev,
        updates: [newUpd, ...prev.updates],
        updatedAt: new Date().toISOString(),
      };

      return {
        ...updatedCh,
        progressScore: calculateCommunityScore(updatedCh, getAllComplaints()),
      };
    });

    if (updated) {
      refreshChallenges();
      return true;
    }
    return false;
  };

  const searchComplaintById = (queryId: string): Complaint | undefined => {
    const clean = queryId.trim().toUpperCase();
    return complaints.find(c => c.id.toUpperCase() === clean);
  };

  return (
    <CivicDataContext.Provider
      value={{
        complaints,
        challenges,
        activeTab,
        setActiveTab,
        selectedComplaintId,
        setSelectedComplaintId,
        selectedChallengeId,
        setSelectedChallengeId,
        submitNewComplaint,
        checkDuplicates,
        upvoteComplaint,
        verifyIntake,
        assignWorkOrder,
        markInProgress,
        submitResolutionProof,
        verifyComplaintResolution,
        voteVerification,
        reopenComplaint,
        updateComplaintStatus,
        searchComplaintById,
        refreshComplaints,
        refreshChallenges,
        joinChallenge,
        leaveChallenge,
        registerForVolunteerActivity,
        completeVolunteerActivity,
        linkComplaintToChallenge,
        createNewChallenge,
        postChallengeOfficialUpdate,
        verifyChallengeImprovement,
      }}
    >
      {children}
    </CivicDataContext.Provider>
  );
};

export const useCivicData = (): CivicDataContextType => {
  const context = useContext(CivicDataContext);
  if (!context) {
    throw new Error('useCivicData must be used within a CivicDataProvider');
  }
  return context;
};
