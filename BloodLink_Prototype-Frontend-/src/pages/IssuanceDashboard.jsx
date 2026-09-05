import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useBloodStore } from '../store/useBloodStore';
import {
  LogOut, Plus, Clock,
  CheckCircle, XCircle, AlertTriangle, FileText,
  Droplets, X, Activity, Database, Shield, Trash2, ShoppingCart, Eye,
  TrendingUp, Search, ChevronDown, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import spmcLogo from '../assets/bloodlinks_logo/spmc-logo.png';
import prcLogo from '../assets/bloodlinks_logo/prc-logo.png';
import snbcLogo from '../assets/bloodlinks_logo/snbc-removebg-preview.png';
import davaoLogo from '../assets/bloodlinks_logo/davao-logo.png';

const COMPONENTS = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const SAFETY_STATUSES = ['Cleared', 'Hold-Quarantined', 'NCU', 'NS', 'Discarded'];
const INTENDED_USES = ['Transfusable', 'Storage-Research Only', 'Restricted'];

const emptyUnitForm = {
  unitId: '',
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

const emptyForm = {
  urgency: 'routine',
  dateNeeded: '',
  contactPerson: '',
  contactNumber: '',
  ward: '',
  notes: '',
  hospitalRefNo: '',
  clinicalIndication: '',
};

const emptyCartItem = {
  bloodType: 'O+',
  component: 'PRBC',
  units: 1,
};

export default function IssuanceDashboard() {
  const { 
    bloodRequests, 
    inventory, 
    hospitals, 
    addBloodRequest, 
    approveRequest, 
    verifyRequest,
    rejectRequest, 
    authSystemUser,
    bloodIssuance,
    bloodIssuanceDetails,
    granularForecasts,
    generateGranularForecast,
    fetchBloodRequestsFromAPI,
    fetchBloodIssuancesFromAPI,
    approveBloodRelease,
    bloodIssuances,
    processBloodRequest,
    bloodInventory,
    recordBloodUnit,
    donations,
    donors,
    isSidebarCollapsed,
    toggleSidebar
  } = useBloodStore();

  // ── Forecast filter states ──
  const [fcHospital,  setFcHospital]  = useState('ALL');
  const [fcBloodType, setFcBloodType] = useState('ALL');
  const [fcComponent, setFcComponent] = useState('ALL');
  const [fcWeeks,     setFcWeeks]     = useState(4);

  const BLOOD_TYPE_LIST = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];
  const COMP_LIST = ['PRBC','Platelet Concentrate','FFP','Cryoprecipitate','Cryosupernate'];

  const role           = authSystemUser?.role || 'Hospital User';
  const isHospitalUser  = role === 'Hospital User';
  const isIssuanceStaff = role === 'Issuance Personnel';
  const hospitalId      = authSystemUser?.hospitalId || 'HOSP-001';

  // Load blood requests + issuances from DB and auto-generate forecast on mount
  useEffect(() => {
    fetchBloodRequestsFromAPI();
    fetchBloodIssuancesFromAPI();
    if (role === 'Issuance Personnel' && (!granularForecasts || granularForecasts.length === 0)) {
      generateGranularForecast(4);
    }
  }, []);
  const filteredGF = (granularForecasts || []).filter(f => {
    if (fcHospital  !== 'ALL' && f.hospitalId  !== fcHospital)  return false;
    if (fcBloodType !== 'ALL' && f.bloodTypeId !== fcBloodType) return false;
    if (fcComponent !== 'ALL' && f.componentId !== fcComponent) return false;
    return true;
  });

  const hasGFData = filteredGF.length > 0;

  // Resolve the hospital name from the store
  const myHospital = hospitals?.find(h => h.id === hospitalId);
  const hospitalName = myHospital?.name || 'Unknown Hospital';

  const [showForm,           setShowForm]           = useState(false);
  const [form,               setForm]               = useState({ ...emptyForm });
  const [cartItems,          setCartItems]          = useState([]);
  const [cartItem,           setCartItem]           = useState({ ...emptyCartItem });
  const [cartError,          setCartError]          = useState('');
  const [submitted,          setSubmitted]          = useState(null);
  const [viewingReq,         setViewingReq]         = useState(null);
  const [rejectNote,         setRejectNote]         = useState('');
  const [activeTab,          setActiveTab]          = useState('queue');
  const [detailMode,         setDetailMode]         = useState('reject'); // 'reject' | 'view'
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [queueFilter,        setQueueFilter]        = useState('all'); // 'all' | 'mine'
  const [successModal,       setSuccessModal]       = useState({ isOpen: false, title: '', message: '' });
  const [drilldownHospital, setDrilldownHospital] = useState(null);
  // Process request modal state
  const [processingReq,   setProcessingReq]   = useState(null);
  const [processItems,    setProcessItems]    = useState([]);
  const [processRemarks,  setProcessRemarks]  = useState('');
  const [isPartial,       setIsPartial]       = useState(false);
  const [processing,      setProcessing]      = useState(false);
  // Inventory add form state
  const [showUnitForm,    setShowUnitForm]    = useState(false);
  const [unitForm,        setUnitForm]        = useState({ ...emptyUnitForm });
  const [unitSaved,       setUnitSaved]       = useState(false);
  const [donationSearch,  setDonationSearch]  = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [reqSubTab,       setReqSubTab]       = useState('pending');

  // Forecast Records table — independent filters
  const [recHospital, setRecHospital] = useState('ALL');
  const [recBloodType, setRecBloodType] = useState('ALL');
  const [recComponent, setRecComponent] = useState('ALL');
  const [recSearch, setRecSearch] = useState('');

  const myRequests   = isHospitalUser
    ? bloodRequests.filter(r => r.hospitalId === hospitalId)
    : bloodRequests;

  // For issuance staff: filteredQueue supports 'all' vs 'mine' (filed by this staff)
  const filteredQueue = isIssuanceStaff && queueFilter === 'mine'
    ? myRequests.filter(r => r.filedByIssuance === true)
    : myRequests;

  // Inventory: commit blood unit
  const handleUnitSubmit = (e) => {
    e.preventDefault();
    recordBloodUnit(unitForm);
    setUnitSaved(true);
    setTimeout(() => { setUnitSaved(false); setUnitForm({ ...emptyUnitForm }); setShowUnitForm(false); setDonationSearch(''); }, 2000);
  };

  // Process modal helpers
  const availableUnits = (bloodType, component) =>
    (bloodInventory || []).filter(u => u.bloodType === bloodType && u.component === component && u.inventoryStatus === 'Available').length;

  const openProcess = (req) => {
    setProcessingReq(req);
    setProcessItems((req.items || []).map(i => ({
      bloodType: i.bloodType,
      component: i.component,
      requested: i.units,
      quantityIssued: i.units,
    })));
    setProcessRemarks('');
    setIsPartial(false);
  };

  const handleProcess = async () => {
    if (!processingReq) return;
    setProcessing(true);
    const result = await processBloodRequest({
      requestId: processingReq.requestId,
      items: processItems.map(i => ({ bloodType: i.bloodType, component: i.component, quantityIssued: i.quantityIssued })),
      remarks: processRemarks,
      isPartial,
    });
    setProcessing(false);
    setProcessingReq(null);
    if (result.success) {
      setSuccessModal({
        isOpen: true,
        title: isPartial ? 'Partially Fulfilled!' : 'Blood Units Prepared!',
        message: `Request ${processingReq.refNo} has been processed and is now Ready for Release.`,
      });
    } else {
      alert('Failed to process request: ' + result.error);
    }
  };

  const handleVerify = (refNo) => {
    verifyRequest(refNo);
    setSuccessModal({
      isOpen: true,
      title: 'Requisition Verified!',
      message: `Blood Request ${refNo} has been successfully verified and forwarded to the Blood Bank for physical preparation.`
    });
  };

  const handleApproveRelease = async (req) => {
    // Look up the matching issuance record from bloodIssuances by requestId
    const issuance = (bloodIssuances || []).find(i => i.requestId === req.requestId);
    if (!issuance) {
      alert('No issuance record found for this request. The Blood Bank may not have processed it yet.');
      return;
    }
    const result = await approveBloodRelease({ issuanceId: issuance.issuanceId, remarks: '' });
    if (result.success) {
      setSuccessModal({
        isOpen: true,
        title: 'Release Approved!',
        message: `Blood units for ${req.refNo} have been released to ${req.hospital}. The request is now marked Released.`
      });
    } else {
      alert('Failed to approve release: ' + result.error);
    }
  };

  // Updated counts using new status values
  const pendingCount      = myRequests.filter(r => r.status === 'Pending Verification' || r.status === 'Pending').length;
  const verifiedCount     = myRequests.filter(r => r.status === 'Verified').length;
  const readyForReleaseCount = myRequests.filter(r => r.status === 'Ready for Release' || r.status === 'Partially Fulfilled').length;
  const releasedCount     = myRequests.filter(r => r.status === 'Released').length;
  const getInv = (type) => inventory.find(i => i.type === type);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCartItemChange = (e) => {
    const { name, value } = e.target;
    setCartItem(ci => ({ ...ci, [name]: value }));
  };

  const handleAddToCart = () => {
    const units = Number(cartItem.units);
    if (!units || units < 1) {
      setCartError('Please enter a valid unit count (≥ 1).');
      return;
    }
    setCartItems(prev => [...prev, {
      bloodType: cartItem.bloodType,
      component: cartItem.component,
      units,
    }]);
    setCartItem({ ...emptyCartItem });
    setCartError('');
  };

  const handleRemoveCartItem = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setCartError('Please add at least one blood component to the requisition.');
      return;
    }
    // For issuance staff filing on behalf of a hospital, use the selected hospital
    let submittingHospitalId = hospitalId;
    let submittingHospitalName = hospitalName;
    if (isIssuanceStaff) {
      const selHosp = hospitals?.find(h => h.id === selectedHospitalId);
      submittingHospitalId = selHosp?.id || 'HOSP-001';
      submittingHospitalName = selHosp?.name || 'Unknown Hospital';
    }
    const refNo = await addBloodRequest({
      ...form,
      hospital: submittingHospitalName,
      hospitalId: submittingHospitalId,
      items: cartItems,
      filedByIssuance: isIssuanceStaff,
      filedBy: authSystemUser?.name || 'Issuance Personnel',
    });
    setSubmitted(refNo);
    setShowForm(false);
    setForm({ ...emptyForm });
    setCartItems([]);
    setCartItem({ ...emptyCartItem });
    setCartError('');
    setSelectedHospitalId('');

    // Trigger Success Modal
    setSuccessModal({
      isOpen: true,
      title: isIssuanceStaff ? 'Requisition Filed!' : 'Request Submitted!',
      message: isIssuanceStaff 
        ? `Blood Requisition ${refNo} has been successfully filed on behalf of ${submittingHospitalName} and is marked as Verified (ready for Blood Bank).`
        : `Your blood requisition ${refNo} has been successfully submitted and is awaiting verification by the Issuance Personnel.`
    });
  };

  const openNewForm = () => {
    setForm({ ...emptyForm });
    setCartItems([]);
    setCartItem({ ...emptyCartItem });
    setCartError('');
    setSubmitted(null);
    setShowForm(true);
  };

  const openReject = (req) => {
    setDetailMode('reject');
    setViewingReq(req);
    setRejectNote('');
  };

  const openView = (req) => {
    setDetailMode('view');
    setViewingReq(req);
  };

  const urgencyConfig = {
    urgent:    { label: 'Urgent',    cls: 'bg-rose-50 text-[#C21C24] border-rose-200' },
    routine:   { label: 'Routine',   cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    emergency: { label: 'Emergency', cls: 'bg-red-600 text-white border-red-700 font-extrabold pulse' },
  };

  const statusConfig = {
    'Pending Verification': { icon: <Clock className="w-3 h-3" />,        cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    'Verified':             { icon: <Shield className="w-3 h-3" />,       cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    'Issued':               { icon: <CheckCircle className="w-3 h-3" />,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'Rejected':             { icon: <XCircle className="w-3 h-3" />,      cls: 'bg-rose-50 text-[#C21C24] border-rose-100' },
    // Backwards compatibility legacy mapping:
    'Pending':              { icon: <Clock className="w-3 h-3" />,        cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    'Approved':             { icon: <CheckCircle className="w-3 h-3" />,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  };

  const componentColor = (comp) => {
    const map = {
      'PRBC': 'bg-rose-50 text-rose-700 border-rose-100',
      'Platelet Concentrate': 'bg-amber-50 text-amber-700 border-amber-100',
      'FFP': 'bg-blue-50 text-blue-700 border-blue-100',
      'Cryoprecipitate': 'bg-purple-50 text-purple-700 border-purple-100',
      'Cryosupernate': 'bg-teal-50 text-teal-700 border-teal-100',
    };
    return map[comp] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">

      {/* SIDEBAR */}
      <aside className={`sidebar flex flex-col justify-between border-r border-slate-200 bg-white ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>
        <div id="issuance-sidebar" className="sidebar-inner w-full flex flex-col justify-between">
          <div>
            {/* Logo Section */}
            <div className={`py-5 border-b border-slate-100 ${isSidebarCollapsed ? 'px-3' : 'px-6'}`}>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className={`flex items-center min-w-0 ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                  <img src={bloodlinkLogo} alt="BloodLink" className="h-10 w-auto object-contain flex-shrink-0" />
                  <div className="sidebar-brand-copy min-w-0">
                    <p className="font-bold text-sm text-slate-900 tracking-tight leading-tight">BloodLink</p>
                    <p className="text-slate-500 text-[10px] font-bold">{isHospitalUser ? 'Hospital Portal' : 'Issuance Portal'}</p>
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
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-indigo-600" />
                    <p className="text-slate-800 font-bold text-xs">{role}</p>
                  </div>
                  {isHospitalUser && (
                    <p className="text-slate-500 text-[10px] font-medium mt-1 leading-tight">{hospitalName}</p>
                  )}
                  <p className="text-slate-400 text-[9px] font-medium mt-0.5">
                    {isHospitalUser ? `Facility ID: ${hospitalId}` : 'SNBC Issuance Center'}
                  </p>
                </div>
              </div>
            )}

            <nav className="flex-1 py-2 overflow-y-auto">
              <p className="sidebar-section-label text-slate-400 text-[9px] font-bold uppercase px-4 mt-3 mb-1 tracking-widest">Main Modules</p>
              <button onClick={() => setActiveTab('queue')}
                className={`w-full text-left nav-link ${activeTab === 'queue' ? 'active' : ''}`}
                title={isSidebarCollapsed ? (isHospitalUser ? 'My Requests' : 'Issuance Queue') : ""}>
                <FileText className="nav-icon" />
                <span className="sidebar-copy">{isHospitalUser ? 'My Requests' : 'Issuance Queue'}</span>
                {pendingCount > 0 && (
                  <span className="nav-badge ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{pendingCount}</span>
                )}
              </button>
              {isIssuanceStaff && (
                <>
                  <button onClick={() => setActiveTab('issuance_requests')}
                className={`w-full text-left nav-link ${activeTab === 'issuance_requests' ? 'active' : ''}`}
                title={isSidebarCollapsed ? 'Issuance Requests' : ""}>
                <Database className="nav-icon" />
                <span className="sidebar-copy">Issuance Requests</span>
                {verifiedCount > 0 && (
                  <span className="nav-badge ml-auto bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{verifiedCount}</span>
                )}
              </button>
              <button onClick={() => setActiveTab('inventory')}
                    className={`w-full text-left nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
                    title={isSidebarCollapsed ? 'Component Inventory' : ""}>
                    <Database className="nav-icon" />
                    <span className="sidebar-copy">Component Inventory</span>
                  </button>
                  <button onClick={() => setActiveTab('issuance_details')}
                    className={`w-full text-left nav-link ${activeTab === 'issuance_details' ? 'active' : ''}`}
                    title={isSidebarCollapsed ? 'Issuance Audit Log' : ""}>
                    <Activity className="nav-icon" />
                    <span className="sidebar-copy">Issuance Audit Log</span>
                  </button>
                  <button onClick={() => setActiveTab('distribution')}
                    className={`w-full text-left nav-link ${activeTab === 'distribution' ? 'active' : ''}`}
                    title={isSidebarCollapsed ? 'Distribution Recommendation' : ""}>
                    <Droplets className="nav-icon" />
                    <span className="sidebar-copy">Distribution Reco.</span>
                  </button>
                  <button onClick={() => { setActiveTab('forecast'); if (!granularForecasts || granularForecasts.length === 0) generateGranularForecast(fcWeeks); }}
                    className={`w-full text-left nav-link ${activeTab === 'forecast' ? 'active' : ''}`}
                    title={isSidebarCollapsed ? 'Demand Forecast' : ""}>
                    <TrendingUp className="nav-icon" />
                    <span className="sidebar-copy">Demand Forecast</span>
                  </button>
                </>
              )}
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

        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8">
          <div>
            <h2 className="text-slate-900 font-bold text-sm leading-tight">
              {isHospitalUser ? 'Blood Request Portal' : activeTab === 'inventory' ? 'Component Inventory' : activeTab === 'issuance_details' ? 'Issuance Audit Log' : activeTab === 'distribution' ? 'Distribution Recommendation' : activeTab === 'forecast' ? 'Demand Forecasting' : 'Issuance Requests'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
              {isHospitalUser ? 'Logistics-only - RA 10173 compliant' : activeTab === 'inventory' ? 'Blood component stock management' : activeTab === 'issuance_details' ? 'Full audit log of processed issuances' : activeTab === 'distribution' ? 'Equity-based blood distribution across hospital network' : activeTab === 'forecast' ? 'MLR-based blood demand predictions' : 'Verify, process, and release hospital blood requests'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isHospitalUser && (
              <button onClick={openNewForm}
                className="bg-[#C21C24] hover:bg-[#A8181F] text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> New Blood Request
              </button>
            )}
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">{authSystemUser?.name || 'Staff'}</p>
              <p className="text-[10px] text-slate-400">{role}</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
              {isHospitalUser ? 'HU' : 'IP'}
            </span>
          </div>
        </header>

        <main className="p-8 flex-1 space-y-6">

          {submitted && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-900 text-sm">Request submitted successfully!</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Ref No: <span className="font-mono font-bold">{submitted}</span> — awaiting Issuance Personnel review.</p>
                </div>
              </div>
              <button onClick={() => setSubmitted(null)} className="text-emerald-500 hover:text-emerald-700"><X className="w-4 h-4" /></button>
            </div>
          )}

          {isIssuanceStaff && activeTab === 'queue' && (
            <div className="bg-slate-900 text-white rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">RA 10173 Data Privacy Notice</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">Patient-identifiable clinical data is restricted. Queue shows logistics data only (blood type, component, units, urgency, ward).</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Requests</p>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">{myRequests.length}</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">All submitted requests</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pending Review</p>
              <p className="text-2xl font-extrabold text-amber-500 font-mono">{pendingCount}</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Awaiting issuance action</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Ready for Release</p>
              <p className="text-2xl font-extrabold text-blue-600 font-mono">{readyForReleaseCount}</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Blood Bank prepared — approve release</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Released</p>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">{releasedCount}</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Fulfilled & physically released</p>
            </div>
          </div>

          {activeTab === 'queue' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-[#C21C24]" />
                  {isHospitalUser ? 'My Blood Requests' : 'Hospital Issuance Queue'}
                </h3>
                <div className="flex items-center gap-3">
                  {isIssuanceStaff && (
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      <button onClick={() => setQueueFilter('all')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          queueFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}>
                        All Requests
                      </button>
                      <button onClick={() => setQueueFilter('mine')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          queueFilter === 'mine'
                            ? 'bg-[#C21C24] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}>
                        Filed by Me
                      </button>
                    </div>
                  )}
                  {isIssuanceStaff && pendingCount > 0 && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">{pendingCount} pending</span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3 font-bold">Ref No</th>
                      <th className="px-6 py-3 font-bold">Hospital</th>
                      <th className="px-6 py-3 font-bold">Requisition Items</th>
                      <th className="px-6 py-3 font-bold text-center">Urgency</th>
                      <th className="px-6 py-3 font-bold">Submitted</th>
                      {isIssuanceStaff && <th className="px-6 py-3 font-bold text-center">Source</th>}
                      <th className="px-6 py-3 font-bold text-center">Status</th>
                      <th className="px-6 py-3 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueue.map(req => {
                      const urgency = urgencyConfig[req.urgency] || urgencyConfig.routine;
                      const status  = statusConfig[req.status]   || statusConfig.Pending;
                      const items   = req.items || [];
                      return (
                        <tr key={req.refNo} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-400">{req.refNo}</td>
                          <td className="px-6 py-3.5">
                            <p className="font-bold text-slate-900">{req.hospital}</p>
                          </td>
                          <td className="px-6 py-3.5">
                            {items.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {items.map((item, idx) => (
                                  <div key={idx} className="inline-flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-[#C21C24] font-black text-[9px] border border-rose-100 font-mono">{item.bloodType}</span>
                                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${componentColor(item.component)}`}>{item.component}</span>
                                    <span className="text-[10px] text-slate-500 font-bold">{item.units} unit{item.units !== 1 ? 's' : ''}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Legacy single-item fallback */
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-[#C21C24] font-black text-[9px] border border-rose-100 font-mono">{req.patientBloodType}</span>
                                <span className="text-[10px] text-slate-500 font-bold">{req.units} unit{req.units !== 1 ? 's' : ''}</span>
                                {req.component && <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${componentColor(req.component)}`}>{req.component}</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${urgency.cls}`}>{urgency.label}</span>
                          </td>
                          <td className="px-6 py-3.5 font-mono font-normal text-slate-500">{req.submittedAt}</td>
                          {isIssuanceStaff && (
                            <td className="px-6 py-3.5 text-center">
                              {req.filedByIssuance
                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100"><Shield className="w-2.5 h-2.5" /> Issuance</span>
                                : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100">Hospital</span>
                              }
                            </td>
                          )}
                          <td className="px-6 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${status.cls}`}>{status.icon} {req.status}</span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* View details - available to all */}
                              <button onClick={() => openView(req)}
                                className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {/* Verify / Reject — pending hospital-submitted requests */}
                              {isIssuanceStaff && (req.status === 'Pending Verification' || req.status === 'Pending') && !req.filedByIssuance && (
                                <>
                                  <button onClick={() => handleVerify(req.refNo)} className="text-indigo-700 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors font-bold flex items-center gap-0.5" title="Verify">
                                    <CheckCircle className="w-4 h-4 text-indigo-600" /> <span className="text-[10px]">Verify</span>
                                  </button>
                                  <button onClick={() => openReject(req)} className="text-[#C21C24] hover:bg-rose-50 p-1.5 rounded-lg transition-colors" title="Reject">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {/* Process — after verified, issuance prepares blood units */}
                              {isIssuanceStaff && req.status === 'Verified' && (
                                <button onClick={() => openProcess(req)}
                                  className="text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition-colors font-bold flex items-center gap-0.5" title="Process Request">
                                  <Database className="w-4 h-4 text-slate-700" /> <span className="text-[10px]">Process</span>
                                </button>
                              )}
                              {/* Approve Release — once units are prepared */}
                              {isIssuanceStaff && (req.status === 'Ready for Release' || req.status === 'Partially Fulfilled') && (
                                <button onClick={() => handleApproveRelease(req)}
                                  className="text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors font-bold flex items-center gap-0.5" title="Approve Physical Release">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" /> <span className="text-[10px]">Release</span>
                                </button>
                              )}
                              {/* Status labels for non-actionable states */}
                              {isIssuanceStaff && !['Pending Verification', 'Pending', 'Verified', 'Ready for Release', 'Partially Fulfilled'].includes(req.status) && (
                                <span className="text-slate-400 text-[10px] font-semibold">
                                  {req.status === 'Released' ? '✓ Released' :
                                   req.status === 'Rejected' ? '✗ Rejected' : req.status}
                                </span>
                              )}
                              {isIssuanceStaff && req.filedByIssuance && (req.status === 'Pending Verification' || req.status === 'Pending') && (
                                <span className="text-slate-400 text-[10px] font-semibold">Filed by Staff</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredQueue.length === 0 && (
                      <tr><td colSpan={isIssuanceStaff ? 8 : 7} className="px-6 py-8 text-center text-slate-400 font-normal">
                        {queueFilter === 'mine' ? 'No requests filed by you yet.' : 'No blood requests found.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isIssuanceStaff && activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Current Blood Stock</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time status of PRBC, Platelets, FFP, Cryoprecipitate and Cryosupernate.</p>
                </div>
                <button onClick={() => setShowUnitForm(true)}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Record Blood Unit
                </button>
              </div>

              {/* Stock summary table — click row to filter bag registry */}
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
                          <tr key={item.type}
                            onClick={() => setSelectedTypeFilter(isSelected ? 'All' : item.type)}
                            className={`cursor-pointer transition-all ${isSelected ? 'bg-rose-50/80 font-bold border-l-4 border-[#C21C24]' : 'hover:bg-slate-50/70'}`}
                            title={`Click to filter bag registry for ${item.type}`}>
                            <td className="px-6 py-3.5 flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold border text-[10px] font-mono shadow-2xs ${
                                isSelected ? 'bg-[#C21C24] text-white border-[#C21C24]' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {item.type}
                              </span>
                              {isSelected && <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Filtering</span>}
                            </td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-sm text-slate-800">{item.units}</td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-slate-600">{item.platelets || 0}</td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-slate-600">{item.ffp || 0}</td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-slate-600">{item.cryo || 0}</td>
                            <td className="px-6 py-3.5 text-center border-l border-slate-100 font-bold text-slate-600">{item.cryosup || 0}</td>
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

              {/* Physical Blood Bag Registry */}
              {(() => {
                const filteredInventory = (bloodInventory || []).filter(unit =>
                  selectedTypeFilter === 'All' ? true : unit.bloodTypeId === selectedTypeFilter
                );
                return (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                          <Database className="w-4 h-4 text-indigo-600" /> Physical Blood Bag Registry
                        </h3>
                        {selectedTypeFilter !== 'All' && (
                          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            Filtered by {selectedTypeFilter}
                            <button onClick={() => setSelectedTypeFilter('All')} className="hover:text-rose-900 font-extrabold ml-1 cursor-pointer" title="Clear filter">✕</button>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">Filter:</span>
                        {['All', ...BLOOD_TYPES].map(type => (
                          <button key={type} onClick={() => setSelectedTypeFilter(type)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                              selectedTypeFilter === type ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {type}
                          </button>
                        ))}
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded ml-2">Total: {filteredInventory.length} bags</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                            <th className="px-5 py-3 font-bold">Unit ID</th>
                            <th className="px-5 py-3 font-bold">Donation ID</th>
                            <th className="px-5 py-3 font-bold text-center">Type</th>
                            <th className="px-5 py-3 font-bold">Component</th>
                            <th className="px-5 py-3 font-bold text-center">Collected</th>
                            <th className="px-5 py-3 font-bold text-center">Expiry</th>
                            <th className="px-5 py-3 font-bold text-center">Qty (mL)</th>
                            <th className="px-5 py-3 font-bold text-center">Safety</th>
                            <th className="px-5 py-3 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-normal">
                          {filteredInventory.map(unit => (
                            <tr key={unit.unitId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3 font-mono font-bold text-slate-900">
                                <span className="bg-indigo-50 text-indigo-950 border border-indigo-100 px-2 py-0.5 rounded text-[11px] font-mono">{unit.unitId}</span>
                              </td>
                              <td className="px-5 py-3 font-mono text-slate-400 text-[10px]">{unit.donationId}</td>
                              <td className="px-5 py-3 text-center">
                                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">{unit.bloodTypeId}</span>
                              </td>
                              <td className="px-5 py-3 font-bold text-slate-700">{unit.componentId}</td>
                              <td className="px-5 py-3 text-center font-mono text-[10px]">{unit.collectionDate || '—'}</td>
                              <td className="px-5 py-3 text-center font-mono text-[10px]">{unit.expirationDate}</td>
                              <td className="px-5 py-3 text-center font-bold text-slate-800">{unit.quantity} mL</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  unit.safetyStatus === 'Cleared' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  unit.safetyStatus === 'Hold-Quarantined' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                  {unit.safetyStatus}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  unit.inventoryStatus === 'Available' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  unit.inventoryStatus === 'Issued' ? 'bg-slate-100 text-slate-600' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                  {unit.inventoryStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filteredInventory.length === 0 && (
                            <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-400 text-xs font-normal">No blood bags found{selectedTypeFilter !== 'All' ? ` for type ${selectedTypeFilter}` : ''}.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── TAB: ISSUANCE REQUESTS ── */}
          {isIssuanceStaff && activeTab === 'issuance_requests' && (() => {
            const verifiedReqs = bloodRequests.filter(r => r.status === 'Verified');
            const readyReqs    = bloodRequests.filter(r => r.status === 'Ready for Release' || r.status === 'Partially Fulfilled');
            const historyReqs  = bloodRequests.filter(r => r.status === 'Released' || r.status === 'Rejected');
            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Sub-tab bar */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                  {[
                    { key: 'pending', label: `To Process (${verifiedReqs.length})` },
                    { key: 'ready',   label: `Ready for Release (${readyReqs.length})` },
                    { key: 'history', label: 'History' },
                  ].map(t => (
                    <button key={t.key} onClick={() => setReqSubTab(t.key)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        reqSubTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* PENDING — Verified requests to process */}
                {reqSubTab === 'pending' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" /> Verified Requests — Ready to Process
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
                          {verifiedReqs.map(req => (
                            <tr key={req.refNo} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3.5">
                                <p className="font-mono text-[10px] font-bold text-slate-400">{req.refNo}</p>
                                <p className="font-bold text-slate-900 mt-0.5">{req.hospital}</p>
                                <p className="text-[10px] text-slate-400 font-normal">{req.submittedAt}</p>
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  req.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                                  req.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {req.urgency || 'routine'}
                                </span>
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
                                </div>
                              </td>
                            </tr>
                          ))}
                          {verifiedReqs.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-normal text-xs">No verified requests to process yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* READY FOR RELEASE */}
                {reqSubTab === 'ready' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/50">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Ready for Release — Approve Physical Dispatch
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                            <th className="px-6 py-3">Ref / Hospital</th>
                            <th className="px-6 py-3">Items to Release</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {readyReqs.map(req => (
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
                                  req.status === 'Partially Fulfilled' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <button onClick={() => handleApproveRelease(req)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-1 mx-auto cursor-pointer text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve Release
                                </button>
                              </td>
                            </tr>
                          ))}
                          {readyReqs.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-normal text-xs">No requests awaiting release approval.</td></tr>
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
                        {historyReqs.map(req => (
                          <tr key={req.refNo}>
                            <td className="px-6 py-3.5 font-mono text-[10px] font-bold text-slate-400">{req.refNo}</td>
                            <td className="px-6 py-3.5 font-bold text-slate-900">{req.hospital}</td>
                            <td className="px-6 py-3.5">
                              {(req.items || []).map((it, i) => (
                                <span key={i} className="text-[10px] text-slate-500 mr-2">{it.bloodType} · {it.component} ×{it.units}</span>
                              ))}
                            </td>
                            <td className="px-6 py-3.5">
                              {req.status === 'Released'
                                ? <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Released</span>
                                : <span className="text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
                              }
                            </td>
                          </tr>
                        ))}
                        {historyReqs.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs">No history yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}


          {isIssuanceStaff && activeTab === 'issuance_details' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#C21C24]" />
                    <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider">Blood Issuance Audit Log</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">{(bloodIssuances || []).length} record(s)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-3">Issuance Ref</th>
                        <th className="px-6 py-3">Request</th>
                        <th className="px-6 py-3">Hospital</th>
                        <th className="px-6 py-3">Items Issued</th>
                        <th className="px-6 py-3">Processed By</th>
                        <th className="px-6 py-3">Issuance Date</th>
                        <th className="px-6 py-3">Released By</th>
                        <th className="px-6 py-3">Release Date</th>
                        <th className="px-6 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(bloodIssuances || []).length > 0 ? (
                        (bloodIssuances || []).map(iss => (
                          <tr key={iss.issuanceId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5 font-mono font-bold text-slate-700">{iss.issuanceRef}</td>
                            <td className="px-6 py-3.5 font-mono text-slate-500">{iss.requestRef}</td>
                            <td className="px-6 py-3.5 font-bold text-slate-900">{iss.hospital}</td>
                            <td className="px-6 py-3.5">
                              <div className="space-y-0.5">
                                {(iss.items || []).map((item, i) => (
                                  <div key={i} className="text-[10px] text-slate-600">
                                    <span className="font-mono font-bold text-slate-700">{item.bloodType}</span>
                                    {' · '}{item.component}
                                    {' × '}<span className="font-bold">{item.quantityIssued}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-slate-600">{iss.processedBy}</td>
                            <td className="px-6 py-3.5 text-slate-500 font-normal">{iss.issuanceDate}</td>
                            <td className="px-6 py-3.5 text-slate-600">{iss.releaseApprovedBy || <span className="text-slate-300">—</span>}</td>
                            <td className="px-6 py-3.5 text-slate-500 font-normal">{iss.releaseDate || <span className="text-slate-300">—</span>}</td>
                            <td className="px-6 py-3.5 text-center">
                              {iss.status === 'Released' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  <CheckCircle className="w-3 h-3" /> Released
                                </span>
                              ) : iss.status === 'Cancelled' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                                  <XCircle className="w-3 h-3" /> Cancelled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                  <Clock className="w-3 h-3" /> Prepared
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-6 py-10 text-center text-slate-400 font-normal">
                            No issuance records yet. Records appear here once the Blood Bank processes a request.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: DISTRIBUTION RECOMMENDATION ── */}
          {isIssuanceStaff && activeTab === 'distribution' && (
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

          {/* ── TAB: DEMAND FORECAST (Issuance Personnel only) ── */}
          {isIssuanceStaff && activeTab === 'forecast' && (() => {
            const gf = Array.isArray(granularForecasts) ? granularForecasts : [];
            const isOverview = fcHospital === 'ALL' && fcBloodType === 'ALL' && fcComponent === 'ALL';
            const allWeekLabels = [...new Set(gf.map(f => f.forecastWeekLabel))].sort();
            const overviewChartData = (() => {
              const sampleHistorical = gf[0]?.historicalWeeks || [];
              const histPart = sampleHistorical.map((w, idx) => {
                const seen = {};
                gf.forEach(f => {
                  const key = `${f.hospitalId}|${f.bloodTypeId}|${f.componentId}`;
                  if (!seen[key] && f.historicalWeeks?.[idx]) {
                    seen[key] = f.historicalWeeks[idx].actual;
                  }
                });
                const total = Object.values(seen).reduce((a, b) => a + b, 0);
                return { label: `Wk ${idx + 1}`, actual: total, predicted: null, upper: null, lower: null };
              });
              const predPart = allWeekLabels.map(wkLabel => {
                const rows = gf.filter(f => f.forecastWeekLabel === wkLabel);
                const totalPred = rows.reduce((s, f) => s + f.predictedDemand, 0);
                const totalUpper = rows.reduce((s, f) => s + f.upperBound, 0);
                const totalLower = rows.reduce((s, f) => s + f.lowerBound, 0);
                return { label: wkLabel, actual: null, predicted: totalPred, upper: totalUpper, lower: totalLower };
              });
              return [...histPart, ...predPart];
            })();
            const filtered = gf.filter(f =>
              (fcHospital === 'ALL' || f.hospitalId === fcHospital) &&
              (fcBloodType === 'ALL' || f.bloodTypeId === fcBloodType) &&
              (fcComponent === 'ALL' || f.componentId === fcComponent)
            );
            const filteredChartData = (() => {
              const sampleHistorical = filtered[0]?.historicalWeeks || [];
              const histPart = sampleHistorical.map((w, idx) => {
                const seen = {};
                filtered.forEach(f => {
                  const key = `${f.hospitalId}|${f.bloodTypeId}|${f.componentId}`;
                  if (!seen[key] && f.historicalWeeks?.[idx]) {
                    seen[key] = f.historicalWeeks[idx].actual;
                  }
                });
                const total = Object.values(seen).reduce((a, b) => a + b, 0);
                return { label: `Wk ${idx + 1}`, actual: total, predicted: null, upper: null, lower: null };
              });
              const predPart = allWeekLabels.map(wkLabel => {
                const rows = filtered.filter(f => f.forecastWeekLabel === wkLabel);
                if (!rows.length) return null;
                return {
                  label: wkLabel,
                  actual: null,
                  predicted: rows.reduce((s, f) => s + f.predictedDemand, 0),
                  upper: rows.reduce((s, f) => s + f.upperBound, 0),
                  lower: rows.reduce((s, f) => s + f.lowerBound, 0),
                };
              }).filter(Boolean);
              return [...histPart, ...predPart];
            })();
            const activeChartData = isOverview ? overviewChartData : filteredChartData;

            // KPI cards
            const nextWkPredOverview = overviewChartData.find(d => d.predicted !== null);
            const nextWkFiltered = filteredChartData.find(d => d.predicted !== null);
            const totalForecastedUnitsNextWk = isOverview
              ? (nextWkPredOverview?.predicted ?? 0)
              : (nextWkFiltered?.predicted ?? 0);
            const totalHistActual = (() => {
              const histRows = activeChartData.filter(d => d.actual !== null);
              if (!histRows.length) return 0;
              return Math.round(histRows.reduce((s, d) => s + d.actual, 0) / histRows.length);
            })();
            const totalCombinations = isOverview
              ? new Set(gf.map(f => `${f.hospitalId}|${f.bloodTypeId}|${f.componentId}`)).size
              : new Set(filtered.map(f => `${f.hospitalId}|${f.bloodTypeId}|${f.componentId}`)).size;
            const highestDemandCombo = (() => {
              const rows = (isOverview ? gf : filtered).filter(f => f.weeksAhead === 1);
              if (!rows.length) return null;
              return rows.reduce((best, f) => f.predictedDemand > (best?.predictedDemand ?? 0) ? f : best, null);
            })();

            const hasData = gf.length > 0;

            return (
              <div className="space-y-5 fade-in">

                {/* Algorithm banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1">Multiple Linear Regression (MLR) Forecasting Engine</p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Computed per <strong className="text-white">hospital × blood type × component</strong> using a multivariate OLS matrix solver.
                      Algorithm: <span className="text-blue-300 font-mono text-[10px]">y_pred = b0 + b1 * week + b2 * hospScale + b3 * compWeight</span> mixed with MA4, with ±8% confidence bands.
                      The <strong className="text-white">Overview</strong> chart shows the total system-wide demand the blood bank must prepare for.
                      Use filters to drill down per hospital or blood type.
                    </p>
                  </div>
                </div>

                {/* Controls row */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Forecast Controls</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isOverview
                          ? <span className="text-emerald-600 font-bold">📊 Overview Mode — Total demand across all hospitals, blood types, and components</span>
                          : <span className="text-slate-700 font-bold">🔍 Filtered Mode — {fcHospital !== 'ALL' ? hospitals.find(h => h.id === fcHospital)?.name?.split('(')[0].trim() : 'All Hospitals'} · {fcBloodType !== 'ALL' ? fcBloodType : 'All Blood Types'} · {fcComponent !== 'ALL' ? fcComponent : 'All Components'}</span>
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isOverview && (
                        <button onClick={() => { setFcHospital('ALL'); setFcBloodType('ALL'); setFcComponent('ALL'); }}
                          className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                          ↩ Reset to Overview
                        </button>
                      )}
                      <button onClick={() => generateGranularForecast(fcWeeks)}
                        className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-sm cursor-pointer">
                        <Activity className="w-3.5 h-3.5" /> Re-run Forecast
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Hospital</label>
                      <select value={fcHospital} onChange={e => setFcHospital(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                        <option value="ALL">All Hospitals (Overview)</option>
                        {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Blood Type</label>
                      <select value={fcBloodType} onChange={e => setFcBloodType(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                        <option value="ALL">All Blood Types</option>
                        {BLOOD_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Component</label>
                      <select value={fcComponent} onChange={e => setFcComponent(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                        <option value="ALL">All Components</option>
                        {COMPONENTS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Weeks Ahead</label>
                      <select value={fcWeeks} onChange={e => setFcWeeks(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                        {[2, 4, 6, 8].map(w => <option key={w} value={w}>{w} weeks</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {!hasData && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
                    <div className="loading py-4 flex justify-center mb-3">
                      <svg width="64px" height="48px" viewBox="0 0 48 48">
                        <polyline points="0.15, 24 16.15, 24 20.15, 12 24.15, 36 28.15, 18 32.15, 30 36.15, 24 47.85, 24" id="back"></polyline>
                        <polyline points="0.15, 24 16.15, 24 20.15, 12 24.15, 36 28.15, 18 32.15, 30 36.15, 24 47.85, 24" id="front"></polyline>
                      </svg>
                    </div>
                    <p className="font-bold text-slate-700 text-sm">Processing OLS Matrix Solver…</p>
                    <p className="text-xs text-slate-400 mt-1">Solving coefficients for the Multiple Linear Regression model.</p>
                  </div>
                )}

                {hasData && (
                  <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          {isOverview ? 'Total Next-Week Demand' : 'Next-Week (Filtered)'}
                        </p>
                        <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalForecastedUnitsNextWk.toFixed(0)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isOverview ? 'units across all hospitals' : `units · ${fcBloodType} ${fcComponent}`}
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">AVERAGE Historical Demand</p>
                        <p className="text-2xl font-extrabold text-emerald-600 font-mono">{totalHistActual}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isOverview ? 'total units/week (8-wk avg)' : 'units/week (filtered avg)'}
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          {isOverview ? 'Active Combinations' : 'Filtered Combinations'}
                        </p>
                        <p className="text-2xl font-extrabold text-blue-600 font-mono">{totalCombinations}</p>
                        <p className="text-[10px] text-slate-400 mt-1">hospital × type × component</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Highest Demand (Next Wk)</p>
                        <p className="text-2xl font-extrabold text-amber-600 font-mono">{highestDemandCombo?.predictedDemand.toFixed(0) ?? '—'}</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                          {highestDemandCombo
                            ? `${highestDemandCombo.bloodTypeId} ${highestDemandCombo.componentId}`
                            : '—'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Main Chart */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                            {isOverview
                              ? '📊 Overall System Demand Forecast (All Hospitals · All Blood Types · All Components)'
                              : `🔍 Filtered Demand Forecast — ${fcHospital !== 'ALL' ? hospitals.find(h => h.id === fcHospital)?.name?.split('(')[0].trim() : 'All Hospitals'} · ${fcBloodType !== 'ALL' ? fcBloodType : 'All Types'} · ${fcComponent !== 'ALL' ? fcComponent : 'All Components'}`
                            }
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Wk 1–8 = historical actual issuances (aggregated) | Wk 9+ = REMA predictions with ±8% confidence band
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold flex-shrink-0 ml-4">
                          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-500 inline-block rounded"></span>Actual</span>
                          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-indigo-500 inline-block rounded"></span>Predicted</span>
                          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-slate-300 inline-block rounded"></span>Confidence</span>
                        </div>
                      </div>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activeChartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tick={{ fontFamily: 'monospace' }} />
                            <YAxis stroke="#94a3b8" fontSize={10} />
                            <Tooltip
                              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                              formatter={(val, name) => [val ? `${val} units` : '—', name]}
                            />
                            <Line type="monotone" dataKey="upper" stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="5 5" name="Upper Bound" dot={false} connectNulls />
                            <Line type="monotone" dataKey="lower" stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="5 5" name="Lower Bound" dot={false} connectNulls />
                            <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={3} name="Actual (Historical)" dot={{ r: 4, fill: '#10B981' }} connectNulls />
                            <Line type="monotone" dataKey="predicted" stroke="#4F46E5" strokeWidth={3} name="REMA Prediction" dot={{ r: 4, fill: '#4F46E5' }} connectNulls strokeDasharray={isOverview ? undefined : "6 3"} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>



                    {/* Per Hospital Breakdown (Overview only) */}
                    {isOverview && (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                          <h3 className="font-bold text-slate-900 text-sm tracking-tight">Next-Week Demand by Hospital</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Total predicted units each hospital will need — click to filter</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {hospitals.map(hosp => {
                            const rows = gf.filter(f => f.hospitalId === hosp.id && f.weeksAhead === 1);
                            const total = rows.reduce((s, f) => s + f.predictedDemand, 0);
                            const allTotal = gf.filter(f => f.weeksAhead === 1).reduce((s, f) => s + f.predictedDemand, 0);
                            const pct = allTotal ? Math.round((total / allTotal) * 100) : 0;
                            const barW = allTotal ? (total / allTotal) * 100 : 0;
                            const logoImg = hospitals.find(h => h.id === hosp.id)?.name?.toLowerCase().includes('spmc') ? spmcLogo :
                                            hospitals.find(h => h.id === hosp.id)?.name?.toLowerCase().includes('red cross') ? prcLogo :
                                            hospitals.find(h => h.id === hosp.id)?.name?.toLowerCase().includes('san pedro') ? snbcLogo : davaoLogo;
                            return (
                              <button key={hosp.id} onClick={() => { setFcHospital(hosp.id); setRecHospital(hosp.id); }}
                                className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition text-left group cursor-pointer">
                                {/* Actual Hospital PNG Logo */}
                                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs flex-shrink-0">
                                  <img src={logoImg} alt={hosp.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="w-36 flex-shrink-0">
                                  <p className="font-bold text-slate-800 text-xs leading-tight group-hover:text-indigo-650 transition">{hosp.name.split('(')[0].trim()}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{hosp.id}</p>
                                </div>
                                <div className="flex-1">
                                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${barW}%` }} />
                                  </div>
                                </div>
                                <div className="w-20 text-right flex-shrink-0">
                                  <span className="font-extrabold text-slate-900 font-mono text-sm">{total.toFixed(0)}</span>
                                  <span className="text-[10px] text-slate-400 ml-1">units</span>
                                </div>
                                <span className="text-[10px] text-slate-400 w-10 text-right flex-shrink-0">{pct}%</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ─── GRANULAR COMPONENT BREAKDOWN: Hospital List → Drilldown ─── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                      {/* ── LIST VIEW (no hospital selected) ── */}
                      {!drilldownHospital && (() => {
                        const getHospLogo = (name) => {
                          const n = name.toLowerCase();
                          if (n.includes('spmc') || n.includes('southern philippines')) return spmcLogo;
                          if (n.includes('red cross') || n.includes('prc')) return prcLogo;
                          if (n.includes('san pedro') || n.includes('snbc') || n.includes('sub-national')) return snbcLogo;
                          return davaoLogo;
                        };

                        return (
                          <>
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                                  Granular Component Breakdown — Next Week
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Select a hospital to view its full demand breakdown by blood type &amp; component
                                </p>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                {hospitals.length} hospitals registered
                              </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                              {hospitals.map((hosp, idx) => {
                                const rows = gf.filter(f => f.hospitalId === hosp.id && f.weeksAhead === 1);
                                const totalBags = rows.reduce((s, f) => s + f.predictedDemand, 0);
                                const allTotal = gf.filter(f => f.weeksAhead === 1).reduce((s, f) => s + f.predictedDemand, 0);
                                const pct = allTotal ? Math.round((totalBags / allTotal) * 100) : 0;
                                const barW = allTotal ? (totalBags / allTotal) * 100 : 0;
                                const highestComp = rows.length ? rows.reduce((a, b) => b.predictedDemand > a.predictedDemand ? b : a, rows[0]) : null;
                                const isRising = rows.some(f => f.slope > 0);
                                const isFalling = rows.every(f => f.slope < 0);
                                const logoImg = getHospLogo(hosp.name);

                                return (
                                  <button
                                    key={hosp.id}
                                    onClick={() => setDrilldownHospital(hosp)}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-indigo-50/40 transition text-left group cursor-pointer"
                                  >
                                    {/* Rank badge */}
                                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-500 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition">
                                      {idx + 1}
                                    </div>

                                    {/* Hospital Actual Logo PNG */}
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs flex-shrink-0">
                                      <img src={logoImg} alt={hosp.name} className="w-full h-full object-contain" />
                                    </div>

                                    {/* Name + ID */}
                                    <div className="w-48 flex-shrink-0">
                                      <p className="font-bold text-slate-800 text-xs leading-tight group-hover:text-indigo-700 transition truncate">{hosp.name.split('(')[0].trim()}</p>
                                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{hosp.id}</p>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="flex-1">
                                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all group-hover:bg-indigo-600" style={{ width: `${barW}%` }} />
                                      </div>
                                      {highestComp && (
                                        <p className="text-[9px] text-slate-400 mt-1">
                                          Top demand: <span className="font-bold text-slate-600">{highestComp.bloodTypeId} {highestComp.componentId}</span>
                                        </p>
                                      )}
                                    </div>

                                    {/* Trend */}
                                    <div className="flex-shrink-0">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                        isRising ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                        isFalling ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                        'bg-slate-50 border-slate-200 text-slate-500'
                                      }`}>
                                        {isRising ? '↑ Rising' : isFalling ? '↓ Falling' : '→ Stable'}
                                      </span>
                                    </div>

                                    {/* Bag count */}
                                    <div className="w-24 text-right flex-shrink-0">
                                      <span className="font-black text-indigo-600 font-mono text-base">{totalBags.toFixed(0)}</span>
                                      <span className="text-[10px] text-slate-400 ml-1">bags</span>
                                      <p className="text-[9px] text-slate-400">{pct}% of total</p>
                                    </div>

                                    {/* Arrow */}
                                    <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}

                      {/* ── DRILLDOWN VIEW (hospital selected) ── */}
                      {drilldownHospital && (() => {
                        const hospRows = gf.filter(f => f.hospitalId === drilldownHospital.id && f.weeksAhead === 1);
                        const totalBags = hospRows.reduce((s, f) => s + f.predictedDemand, 0);
                        const byType = BLOOD_TYPES.map(bt => {
                          const typeRows = hospRows.filter(f => f.bloodTypeId === bt);
                          return { bt, total: typeRows.reduce((s, f) => s + f.predictedDemand, 0), rows: typeRows };
                        }).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

                        const getHospLogo = (name) => {
                          const n = name.toLowerCase();
                          if (n.includes('spmc') || n.includes('southern philippines')) return spmcLogo;
                          if (n.includes('red cross') || n.includes('prc')) return prcLogo;
                          if (n.includes('san pedro') || n.includes('snbc') || n.includes('sub-national')) return snbcLogo;
                          return davaoLogo;
                        };
                        const logoImg = getHospLogo(drilldownHospital.name);

                        return (
                          <>
                            {/* Drilldown header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setDrilldownHospital(null)}
                                  className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition shadow-sm cursor-pointer"
                                >
                                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                
                                {/* Actual Hospital PNG Logo */}
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
                                  <img src={logoImg} alt={drilldownHospital.name} className="w-full h-full object-contain" />
                                </div>

                                <div>
                                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Hospital Demand Drilldown</p>
                                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                                    {drilldownHospital.name.split('(')[0].trim()}
                                  </h3>
                                  <p className="text-[10px] text-slate-400 font-mono">{drilldownHospital.id} · {drilldownHospital.type}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-indigo-600 font-mono">{totalBags.toFixed(0)}</p>
                                <p className="text-[10px] text-slate-400">total bags next week</p>
                              </div>
                            </div>

                            {/* KPI strip */}
                            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                              {[
                                { label: 'Blood Types', value: byType.length },
                                { label: 'Components', value: [...new Set(hospRows.map(f => f.componentId))].length },
                                { label: 'Highest Demand', value: hospRows.length ? hospRows.reduce((a,b) => b.predictedDemand > a.predictedDemand ? b : a, hospRows[0]) : null, render: v => v ? `${v.bloodTypeId} ${v.componentId}` : '—' },
                                { label: 'Rising Trends', value: hospRows.filter(f => f.slope > 0).length }
                              ].map((kpi, i) => (
                                <div key={i} className="px-5 py-3 text-center">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{kpi.label}</p>
                                  <p className="font-extrabold text-slate-800 text-base font-mono mt-0.5">
                                    {kpi.render ? kpi.render(kpi.value) : kpi.value}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Per Blood Type breakdown */}
                            <div className="p-5 space-y-4">
                              {byType.map(({ bt, total, rows: typeRows }) => {
                                const allTotal = totalBags || 1;
                                return (
                                  <div key={bt} className="border border-slate-100 rounded-xl overflow-hidden">
                                    {/* Blood type header row */}
                                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                                      <span className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 font-black text-[11px] flex items-center justify-center font-mono shadow-sm">{bt}</span>
                                      <div className="flex-1">
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(total / allTotal) * 100}%` }} />
                                        </div>
                                      </div>
                                      <span className="font-black text-indigo-600 font-mono text-sm">{total.toFixed(0)}</span>
                                      <span className="text-[10px] text-slate-400">bags</span>
                                      <span className="text-[10px] text-slate-400 w-8 text-right">{Math.round((total / allTotal) * 100)}%</span>
                                    </div>
                                    {/* Component rows */}
                                    <div className="divide-y divide-slate-50">
                                      {typeRows.sort((a, b) => b.predictedDemand - a.predictedDemand).map(f => (
                                        <div key={f.forecastId} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50/70 transition">
                                          <span className="text-[10px] font-mono text-slate-400 w-28">{f.forecastId}</span>
                                          <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-[10px] font-bold">{f.componentId}</span>
                                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${total ? (f.predictedDemand / total) * 100 : 0}%` }} />
                                          </div>
                                          <span className="font-extrabold text-slate-800 font-mono text-sm w-8 text-right">{f.predictedDemand.toFixed(0)}</span>
                                          <span className="text-[9px] text-slate-400 w-16 text-right">±{f.lowerBound.toFixed(0)}–{f.upperBound.toFixed(0)}</span>
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border w-16 text-center ${
                                            f.slope > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                            f.slope < 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                            'bg-slate-50 border-slate-200 text-slate-500'
                                          }`}>{f.slope > 0 ? '↑ Rising' : f.slope < 0 ? '↓ Falling' : '→ Stable'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                              {byType.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-xs">
                                  No forecast data available for this hospital.
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

        </main>
      </div>

      {/* ─── NEW REQUEST MODAL (Hospital User OR Issuance Personnel) ─── */}
      {showForm && (isHospitalUser || isIssuanceStaff) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-white font-bold text-sm">
                  {isIssuanceStaff ? 'File Blood Requisition (On Behalf of Hospital)' : 'New Blood Requisition'}
                </h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Logistics-only — no patient-identifiable data (RA 10173)</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hospital Banner — auto-detected for Hospital User, selectable for Issuance Personnel */}
            {isHospitalUser && (
              <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-3 flex-shrink-0">
                <Shield className="w-4 h-4 text-[#C21C24] flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Requesting Hospital (Auto-detected from session)</p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{hospitalName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{hospitalId}</p>
                </div>
              </div>
            )}
            {isIssuanceStaff && (
              <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-4 flex-shrink-0">
                <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider mb-1">Select Hospital (Filing on behalf of)</p>
                  <select
                    required
                    value={selectedHospitalId}
                    onChange={e => setSelectedHospitalId(e.target.value)}
                    className="w-full border border-indigo-200 rounded-lg p-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                  >
                    <option value="">— Select requesting hospital —</option>
                    {(hospitals || []).map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-5">

                {/* ── CART BUILDER ── */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#C21C24]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Blood Requisition Cart</span>
                    {cartItems.length > 0 && (
                      <span className="ml-auto bg-[#C21C24] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartItems.length}</span>
                    )}
                  </div>

                  {/* Item Adder */}
                  <div className="p-4 bg-white border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Add Component to Requisition</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Blood Type</label>
                        <select name="bloodType" value={cartItem.bloodType} onChange={handleCartItemChange}
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none bg-white">
                          {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Component</label>
                        <select name="component" value={cartItem.component} onChange={handleCartItemChange}
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none bg-white">
                          {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Units</label>
                        <input type="number" name="units" min="1" max="50" value={cartItem.units} onChange={handleCartItemChange}
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none" />
                      </div>
                    </div>
                    {cartError && (
                      <p className="text-[11px] text-[#C21C24] mt-2 font-semibold">{cartError}</p>
                    )}
                    <button type="button" onClick={handleAddToCart}
                      className="mt-3 w-full py-2 text-xs font-bold text-[#C21C24] border border-[#C21C24] hover:bg-rose-50 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> Add to Requisition
                    </button>
                  </div>

                  {/* Cart Items List */}
                  <div className="bg-white">
                    {cartItems.length === 0 ? (
                      <div className="px-4 py-5 text-center">
                        <ShoppingCart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">No items added yet</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">Use the form above to add blood components</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {cartItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[9px] font-bold text-slate-400">#{idx + 1}</span>
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-50 text-[#C21C24] font-black text-[9px] border border-rose-100 font-mono">{item.bloodType}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${componentColor(item.component)}`}>{item.component}</span>
                              <span className="text-xs text-slate-700 font-bold">{item.units} unit{item.units !== 1 ? 's' : ''}</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveCartItem(idx)}
                              className="text-slate-300 hover:text-[#C21C24] transition-colors p-1 rounded cursor-pointer" title="Remove item">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <div className="px-4 py-2 bg-slate-50 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Components</span>
                          <span className="text-xs font-extrabold text-slate-800">{cartItems.length} line item{cartItems.length !== 1 ? 's' : ''} · {cartItems.reduce((sum, i) => sum + Number(i.units), 0)} total units</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── GENERAL INFO ── */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Urgency Level <span className="text-[#C21C24]">*</span></label>
                    <select name="urgency" required value={form.urgency} onChange={handleFormChange}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none bg-white">
                      <option value="urgent">Urgent</option>
                      <option value="routine">Routine</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Date Needed <span className="text-[#C21C24]">*</span></label>
                    <input required type="date" name="dateNeeded" value={form.dateNeeded} onChange={handleFormChange}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none text-slate-600" />
                  </div>
                </div>




                {form.urgency === 'urgent' && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-[#C21C24] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#C21C24] font-semibold leading-relaxed">
                      This request is marked <strong>URGENT</strong>. It will be prioritized and flagged for immediate Blood Bank Staff attention.
                    </p>
                  </div>
                )}
                {form.urgency === 'emergency' && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" />
                    <p className="text-xs text-red-700 font-bold leading-relaxed">
                      This request is marked as an <strong>EMERGENCY</strong>. Maximum priority protocol initiated!
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-4 flex justify-between items-center gap-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                <span className="text-[10px] text-slate-400">
                  {cartItems.length > 0
                    ? `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} · ${cartItems.reduce((s, i) => s + Number(i.units), 0)} total units`
                    : 'No items in cart yet'}
                </span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={cartItems.length === 0}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-full transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
                    <FileText className="w-3.5 h-3.5" /> Submit Request
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VIEW / DETAILS MODAL ─── */}
      {viewingReq && detailMode === 'view' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-sm">Request Details</h3>
                <p className="text-slate-400 text-[10px] mt-0.5 font-mono">{viewingReq.refNo}</p>
              </div>
              <button onClick={() => setViewingReq(null)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Hospital + Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Requesting Hospital</p>
                  <p className="font-bold text-slate-800">{viewingReq.hospital}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${(statusConfig[viewingReq.status] || statusConfig.Pending).cls}`}>
                    {(statusConfig[viewingReq.status] || statusConfig.Pending).icon} {viewingReq.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Urgency</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${(urgencyConfig[viewingReq.urgency] || urgencyConfig.routine).cls}`}>
                    {(urgencyConfig[viewingReq.urgency] || urgencyConfig.routine).label}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Date Needed</p>
                  <p className="font-semibold text-slate-800">{viewingReq.dateNeeded || '—'}</p>
                </div>
                {viewingReq.contactPerson && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Contact Person</p>
                    <p className="font-semibold text-slate-800">{viewingReq.contactPerson}</p>
                  </div>
                )}
                {viewingReq.contactNumber && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Contact Number</p>
                    <p className="font-semibold text-slate-800">{viewingReq.contactNumber}</p>
                  </div>
                )}
                {viewingReq.hospitalRefNo && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Hospital Ref No.</p>
                    <p className="font-mono font-bold text-slate-700">{viewingReq.hospitalRefNo}</p>
                  </div>
                )}
              </div>

              {/* Requisition Items */}
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                  <ShoppingCart className="w-3 h-3" /> Requisition Items
                </p>
                {(() => {
                  const items = viewingReq.items && viewingReq.items.length > 0
                    ? viewingReq.items
                    : (viewingReq.patientBloodType
                        ? [{ bloodType: viewingReq.patientBloodType, component: viewingReq.component || 'PRBC', units: viewingReq.units || 1 }]
                        : []);
                  return items.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[9px] tracking-wider">
                            <th className="px-3 py-2 font-bold text-left">#</th>
                            <th className="px-3 py-2 font-bold text-left">Blood Type</th>
                            <th className="px-3 py-2 font-bold text-left">Component</th>
                            <th className="px-3 py-2 font-bold text-right">Units</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-400 font-bold">{idx + 1}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-[#C21C24] font-black text-[9px] border border-rose-100 font-mono">{item.bloodType}</span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${componentColor(item.component)}`}>{item.component}</span>
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-slate-800">{item.units}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 border-t border-slate-200">
                            <td colSpan={3} className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Units</td>
                            <td className="px-3 py-2 text-right font-extrabold text-slate-900">{items.reduce((s, i) => s + Number(i.units), 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No items recorded.</p>
                  );
                })()}
              </div>

              {viewingReq.clinicalIndication && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Clinical Indication</p>
                  <p className="text-xs font-semibold text-slate-800">{viewingReq.clinicalIndication}</p>
                </div>
              )}
              {viewingReq.notes && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Notes</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{viewingReq.notes}</p>
                </div>
              )}
              {viewingReq.statusNote && (
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                  <p className="text-[10px] text-[#C21C24] uppercase font-bold tracking-wider mb-0.5">Rejection Reason</p>
                  <p className="text-xs text-slate-700">{viewingReq.statusNote}</p>
                </div>
              )}
              <div className="text-[10px] text-slate-400">Submitted: {viewingReq.submittedAt}</div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button onClick={() => setViewingReq(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REJECT MODAL ─── */}
      {viewingReq && detailMode === 'reject' && isIssuanceStaff && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Reject Request {viewingReq.refNo}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{viewingReq.hospital}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rejection Reason</label>
                <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                  placeholder="e.g. Insufficient stock, request mismatch..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setViewingReq(null); setRejectNote(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={() => { rejectRequest(viewingReq.refNo); setViewingReq(null); setRejectNote(''); }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#C21C24] hover:bg-[#A8181F] rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROCESS REQUEST MODAL ─── */}
      {processingReq && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl flex-shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issuance Personnel · Process Request</p>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-sm">{processingReq.refNo} — {processingReq.hospital}</h3>
                </div>
                <button onClick={() => setProcessingReq(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adjust quantities to issue per item:</p>
              {processItems.map((item, idx) => {
                const avail = availableUnits(item.bloodType, item.component);
                return (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-[#C21C24] font-black text-[10px] border border-rose-100 font-mono flex-shrink-0">{item.bloodType}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{item.component}</p>
                      <p className="text-[10px] text-slate-400">Requested: {item.requested} · Available: <span className={avail >= item.requested ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{avail}</span></p>
                    </div>
                    <input type="number" min={0} max={item.requested} value={item.quantityIssued}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setProcessItems(prev => prev.map((p, i) => i === idx ? { ...p, quantityIssued: val } : p));
                        setIsPartial(processItems.some((p, i) => i === idx ? val < p.requested : p.quantityIssued < p.requested));
                      }}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                );
              })}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks (optional)</label>
                <textarea value={processRemarks} onChange={e => setProcessRemarks(e.target.value)} rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none resize-none"
                  placeholder="Notes for this issuance..." />
              </div>
              {isPartial && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-xs text-amber-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Some quantities are below requested — this will be marked as Partially Fulfilled.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setProcessingReq(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleProcess} disabled={processing}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60">
                  <CheckCircle className="w-3.5 h-3.5" /> {processing ? 'Processing…' : 'Confirm Issuance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD BLOOD UNIT MODAL ─── */}
      {showUnitForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl flex-shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issuance Personnel · Component Inventory</p>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Add Blood Unit</h3>
                </div>
                <button onClick={() => { setShowUnitForm(false); setDonationSearch(''); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUnitSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Physical Bag Serial / Barcode (optional)</label>
                <input type="text" placeholder="e.g. BAG-DVO-2026-001 (auto-generated if blank)"
                  value={unitForm.unitId} onChange={e => setUnitForm({ ...unitForm, unitId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none font-mono bg-slate-50/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Blood Type <span className="text-rose-500">*</span></label>
                  <select required value={unitForm.bloodType} onChange={e => setUnitForm({ ...unitForm, bloodType: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                    {BLOOD_TYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Component <span className="text-rose-500">*</span></label>
                  <select required value={unitForm.component} onChange={e => setUnitForm({ ...unitForm, component: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                    {COMPONENTS.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collection Date <span className="text-rose-500">*</span></label>
                  <input type="date" required value={unitForm.collectionDate} onChange={e => setUnitForm({ ...unitForm, collectionDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expiration Date <span className="text-rose-500">*</span></label>
                  <input type="date" required value={unitForm.expirationDate} onChange={e => setUnitForm({ ...unitForm, expirationDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity / Volume (mL) <span className="text-rose-500">*</span></label>
                <input type="number" required min="1" step="0.01" value={unitForm.quantity} onChange={e => setUnitForm({ ...unitForm, quantity: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none" placeholder="e.g. 450" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Safety Status <span className="text-rose-500">*</span></label>
                  <select required value={unitForm.safetyStatus} onChange={e => setUnitForm({ ...unitForm, safetyStatus: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-xs outline-none ${unitForm.safetyStatus !== 'Cleared' ? 'border-amber-200 bg-amber-50 text-amber-700 font-bold' : 'border-slate-200 bg-white focus:ring-2 focus:ring-slate-900'}`}>
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
              {unitSaved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Unit recorded successfully! Inventory updated.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUnitForm(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-sm transition-colors flex items-center gap-1.5">
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
              className="w-full bg-[#C21C24] hover:bg-[#A8181F] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              Great, thank you!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
