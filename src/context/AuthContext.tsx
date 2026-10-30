import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Session,
  UserRole,
  GovernmentProfileDetails,
  GovernmentVerificationStatus,
} from '../types';
import {
  getAllUsers,
  findUserByIdentifier,
  registerUser,
  getStoredSession,
  saveSession,
  clearStoredSession,
  findUserById,
  generateAndStoreOtp,
  verifyStoredOtp,
  updateGovernmentVerificationStatus,
  updateUserProfile,
  addAuditLogEntry,
} from '../lib/db';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateSessionToken,
} from '../lib/cryptoAuth';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  allUsers: User[];
  isGovernmentApproved: boolean;
  loginWithPassword: (identifier: string, password: string) => boolean;
  requestOtp: (identifier: string) => { success: boolean; message: string; code?: string };
  loginWithOtp: (identifier: string, code: string) => boolean;
  signupCitizen: (params: {
    name: string;
    identifier: string;
    password: string;
    phone?: string;
    ward?: string;
  }) => { success: boolean; error?: string };
  signupGovernment: (params: {
    name: string;
    identifier: string;
    password: string;
    details: Omit<GovernmentProfileDetails, 'verificationStatus'>;
  }) => { success: boolean; error?: string };
  updateProfile: (updates: Partial<User>) => boolean;
  approveGovernmentApplicant: (userId: string, notes?: string) => boolean;
  rejectGovernmentApplicant: (userId: string, reason: string) => boolean;
  requestMoreInfoGovernmentApplicant: (userId: string, requestText: string) => boolean;
  logout: () => void;
  clearError: () => void;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshUsers = () => {
    const list = getAllUsers();
    setAllUsers(list);
    if (currentUser) {
      const refreshed = list.find(u => u.id === currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
    }
  };

  // Restore persistent session on initial mount
  useEffect(() => {
    try {
      const list = getAllUsers();
      setAllUsers(list);

      const session = getStoredSession();
      if (session) {
        const user = findUserById(session.userId);
        if (user) {
          setCurrentUser(user);
        } else {
          clearStoredSession();
        }
      }
    } catch (err) {
      console.error('Session restoration error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = () => setAuthError(null);

  const isGovernmentApproved =
    currentUser?.role === 'government' || currentUser?.role === 'official'
      ? currentUser.governmentProfile?.verificationStatus === 'approved' || currentUser.isVerified === true
      : false;

  const loginWithPassword = (identifier: string, password: string): boolean => {
    setAuthError(null);
    const user = findUserByIdentifier(identifier);
    if (!user) {
      setAuthError('No account found with this email or phone number. Please register.');
      return false;
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      setAuthError('Incorrect password. Please verify credentials and try again.');
      return false;
    }

    // Create session (valid for 7 days)
    const session: Session = {
      token: generateSessionToken(),
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    saveSession(session);
    setCurrentUser(user);
    refreshUsers();
    return true;
  };

  const requestOtp = (identifier: string): { success: boolean; message: string; code?: string } => {
    setAuthError(null);
    const clean = identifier.trim();
    if (!clean) {
      setAuthError('Please enter a valid email address or phone number.');
      return { success: false, message: 'Invalid identifier.' };
    }

    const { code, isSimulatedNotice } = generateAndStoreOtp(clean);
    return {
      success: true,
      message: isSimulatedNotice,
      code,
    };
  };

  const loginWithOtp = (identifier: string, code: string): boolean => {
    setAuthError(null);
    const isValid = verifyStoredOtp(identifier, code);
    if (!isValid) {
      setAuthError('Invalid or expired 6-digit verification code. Please request a new one.');
      return false;
    }

    let user = findUserByIdentifier(identifier);
    if (!user) {
      // Auto-create citizen account for OTP user
      const isEmail = identifier.includes('@');
      const salt = generateSalt();
      const defaultPasswordHash = hashPassword(code, salt);
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: isEmail ? identifier.split('@')[0] : `Citizen ${identifier.slice(-4)}`,
        identifier: identifier.trim().toLowerCase(),
        identifierType: isEmail ? 'email' : 'phone',
        passwordHash: defaultPasswordHash,
        salt,
        role: 'citizen',
        ward: 'Central Zone',
        createdAt: new Date().toISOString(),
        isVerified: true,
      };
      registerUser(newUser);
      user = newUser;
    }

    const session: Session = {
      token: generateSessionToken(),
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    saveSession(session);
    setCurrentUser(user);
    refreshUsers();
    return true;
  };

  const signupCitizen = (params: {
    name: string;
    identifier: string;
    password: string;
    phone?: string;
    ward?: string;
  }): { success: boolean; error?: string } => {
    setAuthError(null);
    const cleanIdentifier = params.identifier.trim().toLowerCase();
    const isEmail = cleanIdentifier.includes('@');

    const salt = generateSalt();
    const passwordHash = hashPassword(params.password, salt);

    const newUser: User = {
      id: `usr_cit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: params.name.trim(),
      identifier: cleanIdentifier,
      identifierType: isEmail ? 'email' : 'phone',
      phone: params.phone || (isEmail ? undefined : cleanIdentifier),
      email: isEmail ? cleanIdentifier : undefined,
      passwordHash,
      salt,
      role: 'citizen',
      ward: params.ward || 'Central Zone',
      createdAt: new Date().toISOString(),
      isVerified: true,
    };

    const res = registerUser(newUser);
    if (!res.success) {
      setAuthError(res.error || 'Failed to create citizen account.');
      return res;
    }

    const session: Session = {
      token: generateSessionToken(),
      userId: newUser.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    saveSession(session);
    setCurrentUser(newUser);
    refreshUsers();
    return { success: true };
  };

  const signupGovernment = (params: {
    name: string;
    identifier: string;
    password: string;
    details: Omit<GovernmentProfileDetails, 'verificationStatus'>;
  }): { success: boolean; error?: string } => {
    setAuthError(null);
    const cleanIdentifier = params.identifier.trim().toLowerCase();
    const isEmail = cleanIdentifier.includes('@');

    const salt = generateSalt();
    const passwordHash = hashPassword(params.password, salt);

    const govProfile: GovernmentProfileDetails = {
      ...params.details,
      verificationStatus: 'pending_verification',
    };

    const newUser: User = {
      id: `usr_gov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: params.name.trim(),
      identifier: cleanIdentifier,
      identifierType: isEmail ? 'email' : 'phone',
      email: cleanIdentifier,
      phone: params.details.officialPhone,
      passwordHash,
      salt,
      role: 'government',
      department: params.details.department,
      ward: params.details.district,
      governmentProfile: govProfile,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    const res = registerUser(newUser);
    if (!res.success) {
      setAuthError(res.error || 'Failed to submit government application.');
      return res;
    }

    // Record audit entry
    addAuditLogEntry({
      id: `audit_gov_reg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: newUser.id,
      actorName: newUser.name,
      actorRole: 'government',
      actionType: 'user_status_changed',
      targetId: newUser.id,
      targetType: 'user',
      details: `Government profile application submitted by ${newUser.name} (${params.details.organizationName}, ${params.details.department}). Status: Pending Verification.`,
    });

    const session: Session = {
      token: generateSessionToken(),
      userId: newUser.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    saveSession(session);
    setCurrentUser(newUser);
    refreshUsers();
    return { success: true };
  };

  const updateProfile = (updates: Partial<User>): boolean => {
    if (!currentUser) return false;
    const updated = updateUserProfile(currentUser.id, updates);
    if (updated) {
      setCurrentUser(updated);
      refreshUsers();
      return true;
    }
    return false;
  };

  // Super Admin actions
  const approveGovernmentApplicant = (userId: string, notes?: string): boolean => {
    if (currentUser?.role !== 'super_admin') return false;
    const ok = updateGovernmentVerificationStatus(
      userId,
      'approved',
      currentUser.id,
      notes || 'Government credentials verified against administrative registry.'
    );
    if (ok) {
      addAuditLogEntry({
        id: `audit_appr_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: 'super_admin',
        actionType: 'gov_profile_approved',
        targetId: userId,
        targetType: 'user',
        details: `Government profile approved for user ${userId}. Official privileges activated. Notes: ${notes || 'Approved'}`,
      });
      refreshUsers();
    }
    return ok;
  };

  const rejectGovernmentApplicant = (userId: string, reason: string): boolean => {
    if (currentUser?.role !== 'super_admin') return false;
    const ok = updateGovernmentVerificationStatus(userId, 'rejected', currentUser.id, reason);
    if (ok) {
      addAuditLogEntry({
        id: `audit_rej_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: 'super_admin',
        actionType: 'gov_profile_rejected',
        targetId: userId,
        targetType: 'user',
        details: `Government profile rejected for user ${userId}. Reason: ${reason}`,
      });
      refreshUsers();
    }
    return ok;
  };

  const requestMoreInfoGovernmentApplicant = (userId: string, requestText: string): boolean => {
    if (currentUser?.role !== 'super_admin') return false;
    const ok = updateGovernmentVerificationStatus(
      userId,
      'more_info_required',
      currentUser.id,
      requestText
    );
    if (ok) {
      addAuditLogEntry({
        id: `audit_info_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: 'super_admin',
        actionType: 'gov_profile_info_requested',
        targetId: userId,
        targetType: 'user',
        details: `Additional verification documents requested for user ${userId}: ${requestText}`,
      });
      refreshUsers();
    }
    return ok;
  };

  const logout = (): void => {
    clearStoredSession();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        authError,
        allUsers,
        isGovernmentApproved,
        loginWithPassword,
        requestOtp,
        loginWithOtp,
        signupCitizen,
        signupGovernment,
        updateProfile,
        approveGovernmentApplicant,
        rejectGovernmentApplicant,
        requestMoreInfoGovernmentApplicant,
        logout,
        clearError,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
