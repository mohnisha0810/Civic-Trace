export type UserRole = 'citizen' | 'government' | 'super_admin' | 'official'; // 'official' alias for 'government'

export type GovernmentVerificationStatus =
  | 'draft'
  | 'pending_verification'
  | 'more_info_required'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type OrganizationType =
  | 'central_government'
  | 'state_government'
  | 'union_territory'
  | 'municipal_corporation'
  | 'municipality'
  | 'panchayat'
  | 'directorate'
  | 'board'
  | 'other';

export interface GovernmentProfileDetails {
  organizationType: OrganizationType;
  organizationName: string;
  state: string;
  district: string;
  city?: string;
  department: string;
  designation: string;
  officialEmail: string;
  officialPhone: string;
  idDocumentUrl?: string;
  verificationStatus: GovernmentVerificationStatus;
  verificationNotes?: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  jurisdictionBoundary?: {
    state?: string;
    district?: string;
    city?: string;
    wards?: string[];
  };
}

export interface User {
  id: string;
  name: string;
  identifier: string; // Email or Phone number
  identifierType: 'email' | 'phone';
  passwordHash: string;
  salt: string;
  role: UserRole;
  department?: string;
  ward?: string;
  createdAt: string;
  // Specific profile attributes
  governmentProfile?: GovernmentProfileDetails;
  isVerified?: boolean;
  phone?: string;
  email?: string;
  bio?: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

export type ComplaintCategory =
  | 'road_damage'
  | 'drainage_sewage'
  | 'streetlight_electrical'
  | 'water_supply'
  | 'garbage_waste'
  | 'traffic_signals'
  | 'public_infrastructure'
  | 'other';

export type ComplaintStatus =
  | 'submitted'              // 1. Reported
  | 'verified_intake'        // 2. Verified (triage confirmed)
  | 'assigned'               // 3. Assigned (work order dispatched)
  | 'in_progress'            // 4. In Progress (field crew active)
  | 'resolved'               // 5. Resolved (contractor evidence uploaded)
  | 'awaiting_verification'  // (Consensus gate active)
  | 'verified'               // 6. Verified Resolution (final citizen verification passed)
  | 'disputed'               // Community dispute triggered
  | 'rejected'               // Rejected with administrative cause
  | 'reopened';              // Reopened by citizen / super admin

export type PriorityBand = 'critical' | 'high' | 'medium' | 'low';

export interface WorkOrder {
  id: string;
  assignedToOfficialId: string;
  officialName: string;
  department: string;
  contractor: string;
  crew: string;
  slaHours: number;
  deadlineDate: string;
  instructions: string;
  assignedAt: string;
}

export interface ResolutionProof {
  afterPhotoUrl: string;
  completedLatitude: number;
  completedLongitude: number;
  geofenceDistanceMeters: number;
  isGeofenceValid: boolean;
  notes: string;
  completedAt: string;
  contractorName?: string;
}

export type VerificationVoteOption = 'fixed' | 'still_broken' | 'partially_fixed';

export interface VerificationGate {
  votingOpen: boolean;
  fixedVotes: number;
  stillBrokenVotes: number;
  partiallyFixedVotes: number;
  totalVotes: number;
  consensusPercentage: number;
  isDisputed: boolean;
  votedUsers: Record<string, VerificationVoteOption>;
}

export interface ComplaintHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  stage: 'reported' | 'verified' | 'assigned' | 'in_progress' | 'resolved' | 'verified_resolution';
  actorName: string;
  actorRole: string;
  department?: string;
  details: string;
  hash: string;
  metadata?: Record<string, any>;
}

export interface Complaint {
  id: string; // e.g. "CT-1001"
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  address: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  ward: string;
  reportedByUserId: string;
  reportedByName: string;
  reportedByIdentifier: string;
  photoUrl: string;
  edpsScore: number;
  edpsBand: PriorityBand;
  edpsExplanation: string;
  upvotes: number;
  upvotedByUserIds: string[];
  createdAt: string;
  updatedAt: string;
  workOrder?: WorkOrder;
  resolutionProof?: ResolutionProof;
  verificationGate?: VerificationGate;
  history: ComplaintHistoryEntry[];
}

export interface CitizenNotification {
  id: string;
  userId: string;
  complaintId: string;
  title: string;
  message: string;
  type: 'status_change' | 'work_order' | 'resolution_proof' | 'verification' | 'escalation';
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actionType:
    | 'gov_profile_approved'
    | 'gov_profile_rejected'
    | 'gov_profile_info_requested'
    | 'work_order_dispatched'
    | 'proof_submitted'
    | 'complaint_verified'
    | 'complaint_reopened'
    | 'user_status_changed'
    | 'category_updated';
  targetId: string;
  targetType: 'user' | 'complaint' | 'work_order' | 'category';
  details: string;
}

export type ViewTab =
  | 'home'
  | 'report'
  | 'track'
  | 'map'
  | 'my_complaints'
  | 'citizen_profile'
  | 'official_dashboard'
  | 'super_admin_dashboard';
