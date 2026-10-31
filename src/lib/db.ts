import {
  User,
  Session,
  Complaint,
  AuditLogEntry,
  CitizenNotification,
  GovernmentVerificationStatus,
  CommunityChallenge,
} from '../types';
import { generateSalt, hashPassword } from './cryptoAuth';
import {
  persistComplaintToIndexedDb,
  persistAuditLogToIndexedDb,
  loadAllComplaintsFromIndexedDb,
} from './indexedDbStorage';
import { getInitialSeedComplaints } from './seedComplaints';
import { getInitialSeedChallenges } from './seedChallenges';

const DB_USERS_KEY = 'civictrace_db_users_v4';
const DB_SESSION_KEY = 'civictrace_db_session_v4';
const DB_COMPLAINTS_KEY = 'civictrace_db_complaints_v4';
const DB_CHALLENGES_KEY = 'civictrace_db_challenges_v1';
const DB_OTP_KEY = 'civictrace_db_otps_v4';
const DB_AUDIT_LOGS_KEY = 'civictrace_db_audit_logs_v4';
const DB_NOTIFICATIONS_KEY = 'civictrace_db_notifications_v4';

// -----------------------------------------------------------------------------
// DEFAULT SUPER ADMIN PROVISIONING
// -----------------------------------------------------------------------------
function ensureSuperAdminProvisioned(users: User[]): User[] {
  const hasAdmin = users.some(u => u.role === 'super_admin');
  if (!hasAdmin) {
    const salt = 'c1v1ctr4c3_s4lt_adm1n_2026';
    const passwordHash = hashPassword('AdminCivicTrace2026!', salt);

    const masterAdmin: User = {
      id: 'usr_super_admin_master',
      name: 'Super Admin Directorate',
      identifier: 'admin@civictrace.gov.in',
      identifierType: 'email',
      passwordHash,
      salt,
      role: 'super_admin',
      department: 'Central Grievance Redressal Oversight',
      ward: 'National Command',
      createdAt: new Date().toISOString(),
      isVerified: true,
      bio: 'Authorized National Platform Administrator for CivicTrace Operations.',
    };
    users.push(masterAdmin);
    saveAllUsers(users);

    // Initial audit log
    addAuditLogEntry({
      id: `audit_init_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: masterAdmin.id,
      actorName: masterAdmin.name,
      actorRole: 'super_admin',
      actionType: 'user_status_changed',
      targetId: masterAdmin.id,
      targetType: 'user',
      details: 'Master Super Admin Directorate provisioned for national grievance oversight.',
    });
  }
  return users;
}

// -----------------------------------------------------------------------------
// USER STORAGE
// -----------------------------------------------------------------------------
export function getAllUsers(): User[] {
  try {
    const raw = localStorage.getItem(DB_USERS_KEY);
    const users: User[] = raw ? JSON.parse(raw) : [];
    return ensureSuperAdminProvisioned(users);
  } catch {
    return [];
  }
}

export function saveAllUsers(users: User[]): void {
  try {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist users to database:', err);
  }
}

export function findUserById(id: string): User | undefined {
  const users = getAllUsers();
  return users.find(u => u.id === id);
}

export function findUserByIdentifier(identifier: string): User | undefined {
  const clean = identifier.trim().toLowerCase();
  const users = getAllUsers();
  return users.find(u => u.identifier.trim().toLowerCase() === clean);
}

export function registerUser(user: User): { success: boolean; error?: string } {
  const users = getAllUsers();
  const existing = findUserByIdentifier(user.identifier);
  if (existing) {
    return { success: false, error: 'An account with this email or phone number already exists.' };
  }
  users.push(user);
  saveAllUsers(users);
  return { success: true };
}

export function updateUserProfile(userId: string, updates: Partial<User>): User | null {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;

  users[idx] = { ...users[idx], ...updates };
  saveAllUsers(users);
  return users[idx];
}

export function updateGovernmentVerificationStatus(
  userId: string,
  status: GovernmentVerificationStatus,
  adminId: string,
  notes?: string
): boolean {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;

  const user = users[idx];
  if (!user.governmentProfile) return false;

  user.governmentProfile.verificationStatus = status;
  user.governmentProfile.verificationNotes = notes;
  user.governmentProfile.reviewedByAdminId = adminId;
  user.governmentProfile.reviewedAt = new Date().toISOString();
  user.isVerified = status === 'approved';

  saveAllUsers(users);

  // Dispatch Notification to the government applicant
  addNotification({
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    complaintId: '',
    title: `Government Profile ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Update'}`,
    message: notes || `Your verification status has been updated to: ${status.replace(/_/g, ' ')}.`,
    type: 'escalation',
    read: false,
    createdAt: new Date().toISOString(),
  });

  return true;
}

// -----------------------------------------------------------------------------
// SESSION STORAGE
// -----------------------------------------------------------------------------
export function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(DB_SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearStoredSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(DB_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(DB_SESSION_KEY);
  } catch {
    // ignore
  }
}

// -----------------------------------------------------------------------------
// COMPLAINT STORAGE
// -----------------------------------------------------------------------------
export function getAllComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(DB_COMPLAINTS_KEY);
    if (!raw) {
      const seeds = getInitialSeedComplaints();
      saveAllComplaints(seeds);
      return seeds;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeds = getInitialSeedComplaints();
      saveAllComplaints(seeds);
      return seeds;
    }
    return parsed;
  } catch {
    return getInitialSeedComplaints();
  }
}

export function saveAllComplaints(complaints: Complaint[]): void {
  try {
    localStorage.setItem(DB_COMPLAINTS_KEY, JSON.stringify(complaints));
  } catch (err) {
    console.warn('LocalStorage quota limit reached. Pruning oversized photo data for local cache:', err);
    try {
      const lightweight = complaints.map(c => ({
        ...c,
        photoUrl: c.photoUrl && c.photoUrl.length > 500 ? c.photoUrl.slice(0, 80) + '...[IndexedDB-Backed]' : c.photoUrl,
      }));
      localStorage.setItem(DB_COMPLAINTS_KEY, JSON.stringify(lightweight));
    } catch (innerErr) {
      console.error('Failed to persist cache to localStorage:', innerErr);
    }
  }
}

export function findComplaintById(id: string): Complaint | undefined {
  const complaints = getAllComplaints();
  const cleanId = id.trim().toUpperCase();
  return complaints.find(c => c.id.toUpperCase() === cleanId);
}

export function createComplaint(complaint: Complaint): void {
  const complaints = getAllComplaints();
  complaints.unshift(complaint);
  saveAllComplaints(complaints);

  // Mirror full fidelity complaint to IndexedDB
  persistComplaintToIndexedDb(complaint).catch(err => {
    console.warn('Failed to mirror complaint into IndexedDB:', err);
  });
}

export function updateComplaintRecord(
  id: string,
  updater: (prev: Complaint) => Complaint
): Complaint | null {
  const complaints = getAllComplaints();
  const index = complaints.findIndex(c => c.id.toUpperCase() === id.toUpperCase());
  if (index === -1) return null;

  const updated = updater(complaints[index]);
  complaints[index] = updated;
  saveAllComplaints(complaints);

  // Mirror updated complaint to IndexedDB
  persistComplaintToIndexedDb(updated).catch(err => {
    console.warn('Failed to mirror updated complaint into IndexedDB:', err);
  });
  return updated;
}

export async function syncFromIndexedDb(): Promise<Complaint[]> {
  try {
    const idbComplaints = await loadAllComplaintsFromIndexedDb();
    if (idbComplaints && idbComplaints.length > 0) {
      const local = getAllComplaints();
      const existingIds = new Set(local.map(c => c.id.toUpperCase()));
      let hasNew = false;
      for (const comp of idbComplaints) {
        if (!existingIds.has(comp.id.toUpperCase())) {
          local.push(comp);
          hasNew = true;
        }
      }
      if (hasNew) {
        saveAllComplaints(local);
      }
      return local;
    }
  } catch (err) {
    console.warn('Could not sync from IndexedDB:', err);
  }
  return getAllComplaints();
}

// -----------------------------------------------------------------------------
// COMMUNITY CHALLENGES STORAGE
// -----------------------------------------------------------------------------
export function getAllChallenges(): CommunityChallenge[] {
  try {
    const raw = localStorage.getItem(DB_CHALLENGES_KEY);
    if (!raw) {
      const seeds = getInitialSeedChallenges();
      saveAllChallenges(seeds);
      return seeds;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeds = getInitialSeedChallenges();
      saveAllChallenges(seeds);
      return seeds;
    }
    return parsed;
  } catch {
    return getInitialSeedChallenges();
  }
}

export function saveAllChallenges(challenges: CommunityChallenge[]): void {
  try {
    localStorage.setItem(DB_CHALLENGES_KEY, JSON.stringify(challenges));
  } catch (err) {
    console.error('Failed to save challenges:', err);
  }
}

export function findChallengeById(id: string): CommunityChallenge | undefined {
  const challenges = getAllChallenges();
  const cleanId = id.trim().toUpperCase();
  return challenges.find((c) => c.id.toUpperCase() === cleanId);
}

export function updateChallengeRecord(
  id: string,
  updater: (prev: CommunityChallenge) => CommunityChallenge
): CommunityChallenge | null {
  const challenges = getAllChallenges();
  const index = challenges.findIndex((c) => c.id.toUpperCase() === id.trim().toUpperCase());
  if (index === -1) return null;

  const updated = updater(challenges[index]);
  challenges[index] = updated;
  saveAllChallenges(challenges);
  return updated;
}

// -----------------------------------------------------------------------------
// AUDIT LOGS STORAGE
// -----------------------------------------------------------------------------
export function getAllAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(DB_AUDIT_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addAuditLogEntry(entry: AuditLogEntry): void {
  try {
    const logs = getAllAuditLogs();
    logs.unshift(entry);
    localStorage.setItem(DB_AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));

    // Mirror audit log to IndexedDB
    persistAuditLogToIndexedDb(entry).catch(err => {
      console.warn('Failed to mirror audit log to IndexedDB:', err);
    });
  } catch (err) {
    console.error('Failed to save audit log:', err);
  }
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS STORAGE
// -----------------------------------------------------------------------------
export function getAllNotifications(): CitizenNotification[] {
  try {
    const raw = localStorage.getItem(DB_NOTIFICATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getUserNotifications(userId: string): CitizenNotification[] {
  return getAllNotifications().filter(n => n.userId === userId);
}

export function addNotification(notification: CitizenNotification): void {
  try {
    const notifs = getAllNotifications();
    notifs.unshift(notification);
    localStorage.setItem(DB_NOTIFICATIONS_KEY, JSON.stringify(notifs.slice(0, 200)));
  } catch (err) {
    console.error('Failed to save notification:', err);
  }
}

export function markNotificationAsRead(id: string): void {
  try {
    const notifs = getAllNotifications();
    const target = notifs.find(n => n.id === id);
    if (target) {
      target.read = true;
      localStorage.setItem(DB_NOTIFICATIONS_KEY, JSON.stringify(notifs));
    }
  } catch {
    // ignore
  }
}

// -----------------------------------------------------------------------------
// OTP VERIFICATION STORAGE
// -----------------------------------------------------------------------------
export interface OtpRecord {
  identifier: string;
  code: string;
  expiresAt: number;
}

export function generateAndStoreOtp(identifier: string): { code: string; isSimulatedNotice: string } {
  const clean = identifier.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  try {
    const raw = localStorage.getItem(DB_OTP_KEY);
    const otps: Record<string, OtpRecord> = raw ? JSON.parse(raw) : {};
    otps[clean] = { identifier: clean, code, expiresAt };
    localStorage.setItem(DB_OTP_KEY, JSON.stringify(otps));
  } catch {
    // ignore
  }

  return {
    code,
    isSimulatedNotice:
      'Notice: External SMS/Email gateway is not configured. For testing and security verification, your 6-digit authorization code is generated directly on-screen.',
  };
}

export function verifyStoredOtp(identifier: string, code: string): boolean {
  const clean = identifier.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(DB_OTP_KEY);
    if (!raw) return false;
    const otps: Record<string, OtpRecord> = JSON.parse(raw);
    const record = otps[clean];
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      delete otps[clean];
      localStorage.setItem(DB_OTP_KEY, JSON.stringify(otps));
      return false;
    }

    if (record.code === code.trim()) {
      delete otps[clean];
      localStorage.setItem(DB_OTP_KEY, JSON.stringify(otps));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
