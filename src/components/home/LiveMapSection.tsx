import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import {
  MapPin,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  ShieldCheck,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../../types';
import { ALL_INDIAN_STATES } from '../../lib/indiaGeoService';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';
import { calculateResolutionEstimate, ResolutionEstimate } from '../../lib/resolutionEstimates';

// Status-to-color mapping for map pins
export function getComplaintPinColor(status: ComplaintStatus): { hex: string; label: string; textClass: string } {
  if (status === 'verified' || status === 'resolved') {
    return { hex: '#10B981', label: 'Resolved', textClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (status === 'awaiting_verification' || status === 'disputed') {
    return { hex: '#7C3AED', label: 'Awaiting Verification', textClass: 'text-purple-700 bg-purple-50 border-purple-200' };
  }
  if (status === 'in_progress' || status === 'assigned' || status === 'reopened') {
    return { hex: '#2563EB', label: 'In Progress', textClass: 'text-blue-700 bg-blue-50 border-blue-200' };
  }
  return { hex: '#F59E0B', label: 'Reported', textClass: 'text-amber-800 bg-amber-50 border-amber-200' };
}

export const LiveMapSection: React.FC = () => {
  const { complaints, setActiveTab, setSelectedComplaintId } = useCivicData();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [activePinComplaint, setActivePinComplaint] = useState<Complaint | null>(
    complaints.length > 0 ? complaints[0] : null
  );

  // Filtered Complaints
  const filteredComplaints = complaints.filter((c) => {
    if (selectedState !== 'all' && c.state !== selectedState) return false;
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;

    if (selectedStatus === 'reported') {
      if (c.status !== 'submitted' && c.status !== 'verified_intake') return false;
    } else if (selectedStatus === 'in_progress') {
      if (c.status !== 'in_progress' && c.status !== 'assigned' && c.status !== 'reopened') return false;
    } else if (selectedStatus === 'awaiting_verification') {
      if (c.status !== 'awaiting_verification' && c.status !== 'disputed') return false;
    } else if (selectedStatus === 'resolved') {
      if (c.status !== 'resolved' && c.status !== 'verified') return false;
    }

    return true;
  });

  // Keep active pin synced if current active complaint is filtered out
  useEffect(() => {
    if (activePinComplaint) {
      const stillVisible = filteredComplaints.some((c) => c.id === activePinComplaint.id);
      if (!stillVisible && filteredComplaints.length > 0) {
        setActivePinComplaint(filteredComplaints[0]);
      }
    } else if (filteredComplaints.length > 0) {
      setActivePinComplaint(filteredComplaints[0]);
    }
  }, [filteredComplaints, activePinComplaint]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    markersLayerRef.current = layer;
    mapInstanceRef.current = map;

    // Ensure map tiles recalculate bounds properly on container mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers with Status Color Coding
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    if (filteredComplaints.length === 0) return;

    filteredComplaints.forEach((c) => {
      const { hex } = getComplaintPinColor(c.status);
      const isSelected = activePinComplaint?.id === c.id;

      const customIcon = L.divIcon({
        className: 'civictrace-pin-marker',
        html: `
          <div style="
            background-color: ${hex};
            color: #FFFFFF;
            width: ${isSelected ? '36px' : '30px'};
            height: ${isSelected ? '36px' : '30px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
            font-weight: 800;
            font-size: 11px;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.35);
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            ${isSelected ? 'transform: scale(1.15); ring: 4px rgba(15, 58, 54, 0.25);' : ''}
          ">
            ${c.edpsScore}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([c.latitude, c.longitude], { icon: customIcon });

      // Click updates the side panel in-place WITHOUT navigating away
      marker.on('click', () => {
        setActivePinComplaint(c);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([c.latitude, c.longitude], 13, { duration: 0.8 });
        }
      });

      marker.addTo(layer);
    });

    // Auto-center on points
    if (filteredComplaints.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(filteredComplaints.map((c) => [c.latitude, c.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [filteredComplaints, activePinComplaint]);

  // Compute estimate for selected pin complaint
  const activeEstimate: ResolutionEstimate | null = activePinComplaint
    ? calculateResolutionEstimate(activePinComplaint)
    : null;

  return (
    <section className="p-4 sm:p-6 w-full space-y-6">
      {/* Top Header & Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            Interactive Neighbourhood Digital Twin
          </span>
          <h2 className="text-2xl font-black text-navy tracking-tight mt-0.5">
            Live India Civic Map
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Real-time coordinates of reported municipal defects, dispatch status, and verified repairs.
          </p>
        </div>

        {/* Status Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Status Pins:</span>
          <span className="flex items-center gap-1.5 text-amber-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Reported</span>
          </span>
          <span className="flex items-center gap-1.5 text-blue-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <span>In Progress</span>
          </span>
          <span className="flex items-center gap-1.5 text-purple-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            <span>Awaiting Audit</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>Resolved</span>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-200/90 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-navy">
          <Filter size={14} className="text-teal-700" />
          <span>Filters:</span>
        </div>

        {/* State Filter */}
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-slate-800 font-semibold text-xs focus:outline-none focus:border-teal-600 transition-colors shadow-xs"
        >
          <option value="all">All States & UTs</option>
          {ALL_INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-slate-800 font-semibold text-xs focus:outline-none focus:border-teal-600 transition-colors shadow-xs"
        >
          <option value="all">All Categories</option>
          <option value="road_damage">Roads & Potholes</option>
          <option value="drainage_sewage">Drainage & Sewage</option>
          <option value="streetlight_electrical">Streetlights & Electrical</option>
          <option value="water_supply">Water Supply</option>
          <option value="garbage_waste">Waste Management</option>
          <option value="traffic_signals">Traffic & Signals</option>
          <option value="public_infrastructure">Public Infrastructure</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-slate-800 font-semibold text-xs focus:outline-none focus:border-teal-600 transition-colors shadow-xs"
        >
          <option value="all">All Progression Stages</option>
          <option value="reported">Reported / Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_verification">Awaiting Verification</option>
          <option value="resolved">Resolved / Verified</option>
        </select>

        <span className="ml-auto text-[11px] font-mono font-bold text-slate-500">
          Showing {filteredComplaints.length} Coordinates
        </span>
      </div>

      {/* Main Grid: Interactive Map + In-Place Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[540px]">
        {/* Map Canvas */}
        <div className="lg:col-span-8 h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {filteredComplaints.length === 0 && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-2 z-20">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                <MapPin size={24} className="text-teal-600" />
              </div>
              <h3 className="text-sm font-bold text-navy">No Issues Match Filters</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Try selecting "All States" or clearing filters to view active civic incidents.
              </p>
            </div>
          )}
        </div>

        {/* In-Place Marker Detail Card (Does NOT navigate away) */}
        <div className="lg:col-span-4 h-full bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between overflow-y-auto text-xs space-y-4">
          <AnimatePresence mode="wait">
            {activePinComplaint ? (
              <motion.div
                key={activePinComplaint.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 flex flex-col justify-between h-full"
              >
                <div className="space-y-3">
                  {/* Top Bar: ID & Status Badge */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-mono font-black text-navy text-sm">
                      #{activePinComplaint.id}
                    </span>
                    {(() => {
                      const { label, textClass } = getComplaintPinColor(activePinComplaint.status);
                      return (
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${textClass}`}>
                          Priority {activePinComplaint.edpsScore} · {label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Thumbnail Photo */}
                  {activePinComplaint.photoUrl && (
                    <div className="h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative">
                      <img
                        src={activePinComplaint.photoUrl}
                        alt={activePinComplaint.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                        Ward: {activePinComplaint.ward}
                      </div>
                    </div>
                  )}

                  {/* Issue Type & Location */}
                  <div>
                    <h3 className="text-sm font-bold text-navy">
                      {CATEGORY_LABELS[activePinComplaint.category] || activePinComplaint.title}
                    </h3>
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin size={13} className="text-teal-600 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">
                        {activePinComplaint.address}
                      </span>
                    </div>
                  </div>

                  {/* Current Status & Report Date */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Reported Date</span>
                      <span className="font-bold text-navy">
                        {new Date(activePinComplaint.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Department</span>
                      <span className="font-bold text-navy truncate block">
                        {activePinComplaint.workOrder?.contractor || 'PWD Municipal Desk'}
                      </span>
                    </div>
                  </div>

                  {/* Latest Update Callout */}
                  {activePinComplaint.history.length > 0 && (() => {
                    const latest = activePinComplaint.history[activePinComplaint.history.length - 1];
                    return (
                      <div className="p-2.5 bg-teal-50/60 rounded-xl border border-teal-100 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1 font-bold text-teal-900">
                          <Clock size={11} className="text-teal-700" />
                          <span>Latest Update:</span>
                        </div>
                        <p className="text-slate-700 line-clamp-2 italic">
                          "{latest.action} — {latest.details}"
                        </p>
                      </div>
                    );
                  })()}

                  {/* Resolution Estimate Badge */}
                  {activeEstimate && (
                    <div className={`p-2.5 rounded-xl border text-[11px] font-semibold space-y-0.5 ${activeEstimate.badgeColor}`}>
                      <div className="font-bold">{activeEstimate.displayText}</div>
                      <div className="text-[10px] opacity-80">{activeEstimate.basisText}</div>
                    </div>
                  )}
                </div>

                {/* "Track Issue →" Link: Navigates to tracker view for this issue */}
                <button
                  onClick={() => {
                    setSelectedComplaintId(activePinComplaint.id);
                    setActiveTab('track');
                  }}
                  className="w-full py-3 bg-navy hover:bg-navy-surface text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  <span>Track Issue Full Progression</span>
                  <ArrowRight size={14} className="text-teal-accent" />
                </button>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                <MapPin size={28} className="text-teal-600" />
                <p className="text-xs">
                  Click any marker on the map to inspect its real-time operational status, contractor notes, and resolution estimate.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
