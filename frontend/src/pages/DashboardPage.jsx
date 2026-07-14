import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  MapPin,
  Users,
  Activity,
  Plus,
  Map,
  Clock,
  ChevronRight,
  Flame,
  Waves,
  Mountain,
  Wind,
  Cloud,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';
import usePolling from '../hooks/usePolling';
import { getDisasters, getSOSRequests, getAssignments, getGrids } from '../services/api';
import DisasterForm from '../components/DisasterForm';

const SEVERITY_COLORS = {
  5: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500', label: 'Critical' },
  4: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500', label: 'High' },
  3: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500', label: 'Medium' },
  2: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500', label: 'Moderate' },
  1: { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-500', label: 'Low' },
};

const TYPE_ICONS = {
  earthquake: Mountain,
  flood: Waves,
  wildfire: Flame,
  hurricane: Wind,
  tsunami: Waves,
  other: Cloud,
};

function AnimatedNumber({ value }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-3xl font-bold text-white"
    >
      {value ?? 0}
    </motion.span>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm mb-1">{label}</p>
          <AnimatedNumber value={value} />
        </div>
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const fetchDisasters = useCallback(async () => {
    const res = await getDisasters();
    return res.data;
  }, []);

  const fetchSOS = useCallback(async () => {
    try {
      const res = await getSOSRequests();
      return res.data;
    } catch {
      return [];
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await getAssignments();
      return res.data;
    } catch {
      return [];
    }
  }, []);

  const fetchGrids = useCallback(async () => {
    try {
      const res = await getGrids();
      return res.data;
    } catch {
      return [];
    }
  }, []);

  const { data: disasters, loading: loadingDisasters, refresh: refreshDisasters } = usePolling(fetchDisasters, 30000);
  const { data: sosRequests } = usePolling(fetchSOS, 30000);
  const { data: assignments } = usePolling(fetchAssignments, 30000);
  const { data: grids } = usePolling(fetchGrids, 30000);

  const disasterList = useMemo(() => {
    if (!disasters) return [];
    return Array.isArray(disasters) ? disasters : disasters.disasters || [];
  }, [disasters]);

  const sosList = useMemo(() => {
    if (!sosRequests) return [];
    return Array.isArray(sosRequests) ? sosRequests : sosRequests.sos_requests || [];
  }, [sosRequests]);

  const assignmentList = useMemo(() => {
    if (!assignments) return [];
    return Array.isArray(assignments) ? assignments : assignments.assignments || [];
  }, [assignments]);

  const gridList = useMemo(() => {
    if (!grids) return [];
    return Array.isArray(grids) ? grids : grids.grids || [];
  }, [grids]);

  const activeSOS = sosList.filter((s) => s.status === 'pending').length;
  const criticalZones = gridList.filter((g) => g.risk_level === 'critical' || (g.ai_priority_score && g.ai_priority_score >= 8)).length;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency Dashboard</h1>
          <p className="text-dark-400 text-sm mt-1">Real-time overview of disaster operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg glass border border-dark-600/30 text-dark-300 hover:text-white hover:border-dark-500 text-sm font-medium transition-all"
          >
            <Map className="w-4 h-4" /> View Map
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-4 h-4" /> Create Disaster
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Total Disasters"
          value={disasterList.length}
          color="bg-red-500/15 text-red-400"
          delay={0}
        />
        <StatCard
          icon={Activity}
          label="Active SOS"
          value={activeSOS}
          color="bg-orange-500/15 text-orange-400"
          delay={0.1}
        />
        <StatCard
          icon={Users}
          label="Assigned Teams"
          value={assignmentList.length}
          color="bg-blue-500/15 text-blue-400"
          delay={0.2}
        />
        <StatCard
          icon={MapPin}
          label="Critical Zones"
          value={criticalZones}
          color="bg-purple-500/15 text-purple-400"
          delay={0.3}
        />
      </div>

      {/* Disasters Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Active Disasters</h2>
          <span className="text-xs text-dark-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updates every 30s
          </span>
        </div>

        {loadingDisasters && disasterList.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : disasterList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-xl p-12 text-center"
          >
            <HelpCircle className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-300 mb-2">No Active Disasters</h3>
            <p className="text-dark-500 text-sm">
              {isAdmin ? 'Click "Create Disaster" to report a new incident.' : 'No disaster reports at this time.'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {disasterList.map((disaster, index) => {
              const severity = SEVERITY_COLORS[disaster.severity] || SEVERITY_COLORS[1];
              const TypeIcon = TYPE_ICONS[disaster.disaster_type] || HelpCircle;
              const id = disaster.id || disaster._id;

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/disasters/${id}`)}
                  className="glass-card rounded-xl p-5 cursor-pointer hover:border-dark-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${severity.bg} flex items-center justify-center`}>
                        <TypeIcon className={`w-5 h-5 ${severity.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors text-sm">
                          {disaster.title}
                        </h3>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${severity.bg} ${severity.text} border ${severity.border} mt-1`}>
                          {disaster.disaster_type?.charAt(0).toUpperCase() + disaster.disaster_type?.slice(1)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-dark-600 group-hover:text-dark-400 transition-colors" />
                  </div>

                  {/* Severity bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(disaster.severity / 5) * 100}%` }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
                        className={`h-full rounded-full ${severity.dot}`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${severity.text}`}>{severity.label}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-dark-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {disaster.latitude?.toFixed(2)}, {disaster.longitude?.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {disaster.created_at ? new Date(disaster.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disaster Form Modal */}
      {showForm && (
        <DisasterForm
          onClose={() => setShowForm(false)}
          onSuccess={refreshDisasters}
        />
      )}
    </div>
  );
}
