import React, { useState } from 'react';
import { useBloodStore } from '../store/useBloodStore';
import {
  Droplets, ShieldCheck, AlertTriangle, FileText, CheckCircle, Plus, X, Search,
  Check, LogOut, Activity, Lock, FlaskConical, Award, RefreshCw, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import davaoLogo from '../assets/bloodlinks_logo/davao-logo.png';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function SerologyDashboard() {
  const {
    donors, donations, labTestResults, addLabTestResult,
    authSystemUser, isSidebarCollapsed, toggleSidebar
  } = useBloodStore();

  const [tab, setTab] = useState('serology');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState('All');
  const [showEncodeModal, setShowEncodeModal] = useState(false);
  const [encodeSuccess, setEncodeSuccess] = useState(false);

  const [labForm, setLabForm] = useState({
    donationId: 'DON-001',
    donorName: 'Juan Dela Cruz',
    donationDate: new Date().toISOString().slice(0, 10),
    hemoglobinResult: '14.5',
    bloodTypeConfirmed: 'O+',
    hbsagResult: 'Non-Reactive',
    syphilisResult: 'Non-Reactive',
    hivResult: 'Non-Reactive',
    hcvResult: 'Non-Reactive',
    malariaResult: 'Non-Reactive',
    natResult: 'Non-Reactive',
    othersResult: 'Cleared for Transfusion'
  });

  const currentUser = authSystemUser || { name: 'Dr. Clara Santos (RMT)', role: 'Serology Staff', id: 'USR-007' };

  // Filtered lab results list
  const filteredResults = (labTestResults || []).filter(item => {
    const matchesSearch = item.donationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.bloodTypeConfirmed || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.recordedBy || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterResult === 'Reactive') {
      return matchesSearch && (
        item.hbsagResult === 'Reactive' || item.syphilisResult === 'Reactive' ||
        item.hivResult === 'Reactive' || item.hcvResult === 'Reactive' || item.malariaResult === 'Reactive'
      );
    }
    if (filterResult === 'Cleared') {
      return matchesSearch && (
        item.hbsagResult === 'Non-Reactive' && item.syphilisResult === 'Non-Reactive' &&
        item.hivResult === 'Non-Reactive' && item.hcvResult === 'Non-Reactive' && item.malariaResult === 'Non-Reactive'
      );
    }
    return matchesSearch;
  });

  const totalTested = (labTestResults || []).length;
  const reactiveCount = (labTestResults || []).filter(item =>
    item.hbsagResult === 'Reactive' || item.syphilisResult === 'Reactive' ||
    item.hivResult === 'Reactive' || item.hcvResult === 'Reactive' || item.malariaResult === 'Reactive'
  ).length;
  const clearedCount = totalTested - reactiveCount;
  const clearedRate = totalTested > 0 ? ((clearedCount / totalTested) * 100).toFixed(1) : '100.0';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden antialiased">
      {/* Sidebar - Matching Admin Sidebar Design */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-30 flex-shrink-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div>
          {/* Logo Header */}
          <div className={`py-4 border-b border-slate-100 flex items-center justify-between ${isSidebarCollapsed ? 'px-3' : 'px-5'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={bloodlinkLogo} alt="BloodLink Davao" className="h-9 w-auto object-contain flex-shrink-0" />
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <h1 className="font-bold text-sm text-slate-900 tracking-tight leading-tight">BloodLink</h1>
                  <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Serology Lab Portal</p>
                </div>
              )}
            </div>
            <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              {isSidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>

          {/* User Card */}
          {!isSidebarCollapsed && (
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-200">
                  CS
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 uppercase mt-0.5 border border-purple-200/60">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nav Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setTab('serology')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'serology'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
              {!isSidebarCollapsed && <span>TTI Screening Ledger</span>}
            </button>
          </nav>
        </div>

        {/* Exit Portal */}
        <div className="p-4 border-t border-slate-100">
          <Link to="/" className="flex items-center gap-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <LogOut className="w-4 h-4 text-slate-400" />
            {!isSidebarCollapsed && <span>Exit Portal</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-xs">
          <div>
            <h2 className="text-slate-900 font-bold text-base leading-tight tracking-tight">
              Serology & Transmissible Disease Screening Workspace
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Laboratory-confirmed HIV, HBV, HCV, Syphilis & Malaria testing for donor safety compliance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> DOH NVBSP Section II Compliant
            </span>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-8 space-y-6">
          {/* KPI Cards — Matching Admin Metric Card Standard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Tested Donations</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalTested}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Confirmed by RMT Analyst</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">TTI Cleared Rate</p>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">{clearedRate}%</p>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Non-Reactive Safety Standard</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Quarantined / Reactive</p>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">{reactiveCount}</p>
              <p className="text-[10px] text-rose-600 mt-1 font-semibold">Flagged for Confirmation</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pending Verification</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">0</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Up to date</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search donation ref, blood type..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-600 bg-slate-50/50"
                />
              </div>
              <select
                value={filterResult}
                onChange={e => setFilterResult(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-white text-slate-700"
              >
                <option value="All">All Results</option>
                <option value="Cleared">Cleared (Non-Reactive)</option>
                <option value="Reactive">Reactive (Quarantined)</option>
              </select>
            </div>

            <button
              onClick={() => setShowEncodeModal(true)}
              className="w-full md:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Encode New Serology Test Result
            </button>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lab-Confirmed Serology & TTI Testing Ledger</h3>
                <p className="text-xs text-slate-500">Transmissible Infectious Disease Screening Records (Table 8)</p>
              </div>
              <span className="text-xs font-bold text-slate-400">Total: {filteredResults.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Test ID</th>
                    <th className="py-3 px-4">Donation Ref</th>
                    <th className="py-3 px-4">Hemoglobin (g/dL)</th>
                    <th className="py-3 px-4">Confirmed Blood Group</th>
                    <th className="py-3 px-4">HBsAg</th>
                    <th className="py-3 px-4">Syphilis</th>
                    <th className="py-3 px-4">HIV 1/2</th>
                    <th className="py-3 px-4">HCV</th>
                    <th className="py-3 px-4">Malaria</th>
                    <th className="py-3 px-4">NAT</th>
                    <th className="py-3 px-4">RMT Analyst</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredResults.map((row, idx) => {
                    const isReactive = row.hbsagResult === 'Reactive' || row.syphilisResult === 'Reactive' ||
                      row.hivResult === 'Reactive' || row.hcvResult === 'Reactive' || row.malariaResult === 'Reactive';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px] tracking-tight">{row.testId || `LAB-00${idx + 1}`}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-purple-700 text-[11px]">{row.donationId}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{row.hemoglobinResult || '14.2'} g/dL</td>
                        <td className="py-3 px-4 font-black text-rose-600">{row.bloodTypeConfirmed || 'O+'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.hbsagResult === 'Reactive' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {row.hbsagResult}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.syphilisResult === 'Reactive' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {row.syphilisResult}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.hivResult === 'Reactive' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {row.hivResult}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.hcvResult === 'Reactive' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {row.hcvResult}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.malariaResult === 'Reactive' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {row.malariaResult}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700">{row.natResult || 'Non-Reactive'}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{row.recordedBy || 'Dr. Clara Santos (RMT)'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ENCODE SEROLOGY MODAL */}
      {showEncodeModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Serology Staff Module</p>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">Encode Lab-Confirmed TTI Results</h3>
              </div>
              <button onClick={() => setShowEncodeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addLabTestResult({
                  ...labForm,
                  testId: 'LAB-' + Math.floor(100 + Math.random() * 900),
                  recordedBy: currentUser.name
                });
                setShowEncodeModal(false);
                setEncodeSuccess(true);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Donation Ref ID</label>
                  <input
                    type="text"
                    required
                    value={labForm.donationId}
                    onChange={e => setLabForm({ ...labForm, donationId: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Confirmed Blood Type</label>
                  <select
                    value={labForm.bloodTypeConfirmed}
                    onChange={e => setLabForm({ ...labForm, bloodTypeConfirmed: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600 text-rose-600"
                  >
                    {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hemoglobin Result (g/dL)</label>
                <input
                  type="text"
                  required
                  value={labForm.hemoglobinResult}
                  onChange={e => setLabForm({ ...labForm, hemoglobinResult: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* TTI Screening Options */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">TTI Infection Screening Results</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">HBsAg (Hepatitis B)</label>
                    <select
                      value={labForm.hbsagResult}
                      onChange={e => setLabForm({ ...labForm, hbsagResult: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold"
                    >
                      <option>Non-Reactive</option>
                      <option>Reactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Syphilis / VDRL</label>
                    <select
                      value={labForm.syphilisResult}
                      onChange={e => setLabForm({ ...labForm, syphilisResult: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold"
                    >
                      <option>Non-Reactive</option>
                      <option>Reactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">HIV 1/2</label>
                    <select
                      value={labForm.hivResult}
                      onChange={e => setLabForm({ ...labForm, hivResult: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold"
                    >
                      <option>Non-Reactive</option>
                      <option>Reactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Anti-HCV (Hepatitis C)</label>
                    <select
                      value={labForm.hcvResult}
                      onChange={e => setLabForm({ ...labForm, hcvResult: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold"
                    >
                      <option>Non-Reactive</option>
                      <option>Reactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEncodeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm"
                >
                  Save & Sign Off Test Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS NOTICE */}
      {encodeSuccess && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Serology Test Result Saved!</h3>
            <p className="text-xs text-slate-600">
              The lab result has been recorded and signed off by <strong>{currentUser.name}</strong>.
            </p>
            <button
              onClick={() => setEncodeSuccess(false)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
