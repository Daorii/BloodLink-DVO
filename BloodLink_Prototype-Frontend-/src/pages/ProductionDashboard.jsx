import React, { useState } from 'react';
import { useBloodStore } from '../store/useBloodStore';
import {
  Layers, Cpu, CheckCircle, AlertTriangle, Clock, Plus, X,
  Search, FlaskConical, Droplets, Activity, BarChart2,
  LogOut, ChevronsLeft, ChevronsRight, Check, RefreshCw,
  Thermometer, Timer, Package, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const COMPONENTS = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];
const PROCESSING_METHODS = [
  'Heavy Spin 4000 RPM x 10m @ 4°C',
  'Light Spin 2000 RPM x 7m @ 22°C',
  'Leukoreduction Filter Pass',
  'Apheresis – Platelet Collection',
  'Apheresis – Plasma Collection',
];
const QUALITY_STATUSES = ['Pass – Released', 'Fail – Discarded', 'Hold – Pending QC', 'Quarantine'];

// Seed mock data for display
const MOCK_LOGS = [
  {
    processingId: 'PROC-001', unitRef: 'WB-2026-9041', donorName: 'Juan Dela Cruz',
    bloodType: 'O+', sourceVolume: 450, componentType: 'PRBC', yieldVolume: 280,
    processingMethod: 'Heavy Spin 4000 RPM x 10m @ 4°C',
    processedBy: 'Engr. Miguel Reyes', processedAt: '2026-09-05 08:14', qualityStatus: 'Pass – Released',
    remarks: 'Nominal yield. Cleared for inventory.'
  },
  {
    processingId: 'PROC-002', unitRef: 'WB-2026-9042', donorName: 'Maria Santos',
    bloodType: 'A+', sourceVolume: 450, componentType: 'Platelet Concentrate', yieldVolume: 55,
    processingMethod: 'Light Spin 2000 RPM x 7m @ 22°C',
    processedBy: 'Engr. Miguel Reyes', processedAt: '2026-09-05 09:30', qualityStatus: 'Pass – Released',
    remarks: 'Standard platelet yield.'
  },
  {
    processingId: 'PROC-003', unitRef: 'WB-2026-9043', donorName: 'Robert Tan',
    bloodType: 'B-', sourceVolume: 450, componentType: 'FFP', yieldVolume: 200,
    processingMethod: 'Heavy Spin 4000 RPM x 10m @ 4°C',
    processedBy: 'Engr. Miguel Reyes', processedAt: '2026-09-05 10:45', qualityStatus: 'Hold – Pending QC',
    remarks: 'Awaiting final QC sign-off.'
  },
  {
    processingId: 'PROC-004', unitRef: 'WB-2026-9044', donorName: 'Sarah Cruz',
    bloodType: 'AB+', sourceVolume: 450, componentType: 'Cryoprecipitate', yieldVolume: 15,
    processingMethod: 'Heavy Spin 4000 RPM x 10m @ 4°C',
    processedBy: 'Engr. Miguel Reyes', processedAt: '2026-09-05 11:20', qualityStatus: 'Pass – Released',
    remarks: 'Cryo yield within acceptable range.'
  },
  {
    processingId: 'PROC-005', unitRef: 'WB-2026-9045', donorName: 'Joseph Castro',
    bloodType: 'O-', sourceVolume: 450, componentType: 'PRBC', yieldVolume: 265,
    processingMethod: 'Leukoreduction Filter Pass',
    processedBy: 'Engr. Miguel Reyes', processedAt: '2026-09-05 13:00', qualityStatus: 'Fail – Discarded',
    remarks: 'Hemolysis detected post-centrifugation. Discarded per SOP.'
  },
];

const emptyForm = {
  unitRef: '',
  donorName: '',
  bloodType: 'O+',
  sourceVolume: '450',
  componentType: 'PRBC',
  yieldVolume: '',
  processingMethod: PROCESSING_METHODS[0],
  qualityStatus: 'Pass – Released',
  remarks: '',
};

export default function ProductionDashboard() {
  const { authSystemUser, isSidebarCollapsed, toggleSidebar } = useBloodStore();

  const currentUser = authSystemUser || { name: 'Engr. Miguel Reyes', role: 'Production Staff', id: 'USR-008' };

  const [logs, setLogs] = useState(MOCK_LOGS);
  const [tab, setTab] = useState('processing');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterComponent, setFilterComponent] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stats
  const totalProcessed = logs.length;
  const released = logs.filter(l => l.qualityStatus === 'Pass – Released').length;
  const pending = logs.filter(l => l.qualityStatus === 'Hold – Pending QC').length;
  const discarded = logs.filter(l => l.qualityStatus === 'Fail – Discarded').length;

  const filtered = logs.filter(log => {
    const matchSearch =
      log.unitRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.bloodType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' || log.qualityStatus === filterStatus;
    const matchComp = filterComponent === 'All' || log.componentType === filterComponent;
    return matchSearch && matchStatus && matchComp;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLog = {
      ...form,
      processingId: 'PROC-' + String(100 + logs.length + 1).padStart(3, '0'),
      processedBy: currentUser.name,
      processedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setLogs(prev => [newLog, ...prev]);
    setShowForm(false);
    setForm(emptyForm);
    setSaveSuccess(true);
  };

  const qualityColor = (status) => {
    if (status === 'Pass – Released') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Fail – Discarded') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (status === 'Hold – Pending QC') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'Quarantine') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const componentIcon = (comp) => {
    if (comp === 'PRBC') return <Droplets className="w-3 h-3" />;
    if (comp === 'Platelet Concentrate') return <Activity className="w-3 h-3" />;
    if (comp === 'FFP') return <FlaskConical className="w-3 h-3" />;
    return <Package className="w-3 h-3" />;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden antialiased">
      {/* ── Sidebar (Matching Admin Sidebar Design) ── */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-30 flex-shrink-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div>
          {/* Header */}
          <div className={`py-4 border-b border-slate-100 flex items-center justify-between ${isSidebarCollapsed ? 'px-3' : 'px-5'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={bloodlinkLogo} alt="BloodLink Davao" className="h-9 w-auto object-contain flex-shrink-0" />
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <h1 className="font-bold text-sm text-slate-900 tracking-tight leading-tight">BloodLink</h1>
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Production Unit</p>
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
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center border border-orange-200">
                  MR
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-orange-100 text-orange-700 uppercase mt-0.5 border border-orange-200/60">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'processing', label: 'Component Processing', icon: Cpu },
              { id: 'quality', label: 'QC Dashboard', icon: CheckCircle },
              { id: 'schedule', label: 'Processing Queue', icon: Timer },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  tab === id
                    ? 'bg-orange-50 text-orange-700 border border-orange-200/60 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-orange-600 flex-shrink-0" />
                {!isSidebarCollapsed && <span>{label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <Link to="/" className="flex items-center gap-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <LogOut className="w-4 h-4 text-slate-400" />
            {!isSidebarCollapsed && <span>Exit Portal</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-xs">
          <div>
            <h2 className="text-slate-900 font-bold text-base leading-tight tracking-tight">
              {tab === 'processing' && 'Blood Component Separation & Processing'}
              {tab === 'quality' && 'Quality Control Dashboard'}
              {tab === 'schedule' && 'Processing Queue & Schedule'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tab === 'processing' && 'Whole blood fractionation · PRBC, Platelets, FFP, Cryoprecipitate, Cryosupernate'}
              {tab === 'quality' && 'QC sign-off, yield validation, and component release clearance'}
              {tab === 'schedule' && 'Incoming whole blood units awaiting centrifugation and separation'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> DOH NVBSP Section III Compliant
            </span>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* ── Stat Cards (Matching Admin Standard) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Processed Today</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalProcessed}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Fractionated runs</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Components Released</p>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">{released}</p>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Cleared for distribution</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pending QC Sign-off</p>
              <p className="text-2xl font-extrabold text-amber-600 font-mono">{pending}</p>
              <p className="text-[10px] text-amber-600 mt-1 font-semibold">Awaiting inspection</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Discarded / Failed QC</p>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">{discarded}</p>
              <p className="text-[10px] text-rose-600 mt-1 font-semibold">Hemolysis / SOP discard</p>
            </div>
          </div>

          {/* ── PROCESSING TAB ── */}
          {tab === 'processing' && (
            <>
              {/* Action Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search unit ref, donor, blood type…"
                      className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 w-64"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-white text-slate-700"
                  >
                    <option value="All">All Statuses</option>
                    {QUALITY_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select
                    value={filterComponent}
                    onChange={e => setFilterComponent(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-white text-slate-700"
                  >
                    <option value="All">All Components</option>
                    {COMPONENTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full md:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Log New Processing Run
                </button>
              </div>

              {/* Processing Logs Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Component Separation Processing Ledger</h3>
                    <p className="text-xs text-slate-500">Whole blood fractionation records – DOH Form Table 6A</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">Records: {filtered.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Process ID</th>
                        <th className="py-3 px-4">Unit Ref</th>
                        <th className="py-3 px-4">Donor</th>
                        <th className="py-3 px-4">Blood Type</th>
                        <th className="py-3 px-4">Component</th>
                        <th className="py-3 px-4">Source Vol (mL)</th>
                        <th className="py-3 px-4">Yield Vol (mL)</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">QC Status</th>
                        <th className="py-3 px-4">Processed By</th>
                        <th className="py-3 px-4">Date/Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-12 text-slate-400 text-sm">
                            No processing records found.
                          </td>
                        </tr>
                      ) : filtered.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px] tracking-tight">{log.processingId}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-orange-700 text-[11px]">{log.unitRef}</td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{log.donorName}</td>
                          <td className="py-3 px-4 font-black text-rose-600">{log.bloodType}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-50 text-orange-800 rounded-md text-[10px] font-bold border border-orange-200/60">
                              {componentIcon(log.componentType)} {log.componentType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{log.sourceVolume} mL</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{log.yieldVolume} mL</td>
                          <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate font-medium text-[11px]" title={log.processingMethod}>{log.processingMethod}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${qualityColor(log.qualityStatus)}`}>
                              {log.qualityStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{log.processedBy}</td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.processedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── QUALITY CONTROL TAB ── */}
          {tab === 'quality' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QC Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">QC Release Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'PRBC', released: 2, pending: 0, failed: 1 },
                    { label: 'Platelet Concentrate', released: 1, pending: 0, failed: 0 },
                    { label: 'FFP', released: 0, pending: 1, failed: 0 },
                    { label: 'Cryoprecipitate', released: 1, pending: 0, failed: 0 },
                    { label: 'Cryosupernate', released: 0, pending: 0, failed: 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-700 w-40 flex-shrink-0">{item.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(item.released / (item.released + item.pending + item.failed || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-2 text-[10px] font-bold flex-shrink-0">
                        <span className="text-emerald-700">{item.released} ✓</span>
                        <span className="text-amber-600">{item.pending} ⏳</span>
                        <span className="text-rose-600">{item.failed} ✗</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending QC Items */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/50">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" /> Pending QC Sign-off
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {logs.filter(l => l.qualityStatus === 'Hold – Pending QC').map((log, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{log.unitRef} — <span className="text-orange-700">{log.componentType}</span></p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{log.donorName} · {log.bloodType} · {log.yieldVolume} mL</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{log.remarks}</p>
                      </div>
                      <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition">
                        Sign Off
                      </button>
                    </div>
                  ))}
                  {logs.filter(l => l.qualityStatus === 'Hold – Pending QC').length === 0 && (
                    <div className="px-6 py-10 text-center text-slate-400 text-sm">
                      All components cleared. No pending QC items.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SCHEDULE / QUEUE TAB ── */}
          {tab === 'schedule' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm">Incoming Whole Blood Processing Queue</h3>
                <p className="text-xs text-slate-500">Units collected today awaiting centrifugation and component separation</p>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Queue #</th>
                    <th className="py-3 px-4">Collection Ref</th>
                    <th className="py-3 px-4">Donor</th>
                    <th className="py-3 px-4">Blood Type</th>
                    <th className="py-3 px-4">Volume (mL)</th>
                    <th className="py-3 px-4">Collection Time</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {[
                    { q: 'Q-001', ref: 'WB-2026-9046', donor: 'Patricia Gomez', bt: 'O-', vol: 450, time: '07:30', priority: 'Urgent', status: 'Ready for Processing' },
                    { q: 'Q-002', ref: 'WB-2026-9047', donor: 'Mark Reyes', bt: 'B+', vol: 450, time: '08:15', priority: 'Routine', status: 'Ready for Processing' },
                    { q: 'Q-003', ref: 'WB-2026-9048', donor: 'Elena Diaz', bt: 'A-', vol: 430, time: '09:00', priority: 'Routine', status: 'In Processing' },
                    { q: 'Q-004', ref: 'WB-2026-9049', donor: 'Jose Mercado', bt: 'O+', vol: 450, time: '10:30', priority: 'Routine', status: 'Waiting' },
                  ].map((row) => (
                    <tr key={row.q} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.q}</td>
                      <td className="py-3 px-4 font-semibold text-orange-700">{row.ref}</td>
                      <td className="py-3 px-4 text-slate-700">{row.donor}</td>
                      <td className="py-3 px-4 font-black text-rose-600">{row.bt}</td>
                      <td className="py-3 px-4 font-bold text-slate-700">{row.vol} mL</td>
                      <td className="py-3 px-4 text-slate-500">{row.time} AM</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'In Processing' ? 'bg-blue-100 text-blue-700' :
                          row.status === 'Ready for Processing' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── LOG FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-white flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Production Staff Module</p>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">Log Blood Component Processing Run</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit Reference ID</label>
                  <input required type="text" value={form.unitRef}
                    onChange={e => setForm({ ...form, unitRef: e.target.value })}
                    placeholder="WB-2026-XXXX"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Confirmed Blood Type</label>
                  <select value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 text-rose-600">
                    {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Donor Name</label>
                <input type="text" value={form.donorName}
                  onChange={e => setForm({ ...form, donorName: e.target.value })}
                  placeholder="Full name of donor"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Volume (mL)</label>
                  <input required type="number" value={form.sourceVolume}
                    onChange={e => setForm({ ...form, sourceVolume: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Yield Volume (mL)</label>
                  <input required type="number" value={form.yieldVolume}
                    onChange={e => setForm({ ...form, yieldVolume: e.target.value })}
                    placeholder="Actual yield"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Processing Parameters</p>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Component Type</label>
                  <select value={form.componentType} onChange={e => setForm({ ...form, componentType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold text-xs text-orange-700 outline-none focus:ring-2 focus:ring-orange-500">
                    {COMPONENTS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Processing Method</label>
                  <select value={form.processingMethod} onChange={e => setForm({ ...form, processingMethod: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs outline-none focus:ring-2 focus:ring-orange-500">
                    {PROCESSING_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">QC / Quality Status</label>
                  <select value={form.qualityStatus} onChange={e => setForm({ ...form, qualityStatus: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold text-xs outline-none focus:ring-2 focus:ring-orange-500">
                    {QUALITY_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks / Notes</label>
                <textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })}
                  rows={2} placeholder="Optional processing notes…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-sm">
                  Save Processing Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SUCCESS NOTICE ── */}
      {saveSuccess && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Processing Run Logged!</h3>
            <p className="text-xs text-slate-600">
              The component processing record has been saved and signed off by <strong>{currentUser.name}</strong>.
            </p>
            <button onClick={() => setSaveSuccess(false)}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm">
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
