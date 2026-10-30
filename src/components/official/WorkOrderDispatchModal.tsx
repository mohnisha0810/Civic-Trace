import React, { useState } from 'react';
import { X, Wrench, Clock, Building } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { Complaint } from '../../types';

interface WorkOrderDispatchModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkOrderDispatchModal: React.FC<WorkOrderDispatchModalProps> = ({
  complaint,
  isOpen,
  onClose,
}) => {
  const { assignWorkOrder } = useCivicData();

  const [department, setDepartment] = useState('Public Works Department (PWD & Roads)');
  const [contractor, setContractor] = useState('Apex Asphalt Infra Ltd.');
  const [crew, setCrew] = useState('Rapid Response Crew Delta-4');
  const [slaHours, setSlaHours] = useState<number>(24);
  const [instructions, setInstructions] = useState(
    'Hospital route priority: Mill cavity perimeter, apply tack coat, and compact hot-mix asphalt >95% Proctor density.'
  );

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignWorkOrder(complaint.id, {
      department,
      contractor,
      crew,
      slaHours,
      instructions,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-forest/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-softwhite rounded-3xl max-w-lg w-full border border-sage shadow-elevated p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-charcoal-muted hover:text-forest hover:bg-sage/40"
        >
          <X size={20} />
        </button>

        <div className="border-b border-sage/60 pb-3 mb-5">
          <span className="text-[10px] font-bold uppercase text-burnt tracking-wider">
            Municipal Work Order Dispatch
          </span>
          <h2 className="text-base font-bold text-forest">
            Assign Binding Work Order #{complaint.id}
          </h2>
          <p className="text-xs text-charcoal-muted mt-0.5 truncate">{complaint.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-charcoal uppercase tracking-wider">
              Responsible Department
            </label>
            <input
              type="text"
              required
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage font-medium text-charcoal focus:outline-none focus:border-forest"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-charcoal uppercase tracking-wider">
              Authorized Contractor
            </label>
            <input
              type="text"
              required
              value={contractor}
              onChange={e => setContractor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage font-semibold text-charcoal focus:outline-none focus:border-forest"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-charcoal uppercase tracking-wider">
                Assigned Crew
              </label>
              <input
                type="text"
                required
                value={crew}
                onChange={e => setCrew(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage font-medium text-charcoal focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-charcoal uppercase tracking-wider">
                SLA Target (Hours)
              </label>
              <select
                value={slaHours}
                onChange={e => setSlaHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage font-semibold text-charcoal focus:outline-none"
              >
                <option value={12}>12 Hours (Emergency)</option>
                <option value={24}>24 Hours (Critical)</option>
                <option value={48}>48 Hours (High)</option>
                <option value={72}>72 Hours (Medium)</option>
                <option value={168}>168 Hours (Standard)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-charcoal uppercase tracking-wider">
              Dispatch Instructions
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ivory rounded-xl border border-sage font-medium text-charcoal focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-sage/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-softwhite border border-sage text-charcoal hover:bg-ivory rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-burnt hover:bg-burnt-hover text-softwhite rounded-xl font-bold shadow-card transition-all"
            >
              Dispatch Work Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
