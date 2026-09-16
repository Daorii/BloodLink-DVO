import React, { useState, useEffect, useMemo } from 'react';
import { useBloodStore } from '../store/useBloodStore';
import {
  FlaskConical, Package, Hash, CheckCircle, AlertTriangle, Plus, X,
  Search, RefreshCw, LogOut, Clock, Activity, Eye, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, Droplets, Thermometer,
  ClipboardCheck, Archive, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';

// ── Constants ──────────────────────────────────────────────────────────────
const COMPONENTS = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const ITEMS_PER_PAGE = 10;

// Shelf life (days), acceptable volume ranges, and storage per DOH NVBSP / SNBC reference chart
// Expiry countdown starts the day AFTER collection (tomorrow = Day 1)
const COMPONENT_INFO = {
  'PRBC':                 { shelfDays: 35,  volMin: 230, volMax: 330, defaultVol: 280, storage: '+2°C to +6°C',                        color: 'rose'   },
  'Platelet Concentrate': { shelfDays: 5,   volMin: 50,  volMax: 70,  defaultVol: 60,  storage: '+20°C to +24°C, continuous agitation', color: 'amber'  },
  'FFP':                  { shelfDays: 90,  volMin: 150, volMax: 250, defaultVol: 200, storage: '−20°C to −24°C',                      color: 'blue'   },
  'Cryoprecipitate':      { shelfDays: 180, volMin: 15,  volMax: 30,  defaultVol: 20,  storage: '−25°C to −29°C',                      color: 'purple' },
  'Cryosupernate':        { shelfDays: 365, volMin: 190, volMax: 210, defaultVol: 200, storage: '−30°C to −39°C',                      color: 'indigo' },
};

function calcExpiry(collectionDate, component) {
  const days = COMPONENT_INFO[component]?.shelfDays ?? 35;
  const d = new Date(collectionDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysUntilExpiry(expirationDate) {
  if (!expirationDate) return null;
  return Math.ceil((new Date(expirationDate) - new Date()) / 86400000);
}

function ComponentBadge({ component }) {
  const info = COMPONENT_INFO[component] ?? {};
  const colorMap = {
    red:    'bg-red-50 text-red-800 border-red-200',
    rose:   'bg-rose-50 text-rose-700 border-rose-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  const cls = colorMap[info.color] ?? 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${cls}`}>
      {component}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    'Available':  'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Reserved':   'bg-blue-50 text-blue-700 border-blue-200',
    'Issued':     'bg-slate-50 text-slate-500 border-slate-200',
    'Expired':    'bg-rose-50 text-rose-700 border-rose-200',
    'Discarded':  'bg-stone-50 text-stone-500 border-stone-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${map[status] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      {status}
    </span>
  );
}

// Default component row for the processing form
function defaultComponentRow(component, collectionDate) {
  const info = COMPONENT_INFO[component] ?? {};
  return {
    component,
    volumeCC: '',
    collectionDate: collectionDate || new Date().toISOString().slice(0, 10),
    expirationDate: calcExpiry(collectionDate || new Date().toISOString().slice(0, 10), component),
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    remarks: '',
    statusDate: new Date().toISOString().slice(0, 10),
  };
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function ProductionDashboard() {
  const {
    bloodInventory, donations, labTestResults,
    recordBloodUnit, fetchBloodInventoryFromAPI,
    fetchDonationsFromAPI, fetchLabResultsFromAPI,
    fetchDonationBySerial,
    authSystemUser, isSidebarCollapsed, toggleSidebar,
  } = useBloodStore();

  const [searchQuery, setSearchQuery]     = useState('');
  const [filterComp, setFilterComp]       = useState('All');
  const [filterStatus, setFilterStatus]   = useState('All');
  const [currentPage, setCurrentPage]     = useState(1);
  const [showModal, setShowModal]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [lookupStatus, setLookupStatus]   = useState('idle');
  const [viewUnit, setViewUnit]           = useState(null);

  // Form state
  const [serialNumber, setSerialNumber]   = useState('');
  const [donationId, setDonationId]       = useState('');
  const [bloodTypeConfirmed, setBloodTypeConfirmed] = useState('O+');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedComponents, setSelectedComponents] = useState([]); // no pre-selection — user chooses
  const [componentRows, setComponentRows] = useState([]);

  useEffect(() => {
    fetchBloodInventoryFromAPI();
    fetchDonationsFromAPI();
    fetchLabResultsFromAPI();
  }, []);

  // ── Serial number lookup ────────────────────────────────────────────────
  const handleSerialLookup = async (serial) => {
    if (!serial || serial.trim().length < 2) { setLookupStatus('idle'); return; }
    setLookupStatus('loading');
    try {
      const data = await fetchDonationBySerial(serial.trim());
      if (data?.donation) {
        const don = data.donation;
        // Check if screening was accepted (only process accepted donations)
        const outcome = don.screeningOutcome || don.screening_outcome;
        if (outcome && outcome !== 'Accepted') {
          setLookupStatus('deferred');
          return;
        }
        // Check if it has lab results
        if (!data.hasLabResult) {
          setLookupStatus('no-lab');
          return;
        }
        // Use raw numeric donation_id (not the formatted "DON-001" string) so parseInt() works
        setDonationId(don.donation_id || don.donationId || '');
        // Use confirmed blood type from lab result if available
        const labResult = (labTestResults || []).find(lr =>
          (lr.donationId || lr.donation_id) == (don.donationId || don.donation_id)
        );
        const bt = labResult?.bloodTypeConfirmed || labResult?.blood_type_confirmed || don.bloodType || 'O+';
        setBloodTypeConfirmed(bt);
        const colDate = don.donationDate || collectionDate;
        setCollectionDate(colDate);
        // Update all component rows with the new collection date
        setComponentRows(prev => prev.map(row => ({
          ...row,
          collectionDate: colDate,
          expirationDate: calcExpiry(colDate, row.component),
        })));
        setLookupStatus('found');
      } else {
        setLookupStatus('not-found');
      }
    } catch {
      setLookupStatus('not-found');
    }
  };

  // ── Component selection toggle ──────────────────────────────────────────
  // NOTE: Never call setState inside another setState updater — it causes
  // double-invocation in React StrictMode, creating duplicate rows.
  const toggleComponent = (comp) => {
    const isSelected = selectedComponents.includes(comp);
    if (isSelected) {
      // Deselect: remove from both lists
      setSelectedComponents(prev => prev.filter(c => c !== comp));
      setComponentRows(prev => prev.filter(r => r.component !== comp));
    } else {
      // Select: add to both lists — guard against duplicates
      setSelectedComponents(prev => prev.includes(comp) ? prev : [...prev, comp]);
      setComponentRows(prev =>
        prev.some(r => r.component === comp)
          ? prev
          : [...prev, defaultComponentRow(comp, collectionDate)]
      );
    }
  };

  // ── Update a component row field ────────────────────────────────────────
  const updateRow = (comp, field, value) => {
    setComponentRows(prev => prev.map(row => {
      if (row.component !== comp) return row;
      const updated = { ...row, [field]: value };
      // Auto-recalculate expiry when collection date changes
      if (field === 'collectionDate') {
        updated.expirationDate = calcExpiry(value, comp);
      }
      // Volume validation: if outside acceptable range, auto-set to NCU and block Cleared
      // Only applies when user has actually entered a value
      if (field === 'volumeCC') {
        const info = COMPONENT_INFO[comp] ?? {};
        const vol = parseFloat(value);
        const hasValue = value !== '' && !isNaN(vol);
        if (hasValue && info.volMin !== undefined && (vol < info.volMin || vol > info.volMax)) {
          if (updated.safetyStatus === 'Cleared') updated.safetyStatus = 'NCU';
        }
      }
      return updated;
    }));
  };

  // ── Save all selected components as inventory units ─────────────────────
  const handleSave = async () => {
    // ── Pre-submit validation ─────────────────────────────────────────────
    const errors = [];

    // 1. Serial number
    if (!serialNumber.trim()) {
      errors.push('Serial number is required.');
    } else if (lookupStatus === 'idle') {
      errors.push('Please press the lookup button to verify the serial number first.');
    } else if (lookupStatus === 'not-found') {
      errors.push('Serial number not found in records.');
    } else if (lookupStatus === 'deferred') {
      errors.push('This donation was deferred and cannot be processed.');
    } else if (lookupStatus === 'no-lab') {
      errors.push('No Serology lab result found for this serial number.');
    }

    // 2. Blood type confirmed
    if (!bloodTypeConfirmed) {
      errors.push('Confirmed blood type is required.');
    }

    // 3. At least one component selected
    if (componentRows.length === 0) {
      errors.push('Select at least one component to extract before saving.');
    }

    // 4. Per-component field validation
    componentRows.forEach(row => {
      const label = row.component;

      // Volume required and must be a positive number
      if (row.volumeCC === '' || row.volumeCC === null || row.volumeCC === undefined) {
        errors.push(`${label}: Volume (cc) is required.`);
      } else if (parseFloat(row.volumeCC) <= 0 || isNaN(parseFloat(row.volumeCC))) {
        errors.push(`${label}: Volume must be a positive number.`);
      }

      // Collection date required
      if (!row.collectionDate) {
        errors.push(`${label}: Collection / Processing Date is required.`);
      }

      // Expiry date required
      if (!row.expirationDate) {
        errors.push(`${label}: Expiry Date is required.`);
      }

      // Hold-Quarantined / NCU require a remarks reason
      if ((row.safetyStatus === 'Hold-Quarantined' || row.safetyStatus === 'NCU') && !row.remarks.trim()) {
        errors.push(`${label}: A reason / remarks is required when status is "${row.safetyStatus}".`);
      }

      // Hold-Quarantined / NCU require a status date
      if ((row.safetyStatus === 'Hold-Quarantined' || row.safetyStatus === 'NCU') && !row.statusDate) {
        errors.push(`${label}: Status date is required when status is "${row.safetyStatus}".`);
      }
    });

    if (errors.length > 0) {
      setSaveError(errors.join('\n'));
      return;
    }

    // ── All valid — submit ────────────────────────────────────────────────
    setSaving(true); setSaveError('');
    let allOk = true;
    for (const row of componentRows) {
      try {
        await recordBloodUnit({
          donationId:     donationId || null,
          serialNumber,
          bloodType:      bloodTypeConfirmed,
          component:      row.component,
          volumeCC:       row.volumeCC,
          collectionDate: row.collectionDate,
          expirationDate: row.expirationDate,
          safetyStatus:   row.safetyStatus,
          intendedUse:    row.intendedUse,
          remarks:        row.remarks   || null,
          statusDate:     row.statusDate || null,
        });
      } catch (err) {
        setSaveError(`Failed to save ${row.component}: ${err.message}`);
        allOk = false;
        break;
      }
    }
    setSaving(false);
    if (allOk) {
      setSaved(true);
      setTimeout(() => { setShowModal(false); resetModal(); }, 1800);
    }
  };

  const resetModal = () => {
    setSerialNumber(''); setDonationId(''); setBloodTypeConfirmed('O+');
    setCollectionDate(new Date().toISOString().slice(0, 10));
    setSelectedComponents([]);
    setComponentRows([]);
    setLookupStatus('idle'); setSaved(false); setSaveError('');
  };

  // ── Duplicate Cleared detection ─────────────────────────────────────────
  // A serial+component combo can only have ONE "Cleared" unit.
  // Additional recordings for the same combo must use Hold/NCU/Discarded.
  const clearedByComponent = React.useMemo(() => {
    if (!serialNumber) return {};
    const result = {};
    (bloodInventory || []).forEach(u => {
      const sn = u.serialNumber || '';
      if (sn === serialNumber.trim() && u.safetyStatus === 'Cleared') {
        result[u.component] = true;
      }
    });
    return result;
  }, [bloodInventory, serialNumber]);

  const openModal = (prefill = null) => {
    resetModal();
    if (prefill?.serialNumber) {
      setSerialNumber(prefill.serialNumber);
      setTimeout(() => handleSerialLookup(prefill.serialNumber), 200);
    }
    setShowModal(true);
  };

  // ── Derived stats ───────────────────────────────────────────────────────
  const allUnits    = bloodInventory || [];
  const available   = allUnits.filter(u => u.inventoryStatus === 'Available').length;
  const today       = new Date().toISOString().slice(0, 10);
  const todayUnits  = allUnits.filter(u => (u.createdAt || '').slice(0, 10) === today).length;
  const expiringSoon = allUnits.filter(u => {
    const d = daysUntilExpiry(u.expirationDate);
    return d !== null && d >= 0 && d <= 7 && u.inventoryStatus === 'Available';
  }).length;

  // Pending: donations with accepted outcome + lab result but no inventory unit yet
  // Compare using raw donation_id (integer) since the API format() returns u.donationId as the raw int
  const processedDonationIds = new Set(
    allUnits.map(u => String(u.donationId ?? u.donation_id ?? '')).filter(Boolean)
  );
  const pendingToProcess = (donations || []).filter(don => {
    const outcome = don.screeningOutcome || don.screening_outcome;
    const hasLab  = don.hasLabResult;
    // Use raw donation_id (not the formatted "DON-001" string) for comparison
    const donId   = String(don.donation_id ?? '');
    return outcome === 'Accepted' && hasLab && donId && !processedDonationIds.has(donId);
  });

  // Filtered + paginated inventory
  const filtered = useMemo(() => allUnits.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (u.serialNumber  || '').toLowerCase().includes(q) ||
      (u.unitId        || '').toLowerCase().includes(q) ||
      (u.unitCode      || '').toLowerCase().includes(q) ||
      (u.bloodType     || '').toLowerCase().includes(q) ||
      (u.component     || '').toLowerCase().includes(q);
    const matchComp   = filterComp   === 'All' || u.component      === filterComp;
    const matchStatus = filterStatus === 'All' || u.inventoryStatus === filterStatus;
    return matchSearch && matchComp && matchStatus;
  }), [allUnits, searchQuery, filterComp, filterStatus]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageStart   = (currentPage - 1) * ITEMS_PER_PAGE;
  const paged       = filtered.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const currentUser = authSystemUser || { name: 'Production Staff', role: 'Production Staff' };
  const initials = (currentUser.name || 'PS').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

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
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Production Portal</p>
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
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200">{initials}</div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700 uppercase mt-0.5 border border-emerald-200/60">{currentUser.role}</span>
                </div>
              </div>
            </div>
          )}
          <nav className="p-3 space-y-1">
            <div className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
              <Package className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Component Processing</span>}
            </div>
            {pendingToProcess.length > 0 && !isSidebarCollapsed && (
              <div className="mx-2 mt-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
                <Clock className="w-3 h-3" />
                {pendingToProcess.length} unit{pendingToProcess.length > 1 ? 's' : ''} awaiting processing
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
            <h2 className="text-slate-900 font-bold text-base leading-tight tracking-tight">Blood Component Processing & Inventory Entry</h2>
            <p className="text-xs text-slate-500 mt-0.5">Separate, label, and record blood components from Serology-cleared donations</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" /> DOH NVBSP Compliant
            </span>
            <button onClick={() => { fetchBloodInventoryFromAPI(); fetchDonationsFromAPI(); fetchLabResultsFromAPI(); }}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-8 space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Processed Today</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">{todayUnits}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">component units recorded</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Available in Stock</p>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">{available}</p>
              <p className="text-[10px] text-emerald-600 mt-1 font-semibold">units ready for issuance</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Expiring ≤7 Days</p>
              <p className={`text-2xl font-extrabold font-mono ${expiringSoon > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{expiringSoon}</p>
              <p className="text-[10px] text-amber-600 mt-1 font-semibold">{expiringSoon > 0 ? 'Priority for issuance' : 'No urgent expiries'}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pending Processing</p>
              <p className={`text-2xl font-extrabold font-mono ${pendingToProcess.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{pendingToProcess.length}</p>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">cleared donations queued</p>
            </div>
          </div>

          {/* Pending Processing Queue */}
          {pendingToProcess.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-800">Serology-Cleared Donations Awaiting Component Processing ({pendingToProcess.length})</p>
                <p className="text-[10px] text-amber-700 mt-0.5">These serial numbers have been cleared by Serology and are ready for component separation:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingToProcess.slice(0, 12).map((don, i) => {
                    const sn = don.serialNumber || don.serial_number;
                    return sn ? (
                      <button key={i} onClick={() => openModal({ serialNumber: sn })}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg text-[10px] font-bold text-amber-800 font-mono cursor-pointer transition-colors">
                        {sn}
                      </button>
                    ) : null;
                  })}
                  {pendingToProcess.length > 12 && (
                    <span className="px-2.5 py-1 text-[10px] text-amber-600 font-semibold">+{pendingToProcess.length - 12} more</span>
                  )}
                </div>
              </div>
              <button onClick={() => openModal()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex-shrink-0">
                Process Unit
              </button>
            </div>
          )}

          {/* Action bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search serial, unit ID, blood type..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50/50" />
              </div>
              <select value={filterComp} onChange={e => { setFilterComp(e.target.value); setCurrentPage(1); }}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-white text-slate-700">
                <option value="All">All Components</option>
                {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none bg-white text-slate-700">
                <option value="All">All Status</option>
                {['Available','Reserved','Issued','Expired','Discarded'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={() => openModal()}
              className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Process Blood Unit
            </button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Blood Component Inventory Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">All recorded blood components — linked to donations by serial number</p>
              </div>
              <span className="text-xs font-bold text-slate-400">Total: {filtered.length}</span>
            </div>
            <div className="overflow-x-auto">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Archive className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No inventory units recorded yet</p>
                  <p className="text-xs text-slate-300 mt-1">Click "Process Blood Unit" to add the first entry.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Unit ID</th>
                      <th className="py-3 px-4">Serial No.</th>
                      <th className="py-3 px-4">Blood Type</th>
                      <th className="py-3 px-4">Component</th>
                      <th className="py-3 px-4">Volume (cc)</th>
                      <th className="py-3 px-4">Collection</th>
                      <th className="py-3 px-4">Expiry</th>
                      <th className="py-3 px-4">Safety</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paged.map((unit, idx) => {
                      const days = daysUntilExpiry(unit.expirationDate);
                      const isExpiringSoon = days !== null && days >= 0 && days <= 7;
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${isExpiringSoon && unit.inventoryStatus === 'Available' ? 'bg-amber-50/40' : ''}`}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px]">{unit.unitId}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-emerald-700 text-[11px]">
                            <div className="flex items-center gap-1"><Hash className="w-3 h-3 text-emerald-400" />{unit.serialNumber || '—'}</div>
                          </td>
                          <td className="py-3 px-4 font-black text-rose-600">{unit.bloodType}</td>
                          <td className="py-3 px-4"><ComponentBadge component={unit.component} /></td>
                          <td className="py-3 px-4 font-bold text-slate-700">{unit.volumeCC ?? unit.quantity} cc</td>
                          <td className="py-3 px-4 text-slate-500">{unit.collectionDate}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${days !== null && days <= 7 && unit.inventoryStatus === 'Available' ? 'text-amber-600' : 'text-slate-600'}`}>
                              {unit.expirationDate}
                              {isExpiringSoon && unit.inventoryStatus === 'Available' && (
                                <span className="ml-1 text-[9px] text-amber-600 font-bold">({days}d)</span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              unit.safetyStatus === 'Cleared' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>{unit.safetyStatus}</span>
                          </td>
                          <td className="py-3 px-4"><StatusBadge status={unit.inventoryStatus} /></td>
                          <td className="py-3 px-4">
                            <button onClick={() => setViewUnit(unit)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer" title="View">
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
            {filtered.length > ITEMS_PER_PAGE && (
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Showing {Math.min(filtered.length, pageStart + 1)} to {Math.min(filtered.length, pageStart + ITEMS_PER_PAGE)} of {filtered.length} entries</span>
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

          {/* Component Reference Card — based on SNBC/DOH NVBSP reference chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-emerald-600" /> Blood & Blood Products — Volume, Storage & Shelf Life Reference (DOH NVBSP)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="text-left py-2 px-3 border border-slate-200">Blood / Blood Product</th>
                    <th className="text-left py-2 px-3 border border-slate-200">Acceptable Volume</th>
                    <th className="text-left py-2 px-3 border border-slate-200">Storage Temperature</th>
                    <th className="text-left py-2 px-3 border border-slate-200">Shelf Life</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'PRBC',                 vol: '230–330 cc', temp: '+2°C and +6°C',                         life: '35 days (CPDA-1)',          color: 'rose'   },
                    { name: 'Platelet Concentrate', vol: '50–70 cc',   temp: '+20°C and +24°C, continuous agitation', life: '5 days',                    color: 'amber'  },
                    { name: 'FFP',                  vol: '150–250 cc', temp: '−20°C to −24°C',                        life: '3 months',                  color: 'blue'   },
                    { name: 'Cryoprecipitate',      vol: '15–30 cc',   temp: '−25°C to −29°C',                        life: '6 months',                  color: 'purple' },
                    { name: 'Cryosupernate',        vol: '190–210 cc', temp: '−30°C to −39°C',                        life: '1 year',                    color: 'indigo' },
                  ].map((row, i) => {
                    const rowColor = {
                      red:    'bg-red-50/40',
                      rose:   'bg-rose-50/40',
                      amber:  'bg-amber-50/40',
                      blue:   'bg-blue-50/40',
                      purple: 'bg-purple-50/40',
                      indigo: 'bg-indigo-50/40',
                    }[row.color];
                    const textColor = {
                      red: 'text-red-800', rose: 'text-rose-700', amber: 'text-amber-700',
                      blue: 'text-blue-700', purple: 'text-purple-700', indigo: 'text-indigo-700',
                    }[row.color];
                    return (
                      <tr key={i} className={`${rowColor} border-b border-slate-100`}>
                        <td className={`py-2 px-3 border border-slate-200 font-extrabold ${textColor}`}>{row.name}</td>
                        <td className={`py-2 px-3 border border-slate-200 font-bold ${textColor}`}>{row.vol}</td>
                        <td className="py-2 px-3 border border-slate-200 text-slate-600 font-semibold">{row.temp}</td>
                        <td className="py-2 px-3 border border-slate-200 text-slate-700 font-bold">{row.life}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-semibold">* Expiry countdown starts the day after collection (tomorrow = Day 1). Source: SNBC / DOH NVBSP Reference Chart.</p>
          </div>
        </div>
      </main>

      {/* ── PROCESS BLOOD UNIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Process Blood Unit — Component Separation</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Production Staff — DOH NVBSP Blood Component Processing</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); resetModal(); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Serial Number Lookup */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  DHQ Serial Number <span className="text-rose-400">*</span>
                  <span className="text-slate-400 font-normal normal-case ml-1">(must be Serology-cleared)</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="e.g. 2026-0042"
                      className="w-full pl-8 pr-3 border border-slate-200 rounded-lg py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={serialNumber}
                      onChange={e => { setSerialNumber(e.target.value); setLookupStatus('idle'); }}
                      onBlur={e => handleSerialLookup(e.target.value)} />
                  </div>
                  <button type="button" onClick={() => handleSerialLookup(serialNumber)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-200">
                    Lookup
                  </button>
                </div>
                {/* Lookup feedback */}
                {lookupStatus === 'loading' && <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Activity className="w-3 h-3 animate-pulse" /> Looking up...</p>}
                {lookupStatus === 'found' && (
                  <div className="mt-1.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700">Cleared donation found.</span>
                      <span className="text-[10px] text-emerald-600 ml-2">Blood type: <strong>{bloodTypeConfirmed}</strong> · Collection: <strong>{collectionDate}</strong></span>
                    </div>
                  </div>
                )}
                {lookupStatus === 'no-lab' && (
                  <div className="mt-1.5 flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[11px] font-bold text-amber-700">Lab results not yet recorded by Serology. Cannot process this unit.</span>
                  </div>
                )}
                {lookupStatus === 'deferred' && (
                  <div className="mt-1.5 flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[11px] font-bold text-rose-700">This donor was deferred — unit cannot be processed for transfusion.</span>
                  </div>
                )}
                {lookupStatus === 'not-found' && (
                  <div className="mt-1.5 flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[11px] font-bold text-rose-700">Serial number not found. Have Registry record the donation first.</span>
                  </div>
                )}
              </div>

              {/* Blood type + Collection date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Confirmed Blood Type
                    {lookupStatus === 'found' && (
                      <span className="ml-2 text-[9px] font-bold text-emerald-600 normal-case">✓ Auto-filled by Serology — verify &amp; correct if needed</span>
                    )}
                  </label>
                  <select className={`w-full border rounded-lg px-3 py-2 text-xs font-black text-rose-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                    lookupStatus === 'found' ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'
                  }`}
                    value={bloodTypeConfirmed} onChange={e => setBloodTypeConfirmed(e.target.value)}>
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collection / Processing Date</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    value={collectionDate}
                    onChange={e => {
                      setCollectionDate(e.target.value);
                      setComponentRows(prev => prev.map(row => ({
                        ...row, collectionDate: e.target.value, expirationDate: calcExpiry(e.target.value, row.component)
                      })));
                    }} />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Component Selection */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Components to Extract from This Unit</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {COMPONENTS.map(comp => {
                    const selected = selectedComponents.includes(comp);
                    const info = COMPONENT_INFO[comp];
                    return (
                      <button key={comp} type="button" onClick={() => toggleComponent(comp)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                        }`}>
                        {comp}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-slate-400">Select all components that will be separated from this whole blood unit. Typical: PRBC + FFP from one unit.</p>
              </div>

              {/* Per-Component Form Rows */}
              <div className="space-y-4">
                {componentRows.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                    <FlaskConical className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">No components selected</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click a component button above to add it to this processing batch.</p>
                  </div>
                )}
                {componentRows.map(row => {
                  const info = COMPONENT_INFO[row.component] ?? {};
                  return (
                    <div key={row.component} className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <ComponentBadge component={row.component} />
                        <span className="text-[9px] text-slate-400 font-semibold">{info.storage} · {info.shelfDays} day shelf life</span>
                      </div>
                      {/* Volume range warning — only shows when a value is entered AND out of range */}
                      {(() => {
                        const vol = parseFloat(row.volumeCC);
                        const hasValue = row.volumeCC !== '' && !isNaN(vol);
                        const outOfRange = hasValue && info.volMin !== undefined && (vol < info.volMin || vol > info.volMax);
                        return outOfRange ? (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-amber-700">
                              Volume {vol} cc is outside acceptable range ({info.volMin}–{info.volMax} cc). Status auto-set to Non-Conforming — "Cleared" is not allowed.
                            </span>
                          </div>
                        ) : null;
                      })()}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Volume (cc)
                            {info.volMin !== undefined && (
                              <span className="ml-1 text-emerald-600 font-semibold normal-case">({info.volMin}–{info.volMax} cc acceptable)</span>
                            )}
                          </label>
                          <input type="number" min="0" step="1"
                            placeholder={`Enter volume (${info.volMin ?? 0}–${info.volMax ?? 999} cc)`}
                            className={`w-full border rounded-lg px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 ${(() => {
                              const v = parseFloat(row.volumeCC);
                              const hasV = row.volumeCC !== '' && !isNaN(v);
                              return hasV && info.volMin !== undefined && (v < info.volMin || v > info.volMax)
                                ? 'border-amber-400 bg-amber-50/40'
                                : 'border-slate-200';
                            })()}`}
                            value={row.volumeCC}
                            onChange={e => updateRow(row.component, 'volumeCC', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expiry Date</label>
                          <input type="date"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            value={row.expirationDate}
                            onChange={e => updateRow(row.component, 'expirationDate', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">QC / Safety Status</label>
                          {clearedByComponent[row.component] && (
                            <p className="text-[9px] text-amber-600 font-bold mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Cleared already recorded for this serial+component. Only Hold/NCU/Discarded allowed.
                            </p>
                          )}
                          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            value={row.safetyStatus}
                            onChange={e => updateRow(row.component, 'safetyStatus', e.target.value)}>
                            {/* Cleared: only blocked when volume is entered+out-of-range, OR a Cleared entry already exists for this serial+component */}
                            {(() => {
                              const v = parseFloat(row.volumeCC);
                              const hasVol = row.volumeCC !== '' && !isNaN(v);
                              // If no volume entered yet → don't block Cleared based on volume
                              const volOk = !hasVol || info.volMin === undefined || (v >= info.volMin && v <= info.volMax);
                              const notDup = !clearedByComponent[row.component];
                              return volOk && notDup;
                            })() && (
                              <option value="Cleared">Cleared ✓</option>
                            )}
                            <option value="Hold-Quarantined">Hold — Quarantined</option>
                            <option value="NCU">Non-Conforming Unit</option>
                            <option value="Discarded">Discarded</option>
                          </select>
                        </div>
                      </div>
                      {/* Reason + Date for Hold/NCU status (not for Discarded or Cleared) */}
                      {(row.safetyStatus === 'Hold-Quarantined' || row.safetyStatus === 'NCU') && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 mt-1">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Reason / Remarks <span className="text-rose-400">*</span>
                            </label>
                            <input type="text"
                              placeholder={row.safetyStatus === 'Hold-Quarantined' ? 'e.g. Reactive HBsAg — pending retest' : 'e.g. Volume below minimum threshold'}
                              className="w-full border border-amber-300 bg-amber-50/30 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                              value={row.remarks}
                              onChange={e => updateRow(row.component, 'remarks', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Date</label>
                            <input type="date"
                              className="w-full border border-amber-300 bg-amber-50/30 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                              value={row.statusDate}
                              onChange={e => updateRow(row.component, 'statusDate', e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex items-center justify-between gap-3">
              {saved ? (
                <div className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-4 h-4" /><span className="text-xs font-bold">{componentRows.length} component{componentRows.length > 1 ? 's' : ''} added to inventory!</span></div>
              ) : saveError ? (
                <div className="flex-1 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 max-h-24 overflow-y-auto">
                  {saveError.split('\n').map((msg, i) => (
                    <p key={i} className="text-[10px] text-rose-700 font-semibold flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {msg}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">Recording <strong>{componentRows.length}</strong> component{componentRows.length > 1 ? 's' : ''} — expiry auto-calculated per DOH standards.</p>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={() => { setShowModal(false); resetModal(); }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="button"
                  disabled={!serialNumber || lookupStatus === 'not-found' || lookupStatus === 'deferred' || lookupStatus === 'no-lab' || saving || saved}
                  onClick={handleSave}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5">
                  {saving ? <><Activity className="w-3 h-3 animate-spin" /> Saving...</> : `Record ${componentRows.length} Component${componentRows.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DETAIL MODAL ── */}
      {viewUnit && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Unit Details</p>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{viewUnit.unitId}</h3>
              </div>
              <button onClick={() => setViewUnit(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Serial No.</p><p className="font-mono font-bold text-emerald-700 mt-0.5">{viewUnit.serialNumber || '—'}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Blood Type</p><p className="font-black text-rose-600 mt-0.5">{viewUnit.bloodType}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Component</p><div className="mt-0.5"><ComponentBadge component={viewUnit.component} /></div></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Volume</p><p className="font-bold mt-0.5">{viewUnit.volumeCC ?? viewUnit.quantity} cc</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Collection</p><p className="font-mono mt-0.5">{viewUnit.collectionDate}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Expiry</p>
                  <p className={`font-mono mt-0.5 ${(() => { const d = daysUntilExpiry(viewUnit.expirationDate); return d !== null && d <= 7 ? 'text-amber-600 font-bold' : ''; })()}`}>
                    {viewUnit.expirationDate}
                  </p>
                </div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Safety</p><p className="mt-0.5">{viewUnit.safetyStatus}</p></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Status</p><div className="mt-0.5"><StatusBadge status={viewUnit.inventoryStatus} /></div></div>
              </div>
              {viewUnit.unitCode && <div><p className="text-[10px] text-slate-400 font-bold uppercase">Bag Code</p><p className="font-mono font-bold mt-0.5">{viewUnit.unitCode}</p></div>}
              {viewUnit.intendedUse && <div><p className="text-[10px] text-slate-400 font-bold uppercase">Intended Use</p><p className="mt-0.5">{viewUnit.intendedUse}</p></div>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <button onClick={() => setViewUnit(null)} className="w-full py-2 bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
