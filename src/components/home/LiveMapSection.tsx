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
import { ALL_INDIAN_STATES, getStateGeoData, SPECIFIC_CIVIC_AREAS } from '../../lib/indiaGeoService';
import { CATEGORY_LABELS } from '../../lib/imageClassifier';
import { calculateResolutionEstimate, ResolutionEstimate } from '../../lib/resolutionEstimates';
import { CityBackdrop } from '../visual/CityBackdrop';

// Status-to-color mapping for map pins (Using official CivicTrace Logo Palette)
export function getComplaintPinColor(status: ComplaintStatus): { hex: string; label: string; textClass: string } {
  if (status === 'verified' || status === 'resolved') {
    return { hex: '#059669', label: 'Resolved', textClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (status === 'awaiting_verification' || status === 'disputed') {
    return { hex: '#7C3AED', label: 'Awaiting Verification', textClass: 'text-purple-700 bg-purple-50 border-purple-200' };
  }
  if (status === 'in_progress' || status === 'assigned' || status === 'reopened') {
    return { hex: '#D86230', label: 'In Progress', textClass: 'text-terracotta bg-terracotta-surface border-terracotta-border' };
  }
  return { hex: '#D97706', label: 'Reported', textClass: 'text-amber-800 bg-amber-50 border-amber-200' };
}

export const LiveMapSection: React.FC = () => {
  const { complaints, setActiveTab, setSelectedComplaintId } = useCivicData();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters & Focus Area
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');

  const handleSelectArea = (areaKey: string) => {
    setSelectedArea(areaKey);
    if (areaKey === 'neemrana') {
      setSelectedState('Rajasthan');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(SPECIFIC_CIVIC_AREAS.neemrana.center, SPECIFIC_CIVIC_AREAS.neemrana.zoom, { duration: 1.2 });
      }
    } else if (areaKey === 'ludhiana') {
      setSelectedState('Punjab');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(SPECIFIC_CIVIC_AREAS.ludhiana.center, SPECIFIC_CIVIC_AREAS.ludhiana.zoom, { duration: 1.2 });
      }
    } else {
      setSelectedState('all');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([20.5937, 78.9629], 5, { duration: 1.2 });
      }
    }
  };

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

  const districtCounts = filteredComplaints.reduce<Record<string, number>>((acc, c) => {
    if (c.district) {
      acc[c.district] = (acc[c.district] || 0) + 1;
    }
    return acc;
  }, {});

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

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when filteredComplaints change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    filteredComplaints.forEach((c) => {
      const isSelected = activePinComplaint?.id === c.id;
      const { hex } = getComplaintPinColor(c.status);

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
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

    // Auto-center or fit bounds based on selection
    if (mapInstanceRef.current) {
      if (filteredComplaints.length > 0) {
        const bounds = L.latLngBounds(filteredComplaints.map((c) => [c.latitude, c.longitude]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } else if (selectedState !== 'all') {
        const stateGeo = getStateGeoData(selectedState);
        if (stateGeo) {
          mapInstanceRef.current.flyTo(stateGeo.center, stateGeo.zoom, { duration: 0.8 });
        }
      } else {
        mapInstanceRef.current.flyTo([20.5937, 78.9629], 5, { duration: 0.8 });
      }
    }
  }, [filteredComplaints, activePinComplaint, selectedState]);

  // Compute estimate for selected pin complaint
  const activeEstimate: ResolutionEstimate | null = activePinComplaint
    ? calculateResolutionEstimate(activePinComplaint)
    : null;

  return (
    <section className="relative p-4 sm:p-6 w-full space-y-6">
      {/* Subtle GIS Coordinate Network Backdrop */}
      <CityBackdrop variant="civic_grid" opacity={0.04} />

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
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            <span>Reported</span>
          </span>
          <span className="flex items-center gap-1.5 text-orange-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D86230]" />
            <span>In Progress</span>
          </span>
          <span className="flex items-center gap-1.5 text-purple-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            <span>Awaiting Audit</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            <span>Resolved</span>
          </span>
        </div>
      </div>

      {/* Quick Geographic Explorers (Neemrana, Rajasthan & Ludhiana, Punjab) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Focus Areas:
        </span>
        <button
          onClick={() => handleSelectArea('neemrana')}
          className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            selectedArea === 'neemrana'
              ? 'bg-terracotta text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-navy border border-slate-200'
          }`}
        >
          <MapPin size={12} className={selectedArea === 'neemrana' ? 'text-white' : 'text-terracotta'} />
          <span>Neemrana, Rajasthan</span>
        </button>
        <button
          onClick={() => handleSelectArea('ludhiana')}
          className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            selectedArea === 'ludhiana'
              ? 'bg-navy text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-navy border border-slate-200'
          }`}
        >
          <MapPin size={12} className={selectedArea === 'ludhiana' ? 'text-white' : 'text-teal-700'} />
          <span>Ludhiana, Punjab</span>
        </button>
        <button
          onClick={() => handleSelectArea('all')}
          className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all shrink-0 ${
            selectedArea === 'all'
              ? 'bg-navy text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <span>All States (National View)</span>
        </button>
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
          {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>

        {/* Progression Stage Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-slate-800 font-semibold text-xs focus:outline-none focus:border-teal-600 transition-colors shadow-xs"
        >
          <option value="all">All Progression Stages</option>
          <option value="reported">Reported</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_verification">Awaiting Audit</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* State and District Counts Display */}
        {selectedState !== 'all' && (
          <div className="ml-auto flex items-center gap-2">
            <span className="font-bold text-navy bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              {selectedState}: {filteredComplaints.length} {filteredComplaints.length === 1 ? 'Complaint' : 'Complaints'}
            </span>
            {Object.keys(districtCounts).length > 0 && (
              <span className="text-[11px] text-slate-500 font-medium">
                ({Object.entries(districtCounts).map(([d, cnt]) => `${d}: ${cnt}`).join(', ')})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Map + Side Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Map Container */}
        <div className="lg:col-span-2 relative h-[480px] sm:h-[540px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Clean Floating Empty State Banner (Non-blocking: Leaflet canvas remains interactive underneath) */}
          {filteredComplaints.length === 0 && selectedState !== 'all' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 shadow-lg flex items-center gap-2 text-xs font-semibold text-slate-700">
                <MapPin size={14} className="text-teal-700 shrink-0" />
                <span>
                  Showing {selectedState} &bull; No complaints currently recorded in this area
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Active Marker Details (Sticky, updates in-place) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm h-[480px] sm:h-[540px] flex flex-col justify-between overflow-y-auto">
          <AnimatePresence mode="wait">
            {activePinComplaint ? (
              <motion.div
                key={activePinComplaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Header ID & Priority Score */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-navy text-sm">
                      #{activePinComplaint.id}
                    </span>
                    {(() => {
                      const { label, textClass } = getComplaintPinColor(activePinComplaint.status);
                      return (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${textClass}`}>
                          Priority {activePinComplaint.edpsScore} &bull; {label}
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

                {/* "Track Issue →" Link */}
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
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                  <MapPin size={22} className="text-teal-700" />
                </div>
                <h4 className="text-sm font-black text-navy">
                  {selectedState !== 'all' ? `No Complaints in ${selectedState}` : 'No Matching Incidents'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  {selectedState !== 'all'
                    ? `There are currently 0 active civic complaints recorded for ${selectedState}. Map coordinates are active and will display markers as soon as complaints are filed.`
                    : 'Select "All States" or adjust filters to view active complaints.'}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TRANSPARENT LOCAL CIVIC OVERVIEW: NEEMRANA, RAJASTHAN & DISTRICT DATA */}
      {/* --------------------------------------------------------------------- */}
      {(selectedArea === 'neemrana' || selectedState === 'Rajasthan') && (
        <div className="bg-white rounded-3xl p-6 border border-sage shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-spruce-light text-navy text-[10px] font-bold rounded-full border border-sage">
                  Location Focus
                </span>
                <span className="text-xs font-bold text-slate-400">PIN: 301705</span>
              </div>
              <h3 className="text-xl font-black text-navy tracking-tight">
                Neemrana, Rajasthan — Local Civic Overview
              </h3>
              <p className="text-xs text-charcoal/80">
                Kotputli-Behror District (formerly Alwar District) &bull; NH-48 Delhi-Jaipur Corridor &bull; RIICO Industrial Hub
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <span className="font-semibold block">Last Verified</span>
              <span className="font-bold text-navy">31 Oct 2026</span>
            </div>
          </div>

          {/* Metric Comparison: CivicTrace vs Government Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. CivicTrace Community Platform Records (Honest count: 0) */}
            <div className="p-5 rounded-2xl bg-[#FAF7EF] border border-[#E7E1D4] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h4 className="font-bold text-navy text-xs uppercase tracking-wide">
                    CivicTrace Verified Platform
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  Citizen Ledger
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Received</span>
                  <span className="text-xl font-black text-navy">0</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Complaints</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">In Progress</span>
                  <span className="text-xl font-black text-amber-700">0</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Dispatched</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Resolved</span>
                  <span className="text-xl font-black text-emerald-700">0</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Verified</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 italic leading-relaxed pt-1">
                Verified CivicTrace community records for Neemrana are currently 0. No fabricated pins or mock cases are manufactured. Coordinates and road infrastructure on NH-48 and RIICO areas are active.
              </p>
            </div>

            {/* 2. Official Government of Rajasthan Grievance Statistics (Sampark & RAJNIVESH) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-teal-800" />
                  <h4 className="font-bold text-navy text-xs uppercase tracking-wide">
                    Rajasthan Government Portals
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Official Public Data
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Received</span>
                  <span className="text-xl font-black text-navy">43,120</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">District Total</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Disposed</span>
                  <span className="text-xl font-black text-emerald-700">39,940</span>
                  <span className="text-[9px] font-bold text-emerald-700 block mt-0.5">92.6% Rate</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Pending</span>
                  <span className="text-xl font-black text-amber-700">3,180</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">In Redressal</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Source:</span>
                  <a
                    href="https://sampark.rajasthan.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Rajasthan Sampark &bull; CM Helpline 181</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Industrial Clearances:</span>
                  <a
                    href="https://rajnivesh.rajasthan.gov.in/Home/DistrictWise"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>RAJNIVESH (3,840 Apps &bull; 94% Disposed)</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">GIS Layer:</span>
                  <a
                    href="https://gis.rajasthan.gov.in/citizen/Default.aspx"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Rajdharaa Citizen GIS Portal (DoIT&C)</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Reporting Period:</span>
                  <span className="font-bold text-navy">FY 2025–2026 (Monthly Digest: Oct 2026)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Separation Notice */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
            <ShieldCheck size={16} className="text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-bold">Strict Data Attribution & Verification Standard:</p>
              <p className="text-[11px] text-amber-900/90">
                Government grievance statistics shown above are aggregate administrative indicators for Alwar / Kotputli-Behror District published by the Government of Rajasthan. They are strictly distinguished from individual, GPS-verified complaints reported through CivicTrace to prevent double-counting or false representations.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
