import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Building,
  CheckCircle2,
  Phone,
  Briefcase,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { CivicTraceLogo } from '../layout/CivicTraceLogo';
import { useAuth } from '../../context/AuthContext';
import { OrganizationType } from '../../types';
import { ALL_INDIAN_STATES } from '../../lib/indiaGeoService';

export const SignInPage: React.FC = () => {
  const {
    loginWithPassword,
    signupCitizen,
    signupGovernment,
    authError,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [roleTab, setRoleTab] = useState<'citizen' | 'government'>('citizen');

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('Ward 151');

  // Government Fields
  const [department, setDepartment] = useState('Public Works Department (PWD & Roads)');
  const [designation, setDesignation] = useState('Assistant Executive Engineer');
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('Bengaluru Urban');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!identifier.trim()) {
      setFormError('Please enter your email or identifier.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const ok = loginWithPassword(identifier.trim(), password);
        if (!ok) {
          setFormError('Invalid credentials. Check your email or use a demo account.');
        }
      } else {
        if (!name.trim()) {
          setFormError('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }

        if (roleTab === 'citizen') {
          const res = signupCitizen({
            name: name.trim(),
            identifier: identifier.trim(),
            password,
            phone: phone.trim(),
            ward: ward.trim(),
          });
          if (!res.success) {
            setFormError(res.error || 'Registration failed.');
          }
        } else {
          const res = signupGovernment({
            name: name.trim(),
            identifier: identifier.trim(),
            password,
            details: {
              organizationType: 'municipal_corporation',
              organizationName: `${district} Municipal Corporation`,
              department: department.trim(),
              designation: designation.trim(),
              officialEmail: identifier.trim(),
              officialPhone: phone.trim() || '+91 80 2222 1111',
              state,
              district,
              city: district,
            },
          });
          if (!res.success) {
            setFormError(res.error || 'Government account request failed.');
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string, role: 'citizen' | 'government') => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    setMode('signin');
    setRoleTab(role);
    setFormError(null);
    clearError();
    // 1-Click Instant Demo Login
    loginWithPassword(demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Subtle Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <CivicTraceLogo size="lg" showTagline={false} />
          </div>
          <p className="text-xs font-semibold text-teal-800 tracking-wide uppercase">
            Official Municipal Grievance & Resolution Platform
          </p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Sign in to access your neighbourhood ledger, report grievances, and join community action.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-5">
          {/* Sign In vs Register Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setFormError(null);
                clearError();
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signin' ? 'bg-white text-navy shadow-xs' : 'hover:text-navy'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setFormError(null);
                clearError();
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white text-navy shadow-xs' : 'hover:text-navy'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Citizen vs Government Selector (if signing up or filtering) */}
          <div className="flex items-center justify-center gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setRoleTab('citizen')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleTab === 'citizen'
                  ? 'bg-teal-50 text-teal-900 border border-teal-200'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              <User size={13} />
              <span>Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleTab('government')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleTab === 'government'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              <ShieldCheck size={13} className="text-teal-accent" />
              <span>Government Official</span>
            </button>
          </div>

          {/* Error Banner */}
          {(formError || authError) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError || authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'signup' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={roleTab === 'citizen' ? 'e.g. Priya Sundaram' : 'e.g. Anand Verma'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {roleTab === 'government' ? 'Official Government Email *' : 'Email Address *'}
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder={
                    roleTab === 'government'
                      ? 'anand.verma@bbmp.gov.in'
                      : 'priya.sundaram@gmail.com'
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                />
              </div>
            </div>

            {mode === 'signup' && roleTab === 'government' && (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-medium text-xs bg-white"
                    >
                      {ALL_INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-medium text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-navy hover:bg-navy-surface text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{mode === 'signin' ? 'Sign In to CivicTrace' : 'Complete Registration'}</span>
              <ArrowRight size={14} className="text-teal-accent" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
              Quick Demonstration Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  fillDemoAccount('priya.sundaram@gmail.com', 'Citizen123!', 'citizen')
                }
                className="p-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-navy text-[11px] group-hover:text-teal-800">
                  <User size={12} className="text-teal-700" />
                  <span>Citizen Demo</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Priya (Ward 151)
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  fillDemoAccount('anand.verma@bbmp.gov.in', 'GovAdmin2026!', 'government')
                }
                className="p-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-navy text-[11px] group-hover:text-teal-800">
                  <ShieldCheck size={12} className="text-teal-700" />
                  <span>Official Demo</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  AEE Municipal Desk
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Security / Privacy Trust Footer */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-teal-700" />
          <span>Salted SHA-256 Authentication &bull; Tamper-Evident Ledger</span>
        </div>
      </div>
    </div>
  );
};
