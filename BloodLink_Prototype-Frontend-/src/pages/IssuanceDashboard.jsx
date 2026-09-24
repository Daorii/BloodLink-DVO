import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useBloodStore } from '../store/useBloodStore';
import {
  LogOut, Plus, Clock,
  CheckCircle, XCircle, AlertTriangle, FileText,
  Droplets, X, Activity, Database, Shield, Trash2, ShoppingCart, Eye,
  TrendingUp, Search, ChevronDown, ChevronsLeft, ChevronsRight, UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import ConfirmModal from '../components/ConfirmModal';
import spmcLogo from '../assets/bloodlinks_logo/spmc-logo.png';
import prcLogo from '../assets/bloodlinks_logo/prc-logo.png';
import snbcLogo from '../assets/bloodlinks_logo/snbc-removebg-preview.png';
import davaoLogo from '../assets/bloodlinks_logo/davao-logo.png';
import TablePagination from '../components/TablePagination';

const COMPONENTS = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const SAFETY_STATUSES = ['Cleared', 'Hold-Quarantined', 'NCU', 'NS', 'Discarded'];
const INTENDED_USES = ['Transfusable', 'Storage-Research Only', 'Restricted'];
const PAGE_SIZE = 10;

// Component specs — volume range (cc) + shelf life (days) based on DOH reference
const COMPONENT_SPECS = {
  'PRBC':                 { minCC: 230, maxCC: 330, shelfDays: 35  },
  'Platelet Concentrate': { minCC: 50,  maxCC: 70,  shelfDays: 5   },
  'FFP':                  { minCC: 150, maxCC: 250, shelfDays: 90  },
  'Cryoprecipitate':      { minCC: 15,  maxCC: 30,  shelfDays: 180 },
  'Cryosupernate':        { minCC: 190, maxCC: 210, shelfDays: 365 },
};

// Compute expiry date string (YYYY-MM-DD) from collectionDate + shelfDays
function computeExpiry(collectionDate, component) {
  const spec = COMPONENT_SPECS[component];
  if (!spec || !collectionDate) return '';
  const d = new Date(collectionDate);
  d.setDate(d.getDate() + spec.shelfDays);
  return d.toISOString().slice(0, 10);
}

const emptyUnitForm = {
  unitId: '',
  serialNumber: '',
  donationId: '',
  donorName: '',
  bloodType: 'O+',
  component: 'PRBC',
  collectionDate: new Date().toISOString().slice(0, 10),
  expirationDate: computeExpiry(new Date().toISOString().slice(0, 10), 'PRBC'),
  quantity: '',
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
    verifyBloodUnit,
    walkinIssuances,
    fetchWalkinIssuances,
    createWalkinIssuance,
    donations,
    donors,
    labTestResults,
    fetchDonationsFromAPI,
    fetchBloodInventoryFromAPI,
    isSidebarCollapsed,
    toggleSidebar,
    equityResultsMap,
    setEquityResult,
  } = useBloodStore();

  // ── Forecast filter states ──
  const [fcHospital,        setFcHospital]        = useState('ALL');
  const [fcBloodType,       setFcBloodType]       = useState('ALL');
  const [fcComponent,       setFcComponent]       = useState('ALL');
  const [fcWeeks,           setFcWeeks]           = useState(4);
  const [fcLoading,         setFcLoading]         = useState(false);
  const [chartClickedPoint, setChartClickedPoint] = useState(null);

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
    fetchDonationsFromAPI();
    fetchBloodInventoryFromAPI();
    fetchWalkinIssuances();
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
  const [showUnitForm,      setShowUnitForm]      = useState(false);
  const [unitForm,          setUnitForm]          = useState({ ...emptyUnitForm });
  const [unitSaved,         setUnitSaved]         = useState(false);
  const [donationSearch,    setDonationSearch]    = useState('');
  const [serialInput,       setSerialInput]       = useState('');
  const [serialStatus,      setSerialStatus]      = useState(null); // null | 'found' | 'not_found'
  const [volumeError,       setVolumeError]       = useState('');
  const [declineModal,      setDeclineModal]      = useState({ isOpen: false, unit: null, reason: '' });
  // Walk-in issuance state
  const [wiForm,            setWiForm]            = useState({ patientName: '', patientAge: '', patientGender: 'Male', diagnosis: '', attendingPhysician: '', purpose: 'Other', remarks: '' });
  const [wiFilter,          setWiFilter]          = useState({ bloodType: 'All', component: 'All' });
  const [wiCart,            setWiCart]            = useState([]);
  const [wiSubmitting,      setWiSubmitting]      = useState(false);
  const [wiView,            setWiView]            = useState('form'); // 'form' | 'log'
  const [wiLogPage,         setWiLogPage]         = useState(1);
  const [confirmState,      setConfirmState]      = useState({ isOpen: false, title: '', message: '', confirmText: 'Confirm', variant: 'default', onConfirm: null });
  const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false, onConfirm: null }));
  const [verifyLoading,     setVerifyLoading]     = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [componentFilter,    setComponentFilter]    = useState('All'); // 'All' | 'PRBC' | 'Platelet Concentrate' | etc.

  const [reqSubTab,       setReqSubTab]       = useState('pending');
  const [queuePage,       setQueuePage]       = useState(1);
  const [inventoryPage,   setInventoryPage]   = useState(1);
  const [requestPage,     setRequestPage]     = useState(1);

  // ── Equity-Based Distribution Reco state ─────────────────────────────
  const [distBT,      setDistBT]      = useState('O+');
  const [distComp,    setDistComp]    = useState('PRBC');
  const [distReserve, setDistReserve] = useState(10);
  // equityResultsMap lives in Zustand store — always current, no stale closures

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

  // Serial number lookup handler
  const FINALIZED_OUTCOMES = ['Accepted', 'Temporarily Deferred', 'Permanently Deferred', 'Indefinite Deferral'];

  const handleSerialLookup = (serial) => {
    setSerialInput(serial);
    if (!serial.trim()) { setSerialStatus(null); return; }

    const donation = (donations || []).find(d => d.serialNumber === serial.trim());

    if (!donation) {
      setSerialStatus('not_found');
      setUnitForm(prev => ({ ...prev, serialNumber: serial.trim(), donationId: '', donorName: '' }));
      return;
    }

    // Block if no screening outcome yet — Registry must finalize first
    const outcome = donation.screeningOutcome ?? donation.screening_outcome ?? null;
    if (!outcome || !FINALIZED_OUTCOMES.includes(outcome)) {
      setSerialStatus('pending_outcome');
      setUnitForm(prev => ({ ...prev, serialNumber: serial.trim(), donationId: '', donorName: '' }));
      return;
    }

    // Find the matching lab result for confirmed blood type
    const labResult = (labTestResults || []).find(
      lr => (lr.donationId ?? lr.donation_id) === (donation.donation_id ?? donation.donationId)
    );
    const bloodType = labResult?.bloodTypeConfirmed ?? labResult?.blood_type_confirmed ?? 'O+';
    const collDate  = donation.donationDate ?? donation.donation_date ?? '';
    const newExpiry = computeExpiry(collDate, unitForm.component);

    setUnitForm(prev => ({
      ...prev,
      serialNumber:   serial.trim(),
      donationId:     donation.donation_id ?? donation.donationId ?? '',
      donorName:      donation.donorName ?? '',
      bloodType,
      collectionDate: collDate,
      expirationDate: newExpiry,
    }));
    setSerialStatus('found');
  };

  // When component changes: recalculate expiry and clear volume error
  const handleComponentChange = (component) => {
    const newExpiry = computeExpiry(unitForm.collectionDate, component);
    setUnitForm(prev => ({ ...prev, component, expirationDate: newExpiry, quantity: '' }));
    setVolumeError('');
  };

  // Volume validation
  const validateVolume = (val, component) => {
    const spec = COMPONENT_SPECS[component];
    if (!spec) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return 'Please enter a valid number.';
    if (num < spec.minCC || num > spec.maxCC) {
      return `${component} must be between ${spec.minCC}–${spec.maxCC} cc.`;
    }
    return '';
  };

  // Inventory: commit blood unit
  const handleUnitSubmit = (e) => {
    e.preventDefault();
    const err = validateVolume(unitForm.quantity, unitForm.component);
    if (err) { setVolumeError(err); return; }
    setVolumeError('');
    recordBloodUnit(unitForm);
    setUnitSaved(true);
    setTimeout(() => {
      setUnitSaved(false);
      setUnitForm({ ...emptyUnitForm });
      setSerialInput('');
      setSerialStatus(null);
      setShowUnitForm(false);
      setDonationSearch('');
    }, 2000);
  };

  // Process modal helpers
  const availableUnits = (bloodType, component) =>
    (bloodInventory || []).filter(u => u.bloodType === bloodType && u.component === component && u.inventoryStatus === 'Available').length;

  const openProcess = (req) => {
    setProcessingReq(req);
    // Read equityResultsMap directly from Zustand store (always current)
    const latestMap = useBloodStore.getState().equityResultsMap;
    setProcessItems((req.items || []).map(i => {
      const bt   = i.bloodType ?? i.blood_type ?? '';
      const comp = i.component ?? i.bloodComponent ?? '';
      const key  = `${bt}|${comp}`;
      const computed  = latestMap[key];
      const hospId    = req.hospitalId ?? req.hospital_id ?? '';
      const equityRow = computed?.results?.find(r => r.hospitalId === hospId);
      const prefill   = equityRow ? Math.min(equityRow.allocation, i.units) : i.units;
      return {
        bloodType:      bt,
        component:      comp,
        requested:      i.units,
        quantityIssued: prefill,
        equityRec:      equityRow?.allocation ?? null,
        equityComputed: !!computed,
      };
    }));
    setProcessRemarks('');
    setIsPartial(false);
  };

  const handleProcess = async () => {
    if (!processingReq) return;
    // Block if any NON-ZERO item exceeds available inventory
    const stockError = processItems.find(i => i.quantityIssued > 0 && i.quantityIssued > availableUnits(i.bloodType, i.component));
    if (stockError) {
      alert(`Insufficient stock: Only ${availableUnits(stockError.bloodType, stockError.component)} unit(s) of ${stockError.bloodType} ${stockError.component} available.`);
      return;
    }
    // At least one item must be issued
    if (processItems.every(i => i.quantityIssued <= 0)) {
      alert('Please enter a quantity greater than 0 for at least one item.');
      return;
    }
    setProcessing(true);
    const result = await processBloodRequest({
      requestId: processingReq.requestId,
      // Only send items that are actually being issued (quantity > 0)
      items: processItems.filter(i => i.quantityIssued > 0).map(i => ({ bloodType: i.bloodType, component: i.component, quantityIssued: i.quantityIssued })),
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
      message: `Blood Request ${refNo} has been successfully verified and is ready for physical preparation.`
    });
  };

  const handleApproveRelease = async (req) => {
    // Look up the matching issuance record from bloodIssuances by requestId
    const issuance = (bloodIssuances || []).find(i => i.requestId === req.requestId);
    if (!issuance) {
      alert('No issuance record was found for this request. It may not have been prepared yet.');
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
  const pendingVerifUnits = (bloodInventory || []).filter(u => u.inventoryStatus === 'Pending Verification');
  const pendingVerifCount = pendingVerifUnits.length;
  const readyForReleaseCount = myRequests.filter(r => r.status === 'Ready for Release' || r.status === 'Partially Fulfilled').length;
  const releasedCount     = myRequests.filter(r => r.status === 'Released').length;
  const getInv = (type) => inventory.find(i => i.type === type);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCartItemChange = (e) => {
    const { name, value } = e.target;
    setCartItem(ci => ({ ...ci, [name]: name === 'units' ? value.replace(/\D/g, '').slice(0, 2) : value }));
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
    if (!form.dateNeeded || new Date(`${form.dateNeeded}T00:00:00`) < new Date(new Date().toDateString())) {
      setCartError('Select a date needed that is today or later.');
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
    let refNo;
    try {
      refNo = await addBloodRequest({
        ...form,
        hospital: submittingHospitalName,
        hospitalId: submittingHospitalId,
        items: cartItems,
        filedByIssuance: isIssuanceStaff,
        filedBy: authSystemUser?.name || 'Issuance Personnel',
      });
    } catch (error) {
      setCartError(error?.data?.message || error?.message || 'The request could not be submitted. Please correct the information and try again.');
      return;
    }
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
        ? `Blood Requisition ${refNo} has been successfully filed on behalf of ${submittingHospitalName} and is marked as Verified (ready for preparation).`
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
              <button onClick={() => setActiveTab('stock_verification')}
                    className={`w-full text-left nav-link ${activeTab === 'stock_verification' ? 'active' : ''}`}
                    title={isSidebarCollapsed ? 'Stock Verification' : ""}>
                    <CheckCircle className="nav-icon" />
                    <span className="sidebar-copy">Stock Verification</span>
                    {pendingVerifCount > 0 && (
                      <span className="nav-badge ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{pendingVerifCount}</span>
                    )}
                  </button>
              <button onClick={() => setActiveTab('walkin')}
                    className={`w-full text-left nav-link ${activeTab === 'walkin' ? 'active' : ''}`}
                    title={isSidebarCollapsed ? 'Walk-in Issuance' : ""}>
                    <UserPlus className="nav-icon" />
                    <span className="sidebar-copy">Walk-in Issuance</span>
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

        <header className="portal-topbar sticky top-0 z-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
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

          {(activeTab === 'queue' || activeTab === 'requests') && (
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
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Prepared for release — approve release</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Released</p>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">{releasedCount}</p>
              <p className="text-[10px] text-slate-450 mt-1 font-semibold">Fulfilled & physically released</p>
            </div>
          </div>
          )}

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
                    {filteredQueue.slice((queuePage - 1) * PAGE_SIZE, queuePage * PAGE_SIZE).map(req => {
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
                                <button onClick={() => setConfirmState({
                                   isOpen: true,
                                   title: 'Process Blood Request?',
                                   message: `Prepare units for request ${req.refNo} from ${req.hospitalName || req.hospital || 'hospital'}?`,
                                   confirmText: 'Process Request',
                                   variant: 'default',
                                   onConfirm: () => { closeConfirm(); openProcess(req); },
                                 })}
                                  className="text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition-colors font-bold flex items-center gap-0.5" title="Process Request">
                                  <Database className="w-4 h-4 text-slate-700" /> <span className="text-[10px]">Process</span>
                                </button>
                              )}
                              {/* Approve Release — once units are prepared */}
                              {isIssuanceStaff && (req.status === 'Ready for Release' || req.status === 'Partially Fulfilled') && (
                                <button onClick={() => setConfirmState({
                                   isOpen: true,
                                   title: 'Approve Blood Release?',
                                   message: `Release blood units for request ${req.refNo}? This will move units out of inventory.`,
                                   confirmText: 'Approve Release',
                                   variant: 'warning',
                                   onConfirm: () => { closeConfirm(); handleApproveRelease(req); },
                                 })}
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
              <TablePagination total={filteredQueue.length} page={queuePage} pageSize={PAGE_SIZE} onPageChange={setQueuePage} label="requests" />
            </div>
          )}


          {isIssuanceStaff && activeTab === 'walkin' && (() => {
            const BLOOD_TYPES  = ['All','O+','O-','A+','A-','B+','B-','AB+','AB-'];
            const COMPONENTS   = ['All','PRBC','Platelet Concentrate','FFP','Cryoprecipitate','Cryosupernate'];
            const PURPOSES     = ['Surgery','Emergency','Elective','Other'];

            const availableUnits = (bloodInventory || []).filter(u =>
              u.inventoryStatus === 'Available' &&
              (wiFilter.bloodType === 'All' || u.bloodType === wiFilter.bloodType) &&
              (wiFilter.component === 'All' || u.component === wiFilter.component)
            );
            const cartIds = wiCart.map(u => u.unit_id);

            const handleAddToWiCart = (unit) => {
              if (!cartIds.includes(unit.unit_id)) setWiCart(prev => [...prev, unit]);
            };
            const handleRemoveWiCart = (uid) => setWiCart(prev => prev.filter(u => u.unit_id !== uid));

            const handleWiSubmit = async () => {
              if (!wiForm.patientName.trim()) return alert('Patient name is required.');
              if (wiCart.length === 0) return alert('Add at least one blood unit to the cart.');
              setWiSubmitting(true);
              try {
                await createWalkinIssuance({
                  patientName:        wiForm.patientName.trim(),
                  patientAge:         wiForm.patientAge ? Number(wiForm.patientAge) : null,
                  patientGender:      wiForm.patientGender || null,
                  diagnosis:          wiForm.diagnosis.trim() || null,
                  attendingPhysician: wiForm.attendingPhysician.trim() || null,
                  purpose:            wiForm.purpose,
                  remarks:            wiForm.remarks.trim() || null,
                  unitIds:            wiCart.map(u => u.unit_id),
                });
                // Reset
                setWiForm({ patientName: '', patientAge: '', patientGender: 'Male', diagnosis: '', attendingPhysician: '', purpose: 'Other', remarks: '' });
                setWiCart([]);
                setWiFilter({ bloodType: 'All', component: 'All' });
                setWiView('log');
              } catch (err) {
                alert(err?.message || 'Failed to submit. Please try again.');
              } finally { setWiSubmitting(false); }
            };

            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header + view toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Walk-in / Direct Issuance</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Issue blood directly to walk-in patients. Units are deducted from inventory immediately.</p>
                  </div>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-semibold">
                    <button onClick={() => setWiView('form')} className={`px-3 py-1.5 transition-colors ${wiView === 'form' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>New Issuance</button>
                    <button onClick={() => setWiView('log')} className={`px-3 py-1.5 transition-colors ${wiView === 'log' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Issuance Log</button>
                  </div>
                </div>

                {wiView === 'form' ? (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                    {/* ── Patient Info Form ── */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Information</h4>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Patient Name <span className="text-red-500">*</span></label>
                        <input type="text" placeholder="Full name" value={wiForm.patientName}
                          onChange={e => setWiForm(f => ({ ...f, patientName: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Age</label>
                          <input type="number" min="0" max="130" placeholder="e.g. 34" value={wiForm.patientAge}
                            onChange={e => setWiForm(f => ({ ...f, patientAge: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                          <select value={wiForm.patientGender} onChange={e => setWiForm(f => ({ ...f, patientGender: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                            <option>Male</option><option>Female</option><option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Diagnosis / Condition</label>
                        <input type="text" placeholder="e.g. Dengue hemorrhagic fever" value={wiForm.diagnosis}
                          onChange={e => setWiForm(f => ({ ...f, diagnosis: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Attending Physician</label>
                        <input type="text" placeholder="Dr. Last Name" value={wiForm.attendingPhysician}
                          onChange={e => setWiForm(f => ({ ...f, attendingPhysician: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Purpose</label>
                        <select value={wiForm.purpose} onChange={e => setWiForm(f => ({ ...f, purpose: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                          {PURPOSES.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks</label>
                        <textarea rows={2} placeholder="Optional notes..." value={wiForm.remarks}
                          onChange={e => setWiForm(f => ({ ...f, remarks: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-400" />
                      </div>
                    </div>

                    {/* ── Available Units Picker ── */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Units from Inventory</h4>
                      <div className="flex gap-2">
                        <select value={wiFilter.bloodType} onChange={e => setWiFilter(f => ({ ...f, bloodType: e.target.value }))}
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400">
                          {BLOOD_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                        </select>
                        <select value={wiFilter.component} onChange={e => setWiFilter(f => ({ ...f, component: e.target.value }))}
                          className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400">
                          {COMPONENTS.map(comp => <option key={comp}>{comp}</option>)}
                        </select>
                      </div>
                      <div className="flex-1 overflow-auto max-h-80">
                        {availableUnits.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                            <Database className="w-8 h-8" />
                            <p className="text-xs">No available units match this filter</p>
                          </div>
                        ) : (
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="text-left px-3 py-2 font-semibold text-slate-500">Unit ID</th>
                                <th className="text-left px-3 py-2 font-semibold text-slate-500">Type</th>
                                <th className="text-left px-3 py-2 font-semibold text-slate-500">Component</th>
                                <th className="text-left px-3 py-2 font-semibold text-slate-500">Vol.</th>
                                <th className="text-left px-3 py-2 font-semibold text-slate-500">Expires</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {availableUnits.map(unit => {
                                const inCart = cartIds.includes(unit.unit_id);
                                return (
                                  <tr key={unit.unit_id} className={`transition-colors ${inCart ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                                    <td className="px-3 py-2 font-mono text-slate-700">{unit.unitId}</td>
                                    <td className="px-3 py-2">
                                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">{unit.bloodType}</span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-600">{unit.component}</td>
                                    <td className="px-3 py-2 text-slate-500">{unit.volumeCC} mL</td>
                                    <td className="px-3 py-2 text-slate-500">{unit.expirationDate}</td>
                                    <td className="px-3 py-2">
                                      <button onClick={() => handleAddToWiCart(unit)} disabled={inCart}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${inCart ? 'bg-green-100 text-green-600 cursor-default' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                                        {inCart ? 'Added' : 'Add'}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{availableUnits.length} unit(s) available with current filter</p>
                    </div>

                    {/* ── Cart + Submit ── */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Selected Units ({wiCart.length})</h4>
                      <div className="flex-1 overflow-auto max-h-64">
                        {wiCart.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                            <p className="text-xs">No units added yet.</p>
                            <p className="text-[10px]">Click "Add" on a unit from the table.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {wiCart.map(unit => (
                              <div key={unit.unit_id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                <div>
                                  <p className="text-xs font-mono font-bold text-slate-800">{unit.unitId}</p>
                                  <p className="text-[10px] text-slate-500">{unit.component} · {unit.bloodType} · {unit.volumeCC} mL</p>
                                </div>
                                <button onClick={() => setConfirmState({
                                  isOpen: true, title: 'Remove Unit?',
                                  message: `Remove ${unit.unitId} from cart?`,
                                  confirmText: 'Remove', variant: 'danger',
                                  onConfirm: () => { closeConfirm(); handleRemoveWiCart(unit.unit_id); },
                                })} className="text-slate-400 hover:text-red-600 transition-colors">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="border-t border-slate-100 pt-4 mt-auto">
                        <button
                          onClick={() => {
                            if (!wiForm.patientName.trim()) return alert('Patient name is required.');
                            if (wiCart.length === 0) return alert('Add at least one blood unit to the cart.');
                            setConfirmState({
                              isOpen: true,
                              title: 'Issue Blood to Walk-in Patient?',
                              message: `Issue ${wiCart.length} unit(s) to ${wiForm.patientName}? This will permanently deduct them from inventory.`,
                              confirmText: 'Issue Blood',
                              variant: 'warning',
                              onConfirm: () => { closeConfirm(); handleWiSubmit(); },
                            });
                          }}
                          disabled={wiSubmitting || wiCart.length === 0}
                          className="w-full py-2.5 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-40 shadow-sm"
                        >
                          {wiSubmitting ? 'Processing…' : `Issue ${wiCart.length} Unit${wiCart.length !== 1 ? 's' : ''}`}
                        </button>
                        <p className="text-[10px] text-slate-400 text-center mt-2">All selected units will be marked as Issued</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Walk-in Log ── */
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      {(walkinIssuances || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                          <UserPlus className="w-10 h-10" />
                          <p className="text-sm font-medium">No walk-in issuances recorded yet</p>
                        </div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Patient</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Age/Gender</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Purpose</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Diagnosis</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Units</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Issued By</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(walkinIssuances || [])
                              .slice((wiLogPage - 1) * PAGE_SIZE, wiLogPage * PAGE_SIZE)
                              .map(rec => (
                              <tr key={rec.walkinIssuanceId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-800">{rec.patientName}</td>
                                <td className="px-4 py-3 text-slate-500">{rec.patientAge ? `${rec.patientAge}y` : '—'} / {rec.patientGender || '—'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    rec.purpose === 'Emergency' ? 'bg-red-50 text-red-700 border-red-200' :
                                    rec.purpose === 'Surgery'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    rec.purpose === 'Elective'  ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                    'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}>{rec.purpose}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">{rec.diagnosis || '—'}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {(rec.units || []).map((u, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">{u.unitId || u.unit_id}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500">{rec.issuedBy}</td>
                                <td className="px-4 py-3 text-slate-500">{rec.issuanceDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    {(walkinIssuances || []).length > PAGE_SIZE && (
                      <TablePagination
                        total={(walkinIssuances || []).length}
                        page={wiLogPage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setWiLogPage}
                        label="walk-in issuances"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {isIssuanceStaff && activeTab === 'stock_verification' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Stock Verification</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Review blood components submitted by Production staff. Accept to add to inventory or decline with a reason.</p>
                </div>
              </div>

              {pendingVerifUnits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                  <p className="text-sm font-medium">No units pending verification</p>
                  <p className="text-xs">All submitted components have been reviewed.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Unit ID</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Serial No.</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Blood Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Component</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Volume (mL)</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Collected</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Expires</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Safety</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingVerifUnits.map(unit => (
                        <tr key={unit.unit_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-slate-700">{unit.unitId}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{unit.serialNumber || <span className="text-slate-400 italic">No S/N</span>}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{unit.bloodType}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700">{unit.component}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{unit.volumeCC} mL</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{unit.collectionDate}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{unit.expirationDate}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              unit.safetyStatus === 'Cleared' ? 'bg-green-100 text-green-700' :
                              unit.safetyStatus === 'NCU' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{unit.safetyStatus}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setConfirmState({
                                isOpen: true,
                                title: 'Accept Blood Unit?',
                                message: `Accept ${unit.component} (${unit.bloodType}) unit ${unit.unitId} into available inventory?`,
                                confirmText: 'Accept Unit',
                                variant: 'default',
                                onConfirm: async () => { closeConfirm(); setVerifyLoading(true); try { await verifyBloodUnit(unit.unit_id, 'accept'); } finally { setVerifyLoading(false); } },
                              })}
                                disabled={verifyLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" /> Accept
                              </button>
                              <button
                                onClick={() => setDeclineModal({ isOpen: true, unit, reason: '' })}
                                disabled={verifyLoading}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" /> Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Decline reason modal */}
          {declineModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Decline Blood Unit</h3>
                <p className="text-xs text-slate-500">
                  Unit <span className="font-semibold text-slate-700">{declineModal.unit?.unitId}</span> — {declineModal.unit?.component} ({declineModal.unit?.bloodType})
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for declining <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    placeholder="e.g. Volume out of range, incorrect labeling, damaged bag..."
                    value={declineModal.reason}
                    onChange={e => setDeclineModal(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setDeclineModal({ isOpen: false, unit: null, reason: '' })}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >Cancel</button>
                  <button
                    disabled={!declineModal.reason.trim() || verifyLoading}
                    onClick={async () => {
                      setVerifyLoading(true);
                      try {
                        await verifyBloodUnit(declineModal.unit.unit_id, 'decline', declineModal.reason.trim());
                        setDeclineModal({ isOpen: false, unit: null, reason: '' });
                      } finally { setVerifyLoading(false); }
                    }}
                    className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-40"
                  >Confirm Decline</button>
                </div>
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
              </div>

              {/* Stock summary table — each cell clickable to filter registry */}
              {(() => {
                const BLOOD_TYPE_ORDER = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
                // Safe: ≥50 (O-: ≥100) | Low: ≥emergency reserve but <safe | Critical: <emergency reserve
                const SAFE_THRESHOLD     = { 'O+': 50, 'O-': 100, 'A+': 50, 'A-': 50, 'B+': 50, 'B-': 50, 'AB+': 50, 'AB-': 50 };
                const EMERGENCY_RESERVED = { 'O+': 10, 'O-': 10,  'A+': 10, 'A-': 10, 'B+': 10, 'B-': 10, 'AB+': 5,  'AB-': 5  };
                const COMPONENT_KEY = { 'PRBC': 'units', 'Platelet Concentrate': 'platelets', 'FFP': 'ffp', 'Cryoprecipitate': 'cryo', 'Cryosupernate': 'cryosup' };
                const COMP_COLS = [
                  { label: 'PRBC (Units)',    key: 'units',     comp: 'PRBC' },
                  { label: 'Platelets',       key: 'platelets', comp: 'Platelet Concentrate' },
                  { label: 'FFP',             key: 'ffp',       comp: 'FFP' },
                  { label: 'Cryoprecipitate', key: 'cryo',      comp: 'Cryoprecipitate' },
                  { label: 'Cryosupernate',   key: 'cryosup',   comp: 'Cryosupernate' },
                ];

                const stockMap = {};
                BLOOD_TYPE_ORDER.forEach(bt => { stockMap[bt] = { units: 0, platelets: 0, ffp: 0, cryo: 0, cryosup: 0 }; });
                (bloodInventory || []).filter(u => u.inventoryStatus === 'Available').forEach(u => {
                  const bt = u.bloodType ?? u.bloodTypeId;
                  const comp = u.component ?? u.componentId;
                  const key = COMPONENT_KEY[comp];
                  if (stockMap[bt] && key) stockMap[bt][key] += 1;
                });

                const computedRows = BLOOD_TYPE_ORDER.map(bt => {
                  const s = stockMap[bt];
                  const safe      = SAFE_THRESHOLD[bt]     ?? 50;
                  const emergency = EMERGENCY_RESERVED[bt] ?? 10;
                  // Default: total across ALL components for this blood type (overall view)
                  // When a component cell is clicked: narrow to just that component
                  const count = componentFilter !== 'All'
                    ? (s[COMPONENT_KEY[componentFilter]] ?? 0)
                    : (s.units + s.platelets + s.ffp + s.cryo + s.cryosup);
                  const status = count >= safe ? 'safe' : count >= emergency ? 'low' : 'critical';
                  return { type: bt, ...s, safe, emergency, status };
                });

                const handleCellClick = (bt, comp) => {
                  const isSameCell = selectedTypeFilter === bt && componentFilter === comp;
                  if (isSameCell) {
                    setSelectedTypeFilter('All'); setComponentFilter('All');
                  } else {
                    setSelectedTypeFilter(bt); setComponentFilter(comp);
                  }
                };

                return (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                            <th className="px-6 py-3 font-bold">Blood Type</th>
                            {COMP_COLS.map(c => (
                              <th key={c.comp} className="px-6 py-3 font-bold text-center border-l border-slate-100">{c.label}</th>
                            ))}
                            <th className="px-6 py-3 font-bold text-center border-l border-slate-100">
                              {componentFilter !== 'All' ? `${componentFilter} Status` : 'Overall Status'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {computedRows.map((item) => (
                            <tr key={item.type} className="hover:bg-slate-50/30 transition-all">
                              {/* Blood Type badge — non-clickable */}
                              <td className="px-6 py-3.5">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold border text-[10px] font-mono bg-slate-100 text-slate-700 border-slate-200">
                                  {item.type}
                                </span>
                              </td>
                              {/* Component cells — each individually clickable */}
                              {COMP_COLS.map(c => {
                                const isActive = selectedTypeFilter === item.type && componentFilter === c.comp;
                                return (
                                  <td key={c.comp}
                                    onClick={() => handleCellClick(item.type, c.comp)}
                                    title={`Click to filter registry: ${item.type} · ${c.comp}`}
                                    className={`px-6 py-3.5 text-center border-l border-slate-100 font-bold text-sm cursor-pointer select-none rounded transition-all ${
                                      isActive
                                        ? 'bg-[#C21C24] text-white shadow-inner'
                                        : 'hover:bg-rose-50 hover:text-[#C21C24] text-slate-700'
                                    }`}>
                                    {item[c.key]}
                                    {isActive && <span className="block text-[8px] font-normal opacity-80 mt-0.5">▼ filtering</span>}
                                  </td>
                                );
                              })}
                              {/* Status badge — non-clickable */}
                              <td className="px-6 py-3.5 text-center border-l border-slate-100">
                                {item.status === 'safe' && (
                                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Safe
                                  </span>
                                )}
                                {item.status === 'low' && (
                                  <span className="bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> Low
                                  </span>
                                )}
                                {item.status === 'critical' && (
                                  <span className="bg-rose-50 border border-rose-100 text-[#C21C24] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Critical
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(selectedTypeFilter !== 'All' || componentFilter !== 'All') && (
                      <div className="px-6 py-2 bg-rose-50 border-t border-rose-100 flex items-center gap-2 text-[11px] text-rose-700 font-semibold">
                        <span>Filtering registry by:</span>
                        {selectedTypeFilter !== 'All' && <span className="bg-white border border-rose-200 px-2 py-0.5 rounded font-mono font-bold">{selectedTypeFilter}</span>}
                        {componentFilter !== 'All' && <span className="bg-white border border-rose-200 px-2 py-0.5 rounded font-bold">{componentFilter}</span>}
                        <button onClick={() => { setSelectedTypeFilter('All'); setComponentFilter('All'); }}
                          className="ml-auto text-rose-500 hover:text-rose-800 font-extrabold cursor-pointer">✕ Clear filter</button>
                      </div>
                    )}
                  </div>
                );
              })()}


              {/* Physical Blood Bag Registry */}
              {(() => {
                const filteredInventory = (bloodInventory || []).filter(unit => {
                  const bt   = unit.bloodType ?? unit.bloodTypeId;
                  const comp = unit.component ?? unit.componentId;
                  const btMatch     = selectedTypeFilter === 'All' || bt === selectedTypeFilter;
                  const compMatch   = componentFilter    === 'All' || comp === componentFilter;
                  // Only show Available units — Issued/Expired units are no longer in usable stock
                  const statusMatch = unit.inventoryStatus === 'Available';
                  return btMatch && compMatch && statusMatch;
                });
                const pagedInventory = filteredInventory.slice((inventoryPage - 1) * PAGE_SIZE, inventoryPage * PAGE_SIZE);
                return (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                          <Database className="w-4 h-4 text-indigo-600" /> Physical Blood Bag Registry
                        </h3>
                        {(selectedTypeFilter !== 'All' || componentFilter !== 'All') && (
                          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            {selectedTypeFilter !== 'All' && <span className="font-mono">{selectedTypeFilter}</span>}
                            {selectedTypeFilter !== 'All' && componentFilter !== 'All' && <span>·</span>}
                            {componentFilter !== 'All' && <span>{componentFilter}</span>}
                            <button onClick={() => { setSelectedTypeFilter('All'); setComponentFilter('All'); }} className="hover:text-rose-900 font-extrabold ml-1 cursor-pointer" title="Clear filter">✕</button>
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
                            <th className="px-5 py-3 font-bold">Serial No.</th>
                            <th className="px-5 py-3 font-bold text-center">Type</th>
                            <th className="px-5 py-3 font-bold">Component</th>
                            <th className="px-5 py-3 font-bold text-center">Collected</th>
                            <th className="px-5 py-3 font-bold text-center">Expiry</th>
                            <th className="px-5 py-3 font-bold text-center">Volume (CC)</th>
                            <th className="px-5 py-3 font-bold text-center">Safety</th>
                            <th className="px-5 py-3 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-normal">
                          {pagedInventory.map(unit => (
                            <tr key={unit.unitId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3 font-mono font-bold text-slate-900">
                                <span className="bg-indigo-50 text-indigo-950 border border-indigo-100 px-2 py-0.5 rounded text-[11px] font-mono">{unit.unitId}</span>
                              </td>
                              <td className="px-5 py-3 font-mono text-indigo-700 text-[11px] font-bold">
                                {unit.serialNumber || <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-[#C21C24] font-black rounded text-[10px] font-mono">{unit.bloodType ?? unit.bloodTypeId}</span>
                              </td>
                              <td className="px-5 py-3 font-bold text-slate-700">{unit.component ?? unit.componentId}</td>
                              <td className="px-5 py-3 text-center font-mono text-[10px]">{unit.collectionDate || '—'}</td>
                              <td className="px-5 py-3 text-center font-mono text-[10px]">
                                {(() => {
                                  const days = unit.expirationDate ? Math.ceil((new Date(unit.expirationDate) - new Date()) / 86400000) : null;
                                  const urgent = days !== null && days >= 0 && days <= 7;
                                  const expired = days !== null && days < 0;
                                  return (
                                    <span className={urgent ? 'text-amber-600 font-bold' : expired ? 'text-rose-600 font-bold' : ''}>
                                      {unit.expirationDate}
                                      {urgent && <span className="block text-[9px] text-amber-500">⚠ {days}d left</span>}
                                      {expired && <span className="block text-[9px] text-rose-500">Expired</span>}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-5 py-3 text-center font-bold text-slate-800">{unit.quantity} cc</td>
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
                    <TablePagination total={filteredInventory.length} page={inventoryPage} pageSize={PAGE_SIZE} onPageChange={setInventoryPage} label="bags" />
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
            const activeRequests = reqSubTab === 'pending' ? verifiedReqs : reqSubTab === 'ready' ? readyReqs : historyReqs;
            const pagedRequests = activeRequests.slice((requestPage - 1) * PAGE_SIZE, requestPage * PAGE_SIZE);
            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Sub-tab bar */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                  {[
                    { key: 'pending', label: `To Process (${verifiedReqs.length})` },
                    { key: 'ready',   label: `Ready for Release (${readyReqs.length})` },
                    { key: 'history', label: 'History' },
                  ].map(t => (
                    <button key={t.key} onClick={() => { setReqSubTab(t.key); setRequestPage(1); }}
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
                          {pagedRequests.map(req => (
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
                                  <button onClick={() => setConfirmState({
                                   isOpen: true,
                                   title: 'Process Blood Request?',
                                   message: `Process request ${req.refNo} from ${req.hospitalName || req.hospital || 'hospital'}?`,
                                   confirmText: 'Process Request',
                                   variant: 'default',
                                   onConfirm: () => { closeConfirm(); openProcess(req); },
                                 })}
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
                    <TablePagination total={verifiedReqs.length} page={requestPage} pageSize={PAGE_SIZE} onPageChange={setRequestPage} label="requests" />
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
                          {pagedRequests.map(req => (
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
                                <button onClick={() => setConfirmState({
                                   isOpen: true,
                                   title: 'Approve Blood Release?',
                                   message: `Release blood units for request ${req.refNo}? This will move units out of inventory.`,
                                   confirmText: 'Approve Release',
                                   variant: 'warning',
                                   onConfirm: () => { closeConfirm(); handleApproveRelease(req); },
                                 })}
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
                    <TablePagination total={readyReqs.length} page={requestPage} pageSize={PAGE_SIZE} onPageChange={setRequestPage} label="requests" />
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
                        {pagedRequests.map(req => (
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
                    <TablePagination total={historyReqs.length} page={requestPage} pageSize={PAGE_SIZE} onPageChange={setRequestPage} label="requests" />
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
                            No issuance records yet. Records appear here once a request is prepared for release.
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
          {isIssuanceStaff && activeTab === 'distribution' && (() => {
            const BLOOD_TYPES_LIST = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
            const COMPONENTS_LIST  = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];

            // Active blood requests — verified but NOT yet fully fulfilled
            // Include 'Partially Fulfilled' so remaining unmet components still show
            const activeReqs = (bloodRequests || []).filter(r =>
              ['Verified', 'Pending Review', 'Approved', 'Partially Fulfilled'].includes(r.status)
            );

            // Urgency multipliers for equity-weighted allocation
            const URGENCY_MULTIPLIER = { 'Emergency': 1.5, 'Urgent': 1.25, 'Routine': 1.0 };

            const handleComputeEquity = () => {
              // Ensure forecast exists — generate if empty
              if (!granularForecasts || granularForecasts.length === 0) {
                generateGranularForecast(4);
              }
              const gf = granularForecasts || [];

              // Filter to selected BT + Component, nearest week (weeksAhead === 1)
              const nearest = gf.filter(f =>
                f.bloodTypeId === distBT &&
                f.componentId === distComp &&
                f.weeksAhead  === 1
              );

              // Count available bags from real inventory
              const totalInventory = (bloodInventory || []).filter(u =>
                (u.bloodType ?? u.bloodTypeId) === distBT &&
                (u.component ?? u.componentId) === distComp &&
                u.inventoryStatus === 'Available'
              ).length;

              const reserve   = Math.min(Number(distReserve) || 0, totalInventory);
              const available = Math.max(0, totalInventory - reserve);

              // Build per-hospital forecast map
              const forecastMap = {};
              nearest.forEach(f => {
                forecastMap[f.hospitalId] = {
                  hospitalId:   f.hospitalId,
                  hospitalName: f.hospitalName,
                  predicted:    f.predictedDemand,
                };
              });

              const itemMatcher = it => {
                const bt   = it.bloodType  ?? it.blood_type   ?? '';
                const comp = it.component  ?? it.bloodComponent ?? '';
                return bt === distBT && comp === distComp;
              };

              // For hospitals with no forecast entry, default to 0
              const allHospitals = hospitals || [];

              // Determine highest urgency level per hospital (from active requests)
              const hospitalUrgencyMap = {};
              activeReqs.forEach(req => {
                const reqHospId = req.hospitalId ?? req.hospital_id ?? '';
                if ((req.items || []).some(itemMatcher)) {
                  const lvl = req.urgencyLevel ?? req.urgency_level ?? 'Routine';
                  const prev = hospitalUrgencyMap[reqHospId];
                  // Keep highest urgency: Emergency > Urgent > Routine
                  if (!prev ||
                      (lvl === 'Emergency') ||
                      (lvl === 'Urgent' && prev === 'Routine')) {
                    hospitalUrgencyMap[reqHospId] = lvl;
                  }
                }
              });

              const rows = allHospitals.map(h => ({
                hospitalId:   h.id,
                hospitalName: h.name,
                hospitalType: h.type,
                predicted:    forecastMap[h.id]?.predicted ?? 0,
                urgencyLevel: hospitalUrgencyMap[h.id] ?? null,
              }));

              // Step 1: compute adjusted weights (forecast × urgency multiplier)
              const rowsWithAdj = rows.map(r => {
                const multiplier = r.urgencyLevel ? (URGENCY_MULTIPLIER[r.urgencyLevel] ?? 1.0) : 1.0;
                const adjusted   = r.predicted * multiplier;
                return { ...r, multiplier, adjusted };
              });

              const totalForecast = rows.reduce((s, r) => s + r.predicted, 0);
              const totalAdjusted = rowsWithAdj.reduce((s, r) => s + r.adjusted, 0);

              // Compute equity allocation using adjusted weights
              const results = rowsWithAdj.map(r => {
                const weight     = totalAdjusted > 0 ? r.adjusted / totalAdjusted : 1 / rows.length;
                const allocation = Math.round(weight * available);

                const matchingReqs = activeReqs.filter(req => {
                  const reqHospId = req.hospitalId ?? req.hospital_id ?? '';
                  return reqHospId === r.hospitalId && (req.items || []).some(itemMatcher);
                });

                const hasRequest = matchingReqs.length > 0;
                const reqUnits = matchingReqs.reduce((sum, req) => {
                  const item = (req.items || []).find(itemMatcher);
                  return sum + (item?.units ?? 0);
                }, 0);

                return {
                  ...r,
                  weight:      +(weight * 100).toFixed(1),
                  allocation,
                  hasRequest,
                  reqUnits,
                  canFulfill:  allocation >= reqUnits && reqUnits > 0 ? 'full'
                              : allocation > 0 && reqUnits > 0 ? 'partial'
                              : reqUnits === 0 ? 'no-req'
                              : 'none',
                };
              });

              const key = `${distBT}|${distComp}`;
              const computedAt = new Date().toLocaleString('en-PH', {
                dateStyle: 'medium', timeStyle: 'short'
              });
              setEquityResult(key, results, {
                totalInventory, reserve, available,
                totalForecast, totalAdjusted, computedAt,
              });
            };

            // Derive display state from the Zustand store for the currently selected BT+Comp
            const currentKey   = `${distBT}|${distComp}`;
            const currentEntry = equityResultsMap[currentKey];
            const distComputed = !!currentEntry;
            const distResults  = currentEntry?.results ?? [];
            const distMeta     = currentEntry?.meta    ?? null;

            return (
              <div className="space-y-5 animate-in fade-in duration-200">

                {/* Info banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-bold text-sm mb-1">Equity-Based Blood Distribution Allocation</p>
                    <p className="text-blue-700 leading-relaxed">
                      Allocations are computed proportionally using the Multiple Linear Regression forecasted demand per hospital.
                      A predefined emergency reserve is set aside first, then the remaining units are distributed based on each hospital's share of total predicted demand.
                      This output is a <strong>decision-support recommendation only</strong> — final allocation is at the discretion of authorized SNBC-Mindanao personnel.
                    </p>
                  </div>
                </div>

                {/* Configuration Panel */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-500" /> Allocation Parameters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Blood Type</label>
                      <select value={distBT} onChange={e => setDistBT(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50">
                        {BLOOD_TYPES_LIST.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Blood Component</label>
                      <select value={distComp} onChange={e => setDistComp(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50">
                        {COMPONENTS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Emergency Reserve (units)</label>
                      <input type="number" min={0} value={distReserve}
                        onChange={e => setDistReserve(Math.max(0, Number(e.target.value)))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50" />
                      <p className="text-[10px] text-slate-400 mt-1">Units reserved for emergencies before distribution</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={handleComputeEquity}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition-colors cursor-pointer">
                      <Activity className="w-3.5 h-3.5" /> Compute Equity Allocation
                    </button>
                  </div>
                </div>

                {/* Results — shown after compute */}
                {distComputed && distMeta && (
                  <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { label: 'Total Inventory', value: distMeta.totalInventory, sub: `${distBT} ${distComp} available`, color: 'indigo' },
                        { label: 'Emergency Reserve', value: distMeta.reserve, sub: 'Units set aside', color: 'amber' },
                        { label: 'Distributable Units', value: distMeta.available, sub: 'After reserve deduction', color: 'emerald' },
                        { label: 'Total Forecast Demand', value: distMeta.totalForecast, sub: 'Across all hospitals (nearest MLR week)', color: 'blue' },
                        { label: 'Computed At', value: distMeta.computedAt?.split(',')[1]?.trim() ?? '—', sub: distMeta.computedAt?.split(',')[0] ?? '', color: 'slate' },
                      ].map(card => (
                        <div key={card.label} className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm`}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                          <p className={`text-2xl font-black ${
                            card.color === 'indigo' ? 'text-indigo-700' :
                            card.color === 'amber'  ? 'text-amber-600' :
                            card.color === 'emerald'? 'text-emerald-600' : 'text-blue-700'
                          }`}>{card.value}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Allocation Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recommended Allocation</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">{distBT} · {distComp} · {new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' })}</p>
                        </div>
                        <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                          {distResults.length} hospitals
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-400 font-bold">
                              <th className="px-5 py-3">Hospital</th>
                              <th className="px-5 py-3 text-center">Type</th>
                              <th className="px-5 py-3 text-center">MLR Forecast</th>
                              <th className="px-5 py-3 text-center">Urgency</th>
                              <th className="px-5 py-3 text-center">Adj. Weight</th>
                              <th className="px-5 py-3 text-center">Equity Share</th>
                              <th className="px-5 py-3 text-center">Recommended Allocation</th>
                              <th className="px-5 py-3 text-center">Active Request</th>
                              <th className="px-5 py-3 text-center">Fulfillment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {distResults.map(row => (
                              <tr key={row.hospitalId} className={`transition-colors ${
                                row.hasRequest ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/60'
                              }`}>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">{row.hospitalName}</span>
                                    {row.hasRequest && (
                                      <span className="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Has Request</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    row.hospitalType === 'Government' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                                    row.hospitalType === 'Blood Bank'  ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                    'bg-slate-50 border-slate-200 text-slate-600'
                                  }`}>{row.hospitalType}</span>
                                </td>
                                <td className="px-5 py-3.5 text-center font-bold text-slate-700">{row.predicted}</td>
                                <td className="px-5 py-3.5 text-center">
                                  {row.urgencyLevel ? (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      row.urgencyLevel === 'Emergency' ? 'bg-red-50 border-red-200 text-red-700' :
                                      row.urgencyLevel === 'Urgent'    ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                      'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}>{row.urgencyLevel} ×{row.multiplier}</span>
                                  ) : (
                                    <span className="text-slate-300 text-[10px] font-semibold">Routine ×1.0</span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-center font-mono text-slate-600 text-[11px]">
                                  {row.adjusted?.toFixed(1) ?? row.predicted}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="font-bold text-slate-800">{row.weight}%</span>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${row.weight}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className="text-lg font-black text-slate-900">{row.allocation}</span>
                                  <span className="text-[10px] text-slate-400 ml-1">units</span>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  {row.hasRequest
                                    ? <span className="font-bold text-blue-700">{row.reqUnits} units</span>
                                    : <span className="text-slate-300 font-semibold">—</span>
                                  }
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  {row.canFulfill === 'full'    && <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded"><CheckCircle className="w-3 h-3" /> Fully Met</span>}
                                  {row.canFulfill === 'partial' && <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded"><AlertTriangle className="w-3 h-3" /> Partial</span>}
                                  {row.canFulfill === 'no-req'  && <span className="text-slate-300 text-[10px] font-semibold">No Request</span>}
                                  {row.canFulfill === 'none'    && <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 text-[#C21C24] text-[10px] font-bold px-2 py-0.5 rounded"><AlertTriangle className="w-3 h-3" /> Cannot Fulfill</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-700">
                              <td className="px-5 py-3" colSpan={4}>Totals</td>
                              <td className="px-5 py-3 text-center">{distMeta.totalForecast}</td>
                              <td className="px-5 py-3 text-center">100%</td>
                              <td className="px-5 py-3 text-center">{distMeta.available} units</td>
                              <td colSpan={2} />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Formula Transparency Panel */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" /> Algorithm Computation (Equity Formula)
                      </h3>
                      <div className="space-y-3 text-xs text-slate-700">
                        <div className="bg-slate-50 rounded-lg p-3 font-mono text-[11px] space-y-1">
                          <p className="text-slate-400 font-sans font-semibold mb-2">Step 1 — Available Blood for Distribution:</p>
                          <p>AvailableBlood = TotalInventory &minus; EmergencyReserve</p>
                          <p className="text-indigo-700 font-bold">AvailableBlood = {distMeta.totalInventory} &minus; {distMeta.reserve} = <strong>{distMeta.available} units</strong></p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 font-mono text-[11px] space-y-1">
                          <p className="text-slate-400 font-sans font-semibold mb-2">Step 2 — Urgency Adjustment per Hospital:</p>
                          <p>AdjustedWeight<sub>h</sub> = ForecastedDemand<sub>h</sub> &times; UrgencyMultiplier<sub>h</sub></p>
                          <p className="text-[10px] text-slate-400 font-sans">Multipliers: Emergency = 1.5 &nbsp;|&nbsp; Urgent = 1.25 &nbsp;|&nbsp; Routine = 1.0</p>
                          <div className="mt-2 space-y-1">
                            {distResults.map(row => (
                              <p key={row.hospitalId} className="text-indigo-700">
                                {row.hospitalName.split(' ')[0]}: {row.predicted} &times; {row.multiplier ?? 1.0} = <strong>{row.adjusted?.toFixed(1) ?? row.predicted}</strong>
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 font-mono text-[11px] space-y-1">
                          <p className="text-slate-400 font-sans font-semibold mb-2">Step 3 — Proportional Allocation per Hospital:</p>
                          <p>Allocation<sub>h</sub> = (AdjustedWeight<sub>h</sub> / &Sigma;AdjustedWeights) &times; AvailableBlood</p>
                          <p className="text-[10px] text-slate-400 font-sans">&Sigma;AdjustedWeights = {distMeta.totalAdjusted?.toFixed(1) ?? distMeta.totalForecast}</p>
                          <div className="mt-2 space-y-1">
                            {distResults.map(row => (
                              <p key={row.hospitalId} className="text-indigo-700">
                                {row.hospitalName.split(' ')[0]}: ({row.adjusted?.toFixed(1) ?? row.predicted} / {distMeta.totalAdjusted?.toFixed(1) ?? distMeta.totalForecast}) &times; {distMeta.available} = <strong>{row.allocation}</strong>
                              </p>
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Forecasted demand is generated by the Multiple Linear Regression model using historical blood issuance records.
                          Emergency reserve of {distMeta.reserve} unit(s) is preserved before distribution.
                          Urgency multipliers prioritize hospitals with active Emergency or Urgent requests.
                          All recommendations are subject to final approval by authorized SNBC-Mindanao personnel.
                          Computed: {distMeta.computedAt ?? '—'}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Placeholder when not yet computed */}
                {!distComputed && (
                  <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
                    <Activity className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="font-bold text-slate-400 text-sm">No allocation computed yet</p>
                    <p className="text-xs text-slate-300 mt-1">Select a blood type, component, and emergency reserve above, then click <strong>Compute Equity Allocation</strong>.</p>
                  </div>
                )}

              </div>
            );
          })()}



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

                {/* Loading toast at top */}
                {fcLoading && (
                  <div className="sticky top-4 z-40 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl w-fit mx-auto">
                    <div className="loading">
                      <svg width="40px" height="30px" viewBox="0 0 48 48">
                        <polyline points="0.15, 24 16.15, 24 20.15, 12 24.15, 36 28.15, 18 32.15, 30 36.15, 24 47.85, 24" id="back"></polyline>
                        <polyline points="0.15, 24 16.15, 24 20.15, 12 24.15, 36 28.15, 18 32.15, 30 36.15, 24 47.85, 24" id="front"></polyline>
                      </svg>
                    </div>
                    <span className="text-sm font-bold">Running MLR Forecast…</span>
                  </div>
                )}

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
                           Reset to Overview
                        </button>
                      )}
                      <button
                        disabled={fcLoading}
                        onClick={async () => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setFcLoading(true);
                          try { await generateGranularForecast(fcWeeks); }
                          finally { setFcLoading(false); }
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm
                          ${fcLoading ? 'bg-slate-500 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'}`}>
                        {fcLoading
                          ? <><span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin inline-block"></span> Running…</>
                          : <><Activity className="w-3.5 h-3.5" /> Re-run Forecast</>}
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

                    {/* ── DEMAND VS INVENTORY GAP ANALYSIS ── */}
                    {hasData && (() => {
                      const BLOOD_TYPES = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];
                      const COMPONENTS  = ['PRBC','Platelet Concentrate','FFP','Cryoprecipitate','Cryosupernate'];

                      // Count available units per blood_type + component from live inventory
                      const availMap = {};
                      (bloodInventory || []).forEach(u => {
                        if (u.inventoryStatus !== 'Available' && u.inventory_status !== 'Available') return;
                        const bt   = u.bloodType   || u.blood_type  || '';
                        const comp = u.component   || u.componentType || '';
                        const key  = `${bt}|${comp}`;
                        availMap[key] = (availMap[key] || 0) + 1;
                      });

                      // Sum predicted demand (week 1) per blood_type + component across all hospitals
                      const demandMap = {};
                      gf.filter(f => f.weeksAhead === 1).forEach(f => {
                        const key = `${f.bloodTypeId}|${f.componentId}`;
                        demandMap[key] = (demandMap[key] || 0) + f.predictedDemand;
                      });

                      // Build gap rows
                      const gapRows = [];
                      BLOOD_TYPES.forEach(bt => {
                        COMPONENTS.forEach(comp => {
                          const key     = `${bt}|${comp}`;
                          const demand  = Math.round(demandMap[key] || 0);
                          const avail   = availMap[key] || 0;
                          if (demand === 0 && avail === 0) return;
                          const gap     = avail - demand;
                          const ratio   = demand > 0 ? avail / demand : 1;
                          const status  = gap < 0 ? 'Shortfall' : ratio < 1.2 ? 'Low Buffer' : 'Sufficient';
                          gapRows.push({ bt, comp, demand, avail, gap, status });
                        });
                      });

                      // Sort: Shortfall first, then Low Buffer, then Sufficient
                      const order = { Shortfall: 0, 'Low Buffer': 1, Sufficient: 2 };
                      gapRows.sort((a, b) => order[a.status] - order[b.status] || a.gap - b.gap);

                      const shortfalls  = gapRows.filter(r => r.status === 'Shortfall').length;
                      const lowBuffers  = gapRows.filter(r => r.status === 'Low Buffer').length;
                      const sufficients = gapRows.filter(r => r.status === 'Sufficient').length;

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm tracking-tight">⚖️ Demand vs Inventory Gap Analysis</h3>
                              <p className="text-xs text-slate-500 mt-0.5">Next-week predicted demand vs current available stock — helps identify shortfalls before they happen</p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold flex-shrink-0">
                              {shortfalls > 0 && <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-full">{shortfalls} Shortfall{shortfalls > 1 ? 's' : ''}</span>}
                              {lowBuffers > 0 && <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">{lowBuffers} Low Buffer</span>}
                              {sufficients > 0 && <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">{sufficients} Sufficient</span>}
                            </div>
                          </div>

                          {gapRows.length === 0 ? (
                            <div className="px-6 py-8 text-center text-slate-400 text-sm">
                              Run the forecast first to see demand vs inventory comparison.
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-50">
                              {/* Header */}
                              <div className="grid grid-cols-12 px-6 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <span className="col-span-2">Blood Type</span>
                                <span className="col-span-3">Component</span>
                                <span className="col-span-2 text-right">Predicted Demand</span>
                                <span className="col-span-2 text-right">Available Stock</span>
                                <span className="col-span-2 text-right">Gap</span>
                                <span className="col-span-1 text-right">Status</span>
                              </div>
                              {gapRows.map(({ bt, comp, demand, avail, gap, status }) => {
                                const isShortfall  = status === 'Shortfall';
                                const isLowBuffer  = status === 'Low Buffer';
                                const rowBg  = isShortfall ? 'bg-rose-50/60 hover:bg-rose-50' : isLowBuffer ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-slate-50';
                                const gapColor = isShortfall ? 'text-rose-700 font-bold' : isLowBuffer ? 'text-amber-700 font-bold' : 'text-emerald-700';
                                const badge  = isShortfall
                                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                                  : isLowBuffer
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                const barPct = demand > 0 ? Math.min((avail / demand) * 100, 100) : 100;
                                const barColor = isShortfall ? 'bg-rose-400' : isLowBuffer ? 'bg-amber-400' : 'bg-emerald-400';
                                return (
                                  <div key={`${bt}|${comp}`} className={`grid grid-cols-12 px-6 py-3 items-center transition text-xs ${rowBg}`}>
                                    <span className="col-span-2 font-bold text-slate-800 font-mono">{bt}</span>
                                    <span className="col-span-3 text-slate-600">{comp}</span>
                                    <span className="col-span-2 text-right font-mono text-slate-700">{demand} units</span>
                                    <div className="col-span-2 flex flex-col items-end gap-1">
                                      <span className="font-mono text-slate-700">{avail} units</span>
                                      <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${barPct}%` }} />
                                      </div>
                                    </div>
                                    <span className={`col-span-2 text-right font-mono ${gapColor}`}>
                                      {gap >= 0 ? `+${gap}` : gap} units
                                    </span>
                                    <span className="col-span-1 flex justify-end">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge} whitespace-nowrap`}>
                                        {status === 'Shortfall' ? '🔴' : status === 'Low Buffer' ? '🟡' : '🟢'} {status}
                                      </span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {shortfalls > 0 && (
                            <div className="px-6 py-3 bg-rose-50 border-t border-rose-100">
                              <p className="text-xs text-rose-700 font-semibold">
                                ⚠️ {shortfalls} blood type/component combination{shortfalls > 1 ? 's are' : ' is'} projected to run short next week.
                                Consider initiating a procurement drive or requesting transfers from partner facilities.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

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
                            Wk 1–8 = historical actual issuances (aggregated) | Wk 9+ = MLR predictions with ±8% confidence band
                            {chartClickedPoint && <span className="ml-2 text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => setChartClickedPoint(null)}>· Clear analysis ×</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold flex-shrink-0 ml-4">
                          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-500 inline-block rounded"></span>Actual</span>
                          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-indigo-500 inline-block rounded"></span>Predicted</span>
                          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-slate-300 inline-block rounded"></span>Confidence</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2 italic">💡 Click on any data point to see an interpretation.</p>
                      <div className="h-80 w-full cursor-pointer">
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
                            <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={3} name="Actual (Historical)"
                              dot={{ r: 5, fill: '#10B981', cursor: 'pointer' }}
                              activeDot={{ r: 7, fill: '#10B981', stroke: '#fff', strokeWidth: 2, cursor: 'pointer',
                                onClick: (event, payload) => { if (payload?.payload) setChartClickedPoint(payload.payload); }
                              }}
                              connectNulls />
                            <Line type="monotone" dataKey="predicted" stroke="#4F46E5" strokeWidth={3} name="MLR Prediction"
                              dot={{ r: 5, fill: '#4F46E5', cursor: 'pointer' }}
                              activeDot={{ r: 7, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2, cursor: 'pointer',
                                onClick: (event, payload) => { if (payload?.payload) setChartClickedPoint(payload.payload); }
                              }}
                              connectNulls strokeDasharray={isOverview ? undefined : "6 3"} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* ── Click Analysis Panel ── */}
                      {chartClickedPoint && (() => {
                        const pt = chartClickedPoint;
                        const isActual    = pt.actual !== null && pt.actual !== undefined;
                        const isPredicted = pt.predicted !== null && pt.predicted !== undefined;
                        const val         = isActual ? pt.actual : pt.predicted;
                        const type        = isActual ? 'historical' : 'predicted';
                        const upper       = pt.upper ?? Math.round(val * 1.08);
                        const lower       = pt.lower ?? Math.max(0, Math.round(val * 0.92));

                        // Determine demand level
                        const allPredicted = activeChartData.filter(d => d.predicted).map(d => d.predicted);
                        const avgPred = allPredicted.length ? allPredicted.reduce((a,b) => a+b,0)/allPredicted.length : val;
                        const demandLevel = val > avgPred * 1.15 ? 'High' : val < avgPred * 0.85 ? 'Low' : 'Normal';
                        const demandColor = demandLevel === 'High' ? 'text-rose-700 bg-rose-50 border-rose-200'
                                          : demandLevel === 'Low'  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                          : 'text-amber-700 bg-amber-50 border-amber-200';

                        // Generate interpretation text
                        const contextLabel = fcHospital !== 'ALL'
                          ? hospitals.find(h => h.id === fcHospital)?.name?.split('(')[0].trim()
                          : 'all hospitals combined';
                        const btLabel  = fcBloodType !== 'ALL' ? `${fcBloodType} blood` : 'all blood types';
                        const compLabel = fcComponent !== 'ALL' ? fcComponent : 'all components';

                        const interpretation = isActual
                          ? `During ${pt.label}, the actual recorded demand was ${val} units of ${btLabel} (${compLabel}) across ${contextLabel}. ` +
                            (demandLevel === 'High'
                              ? `This was above average, suggesting elevated patient need or increased hospital activity during this period. Blood bank staff should review what drove this spike to anticipate future occurrences.`
                              : demandLevel === 'Low'
                              ? `This was below average, which may indicate lower patient admissions, seasonal slowdown, or improved efficiency in blood utilization. This is a positive sign for inventory levels.`
                              : `This reflects a normal, steady demand level — consistent with expected weekly consumption patterns. No unusual intervention is required.`)
                          : `The MLR model predicts a demand of ${val} units for ${pt.label}, with a confidence range of ${lower}–${upper} units. ` +
                            (demandLevel === 'High'
                              ? `This forecast signals elevated anticipated need. The blood bank should prepare ${upper} units as a buffer and consider running a distribution recommendation for this component before the week begins.`
                              : demandLevel === 'Low'
                              ? `Demand is forecasted to be lower than average this week. This provides an opportunity to reduce stock rotation risk by fulfilling existing requests from older inventory first.`
                              : `Demand is forecasted to remain at a steady, manageable level. Routine issuance operations should be sufficient without requiring additional stock mobilization.`);

                        return (
                          <div className="mt-4 border border-indigo-100 bg-indigo-50/60 rounded-xl p-4 animate-fadeIn">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-lg">
                                {isActual ? '📈' : '🔮'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-bold text-indigo-900 text-sm">{pt.label} Analysis</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${demandColor}`}>{demandLevel} Demand</span>
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{type}</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">{interpretation}</p>
                                {isPredicted && (
                                  <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-500">
                                    <span>📉 Lower bound: <strong className="text-slate-700">{lower} units</strong></span>
                                    <span>📈 Upper bound: <strong className="text-slate-700">{upper} units</strong></span>
                                    <span>🎯 Point estimate: <strong className="text-indigo-700">{val} units</strong></span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
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
                        <input type="number" name="units" min="1" max="50" inputMode="numeric" value={cartItem.units} onChange={handleCartItemChange}
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
                            <button type="button" onClick={() => setConfirmState({
                              isOpen: true,
                              title: 'Remove Item?',
                              message: 'Remove this item from the cart?',
                              confirmText: 'Remove',
                              variant: 'danger',
                              onConfirm: () => { closeConfirm(); handleRemoveCartItem(idx); },
                            })}
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
                      This request is marked <strong>URGENT</strong>. It will be prioritized for immediate issuance attention.
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
                <button onClick={() => setConfirmState({
                  isOpen: true,
                  title: 'Reject Blood Request?',
                  message: `Reject request ${viewingReq?.refNo}? This action will notify the requesting hospital.`,
                  confirmText: 'Reject Request',
                  variant: 'danger',
                    onConfirm: () => { closeConfirm(); rejectRequest(viewingReq.refNo); setViewingReq(null); setRejectNote(''); },
                  })}
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
                const hasRec     = item.equityRec !== null && item.equityRec !== undefined;
                const overRec    = hasRec && item.quantityIssued > item.equityRec;
                return (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-[#C21C24] font-black text-[10px] border border-rose-100 font-mono flex-shrink-0">{item.bloodType}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{item.component}</p>
                        <p className="text-[10px] text-slate-400">
                          Requested: {item.requested} · Available: <span className={avail >= item.requested ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{avail}</span>
                          {hasRec && <span className="ml-2 text-indigo-600 font-semibold">· Equity Rec: {item.equityRec} units</span>}
                        </p>
                      </div>
                      <input type="number" min={0} value={item.quantityIssued}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setProcessItems(prev => prev.map((p, i) => i === idx ? { ...p, quantityIssued: val } : p));
                          setIsPartial(processItems.some((p, i) => i === idx ? val < p.requested : p.quantityIssued < p.requested));
                        }}
                        className={`w-16 border rounded-lg px-2 py-1 text-xs font-bold text-center focus:ring-2 outline-none ${
                          overRec ? 'border-amber-400 focus:ring-amber-300 bg-amber-50' : 'border-slate-200 focus:ring-slate-900'
                        }`} />
                    </div>
                    {hasRec && overRec && (
                      <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 text-[10px] text-amber-800 font-semibold">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />
                        <span>Quantity exceeds equity recommendation ({item.equityRec} units). Proceeding may affect allocations to other hospitals.</span>
                      </div>
                    )}
                    {hasRec && !overRec && (
                      <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-semibold">
                        <CheckCircle className="w-3 h-3" /> Within equity recommendation
                      </div>
                    )}
                    {!item.equityComputed && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                        <Activity className="w-3 h-3" />
                        <span>Run <strong>Distribution Reco</strong> for {item.bloodType} {item.component} to see equity recommendation before processing.</span>
                      </div>
                    )}
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
              {/* Stock insufficiency error */}
              {processItems.some(i => i.quantityIssued > availableUnits(i.bloodType, i.component)) && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-2 text-xs text-[#C21C24] font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Insufficient inventory stock — reduce quantity to match available units before confirming.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setProcessingReq(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleProcess}
                  disabled={processing || processItems.some(i => i.quantityIssued > 0 && i.quantityIssued > availableUnits(i.bloodType, i.component)) || processItems.every(i => i.quantityIssued <= 0)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
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
                  <h3 className="font-bold text-slate-900 text-sm">Record Blood Component Unit</h3>
                </div>
                <button type="button" onClick={() => { setShowUnitForm(false); setSerialInput(''); setSerialStatus(null); setVolumeError(''); setDonationSearch(''); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUnitSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

              {/* ── Step 1: Serial / Segment Number Lookup ── */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Donation Serial / Segment No. <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 2026-0001 — auto-fills blood type & collection date"
                    value={serialInput}
                    onChange={e => handleSerialLookup(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-mono font-bold focus:ring-2 outline-none ${
                      serialStatus === 'found'           ? 'border-emerald-300 bg-emerald-50 text-emerald-800 focus:ring-emerald-300'
                    : serialStatus === 'not_found'        ? 'border-rose-300 bg-rose-50 text-rose-700 focus:ring-rose-300'
                    : serialStatus === 'pending_outcome'  ? 'border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-300'
                    : 'border-indigo-200 bg-indigo-50/40 text-indigo-800 focus:ring-indigo-300'
                    }`}
                  />
                </div>
                {serialStatus === 'found' && (
                  <div className="mt-1.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-[11px] font-bold text-emerald-800">
                      {unitForm.donorName || 'Donor found'}
                      <span className="ml-2 font-mono font-normal text-emerald-600">
                        {unitForm.bloodType} · Collected {unitForm.collectionDate}
                      </span>
                    </span>
                  </div>
                )}
                {serialStatus === 'not_found' && (
                  <p className="mt-1 text-[10px] text-rose-500 font-semibold">Serial number not found in donations. Check the number or proceed with manual entry below.</p>
                )}
                {serialStatus === 'pending_outcome' && (
                  <div className="mt-1.5 flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="text-[11px] font-bold text-amber-800">
                      Screening outcome not yet recorded for this donation. Registry must record Accept/Deferral before this unit can be added to inventory.
                    </span>
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* ── Step 2: Blood Type & Component ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Blood Type <span className="text-rose-500">*</span>
                    {serialStatus === 'found' && <span className="ml-1 text-emerald-500 font-normal normal-case tracking-normal">auto-filled</span>}
                  </label>
                  <select required value={unitForm.bloodType}
                    onChange={e => setUnitForm(prev => ({ ...prev, bloodType: e.target.value }))}
                    disabled={serialStatus === 'found'}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none ${
                      serialStatus === 'found'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 cursor-not-allowed opacity-90'
                        : 'bg-white border-slate-200'
                    }`}>
                    {BLOOD_TYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                  {serialStatus === 'found' && (
                    <p className="text-[9px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Locked — sourced from donation record
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Component <span className="text-rose-500">*</span></label>
                  <select required value={unitForm.component} onChange={e => handleComponentChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none bg-white font-semibold">
                    {COMPONENTS.map(v => <option key={v}>{v}</option>)}
                  </select>
                  {COMPONENT_SPECS[unitForm.component] && (
                    <p className="text-[9px] text-indigo-500 font-semibold mt-0.5">
                      Range: {COMPONENT_SPECS[unitForm.component].minCC}–{COMPONENT_SPECS[unitForm.component].maxCC} cc · Shelf life: {COMPONENT_SPECS[unitForm.component].shelfDays} days
                    </p>
                  )}
                </div>
              </div>

              {/* ── Step 3: Collection Date & Auto Expiry ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Collection Date <span className="text-rose-500">*</span>
                    {serialStatus === 'found' && <span className="ml-1 text-emerald-500 font-normal normal-case tracking-normal">auto-filled</span>}
                  </label>
                  <input type="date" required value={unitForm.collectionDate}
                    onChange={e => {
                      const newExpiry = computeExpiry(e.target.value, unitForm.component);
                      setUnitForm(prev => ({ ...prev, collectionDate: e.target.value, expirationDate: newExpiry }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none ${
                      serialStatus === 'found' ? 'bg-emerald-50 border-emerald-200' : 'border-slate-200'
                    }`} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Expiration Date <span className="text-rose-500">*</span>
                    <span className="ml-1 text-indigo-400 font-normal normal-case tracking-normal">auto-calculated</span>
                  </label>
                  <input type="date" required value={unitForm.expirationDate}
                    onChange={e => setUnitForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full border border-indigo-200 bg-indigo-50/30 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-300 outline-none" />
                </div>
              </div>

              {/* ── Step 4: Volume (CC) with range validation ── */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Volume (CC) <span className="text-rose-500">*</span>
                  {COMPONENT_SPECS[unitForm.component] && (
                    <span className="ml-1 text-slate-400 font-normal normal-case tracking-normal">
                      Acceptable range: {COMPONENT_SPECS[unitForm.component].minCC}–{COMPONENT_SPECS[unitForm.component].maxCC} cc
                    </span>
                  )}
                </label>
                <input
                  type="number" required step="0.01"
                  min={COMPONENT_SPECS[unitForm.component]?.minCC ?? 1}
                  max={COMPONENT_SPECS[unitForm.component]?.maxCC ?? 9999}
                  value={unitForm.quantity}
                  onChange={e => {
                    setUnitForm(prev => ({ ...prev, quantity: e.target.value }));
                    setVolumeError(validateVolume(e.target.value, unitForm.component));
                  }}
                  placeholder={COMPONENT_SPECS[unitForm.component] ? `${COMPONENT_SPECS[unitForm.component].minCC}–${COMPONENT_SPECS[unitForm.component].maxCC}` : ''}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:ring-2 outline-none font-mono font-bold ${
                    volumeError ? 'border-rose-300 bg-rose-50 text-rose-700 focus:ring-rose-300' : 'border-slate-200 bg-white focus:ring-slate-900'
                  }`}
                />
                {volumeError && (
                  <p className="mt-1 text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {volumeError}
                  </p>
                )}
              </div>

              {/* ── Step 5: Safety Status & Intended Use ── */}
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
                <button type="button" onClick={() => { setShowUnitForm(false); setSerialInput(''); setSerialStatus(null); setVolumeError(''); }} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={!!volumeError} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
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

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
