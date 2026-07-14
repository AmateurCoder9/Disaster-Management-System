import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Plus,
  Zap,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  Grid3X3,
  Brain,
  Send,
} from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';
import usePolling from '../hooks/usePolling';
import {
  getDisaster,
  getGrids,
  getAssignments,
  createGrid,
  predictPriority,
  createAssignment,
  deleteDisaster,
} from '../services/api';
import DisasterForm from '../components/DisasterForm';

const SEVERITY_COLORS = {
  5: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500', label: 'Critical' },
  4: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-500', label: 'High' },
  3: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-500', label: 'Medium' },
  2: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-500', label: 'Moderate' },
  1: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-500', label: 'Low' },
};

const RISK_COLORS = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/15 text-green-400 border-green-500/30',
};

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-dark-500 text-xs">—</span>;
  let color = 'text-green-400';
  if (score >= 8) color = 'text-red-400';
  else if (score >= 6) color = 'text-orange-400';
  else if (score >= 4) color = 'text-yellow-400';

  return (
    <span className={`text-sm font-bold ${color}`}>
      {typeof score === 'number' ? score.toFixed(1) : score}
    </span>
  );
}

export default function DisasterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [showEditForm, setShowEditForm] = useState(false);
  const [showGridForm, setShowGridForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(null); // grid id
  const [teamName, setTeamName] = useState('');
  const [gridFormData, setGridFormData] = useState({
    grid_code: '',
    severity: 3,
    population: '',
    accessibility: 'accessible',
  });
  const [gridFormError, setGridFormError] = useState('');
  const [assignError, setAssignError] = useState('');
  const [deletingId, setDeletingId] = useState(false);
  const [runningAI, setRunningAI] = useState({});
  const [runningAllAI, setRunningAllAI] = useState(false);
  const [submittingGrid, setSubmittingGrid] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Fetch disaster
  const fetchDisaster = useCallback(async () => {
    const res = await getDisaster(id);
    return res.data;
  }, [id]);

  const fetchGridsForDisaster = useCallback(async () => {
    try {
      const res = await getGrids(id);
      const d = res.data;
      return Array.isArray(d) ? d : d.grids || [];
    } catch {
      return [];
    }
  }, [id]);

  const fetchAssignmentsList = useCallback(async () => {
    try {
      const res = await getAssignments();
      const d = res.data;
      return Array.isArray(d) ? d : d.assignments || [];
    } catch {
      return [];
    }
  }, []);

  const { data: disasterData, loading: loadingDisaster, refresh: refreshDisaster } = usePolling(fetchDisaster, 30000);
  const { data: gridsList, refresh: refreshGrids } = usePolling(fetchGridsForDisaster, 30000);
  const { data: assignmentsList, refresh: refreshAssignments } = usePolling(fetchAssignmentsList, 30000);

  const disaster = useMemo(() => {
    if (!disasterData) return null;
    return disasterData.disaster || disasterData;
  }, [disasterData]);

  const grids = gridsList || [];
  const allAssignments = assignmentsList || [];

  // Filter assignments for this disaster's grids
  const gridIds = useMemo(() => grids.map((g) => g.id || g._id), [grids]);
  const disasterAssignments = useMemo(
    () => allAssignments.filter((a) => gridIds.includes(a.grid_id) || a.disaster_id === id),
    [allAssignments, gridIds, id]
  );

  const severity = disaster ? (SEVERITY_COLORS[disaster.severity] || SEVERITY_COLORS[1]) : SEVERITY_COLORS[1];

  // Delete disaster
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this disaster? This cannot be undone.')) return;
    setDeletingId(true);
    try {
      await deleteDisaster(id);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingId(false);
    }
  };

  // Add grid
  const handleAddGrid = async (e) => {
    e.preventDefault();
    if (!gridFormData.grid_code.trim()) {
      setGridFormError('Grid code is required');
      return;
    }

    setSubmittingGrid(true);
    setGridFormError('');
    try {
      await createGrid({
        ...gridFormData,
        disaster_id: id,
        population: parseInt(gridFormData.population, 10) || 0,
        severity: parseInt(gridFormData.severity, 10),
      });
      setShowGridForm(false);
      setGridFormData({ grid_code: '', severity: 3, population: '', accessibility: 'accessible' });
      refreshGrids();
    } catch (err) {
      setGridFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to create grid');
    } finally {
      setSubmittingGrid(false);
    }
  };

  // Run AI
  const handleRunAI = async (gridId) => {
    setRunningAI((prev) => ({ ...prev, [gridId]: true }));
    try {
      await predictPriority(gridId);
      refreshGrids();
    } catch (err) {
      console.error('AI prediction failed:', err);
    } finally {
      setRunningAI((prev) => ({ ...prev, [gridId]: false }));
    }
  };

  // Run AI on all
  const handleRunAllAI = async () => {
    setRunningAllAI(true);
    try {
      await Promise.allSettled(grids.map((g) => predictPriority(g.id || g._id)));
      refreshGrids();
    } catch (err) {
      console.error('Batch AI prediction failed:', err);
    } finally {
      setRunningAllAI(false);
    }
  };

  // Assign team
  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setAssignError('Team name is required');
      return;
    }

    setSubmittingAssign(true);
    setAssignError('');
    try {
      await createAssignment({
        grid_id: showAssignForm,
        team_name: teamName,
      });
      setShowAssignForm(null);
      setTeamName('');
      refreshAssignments();
    } catch (err) {
      setAssignError(err.response?.data?.message || err.response?.data?.error || 'Failed to assign');
    } finally {
      setSubmittingAssign(false);
    }
  };

  if (loadingDisaster && !disaster) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!disaster) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-dark-600" />
        <p className="text-dark-400">Disaster not found</p>
        <button onClick={() => navigate('/dashboard')} className="text-primary-400 text-sm hover:underline">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Back + Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg glass border border-dark-600/30 text-dark-300 hover:text-white hover:border-dark-500 text-sm transition-all"
            >
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deletingId}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm transition-all disabled:opacity-50"
            >
              {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        )}
      </motion.div>

      {/* Disaster Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl ${severity.bg} flex items-center justify-center`}>
                <AlertTriangle className={`w-6 h-6 ${severity.text}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{disaster.title}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${severity.bg} ${severity.text} border border-opacity-30`}
                    style={{ borderColor: severity.text === 'text-red-400' ? '#ef444430' : undefined }}
                  >
                    Severity {disaster.severity}/5 — {severity.label}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-dark-800 text-dark-400 border border-dark-700 capitalize">
                    {disaster.disaster_type}
                  </span>
                  {disaster.status && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                      {disaster.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {disaster.description && (
              <p className="text-dark-400 text-sm mt-4 leading-relaxed">{disaster.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[200px]">
            <div className="glass-light rounded-lg p-3">
              <p className="text-[10px] text-dark-500 uppercase tracking-wider">Latitude</p>
              <p className="text-sm font-medium text-white">{disaster.latitude?.toFixed(4)}</p>
            </div>
            <div className="glass-light rounded-lg p-3">
              <p className="text-[10px] text-dark-500 uppercase tracking-wider">Longitude</p>
              <p className="text-sm font-medium text-white">{disaster.longitude?.toFixed(4)}</p>
            </div>
            <div className="glass-light rounded-lg p-3">
              <p className="text-[10px] text-dark-500 uppercase tracking-wider">Radius</p>
              <p className="text-sm font-medium text-white">{disaster.radius} km</p>
            </div>
            <div className="glass-light rounded-lg p-3">
              <p className="text-[10px] text-dark-500 uppercase tracking-wider">Created</p>
              <p className="text-sm font-medium text-white">
                {disaster.created_at ? new Date(disaster.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grids Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border-b border-dark-700/50">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Grid Zones</h2>
            <span className="text-xs text-dark-500">({grids.length})</span>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {grids.length > 0 && (
              <button
                onClick={handleRunAllAI}
                disabled={runningAllAI}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs font-medium transition-all disabled:opacity-50"
              >
                {runningAllAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                Run AI on All
              </button>
            )}
            <button
              onClick={() => setShowGridForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Grid
            </button>
          </div>
        </div>

        {/* Grid Form */}
        <AnimatePresence>
          {showGridForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddGrid}
              className="overflow-hidden border-b border-dark-700/50"
            >
              <div className="p-5 space-y-3">
                {gridFormError && (
                  <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{gridFormError}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Grid Code (e.g., A1)"
                    value={gridFormData.grid_code}
                    onChange={(e) => setGridFormData((p) => ({ ...p, grid_code: e.target.value }))}
                    className="bg-dark-800/80 border border-dark-600/50 rounded-lg px-3 py-2 text-white text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  />
                  <select
                    value={gridFormData.severity}
                    onChange={(e) => setGridFormData((p) => ({ ...p, severity: e.target.value }))}
                    className="bg-dark-800/80 border border-dark-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value={1} className="bg-dark-800">Severity 1</option>
                    <option value={2} className="bg-dark-800">Severity 2</option>
                    <option value={3} className="bg-dark-800">Severity 3</option>
                    <option value={4} className="bg-dark-800">Severity 4</option>
                    <option value={5} className="bg-dark-800">Severity 5</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Population"
                    value={gridFormData.population}
                    onChange={(e) => setGridFormData((p) => ({ ...p, population: e.target.value }))}
                    className="bg-dark-800/80 border border-dark-600/50 rounded-lg px-3 py-2 text-white text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  />
                  <select
                    value={gridFormData.accessibility}
                    onChange={(e) => setGridFormData((p) => ({ ...p, accessibility: e.target.value }))}
                    className="bg-dark-800/80 border border-dark-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="accessible" className="bg-dark-800">Accessible</option>
                    <option value="limited" className="bg-dark-800">Limited</option>
                    <option value="inaccessible" className="bg-dark-800">Inaccessible</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowGridForm(false)}
                    className="px-3 py-1.5 rounded-lg text-dark-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingGrid}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm transition-colors disabled:opacity-50"
                  >
                    {submittingGrid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add Grid
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Grid List */}
        {grids.length === 0 ? (
          <div className="p-8 text-center">
            <Grid3X3 className="w-10 h-10 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">No grid zones created yet</p>
            <p className="text-dark-600 text-xs mt-1">Add grid zones to divide the disaster area</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700/30">
            {grids.map((grid, index) => {
              const gridId = grid.id || grid._id;
              const riskStyle = RISK_COLORS[grid.risk_level] || 'bg-dark-700/30 text-dark-400 border-dark-600/30';

              return (
                <motion.div
                  key={gridId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 hover:bg-dark-800/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-sm font-bold text-dark-300">
                        {grid.grid_code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${riskStyle} capitalize`}>
                            {grid.risk_level || 'Unknown'}
                          </span>
                          <span className="text-xs text-dark-500">Pop: {grid.population?.toLocaleString() || '—'}</span>
                          <span className="text-xs text-dark-500 capitalize">Access: {grid.accessibility || '—'}</span>
                        </div>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-[10px] text-dark-500 uppercase">AI Score</p>
                        <ScoreBadge score={grid.ai_priority_score} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunAI(gridId)}
                        disabled={runningAI[gridId]}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs transition-all disabled:opacity-50"
                        title="Run AI Priority"
                      >
                        {runningAI[gridId] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        AI
                      </button>
                      <button
                        onClick={() => { setShowAssignForm(gridId); setTeamName(''); setAssignError(''); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs transition-all"
                        title="Assign Team"
                      >
                        <Users className="w-3 h-3" /> Assign
                      </button>
                    </div>
                  </div>

                  {/* Inline Assign Form */}
                  <AnimatePresence>
                    {showAssignForm === gridId && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleAssignTeam}
                        className="overflow-hidden mt-3"
                      >
                        <div className="flex items-center gap-2 pl-14">
                          <input
                            type="text"
                            placeholder="Team name"
                            value={teamName}
                            onChange={(e) => { setTeamName(e.target.value); setAssignError(''); }}
                            className="flex-1 bg-dark-800/80 border border-dark-600/50 rounded-lg px-3 py-1.5 text-white text-xs placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={submittingAssign}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs transition-colors disabled:opacity-50"
                          >
                            {submittingAssign ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAssignForm(null)}
                            className="p-1 text-dark-500 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {assignError && <p className="text-xs text-red-400 mt-1 pl-14">{assignError}</p>}
                      </motion.form>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Assignments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="flex items-center gap-2 p-5 border-b border-dark-700/50">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Team Assignments</h2>
          <span className="text-xs text-dark-500">({disasterAssignments.length})</span>
        </div>

        {disasterAssignments.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">No teams assigned yet</p>
            <p className="text-dark-600 text-xs mt-1">Assign teams to grid zones above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 uppercase tracking-wider">Team</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 uppercase tracking-wider">Grid</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 uppercase tracking-wider">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {disasterAssignments.map((assignment, idx) => {
                  const linkedGrid = grids.find((g) => (g.id || g._id) === assignment.grid_id);
                  return (
                    <motion.tr
                      key={assignment.id || assignment._id || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="py-3 px-5 font-medium text-white">{assignment.team_name}</td>
                      <td className="py-3 px-5 text-dark-300">{linkedGrid?.grid_code || assignment.grid_id}</td>
                      <td className="py-3 px-5"><ScoreBadge score={assignment.priority || linkedGrid?.ai_priority_score} /></td>
                      <td className="py-3 px-5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                          {assignment.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-dark-500 text-xs">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {assignment.assigned_at || assignment.created_at
                          ? new Date(assignment.assigned_at || assignment.created_at).toLocaleString()
                          : '—'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <DisasterForm
          disaster={disaster}
          onClose={() => setShowEditForm(false)}
          onSuccess={refreshDisaster}
        />
      )}
    </div>
  );
}
