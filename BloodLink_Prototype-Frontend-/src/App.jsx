import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DonorRegister from './pages/DonorRegister';
import DonorDashboard from './pages/DonorDashboard';
import DonorNotification from './pages/DonorNotification';
import DonorConfirm from './pages/DonorConfirm';
import AdminDashboard from './pages/AdminDashboard';
import RegistryDashboard from './pages/RegistryDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
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
        <Route path="/donor/register" element={<DonorRegister />} />
        <Route path="/donor/dashboard" element={<DonorDashboard />} />
        <Route path="/donor/notification" element={<DonorNotification />} />
        <Route path="/donor/confirm" element={<DonorConfirm />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/registry/dashboard" element={<RegistryDashboard />} />
        <Route path="/bloodbank/dashboard" element={<BloodBankDashboard />} />
        <Route path="/issuance/dashboard" element={<IssuanceDashboard />} />
        <Route path="/serology/dashboard" element={<SerologyDashboard />} />
        <Route path="/production/dashboard" element={<ProductionDashboard />} />
      </Routes>
    </Router>
  );
}
