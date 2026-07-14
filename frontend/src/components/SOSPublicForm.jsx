import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, User, MapPin, MessageSquare, Send, CheckCircle2, Loader2, Navigation, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SOSPublicForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
    latitude: '',
    longitude: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.message.trim()) newErrors.message = 'Describe your emergency';
    if (formData.latitude === '' || isNaN(Number(formData.latitude))) newErrors.latitude = 'Latitude is required';
    if (formData.longitude === '' || isNaN(Number(formData.longitude))) newErrors.longitude = 'Longitude is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setSubmitError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocationGranted(true);
        setLocating(false);
        setErrors((prev) => ({ ...prev, latitude: undefined, longitude: undefined }));
      },
      (err) => {
        setLocating(false);
        setSubmitError('Location access denied. Please enter coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      await axios.post(`${API_URL}/sos`, {
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 429) {
        setSubmitError('Too many requests. Please wait a moment and try again.');
      } else {
        setSubmitError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit SOS request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-dark-800/80 border ${errors[field] ? 'border-red-500/50' : 'border-dark-600/50'} rounded-lg px-4 py-3 text-white text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50 transition-all`;

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-950 bg-grid-pattern flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/[0.05] rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="glass-card rounded-2xl p-8 max-w-md w-full text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">SOS Submitted</h2>
          <p className="text-dark-400 mb-6">
            Your emergency request has been received. Emergency coordination services have been notified and will respond as quickly as possible.
          </p>
          <div className="space-y-3">
            <a
              href="/sos-submit"
              onClick={(e) => {
                e.preventDefault();
                setSubmitted(false);
                setFormData({ name: '', phone: '', message: '', latitude: '', longitude: '' });
                setLocationGranted(false);
              }}
              className="block w-full px-4 py-3 rounded-lg bg-dark-800/80 border border-dark-600/50 text-dark-300 hover:text-white hover:border-dark-500 text-sm font-medium transition-all"
            >
              Submit Another Request
            </a>
            <a
              href="/login"
              className="block text-sm text-dark-500 hover:text-dark-300 transition-colors"
            >
              Go to Login →
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 bg-grid-pattern flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/[0.03] rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-2xl w-full max-w-lg relative z-10 overflow-hidden"
      >
        {/* Emergency banner */}
        <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border-b border-red-500/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center animate-pulse-slow">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text-red">Emergency SOS</h1>
              <p className="text-dark-400 text-sm">Submit an emergency request. No login required.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {submitError}
            </motion.div>
          )}

          {/* Name */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-dark-300 mb-1.5">
              <User className="w-3.5 h-3.5" /> Your Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full name"
              className={inputClass('name')}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-dark-300 mb-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className={inputClass('phone')}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-dark-300 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Emergency Description
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              placeholder="Describe your emergency situation..."
              className={`${inputClass('message')} resize-none`}
            />
            {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-dark-300 mb-1.5">
              <MapPin className="w-3.5 h-3.5" /> Location
            </label>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium disabled:opacity-50"
            >
              {locating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {locating ? 'Getting Location...' : locationGranted ? '✓ Location Detected — Update' : 'Use My Location'}
            </button>
            <div className="grid grid-cols-2 gap-3">
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

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {submitting ? 'Sending SOS...' : 'Send Emergency SOS'}
          </button>

          <div className="text-center pt-2">
            <a href="/login" className="text-xs text-dark-500 hover:text-dark-400 transition-colors">
              <ArrowLeft className="w-3 h-3 inline mr-1" />
              Back to Login
            </a>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
