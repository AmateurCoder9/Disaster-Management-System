import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  AlertTriangle,
  MapPin,
  Layers,
  Activity,
  Loader2,
} from 'lucide-react';
import usePolling from '../hooks/usePolling';
import { getDisasters, getSOSRequests, getGrids } from '../services/api';

// Fix Leaflet default icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SEVERITY_MAP = {
  5: { color: '#ef4444', fill: '#ef444440', label: 'Critical' },
  4: { color: '#f97316', fill: '#f9731640', label: 'High' },
  3: { color: '#eab308', fill: '#eab30840', label: 'Medium' },
  2: { color: '#3b82f6', fill: '#3b82f640', label: 'Moderate' },
  1: { color: '#22c55e', fill: '#22c55e40', label: 'Low' },
};

const GRID_RISK_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

function FlyToOnSelect({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 8, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

function SOSMarkerComponent({ sos }) {
  const lat = sos.latitude ?? sos.lat;
  const lng = sos.longitude ?? sos.lng;
  if (!lat || !lng) return null;

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={6}
      pathOptions={{
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.9,
        weight: 2,
        className: 'sos-pulse',
      }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-semibold text-red-400 mb-1">🆘 SOS Request</p>
          <p className="text-dark-300">Name: {sos.name || 'Unknown'}</p>
          <p className="text-dark-400">Status: <span className="capitalize">{sos.status}</span></p>
          {sos.message && <p className="text-dark-400 mt-1 text-xs">{sos.message}</p>}
          <p className="text-dark-500 text-xs mt-1">
            {sos.created_at ? new Date(sos.created_at).toLocaleString() : ''}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const fetchDisasters = useCallback(async () => {
    const res = await getDisasters();
    const d = res.data;
    return Array.isArray(d) ? d : d.disasters || [];
  }, []);

  const fetchSOS = useCallback(async () => {
    try {
      const res = await getSOSRequests();
      const d = res.data;
      return Array.isArray(d) ? d : d.sos_requests || [];
    } catch {
      return [];
    }
  }, []);

  const fetchGrids = useCallback(async () => {
    try {
      const res = await getGrids();
      const d = res.data;
      return Array.isArray(d) ? d : d.grids || [];
    } catch {
      return [];
    }
  }, []);

  const { data: disasters, loading: loadingDisasters } = usePolling(fetchDisasters, 30000);
  const { data: sosRequests } = usePolling(fetchSOS, 30000);
  const { data: grids } = usePolling(fetchGrids, 30000);

  const disasterList = disasters || [];
  const sosList = sosRequests || [];
  const gridList = grids || [];

  const selectedGrids = useMemo(() => {
    if (!selectedDisaster) return [];
    const disId = selectedDisaster.id || selectedDisaster._id;
    return gridList.filter((g) => (g.disaster_id || g.disaster) === disId);
  }, [selectedDisaster, gridList]);

  const handleDisasterClick = (disaster) => {
    setSelectedDisaster(disaster);
    setShowPanel(true);
    setFlyTo([disaster.latitude, disaster.longitude]);
  };

  const closePanel = () => {
    setShowPanel(false);
    setTimeout(() => setSelectedDisaster(null), 300);
  };

  return (
    <div className="relative z-10" style={{ margin: '-1rem -1.5rem -1.5rem -1.5rem' }}>
      {/* Map */}
      <div className="relative" style={{ height: 'calc(100vh - 0px)' }}>
        {loadingDisasters && disasterList.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark-950/80">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-dark-400 text-sm">Loading map data...</p>
            </div>
          </div>
        )}

        <MapContainer
          center={[30, -95]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <FlyToOnSelect position={flyTo} />

          {/* Disaster zones */}
          {disasterList.map((disaster) => {
            const id = disaster.id || disaster._id;
            const sev = SEVERITY_MAP[disaster.severity] || SEVERITY_MAP[1];
            const radiusMeters = (disaster.radius || 10) * 1000;

            return (
              <React.Fragment key={id}>
                {/* Area circle */}
                <Circle
                  center={[disaster.latitude, disaster.longitude]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: sev.color,
                    fillColor: sev.fill,
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: '6 4',
                  }}
                />
                {/* Center marker */}
                <CircleMarker
                  center={[disaster.latitude, disaster.longitude]}
                  radius={8}
                  pathOptions={{
                    color: sev.color,
                    fillColor: sev.color,
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => handleDisasterClick(disaster),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold mb-1">{disaster.title}</p>
                      <p className="text-dark-400">Severity: <span style={{ color: sev.color }}>{sev.label}</span></p>
                      <p className="text-dark-400">Type: {disaster.disaster_type}</p>
                      <p className="text-dark-500 text-xs mt-1">Click for details</p>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}

          {/* Grid overlays for selected disaster */}
          {selectedGrids.map((grid) => {
            const gridId = grid.id || grid._id;
            const riskColor = GRID_RISK_COLORS[grid.risk_level] || '#64748b';
            const lat = grid.latitude || (selectedDisaster ? selectedDisaster.latitude + (Math.random() - 0.5) * 0.1 : 0);
            const lng = grid.longitude || (selectedDisaster ? selectedDisaster.longitude + (Math.random() - 0.5) * 0.1 : 0);

            return (
              <CircleMarker
                key={gridId}
                center={[lat, lng]}
                radius={12}
                pathOptions={{
                  color: riskColor,
                  fillColor: riskColor,
                  fillOpacity: 0.4,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Grid: {grid.grid_code}</p>
                    <p className="text-dark-400">Risk: <span className="capitalize">{grid.risk_level || 'N/A'}</span></p>
                    <p className="text-dark-400">AI Score: {grid.ai_priority_score ?? 'Not run'}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* SOS markers */}
          {sosList.map((sos, i) => (
            <SOSMarkerComponent key={sos.id || sos._id || i} sos={sos} />
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 z-10 glass-card rounded-xl p-4 max-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-dark-400" />
            <p className="text-xs font-semibold text-dark-300">Legend</p>
          </div>
          <div className="space-y-2">
            {Object.entries(SEVERITY_MAP).reverse().map(([level, info]) => (
              <div key={level} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: info.color }} />
                <span className="text-xs text-dark-400">{info.label} (Sev {level})</span>
              </div>
            ))}
            <div className="border-t border-dark-700/50 pt-2 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 sos-pulse" />
                <span className="text-xs text-dark-400">SOS Request</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-6 left-6 z-10 flex gap-3">
          <div className="glass-card rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-white">{disasterList.length}</span>
            <span className="text-xs text-dark-400">Disasters</span>
          </div>
          <div className="glass-card rounded-lg px-3 py-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-white">{sosList.filter((s) => s.status === 'pending').length}</span>
            <span className="text-xs text-dark-400">Active SOS</span>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {showPanel && selectedDisaster && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePanel}
              className="lg:hidden fixed inset-0 bg-black/40 z-30"
            />

            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-40 glass border-l border-dark-700/50 overflow-y-auto"
            >
              {/* Panel Header */}
              <div className="sticky top-0 glass border-b border-dark-700/50 px-5 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <h3 className="font-semibold text-white text-sm">Disaster Details</h3>
                </div>
                <button
                  onClick={closePanel}
                  className="p-1.5 rounded-lg text-dark-500 hover:text-white hover:bg-dark-700/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Title & severity */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{selectedDisaster.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${
                      SEVERITY_MAP[selectedDisaster.severity]
                        ? `border-opacity-30 text-opacity-100`
                        : ''
                    }`}
                    style={{
                      borderColor: SEVERITY_MAP[selectedDisaster.severity]?.color || '#64748b',
                      color: SEVERITY_MAP[selectedDisaster.severity]?.color || '#64748b',
                      backgroundColor: (SEVERITY_MAP[selectedDisaster.severity]?.color || '#64748b') + '15',
                    }}
                    >
                      {SEVERITY_MAP[selectedDisaster.severity]?.label || 'Unknown'} Severity
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-dark-800 text-dark-400 border border-dark-700">
                      {selectedDisaster.disaster_type}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  {selectedDisaster.description && (
                    <div>
                      <p className="text-xs text-dark-500 mb-1">Description</p>
                      <p className="text-sm text-dark-300">{selectedDisaster.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-light rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-0.5">Latitude</p>
                      <p className="text-sm font-medium text-white">{selectedDisaster.latitude?.toFixed(4)}</p>
                    </div>
                    <div className="glass-light rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-0.5">Longitude</p>
                      <p className="text-sm font-medium text-white">{selectedDisaster.longitude?.toFixed(4)}</p>
                    </div>
                    <div className="glass-light rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-0.5">Radius</p>
                      <p className="text-sm font-medium text-white">{selectedDisaster.radius} km</p>
                    </div>
                    <div className="glass-light rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-0.5">Severity</p>
                      <p className="text-sm font-medium" style={{ color: SEVERITY_MAP[selectedDisaster.severity]?.color }}>
                        {selectedDisaster.severity}/5
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grids */}
                {selectedGrids.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Grid Zones ({selectedGrids.length})</p>
                    <div className="space-y-2">
                      {selectedGrids.map((grid) => {
                        const riskColor = GRID_RISK_COLORS[grid.risk_level] || '#64748b';
                        return (
                          <div key={grid.id || grid._id} className="glass-light rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">{grid.grid_code}</span>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full capitalize"
                                style={{
                                  color: riskColor,
                                  backgroundColor: riskColor + '15',
                                  borderColor: riskColor + '30',
                                  borderWidth: 1,
                                }}
                              >
                                {grid.risk_level || 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-dark-500 mt-1">
                              AI Score: <span className="text-dark-300">{grid.ai_priority_score ?? '—'}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action */}
                <button
                  onClick={() => navigate(`/disasters/${selectedDisaster.id || selectedDisaster._id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
                >
                  View Full Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
