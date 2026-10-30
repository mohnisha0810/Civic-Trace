import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  ArrowRight,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { Complaint, ComplaintCategory, PriorityBand } from '../../types';
import { ALL_INDIAN_STATES } from '../../lib/indiaGeoService';

export const LiveMapSection: React.FC = () => {
  const { complaints, setActiveTab, setSelectedComplaintId } = useCivicData();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [activePinComplaint, setActivePinComplaint] = useState<Complaint | null>(
    complaints.length > 0 ? complaints[0] : null
  );

  // Filtered Complaints
  const filteredComplaints = complaints.filter(c => {
    if (selectedState !== 'all' && c.state !== selectedState) return false;
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && c.edpsBand !== selectedPriority) return false;
    if (selectedStatus === 'active' && (c.status === 'verified' || c.status === 'rejected'))
      return false;
    if (selectedStatus === 'verified' && c.status !== 'verified') return false;
    if (selectedStatus === 'in_progress' && c.status !== 'in_progress') return false;
    return true;
  });

  // Initialize Map of India
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Geographic Center of India
    const map = L.map(mapContainerRef.current, {
      center: [21.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    markersLayerRef.current = layer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when complaints or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    if (filteredComplaints.length === 0) return;

    filteredComplaints.forEach(c => {
      const isCritical = c.edpsBand === 'critical';
      const isVerified = c.status === 'verified';
      const pinColor = isVerified ? '#10B981' : isCritical ? '#E05B2D' : '#0F3A36';

      const customIcon = L.divIcon({
        className: 'civictrace-pin-marker',
        html: `
          <div style="
            background-color: ${pinColor};
            color: #FFFDF8;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 800;
            font-size: 11px;
            border: 2px solid #FFFDF8;
            box-shadow: 0 4px 12px rgba(15,58,54,0.35);
            cursor: pointer;
            transition: transform 0.2s;
          " class="hover:scale-110">
            ${c.edpsScore}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([c.latitude, c.longitude], { icon: customIcon });
      marker.on('click', () => {
        setActivePinComplaint(c);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([c.latitude, c.longitude], 14, { duration: 1.2 });
        }
      });
      marker.addTo(layer);
    });

    // Fit bounds if markers exist
    if (filteredComplaints.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(filteredComplaints.map(c => [c.latitude, c.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredComplaints]);

  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-burnt uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>National Spatial Digital Twin</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-forest mt-1">
            Live India Civic Map
          </h2>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Real-time coordinates of reported public infrastructure defects and verified fixes across India.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('map')}
          className="text-xs font-bold text-forest hover:text-burnt flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <span>Full Geospatial View</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-softwhite rounded-2xl p-3 sm:p-4 border border-sage shadow-subtle flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-forest">
          <Filter size={14} className="text-burnt" />
          <span>Filters:</span>
        </div>

        {/* State Filter */}
        <select
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
          className="px-3 py-1.5 bg-ivory rounded-xl border border-sage text-charcoal font-semibold text-xs focus:outline-none focus:border-forest"
        >
          <option value="all">All States & UTs</option>
          {ALL_INDIAN_STATES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-ivory rounded-xl border border-sage text-charcoal font-semibold text-xs focus:outline-none focus:border-forest"
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

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={e => setSelectedPriority(e.target.value)}
          className="px-3 py-1.5 bg-ivory rounded-xl border border-sage text-charcoal font-semibold text-xs focus:outline-none focus:border-forest"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical (EDPS ≥ 75)</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-ivory rounded-xl border border-sage text-charcoal font-semibold text-xs focus:outline-none focus:border-forest"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Grievances</option>
          <option value="in_progress">Field Work In Progress</option>
          <option value="verified">Verified Closed</option>
        </select>

        <span className="ml-auto text-[11px] font-mono font-semibold text-charcoal-muted">
          Showing {filteredComplaints.length} Records
        </span>
      </div>

      {/* Main Grid: Map + Side Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
        {/* Map Canvas */}
        <div className="lg:col-span-8 h-full rounded-3xl overflow-hidden border border-sage shadow-card relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {complaints.length === 0 && (
            <div className="absolute inset-0 bg-softwhite/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-2 z-20">
              <div className="w-12 h-12 rounded-2xl bg-sage flex items-center justify-center text-forest">
                <MapPin size={24} className="text-burnt" />
              </div>
              <h3 className="text-sm font-bold text-forest">No Grievances Logged Yet</h3>
              <p className="text-xs text-charcoal-muted max-w-sm">
                As citizens submit complaints across India, pins with live EDPS priority scores appear here automatically.
              </p>
            </div>
          )}
        </div>

        {/* Selected Complaint Detail Preview Panel */}
        <div className="lg:col-span-4 h-full bg-softwhite rounded-3xl p-5 border border-sage shadow-card flex flex-col justify-between overflow-y-auto text-xs">
          {activePinComplaint ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-sage/60 pb-3">
                <span className="font-mono font-extrabold text-forest text-sm">
                  #{activePinComplaint.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    activePinComplaint.edpsBand === 'critical'
                      ? 'bg-peach text-burnt'
                      : activePinComplaint.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-sage text-forest'
                  }`}
                >
                  Priority {activePinComplaint.edpsScore} • {activePinComplaint.status.replace(/_/g, ' ')}
                </span>
              </div>

              {activePinComplaint.photoUrl && (
                <div className="h-36 rounded-2xl overflow-hidden border border-sage bg-ivory">
                  <img
                    src={activePinComplaint.photoUrl}
                    alt={activePinComplaint.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-forest">{activePinComplaint.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-charcoal-muted mt-1 truncate">
                  <MapPin size={13} className="text-forest flex-shrink-0" />
                  <span className="truncate">
                    {activePinComplaint.address} ({activePinComplaint.district}, {activePinComplaint.state})
                  </span>
                </div>
              </div>

              <p className="text-xs text-charcoal leading-relaxed line-clamp-3">
                {activePinComplaint.description}
              </p>

              <div className="p-3 bg-ivory rounded-xl border border-sage text-[11px] space-y-1">
                <div className="font-bold text-forest">Mathematical EDPS Triage:</div>
                <div className="text-charcoal-muted line-clamp-2">
                  {activePinComplaint.edpsExplanation}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedComplaintId(activePinComplaint.id);
                  setActiveTab('track');
                }}
                className="w-full py-2.5 bg-forest hover:bg-forest-hover text-softwhite rounded-xl font-bold text-xs shadow-card flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Track Visual Impact Trail</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-charcoal-muted">
              <MapPin size={24} className="text-burnt" />
              <p>Click on any pin on the map to inspect its real-time operational status.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
