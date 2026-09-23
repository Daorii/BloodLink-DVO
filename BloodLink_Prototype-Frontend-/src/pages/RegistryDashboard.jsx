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
  Stethoscope,
  Eye,
  History,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import ConfirmModal from '../components/ConfirmModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessModal from '../components/SuccessModal';
import { firstValidationError, isAtLeastAge, isPhilippineMobile, isPastOrToday, isValidEmail, sanitizePhone } from '../utils/validation';
import TablePagination from '../components/TablePagination';

const BLOOD_TYPES = ['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const ITEMS_PER_PAGE = 5;

// Default pre-populated questions for sample donors in dataset who don't have health arrays
const DEFAULT_HEALTH = [true, true, true, true, true];

export default function RegistryDashboard() {
  const { donors, inventory, bloodInventory, addDonor, updateDonor, updateDonorMedical, donationEvents, authSystemUser, labTestResults, donations, recalls, addLabTestResult, recordDonation, isSidebarCollapsed, toggleSidebar, fetchDonorsFromAPI, fetchDonationEventsFromAPI, fetchDonationsFromAPI, fetchLabResultsFromAPI, fetchRecallsFromAPI, fetchBloodInventoryFromAPI, dispatchRecallSMS, dispatchBulkRecallSMS, updateRecallResponse } = useBloodStore();

  // Dynamically prepare donor lastDonation dates relative to today's date for demo purposes
  const preparedDonors = useMemo(() => {
    return donors.map((d, index) => {
      let lastDon = d.lastDonation;
      // If donor does not have a recorded lastDonation date, generate demo offsets
      if (!lastDon && index % 2 === 1 && d.status !== 'Deferred') {
        const date = new Date();
        const offsetDays = 30 + (index % 4) * 15; // 30, 45, 60, 75 days ago
        date.setDate(date.getDate() - offsetDays);
        lastDon = date.toISOString().slice(0, 10);
      }
      return { ...d, lastDonation: lastDon };
    });
  }, [donors]);

  const [tab, setTab] = useState(authSystemUser?.role === 'Serology Staff' ? 'laboratory' : 'registry');
  const [searchQuery, setSearchQuery] = useState('');

  // Recall tab search/filter
  const [recallSearch, setRecallSearch] = useState('');
  const [recallBloodFilter, setRecallBloodFilter] = useState('All');
  const [recallStatusFilter, setRecallStatusFilter] = useState('All'); // All | Eligible Now | Eligible Soon | Not Yet
  const [recallDonationFilter, setRecallDonationFilter] = useState('All'); // All | Regular (4+) | Occasional
  // Dispatch modal state
  const [recallDispatchModal, setRecallDispatchModal] = useState({ isOpen: false, donorId: '', donorName: '', isBulk: false });
  const [recallReason, setRecallReason] = useState('Critical Shortage Match');
  const [recallMessage, setRecallMessage] = useState('');
  // Mark Response modal
  const [markResponseModal, setMarkResponseModal] = useState({ isOpen: false, recallId: null, current: '' });


  // Pagination states
  const [registryPage, setRegistryPage] = useState(1);
  const [recallPage, setRecallPage] = useState(1);
  const [labPage, setLabPage] = useState(1);
  const [recallHistoryPage, setRecallHistoryPage] = useState(1);

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
  const [editingRegistryDonor, setEditingRegistryDonor] = useState(null);
  const [editDonorForm, setEditDonorForm] = useState({ firstName: '', middleName: '', lastName: '', sex: 'Female', civilStatus: 'Single', dob: '', contactNumber: '', email: '', address: '' });
  const [editDonorSaving, setEditDonorSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', confirmText: 'Confirm', variant: 'default', onConfirm: null });
  const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false, onConfirm: null }));

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
  const [viewingDonorProfile, setViewingDonorProfile] = useState(null); // donor object for history modal
  const [expandedDonations, setExpandedDonations] = useState(new Set()); // which donation cards are open

  // Lab Results (Table 8) modal state
  const [showLabResultModal, setShowLabResultModal] = useState(false);
  const [labSaved, setLabSaved] = useState(false);
  const [labDonationSearchQuery, setLabDonationSearchQuery] = useState('');
  const [labForm, setLabForm] = useState({
    donorId: '',
    donorName: '',
    eventId: '',
    donationDate: new Date().toISOString().slice(0, 10),
    serialNumber: '',        // typed manually from the physical DHQ form
  });

  const [medicalForm, setMedicalForm] = useState({
    // Table 7  -  Donation Record fields
    eventId: 'EVT-001',
    // Table 6 / 7 shared  -  Event context
    donationDate: '',
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    barangayOrganization: 'Buhangin',
    // Table 7  -  Screening Outcome
    screeningOutcome: 'Accepted',
    deferralReason: '',
    deferralEndDate: '',
    // Table 8  -  Lab Results
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

  // Load donors and donation events from Laravel API on mount
  useEffect(() => {
    fetchDonorsFromAPI();
    fetchDonationEventsFromAPI();
    fetchDonationsFromAPI();
    fetchLabResultsFromAPI();
    fetchRecallsFromAPI();
    fetchBloodInventoryFromAPI();
  }, []);

  useEffect(() => {
    if (editingMedicalDonor) {
      // Pull the donor's actual donation record (not the donor object, which doesn't have event/outcome fields)
      const donorNumId = parseInt(String(editingMedicalDonor.id ?? '').replace(/^D0*/i, ''), 10);
      const existingDonation = (donations || []).find(d =>
        parseInt(String(d.donorId ?? d.donor_id ?? ''), 10) === donorNumId
      );
      setMedicalForm(prev => ({
        ...prev,
        eventId: existingDonation?.eventId ?? existingDonation?.event_id ?? '',
        donationDate: existingDonation?.donationDate ?? existingDonation?.donation_date ?? '',
        province: existingDonation?.province ?? '',
        cityMunicipality: existingDonation?.cityMunicipality ?? existingDonation?.city_municipality ?? '',
        barangayOrganization: existingDonation?.barangayOrganization ?? existingDonation?.barangay_organization ?? '',
        screeningOutcome: existingDonation?.screeningOutcome ?? existingDonation?.screening_outcome ?? 'Accepted',
        deferralReason: existingDonation?.deferralReason ?? existingDonation?.deferral_reason ?? '',
        deferralEndDate: existingDonation?.deferralEndDate ?? existingDonation?.deferral_end_date ?? '',
      }));
    }
  }, [editingMedicalDonor, donations]);

  // Live countdown state for real-time donor rest interval ticking
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const validationError = firstValidationError([
      ['Enter a valid first and last name.', newDonorForm.firstName.trim().length >= 2 && newDonorForm.lastName.trim().length >= 2],
      ['The donor must be at least 18 years old.', isAtLeastAge(newDonorForm.dob)],
      ['Enter a valid Philippine mobile number.', isPhilippineMobile(newDonorForm.phone)],
      ['Enter a valid email address or leave it blank.', isValidEmail(newDonorForm.email)],
      ['Enter a complete address.', newDonorForm.address.trim().length >= 5],
      ['Registration date cannot be in the future.', isPastOrToday(newDonorForm.registrationDate)],
    ]);
    if (validationError) {
      setNoticeModal({ isOpen: true, title: 'Check Donor Details', message: validationError, variant: 'warning' });
      return;
    }
    const fullName = `${newDonorForm.firstName} ${newDonorForm.middleName ? newDonorForm.middleName + ' ' : ''}${newDonorForm.lastName}`.trim();
    
    // Duplicate check: same full name AND same date of birth = true duplicate.
    // Phone/email alone are NOT reliable identifiers (family members share phones).
    const isDuplicate = donors.some(d => {
      const nameMatch = d.name && d.name.toLowerCase() === fullName.toLowerCase();
      const dobMatch  = newDonorForm.dob && (d.dob === newDonorForm.dob || d.birthDate === newDonorForm.dob);
      return nameMatch && dobMatch;
    });

    if (isDuplicate) {
      setNoticeModal({
        isOpen: true,
        title: 'Duplicate Entry Detected',
        message: `A donor named "${fullName}" with the same date of birth is already registered in the system. Please verify the existing record before adding a new one.`,
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
    try {
      await addDonor(newDonor);
    } catch (error) {
      setNoticeModal({ isOpen: true, title: 'Donor Was Not Registered', message: error?.data?.message || error?.message || 'Please correct the information and try again.', variant: 'warning' });
      return;
    }
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

  const openDonorEdit = (donor) => {
    const nameParts = String(donor.name || '').trim().split(/\s+/);
    setEditingRegistryDonor(donor);
    setEditDonorForm({
      firstName: donor.firstName || nameParts[0] || '',
      middleName: donor.middleName || '',
      lastName: donor.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1].replace(/\.$/, '') : ''),
      sex: donor.sex || 'Female',
      civilStatus: donor.civilStatus || 'Single',
      dob: donor.dob || donor.birthDate || '',
      contactNumber: donor.contactNumber || donor.phone || '',
      email: donor.email || '',
      address: donor.address || '',
    });
  };

  const doSaveDonorEdit = async () => {
    if (!editingRegistryDonor) return;
    const validationError = firstValidationError([
      ['Enter a valid first and last name.', editDonorForm.firstName.trim().length >= 2 && editDonorForm.lastName.trim().length >= 2],
      ['The donor must be at least 18 years old.', isAtLeastAge(editDonorForm.dob)],
      ['Enter a valid Philippine mobile number.', isPhilippineMobile(editDonorForm.contactNumber)],
      ['Enter a valid email address or leave it blank.', isValidEmail(editDonorForm.email)],
      ['Enter a complete address.', editDonorForm.address.trim().length >= 5],
    ]);
    if (validationError) {
      setNoticeModal({ isOpen: true, title: 'Check Donor Details', message: validationError, variant: 'warning' });
      return;
    }
    setEditDonorSaving(true);
    const result = await updateDonor(editingRegistryDonor.id, editDonorForm);
    setEditDonorSaving(false);
    if (result.success) {
      setEditingRegistryDonor(null);
      await fetchDonorsFromAPI();
    } else {
      setNoticeModal({ isOpen: true, title: 'Could Not Save Donor', message: result.error || 'Please try again.', variant: 'danger' });
    }
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

  // Donation Records tab pagination
  const allDonations       = donations || [];
  const totalLabPages      = Math.max(1, Math.ceil(allDonations.length / ITEMS_PER_PAGE));
  const labStart           = (labPage - 1) * ITEMS_PER_PAGE;
  const pagedDonations     = allDonations.slice(labStart, labStart + ITEMS_PER_PAGE);

  // Donor Recall Logic
  // Determine critical blood types from real API inventory (Available PRBC units by blood type)
  const SAFE_THRESHOLD_RECALL = { 'O+': 50, 'O-': 100, 'A+': 50, 'A-': 50, 'B+': 50, 'B-': 50, 'AB+': 50, 'AB-': 50 };
  const EMERGENCY_RESERVED_RECALL = { 'O+': 10, 'O-': 10, 'A+': 10, 'A-': 10, 'B+': 10, 'B-': 10, 'AB+': 5, 'AB-': 5 };

  const criticalBloodTypes = useMemo(() => {
    // Count Available PRBC units per blood type from the real inventory
    const counts = {};
    (bloodInventory || []).filter(u => u.inventoryStatus === 'Available' && u.component === 'PRBC').forEach(u => {
      const bt = u.bloodType ?? u.bloodTypeId;
      if (bt) counts[bt] = (counts[bt] || 0) + 1;
    });
    // A blood type is "critical" if PRBC count is below safe threshold
    return Object.entries(SAFE_THRESHOLD_RECALL)
      .filter(([bt, safe]) => (counts[bt] || 0) < safe)
      .map(([bt]) => bt);
  }, [bloodInventory]);

  const recallDonors = useMemo(() => {
    // Show all eligible donors (have lastDonation + not Deferred)
    // criticalBloodTypes is used only for visual badges, not to filter here
    return preparedDonors.filter(d =>
      d.lastDonation && d.lastDonation !== '' && d.status !== 'Deferred'
    );
  }, [preparedDonors]);

  // Filtered recall donors (search + filters + sorted)
  const filteredRecallDonors = useMemo(() => {
    const today = new Date();
    const withDays = recallDonors.map(d => {
      const daysSince = d.lastDonation
        ? Math.floor((today - new Date(d.lastDonation)) / (1000 * 60 * 60 * 24))
        : -1;
      const daysLeft = daysSince >= 0 ? Math.max(0, 90 - daysSince) : 999;
      const eligible = daysSince >= 90;
      const soon = !eligible && daysLeft <= 5 && daysSince >= 0;
      return { ...d, daysSince, daysLeft, eligible, soon };
    });

    return withDays.filter(d => {
      const matchesSearch =
        d.name.toLowerCase().includes(recallSearch.toLowerCase()) ||
        d.id.toLowerCase().includes(recallSearch.toLowerCase()) ||
        d.bloodType.toLowerCase().includes(recallSearch.toLowerCase());
      const matchesBlood = recallBloodFilter === 'All' || d.bloodType === recallBloodFilter;
      const matchesStatus =
        recallStatusFilter === 'All' ? true :
        recallStatusFilter === 'Eligible Now'  ? d.eligible :
        recallStatusFilter === 'Eligible Soon' ? d.soon :
        !d.eligible && !d.soon;
      const donationCount = d.donationCount ?? d.totalDonations ?? 0;
      const matchesDonation =
        recallDonationFilter === 'All' ? true :
        recallDonationFilter === 'Regular (4+)' ? donationCount >= 4 :
        donationCount < 4;
      return matchesSearch && matchesBlood && matchesStatus && matchesDonation;
    }).sort((a, b) => {
      // Eligible Soon (0-5 days left) first, then Eligible Now, then rest by days left asc
      const aPriority = a.soon ? 0 : a.eligible ? 1 : 2;
      const bPriority = b.soon ? 0 : b.eligible ? 1 : 2;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.daysLeft - b.daysLeft;
    });
  }, [recallDonors, recallSearch, recallBloodFilter, recallStatusFilter, recallDonationFilter]);

  // Paginated Recall Donors
  const paginatedRecallDonors = useMemo(() => {
    const start = (recallPage - 1) * ITEMS_PER_PAGE;
    return filteredRecallDonors.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecallDonors, recallPage]);

  const totalRecallPages = Math.max(1, Math.ceil(filteredRecallDonors.length / ITEMS_PER_PAGE));
  const paginatedRecalls = (recalls || []).slice((recallHistoryPage - 1) * ITEMS_PER_PAGE, recallHistoryPage * ITEMS_PER_PAGE);

  // Individual SMS Recall — open rich dispatch modal
  const handleRecall = (id) => {
    const donorObj = preparedDonors.find(d => d.id === id);
    const bt = donorObj?.bloodType ?? '';
    setRecallReason('Critical Shortage Match');
    setRecallMessage(
      `Hi ${donorObj?.name?.split(' ')[0] ?? 'Donor'}, BloodLink SNBC-DVO: you are eligible to donate again. ` +
      `Your blood type ${bt} is currently needed. Please visit the SPMC Blood Bank at your earliest convenience. Thank you!`
    );
    setRecallDispatchModal({ isOpen: true, donorId: id, donorName: donorObj?.name || id, isBulk: false });
  };

  // Bulk SMS Recall — open rich dispatch modal
  const handleBulkRecall = () => {
    if (selectedRecallIds.length === 0) return;
    setRecallReason('Critical Shortage Match');
    setRecallMessage(
      `Hi [Donor], BloodLink SNBC-DVO: you are eligible to donate again and your blood type is urgently needed. ` +
      `Please visit the SPMC Blood Bank at your earliest convenience. Thank you!`
    );
    setRecallDispatchModal({ isOpen: true, donorId: '', donorName: `${selectedRecallIds.length} Donors`, isBulk: true });
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

      {/*  -  -  - Ã‚  -  -  -  - Ã‚  -  SIDEBAR  -  -  - Ã‚  -  -  -  - Ã‚  -  */}
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
                title={isSidebarCollapsed ? "Donation Records" : ""}
              >
                <Droplets className="nav-icon" />
                <span className="sidebar-copy">Donation Records</span>
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

      {/*  -  -  - Ã‚  -  -  -  - Ã‚  -  CONTENT AREA  -  -  - Ã‚  -  -  -  - Ã‚  -  */}
      <div className={`content-area flex flex-col flex-1 h-screen bg-slate-50 print:hidden ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>

        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 print:hidden">
          <div>
            <h2 className="text-slate-900 font-bold text-sm leading-tight">
              {tab === 'registry' ? 'Donor Database Registry' : tab === 'recall' ? 'SMS Recall Operations' : 'Laboratory Serology Results (Section II)'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
              {tab === 'registry' ? 'Manage registered donor logs and statuses' : tab === 'recall' ? 'Targeted dispatch for critical shortages' : 'Record and manage lab-confirmed serology & TTI screening results (Serology Staff workspace)'}
            </p>
          </div>

          <div className="flex items-center gap-3">

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

          {/*  -  -  - Ã‚  -  -  -  - Ã‚  -  TAB 1: DONOR REGISTRY  -  -  - Ã‚  -  -  -  - Ã‚  -  */}
          {tab === 'registry' && (
            <div className="space-y-5 print:hidden">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active Donor Profiles</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Review eligibility, view medical checklist histories, and print pre-filled DHQ forms.</p>
                </div>
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={() => setShowDrawer(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register Donor
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
                                onClick={() => setViewingDonorProfile(donor)}
                                title="View donation history"
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-indigo-100"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={() => openDonorEdit(donor)}
                                title="Edit donor profile"
                                className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
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

          {/*  -  -  - Ã‚  -  -  -  - Ã‚  -  TAB 2: RECALL OPERATIONS  -  -  - Ã‚  -  -  -  - Ã‚  -  */}
          {tab === 'recall' && (
            <div className="space-y-5 print:hidden">


              {/* Recall Controls Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Recall Candidates</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {filteredRecallDonors.length} donor{filteredRecallDonors.length !== 1 ? 's' : ''} found · sorted by eligibility
                    </p>
                  </div>
                </div>

                {/* Search + Filters */}
                <div className="flex items-center gap-2 flex-wrap">
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
                  <div className="flex items-center gap-1">
                    <select
                      value={recallStatusFilter}
                      onChange={(e) => { setRecallStatusFilter(e.target.value); setRecallPage(1); }}
                      className="border border-slate-200 bg-white rounded-lg py-1.5 pl-2 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Eligible Now">Eligible Now</option>
                      <option value="Eligible Soon">Eligible Soon (≤5 days)</option>
                      <option value="Not Yet">Not Yet Eligible</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      value={recallDonationFilter}
                      onChange={(e) => { setRecallDonationFilter(e.target.value); setRecallPage(1); }}
                      className="border border-slate-200 bg-white rounded-lg py-1.5 pl-2 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer"
                    >
                      <option value="All">All Donors</option>
                      <option value="Regular (4+)">Regular (4+ donations)</option>
                      <option value="Occasional">Occasional (&lt;4 donations)</option>
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
                       -  {selectedRecallIds.length} of {filteredRecallDonors.length} selected
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
                                   -  -  - Ã¢â‚¬ Ãƒâ€šÃ‚  Soon
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

              {/* Recall Dispatch History */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Recall Dispatch History</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{recalls.length} record(s) â€” pulled from database</p>
                  </div>
                  <button onClick={fetchRecallsFromAPI} className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-slate-650 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] text-slate-400 tracking-wider">
                        <th className="px-5 py-3">Recall ID</th>
                        <th className="px-5 py-3">Donor</th>
                        <th className="px-5 py-3">Blood Type</th>
                        <th className="px-5 py-3">Contact</th>
                        <th className="px-5 py-3">Recall Date</th>
                        <th className="px-5 py-3">Reason</th>
                        <th className="px-5 py-3 text-center">SMS Status</th>
                        <th className="px-5 py-3 text-center">Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recalls.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-[11px]">
                            <RefreshCw className="w-5 h-5 mx-auto mb-1.5 opacity-20" />
                            No recalls dispatched yet. Use the table above to send SMS recall alerts.
                          </td>
                        </tr>
                      ) : (
                        paginatedRecalls.map(r => (
                          <tr key={r.recallId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-mono font-bold text-slate-400 text-[10px]">
                              REC-{String(r.recallId ?? r.recall_id ?? '').padStart(3,'0')}
                            </td>
                            <td className="px-5 py-3">
                              <p className="font-bold text-slate-800">{r.donorName ?? '-'}</p>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">
                                {r.bloodType ?? '-'}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-slate-500 text-[10px]">{r.donorPhone ?? '-'}</td>
                            <td className="px-5 py-3 font-mono text-slate-500 text-[10px]">{r.recallDate ?? '-'}</td>
                            <td className="px-5 py-3 text-slate-600 text-[10px]">{r.recallReason ?? 'Critical Shortage Match'}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                r.smsStatus === 'Sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.smsStatus === 'Failed' ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {r.smsStatus ?? 'Pending'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  r.donorResponse === 'Committed'   ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                                  r.donorResponse === 'Declined'    ? 'bg-rose-50 border border-rose-200 text-rose-700' :
                                  r.donorResponse === 'No Response' ? 'bg-slate-100 border border-slate-200 text-slate-500' :
                                  'text-slate-300'
                                }`}>
                                  {r.donorResponse ?? '-'}
                                </span>
                                <select
                                  defaultValue=""
                                  onChange={async (e) => {
                                    if (!e.target.value) return;
                                    const val = e.target.value;
                                    e.target.value = '';
                                    try { await updateRecallResponse(r.recallId ?? r.recall_id, val); }
                                    catch { /* silent */ }
                                  }}
                                  className="text-[9px] border border-slate-200 rounded px-1 py-0.5 text-slate-500 bg-white cursor-pointer focus:outline-none hover:border-slate-400 transition"
                                >
                                  <option value="">Mark…</option>
                                  <option value="Committed">Committed</option>
                                  <option value="Declined">Declined</option>
                                  <option value="No Response">No Response</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <TablePagination total={recalls.length} page={recallHistoryPage} pageSize={ITEMS_PER_PAGE} onPageChange={setRecallHistoryPage} label="records" />
              </div>

            </div>
          )}

          {/*  -  -  - Ã‚  -  -  -  - Ã‚  -  TAB 3: LABORATORY RESULTS (Section II / Table 8)  -  -  - Ã‚  -  -  -  - Ã‚  -  */}
          {tab === 'laboratory' && (
            <div className="space-y-5 print:hidden fade-in">

              {/* Header block */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Droplets size={16} className="text-indigo-600" />
                    Donation Records
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Donations recorded by Registry — serial numbers and screening status</p>
                </div>
                <button
                  onClick={() => {
                    setLabForm({
                      donorId: '',
                      donorName: '',
                      eventId: '',
                      donationDate: new Date().toISOString().slice(0, 10),
                      serialNumber: '',   // staff types this from the physical DHQ
                    });
                    setLabSaved(false);
                    setShowLabResultModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={13} /> Record Donation
                </button>
              </div>

              {/* Lab results cards */}
              <div className="space-y-2">
                {(donations || []).length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 shadow-sm">
                    <Droplets className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-semibold">No donation records yet.</p>
                    <p className="text-[10px] mt-1">Click <strong>Record Donation</strong> to add the first record.</p>
                  </div>
                ) : (
                    <>
                      {pagedDonations.map((don) => {
                        const hasLab = don.hasLabResult;
                        const outcome = don.screeningOutcome ?? don.screening_outcome;
                        return (
                          <div key={don.donationId || don.donation_id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                              <div className="flex items-center gap-4 flex-wrap">
                                <div>
                                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Donation ID</span>
                                  <span className="font-mono font-bold text-slate-800 text-xs">{don.donationId}</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div>
                                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Serial No.</span>
                                  <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                                    {don.serialNumber || '—'}
                                  </span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div>
                                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Donor</span>
                                  <span className="font-semibold text-slate-700 text-xs">{don.donorName || '—'}</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div>
                                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Event</span>
                                  <span className="font-mono text-slate-600 text-xs">{don.eventId || '—'}</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div>
                                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                                  <span className="font-mono text-slate-600 text-xs">{don.donationDate || '—'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {outcome && (
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                                    outcome === 'Accepted'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {outcome}
                                  </span>
                                )}
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                                  hasLab
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {hasLab ? '✓ Lab Done' : '⏳ Pending Lab'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Donation Records Pagination */}
                      {allDonations.length > ITEMS_PER_PAGE && (
                        <div className="bg-slate-50 px-6 py-3.5 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>
                            Showing {Math.min(allDonations.length, labStart + 1)} to{' '}
                            {Math.min(allDonations.length, labStart + ITEMS_PER_PAGE)} of {allDonations.length} records
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setLabPage(p => Math.max(1, p - 1))}
                              disabled={labPage === 1}
                              className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-slate-700 font-bold">Page {labPage} of {totalLabPages}</span>
                            <button
                              onClick={() => setLabPage(p => Math.min(totalLabPages, p + 1))}
                              disabled={labPage === totalLabPages}
                              className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                )}
              </div>

            </div>
          )}
        </main>
      </div>

      {/* ── SMS RECALL DISPATCH MODAL (rich — with editable message + reason) ── */}
      {recallDispatchModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">⚠ Recall Dispatch</p>
                <h3 className="text-sm font-bold text-slate-900">
                  {recallDispatchModal.isBulk ? `Bulk Recall — ${recallDispatchModal.donorName}` : `Recall SMS — ${recallDispatchModal.donorName}`}
                </h3>
              </div>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Reason */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Recall Reason</label>
                <select
                  value={recallReason}
                  onChange={e => setRecallReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50"
                >
                  <option>Critical Shortage Match</option>
                  <option>Emergency Hospital Request</option>
                  <option>Scheduled Mobilization Drive</option>
                  <option>Rare Blood Type Needed</option>
                  <option>Routine Recall</option>
                </select>
              </div>
              {/* SMS Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SMS Message</label>
                  <span className={`text-[10px] font-mono font-bold ${recallMessage.length > 160 ? 'text-red-600' : recallMessage.length > 140 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {recallMessage.length}/160
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={160}
                  value={recallMessage}
                  onChange={e => setRecallMessage(e.target.value)}
                  className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {recallDispatchModal.isBulk
                    ? 'This message will be sent to all selected donors. [Donor] will be replaced with their first name for individual sends.'
                    : 'This is the exact message that will be sent via PhilSMS.'}
                </p>
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setRecallDispatchModal({ isOpen: false, donorId: '', donorName: '', isBulk: false })}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
          const donorName = recallDispatchModal.donorName;
          const isBulk = recallDispatchModal.isBulk;
          const donorId = recallDispatchModal.donorId;
          const opts = { recallReason, smsMessage: recallMessage };
          setRecallDispatchModal({ isOpen: false, donorId: '', donorName: '', isBulk: false });
          try {
            if (isBulk) {
              const result = await dispatchBulkRecallSMS(selectedRecallIds, null, opts);
              setSelectedRecallIds([]);
              if (result.failed > 0) {
                setNoticeModal({ isOpen: true, title: 'Some SMS Messages Were Not Sent', message: `${result.sent} of ${result.count} recall SMS message(s) were sent. The remaining messages are recorded as failed in the dispatch history.`, variant: 'warning' });
              } else {
                setRecallSuccess({ isOpen: true, message: `Bulk SMS recall dispatched to ${donorName} via PhilSMS.` });
              }
            } else {
              const result = await dispatchRecallSMS(donorId, null, opts);
              if (result.smsSent) {
                setRecallSuccess({ isOpen: true, message: `Recall SMS dispatched to ${donorName} via PhilSMS.` });
              } else {
                setNoticeModal({ isOpen: true, title: 'SMS Was Not Sent', message: result.message || 'PhilSMS rejected the message. Check the dispatch history for the failed record.', variant: 'warning' });
              }
            }
            fetchRecallsFromAPI(); // refresh history
          } catch {
            setRecallSuccess({ isOpen: true, message: 'Recall recorded locally. (API error — check connection.)' });
          }
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow transition cursor-pointer"
              >
                Dispatch Recall SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRegistryDonor && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form onSubmit={(e) => { e.preventDefault(); setConfirmState({ isOpen: true, title: 'Save Donor Changes?', message: `Update the profile of ${editDonorForm.firstName} ${editDonorForm.lastName}? Please double-check all fields before confirming.`, confirmText: 'Save Changes', variant: 'warning', onConfirm: () => { closeConfirm(); doSaveDonorEdit(); } }); }} className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100"><Edit className="h-4 w-4 text-indigo-600" /></div><div><h3 className="text-sm font-bold text-slate-900">Edit Donor Profile</h3><p className="text-[10px] text-slate-400">Update registry contact and demographic information.</p></div></div>
              <button type="button" onClick={() => setEditingRegistryDonor(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
              {[
                ['First name', 'firstName', 'text'], ['Middle name', 'middleName', 'text'], ['Last name', 'lastName', 'text'],
                ['Date of birth', 'dob', 'date'], ['Contact number', 'contactNumber', 'tel'], ['Email address', 'email', 'email'],
              ].map(([label, field, type]) => <label key={field} className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}{['firstName', 'lastName', 'dob', 'contactNumber'].includes(field) && <span className="text-rose-500"> *</span>}<input required={['firstName', 'lastName', 'dob', 'contactNumber'].includes(field)} type={type} inputMode={field === 'contactNumber' ? 'numeric' : undefined} maxLength={field === 'contactNumber' ? 13 : undefined} value={editDonorForm[field]} onChange={event => setEditDonorForm({ ...editDonorForm, [field]: field === 'contactNumber' ? sanitizePhone(event.target.value) : event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label>)}
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Sex<select value={editDonorForm.sex} onChange={event => setEditDonorForm({ ...editDonorForm, sex: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-400"><option>Female</option><option>Male</option></select></label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Civil status<select value={editDonorForm.civilStatus} onChange={event => setEditDonorForm({ ...editDonorForm, civilStatus: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-400"><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:col-span-2">Address<textarea required value={editDonorForm.address} onChange={event => setEditDonorForm({ ...editDonorForm, address: event.target.value })} rows={2} className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-[10px] leading-relaxed text-blue-700 sm:col-span-2"><strong>Protected fields:</strong> Blood type, eligibility, medical deferral, and donation history are updated only through their appropriate clinical workflows.</div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" onClick={() => setEditingRegistryDonor(null)} className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={editDonorSaving} type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{editDonorSaving ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </div>
      )}

      <SuccessModal
        isOpen={recallSuccess.isOpen}
        title="Dispatched Successfully"
        message={recallSuccess.message}
        confirmText="Acknowledge & Close"
        onClose={() => setRecallSuccess({ isOpen: false, message: '' })}
      />


      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      {/* DONOR PROFILE / HISTORY MODAL */}
      {viewingDonorProfile && (() => {
        const donor = viewingDonorProfile;
        const donorNumId = parseInt(String(donor.id ?? '').replace(/^D0*/i, ''), 10);
        const donorDonations = (donations || [])
          .filter(d => parseInt(String(d.donorId ?? d.donor_id ?? ''), 10) === donorNumId)
          .sort((a, b) => new Date(b.donationDate ?? b.donation_date ?? 0) - new Date(a.donationDate ?? a.donation_date ?? 0));
        // Build a set of numeric donation IDs this donor has
        const donorDonationNumericIds = new Set(donorDonations.map(d => parseInt(String(d.donationId ?? d.donation_id ?? '').replace(/^DON-0*/i, ''), 10)));
        // Match lab results: first try direct donorId match (API returns it), fallback to donation-chain match
        const donorLabs = (labTestResults || []).filter(l => {
          const labDirectDonorId = parseInt(String(l.donorId ?? l.donor_id ?? ''), 10);
          if (!isNaN(labDirectDonorId) && labDirectDonorId === donorNumId) return true;
          // Fallback: match via donation IDs
          const labDonId = parseInt(String(l.donationId ?? l.donation_id ?? ''), 10);
          return donorDonationNumericIds.has(labDonId);
        });
        // Also include locally-saved results matched by donorId string
        const donorLabsWithLocal = donorLabs.filter(Boolean);
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                    <History className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{donor.name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {donor.id} &middot; {donor.bloodType || 'Unknown'} &middot; {donor.status || 'Active'}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setViewingDonorProfile(null); setExpandedDonations(new Set()); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Donor Info Strip */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-4 gap-3 text-[10px] flex-shrink-0">
                {[
                  { label: 'Date of Birth', value: donor.dateOfBirth || donor.dob || '-' },
                  { label: 'Sex', value: donor.sex || donor.gender || '-' },
                  { label: 'Contact', value: donor.contact || donor.phone || '-' },
                  { label: 'Address', value: donor.address || '-' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="block text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
                    <span className="font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>

              {/* Donation History */}
              <div className="overflow-y-auto flex-1 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-white bg-indigo-600 px-2 py-0.5 rounded">History</span>
                  <span className="text-xs font-bold text-slate-700">Donation Records</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{donorDonations.length} record(s) total</span>
                </div>

                {donorDonations.length === 0
                  ? (
                    <div className="text-center py-10 text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-semibold">No donation records yet.</p>
                      <p className="text-[10px] mt-1">Lab results must be recorded first to create a donation record.</p>
                    </div>
                  )
                  : (
                    <div className="space-y-3">
                      {donorDonations.map((d, i) => {
                        const dId = String(d.donationId ?? d.donation_id ?? '');
                        const eventId = d.eventId ?? d.event_id;
                        const event = eventId ? (donationEvents || []).find(ev => String(ev.eventId ?? ev.event_id) === String(eventId)) : null;
                        const dNumId = parseInt(String(d.donationId ?? d.donation_id ?? '').replace(/^DON-0*/i, ''), 10);
                        const lab = donorLabsWithLocal.find(l => parseInt(String(l.donationId ?? l.donation_id ?? ''), 10) === dNumId);
                        const outcome = d.screeningOutcome;
                        const outcomeColor = outcome === 'Accepted'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : outcome === 'Temporarily Deferred' || outcome === 'Permanently Deferred'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700';
                        const isExpanded = expandedDonations.has(dNumId);
                        const toggleExpand = () => setExpandedDonations(prev => {
                          const next = new Set(prev);
                          if (next.has(dNumId)) next.delete(dNumId); else next.add(dNumId);
                          return next;
                        });
                        return (
                          <div key={dId} className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Clickable accordion header */}
                            <button
                              type="button"
                              onClick={toggleExpand}
                              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                <span className="font-mono text-[10px] font-bold text-slate-500">{dId || `DON-${String(i+1).padStart(3,'0')}`}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-[10px] text-slate-600 font-semibold">{d.donationDate ?? d.donation_date ?? 'Unknown date'}</span>
                                {eventId && <span className="text-[9px] text-slate-400">&middot; {event?.barangayOrganization ?? eventId}</span>}
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${outcomeColor}`}>
                                {outcome || 'Pending Outcome'}
                              </span>
                            </button>

                            {/* Collapsible lab results */}
                            {isExpanded && (
                              lab
                                ? (
                                  <div className="px-4 py-3 grid grid-cols-4 gap-3 text-[10px] bg-white animate-in">
                                    {[
                                      { label: 'Hemoglobin', value: lab.hemoglobinResult ?? lab.hemoglobin_result },
                                      { label: 'Blood Type', value: lab.bloodTypeConfirmed ?? lab.blood_type_confirmed },
                                      { label: 'HBsAg', value: lab.hbsagResult ?? lab.hbsag_result },
                                      { label: 'Syphilis', value: lab.syphilisResult ?? lab.syphilis_result },
                                      { label: 'HIV', value: lab.hivResult ?? lab.hiv_result },
                                      { label: 'HCV', value: lab.hcvResult ?? lab.hcv_result },
                                      { label: 'Malaria', value: lab.malariaResult ?? lab.malaria_result },
                                      { label: 'NAT', value: lab.natResult ?? lab.nat_result },
                                    ].map(({ label, value }) => (
                                      <div key={label}>
                                        <span className="block text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
                                        <span className={`font-semibold ${value === 'Reactive' ? 'text-red-600' : 'text-slate-700'}`}>{value || '-'}</span>
                                      </div>
                                    ))}
                                    {(lab.othersResult ?? lab.others_result) && (
                                      <div className="col-span-4 border-t border-slate-100 pt-2 mt-1">
                                        <span className="block text-slate-400 uppercase tracking-wider mb-0.5">Others / Remarks</span>
                                        <span className="font-semibold text-slate-700">{lab.othersResult ?? lab.others_result}</span>
                                      </div>
                                    )}
                                  </div>
                                )
                                : (
                                  <div className="px-4 py-3 text-[10px] text-amber-600 font-semibold bg-amber-50">
                                    No lab results recorded for this donation.
                                  </div>
                                )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                }
              </div>

              {/* Footer note */}
              <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0 bg-blue-50">
                <p className="text-[10px] text-blue-600 font-semibold">
                  Returning donor? Go to <strong>Encode Lab Results</strong> and search for this donor to start a new donation session. No re-registration needed.
                </p>
              </div>
            </div>
          </div>
        );
      })()}


      {/*  -  -  - Ã‚Â -  -  -  - Ã‚Â -  NOTICE / VALIDATION MODAL  -  -  - Ã‚Â -  -  -  - Ã‚Â -  */}
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


      {/* â”€â”€ ENCODE LAB RESULT MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showLabResultModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Record Donation</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Section II â€“ Table 8 Serology & Blood Typing</p>
                </div>
              </div>
              <button onClick={() => { setShowLabResultModal(false); setLabSaved(false); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Step 1 â€“ Donor & Donation Info */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Step 1 â€” Donor & Donation Info</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Donor search */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Donor</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type donor name or IDâ€¦"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={labDonationSearchQuery}
                        onChange={e => setLabDonationSearchQuery(e.target.value)}
                      />
                    </div>
                    {labDonationSearchQuery.length > 0 && (() => {
                        // Only hide donors who are already finalized FOR THE SELECTED EVENT.
                        // If no event is chosen yet, show everyone â€” they can donate in new events.
                        const finalizedDonorIds = new Set();
                        if (labForm.eventId) {
                          (donations || []).forEach(d => {
                            const outcome = d.screeningOutcome ?? d.screening_outcome ?? '';
                            const finalized = outcome === 'Accepted' || outcome === 'Temporarily Deferred' || outcome === 'Permanently Deferred';
                            if (!finalized) return;
                            const dEvId = String(d.eventId ?? d.event_id ?? '');
                            if (dEvId === String(labForm.eventId)) {
                              finalizedDonorIds.add(parseInt(String(d.donorId ?? d.donor_id ?? ''), 10));
                            }
                          });
                        }
                        const matches = preparedDonors.filter(d => {
                          if (labForm.eventId) {
                            const numId = parseInt(String(d.id ?? '').replace(/^D0*/i, ''), 10);
                            if (finalizedDonorIds.has(numId)) return false;
                          }
                          return (
                            d.name.toLowerCase().includes(labDonationSearchQuery.toLowerCase()) ||
                            d.id.toLowerCase().includes(labDonationSearchQuery.toLowerCase())
                          );
                        });
                        return (
                          <div className="mt-1 border border-slate-200 rounded-lg shadow-md max-h-40 overflow-y-auto bg-white z-10 relative">
                            {matches.slice(0, 8).map(d => (
                              <button
                                key={d.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors flex items-center justify-between cursor-pointer"
                                onClick={() => {
                                  setLabForm(prev => ({ ...prev, donorId: d.id, donorName: d.name }));
                                  setLabDonationSearchQuery('');
                                }}
                              >
                                <span className="font-semibold text-slate-800">{d.name}</span>
                                <span className="text-slate-400 font-mono">{d.id} Â· {d.bloodType}</span>
                              </button>
                            ))}
                            {matches.length === 0 && (
                              <p className="px-3 py-2 text-xs text-slate-400">
                                {labForm.eventId ? 'All matching donors are already finalized for this event.' : 'No donors found.'}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    {labForm.donorId && (
                      <div className="mt-1.5 flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-indigo-700">{labForm.donorName} <span className="font-mono font-normal">({labForm.donorId})</span></span>
                        <button type="button" className="ml-auto text-indigo-400 hover:text-indigo-700 cursor-pointer" onClick={() => setLabForm(prev => ({ ...prev, donorId: '', donorName: '' }))}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Event ID â€“ required dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Donation Event <span className="text-rose-400">*</span>
                    </label>
                    <select
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                        !labForm.eventId ? 'border-rose-200 text-slate-400' : 'border-slate-200 text-slate-700'
                      }`}
                      value={labForm.eventId}
                      onChange={e => setLabForm(prev => ({ ...prev, eventId: e.target.value }))}
                    >
                      <option value="">— Select Event —</option>
                      {(() => {
                        // Build set of event IDs where the selected donor already has a finalized outcome
                        const FINALIZED = new Set(['Accepted', 'Temporarily Deferred', 'Permanently Deferred', 'Indefinite Deferral']);
                        const donorNumId = labForm.donorId
                          ? parseInt(String(labForm.donorId).replace(/^D0*/i, ''), 10)
                          : null;
                        const blockedEventIds = new Set();
                        if (donorNumId) {
                          (donations || []).forEach(d => {
                            const dDonorId = parseInt(String(d.donorId ?? d.donor_id ?? ''), 10);
                            if (dDonorId !== donorNumId) return;
                            const outcome = d.screeningOutcome ?? d.screening_outcome ?? '';
                            if (!FINALIZED.has(outcome)) return;
                            const evId = String(d.eventId ?? d.event_id ?? '').toUpperCase();
                            if (evId) blockedEventIds.add(evId);
                          });
                        }
                        return (donationEvents || []).filter(ev => {
                          const evId = String(ev.eventId ?? ev.event_id ?? '').toUpperCase();
                          return !blockedEventIds.has(evId);
                        }).map(ev => (
                          <option key={ev.eventId ?? ev.event_id} value={ev.eventId ?? ev.event_id}>
                            {ev.eventId ?? ev.event_id} · {ev.barangayOrganization ?? ev.barangay_organization ?? ev.venue ?? 'Unknown venue'} ({ev.eventDate ?? ev.event_date ?? '-'})
                          </option>
                        ));
                      })()}
                    </select>
                    {!labForm.eventId && (
                      <p className="text-[9px] text-rose-400 mt-0.5 font-semibold">Required â€” select the event this blood was collected from.</p>
                    )}
                  </div>

                  {/* Donation Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Donation Date</label>
                    <input
                      type="date"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={labForm.donationDate}
                      onChange={e => setLabForm(prev => ({ ...prev, donationDate: e.target.value }))}
                    />
                  </div>

                  {/* Serial / Segment Number — spans full width */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Serial / Segment No. <span className="text-rose-400">*</span> <span className="text-indigo-400 font-normal normal-case tracking-normal">(from the physical DHQ form)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 2026-0001"
                        className="w-full border border-indigo-200 bg-indigo-50/40 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={labForm.serialNumber}
                        onChange={e => setLabForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                      Enter the serial number printed on the DHQ form. This is the unique identifier Serology uses to record lab results.
                    </p>
                  </div>
                </div>
              </div>



              {/* Info: Screening outcome is determined by Serology after reviewing lab results */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[10px] text-blue-700 leading-relaxed">
                <strong>Next Step:</strong> After this donation is recorded, Serology staff will retrieve the DHQ using the serial number above and encode the lab results and screening outcome.
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex items-center justify-between gap-3">
              {labSaved ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold">Donation recorded successfully!</span>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">Serology will record lab results separately using the serial number.</p>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => { setShowLabResultModal(false); setLabSaved(false); }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!labForm.donorId || !labForm.eventId || !labForm.serialNumber}
                  onClick={async () => {
                    if (!labForm.donorId || !labForm.eventId || !labForm.serialNumber) return;
                    try {
                      await recordDonation(labForm);
                      await fetchDonationsFromAPI();
                      setLabSaved(true);
                      setTimeout(() => { setShowLabResultModal(false); setLabSaved(false); }, 1500);
                    } catch (err) {
                      alert(err.message || 'Failed to record donation. The serial number may already exist.');
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Record Donation
                </button>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* â”€â”€ RIGHT SLIDE-IN DRAWER: REGISTER DONOR â”€â”€ */}
      {/* Backdrop */}
      {/* â”€â”€ REGISTER DONOR MODAL POPUP â”€â”€ */}
      {showDrawer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col modal-in">

            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-white font-bold text-sm">Register New Donor</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Table 5: Donors â€” Fill in the complete donor profile below</p>
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
                      inputMode="numeric" maxLength={13}
                      onChange={e => setNewDonorForm({ ...newDonorForm, phone: sanitizePhone(e.target.value) })}
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

      {/* â”€â”€ DONOR REGISTRATION SUCCESS MODAL â”€â”€ */}
      <SuccessModal
        isOpen={registrationSuccess.isOpen}
        title="Donor Registered Successfully"
        message="Profile saved to SNBC-M Â· Table 5: Donors"
        confirmText="Go to Donor List"
        onClose={() => {
          setRegistrationSuccess({ isOpen: false, donorId: '', donorName: '' });
          setTab('registry');
        }}
        details={[
          { label: "Donor Name", value: registrationSuccess.donorName },
          { label: "Donor ID", value: registrationSuccess.donorId },
          { label: "Record Status", value: "Active Â· Pending Lab Conf." },
          { label: "Registered On", value: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) }
        ]}
      />



    </div>
  );
}
