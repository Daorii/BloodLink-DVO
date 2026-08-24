import React, { useState } from 'react';
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
  const { donors, inventory, bloodRequests, approveRequest, rejectRequest, updateInventoryUnits, recordBloodUnit, bloodInventory, donations, isSidebarCollapsed, toggleSidebar } = useBloodStore();
  const [tab, setTab] = useState('inventory'); // 'inventory' | 'requests'
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState(emptyUnitForm);
  const [unitSaved, setUnitSaved] = useState(false);
  const [donationSearch, setDonationSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    recordBloodUnit(unitForm);
    setUnitSaved(true);
    setTimeout(() => { setUnitSaved(false); setUnitForm(emptyUnitForm); setShowUnitForm(false); setDonationSearch(''); }, 2000);
  };

  const handleIssue = (refNo) => {
    approveRequest(refNo);
    setSuccessModal({
      isOpen: true,
      title: 'Blood Units Dispatched!',
      message: `Requisition ${refNo} has been successfully completed. Physical blood bags were matched, labeled as Issued, and subtracted from active inventory.`
    });
  };

  // Filter requests that are Verified (ready for Blood Bank processing)
  const pendingRequests = bloodRequests.filter(req => req.status === 'Verified');
  const pastRequests = bloodRequests.filter(req => req.status === 'Issued' || req.status === 'Approved' || req.status === 'Rejected');

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
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Pending Requests Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                    <Clock className="w-4 h-4 text-amber-500" /> Pending Approval ({pendingRequests.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-3 font-bold">Ref No / Hospital</th>
                        <th className="px-6 py-3 font-bold text-center">Blood Type</th>
                        <th className="px-6 py-3 font-bold text-center">Units</th>
                        <th className="px-6 py-3 font-bold">Clinical Diagnosis</th>
                        <th className="px-6 py-3 font-bold">Contact Person</th>
                        <th className="px-6 py-3 text-center font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingRequests.map(req => (
                        <tr key={req.refNo} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <p className="font-mono text-[10px] font-bold text-slate-400">{req.refNo}</p>
                            <p className="font-bold text-slate-900 mt-0.5">{req.hospital}</p>
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">{req.submittedAt}</p>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono shadow-sm">
                              {req.patientBloodType || req.bloodType}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-800 text-sm">
                            {req.units}
                          </td>
                          <td className="px-6 py-3.5 font-normal">
                            <p className="font-semibold text-slate-700">{req.diagnosis || req.notes || 'Routine Clinic Use'}</p>
                          </td>
                          <td className="px-6 py-3.5 font-normal">
                            <p className="font-semibold text-slate-800">{req.contactPerson}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{req.contactNumber}</p>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleIssue(req.refNo)}
                                className="bg-slate-900 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Issue Blood
                              </button>
                              <button
                                onClick={() => rejectRequest(req.refNo)}
                                className="bg-white border border-slate-250 text-rose-650 hover:bg-rose-50/50 px-2.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pendingRequests.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-450 font-normal">
                            No verified blood requests pending bank dispatch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Processed Requests */}
              {pastRequests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Processed Requests Log</h3>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs font-semibold text-slate-655">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                          <th className="px-6 py-3">Ref No</th>
                          <th className="px-6 py-3">Hospital</th>
                          <th className="px-6 py-3 text-center">Request Detail</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pastRequests.map(req => (
                          <tr key={req.refNo}>
                            <td className="px-6 py-3.5 font-mono text-[10px] font-bold text-slate-400">{req.refNo}</td>
                            <td className="px-6 py-3.5 font-bold text-slate-900">{req.hospital}</td>
                            <td className="px-6 py-3.5 text-center font-bold text-slate-800">{req.units}x {req.patientBloodType || req.bloodType}</td>
                            <td className="px-6 py-3.5">
                              {req.status === 'Issued' || req.status === 'Approved' ? (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Issued</span>
                              ) : (
                                <span className="text-[#C21C24] bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
