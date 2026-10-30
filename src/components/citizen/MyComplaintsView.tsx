import React from 'react';
import { FileText, MapPin, ArrowRight, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';

interface MyComplaintsViewProps {
  onOpenReportModal: () => void;
}

export const MyComplaintsView: React.FC<MyComplaintsViewProps> = ({ onOpenReportModal }) => {
  const { complaints, setActiveTab, setSelectedComplaintId } = useCivicData();
  const { currentUser } = useAuth();

  const userComplaints = complaints.filter(
    c => c.reportedByUserId === currentUser?.id || c.reportedByIdentifier === currentUser?.identifier
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="bg-softwhite rounded-2xl p-6 border border-sage shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-burnt uppercase tracking-wider">
            Citizen Grievance Portfolio
          </span>
          <h1 className="text-xl font-bold text-forest">My Reported Complaints</h1>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Track real progress, municipal work orders, and citizen verification for issues you filed.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card transition-all self-start sm:self-auto"
        >
          <PlusCircle size={15} className="text-burnt" />
          <span>Report Another Issue</span>
        </button>
      </div>

      {userComplaints.length > 0 ? (
        <div className="space-y-3">
          {userComplaints.map(complaint => (
            <div
              key={complaint.id}
              onClick={() => {
                setSelectedComplaintId(complaint.id);
                setActiveTab('track');
              }}
              className="bg-softwhite rounded-2xl p-5 border border-sage hover:border-forest/40 shadow-card hover:shadow-elevated transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-ivory border border-sage text-forest">
                    #{complaint.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      complaint.edpsBand === 'critical'
                        ? 'bg-peach text-burnt'
                        : complaint.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sage text-forest'
                    }`}
                  >
                    Score {complaint.edpsScore} • {complaint.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-forest truncate">{complaint.title}</h3>

                <div className="flex items-center gap-1.5 text-xs text-charcoal-muted">
                  <MapPin size={12} className="text-forest flex-shrink-0" />
                  <span className="truncate">{complaint.address}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                <span className="text-charcoal-muted">+{complaint.upvotes} upvotes</span>
                <span className="font-bold text-forest hover:text-burnt flex items-center gap-1">
                  <span>Track Live</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-softwhite rounded-3xl p-12 border border-sage shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sage flex items-center justify-center text-forest mx-auto">
            <FileText size={22} className="text-forest" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-forest">You Haven't Reported Any Issues Yet</h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              Any public defect you file with geotagged photos will be tracked here from intake to verified closure.
            </p>
          </div>
          <button
            onClick={onOpenReportModal}
            className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card transition-all"
          >
            File Your First Grievance
          </button>
        </div>
      )}
    </div>
  );
};
