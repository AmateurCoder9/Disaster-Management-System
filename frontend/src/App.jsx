import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './hooks/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import DisasterDetailPage from './pages/DisasterDetailPage';
import SOSPage from './pages/SOSPage';
import SOSPublicForm from './components/SOSPublicForm';

function App() {
  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sos-submit" element={<SOSPublicForm />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Layout><MapPage /></Layout></ProtectedRoute>} />
          <Route path="/disasters/:id" element={<ProtectedRoute><Layout><DisasterDetailPage /></Layout></ProtectedRoute>} />
          <Route path="/sos" element={<ProtectedRoute><Layout><SOSPage /></Layout></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}

export default App;
