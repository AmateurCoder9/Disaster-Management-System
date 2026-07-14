import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { createDisaster, updateDisaster } from '../services/api';

const DISASTER_TYPES = [
  'earthquake', 'flood', 'wildfire', 'hurricane', 'tsunami', 'other',
];

const SEVERITY_LEVELS = [
  { value: 1, label: '1 — Low', color: 'text-green-400' },
  { value: 2, label: '2 — Moderate', color: 'text-blue-400' },
  { value: 3, label: '3 — Medium', color: 'text-yellow-400' },
  { value: 4, label: '4 — High', color: 'text-orange-400' },
  { value: 5, label: '5 — Critical', color: 'text-red-400' },
];

const initialFormData = {
  title: '',
  disaster_type: 'earthquake',
  description: '',
  latitude: '',
  longitude: '',
  severity: 3,
  radius: 10,
};

export default function DisasterForm({ disaster, onClose, onSuccess }) {
  const isEdit = !!disaster;
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (disaster) {
      setFormData({
        title: disaster.title || '',
        disaster_type: disaster.disaster_type || 'earthquake',
        description: disaster.description || '',
        latitude: disaster.latitude ?? '',
        longitude: disaster.longitude ?? '',
        severity: disaster.severity ?? 3,
        radius: disaster.radius ?? 10,
      });
    }
  }, [disaster]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.disaster_type) newErrors.disaster_type = 'Type is required';
    if (formData.latitude === '' || isNaN(Number(formData.latitude))) newErrors.latitude = 'Valid latitude required';
    if (formData.longitude === '' || isNaN(Number(formData.longitude))) newErrors.longitude = 'Valid longitude required';
    const lat = Number(formData.latitude);
    const lng = Number(formData.longitude);
    if (!isNaN(lat) && (lat < -90 || lat > 90)) newErrors.latitude = 'Latitude must be between -90 and 90';
    if (!isNaN(lng) && (lng < -180 || lng > 180)) newErrors.longitude = 'Longitude must be between -180 and 180';
    if (!formData.radius || Number(formData.radius) <= 0) newErrors.radius = 'Radius must be positive';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    const payload = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      severity: parseInt(formData.severity, 10),
      radius: parseFloat(formData.radius),
    };

    try {
      if (isEdit) {
        await updateDisaster(disaster.id || disaster._id, payload);
      } else {
        await createDisaster(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.response?.data?.error || 'Failed to save disaster');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-dark-800/80 border ${errors[field] ? 'border-red-500/50' : 'border-dark-600/50'} rounded-lg px-4 py-2.5 text-white text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative glass-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isEdit ? 'Edit Disaster' : 'Report New Disaster'}
                </h2>
                <p className="text-xs text-dark-400">Fill in disaster details below</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-dark-500 hover:text-white hover:bg-dark-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {submitError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {submitError}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Hurricane Delta"
                className={inputClass('title')}
              />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
            </div>

            {/* Type + Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Type</label>
                <select
                  name="disaster_type"
                  value={formData.disaster_type}
                  onChange={handleChange}
                  className={inputClass('disaster_type')}
                >
                  {DISASTER_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-dark-800">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.disaster_type && <p className="mt-1 text-xs text-red-400">{errors.disaster_type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className={inputClass('severity')}
                >
                  {SEVERITY_LEVELS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-dark-800">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the disaster situation..."
                className={`${inputClass('description')} resize-none`}
              />
            </div>

            {/* Coordinates */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Coordinates
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="Latitude"
                    className={inputClass('latitude')}
                  />
                  {errors.latitude && <p className="mt-1 text-xs text-red-400">{errors.latitude}</p>}
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="Longitude"
                    className={inputClass('longitude')}
                  />
                  {errors.longitude && <p className="mt-1 text-xs text-red-400">{errors.longitude}</p>}
                </div>
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Radius (km)</label>
              <input
                type="number"
                step="any"
                name="radius"
                value={formData.radius}
                onChange={handleChange}
                placeholder="Affected area radius in km"
                className={inputClass('radius')}
              />
              {errors.radius && <p className="mt-1 text-xs text-red-400">{errors.radius}</p>}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEdit ? 'Update' : 'Create'} Disaster
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
