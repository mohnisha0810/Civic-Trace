import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Lock,
  Edit3,
  FileText,
  PlusCircle,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCivicData } from '../../context/CivicDataContext';
import { getUserNotifications, markNotificationAsRead } from '../../lib/db';

interface CitizenProfileViewProps {
  onOpenReportModal: () => void;
}

export const CitizenProfileView: React.FC<CitizenProfileViewProps> = ({
  onOpenReportModal,
}) => {
  const { currentUser, updateProfile } = useAuth();
  const { complaints, setActiveTab, setSelectedComplaintId } = useCivicData();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [ward, setWard] = useState(currentUser?.ward || 'Central Zone');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Notifications for this citizen
  const notifications = currentUser ? getUserNotifications(currentUser.id) : [];

  // Complaints filed by this citizen
  const userComplaints = complaints.filter(
    c => c.reportedByUserId === currentUser?.id || c.reportedByIdentifier === currentUser?.identifier
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      ward: ward.trim(),
      bio: bio.trim(),
    });
    if (ok) {
      setIsEditing(false);
      setSaveNotice('Profile successfully updated.');
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  const handleNotificationClick = (complaintId: string, notifId: string) => {
    markNotificationAsRead(notifId);
    if (complaintId) {
      setSelectedComplaintId(complaintId);
      setActiveTab('track');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 text-xs">
      {/* Profile Header */}
      <div className="bg-softwhite rounded-3xl p-6 sm:p-8 border border-sage shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-forest text-softwhite text-xl font-bold flex items-center justify-center shadow-card">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-forest">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Verified Citizen</span>
              </span>
            </div>
            <div className="text-charcoal-muted text-[11px] mt-0.5 flex flex-wrap items-center gap-3">
              <span>{currentUser.identifier}</span>
              <span>•</span>
              <span>{currentUser.ward || 'Central Zone'}</span>
              <span>•</span>
              <span>Member since {new Date(currentUser.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-ivory hover:bg-sage/40 border border-sage rounded-xl font-bold text-forest transition-colors flex items-center gap-1.5"
          >
            <Edit3 size={14} />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="px-4 py-2 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold shadow-card transition-all flex items-center gap-1.5"
          >
            <PlusCircle size={14} className="text-burnt" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-sage border border-forest/30 rounded-2xl text-forest font-bold">
          {saveNotice}
        </div>
      )}

      {/* Editing Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-softwhite rounded-3xl p-6 border border-sage shadow-card space-y-4">
          <h2 className="text-sm font-bold text-forest">Edit Citizen Profile & Contact Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-forest block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Mobile Contact</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Residential Ward / Locality</label>
              <input
                type="text"
                value={ward}
                onChange={e => setWard(e.target.value)}
                placeholder="Ward 12 - Central Zone"
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="font-bold text-forest block mb-1">Civic Bio / Community Notes</label>
              <input
                type="text"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Active neighborhood volunteer..."
                className="w-full px-3.5 py-2 bg-ivory rounded-xl border border-sage text-charcoal focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold shadow-card flex items-center gap-1.5 transition-all"
          >
            <Save size={14} />
            <span>Save Profile Updates</span>
          </button>
        </form>
      )}

      {/* Grid: Notifications & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Genuine Notifications Feed */}
        <div className="lg:col-span-6 bg-softwhite rounded-3xl p-6 border border-sage shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-sage/60 pb-3">
            <h2 className="font-bold text-forest text-sm flex items-center gap-2">
              <Bell size={16} className="text-burnt" />
              <span>Grievance Updates & Notifications</span>
            </h2>
            <span className="font-mono text-[10px] font-bold text-burnt px-2 py-0.5 bg-peach rounded-full">
              {notifications.filter(n => !n.read).length} Unread
            </span>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.complaintId, notif.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-ivory border-sage/80 opacity-80'
                      : 'bg-peach/30 border-burnt/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-forest">{notif.title}</span>
                    <span className="text-[10px] text-charcoal-muted font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal mt-1 leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-charcoal-muted space-y-1">
              <Bell size={20} className="text-forest/40 mx-auto" />
              <p>No notifications yet. Status updates on your filed complaints will appear here.</p>
            </div>
          )}
        </div>

        {/* My Filed Complaints Summary */}
        <div className="lg:col-span-6 bg-softwhite rounded-3xl p-6 border border-sage shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-sage/60 pb-3">
            <h2 className="font-bold text-forest text-sm flex items-center gap-2">
              <FileText size={16} className="text-forest" />
              <span>My Filed Grievances ({userComplaints.length})</span>
            </h2>
            <button
              onClick={() => setActiveTab('my_complaints')}
              className="text-[11px] font-bold text-forest hover:text-burnt"
            >
              View All
            </button>
          </div>

          {userComplaints.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userComplaints.slice(0, 4).map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedComplaintId(c.id);
                    setActiveTab('track');
                  }}
                  className="p-3.5 bg-ivory rounded-2xl border border-sage hover:border-forest/40 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-forest">#{c.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sage text-forest">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="font-bold text-forest line-clamp-1">{c.title}</div>
                  <div className="text-[11px] text-charcoal-muted truncate">{c.address}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-charcoal-muted space-y-2">
              <FileText size={20} className="text-forest/40 mx-auto" />
              <p>You haven't filed any complaints yet.</p>
              <button
                onClick={onOpenReportModal}
                className="px-4 py-2 bg-forest text-softwhite rounded-xl font-bold text-xs"
              >
                File Your First Complaint
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
