import React from 'react';
import { HashRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { useBloodStore } from './store/useBloodStore';
import { getToken } from './services/api';
import Home from './pages/Home';
import Login from './pages/Login';
import DonorRegister from './pages/DonorRegister';
import DonorDashboard from './pages/DonorDashboard';
import DonorNotification from './pages/DonorNotification';
import DonorConfirm from './pages/DonorConfirm';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import RegistryDashboard from './pages/RegistryDashboard';
import IssuanceDashboard from './pages/IssuanceDashboard';
import SerologyDashboard from './pages/SerologyDashboard';
import ProductionDashboard from './pages/ProductionDashboard';
// ── One-time stale store cleanup ──────────────────────────────────────────
// Clear old localStorage entries that don't have a version field.
// Zustand persist v3 will create a fresh entry with the correct version.
try {
  const raw = localStorage.getItem('bloodlink-dvo-store');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!parsed?.version || parsed.version < 13) {
      localStorage.removeItem('bloodlink-dvo-store');
    }
  }
} catch (_) {
  localStorage.removeItem('bloodlink-dvo-store');
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donor/register" element={<DonorRegister />} />
        <Route path="/donor/dashboard" element={<DonorDashboard />} />
        <Route path="/donor/notification" element={<DonorNotification />} />
        <Route path="/donor/confirm" element={<DonorConfirm />} />
        <Route path="/admin/dashboard" element={<RequireSystemUser roles={['Administrator']}><AdminDashboard /></RequireSystemUser>} />
        <Route path="/superadmin/dashboard" element={<RequireSystemUser roles={['Super Admin']}><SuperAdminDashboard /></RequireSystemUser>} />
        <Route path="/registry/dashboard" element={<RequireSystemUser roles={['Registry Staff']}><RegistryDashboard /></RequireSystemUser>} />
        <Route path="/issuance/dashboard" element={<RequireSystemUser roles={['Issuance Personnel', 'Hospital User']}><IssuanceDashboard /></RequireSystemUser>} />
        <Route path="/serology/dashboard" element={<RequireSystemUser roles={['Serology Staff']}><SerologyDashboard /></RequireSystemUser>} />
        <Route path="/production/dashboard" element={<RequireSystemUser roles={['Production Staff']}><ProductionDashboard /></RequireSystemUser>} />
      </Routes>
    </Router>
  );
}

function RequireSystemUser({ roles, children }) {
  const user = useBloodStore((state) => state.authSystemUser);
  if (!user || !getToken()) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}
