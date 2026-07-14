import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
  Filter,
  Phone,
  MapPin,
  MessageSquare,
  Loader2,
  Inbox,
} from 'lucide-react';
import usePolling from '../hooks/usePolling';
import { getSOSRequests, updateSOSStatus } from '../services/api';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_CONFIG = {
  pending: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    icon: Clock,
    label: 'Pending',
    markerColor: '#eab308',
  },
  verified: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    icon: Eye,
    label: 'Verified',
    markerColor: '#3b82f6',
  },
  resolved: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
    icon: CheckCircle2,
    label: 'Resolved',
    markerColor: '#22c55e',
  },
};

const TABS = ['all', 'pending', 'verified', 'resolved'];

export default function SOSPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchSOS = useCallback(async () => {
    const res = await getSOSRequests();
    const d = res.data;
    return Array.isArray(d) ? d : d.sos_requests || [];
  }, []);

  const { data: sosList, loading, refresh } = usePolling(fetchSOS, 30000);
  const requests = sosList || [];

  const filtered = useMemo(() => {
    if (activeTab === 'all') return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    verified: requests.filter((r) => r.status === 'verified').length,
    resolved: requests.filter((r) => r.status === 'resolved').length,
  }), [requests]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateSOSStatus(id, newStatus);
      refresh();
    } catch (err) {
      console.error('Failed to update SOS status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Map center from first SOS with coords
  const mapCenter = useMemo(() => {
    const withCoords = requests.find((r) => (r.latitude || r.lat) && (r.longitude || r.lng));
    if (withCoords) return [withCoords.latitude || withCoords.lat, withCoords.longitude || withCoords.lng];
    return [30, -95];
  }, [requests]);

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">SOS Requests</h1>
        <p className="text-dark-400 text-sm mt-1">Monitor and manage emergency SOS submissions</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: AlertTriangle, color: 'bg-dark-700/40 text-dark-300' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500/15 text-yellow-400' },
          { label: 'Verified', value: stats.verified, icon: Eye, color: 'bg-blue-500/15 text-blue-400' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'bg-green-500/15 text-green-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-500">{stat.label}</p>
                <p className="text-xl font-bold text-white mt-0.5">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mini Map */}
      {requests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden"
          style={{ height: 250 }}
        >
          <MapContainer
            center={mapCenter}
            zoom={4}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {requests.map((sos, i) => {
              const lat = sos.latitude || sos.lat;
              const lng = sos.longitude || sos.lng;
              if (!lat || !lng) return null;
              const cfg = STATUS_CONFIG[sos.status] || STATUS_CONFIG.pending;
              return (
                <CircleMarker
                  key={sos.id || sos._id || i}
                  center={[lat, lng]}
                  radius={5}
                  pathOptions={{
                    color: cfg.markerColor,
                    fillColor: cfg.markerColor,
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">{sos.name || 'Unknown'}</p>
                      <p className="capitalize">{sos.status}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-dark-900/50 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-xs font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-dark-700 text-white shadow-sm'
                : 'text-dark-500 hover:text-dark-300'
            }`}
          >
            {tab === 'all' ? `All (${stats.total})` : `${tab} (${stats[tab]})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        {loading && requests.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">No SOS requests found</p>
            <p className="text-dark-600 text-xs mt-1">
              {activeTab !== 'all' ? 'Try selecting a different filter' : 'No emergency requests have been submitted'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">Message</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                <AnimatePresence>
                  {filtered.map((sos, idx) => {
                    const sosId = sos.id || sos._id;
                    const cfg = STATUS_CONFIG[sos.status] || STATUS_CONFIG.pending;
                    const lat = sos.latitude || sos.lat;
                    const lng = sos.longitude || sos.lng;

                    return (
                      <motion.tr
                        key={sosId || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-dark-800/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-xs font-medium text-dark-300">
                              {sos.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-white text-sm">{sos.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-dark-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {sos.phone || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-dark-400 text-xs">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {lat ? `${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-dark-400 max-w-[200px]">
                          <p className="truncate text-xs" title={sos.message}>
                            {sos.message || '—'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          {updatingId === sosId ? (
                            <Loader2 className="w-4 h-4 text-dark-400 animate-spin" />
                          ) : (
                            <select
                              value={sos.status}
                              onChange={(e) => handleStatusChange(sosId, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-full border cursor-pointer ${cfg.bg} ${cfg.text} ${cfg.border} bg-transparent focus:outline-none`}
                            >
                              <option value="pending" className="bg-dark-800 text-white">Pending</option>
                              <option value="verified" className="bg-dark-800 text-white">Verified</option>
                              <option value="resolved" className="bg-dark-800 text-white">Resolved</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-4 text-dark-500 text-xs whitespace-nowrap">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {sos.created_at ? new Date(sos.created_at).toLocaleString() : '—'}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
