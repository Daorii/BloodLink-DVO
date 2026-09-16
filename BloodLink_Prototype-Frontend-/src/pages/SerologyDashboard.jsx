import React, { useState, useEffect } from 'react';
import { useBloodStore } from '../store/useBloodStore';
import {
  ShieldCheck, AlertTriangle, FileText, CheckCircle, Plus, X, Search,
  LogOut, Activity, FlaskConical, Award, ChevronsLeft, ChevronsRight,
  Clock, Eye, RefreshCw, Hash, ChevronLeft, ChevronRight, Droplets
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const TTI_TESTS = [
  { label: 'HBsAg (Hepatitis B)', key: 'hbsagResult' },
  { label: 'Syphilis / VDRL',     key: 'syphilisResult' },
  { label: 'HIV 1/2',             key: 'hivResult' },
  { label: 'Anti-HCV (Hep. C)',   key: 'hcvResult' },
  { label: 'Malaria',             key: 'malariaResult' },
  { label: 'NAT',                 key: 'natResult' },
];
const ITEMS_PER_PAGE = 10;

function ResultBadge({ value }) {
  const base = 'px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block';
  if (value === 'Reactive')     return <span className={`${base} bg-rose-50 text-rose-700 border-rose-200`}>{value}</span>;
  if (value === 'Indeterminate') return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>{value}</span>;
  return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>{value ?? '—'}</span>;
}

export default function SerologyDashboard() {
  const {
    labTestResults, donations, addLabTestResult, fetchDonationBySerial,
    fetchLabResultsFromAPI, fetchDonationsFromAPI,
    authSystemUser, isSidebarCollapsed, toggleSidebar
  } = useBloodStore();

  const [searchQuery, setSearchQuery]     = useState('');
  const [filterResult, setFilterResult]   = useState('All');
  const [currentPage, setCurrentPage]     = useState(1);
  const [showModal, setShowModal]         = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [lookupStatus, setLookupStatus]   = useState('idle'); // idle | loading | found | not-found | already-done
  const [viewRow, setViewRow]             = useState(null);

  const [form, setForm] = useState({
    serialNumber:      '',
    donorId:           '',        // internal — not shown to Serology
    eventId:           '',        // internal
    donationDate:      new Date().toISOString().slice(0, 10),
    hemoglobinResult:  '',
    bloodTypeConfirmed:'',
    hbsagResult:       'Non-Reactive',
    syphilisResult:    'Non-Reactive',
    hivResult:         'Non-Reactive',
    hcvResult:         'Non-Reactive',
    malariaResult:     'Non-Reactive',
    natResult:         'Non-Reactive',
    othersResult:      '',
    screeningOutcome:  'Accepted',  // determined by Serology based on TTI results
    deferralReason:    '',
  });

  useEffect(() => {
    fetchLabResultsFromAPI();
    fetchDonationsFromAPI();
  }, []);

  // Serial number lookup — populates internal IDs only, does NOT reveal donor name
  const handleSerialLookup = async (serial) => {
    if (!serial || serial.trim().length < 2) { setLookupStatus('idle'); return; }
    setLookupStatus('loading');
    try {
      const data = await fetchDonationBySerial(serial.trim());
      if (data?.donation) {
        const don = data.donation;
        setForm(prev => ({
          ...prev,
          donorId:      don.donorId      || don.donor_id   || '',
          eventId:      don.eventId      || don.event_id   || '',
          donationDate: don.donationDate || prev.donationDate,
        }));
        setLookupStatus(data.hasLabResult ? 'already-done' : 'found');
      } else {
        setLookupStatus('not-found');
      }
    } catch {
      setLookupStatus('not-found');
    }
  };

  // Derived stats
  const allResults    = labTestResults || [];
  const totalTested   = allResults.length;
  const reactiveCount = allResults.filter(r =>
    r.hbsagResult === 'Reactive' || r.syphilisResult === 'Reactive' ||
    r.hivResult   === 'Reactive' || r.hcvResult     === 'Reactive' ||
    r.malariaResult === 'Reactive'
  ).length;
  const clearedRate = totalTested > 0
    ? (((totalTested - reactiveCount) / totalTested) * 100).toFixed(1) : '100.0';

  // Pending donations (no lab result yet)
  const pendingDonations = (donations || []).filter(d => !d.hasLabResult);

  // Filtered + paginated results
  const filteredResults = allResults.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (item.serialNumber || '').toLowerCase().includes(q) ||
      (item.testId       || '').toLowerCase().includes(q) ||
      (item.bloodTypeConfirmed || '').toLowerCase().includes(q);
    if (filterResult === 'Reactive') {
      return matchSearch && (
        item.hbsagResult === 'Reactive' || item.syphilisResult === 'Reactive' ||
        item.hivResult   === 'Reactive' || item.hcvResult     === 'Reactive' ||
        item.malariaResult === 'Reactive'
      );
    }
    if (filterResult === 'Cleared') {
      return matchSearch && (
        item.hbsagResult !== 'Reactive' && item.syphilisResult !== 'Reactive' &&
        item.hivResult   !== 'Reactive' && item.hcvResult     !== 'Reactive' &&
        item.malariaResult !== 'Reactive'
      );
    }
    return matchSearch;
  });

  const totalPages    = Math.max(1, Math.ceil(filteredResults.length / ITEMS_PER_PAGE));
  const pageStart     = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedResults  = filteredResults.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const openModal = (prefill = null) => {
    setForm({
      serialNumber: prefill?.serialNumber || prefill?.serial_number || '',
      donorId:      prefill?.donorId      || prefill?.donor_id      || '',
      eventId:      prefill?.eventId      || prefill?.event_id      || '',
      donationDate: prefill?.donationDate || new Date().toISOString().slice(0, 10),
      hemoglobinResult: '', bloodTypeConfirmed: '',
      hbsagResult: 'Non-Reactive', syphilisResult: 'Non-Reactive',
      hivResult: 'Non-Reactive', hcvResult: 'Non-Reactive',
      malariaResult: 'Non-Reactive', natResult: 'Non-Reactive',
      othersResult: '', screeningOutcome: 'Accepted', deferralReason: '',
    });
    setLookupStatus(prefill ? 'found' : 'idle');
    setSaved(false); setSaveError(''); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.serialNumber) { setSaveError('Serial number is required.'); return; }
    if (lookupStatus === 'already-done') { setSaveError('Lab results already recorded for this serial number.'); return; }
    setSaving(true); setSaveError('');
    try {
      await addLabTestResult({ ...form, screeningOutcome: form.screeningOutcome });
      setSaved(true);
      setTimeout(() => { setShowModal(false); setSaved(false); }, 1500);
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const currentUser = authSystemUser || { name: 'Serology Staff', role: 'Serology Staff' };
  const initials = (currentUser.name || 'SS').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden antialiased">

      {/* ── Sidebar ── */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-30 flex-shrink-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div>
          <div className={`py-4 border-b border-slate-100 flex items-center justify-between ${isSidebarCollapsed ? 'px-3' : 'px-5'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={bloodlinkLogo} alt="BloodLink" className="h-9 w-auto object-contain flex-shrink-0" />
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
          {!isSidebarCollapsed && (
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-200">{initials}</div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 uppercase mt-0.5 border border-purple-200/60">{currentUser.role}</span>
                </div>
              </div>
            </div>
          )}
          <nav className="p-3 space-y-1">
            <div className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
              {!isSidebarCollapsed && <span>TTI Screening Ledger</span>}
            </div>
            {pendingDonations.length > 0 && !isSidebarCollapsed && (
              <div className="mx-2 mt-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
                <Clock className="w-3 h-3" />
                {pendingDonations.length} pending result{pendingDonations.length > 1 ? 's' : ''}
              </div>
            )}
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
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-xs">
          <div>
            <h2 className="text-slate-900 font-bold text-base leading-tight tracking-tight">Serology & Transmissible Disease Screening</h2>
            <p className="text-xs text-slate-500 mt-0.5">HIV, HBV, HCV, Syphilis & Malaria TTI testing — DOH NVBSP Section II compliant</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> DOH NVBSP Compliant
            </span>
            <button onClick={() => { fetchLabResultsFromAPI(); fetchDonationsFromAPI(); }} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Tested</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalTested}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Confirmed by RMT</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">TTI Cleared Rate</p>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">{clearedRate}%</p>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Non-Reactive</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Reactive / Quarantined</p>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">{reactiveCount}</p>
              <p className="text-[10px] text-rose-600 mt-1 font-semibold">Flagged for confirmation</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pending Lab Results</p>
              <p className={`text-2xl font-extrabold font-mono ${pendingDonations.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{pendingDonations.length}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Awaiting serology tests</p>
            </div>
          </div>

          {/* Pending donations alert */}
          {pendingDonations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-800">Pending Lab Results ({pendingDonations.length})</p>
                <p className="text-[10px] text-amber-700 mt-0.5">The following serial numbers are awaiting serology results:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingDonations.slice(0, 10).map((d, i) => {
                    const sn = d.serialNumber || d.serial_number;
                    return (
                      <button key={i} onClick={() => openModal(d)}
                        className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold font-mono cursor-pointer transition-colors ${
                          sn
                            ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-500'
                        }`}>
                        {sn || 'No S/N'}
                      </button>
                    );
                  })}
                  {pendingDonations.length > 10 && <span className="px-2.5 py-1 text-[10px] text-amber-600 font-semibold">+{pendingDonations.length - 10} more</span>}
                </div>
              </div>
              <button onClick={() => openModal()} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex-shrink-0">
                Encode Result
              </button>
            </div>
          )}

          {/* Action bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search serial number, test ID, blood type..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50" />
              </div>
              <select value={filterResult} onChange={e => { setFilterResult(e.target.value); setCurrentPage(1); }}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-white text-slate-700">
                <option value="All">All Results</option>
                <option value="Cleared">Cleared (Non-Reactive)</option>
                <option value="Reactive">Reactive (Quarantined)</option>
              </select>
            </div>
            <button onClick={() => openModal()}
              className="w-full md:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Encode Lab Result
            </button>
          </div>

          {/* Results table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lab-Confirmed Serology & TTI Testing Ledger</h3>
                <p className="text-xs text-slate-500">Transmissible Infectious Disease Screening Records (Table 8)</p>
              </div>
              <span className="text-xs font-bold text-slate-400">Total: {filteredResults.length}</span>
            </div>
            <div className="overflow-x-auto">
              {filteredResults.length === 0 ? (
                <div className="py-16 text-center">
                  <FlaskConical className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No lab results recorded yet</p>
                  <p className="text-xs text-slate-300 mt-1">Click "Encode Lab Result" to add the first entry.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Test ID</th>
                      <th className="py-3 px-4">Serial No.</th>
                      <th className="py-3 px-4">Hgb</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">HBsAg</th>
                      <th className="py-3 px-4">Syphilis</th>
                      <th className="py-3 px-4">HIV 1/2</th>
                      <th className="py-3 px-4">HCV</th>
                      <th className="py-3 px-4">Malaria</th>
                      <th className="py-3 px-4">NAT</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {pagedResults.map((row, idx) => {
                      const isReactive = row.hbsagResult === 'Reactive' || row.syphilisResult === 'Reactive' ||
                        row.hivResult === 'Reactive' || row.hcvResult === 'Reactive' || row.malariaResult === 'Reactive';
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${isReactive ? 'bg-rose-50/30' : ''}`}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px]">{row.testId}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-purple-700 text-[11px]">
                            <div className="flex items-center gap-1"><Hash className="w-3 h-3 text-purple-400" />{row.serialNumber || '—'}</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700">{row.hemoglobinResult || '—'}</td>
                          <td className="py-3 px-4 font-black text-rose-600">{row.bloodTypeConfirmed || '—'}</td>
                          <td className="py-3 px-4"><ResultBadge value={row.hbsagResult} /></td>
                          <td className="py-3 px-4"><ResultBadge value={row.syphilisResult} /></td>
                          <td className="py-3 px-4"><ResultBadge value={row.hivResult} /></td>
                          <td className="py-3 px-4"><ResultBadge value={row.hcvResult} /></td>
                          <td className="py-3 px-4"><ResultBadge value={row.malariaResult} /></td>
                          <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700">{row.natResult || '—'}</td>
                          <td className="py-3 px-4">
                            {isReactive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200">Deferred</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">Accepted</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => setViewRow(row)} className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer" title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {filteredResults.length > ITEMS_PER_PAGE && (
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Showing {Math.min(filteredResults.length, pageStart + 1)} to {Math.min(filteredResults.length, pageStart + ITEMS_PER_PAGE)} of {filteredResults.length} entries</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-slate-700 font-bold">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── ENCODE MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Encode Lab-Confirmed TTI Results</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Serology Staff — Table 8 TTI Screening</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Serial number — the ONLY identifier for Serology */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  DHQ Serial Number <span className="text-rose-400">*</span>
                  <span className="text-slate-400 font-normal normal-case ml-1">(from physical DHQ form)</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="e.g. 2026-0042"
                      className="w-full pl-8 pr-3 border border-slate-200 rounded-lg py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      value={form.serialNumber}
                      onChange={e => { setForm(prev => ({ ...prev, serialNumber: e.target.value })); setLookupStatus('idle'); }}
                      onBlur={e => handleSerialLookup(e.target.value)} />
                  </div>
                  <button type="button" onClick={() => handleSerialLookup(form.serialNumber)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-200">
                    Lookup
                  </button>
                </div>
                {/* Lookup feedback */}
                {lookupStatus === 'loading' && <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> Looking up...</p>}
                {lookupStatus === 'found' && (
                  <div className="mt-1.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] font-bold text-emerald-700">Donation found — ready to encode lab results.</span>
                  </div>
                )}
                {lookupStatus === 'already-done' && (
                  <div className="mt-1.5 flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[11px] font-bold text-rose-700">Lab results already recorded for this serial number.</span>
                  </div>
                )}
                {lookupStatus === 'not-found' && (
                  <div className="mt-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Serial number not found in system.</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">This serial number has no matching donation. Ask Registry to record it first.</p>
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Lab Results */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Lab Results</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Blood Type (Confirmed)</label>
                    <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      value={form.bloodTypeConfirmed} onChange={e => setForm(prev => ({ ...prev, bloodTypeConfirmed: e.target.value }))}>
                      {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hemoglobin (g/dL)</label>
                    <input type="number" step="0.1" min="0" placeholder="e.g. 14.5"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      value={form.hemoglobinResult} onChange={e => setForm(prev => ({ ...prev, hemoglobinResult: e.target.value }))} />
                  </div>
                  <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">TTI Infection Screening</p>
                    <div className="grid grid-cols-2 gap-3">
                      {TTI_TESTS.map(({ label, key }) => (
                        <div key={key}>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">{label}</label>
                          <select className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                            form[key] === 'Reactive' ? 'border-rose-300 bg-rose-50 text-rose-700' :
                            form[key] === 'Indeterminate' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                            'border-slate-200 bg-white text-emerald-700'}`}
                            value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}>
                            <option value="Non-Reactive">Non-Reactive</option>
                            <option value="Reactive">Reactive</option>
                            <option value="Indeterminate">Indeterminate</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Others / Remarks <span className="text-slate-300">(optional)</span></label>
                    <input type="text" placeholder="e.g. Hepatitis B Core Total — Non-Reactive"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      value={form.othersResult} onChange={e => setForm(prev => ({ ...prev, othersResult: e.target.value }))} />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Screening Outcome — determined by Serology after reviewing TTI results */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Screening Outcome</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Outcome <span className="text-rose-400">*</span></label>
                    <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      value={form.screeningOutcome} onChange={e => setForm(prev => ({ ...prev, screeningOutcome: e.target.value }))}>
                      <option value="Accepted">Accepted</option>
                      <option value="Temporarily Deferred">Temporarily Deferred</option>
                      <option value="Permanently Deferred">Permanently Deferred</option>
                      <option value="Indefinite Deferral">Indefinite Deferral</option>
                    </select>
                  </div>
                  {form.screeningOutcome !== 'Accepted' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deferral Reason</label>
                      <input type="text" placeholder="e.g. Reactive HBsAg"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                        value={form.deferralReason} onChange={e => setForm(prev => ({ ...prev, deferralReason: e.target.value }))} />
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                  Based on TTI results — Accepted if all Non-Reactive, Deferred if any Reactive result is confirmed.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex items-center justify-between gap-3">
              {saved ? (
                <div className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-4 h-4" /><span className="text-xs font-bold">Saved successfully!</span></div>
              ) : saveError ? (
                <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {saveError}</p>
              ) : (
                <p className="text-[10px] text-slate-400">TTI tests default to Non-Reactive. Change if applicable.</p>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="button"
                  disabled={!form.serialNumber || lookupStatus === 'already-done' || lookupStatus === 'not-found' || saving}
                  onClick={handleSave}
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5">
                  {saving ? <><Activity className="w-3 h-3 animate-spin" /> Saving...</> : 'Save & Sign Off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DETAIL MODAL ── */}
      {viewRow && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-purple-50/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Lab Result Details</p>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{viewRow.testId}</h3>
              </div>
              <button onClick={() => setViewRow(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Serial No.</p><p className="font-mono font-bold text-purple-700 mt-0.5">{viewRow.serialNumber || '—'}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Hemoglobin</p><p className="font-bold mt-0.5">{viewRow.hemoglobinResult || '—'} g/dL</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Blood Group</p><p className="font-black text-rose-600 mt-0.5">{viewRow.bloodTypeConfirmed || '—'}</p></div>
              </div>
              <hr className="border-slate-100" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TTI Results</p>
              <div className="grid grid-cols-2 gap-2">
                {TTI_TESTS.map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-semibold">{label}</span>
                    <ResultBadge value={viewRow[key]} />
                  </div>
                ))}
              </div>
              {viewRow.othersResult && <div><p className="text-[10px] text-slate-400 font-bold uppercase">Others</p><p className="text-xs text-slate-600 mt-0.5">{viewRow.othersResult}</p></div>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <button onClick={() => setViewRow(null)} className="w-full py-2 bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
