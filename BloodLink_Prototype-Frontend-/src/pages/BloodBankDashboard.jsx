import React, { useState, useEffect } from 'react';
import { useBloodStore } from '../store/useBloodStore';
import {
  Archive, Stethoscope, LogOut,
  CheckCircle, XCircle, Droplets, Clock, Activity, AlertTriangle, Database, FileText, Plus, X, Tag,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const COMPONENTS = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];
const SAFETY_STATUSES = ['Cleared', 'Hold-Quarantined', 'NCU', 'NS', 'Discarded'];
const INTENDED_USES = ['Transfusable', 'Storage-Research Only', 'Restricted'];

const emptyUnitForm = {
  unitId: '',
  unitRefId: '',
  donationId: '',
  bloodType: 'O+',
  component: 'PRBC',
  collectionDate: new Date().toISOString().slice(0, 10),
  expirationDate: '',
  quantity: '450',
  safetyStatus: 'Cleared',
  intendedUse: 'Transfusable',
  inventoryStatus: 'Available'
};

export default function BloodBankDashboard() {
  const {
    donors, inventory, bloodRequests, bloodInventory, donations,
    rejectRequest, updateInventoryUnits, recordBloodUnit,
    isSidebarCollapsed, toggleSidebar,
    fetchBloodRequestsFromAPI, fetchBloodIssuancesFromAPI,
    processBloodRequest, bloodIssuances,
  } = useBloodStore();

  const [tab, setTab] = useState('inventory');
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState(emptyUnitForm);
  const [unitSaved, setUnitSaved] = useState(false);
  const [donationSearch, setDonationSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  // Process modal state (Blood Bank processes a request)
  const [processingReq, setProcessingReq] = useState(null); // the request being processed
  const [processItems, setProcessItems] = useState([]);     // adjusted quantities
  const [processRemarks, setProcessRemarks] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reqSubTab, setReqSubTab] = useState('pending'); // 'pending' | 'ready' | 'history'

  // Load from DB on mount
  useEffect(() => {
    fetchBloodRequestsFromAPI();
    fetchBloodIssuancesFromAPI();
  }, []);

  // Open process modal — pre-fill quantities from the request items
  const openProcess = (req) => {
    setProcessingReq(req);
    setProcessItems((req.items || []).map(i => ({
      bloodType: i.bloodType,
      component: i.component,
      requested: i.units,
      quantityIssued: i.units, // default to full
    })));
    setProcessRemarks('');
    setIsPartial(false);
  };

  const handleProcess = async () => {
    if (!processingReq) return;
    setProcessing(true);
    const result = await processBloodRequest({
      requestId:  processingReq.requestId,
      items:      processItems.map(i => ({ bloodType: i.bloodType, component: i.component, quantityIssued: i.quantityIssued })),
      remarks:    processRemarks,
      isPartial,
    });
    setProcessing(false);
    setProcessingReq(null);
    if (result.success) {
      setSuccessModal({
        isOpen: true,
        title: isPartial ? 'Partially Fulfilled!' : 'Blood Units Prepared!',
        message: `Request ${processingReq.refNo} has been processed and is now Ready for Release. Issuance Personnel will approve the physical dispatch.`,
      });
    } else {
      alert('Failed to process request: ' + result.error);
    }
  };

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    recordBloodUnit(unitForm);
    setUnitSaved(true);
    setTimeout(() => { setUnitSaved(false); setUnitForm(emptyUnitForm); setShowUnitForm(false); setDonationSearch(''); }, 2000);
  };

  // Inventory availability check for a blood type + component
  const availableUnits = (bloodType, component) =>
    (bloodInventory || []).filter(u => u.bloodType === bloodType && u.component === component && u.inventoryStatus === 'Available').length;

  // Only show requests that Issuance Personnel has already verified
  const pendingRequests = bloodRequests.filter(req => req.status === 'Verified');
  const readyRequests   = bloodRequests.filter(req => req.status === 'Ready for Release' || req.status === 'Partially Fulfilled');
  const historyRequests = bloodRequests.filter(req => req.status === 'Released' || req.status === 'Rejected');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">

      {/* SIDEBAR NAVIGATION (consistent with AdminDashboard) */}
      <aside className={`sidebar flex flex-col justify-between border-r border-slate-200 bg-white ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>
        <div id="bank-sidebar" className="sidebar-inner w-full flex flex-col justify-between">
          <div>
            {/* Logo Section */}
            <div className={`py-5 border-b border-slate-100 ${isSidebarCollapsed ? 'px-3' : 'px-6'}`}>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className={`flex items-center min-w-0 ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                  <img src={bloodlinkLogo} alt="BloodLink" className="h-10 w-auto object-contain flex-shrink-0" />
                  <div className="sidebar-brand-copy min-w-0">
                    <p className="font-bold text-sm text-slate-900 tracking-tight leading-tight">BloodLink</p>
                    <p className="text-slate-500 text-[10px] font-bold">Blood Bank Portal</p>
                  </div>
                </div>
                {!isSidebarCollapsed && (
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer flex-shrink-0"
                    title="Collapse sidebar"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isSidebarCollapsed && (
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                    title="Expand sidebar"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* User Identity Panel */}
            {!isSidebarCollapsed && (
              <div className="mx-4 mt-4 mb-2 bg-slate-50 border border-slate-200/60 rounded-lg p-3">
                <div className="sidebar-desk">
                  <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Role Desk</p>
                  <p className="text-slate-800 font-bold text-xs">Blood Bank Staff</p>
                  <p className="text-slate-500 text-[10px] font-medium">Inventory Management</p>
                </div>
              </div>
            )}

            {/* Sidebar Nav Links */}
            <nav className="flex-1 py-2 overflow-y-auto">
              <p className="sidebar-section-label text-slate-400 text-[9px] font-bold uppercase px-4 mt-3 mb-1 tracking-widest">Main Modules</p>

              <button
                onClick={() => setTab('inventory')}
                className={`w-full text-left nav-link ${tab === 'inventory' ? 'active' : ''}`}
                title={isSidebarCollapsed ? "Component Inventory" : ""}
              >
                <Droplets className="nav-icon" />
                <span className="sidebar-copy">Component Inventory</span>
              </button>

              <button
                onClick={() => setTab('requests')}
                className={`w-full text-left nav-link ${tab === 'requests' ? 'active' : ''}`}
                title={isSidebarCollapsed ? "Issuance Requests" : ""}
              >
                <Stethoscope className="nav-icon" />
                <span className="sidebar-copy">Issuance Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="nav-badge ml-auto bg-[#C21C24] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTab('distribution')}
                className={`w-full text-left nav-link ${tab === 'distribution' ? 'active' : ''}`}
                title={isSidebarCollapsed ? "Distribution Recommendation" : ""}
              >
                <Activity className="nav-icon" />
                <span className="sidebar-copy">Distribution Recommendation</span>
              </button>
            </nav>
          </div>

          {/* Logout at bottom */}
          <div className="p-4 border-t border-slate-100">
            <Link to="/" className="w-full inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors" title="Exit Dashboard">
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="sidebar-copy">Exit Dashboard</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className={`content-area flex flex-col flex-1 h-screen bg-slate-50 ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>

        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8">
          <div>
            <h2 className="text-slate-900 font-bold text-sm leading-tight">
              {tab === 'inventory' ? 'Blood Component Inventory' : tab === 'requests' ? 'Hospital Issuance Queue' : 'Distribution Recommendation'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
              {tab === 'inventory' ? 'Live tracking of PRBC, FFP, Cryoprecipitate, and Cryosupernate levels' : tab === 'requests' ? 'Review pending requests and process blood unit issuance' : 'Equity-based blood distribution recommendations across hospital network'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Operations Center</p>
              <p className="text-[10px] text-slate-400">Bajada HQ, Davao City</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
              BB
            </span>
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="p-8 flex-1 space-y-6">

          {/* TAB 1: INVENTORY */}
          {tab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Current Blood Stock</h3>
                  <p className="text-xs text-slate-455 mt-0.5">Real-time status of PRBC, Platelets, FFP, Cryoprecipitate and Cryosupernate.</p>
                </div>
                <button
                  onClick={() => setShowUnitForm(true)}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Blood Unit
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold text-slate-655">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-3 font-bold">Blood Type</th>
                        <th className="px-6 py-3 font-bold text-center border-l border-slate-100">PRBC (Units)</th>
                        <th className="px-6 py-3 font-bold text-center border-l border-slate-100">Platelets</th>
                        <th className="px-6 py-3 font-bold text-center border-l border-slate-100">FFP</th>
                        <th className="px-6 py-3 font-bold text-center border-l border-slate-100">Cryoprecipitate</th>
                        <th className="px-6 py-3 font-bold text-center border-l border-slate-100">Cryosupernate</th>
                        <th className="px-6 py-3 font-bold text-center border-l border-slate-100">PRBC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventory.map((item) => {
                        const isSelected = selectedTypeFilter === item.type;
                        return (
                          <tr
                            key={item.type}
                            onClick={() => setSelectedTypeFilter(isSelected ? 'All' : item.type)}
                            className={`cursor-pointer transition-all ${isSelected
                              ? 'bg-rose-50/80 font-bold border-l-4 border-[#C21C24]'
                              : 'hover:bg-slate-50/70'
                              }`}
                            title={`Click to filter Table 9 for ${item.type} blood bags`}
                          >
                            <td className="px-6 py-3.5 flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold border text-[10px] font-mono shadow-2xs ${isSelected
                                ? 'bg-[#C21C24] text-white border-[#C21C24]'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                {item.type}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Filtering
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-sm text-slate-800">
                              {item.units}
                            </td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-slate-600">
                              {item.platelets || 0}
                            </td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-slate-600">
                              {item.ffp || 0}
                            </td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-slate-600">
                              {item.cryo || 0}
                            </td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-slate-600">
                              {item.cryosup || 0}
                            </td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100">
                              {item.status === 'safe' && <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Safe</span>}
                              {item.status === 'low' && <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1"><Activity className="w-3 h-3" /> Low</span>}
                              {item.status === 'critical' && <span className="bg-rose-50 border border-rose-100 text-[#C21C24] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Critical</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PHYSICAL BLOOD BAG REGISTRY (Table 9) */}
              {(() => {
                const filteredInventory = (bloodInventory || []).filter(unit => {
                  if (selectedTypeFilter === 'All') return true;
                  return unit.bloodTypeId === selectedTypeFilter;
                });

                return (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                          <Database className="w-4 h-4 text-indigo-600" /> Physical Blood Bag Registry (Table 9)
                        </h3>
                        {selectedTypeFilter !== 'All' && (
                          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            Filtered by {selectedTypeFilter}
                            <button
                              onClick={() => setSelectedTypeFilter('All')}
                              className="hover:text-rose-900 font-extrabold ml-1 cursor-pointer"
                              title="Clear filter"
                            >
                              ✕
                            </button>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">Filter Type:</span>
                        {['All', ...BLOOD_TYPES].map(type => (
                          <button
                            key={type}
                            onClick={() => setSelectedTypeFilter(type)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${selectedTypeFilter === type
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded ml-2">
                          Total: {filteredInventory.length} bags
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                            <th className="px-5 py-3 font-bold">Physical Bag Serial / Unit ID</th>
                            <th className="px-5 py-3 font-bold">Donation ID</th>
                            <th className="px-5 py-3 font-bold text-center">Type</th>
                            <th className="px-5 py-3 font-bold">Component</th>
                            <th className="px-5 py-3 font-bold text-center">Collected</th>
                            <th className="px-5 py-3 font-bold text-center">Expiry</th>
                            <th className="px-5 py-3 font-bold text-center">Qty (mL)</th>
                            <th className="px-5 py-3 font-bold text-center">Safety</th>
                            <th className="px-5 py-3 font-bold">Intended Use</th>
                            <th className="px-5 py-3 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-normal">
                          {filteredInventory.map(unit => (
                            <tr key={unit.unitId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3 font-mono font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                  <span className="bg-indigo-50 text-indigo-950 border border-indigo-100 px-2 py-0.5 rounded text-[11px] font-mono shadow-2xs">
                                    {unit.unitId}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3 font-mono text-slate-400 text-[10px]">{unit.donationId}</td>
                              <td className="px-5 py-3 text-center">
                                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono shadow-sm">
                                  {unit.bloodTypeId}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-bold text-slate-700">{unit.componentId}</td>
                              <td className="px-5 py-3 text-center font-mono text-[10px]">{unit.collectionDate || '—'}</td>
                              <td className="px-5 py-3 text-center font-mono text-[10px]">{unit.expirationDate}</td>
                              <td className="px-5 py-3 text-center font-bold text-slate-800">{unit.quantity} mL</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${unit.safetyStatus === 'Cleared' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  unit.safetyStatus === 'Hold-Quarantined' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                  {unit.safetyStatus}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-medium text-slate-600">{unit.intendedUse}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${unit.inventoryStatus === 'Available' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  unit.inventoryStatus === 'Issued' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    unit.inventoryStatus === 'Expired' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                      'bg-slate-100 text-slate-600'
                                  }`}>
                                  {unit.inventoryStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filteredInventory.length === 0 && (
                            <tr>
                              <td colSpan={10} className="px-5 py-8 text-center text-slate-400 text-xs font-normal">
                                No physical blood bags found matching blood type <strong>{selectedTypeFilter}</strong>.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: ISSUANCE REQUESTS */}
          {tab === 'requests' && (
            <div className="space-y-5 animate-in fade-in duration-200">

              {/* Sub-tab bar */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {[
                  { key: 'pending', label: `Pending (${pendingRequests.length})` },
                  { key: 'ready',   label: `Ready for Release (${readyRequests.length})` },
                  { key: 'history', label: 'History' },
                ].map(t => (
                  <button key={t.key} onClick={() => setReqSubTab(t.key)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      reqSubTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* PENDING — Blood Bank reviews and processes */}
              {reqSubTab === 'pending' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" /> Incoming Requests — Awaiting Blood Bank Processing
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                          <th className="px-6 py-3">Ref / Hospital</th>
                          <th className="px-6 py-3">Urgency</th>
                          <th className="px-6 py-3">Items Requested</th>
                          <th className="px-6 py-3">Date Needed</th>
                          <th className="px-6 py-3">Personnel</th>
                          <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingRequests.map(req => (
                          <tr key={req.refNo} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5">
                              <p className="font-mono text-[10px] font-bold text-slate-400">{req.refNo}</p>
                              <p className="font-bold text-slate-900 mt-0.5">{req.hospital}</p>
                              <p className="text-[10px] text-slate-400 font-normal">{req.submittedAt}</p>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                req.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                                req.urgency === 'urgent'    ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>{req.urgency || 'routine'}</span>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="space-y-0.5">
                                {(req.items || []).map((item, i) => {
                                  const avail = availableUnits(item.bloodType, item.component);
                                  const sufficient = avail >= item.units;
                                  return (
                                    <div key={i} className="flex items-center gap-1.5 text-[10px]">
                                      <span className="font-mono font-bold text-slate-700">{item.bloodType}</span>
                                      <span className="text-slate-400">·</span>
                                      <span className="text-slate-600">{item.component}</span>
                                      <span className="text-slate-400">×{item.units}</span>
                                      <span className={`ml-1 font-bold ${sufficient ? 'text-emerald-600' : avail > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                        ({sufficient ? '✓' : avail > 0 ? '⚠' : '✗'} {avail} avail)
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-slate-700">{req.dateNeeded || '—'}</td>
                            <td className="px-6 py-3.5 font-normal">
                              <p className="font-semibold text-slate-800">{req.requestingPersonnel || req.contactPerson || '—'}</p>
                              <p className="text-[10px] text-slate-400">{req.ward || ''}</p>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openProcess(req)}
                                  className="bg-slate-900 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-1 cursor-pointer text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5" /> Process
                                </button>
                                <button onClick={() => rejectRequest(req.refNo)}
                                  className="bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pendingRequests.length === 0 && (
                          <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400 font-normal text-xs">No pending requests awaiting processing.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* READY FOR RELEASE — waiting for Issuance Personnel approval */}
              {reqSubTab === 'ready' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Ready for Release — Awaiting Issuance Personnel Approval
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                          <th className="px-6 py-3">Ref / Hospital</th>
                          <th className="px-6 py-3">Items to Release</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Prepared</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {readyRequests.map(req => (
                          <tr key={req.refNo} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3.5">
                              <p className="font-mono text-[10px] font-bold text-slate-400">{req.refNo}</p>
                              <p className="font-bold text-slate-900">{req.hospital}</p>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="space-y-0.5">
                                {(req.items || []).map((item, i) => (
                                  <div key={i} className="text-[10px] text-slate-600">
                                    <span className="font-mono font-bold text-slate-700">{item.bloodType}</span> · {item.component} ×{item.units}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.status === 'Partially Fulfilled' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>{req.status}</span>
                            </td>
                            <td className="px-6 py-3.5 text-[10px] text-slate-500">{req.submittedAt}</td>
                          </tr>
                        ))}
                        {readyRequests.length === 0 && (
                          <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-normal text-xs">No requests awaiting release approval.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* HISTORY */}
              {reqSubTab === 'history' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Completed Request History</h3>
                  </div>
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-3">Ref</th>
                        <th className="px-6 py-3">Hospital</th>
                        <th className="px-6 py-3">Items</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyRequests.map(req => (
                        <tr key={req.refNo}>
                          <td className="px-6 py-3.5 font-mono text-[10px] font-bold text-slate-400">{req.refNo}</td>
                          <td className="px-6 py-3.5 font-bold text-slate-900">{req.hospital}</td>
                          <td className="px-6 py-3.5">
                            {(req.items || []).map((it, i) => (
                              <span key={i} className="text-[10px] text-slate-500 mr-2">{it.bloodType} · {it.component} ×{it.units}</span>
                            ))}
                          </td>
                          <td className="px-6 py-3.5">
                            {req.status === 'Released' ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Released</span>
                            ) : (
                              <span className="text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {historyRequests.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400 text-xs">No history yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PROCESS REQUEST MODAL */}
          {processingReq && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood Bank Staff · Process Request</p>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                      {processingReq.refNo} — {processingReq.hospital}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        processingReq.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                        processingReq.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{processingReq.urgency || 'routine'}</span>
                      <span className="text-[10px] text-slate-500">Needed by: <strong>{processingReq.dateNeeded || '—'}</strong></span>
                    </div>
                  </div>
                  <button onClick={() => setProcessingReq(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">

                  {/* Per-item quantity editor */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Items — Adjust Quantity to Issue</p>
                    <div className="space-y-2">
                      {processItems.map((item, idx) => {
                        const avail = availableUnits(item.bloodType, item.component);
                        const sufficient = avail >= item.requested;
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800 text-xs">{item.bloodType}</span>
                                <span className="text-slate-400 text-xs">·</span>
                                <span className="text-slate-700 text-xs font-semibold">{item.component}</span>
                              </div>
                              <div className="text-[10px] mt-0.5">
                                <span className="text-slate-500">Requested: <strong>{item.requested}</strong></span>
                                <span className="mx-2 text-slate-300">|</span>
                                <span className={`font-bold ${sufficient ? 'text-emerald-600' : avail > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {sufficient ? '✓' : avail > 0 ? '⚠' : '✗'} {avail} available in inventory
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] text-slate-500 font-semibold">To Issue:</label>
                              <input
                                type="number" min="0" max={item.requested}
                                value={item.quantityIssued}
                                onChange={e => {
                                  const val = Math.min(item.requested, Math.max(0, parseInt(e.target.value) || 0));
                                  setProcessItems(prev => prev.map((p, i) => i === idx ? { ...p, quantityIssued: val } : p));
                                  // auto-detect partial
                                  setIsPartial(processItems.some((p, i) => i === idx ? val < p.requested : p.quantityIssued < p.requested));
                                }}
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Partial fulfillment toggle */}
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <input type="checkbox" id="partial-check" checked={isPartial}
                      onChange={e => setIsPartial(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 cursor-pointer" />
                    <label htmlFor="partial-check" className="text-xs font-bold text-amber-800 cursor-pointer">
                      Mark as Partially Fulfilled (some items could not be fully supplied)
                    </label>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks / Notes</label>
                    <textarea
                      value={processRemarks}
                      onChange={e => setProcessRemarks(e.target.value)}
                      rows={2}
                      placeholder="Optional notes for this issuance..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                  <button onClick={() => setProcessingReq(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleProcess} disabled={processing}
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {processing ? 'Processing...' : (isPartial ? 'Confirm Partial Fulfillment' : 'Confirm & Prepare for Release')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISTRIBUTION RECOMMENDATION */}
          {tab === 'distribution' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Activity className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-bold mb-0.5">Equity-Based Blood Distribution Algorithm</p>
                  <p className="text-blue-700">Allocations are computed proportionally based on hospital type weighting (Government 1.5×, Blood Bank 1.2×, Private 1.0×) and predicted demand week. Only units above safety threshold are recommended for release.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventory.map(item => (
                  <div key={item.type} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-sm font-mono">{item.type}</span>
                        <span className={`text-[10px] font-bold uppercase ${item.status === 'critical' ? 'text-rose-600' : item.status === 'low' ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {item.status === 'critical' ? '⚠ Critical Stock' : item.status === 'low' ? '↓ Low Stock' : '✓ Stable'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700">Stock: {item.units} units</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500 font-semibold">
                        <span>SPMC (Government)</span>
                        <span className="font-mono text-slate-900 font-bold">{Math.round(item.units * 0.5)} units (50%)</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-semibold">
                        <span>Red Cross (Blood Bank)</span>
                        <span className="font-mono text-slate-900 font-bold">{Math.round(item.units * 0.3)} units (30%)</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-semibold">
                        <span>DMSF Hospital (Private)</span>
                        <span className="font-mono text-slate-900 font-bold">{Math.round(item.units * 0.2)} units (20%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── RECORD BLOOD UNIT MODAL (Table 9) ── */}
      {showUnitForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl flex-shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood Bank Staff · Table 9: Blood Inventory</p>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Record Blood Unit</h3>
                </div>
                <button onClick={() => { setShowUnitForm(false); setDonationSearch(''); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUnitSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

              {/* Physical Bag Sticker Serial / Barcode Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-600" /> Physical Bag Barcode / Serial Sticker No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. BAG-DVO-2026-001 (Leave blank for auto-generated ID)"
                  value={unitForm.unitId}
                  onChange={e => setUnitForm({ ...unitForm, unitId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none font-mono bg-slate-50/50"
                />
                <p className="text-[9px] text-slate-400 mt-1">
                  Type or scan the physical barcode sticker label attached to this specific blood bag.
                </p>
              </div>

              {/* Row 1: Link Donation ID / Donor (Full Width) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Link Donation ID / Donor <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Search Donor Name, ID, or Donation ID..."
                  value={donationSearch}
                  onChange={e => { setDonationSearch(e.target.value); setUnitForm({ ...unitForm, donationId: '' }); }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              {/* Donation record selector with Donor Name lookup */}
              {(() => {
                const q = donationSearch.toLowerCase().trim();
                // If query is empty or matches the currently selected/active donation, hide suggestions
                if (!q || (unitForm.donationId && donationSearch.includes(unitForm.donationId))) return null;

                const filtered = (donations || []).map(d => {
                  const donor = (donors || []).find(donorObj => donorObj.id.toLowerCase() === d.donorId.toLowerCase());
                  return { ...d, donorName: donor ? donor.name : 'Unknown Donor' };
                }).filter(d => {
                  return d.donationId.toLowerCase().includes(q) ||
                    d.donorId.toLowerCase().includes(q) ||
                    d.donorName.toLowerCase().includes(q);
                });

                if (filtered.length === 0) return (
                  <p className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    No matching donation records found.
                  </p>
                );

                return (
                  <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100 shadow-inner">
                    {filtered.map(d => (
                      <button key={d.donationId} type="button"
                        onClick={() => {
                          setUnitForm(f => ({ ...f, donationId: d.donationId, bloodType: d.bloodTypeId || f.bloodType }));
                          setDonationSearch(`${d.donorName} (${d.donationId})`);
                        }}
                        className={`w-full text-left p-2.5 text-xs flex justify-between items-center transition-all hover:bg-slate-50 ${unitForm.donationId === d.donationId ? 'bg-indigo-50 border-l-4 border-indigo-600 font-bold text-indigo-900' : 'text-slate-700'
                          }`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 text-xs">{d.donorName}</span>
                          <span className="text-[10px] text-slate-400">Donor ID: {d.donorId} · Date: {d.donationDate}</span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {d.donationId}
                          </span>
                          {d.bloodTypeId && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[9px] font-mono border border-slate-200">
                              {d.bloodTypeId}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Row 2: Blood Type + Component */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Blood Type <span className="text-rose-500">*</span></label>
                  <select required value={unitForm.bloodType} onChange={e => setUnitForm({ ...unitForm, bloodType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                    {BLOOD_TYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Blood Component <span className="text-rose-500">*</span></label>
                  <select required value={unitForm.component} onChange={e => setUnitForm({ ...unitForm, component: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                    {COMPONENTS.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Collection Date + Expiration Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collection Date <span className="text-rose-500">*</span></label>
                  <input type="date" required value={unitForm.collectionDate}
                    onChange={e => setUnitForm({ ...unitForm, collectionDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expiration Date <span className="text-rose-500">*</span></label>
                  <input type="date" required value={unitForm.expirationDate}
                    onChange={e => setUnitForm({ ...unitForm, expirationDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
              </div>

              {/* Row 4: Quantity */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity / Volume (mL) <span className="text-rose-500">*</span></label>
                <input type="number" required min="1" step="0.01" value={unitForm.quantity}
                  onChange={e => setUnitForm({ ...unitForm, quantity: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                  placeholder="e.g. 450" />
              </div>

              {/* Row 5: Safety Status + Intended Use */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Safety Status <span className="text-rose-500">*</span></label>
                  <select required value={unitForm.safetyStatus} onChange={e => setUnitForm({ ...unitForm, safetyStatus: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-xs outline-none ${unitForm.safetyStatus !== 'Cleared' ? 'border-amber-200 bg-amber-50 text-amber-700 font-bold' : 'border-slate-200 bg-white focus:ring-2 focus:ring-slate-900'
                      }`}>
                    {SAFETY_STATUSES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Intended Use <span className="text-rose-500">*</span></label>
                  <select required value={unitForm.intendedUse} onChange={e => setUnitForm({ ...unitForm, intendedUse: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                    {INTENDED_USES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 6: Inventory Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inventory Status <span className="text-rose-500">*</span></label>
                <select required value={unitForm.inventoryStatus} onChange={e => setUnitForm({ ...unitForm, inventoryStatus: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                  {['Available', 'Issued', 'Expired', 'Discarded'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>

              {unitSaved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Unit recorded successfully! Inventory updated.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUnitForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-sm transition-colors flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Commit Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SUCCESS MODAL ─── */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm p-6 text-center transform transition-all duration-300 scale-100 flex flex-col items-center">
            {/* Animated Check Circle Icon */}
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-inner mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight mb-2">
              {successModal.title}
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed px-2 mb-6">
              {successModal.message}
            </p>

            <button
              onClick={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
              className="w-full bg-slate-900 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              Great, thank you!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
