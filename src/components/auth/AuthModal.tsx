import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building,
  Briefcase,
  MapPin,
  FileText,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OrganizationType } from '../../types';
import { ALL_INDIAN_STATES } from '../../lib/indiaGeoService';
import { findUserByIdentifier, updateUserProfile } from '../../lib/db';
import { generateSalt, hashPassword } from '../../lib/cryptoAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'citizen' | 'government' | 'admin';
}

const ORG_TYPES: { id: OrganizationType; label: string }[] = [
  { id: 'municipal_corporation', label: 'Municipal Corporation (e.g. MCD, BMC, BBMP)' },
  { id: 'municipality', label: 'Municipality / Municipal Council' },
  { id: 'state_government', label: 'State Government Department' },
  { id: 'central_government', label: 'Central Government Agency' },
  { id: 'union_territory', label: 'Union Territory Administration' },
  { id: 'panchayat', label: 'Panchayati Raj Institution' },
  { id: 'directorate', label: 'Directorate / Executive Board' },
  { id: 'other', label: 'Other Statutory Civic Body' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'citizen',
}) => {
  const {
    loginWithPassword,
    signupCitizen,
    signupGovernment,
    authError,
    clearError,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'citizen' | 'government' | 'admin'>(defaultTab);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');

  // Common Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password Reset Fields
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Government Specific Registration Fields
  const [orgType, setOrgType] = useState<OrganizationType>('municipal_corporation');
  const [orgName, setOrgName] = useState('');
  const [state, setState] = useState('Delhi');
  const [district, setDistrict] = useState('New Delhi');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('Public Works Department (PWD & Roads)');
  const [designation, setDesignation] = useState('Executive Engineer');
  const [officialPhone, setOfficialPhone] = useState('');

  if (!isOpen) return null;

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    const ok = loginWithPassword(identifier.trim(), password);
    if (ok) {
      onClose();
    }
  };

  const handleCitizenSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const res = signupCitizen({
      name,
      identifier,
      password,
      phone,
      ward: district,
    });
    if (res.success) {
      onClose();
    }
  };

  const handleGovernmentSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const res = signupGovernment({
      name,
      identifier,
      password,
      details: {
        organizationType: orgType,
        organizationName: orgName || 'Municipal Authority',
        state,
        district,
        city: city || district,
        department,
        designation,
        officialEmail: identifier,
        officialPhone: officialPhone || '9876543210',
        jurisdictionBoundary: {
          state,
          district,
          city: city || district,
        },
      },
    });
    if (res.success) {
      onClose();
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim() || 'admin@civictrace.gov.in';
    const cleanPass = password || 'AdminCivicTrace2026!';
    const ok = loginWithPassword(cleanId, cleanPass);
    if (ok) {
      onClose();
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    const user = findUserByIdentifier(resetEmail);
    if (!user) {
      setResetMessage('No account found with this email address.');
      return;
    }
    if (newPassword.length < 6) {
      setResetMessage('New password must be at least 6 characters long.');
      return;
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(newPassword, salt);
    updateUserProfile(user.id, { passwordHash, salt });

    setResetMessage('Password successfully updated. You can now sign in.');
    setTimeout(() => {
      setAuthMode('login');
      setIdentifier(resetEmail);
      setResetMessage(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-forest/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-softwhite rounded-3xl max-w-lg w-full border border-sage shadow-elevated overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative my-6 text-xs">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-charcoal-muted hover:text-forest hover:bg-sage/40 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 3 Profile Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-ivory p-1 rounded-2xl border border-sage mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('citizen');
              setAuthMode('login');
              clearError();
            }}
            className={`py-2 px-2 rounded-xl font-bold transition-all ${
              activeTab === 'citizen'
                ? 'bg-softwhite text-forest shadow-xs'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('government');
              setAuthMode('login');
              clearError();
            }}
            className={`py-2 px-2 rounded-xl font-bold transition-all ${
              activeTab === 'government'
                ? 'bg-softwhite text-forest shadow-xs'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Government
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setAuthMode('login');
              clearError();
            }}
            className={`py-2 px-2 rounded-xl font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-forest text-softwhite shadow-xs'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            Super Admin
          </button>
        </div>

        {/* Login vs Signup Sub-Tab (Except for Admin) */}
        {activeTab !== 'admin' && authMode !== 'reset' && (
          <div className="flex border-b border-sage/60 mb-5">
            <button
              onClick={() => {
                setAuthMode('login');
                clearError();
              }}
              className={`flex-1 pb-2.5 font-bold text-center transition-all relative ${
                authMode === 'login' ? 'text-forest' : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <span>Sign In</span>
              {authMode === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                clearError();
              }}
              className={`flex-1 pb-2.5 font-bold text-center transition-all relative ${
                authMode === 'signup' ? 'text-forest' : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              <span>{activeTab === 'government' ? 'Apply for Govt Account' : 'Create Citizen Account'}</span>
              {authMode === 'signup' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest rounded-full" />
              )}
            </button>
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div className="mb-4 p-3 bg-peach/70 border border-burnt/40 rounded-xl text-burnt flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 1: SUPER ADMIN PORTAL                                         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="p-3 bg-forest/5 rounded-2xl border border-forest/20 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-forest">
                <ShieldAlert size={14} className="text-burnt" />
                <span>Super Admin Directorate Login</span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                Restricted access for national grievance redressal officers.
              </p>
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Administrative Email</label>
              <input
                type="email"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="admin@civictrace.gov.in"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Master Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold shadow-card transition-all"
            >
              Sign In as Super Admin
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 2: CITIZEN / GOV LOGIN (EMAIL + PASSWORD)                     */}
        {/* ------------------------------------------------------------------ */}
        {activeTab !== 'admin' && authMode === 'login' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5">
            <div>
              <label className="font-bold text-forest block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-forest">Password</label>
                <button
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className="text-[11px] text-burnt hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold shadow-card transition-all"
            >
              Sign In
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 3: CITIZEN SIGNUP                                             */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'citizen' && authMode === 'signup' && (
          <form onSubmit={handleCitizenSignup} className="space-y-3.5">
            <div>
              <label className="font-bold text-forest block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="aarav@example.com"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Mobile Contact (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Create Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold shadow-card transition-all"
            >
              Register Citizen Profile
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 4: GOVERNMENT PROFILE APPLICATION                             */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'government' && authMode === 'signup' && (
          <form onSubmit={handleGovernmentSignup} className="space-y-3.5">
            <div className="p-3 bg-peach/40 rounded-xl border border-burnt/30 text-[11px] text-burnt">
              Notice: Government accounts require administrative review and verification before full operational management is granted.
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Official Representative Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Eng. Rajesh Verma"
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Official Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="Lead Executive Engineer"
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Organization Category</label>
              <select
                value={orgType}
                onChange={e => setOrgType(e.target.value as OrganizationType)}
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              >
                {ORG_TYPES.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Organization / Authority Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="Municipal Corporation of Delhi (MCD)"
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-forest block mb-1">State / UT</label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-ivory rounded-xl border border-sage text-charcoal text-[11px] focus:outline-none focus:border-forest"
                >
                  {ALL_INDIAN_STATES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-forest block mb-1">District / Jurisdiction</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="New Delhi / Central"
                  className="w-full px-3 py-2 bg-ivory rounded-xl border border-sage text-charcoal text-[11px] focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Assigned Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="Public Works Department (PWD & Roads)"
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-forest block mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="rajesh.verma@pwd.gov.in"
                  className="w-full px-3 py-2 bg-ivory rounded-xl border border-sage text-charcoal text-[11px] focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="font-bold text-forest block mb-1">Official Phone</label>
                <input
                  type="tel"
                  required
                  value={officialPhone}
                  onChange={e => setOfficialPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 bg-ivory rounded-xl border border-sage text-charcoal text-[11px] focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Account Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create secure password"
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold shadow-card transition-all"
            >
              Submit Application for Verification
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 5: PASSWORD RESET                                             */}
        {/* ------------------------------------------------------------------ */}
        {authMode === 'reset' && (
          <form onSubmit={handlePasswordReset} className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-sage/60 pb-2">
              <span className="font-bold text-forest">Reset Password</span>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-burnt hover:underline text-[11px]"
              >
                Back to Sign In
              </button>
            </div>

            {resetMessage && (
              <div className="p-3 bg-sage border border-forest/30 rounded-xl text-forest font-semibold">
                {resetMessage}
              </div>
            )}

            <div>
              <label className="font-bold text-forest block mb-1">Account Email</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold shadow-card transition-all"
            >
              Update Password & Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
