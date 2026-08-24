import React, { useState, useMemo, useEffect } from 'react';
import { useBloodStore } from '../store/useBloodStore';
import {
  Users,
  RefreshCw,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  Edit,
  Droplets,
  LogOut,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Printer,
  ClipboardList,
  Stethoscope
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessModal from '../components/SuccessModal';

const BLOOD_TYPES = ['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const ITEMS_PER_PAGE = 5;

// Default pre-populated questions for sample donors in dataset who don't have health arrays
const DEFAULT_HEALTH = [true, true, true, true, true];

export default function RegistryDashboard() {
  const { donors, inventory, addDonor, updateDonorMedical, donationEvents, authSystemUser, labTestResults, donations, addLabTestResult, isSidebarCollapsed, toggleSidebar } = useBloodStore();

  // Dynamically prepare donor lastDonation dates relative to today's date for demo purposes
  const preparedDonors = useMemo(() => {
    return donors.map((d, index) => {
      let lastDon = d.lastDonation;
      // Force every second donor in the list to have a recent donation (e.g., 30-70 days ago)
      // so they actively show remaining rest countdowns instead of all being "Ready to Donate"
      if (index % 2 === 1 && d.status !== 'Deferred') {
        const date = new Date();
        const offsetDays = 30 + (index % 4) * 15; // 30, 45, 60, 75 days ago
        date.setDate(date.getDate() - offsetDays);
        lastDon = date.toISOString().slice(0, 10);
      }
      return { ...d, lastDonation: lastDon };
    });
  }, [donors]);

  const [tab, setTab] = useState('registry');
  const [searchQuery, setSearchQuery] = useState('');

  // Recall tab search/filter
  const [recallSearch, setRecallSearch] = useState('');
  const [recallBloodFilter, setRecallBloodFilter] = useState('All');

  // Pagination states
  const [registryPage, setRegistryPage] = useState(1);
  const [recallPage, setRecallPage] = useState(1);

  // Add Donor Drawer State
  const [showDrawer, setShowDrawer] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState({ isOpen: false, donorId: '', donorName: '' });
  const [newDonorForm, setNewDonorForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    sex: 'Female',
    civilStatus: 'Single',
    dob: '',
    phone: '',
    email: '',
    donorStatus: 'New',
    registrationDate: new Date().toISOString().slice(0, 10),
    address: ''
  });

  // Bulk Selection State for Recalls
  const [selectedRecallIds, setSelectedRecallIds] = useState([]);

  // DHQ Viewer State
  const [activeDhqDonor, setActiveDhqDonor] = useState(null);

  // Clinical Screening & Serology Lab outcome state
  const [editingMedicalDonor, setEditingMedicalDonor] = useState(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [screeningSuccessModal, setScreeningSuccessModal] = useState({
    isOpen: false,
    donorId: '',
    donorName: '',
    outcome: '',
    remarks: '',
    eventId: '',
    venue: '',
    donationDate: ''
  });

  const [recallConfirm, setRecallConfirm] = useState({ isOpen: false, donorId: '', donorName: '', isBulk: false });
  const [recallSuccess, setRecallSuccess] = useState({ isOpen: false, message: '', details: null });
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', variant: 'warning' });

  // Lab Results (Table 8) modal state
  const [showLabResultModal, setShowLabResultModal] = useState(false);
  const [labSaved, setLabSaved] = useState(false);
  const [labDonationSearchQuery, setLabDonationSearchQuery] = useState('');
  const [labForm, setLabForm] = useState({
    donationId: '',
    hemoglobinResult: '14.5',
    bloodTypeConfirmed: 'O+',
    hbsagResult: 'Non-Reactive',
    syphilisResult: 'Non-Reactive',
    hivResult: 'Non-Reactive',
    hcvResult: 'Non-Reactive',
    malariaResult: 'Non-Reactive',
    natResult: 'Non-Reactive',
    othersResult: ''
  });

  const [medicalForm, setMedicalForm] = useState({
    // Table 7 — Donation Record fields
    eventId: 'EVT-001',
    // Table 6 / 7 shared — Event context
    donationDate: '',
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    barangayOrganization: 'Buhangin',
    // Table 7 — Screening Outcome
    screeningOutcome: 'Accepted',
    deferralReason: '',
    deferralEndDate: '',
    // Table 8 — Lab Results
    bloodType: 'O+',
    rhTyping: 'Positive',
    hemoglobinResult: '14.5',
    hbsagResult: 'Non-Reactive',
    syphilisResult: 'Non-Reactive',
    hivResult: 'Non-Reactive',
    hcvResult: 'Non-Reactive',
    malariaResult: 'Non-Reactive',
    natResult: 'Non-Reactive'
  });

  useEffect(() => {
    if (editingMedicalDonor) {
      setMedicalForm({
        // Table 7 — Donation Record
        eventId: editingMedicalDonor.eventId || 'EVT-001',
        // Event context
        donationDate: editingMedicalDonor.donationDate || new Date().toISOString().slice(0, 10),
        province: editingMedicalDonor.province || 'Davao del Sur',
        cityMunicipality: editingMedicalDonor.cityMunicipality || 'Davao City',
        barangayOrganization: editingMedicalDonor.barangayOrganization || 'Buhangin',
        // Screening
        screeningOutcome: editingMedicalDonor.screeningOutcome || 'Accepted',
        deferralReason: editingMedicalDonor.deferralReason || '',
        deferralEndDate: editingMedicalDonor.deferralEndDate || '',
        // Lab Results
        bloodType: editingMedicalDonor.bloodType || 'O+',
        rhTyping: editingMedicalDonor.rhTyping || 'Positive',
        hemoglobinResult: editingMedicalDonor.hemoglobinResult || '14.5',
        hbsagResult: editingMedicalDonor.hbsagResult || 'Non-Reactive',
        syphilisResult: editingMedicalDonor.syphilisResult || 'Non-Reactive',
        hivResult: editingMedicalDonor.hivResult || 'Non-Reactive',
        hcvResult: editingMedicalDonor.hcvResult || 'Non-Reactive',
        malariaResult: editingMedicalDonor.malariaResult || 'Non-Reactive',
        natResult: editingMedicalDonor.natResult || 'Non-Reactive'
      });
    }
  }, [editingMedicalDonor]);

  // Live countdown state for real-time donor rest interval ticking
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const fullName = `${newDonorForm.firstName} ${newDonorForm.middleName ? newDonorForm.middleName + ' ' : ''}${newDonorForm.lastName}`.trim();
    
    // Duplicate check: check if donor with same full name or phone/email exists
    const isDuplicate = donors.some(d => 
      (d.name && d.name.toLowerCase() === fullName.toLowerCase()) ||
      (newDonorForm.phone && (d.phone === newDonorForm.phone || d.contactNumber === newDonorForm.phone)) ||
      (newDonorForm.email && d.email && d.email.toLowerCase() === newDonorForm.email.toLowerCase())
    );

    if (isDuplicate) {
      setNoticeModal({
        isOpen: true,
        title: 'Duplicate Entry Detected',
        message: `A donor with the name "${fullName}" or contact information already exists in the system registry. Please verify the donor record to prevent duplicate entries.`,
        variant: 'danger'
      });
      return;
    }

    const id = 'D' + String(Math.floor(Math.random() * 900) + 100);
    const newDonor = {
      id,
      firstName: newDonorForm.firstName,
      middleName: newDonorForm.middleName,
      lastName: newDonorForm.lastName,
      name: fullName,
      phone: newDonorForm.phone,
      contactNumber: newDonorForm.phone,
      email: newDonorForm.email,
      sex: newDonorForm.sex,
      civilStatus: newDonorForm.civilStatus,
      birthDate: newDonorForm.dob,
      dob: newDonorForm.dob,
      address: newDonorForm.address,
      donorStatus: newDonorForm.donorStatus,
      registrationDate: newDonorForm.registrationDate,
      bloodType: 'Pending Conf.', // Placeholder until Lab confirmation (Table 8)
      status: 'New',
      lastDonation: new Date().toISOString().slice(0, 10),
      remarks: 'Eligible',
      distance: 'Pending',
      totalDonations: 0,
      health: [true, true, true, true, true] // Default health pass for manually added registry donors
    };
    addDonor(newDonor);
    setShowDrawer(false);
    setNewDonorForm({
      firstName: '',
      middleName: '',
      lastName: '',
      sex: 'Female',
      civilStatus: 'Single',
      dob: '',
      phone: '',
      email: '',
      donorStatus: 'New',
      registrationDate: new Date().toISOString().slice(0, 10),
      address: ''
    });
    setRegistryPage(1);
    // Show success confirmation modal
    setRegistrationSuccess({ isOpen: true, donorId: id, donorName: fullName });
  };

  // Donor Registry Data
  const filteredDonors = useMemo(() => {
    return preparedDonors.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.bloodType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [preparedDonors, searchQuery]);

  // Paginated Registry Donors
  const paginatedDonors = useMemo(() => {
    const start = (registryPage - 1) * ITEMS_PER_PAGE;
    return filteredDonors.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDonors, registryPage]);

  const totalRegistryPages = Math.max(1, Math.ceil(filteredDonors.length / ITEMS_PER_PAGE));

  // Donor Recall Logic
  const criticalBloodTypes = useMemo(() => {
    return inventory.filter(i => i.status === 'critical').map(i => i.type);
  }, [inventory]);

  const recallDonors = useMemo(() => {
    return preparedDonors.filter(d => {
      return d.lastDonation && d.status !== 'Deferred' && criticalBloodTypes.includes(d.bloodType);
    });
  }, [preparedDonors, criticalBloodTypes]);

  // Filtered recall donors (search + blood type filter)
  const filteredRecallDonors = useMemo(() => {
    return recallDonors.filter(d => {
      const matchesSearch =
        d.name.toLowerCase().includes(recallSearch.toLowerCase()) ||
        d.id.toLowerCase().includes(recallSearch.toLowerCase()) ||
        d.bloodType.toLowerCase().includes(recallSearch.toLowerCase());
      const matchesBlood = recallBloodFilter === 'All' || d.bloodType === recallBloodFilter;
      return matchesSearch && matchesBlood;
    });
  }, [recallDonors, recallSearch, recallBloodFilter]);

  // Paginated Recall Donors
  const paginatedRecallDonors = useMemo(() => {
    const start = (recallPage - 1) * ITEMS_PER_PAGE;
    return filteredRecallDonors.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecallDonors, recallPage]);

  const totalRecallPages = Math.max(1, Math.ceil(filteredRecallDonors.length / ITEMS_PER_PAGE));

  // Individual SMS Recall
  const handleRecall = (id) => {
    const donorObj = preparedDonors.find(d => d.id === id);
    setRecallConfirm({
      isOpen: true,
      donorId: id,
      donorName: donorObj?.name || id,
      isBulk: false
    });
  };

  // Bulk SMS Recall
  const handleBulkRecall = () => {
    if (selectedRecallIds.length === 0) return;
    setRecallConfirm({
      isOpen: true,
      donorId: '',
      donorName: `${selectedRecallIds.length} Donors`,
      isBulk: true
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const eligibleIds = filteredRecallDonors.filter(d => {
        const daysSince = Math.floor((new Date() - new Date(d.lastDonation)) / (1000 * 60 * 60 * 24));
        const dLeft = Math.max(0, 90 - daysSince);
        return daysSince >= 90 || dLeft <= 5;
      }).map(d => d.id);
      setSelectedRecallIds(eligibleIds);
    } else {
      setSelectedRecallIds([]);
    }
  };

  const handleSelectOne = (id) => {
    const d = preparedDonors.find(x => x.id === id);
    if (!d) return;
    const daysSince = Math.floor((new Date() - new Date(d.lastDonation)) / (1000 * 60 * 60 * 24));
    const dLeft = Math.max(0, 90 - daysSince);
    if (daysSince < 90 && dLeft > 5) return;
    setSelectedRecallIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const isAllSelected = useMemo(() => {
    const eligibleDonors = filteredRecallDonors.filter(d => {
      const daysSince = Math.floor((new Date() - new Date(d.lastDonation)) / (1000 * 60 * 60 * 24));
      const dLeft = Math.max(0, 90 - daysSince);
      return daysSince >= 90 || dLeft <= 5;
    });
    return eligibleDonors.length > 0 && eligibleDonors.every(d => selectedRecallIds.includes(d.id));
  }, [filteredRecallDonors, selectedRecallIds]);

  const hasSelection = selectedRecallIds.length > 0;

  // Print layout function
  const handlePrintDhq = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased print:bg-white print:text-black">

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar flex flex-col justify-between border-r border-slate-200 bg-white print:hidden ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>
        <div id="registry-sidebar" className="sidebar-inner w-full flex flex-col justify-between">
          <div>
            {/* Logo Section */}
            <div className={`py-5 border-b border-slate-100 ${isSidebarCollapsed ? 'px-3' : 'px-6'}`}>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className={`flex items-center min-w-0 ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                  <img src={bloodlinkLogo} alt="BloodLink" className="h-10 w-auto object-contain flex-shrink-0" />
                  <div className="sidebar-brand-copy min-w-0">
                    <p className="font-bold text-sm text-slate-900 tracking-tight leading-tight">BloodLink</p>
                    <p className="text-slate-500 text-[10px] font-bold">Registry Portal</p>
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
                  <p className="text-slate-800 font-bold text-xs">Registry Staff</p>
                  <p className="text-slate-500 text-[10px] font-medium">SNBC Operations</p>
                </div>
              </div>
            )}

            {/* Sidebar Nav Links */}
            <nav className="flex-1 py-2 overflow-y-auto">
              <p className="sidebar-section-label text-slate-400 text-[9px] font-bold uppercase px-4 mt-3 mb-1 tracking-widest">Main Modules</p>

              <button
                onClick={() => setTab('registry')}
                className={`w-full text-left nav-link ${tab === 'registry' ? 'active' : ''}`}
                title={isSidebarCollapsed ? "Donor Registry" : ""}
              >
                <Users className="nav-icon" />
                <span className="sidebar-copy">Donor Registry</span>
              </button>

              <button
                onClick={() => setTab('recall')}
                className={`w-full text-left nav-link ${tab === 'recall' ? 'active' : ''}`}
                title={isSidebarCollapsed ? "Recall Operations" : ""}
              >
                <RefreshCw className="nav-icon" />
                <span className="sidebar-copy">Recall Operations</span>
                {recallDonors.length > 0 && (
                  <span className="nav-badge ml-auto bg-[#C21C24] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {recallDonors.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTab('laboratory')}
                className={`w-full text-left nav-link ${tab === 'laboratory' ? 'active' : ''}`}
                title={isSidebarCollapsed ? "Laboratory Results" : ""}
              >
                <Droplets className="nav-icon" />
                <span className="sidebar-copy">Laboratory Results</span>
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

      {/* ── CONTENT AREA ── */}
      <div className={`content-area flex flex-col flex-1 h-screen bg-slate-50 print:hidden ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>

        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 print:hidden">
          <div>
            <h2 className="text-slate-900 font-bold text-sm leading-tight">
              {tab === 'registry' ? 'Donor Database Registry' : tab === 'recall' ? 'SMS Recall Operations' : 'Laboratory Serology Results (Section II)'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
              {tab === 'registry' ? 'Manage registered donor logs and statuses' : tab === 'recall' ? 'Targeted dispatch for critical shortages' : 'Record and manage lab-confirmed serology results'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {tab === 'registry' && (
              <button
                onClick={() => setShowDrawer(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Register Donor
              </button>
            )}
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Registrar Desk</p>
              <p className="text-[10px] text-slate-400">Bajada HQ, Davao City</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
              RG
            </span>
          </div>
        </header>

        <main className="p-8 flex-1 space-y-6 print:p-0">

          {/* ── TAB 1: DONOR REGISTRY ── */}
          {tab === 'registry' && (
            <div className="space-y-5 print:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Active Donor Profiles</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Review eligibility, view medical checklist histories, and print pre-filled DHQ forms.</p>
                </div>
                <div className="search">
                  <input
                    type="text"
                    placeholder="Search name, ID, blood type..."
                    className="search__input text-xs"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setRegistryPage(1);
                    }}
                  />
                  <button className="search__button" type="button">
                    <Search className="search__icon" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between min-h-[300px]">
                <table className="w-full text-left border-collapse text-xs font-semibold text-slate-655">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3 font-bold">Donor ID</th>
                      <th className="px-5 py-3 font-bold">Donor Details</th>
                      <th className="px-5 py-3 font-bold">Blood Type</th>
                      <th className="px-5 py-3 text-center font-bold">Eligibility Status</th>
                      <th className="px-5 py-3 font-bold">Screening Outcome / Remarks</th>
                      <th className="px-5 py-3 font-bold">Last Donation</th>
                      <th className="px-5 py-3 font-bold">Location</th>
                      <th className="px-5 py-3 text-center font-bold">DHQ Status</th>
                      <th className="px-5 py-3 text-center font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedDonors.map((donor) => {
                      const daysSince = Math.floor((new Date() - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24));
                      const isEligible = daysSince >= 90;
                      const isDeferred = donor.status === 'Deferred' || (donor.screeningOutcome && donor.screeningOutcome !== 'Accepted');
                      const isNew = donor.status === 'New';

                      return (
                        <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-400">{donor.id}</td>
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900">{donor.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">{donor.phone}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">
                              {donor.bloodType}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {isDeferred ? (
                              <span className="bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-500" /> Deferred
                              </span>
                            ) : isNew ? (
                              <span className="bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-blue-500" /> New
                              </span>
                            ) : (
                              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> Regular
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {isDeferred ? (
                              <div>
                                <span className="text-rose-700 font-bold text-[11px]">
                                  {donor.deferralReason || donor.remarks || donor.screeningOutcome || 'Deferred'}
                                </span>
                                {donor.deferralEndDate && (
                                  <p className="text-[9px] text-slate-400 font-normal mt-0.5">Until: {donor.deferralEndDate}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                                {donor.remarks || 'Eligible'}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono font-normal">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{donor.lastDonation}</span>
                            </div>
                            <div className="mt-1">
                              {isEligible ? (
                                <span className="bg-amber-50 border border-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                  Lapsed (Eligible)
                                </span>
                              ) : (
                                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                  Resting ({90 - daysSince}d left)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-normal">
                            <div className="flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                              <span>{donor.address || 'Davao City'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                              <ClipboardList className="w-3 h-3" /> Submitted
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setEditingMedicalDonor(donor)}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Stethoscope className="w-3.5 h-3.5" /> Record Outcomes
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedDonors.length === 0 && (
                      <tr>
                        <td colSpan="9" className="px-6 py-8 text-center text-slate-400 font-normal">
                          No donors found matching "{searchQuery}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Registry Pagination Footer */}
                {filteredDonors.length > 0 && (
                  <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-250 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>
                      Showing {Math.min(filteredDonors.length, (registryPage - 1) * ITEMS_PER_PAGE + 1)} to{' '}
                      {Math.min(filteredDonors.length, registryPage * ITEMS_PER_PAGE)} of {filteredDonors.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRegistryPage(p => Math.max(1, p - 1))}
                        disabled={registryPage === 1}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-slate-700 font-bold">
                        Page {registryPage} of {totalRegistryPages}
                      </span>
                      <button
                        onClick={() => setRegistryPage(p => Math.min(totalRegistryPages, p + 1))}
                        disabled={registryPage === totalRegistryPages}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: RECALL OPERATIONS ── */}
          {tab === 'recall' && (
            <div className="space-y-5 print:hidden">

              {/* Shortage Info Banner */}
              <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-[#C21C24] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Critical Stock</span>
                  <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Targeted Shortage Matching</span>
                </div>
                <h3 className="text-base font-bold">Automatic Shortage Matching</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-2xl">
                  Donors below have exceeded their 90-day rest interval and match blood types currently flagged as{' '}
                  <strong className="text-rose-400">CRITICAL</strong> in the network ({criticalBloodTypes.join(', ') || 'None'}).
                </p>
              </div>

              {/* Recall Controls Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Eligible Shortage Donors</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {filteredRecallDonors.length} eligible donor{filteredRecallDonors.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {/* Search + Filter */}
                <div className="flex items-center gap-2">
                  <div className="search">
                    <input
                      type="text"
                      placeholder="Search donor..."
                      className="search__input text-xs"
                      value={recallSearch}
                      onChange={(e) => {
                        setRecallSearch(e.target.value);
                        setRecallPage(1);
                      }}
                    />
                    <button className="search__button" type="button">
                      <Search className="search__icon" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={recallBloodFilter}
                      onChange={(e) => {
                        setRecallBloodFilter(e.target.value);
                        setRecallPage(1);
                      }}
                      className="border border-slate-200 bg-white rounded-lg py-1.5 pl-2 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer"
                    >
                      {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt === 'All' ? 'All Blood Types' : bt}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bulk Action Bar */}
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={filteredRecallDonors.length === 0}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <label htmlFor="selectAll" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                    Select All
                  </label>
                  {hasSelection && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      — {selectedRecallIds.length} of {filteredRecallDonors.length} selected
                    </span>
                  )}
                </div>

                <button
                  onClick={handleBulkRecall}
                  disabled={!hasSelection}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${hasSelection
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md cursor-pointer'
                    : 'bg-slate-100 text-slate-350 cursor-not-allowed border border-slate-200'
                    }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  Trigger Bulk SMS Recall
                  {hasSelection && (
                    <span className="bg-white/20 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ml-0.5">
                      {selectedRecallIds.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Recall Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between min-h-[300px]">
                <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3 font-bold text-center w-12">Select</th>
                      <th className="px-6 py-3 font-bold">Donor ID</th>
                      <th className="px-6 py-3 font-bold">Donor Details</th>
                      <th className="px-6 py-3 font-bold">Blood Type</th>
                      <th className="px-6 py-3 font-bold">Last Donation</th>
                      <th className="px-6 py-3 font-bold">Eligible Date (90 Days)</th>
                      <th className="px-6 py-3 text-center font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRecallDonors.map((donor) => {
                      const daysSince = Math.floor((new Date() - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24));
                      const daysLeft = Math.max(0, 90 - daysSince);
                      const isEligible = daysSince >= 90;
                      const isSoon = !isEligible && daysLeft <= 5;
                      const canRecall = isEligible || isSoon;
                      return (
                        <tr
                          key={donor.id}
                          onClick={() => {
                            if (canRecall) handleSelectOne(donor.id);
                          }}
                          className={`hover:bg-slate-50/50 transition-colors ${canRecall ? 'cursor-pointer' : 'opacity-60'
                            } ${selectedRecallIds.includes(donor.id) ? 'bg-slate-50' : ''}`}
                        >
                          <td className="px-4 py-3.5 text-center w-12" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRecallIds.includes(donor.id)}
                              onChange={() => {
                                if (canRecall) handleSelectOne(donor.id);
                              }}
                              disabled={!canRecall}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                            />
                          </td>
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-400">{donor.id}</td>
                          <td className="px-6 py-3.5">
                            <p className="font-bold text-slate-900">{donor.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">{donor.phone}</p>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">
                              {donor.bloodType}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono font-normal text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{donor.lastDonation}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col gap-1">
                              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide w-fit ${isEligible
                                ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                : isSoon
                                  ? 'bg-orange-50 border border-orange-200 text-orange-700'
                                  : 'bg-amber-50 border border-amber-100 text-amber-700'
                                }`}>
                                {new Date(new Date(donor.lastDonation).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {(() => {
                                const targetTime = new Date(donor.lastDonation).getTime() + 90 * 24 * 60 * 60 * 1000;
                                const diffMs = targetTime - now.getTime();
                                if (diffMs > 0) {
                                  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
                                  return (
                                    <span className="text-[10px] text-amber-600 font-bold font-mono pl-1">
                                      {days}d {hours}h {minutes}m {seconds}s
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-[10px] text-emerald-600 font-bold pl-1">
                                    Ready to Donate
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {isSoon && (
                                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wide animate-pulse">
                                  ● Soon
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRecall(donor.id);
                                }}
                                disabled={!canRecall}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors mx-auto ${isEligible
                                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                                  : isSoon
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  }`}
                              >
                                <Droplets className="w-3 h-3" /> Recall
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredRecallDonors.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-normal">
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          </div>
                          <p className="font-bold text-slate-800 text-xs">No Critical Recalls Required</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {recallSearch || recallBloodFilter !== 'All'
                              ? 'No donors match the current search/filter.'
                              : 'All critical blood type reserves are fully stocked.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Recall Pagination Footer */}
                {filteredRecallDonors.length > 0 && (
                  <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-250 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>
                      Showing {Math.min(filteredRecallDonors.length, (recallPage - 1) * ITEMS_PER_PAGE + 1)} to{' '}
                      {Math.min(filteredRecallDonors.length, recallPage * ITEMS_PER_PAGE)} of {filteredRecallDonors.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRecallPage(p => Math.max(1, p - 1))}
                        disabled={recallPage === 1}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-slate-700 font-bold">
                        Page {recallPage} of {totalRecallPages}
                      </span>
                      <button
                        onClick={() => setRecallPage(p => Math.min(totalRecallPages, p + 1))}
                        disabled={recallPage === totalRecallPages}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── PRINT-ONLY DHQ DOCUMENT STRUCTURE (Official SNBC-M 3-Page Form) ── */}
      {activeDhqDonor && (
        <div className="hidden print:block bg-white text-black p-0 m-0 font-sans text-[10px] leading-tight snbc-print-document">
          <style>{`
            @media print {
              @page {
                size: portrait;
                margin: 0.4in;
              }
              body * {
                visibility: hidden !important;
              }
              .snbc-print-document, .snbc-print-document * {
                visibility: visible !important;
              }
              .snbc-print-document {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                display: block !important;
              }
              .print-page {
                page-break-after: always;
                page-break-inside: avoid;
                min-height: 9.5in;
                position: relative;
              }
              .print-page:last-child {
                page-break-after: avoid;
              }
            }
            .snbc-table th, .snbc-table td {
              border: 1px solid black !important;
              padding: 3px 5px !important;
            }
          `}</style>

          {/* ── PAGE 1: Section I-A & Section I-B (Q1-13) ── */}
          <div className="print-page flex flex-col justify-between">
            <div>
              {/* Header Row */}
              <div className="flex items-center justify-between border-b border-black pb-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center font-bold text-[8px] text-center leading-none">
                    DOH<br />SEAL
                  </div>
                  <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center font-bold text-[8px] text-center leading-none">
                    SNBC<br />SEAL
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase">Republic of the Philippines</p>
                    <p className="text-[10px] font-bold uppercase">Department of Health</p>
                    <p className="text-[9px]">Davao Center for Health Development</p>
                    <p className="text-[10px] font-extrabold uppercase text-red-650">SUB-NATIONAL BLOOD CENTER - MINDANAO</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-[8px] font-bold text-right leading-none">
                    Sleep: _________<br />
                    Meal: _________<br />
                    Meds: _________<br />
                    Allergies: ______
                  </div>
                  <div className="border border-black px-4 py-2 text-[9px] font-bold text-center uppercase tracking-tight">
                    Place Barcode Label Here
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-3">
                <h2 className="text-sm font-black uppercase tracking-wider">BLOOD DONOR’S HEALTH QUESTIONNAIRE</h2>
              </div>

              {/* Date and Venue lines */}
              <div className="grid grid-cols-2 gap-4 mb-3 text-[10px] font-bold">
                <div className="flex gap-1">
                  <span>DATE:</span>
                  <span className="border-b border-black flex-1 font-mono font-normal pl-2">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex gap-1">
                  <span>VENUE:</span>
                  <span className="border-b border-black flex-1 font-normal pl-2">Davao HQ, Bajada</span>
                </div>
              </div>

              <p className="text-[9px] italic mb-3 font-semibold">Instructions: Please fill-out this form legibly from Section I-A to Section I-C.</p>

              {/* I-A: PERSONAL DATA */}
              <div className="mb-4">
                <h3 className="font-bold text-[10px] uppercase bg-black text-white px-2 py-0.5 mb-1">I-A: PERSONAL DATA</h3>
                <table className="w-full border-collapse snbc-table text-[9px]">
                  <tbody>
                    <tr>
                      <td className="w-1/3"><strong>Last Name:</strong> <span className="font-bold text-slate-850 pl-1">{(activeDhqDonor.name || '').split(' ').pop()}</span></td>
                      <td className="w-1/3"><strong>Age:</strong> <span className="font-mono pl-1">{Math.floor((new Date() - new Date(activeDhqDonor.dob || '1998-05-12')) / (1000 * 60 * 60 * 24 * 365.25)) || 25}</span></td>
                      <td className="w-1/3"><strong>Sex:</strong> <span className="pl-1">{activeDhqDonor.sex || 'Female'}</span></td>
                    </tr>
                    <tr>
                      <td><strong>First Name:</strong> <span className="font-bold text-slate-850 pl-1">{(activeDhqDonor.name || '').split(' ')[0]}</span></td>
                      <td><strong>Date of Birth (mm/dd/yy):</strong> <span className="font-mono pl-1">{activeDhqDonor.dob || '—'}</span></td>
                      <td><strong>Civil Status:</strong> <span className="pl-1">{activeDhqDonor.civilStatus || 'Single'}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Middle Name:</strong> <span className="pl-1">{(activeDhqDonor.name || '').split(' ').slice(1, -1).join(' ') || '—'}</span></td>
                      <td colSpan={2}>
                        <strong>Preferred Mailing Address:</strong><br />
                        <span className="inline-block mr-3">[_] Home Address</span> <span>[_] Office Address</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3}>
                        <strong>Address:</strong> <span className="pl-1">{activeDhqDonor.address || 'Davao City'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Contact Numbers:</strong> <span className="font-mono pl-1">{activeDhqDonor.phone}</span></td>
                      <td colSpan={2}><strong>E-mail address:</strong> <span className="font-mono pl-1">{activeDhqDonor.email || '—'}</span></td>
                    </tr>
                    <tr>
                      <td><strong>Occupation:</strong> <span className="pl-1">Professional</span></td>
                      <td><strong>Nationality:</strong> <span className="pl-1">Filipino</span></td>
                      <td><strong>Religion:</strong> <span className="pl-1">Christian</span></td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="bg-slate-50">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <strong>Type of Donor:</strong><br />
                            <span className="mr-3">New to SNBC-M: [_{activeDhqDonor.status === 'New' ? '✓' : ' '}_] YES  [_{activeDhqDonor.status !== 'New' ? '✓' : ' '}_] NO</span>
                            <span>First time: [_{activeDhqDonor.totalDonations <= 1 ? '✓' : ' '}_] YES  [_{activeDhqDonor.totalDonations > 1 ? '✓' : ' '}_] NO</span><br />
                            <span className="mr-3">Repeat/Retained: [_{activeDhqDonor.totalDonations > 1 ? '✓' : ' '}_] YES  [_{activeDhqDonor.totalDonations <= 1 ? '✓' : ' '}_] NO</span>
                            <span>Lapsed: [_{activeDhqDonor.status === 'Lapsed' ? '✓' : ' '}_] YES  [_{activeDhqDonor.status !== 'Lapsed' ? '✓' : ' '}_] NO</span>
                          </div>
                          <div className="border-l border-slate-350 pl-2">
                            <strong>No. of times donated:</strong> <span className="font-bold pl-1">{activeDhqDonor.totalDonations || 1}</span><br />
                            <strong>Date of last donation:</strong> <span className="font-mono pl-1">{activeDhqDonor.lastDonation || '—'}</span><br />
                            <strong>Venue of last donation:</strong> <span className="pl-1">Davao HQ, Bajada</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* I-B: DONOR HISTORY TITLE */}
              <div>
                <h3 className="font-bold text-[10px] uppercase bg-black text-white px-2 py-0.5 mb-1">I-B: DONOR HISTORY</h3>
                <p className="text-[8px] leading-tight mb-2">
                  Instructions: THESE QUESTIONS MUST BE ANSWERED CAREFULLY. They protect you and any patients receiving your blood.
                  A "YES" answer may not necessarily exclude you from blood donation. All donors MUST read the donor educational materials provided by the staff before answering.
                </p>

                <table className="w-full border-collapse snbc-table text-[8.5px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="text-left font-bold w-[82%]">Are you</th>
                      <th className="text-center font-bold w-[9%]">YES</th>
                      <th className="text-center font-bold w-[9%]">NO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 1, q: 'Feeling healthy and well today and not experiencing any signs and symptoms of COVID-19 infection such as colds, cough, fever, sore throat, generalized weakness, and diarrhea?', val: (activeDhqDonor.health || DEFAULT_HEALTH)[0] },
                      { id: 2, q: 'Currently taking medication? Have you taken any medications from the Deferral list?', val: !(activeDhqDonor.health || DEFAULT_HEALTH)[3] },
                      { id: 3, q: 'Have you received any vaccination?', val: false },
                      { id: 0, label: 'In the past three days' },
                      { id: 4, q: 'Have you taken aspirin or anything that has aspirin in it?', val: false },
                      { id: 0, label: 'QUESTION No. 5 FOR FEMALE DONORS: In the past 1 and 1/2 months (6weeks)' },
                      { id: 5, q: 'Have you been pregnant or are you pregnant now? Last menstrual period: ______________', val: false },
                      { id: 0, label: 'In the past 3 months, have you' },
                      { id: 6, q: 'Donated blood, platelets or plasma?', val: !(activeDhqDonor.health || DEFAULT_HEALTH)[4] },
                      { id: 0, label: 'In the past 12 months, have you' },
                      { id: 7, q: 'Had a blood transfusion?', val: !(activeDhqDonor.health || DEFAULT_HEALTH)[2] },
                      { id: 8, q: 'Had surgical operation? Dental operation?', val: !(activeDhqDonor.health || DEFAULT_HEALTH)[2] },
                      { id: 9, q: 'Had a tattoo, ear or body piercing, accidental contact with blood, needle-stick injury and acupuncture?', val: !(activeDhqDonor.health || DEFAULT_HEALTH)[2] },
                      { id: 10, q: 'Had sexual contact with high-risk individuals?', val: false },
                      { id: 11, q: 'Had sexual contact with anyone in exchange material or monetary gain?', val: false },
                      { id: 12, q: 'Had sexual contact with a person who has worked abroad?', val: false },
                      { id: 13, q: 'Engaged in casual sex?', val: false },
                    ].map((row, idx) => {
                      if (row.label) {
                        return (
                          <tr key={`label-${idx}`} className="bg-slate-50 font-bold">
                            <td colSpan={3} className="text-left py-0.5">{row.label}</td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={`q-${row.id}`} className="hover:bg-slate-50">
                          <td className="text-left font-normal">{row.id}. {row.q}</td>
                          <td className="text-center font-bold font-mono"></td>
                          <td className="text-center font-bold font-mono"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Page 1 Footer */}
            <div className="flex justify-between items-center border-t border-black pt-1 text-[8px] font-mono mt-2">
              <span>DOH-DCHD-RD-SNBC-DMS-FORM002</span>
              <span>EFFECTIVITY DATE: JULY 3, 2023</span>
              <span>REVISION: 0</span>
              <span className="font-bold">Page | 1 of 3</span>
            </div>
          </div>

          {/* ── PAGE 2: Section I-B (Q14-29) & Section I-C & Section I-D ── */}
          <div className="print-page flex flex-col justify-between">
            <div>
              <table className="w-full border-collapse snbc-table text-[8.5px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left font-bold w-[82%]">Are you (continued)</th>
                    <th className="text-center font-bold w-[9%]">YES</th>
                    <th className="text-center font-bold w-[9%]">NO</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 14, q: 'Lived with a person who has hepatitis?', val: false },
                    { id: 15, q: 'Have you been imprisoned?', val: false },
                    { id: 16, q: 'Have any of your relatives had Creutzfeldt – Jacob (Mad Cow) disease?', val: false },
                    { id: 0, label: 'Have you ever' },
                    { id: 17, q: 'Travel outside your place of residence for the past year?', val: false },
                    { id: 18, q: 'Travel outside the Philippines?', val: false },
                    { id: 19, q: 'Used needles to take drugs, steroids or anything not prescribed by your doctor?', val: false },
                    { id: 20, q: 'Used clotting factor concentrates?', val: false },
                    { id: 21, q: 'Had a positive test for HIV or Syphilis?', val: false },
                    { id: 22, q: 'Had hepatitis?', val: false },
                    { id: 23, q: 'Had malaria?', val: false },
                    { id: 24, q: 'Been told to have or treated for genital wart, syphilis, gonorrhea, or other Sexually Transmissible Infections?', val: false },
                    { id: 25, q: 'Had any type of cancer? For example, leukemia?', val: false },
                    { id: 26, q: 'Had any problems with your heart or lungs?', val: false },
                    { id: 27, q: 'Had a bleeding condition or a blood disease?', val: false },
                    { id: 28, q: 'Are you giving blood because you want to be tested for HIV or Hepatitis virus?', val: false },
                    { id: 29, q: 'Are you aware that if you have HIV or Hepatitis, you can give it to someone else though you may feel well and have a negative HIV/Hepatitis test?', val: true },
                  ].map((row, idx) => {
                    if (row.label) {
                      return (
                        <tr key={`label2-${idx}`} className="bg-slate-50 font-bold">
                          <td colSpan={3} className="text-left py-0.5">{row.label}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={`q-${row.id}`} className="hover:bg-slate-50">
                        <td className="text-left font-normal">{row.id}. {row.q}</td>
                        <td className="text-center font-bold font-mono"></td>
                        <td className="text-center font-bold font-mono"></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* I-C: DONOR'S INFORMED CONSENT */}
              <div className="mt-3">
                <h3 className="font-bold text-[9px] uppercase bg-black text-white px-2 py-0.5 mb-1">I-C: DONOR'S INFORMED CONSENT</h3>
                <ul className="list-disc pl-4 text-[7.5px] leading-tight space-y-1 text-slate-700">
                  <li>I am the person referred to in all entries, which were read and well understood by me. It is my free and voluntary act to donate my blood, aware of its risks during and after extraction. The same has been explained to me in the understandable language and dialect that I speak.</li>
                  <li>I am voluntarily giving my blood through <strong>Sub-National Blood Center – Mindanao</strong> and I understand that my blood will be tested for Blood Type, Hemoglobin, Malaria, Syphilis, Hepatitis B, Hepatitis C, and HIV and no official result will be issued to me. If found reactive, I agreed to be referred to the appropriate facility for counselling and for further management.</li>
                  <li>I am allowing the <strong>Sub-National Blood Center – Mindanao</strong> and responsible authorities to access my data in accordance with the RA No. 10173 or the Data Privacy Act of 2012.</li>
                  <li>All materials and data might be used for different medical research purposes.</li>
                  <li>I certify that I have to the best of my knowledge, truthfully answered the above questions.</li>
                </ul>

                <div className="mt-3 flex justify-end">
                  <div className="text-center w-64 border-t border-black pt-1">
                    <span className="font-bold text-[8px] uppercase">DONOR’S SIGNATURE OVER PRINTED NAME & DATE</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[8px] font-bold mt-2">
                  <div>Contact Person (other relative/s): ___________________________</div>
                  <div>Address: ______________________________________________</div>
                  <div className="col-span-2">Contact Number: ________________________________________</div>
                </div>
              </div>

              {/* FOR BLOOD DONOR SCREENING OFFICER USE ONLY */}
              <div className="mt-3 border-2 border-black p-2 bg-slate-50/50">
                <h3 className="font-black text-[10px] text-center uppercase tracking-wide border-b border-black pb-1 mb-2">FOR BLOOD DONOR SCREENING OFFICER USE ONLY</h3>

                <h4 className="font-bold text-[9px] uppercase mb-1">I-D: PHYSICAL EXAMINATION</h4>
                <table className="w-full border-collapse snbc-table text-[8.5px] mb-2 bg-white">
                  <tbody>
                    <tr>
                      <td><strong>Body weight:</strong> ________ kg</td>
                      <td><strong>Blood Pressure:</strong> ________ mmHg</td>
                      <td><strong>Pulse rate:</strong> ________ bpm</td>
                      <td><strong>Temp:</strong> ________ °C</td>
                    </tr>
                    <tr>
                      <td colSpan={2}><strong>General Appearance:</strong> ________________________</td>
                      <td colSpan={2}><strong>Skin:</strong> ________________________</td>
                    </tr>
                    <tr>
                      <td colSpan={2}><strong>HEENT:</strong> ________________________</td>
                      <td colSpan={2}><strong>Heart and Lungs:</strong> ________________________</td>
                    </tr>
                  </tbody>
                </table>

                <h4 className="font-bold text-[9px] uppercase mb-1">REMARKS</h4>
                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold border border-black p-2 mb-2 bg-white">
                  <div>[   ] Accepted</div>
                  <div>[   ] Permanently Deferred</div>
                  <div>[   ] Temporarily Deferred</div>
                  <div>[   ] Indefinite Deferral.</div>
                  <div className="col-span-2 border-t border-dashed border-slate-300 pt-1 mt-1">REASON/S: __________________________________________________________________</div>
                </div>

                <div className="flex justify-end mt-2">
                  <div className="text-center w-52 border-t border-black pt-1">
                    <span className="font-bold text-[8px]">Blood Donor Screening Officer Signature</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 Footer */}
            <div className="flex justify-between items-center border-t border-black pt-1 text-[8px] font-mono mt-2">
              <span>DOH-DCHD-RD-SNBC-DMS-FORM002</span>
              <span>EFFECTIVITY DATE: JULY 3, 2023</span>
              <span>REVISION: 0</span>
              <span className="font-bold">Page | 2 of 3</span>
            </div>
          </div>

          {/* ── PAGE 3: Section II & Section I-E & Section I-F ── */}
          <div className="print-page flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[10px] uppercase bg-black text-white px-2 py-0.5 mb-1">II. FOR TECHNICAL MANAGEMENT USE ONLY</h3>

              {/* Place Barcode Labels Row */}
              <div className="grid grid-cols-3 gap-2 mb-3 mt-1">
                <div className="border border-black border-dashed p-4 text-[8px] text-center font-bold uppercase min-h-[50px] flex items-center justify-center">
                  Place Barcode Label Here
                </div>
                <div className="border border-black border-dashed p-4 text-[8px] text-center font-bold uppercase min-h-[50px] flex items-center justify-center">
                  Place Barcode Label Here
                </div>
                <div className="border border-black border-dashed p-4 text-[8px] text-center font-bold uppercase min-h-[50px] flex items-center justify-center">
                  Place Barcode Label Here
                </div>
              </div>

              {/* Columns Grid for Technical Forms */}
              <div className="grid grid-cols-12 gap-3 mb-4">
                {/* Left block (5/12 cols) */}
                <div className="col-span-5 space-y-3">
                  <div className="border border-black p-2">
                    <h4 className="font-extrabold text-[8px] uppercase border-b border-black pb-0.5 mb-1.5">FOR PHLEBOTOMIST USE ONLY</h4>
                    <p className="text-[8px] mb-1">Blood bag: ( S) Single &nbsp;&nbsp; ( D ) Double &nbsp;&nbsp; (T) Triple</p>
                    <p className="text-[8px] mb-1">Segment Number: ___________________</p>
                    <p className="text-[8px] mb-1">Time Started: _______________________</p>
                    <p className="text-[8px] mb-1">Time Ended: ________________________</p>
                    <p className="text-[8px] mb-2">Phlebotomist: ______________________</p>

                    <table className="w-full border-collapse snbc-table text-[8px] bg-white">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="font-bold text-left">TEST</th>
                          <th className="font-bold text-center">RESULT</th>
                          <th className="font-bold text-center">SCREENED BY</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Hemoglobin</td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>Blood Type</td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right block (7/12 cols) */}
                <div className="col-span-7 space-y-3">
                  <div className="border border-black p-2">
                    <h4 className="font-extrabold text-[8px] uppercase border-b border-black pb-0.5 mb-1.5">IMMUNOHEMATOLOGY</h4>
                    <table className="w-full border-collapse snbc-table text-[8px] bg-white">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="font-bold text-left">TEST</th>
                          <th className="font-bold text-center">RESULT</th>
                          <th className="font-bold text-center">SCREENED BY</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Blood Type</td>
                          <td className="text-center font-bold"></td>
                          <td className="text-center"></td>
                        </tr>
                        <tr>
                          <td>Rh Typing</td>
                          <td className="text-center font-bold"></td>
                          <td className="text-center"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="border border-black p-2">
                    <h4 className="font-extrabold text-[8px] uppercase border-b border-black pb-0.5 mb-1.5">SEROLOGY & NAT</h4>
                    <table className="w-full border-collapse snbc-table text-[7.5px] bg-white">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="font-bold text-left">TEST</th>
                          <th className="font-bold text-center">RESULT</th>
                          <th className="font-bold text-center">SCREENED BY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['HBsAg', 'Syphilis', 'HIV', 'HCV', 'Malaria', 'NAT', 'Others:'].map(t => (
                          <tr key={t}>
                            <td>{t}</td>
                            <td></td>
                            <td></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section I-E: POST-DONATION PHLEBOTOMY CARE */}
              <div className="mb-3 border-t border-black pt-2">
                <h3 className="font-bold text-[9px] uppercase mb-1">I-E: POST-DONATION PHLEBOTOMY CARE</h3>
                <p className="font-bold text-[8px] mb-1">Date of Next Donation: ____________________________</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 list-disc pl-4 text-[7px] text-slate-700 leading-tight">
                  <li>Rest and remain in the area for 15 minutes.</li>
                  <li>Increase fluid intake for the next few hours may be up to 24 hours.</li>
                  <li>Have something to eat and drink, or both, before leaving the donor area.</li>
                  <li>Do not drink alcoholic beverages within 24 hours.</li>
                  <li>Do not smoke for the next 3 hours.</li>
                  <li>Leave the bandage on for a few hours.</li>
                  <li>Do not put strong pressure on or try to lift or carry heavy objects with the donating arm for the next few hours.</li>
                  <li>If bleeding occurs from the phlebotomy site, reapply direct pressure until it stops.</li>
                  <li>If you feel dizzy or faint, sit down with your head lowered between your knees or lie down with your feet elevated.</li>
                  <li>If the symptoms continue, return to the blood bank or see your doctor.</li>
                  <li>Refrain from very strenuous activity or hazardous work for a few hours.</li>
                </ul>
              </div>

              {/* Section I-F: CONFIDENTIAL UNIT EXCLUSION (CUE) */}
              <div className="border border-black p-2 bg-slate-50/50 mt-3">
                <h3 className="font-black text-[9px] uppercase border-b border-black pb-0.5 mb-1.5">I-F: CONFIDENTIAL UNIT EXCLUSION (CUE)</h3>
                <p className="text-[7.5px] leading-tight mb-3">
                  If at any point during or after your donation, your blood is not suitable for transfusion, please inform the
                  Sub-National Blood Center - Mindanao Staff. Please use your Blood Donation ID Number and the Segment Number written below in identifying your blood donation.<br />
                  <strong>Contact Number of Sub-National Blood Center-Mindanao: Cellphone No. 09625998457</strong>
                </p>

                <div className="flex justify-between items-end">
                  <div className="space-y-1.5 text-[8px] font-bold">
                    <div>Segment Number: ________________________</div>
                    <div>Date of Donation: _________________________</div>
                    <div>Place of Donation: ________________________</div>
                  </div>
                  <div className="border border-black border-dashed px-5 py-3 text-[8px] font-bold text-center uppercase bg-white">
                    Place Barcode Label Here
                  </div>
                </div>
              </div>
            </div>

            {/* Page 3 Footer */}
            <div className="flex justify-between items-center border-t border-black pt-1 text-[8px] font-mono mt-2">
              <span>DOH-DCHD-RD-SNBC-DMS-FORM002</span>
              <span>EFFECTIVITY DATE: JULY 3, 2023</span>
              <span>REVISION: 0</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE DHQ VIEWER MODAL ── */}
      {activeDhqDonor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col modal-in">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-white font-bold text-sm">Donor Health History (DHQ Part 1)</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Pre-screening health affirmations check for {activeDhqDonor.name}</p>
              </div>
              <button
                onClick={() => setActiveDhqDonor(null)}
                className="text-slate-450 hover:text-white transition-colors cursor-pointer hover:bg-slate-850 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Demographics Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Donor Name</span><span className="font-bold text-slate-900">{activeDhqDonor.name}</span></div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Gender / Age</span><span className="font-bold text-slate-900">{activeDhqDonor.sex || '—'} / {activeDhqDonor.dob || '—'}</span></div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Mobile Phone</span><span className="font-bold text-slate-900">{activeDhqDonor.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Davao Address</span><span className="font-bold text-slate-900">{activeDhqDonor.address || 'Davao City'}</span></div>
              </div>

              {/* Health Checklist Affirmations */}
              <div>
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">Affirmed Health Statements</h4>
                <div className="space-y-2.5">
                  {[
                    'Donor is in good health and feeling well today.',
                    'Donor weighs at least 50 kg.',
                    'Donor has not had major illness, surgery, or tattoo in the last 12 months.',
                    'Donor is not currently taking antibiotics or prescription medication.',
                    'Donor has not donated whole blood in the last 3 months.',
                  ].map((q, i) => {
                    const healthArr = activeDhqDonor.health || DEFAULT_HEALTH;
                    const passed = healthArr[i];
                    return (
                      <div key={i} className="flex items-start justify-between gap-4 p-3 border border-slate-100 rounded-lg bg-white shadow-xs">
                        <span className="text-xs text-slate-700 font-semibold leading-relaxed">{q}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${passed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-[#C21C24] border border-rose-100'
                          }`}>
                          {passed ? 'Passed' : 'Declined'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setActiveDhqDonor(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close View
              </button>
              <button
                onClick={handlePrintDhq}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Pre-filled DHQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LABORATORY RESULTS (Section II / Table 8) ── */}
      {tab === 'laboratory' && (
        <div className="space-y-5 print:hidden fade-in">

          {/* Header block */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Droplets size={16} className="text-indigo-600" />
                Laboratory Test Results — Table 8
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Manage and encode lab-confirmed blood types and serology TTI test outcomes</p>
            </div>
            <button
              onClick={() => {
                setLabForm({
                  donationId: '',
                  hemoglobinResult: '14.5',
                  bloodTypeConfirmed: 'O+',
                  hbsagResult: 'Non-Reactive',
                  syphilisResult: 'Non-Reactive',
                  hivResult: 'Non-Reactive',
                  hcvResult: 'Non-Reactive',
                  malariaResult: 'Non-Reactive',
                  natResult: 'Non-Reactive',
                  othersResult: ''
                });
                setLabSaved(false);
                setShowLabResultModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus size={13} /> Encode Lab Result
            </button>
          </div>

          {/* Lab results table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs font-semibold text-slate-650">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-5 py-3">Test ID</th>
                    <th className="px-5 py-3">Donation ID</th>
                    <th className="px-5 py-3">Confirmed Type</th>
                    <th className="px-5 py-3">Hemoglobin</th>
                    <th className="px-5 py-3">TTI Serology Screen (HBsAg, Syph, HIV, HCV, Malaria, NAT)</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3">Encoded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-normal text-slate-600">
                  {(labTestResults || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-[11px]">
                        No lab results encoded yet. Click <strong>Encode Lab Result</strong> to record one.
                      </td>
                    </tr>
                  ) : (
                    (labTestResults || []).map((res) => {
                      const hasReactive = [
                        res.hbsagResult, res.syphilisResult, res.hivResult,
                        res.hcvResult, res.malariaResult, res.natResult
                      ].some(val => val === 'Reactive');

                      return (
                        <tr key={res.testId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{res.testId}</td>
                          <td className="px-5 py-3.5 font-mono text-slate-550">{res.donationId || '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className="bg-rose-50 border border-rose-100 text-[#C21C24] font-black rounded px-1.5 py-0.5 text-[9px] font-mono">
                              {res.bloodTypeConfirmed}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px]">{res.hemoglobinResult} g/dL</td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                              {[
                                { name: 'HBsAg', val: res.hbsagResult },
                                { name: 'Syph', val: res.syphilisResult },
                                { name: 'HIV', val: res.hivResult },
                                { name: 'HCV', val: res.hcvResult },
                                { name: 'Malaria', val: res.malariaResult },
                                { name: 'NAT', val: res.natResult }
                              ].map((t) => (
                                <span
                                  key={t.name}
                                  className={`px-1.5 py-0.5 rounded border ${t.val === 'Reactive'
                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    }`}
                                >
                                  {t.name}: {t.val}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${hasReactive ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                              {hasReactive ? 'REACTIVE' : 'NON-REACTIVE'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-400 text-[10px]">{res.recordedBy || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── ENCODE LAB RESULT MODAL (Table 8) ── */}
      {showLabResultModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setShowLabResultModal(false); setLabSaved(false); }}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg modal-in" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white rounded-t-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Staff Module · Table 8: Lab Results</p>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight">Encode Laboratory Serology Test Results</h4>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {labSaved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-lg text-xs font-bold text-center">
                  Laboratory results encoded successfully! Confirmed blood type has been updated.
                </div>
              )}

              {/* Donation ID Select list */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Donation Record <span className="text-rose-500">*</span>
                </label>
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Search by Donation ID or Donor ID..."
                    value={labDonationSearchQuery}
                    onChange={e => setLabDonationSearchQuery(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#C21C24] outline-none"
                  />
                </div>
                <select
                  value={labForm.donationId}
                  onChange={e => setLabForm({ ...labForm, donationId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#C21C24] outline-none bg-white"
                >
                  <option value="">-- Select Donation Record --</option>
                  {(donations || [])
                    .filter(d => {
                      const q = labDonationSearchQuery.toLowerCase();
                      // Only show donations that do not yet have a lab result recorded (or allow changing them)
                      const alreadyHasResult = (labTestResults || []).some(r => r.donationId === d.donationId);
                      const matchesQuery = d.donationId.toLowerCase().includes(q) || d.donorId.toLowerCase().includes(q);
                      return matchesQuery && !alreadyHasResult;
                    })
                    .map(d => (
                      <option key={d.donationId} value={d.donationId}>
                        Donation {d.donationId} (Donor: {d.donorId}) - {d.donationDate}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Confirmed Blood Type & Hemoglobin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirmed Blood Type <span className="text-rose-500">*</span></label>
                  <select
                    value={labForm.bloodTypeConfirmed}
                    onChange={e => setLabForm({ ...labForm, bloodTypeConfirmed: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#C21C24] outline-none bg-white"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hemoglobin Result (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="25"
                    value={labForm.hemoglobinResult}
                    onChange={e => setLabForm({ ...labForm, hemoglobinResult: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#C21C24] outline-none bg-white"
                  />
                </div>
              </div>

              {/* TTI tests Grid */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TTI Serology Screener Results</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'hbsagResult', label: 'HBsAg (Hepatitis B)' },
                    { key: 'syphilisResult', label: 'Syphilis (Treponema)' },
                    { key: 'hivResult', label: 'HIV 1/2 + Antigen' },
                    { key: 'hcvResult', label: 'HCV (Hepatitis C)' },
                    { key: 'malariaResult', label: 'Malaria' },
                    { key: 'natResult', label: 'NAT (Nucleic Acid Test)' }
                  ].map(test => (
                    <div key={test.key}>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{test.label}</label>
                      <select
                        value={labForm[test.key]}
                        onChange={e => setLabForm({ ...labForm, [test.key]: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-1.5 text-xs outline-none ${labForm[test.key] === 'Reactive'
                          ? 'border-rose-200 bg-rose-50 text-rose-700 font-bold'
                          : 'border-slate-200 bg-white'
                          }`}
                      >
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                        <option value="NCU">NCU</option>
                        <option value="NS">NS</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 text-xs font-semibold pt-2">
                <button
                  onClick={() => { setShowLabResultModal(false); setLabSaved(false); }}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-655 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >Cancel</button>
                <button
                  onClick={() => {
                    if (!labForm.donationId) return setNoticeModal({ isOpen: true, title: 'No Donation Selected', message: 'Please select a donation record first before encoding lab results.', variant: 'warning' });
                    addLabTestResult(labForm);
                    setLabSaved(true);
                    setLabDonationSearchQuery('');
                    setTimeout(() => {
                      setLabSaved(false);
                      setShowLabResultModal(false);
                    }, 1200);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition shadow-sm cursor-pointer"
                >Encode Result</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── RIGHT SLIDE-IN DRAWER: REGISTER DONOR ── */}
      {/* Backdrop */}
      {/* ── REGISTER DONOR MODAL POPUP ── */}
      {showDrawer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col modal-in">

            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-white font-bold text-sm">Register New Donor</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Table 5: Donors — Fill in the complete donor profile below</p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer hover:bg-slate-800 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">

                {/* Names */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">First Name <span className="text-rose-500">*</span></label>
                    <input
                      required type="text"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={newDonorForm.firstName}
                      onChange={e => setNewDonorForm({ ...newDonorForm, firstName: e.target.value })}
                      placeholder="e.g. Juan"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Middle Name</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={newDonorForm.middleName}
                      onChange={e => setNewDonorForm({ ...newDonorForm, middleName: e.target.value })}
                      placeholder="e.g. P."
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Last Name <span className="text-rose-500">*</span></label>
                    <input
                      required type="text"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={newDonorForm.lastName}
                      onChange={e => setNewDonorForm({ ...newDonorForm, lastName: e.target.value })}
                      placeholder="e.g. Dela Cruz"
                    />
                  </div>
                </div>

                {/* Sex & Civil Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Sex <span className="text-rose-500">*</span></label>
                    <select
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white cursor-pointer"
                      value={newDonorForm.sex}
                      onChange={e => setNewDonorForm({ ...newDonorForm, sex: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Civil Status <span className="text-rose-500">*</span></label>
                    <select
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white cursor-pointer"
                      value={newDonorForm.civilStatus}
                      onChange={e => setNewDonorForm({ ...newDonorForm, civilStatus: e.target.value })}
                    >
                      {['Single', 'Married', 'Widowed', 'Separated', 'Annulled'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Date of Birth <span className="text-rose-500">*</span></label>
                  <input
                    required type="date"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none text-slate-600"
                    value={newDonorForm.dob}
                    onChange={e => setNewDonorForm({ ...newDonorForm, dob: e.target.value })}
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Phone Contact <span className="text-rose-500">*</span></label>
                    <input
                      required type="tel"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={newDonorForm.phone}
                      onChange={e => setNewDonorForm({ ...newDonorForm, phone: e.target.value })}
                      placeholder="+63 9xx xxx xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      value={newDonorForm.email}
                      onChange={e => setNewDonorForm({ ...newDonorForm, email: e.target.value })}
                      placeholder="e.g. juan@gmail.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Address <span className="text-rose-500">*</span></label>
                  <input
                    required type="text"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                    value={newDonorForm.address}
                    onChange={e => setNewDonorForm({ ...newDonorForm, address: e.target.value })}
                    placeholder="e.g. Matina, Davao City"
                  />
                </div>

                {/* Donor Status & Registration Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Donor Status <span className="text-rose-500">*</span></label>
                    <select
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white cursor-pointer"
                      value={newDonorForm.donorStatus}
                      onChange={e => setNewDonorForm({ ...newDonorForm, donorStatus: e.target.value })}
                    >
                      <option value="New">New</option>
                      <option value="Regular">Regular</option>
                      <option value="Lapsed">Lapsed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Registration Date <span className="text-rose-500">*</span></label>
                    <input
                      required type="date"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none text-slate-600"
                      value={newDonorForm.registrationDate}
                      onChange={e => setNewDonorForm({ ...newDonorForm, registrationDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Info note */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">Note:</span> The donor is registered directly under Table 5: Donors of the SNBC system database.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors shadow-sm cursor-pointer"
                >
                  Register Donor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DONOR REGISTRATION SUCCESS MODAL ── */}
      <SuccessModal
        isOpen={registrationSuccess.isOpen}
        title="Donor Registered Successfully"
        message="Profile saved to SNBC-M · Table 5: Donors"
        confirmText="Go to Donor List"
        onClose={() => {
          setRegistrationSuccess({ isOpen: false, donorId: '', donorName: '' });
          setTab('registry');
        }}
        details={[
          { label: "Donor Name", value: registrationSuccess.donorName },
          { label: "Donor ID", value: registrationSuccess.donorId },
          { label: "Record Status", value: "Active · Pending Lab Conf." },
          { label: "Registered On", value: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) }
        ]}
      />

      {/* ── ONSITE SCREENING OUTCOMES MODAL ── */}
      {editingMedicalDonor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Record Onsite Screening Outcome</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Donor: <span className="text-slate-700 font-bold">{editingMedicalDonor.name}</span>
                  <span className="mx-2 text-slate-200">|</span>
                  ID: <span className="font-mono text-slate-500">{editingMedicalDonor.id}</span>
                </p>
              </div>
              <button onClick={() => { setEditingMedicalDonor(null); setEventSearchQuery(''); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* SEARCHABLE DONATION EVENTS LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Link Mobile Blood Donation Event (Table 6) <span className="text-rose-500">*</span>
                  </label>
                  {medicalForm.eventId && (
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 font-mono px-2 py-0.5 rounded font-bold">
                      Selected: {medicalForm.eventId}
                    </span>
                  )}
                </div>

                {/* Filter input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={eventSearchQuery}
                    onChange={e => setEventSearchQuery(e.target.value)}
                    placeholder="Search events by ID, date, province, municipality, or venue..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#C21C24] focus:border-[#C21C24] outline-none bg-slate-50/50"
                  />
                </div>

                {/* Events list container */}
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {(() => {
                    const filtered = (donationEvents || []).filter(ev => {
                      const query = eventSearchQuery.toLowerCase();
                      return (
                        ev.eventId.toLowerCase().includes(query) ||
                        (ev.province || '').toLowerCase().includes(query) ||
                        (ev.cityMunicipality || '').toLowerCase().includes(query) ||
                        (ev.barangayOrganization || '').toLowerCase().includes(query) ||
                        (ev.eventDate || '').includes(query)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No matching donation events found.
                        </div>
                      );
                    }

                    return filtered.map(ev => {
                      const isSelected = medicalForm.eventId === ev.eventId;
                      return (
                        <button
                          key={ev.eventId}
                          type="button"
                          onClick={() => {
                            setMedicalForm(f => ({
                              ...f,
                              eventId: ev.eventId,
                              donationDate: ev.eventDate || '',
                              province: ev.province || '',
                              cityMunicipality: ev.cityMunicipality || '',
                              barangayOrganization: ev.barangayOrganization || ''
                            }));
                          }}
                          className={`w-full text-left p-3 text-xs flex justify-between items-center transition-all ${isSelected
                            ? 'bg-red-50/70 border-l-4 border-red-600 text-red-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span className="font-mono text-[10px]">{ev.eventId}</span>
                              <span className="text-slate-300">|</span>
                              <span>{ev.barangayOrganization || 'No Venue'}</span>
                            </div>
                            <div className="text-[10px] text-slate-450 mt-0.5">
                              {ev.cityMunicipality}, {ev.province}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${isSelected ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-650'
                              }`}>
                              {ev.eventDate}
                            </span>
                          </div>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Event details summary */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] font-semibold text-slate-600">
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase tracking-wider mb-0.5">Date</span>
                  <span className="font-mono">{medicalForm.donationDate || '—'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase tracking-wider mb-0.5">Province</span>
                  <span>{medicalForm.province || '—'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase tracking-wider mb-0.5">City / Mun.</span>
                  <span>{medicalForm.cityMunicipality || '—'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase tracking-wider mb-0.5">Barangay / Venue</span>
                  <span>{medicalForm.barangayOrganization || '—'}</span>
                </div>
              </div>

              {/* SECTION I-D: Screening Outcome */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-white bg-blue-600 px-2 py-0.5 rounded">Section I-D</span>
                  <span className="text-xs font-bold text-slate-700">Screening & Deferral Outcome</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Screening Outcome</label>
                    <select value={medicalForm.screeningOutcome} onChange={e => setMedicalForm({ ...medicalForm, screeningOutcome: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none bg-white">
                      {['Accepted', 'Temporarily Deferred', 'Permanently Deferred', 'Indefinite Deferral'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  {medicalForm.screeningOutcome !== 'Accepted' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deferral Reason</label>
                        <input type="text" value={medicalForm.deferralReason} onChange={e => setMedicalForm({ ...medicalForm, deferralReason: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none" placeholder="e.g. Low Hemoglobin" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deferral End Date</label>
                        <input type="date" value={medicalForm.deferralEndDate} onChange={e => setMedicalForm({ ...medicalForm, deferralEndDate: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#C21C24] outline-none" />
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <p className="text-[10px] text-slate-400">
                Onsite screening decisions will update the donor's eligibility status.
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setEditingMedicalDonor(null); setEventSearchQuery(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-655 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const updatedStatus = medicalForm.screeningOutcome === 'Accepted' ? 'Regular' : 'Deferred';
                    const remarks = medicalForm.screeningOutcome === 'Accepted' ? 'Eligible for Donation' : medicalForm.deferralReason || 'Deferred';
                    
                    updateDonorMedical(editingMedicalDonor.id, {
                      ...medicalForm,
                      status: updatedStatus,
                      remarks
                    });

                    const donorName = editingMedicalDonor.name;
                    const donorId = editingMedicalDonor.id;
                    const savedForm = { ...medicalForm };

                    setEditingMedicalDonor(null);
                    setEventSearchQuery('');

                    setScreeningSuccessModal({
                      isOpen: true,
                      donorId,
                      donorName,
                      outcome: savedForm.screeningOutcome,
                      remarks,
                      eventId: savedForm.eventId || 'EVT-001',
                      venue: savedForm.barangayOrganization || savedForm.cityMunicipality || 'Davao City',
                      donationDate: savedForm.donationDate || new Date().toISOString().slice(0, 10)
                    });
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#C21C24] hover:bg-[#A8181F] rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer">
                  <CheckCircle className="w-3.5 h-3.5" /> Save Onsite Screening
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ONSITE SCREENING SUCCESS CONFIRMATION MODAL ── */}
      <SuccessModal
        isOpen={screeningSuccessModal.isOpen}
        title="Screening Outcome Recorded"
        message={`Onsite screening decisions updated for ${screeningSuccessModal.donorName}`}
        confirmText="Acknowledge & Close"
        onClose={() => setScreeningSuccessModal({ isOpen: false, donorId: '', donorName: '', outcome: '', remarks: '', eventId: '', venue: '', donationDate: '' })}
        details={[
          { label: "Donor ID", value: screeningSuccessModal.donorId },
          { label: "Outcome", value: screeningSuccessModal.outcome },
          { label: "Linked Event", value: `${screeningSuccessModal.venue} (${screeningSuccessModal.eventId})` },
          { label: "Remarks", value: screeningSuccessModal.remarks }
        ]}
      />

      {/* ── SMS RECALL CONFIRMATION & SUCCESS MODALS ── */}
      <ConfirmationModal
        isOpen={recallConfirm.isOpen}
        title={recallConfirm.isBulk ? "Dispatch Bulk Recall?" : "Dispatch Recall SMS?"}
        message={recallConfirm.isBulk 
          ? `This will dispatch recall alerts to all ${recallConfirm.donorName} via Semaphore Gateway. Please confirm to proceed.`
          : `This will dispatch a recall SMS to ${recallConfirm.donorName}. Please confirm to proceed.`}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => {
          const donorName = recallConfirm.donorName;
          const isBulk = recallConfirm.isBulk;
          setRecallConfirm({ isOpen: false, donorId: '', donorName: '', isBulk: false });
          if (isBulk) {
            setSelectedRecallIds([]);
            setRecallSuccess({
              isOpen: true,
              message: `Bulk SMS recall successfully dispatched via Semaphore Gateway.`
            });
          } else {
            setRecallSuccess({
              isOpen: true,
              message: `Recall SMS has been dispatched via Semaphore Gateway to ${donorName}.`
            });
          }
        }}
        onCancel={() => setRecallConfirm({ isOpen: false, donorId: '', donorName: '', isBulk: false })}
      />

      <SuccessModal
        isOpen={recallSuccess.isOpen}
        title="Dispatched Successfully"
        message={recallSuccess.message}
        confirmText="Acknowledge & Close"
        onClose={() => setRecallSuccess({ isOpen: false, message: '' })}
      />

      {/* ── NOTICE / VALIDATION MODAL ── */}
      <ConfirmationModal
        isOpen={noticeModal.isOpen}
        title={noticeModal.title}
        message={noticeModal.message}
        confirmText="Got It"
        cancelText=""
        variant={noticeModal.variant}
        onConfirm={() => setNoticeModal({ isOpen: false, title: '', message: '', variant: 'warning' })}
        onCancel={() => setNoticeModal({ isOpen: false, title: '', message: '', variant: 'warning' })}
      />

    </div>
  );
}
