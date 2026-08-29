import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useBloodStore } from '../store/useBloodStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import {
  Heart,
  Database,
  Activity,
  RefreshCw,
  ClipboardList,
  Map,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Search,
  Play,
  Send,
  Plus,
  ShieldAlert,
  CheckSquare,
  XCircle,
  Clock,
  ArrowRight,
  Info,
  MapPin,
  Building2,
  FileText,
  UserCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Calendar,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import spmcLogo from '../assets/bloodlinks_logo/spmc-logo.png';
import prcLogo from '../assets/bloodlinks_logo/prc-logo.png';
import snbcLogo from '../assets/bloodlinks_logo/snbc-removebg-preview.png';
import davaoLogo from '../assets/bloodlinks_logo/davao-logo.png';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessModal from '../components/SuccessModal';
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const COMPONENTS = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];

const SPRING = {
  type: 'spring',
  bounce: 0.55,
  duration: 0.8,
};

export default function AdminDashboard() {
  // Zustand State
  const donors = useBloodStore((state) => state.donors);
  const inventory = useBloodStore((state) => state.inventory);
  const bloodRequests = useBloodStore((state) => state.bloodRequests);
  const hospitals = useBloodStore((state) => state.hospitals);
  const users = useBloodStore((state) => state.users);
  const forecastData = useBloodStore((state) => state.forecastData);
  const smsLogs = useBloodStore((state) => state.smsLogs);
  const distributionLog = useBloodStore((state) => state.distributionLog);
  const accountFlagged = useBloodStore((state) => state.accountFlagged);
  const arrivedAtFacility = useBloodStore((state) => state.arrivedAtFacility);
  const authSystemUser = useBloodStore((state) => state.authSystemUser);
  const updateBloodRequestStatus = useBloodStore((state) => state.updateBloodRequestStatus);
  const updateInventoryUnits = useBloodStore((state) => state.updateInventoryUnits);
  const setFlaggedStatus = useBloodStore((state) => state.setFlaggedStatus);
  const addHospital = useBloodStore((state) => state.addHospital);
  const updateHospital = useBloodStore((state) => state.updateHospital);
  const deleteHospital = useBloodStore((state) => state.deleteHospital);
  const getEquityAllocations = useBloodStore((state) => state.getEquityAllocations);
  const recordDistribution = useBloodStore((state) => state.recordDistribution);
  const getLastDistributionByBloodType = useBloodStore((state) => state.getLastDistributionByBloodType);
  const generateNextWeeks = useBloodStore((state) => state.generateNextWeeks);
  const generateGranularForecast = useBloodStore((state) => state.generateGranularForecast);
  const granularForecasts = useBloodStore((state) => state.granularForecasts) ?? [];
  const addUser = useBloodStore((state) => state.addUser);
  const updateUser = useBloodStore((state) => state.updateUser);
  const addBloodRequest = useBloodStore((state) => state.addBloodRequest);
  const approveRequest = useBloodStore((state) => state.approveRequest);
  const recommendations = useBloodStore((state) => state.recommendations);
  const donorRecalls = useBloodStore((state) => state.donorRecalls) ?? [];
  const dispatchRecallSMS = useBloodStore((state) => state.dispatchRecallSMS);
  const approveRecommendation = useBloodStore((state) => state.approveRecommendation);
  const rejectRecommendation = useBloodStore((state) => state.rejectRecommendation);
  const generateRecommendationsFromForecast = useBloodStore((state) => state.generateRecommendationsFromForecast);
  const auditLogs = useBloodStore((state) => state.auditLogs);
  const donationEvents = useBloodStore((state) => state.donationEvents);
  const addDonationEvent = useBloodStore((state) => state.addDonationEvent);

  // Role Detection
  const adminRole = authSystemUser?.role || 'Administrator';
  const isSuperAdmin = adminRole === 'Super Admin';
  const isAdministrator = adminRole === 'Administrator';

  // Mobilization Simulation Hooks
  const mobilizeFlowStep = useBloodStore((state) => state.mobilizeFlowStep);
  const mobilizeTarget = useBloodStore((state) => state.mobilizeTarget);
  const mobilizeFacility = useBloodStore((state) => state.mobilizeFacility);
  const scanProgress = useBloodStore((state) => state.scanProgress);
  const scannedCount = useBloodStore((state) => state.scannedCount);
  const matchedCount = useBloodStore((state) => state.matchedCount);
  const criteriaChecked = useBloodStore((state) => state.criteriaChecked);
  const totalConfirmed = useBloodStore((state) => state.totalConfirmed);
  const currentPhase = useBloodStore((state) => state.currentPhase);

  const triggerMobilization = useBloodStore((state) => state.triggerMobilization);
  const setMobilizeFlowStep = useBloodStore((state) => state.setMobilizeFlowStep);
  const setScanProgress = useBloodStore((state) => state.setScanProgress);
  const setPhaseDetails = useBloodStore((state) => state.setPhaseDetails);
  const dispatchSMSLog = useBloodStore((state) => state.dispatchSMSLog);
  const resetMobilization = useBloodStore((state) => state.resetMobilization);

  // Local UI State
  const [tab, setTab] = useState('dashboard');
  const sidebarCollapsed = useBloodStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useBloodStore((state) => state.toggleSidebar);
  const [railTip, setRailTip] = useState(null);

  // Donation Events (Table 6) modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    province: 'Davao del Sur',
    cityMunicipality: 'Davao City',
    barangayOrganization: '',
    eventDate: new Date().toISOString().slice(0, 10)
  });
  const [eventSaved, setEventSaved] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  // Hospital CRUD state
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalForm, setHospitalForm] = useState({ name: '', type: 'Government', contact: '', phone: '', email: '', address: '', registrationStatus: 'Active' });
  // Distribution history filter
  const [distHospitalFilter, setDistHospitalFilter] = useState('ALL');
  const [emergencyBloodType, setEmergencyBloodType] = useState(null);
  const [selectedInventoryType, setSelectedInventoryType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestNote, setSelectedRequestNote] = useState('');
  const [selectedRequestRef, setSelectedRequestRef] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [reEligibilityScanning, setReEligibilityScanning] = useState(false);
  const [reEligibilityComplete, setReEligibilityComplete] = useState(false);
  const [reEligibilityCount, setReEligibilityCount] = useState(0);

  // Granular Forecast filters (chart + KPI cards)
  const [fcHospital, setFcHospital] = useState('ALL');
  const [fcBloodType, setFcBloodType] = useState('ALL');
  const [fcComponent, setFcComponent] = useState('ALL');
  const [fcWeeks, setFcWeeks] = useState(4);

  // Forecast Records table — independent filters
  const [recHospital, setRecHospital] = useState('ALL');
  const [recBloodType, setRecBloodType] = useState('ALL');
  const [recComponent, setRecComponent] = useState('ALL');
  const [recWeek, setRecWeek] = useState('ALL');
  const [recSearch, setRecSearch] = useState('');

  // Distribution History detail modal
  const [selectedDistLog, setSelectedDistLog] = useState(null);
  const [showDistLogModal, setShowDistLogModal] = useState(false);

  // Allocate confirmation modal
  const [allocateTarget, setAllocateTarget] = useState(null); // { hospitalId, hospitalName, bloodType, units }
  const [showAllocateModal, setShowAllocateModal] = useState(false);

  // SMS Recall confirmation modal
  const [showSmsConfirmModal, setShowSmsConfirmModal] = useState(false);

  // Hospital demand drilldown (Granular Component Breakdown)
  const [drilldownHospital, setDrilldownHospital] = useState(null); // null = list view, object = detail view

  // Reports local tab
  const [reportsTab, setReportsTab] = useState('stock');

  // Super Admin: Add System User modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    firstName: '', lastName: '', email: '', passwordHash: '',
    contactNumber: '', role: 'Registry Staff', roleId: 'ROLE-003',
    status: 'Active', hospitalId: ''
  });
  const [userSaved, setUserSaved] = useState(false);
  // Edit User modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ firstName: '', lastName: '', email: '', contactNumber: '', role: 'Registry Staff', roleId: 'ROLE-003', status: 'Active' });
  const [editUserSaved, setEditUserSaved] = useState(false);

  // Direct Create Issuance Modal State
  const [showCreateIssuanceModal, setShowCreateIssuanceModal] = useState(false);
  const [createIssuanceForm, setCreateIssuanceForm] = useState({
    hospitalId: '',
    bloodType: 'O+',
    component: 'PRBC',
    units: 1,
    urgency: 'routine',
    ward: '',
    diagnosis: '',
    contactPerson: '',
    contactNumber: ''
  });
  const [issuanceSuccessModal, setIssuanceSuccessModal] = useState({ isOpen: false, refNo: '', hospital: '', units: 0, bloodType: '', component: '' });

  // Generic notice/alert modal (replaces alert())
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, title: '', message: '', variant: 'warning' });

  // Reserves bar fill-in animation trigger
  const [barsAnimated, setBarsAnimated] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setBarsAnimated(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  // Admin-level SMS recall confirm + success modals
  const [adminRecallConfirm, setAdminRecallConfirm] = useState({ isOpen: false, donorId: '', donorName: '', isBulk: false, eligibleCount: 0, action: null });
  const [adminRecallSuccess, setAdminRecallSuccess] = useState({ isOpen: false, message: '' });

  // Map References
  const mobMapRef = useRef(null);
  const mobMapInstance = useRef(null);
  const densityMapRef = useRef(null);
  const densityMapInstance = useRef(null);

  // Derived state
  const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
  const criticalCount = inventory.filter((item) => item.status === 'critical').length;
  const pendingRequests = bloodRequests.filter((r) => r.status === 'Pending').length;

  const tabTitles = {
    dashboard: 'Dashboard Overview',
    users: 'User Management',
    donors: 'Donor Management',
    inventory: 'Blood Inventory',
    issuance: 'Blood Issuance',
    hospitals: 'Hospital Management',
    forecasting: 'Demand Forecasting',
    distribution: 'Distribution Recommendation',
    recall: 'Donor Recall',
    reports: 'Reports Module',
    audit_logs: 'Audit Logs (Table 18)',
    hospital_history: 'Distribution Summary',
    dist_record_detail: 'Distribution Record Detail'
  };

  const tabSubs = {
    dashboard: 'Real-time metrics and system overview',
    users: 'Manage system users and access privileges',
    donors: 'Manage donor records and donation history',
    inventory: 'Monitors available blood stocks and components',
    issuance: 'Records blood distribution transactions to hospitals',
    hospitals: 'Maintains partner hospital information',
    forecasting: 'Predicts future blood demand using Multiple Linear Regression (MLR)',
    distribution: 'Equity-based blood allocation to partner hospitals',
    recall: 'Automates donor recall after the required eligibility period',
    reports: 'Generates operational reports',
    audit_logs: 'System transaction logs for RA 10173 accountability',
    hospital_history: 'Summary overview of all blood distributions per hospital',
    dist_record_detail: 'Full breakdown of a single distribution transaction'
  };

  // Timeline Response Graph Data (Recharts)
  const timelineData = [
    { time: '0m', confirmed: 0 },
    { time: '15m', confirmed: 3 },
    { time: '30m', confirmed: 7 },
    { time: '45m', confirmed: 12 },
    { time: '60m', confirmed: 14 },
    { time: '75m', confirmed: 16 },
    { time: '90m', confirmed: 20 },
    { time: '105m', confirmed: 22 },
    { time: '120m', confirmed: 24 },
    { time: '135m', confirmed: totalConfirmed }
  ];

  // Matched Donors for table display (Maria Santos ranked 1st due to nearest location 1.2km)
  const matchedDonors = donors.filter(d => d.bloodType === 'O-').sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

  // Run database scanning simulation (Aho-Corasick matching)
  useEffect(() => {
    let scanInterval;

    if (mobilizeFlowStep === 1) {
      let currentScanned = 0;
      let currentMatched = 0;

      scanInterval = setInterval(() => {
        currentScanned += 43;
        if (currentScanned >= 1247) {
          currentScanned = 1247;
          clearInterval(scanInterval);

          setTimeout(() => {
            setScanProgress(100, 1247, currentMatched, 1);
            setTimeout(() => {
              setScanProgress(100, 1247, currentMatched, 2);
              setTimeout(() => {
                setScanProgress(100, 1247, currentMatched, 3);
                setTimeout(() => {
                  setMobilizeFlowStep(2); // Proceed to SMS gateway

                  matchedDonors.forEach((d) => {
                    const initials = d.name.split(' ').map(n => n[0]).join('');
                    const color = d.name.includes('Santos') ? '#3B82F6' : '#10B981';
                    const msg = `🩸 URGENT O- BLOOD NEEDED at SPMC Blood Production Services. Distance: ${d.distance}. You last donated 4 months ago and are eligible. Can you donate today? Reply YES to confirm.`;
                    dispatchSMSLog(d.name, d.phone, msg, color, initials);
                  });
                }, 800);
              }, 500);
            }, 500);
          }, 500);
        }

        if (currentMatched < 47) {
          currentMatched += 2;
          if (currentMatched > 47) currentMatched = 47;
        }

        setScanProgress(Math.round((currentScanned / 1247) * 100), currentScanned, currentMatched, 0);
      }, 100);
    }

    return () => {
      clearInterval(scanInterval);
    };
  }, [mobilizeFlowStep]);

  // Leaflet map render for Mobilization Step 3
  useEffect(() => {
    if (tab === 'mobilize' && mobilizeFlowStep === 3 && mobMapRef.current) {
      if (mobMapInstance.current) {
        mobMapInstance.current.remove();
        mobMapInstance.current = null;
      }

      const map = L.map(mobMapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([7.0731, 125.6128], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const spmcIcon = L.divIcon({
        className: 'mob-spmc-icon',
        html: `<div style="background-color: #C21C24; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      L.marker([7.0731, 125.6128], { icon: spmcIcon })
        .bindPopup('<b>SPMC Blood Production Services</b><br>Target facility')
        .addTo(map);

      mobMapInstance.current = map;

      // Draw Phase 1 circle (2km)
      const circle1 = L.circle([7.0731, 125.6128], {
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.08,
        radius: 2000
      }).addTo(map);

      const donorIcon = L.divIcon({
        className: 'mob-donor-icon',
        html: `<div style="background-color: #10B981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      L.marker([7.0822, 125.6210], { icon: donorIcon }).bindPopup('<b>Maria C. Santos</b><br>Confirmed (1.2 km)').addTo(map);

      for (let i = 0; i < 8; i++) {
        const lat = 7.0731 + (Math.random() - 0.5) * 0.02;
        const lng = 125.6128 + (Math.random() - 0.5) * 0.02;
        L.marker([lat, lng], { icon: donorIcon }).bindPopup('Donor confirmed').addTo(map);
      }

      const t1 = setTimeout(() => {
        setPhaseDetails(2, arrivedAtFacility ? 21 : 20);
        L.circle([7.0731, 125.6128], {
          color: '#F59E0B',
          fillColor: '#F59E0B',
          fillOpacity: 0.04,
          radius: 10000
        }).addTo(map);

        map.setView([7.0731, 125.6128], 11);

        for (let i = 0; i < 8; i++) {
          const lat = 7.0731 + (Math.random() - 0.5) * 0.08;
          const lng = 125.6128 + (Math.random() - 0.5) * 0.08;
          L.marker([lat, lng], { icon: donorIcon }).bindPopup('Donor confirmed').addTo(map);
        }
      }, 4000);

      const t2 = setTimeout(() => {
        setPhaseDetails(3, arrivedAtFacility ? 26 : 25);

        const compIcon = L.divIcon({
          className: 'mob-comp-icon',
          html: `<div style="background-color: #8B5CF6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        for (let i = 0; i < 5; i++) {
          const lat = 7.0731 + (Math.random() - 0.5) * 0.09;
          const lng = 125.6128 + (Math.random() - 0.5) * 0.09;
          L.marker([lat, lng], { icon: compIcon }).bindPopup('Compatible donor confirmed').addTo(map);
        }
      }, 7500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [tab, mobilizeFlowStep]);

  // Auto-generate granular forecast when navigating to forecasting tab
  useEffect(() => {
    if (tab === 'forecasting' && granularForecasts.length === 0) {
      generateGranularForecast(fcWeeks);
    }
  }, [tab]);

  // Leaflet map render for General Donor Density map
  const initDonorMap = () => {
    if (densityMapRef.current) {
      if (densityMapInstance.current) {
        densityMapInstance.current.remove();
        densityMapInstance.current = null;
      }

      const map = L.map(densityMapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([7.0731, 125.6128], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const banks = [
        { name: 'SPMC Blood Services (Blood hospital partnered with SNBC)', coords: [7.0731, 125.6128], color: '#C21C24' },
        { name: 'Philippine Red Cross (Other bloodbank)', coords: [7.0601, 125.6105], color: '#E11D48' },
        { name: 'SNBC Mindanao Compound', coords: [7.0755, 125.6140], color: '#2563EB' }
      ];

      banks.forEach((b) => {
        const bankIcon = L.divIcon({
          className: 'density-bank-icon',
          html: `<div style="background-color: ${b.color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        L.marker(b.coords, { icon: bankIcon }).bindPopup(`<b>${b.name}</b>`).addTo(map);
      });

      const donorPoints = [
        [7.0822, 125.6210],
        [7.0850, 125.6190],
        [7.0910, 125.6310],
        [7.0510, 125.5920],
        [7.0480, 125.5960],
        [7.0390, 125.5890],
        [7.0210, 125.5610],
        [7.1110, 125.6450],
        [7.1250, 125.6510],
        [7.0620, 125.5780],
        [7.0680, 125.5810]
      ];

      const dotIcon = L.divIcon({
        className: 'density-dot-icon',
        html: `<div style="background-color: #10B981; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.25);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });

      donorPoints.forEach((pt) => {
        L.marker(pt, { icon: dotIcon }).addTo(map);
      });

      densityMapInstance.current = map;
    }
  };

  // Re-Eligibility Scanner simulation
  const runReEligibilityScan = () => {
    setReEligibilityScanning(true);
    setReEligibilityComplete(false);

    setTimeout(() => {
      setReEligibilityScanning(false);
      setReEligibilityComplete(true);
      setReEligibilityCount(18);
    }, 2500);
  };

  const dispatchEligibilityReminders = () => {
    // Detect eligible donors matching the 85-90 day window
    const eligibleDonors = donors.map(donor => {
      const today = new Date('2026-06-27');
      const lastDonationDate = new Date(donor.lastDonation);
      const diffTime = Math.abs(today - lastDonationDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...donor, diffDays };
    }).filter(donor => donor.diffDays >= 85 && donor.diffDays <= 90);

    if (eligibleDonors.length === 0) {
      setNoticeModal({
        isOpen: true,
        title: 'No Eligible Donors Found',
        message: 'No eligible donors in the 85–90 day interval were found to recall today.',
        variant: 'warning'
      });
      return;
    }

    // Show confirmation before dispatching
    setAdminRecallConfirm({
      isOpen: true,
      isBulk: true,
      eligibleCount: eligibleDonors.length,
      donorName: `${eligibleDonors.length} Donors`,
      action: () => {
        eligibleDonors.forEach(donor => {
          dispatchRecallSMS(donor.id, authSystemUser?.id || 'USR-002');
          const msg = `🩸 Hello ${donor.name}. Your 90-day donation interval is complete! You are eligible to donate again. Visit bloodlinkdvo.ph to learn more.`;
          dispatchSMSLog(donor.name, donor.phone || '+63 917 123 4567', msg, '#C21C24', donor.name.split(' ').map(n => n[0]).join(''));
        });
        setReEligibilityComplete(false);
        setAdminRecallSuccess({
          isOpen: true,
          message: `Recall alerts successfully dispatched to ${eligibleDonors.length} eligible donors via Semaphore Gateway.`
        });
      }
    });
  };

  const handleRequestAction = (refNo, status) => {
    setSelectedRequestRef(refNo);
    if (status === 'Declined' || status === 'Fulfilled' || status === 'Processing') {
      setSelectedRequestNote('');
      setShowNoteModal(true);
    } else {
      updateBloodRequestStatus(refNo, status);
    }
  };

  const saveRequestStatusWithNote = () => {
    updateBloodRequestStatus(selectedRequestRef, 'Processing', selectedRequestNote);
    setShowNoteModal(false);
  };

  // Open distribution log detail — navigate like blood inventory (inline page)
  const openDistLog = (log) => {
    setSelectedDistLog(log);
    setTab('dist_record_detail');
  };

  // Emergency Retrack: navigate to Distribution History tab & highlight that blood type
  const handleEmergencyRetrack = (bloodType) => {
    setEmergencyBloodType(bloodType);
    setDistHospitalFilter('ALL');
    setTab('hospital_history');
  };

  const handleToggleSidebar = () => {
    toggleSidebar();
    setRailTip(null);
  };

  const showRailTip = (label) => (event) => {
    if (!sidebarCollapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setRailTip({ label, top: rect.top + rect.height / 2 });
  };

  const hideRailTip = () => setRailTip(null);

  const renderNavButton = ({ id, label, icon: Icon, badge }) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      onMouseEnter={showRailTip(label)}
      onMouseLeave={hideRailTip}
      onFocus={showRailTip(label)}
      onBlur={hideRailTip}
      aria-label={label}
      aria-current={tab === id ? 'page' : undefined}
      className={`w-full text-left nav-link ${tab === id ? 'active' : ''}`}
    >
      <Icon className="nav-icon" />
      <span className="sidebar-copy">{label}</span>
      {badge}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">

      {/* SIDEBAR NAVIGATION (CLEAN SAAS DIVIDER STYLE) */}
      <aside
        className={`sidebar flex flex-col justify-between border-r border-slate-200 bg-white ${sidebarCollapsed ? 'is-collapsed' : ''}`}
        aria-label="Center portal navigation"
      >
        <div id="admin-sidebar" className="sidebar-inner">
          <div>
            {/* Logo Section */}
            <div className={`py-5 border-b border-slate-100 ${sidebarCollapsed ? 'px-3' : 'px-6'}`}>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className={`flex items-center min-w-0 ${sidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                  <img src={bloodlinkLogo} alt="BloodLink Davao" className="h-10 w-auto object-contain flex-shrink-0" />
                  <div className="sidebar-brand-copy min-w-0">
                    <p className="font-bold text-sm text-slate-900 tracking-tight leading-tight">BloodLink</p>
                    <p className="text-slate-500 text-[10px] font-bold">Center Portal</p>
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={handleToggleSidebar}
                    className="flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer flex-shrink-0"
                    title="Collapse sidebar"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
              {sidebarCollapsed && (
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    onClick={handleToggleSidebar}
                    className="flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                    title="Expand sidebar"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* User Identity Panel */}
            {!sidebarCollapsed && (
              <div className="mx-4 mt-4 mb-2 bg-slate-50 border border-slate-200/60 rounded-lg p-3">
                <div className="sidebar-desk">
                  <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Facility Desk</p>
                  <p className="text-slate-800 font-bold text-xs">SNBC Blood Production</p>
                  <p className="text-slate-500 text-[10px] font-medium">Operations Desk</p>
                </div>
              </div>
            )}

            {/* Sidebar Nav Links */}
            <nav className="flex-1 py-2">
              <p className="sidebar-section-label text-slate-400 text-[9px] font-bold uppercase px-4 mt-3 mb-1 tracking-widest">General</p>
              {renderNavButton({ id: 'dashboard', label: 'Dashboard', icon: Database })}
              {renderNavButton({ id: 'users', label: 'User Management', icon: UserCheck })}
              {renderNavButton({ id: 'donors', label: 'Donor Management', icon: Users })}

              <p className="sidebar-section-label text-slate-400 text-[9px] font-bold uppercase px-4 mt-4 mb-1 tracking-widest">Inventory & Issuance</p>
              {renderNavButton({
                id: 'inventory',
                label: 'Blood Inventory',
                icon: Heart,
                badge: criticalCount > 0 && (
                  <span className="nav-badge ml-auto bg-[#C21C24] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {criticalCount}
                  </span>
                )
              })}
              {renderNavButton({
                id: 'issuance',
                label: 'Blood Issuance',
                icon: FileText,
                badge: pendingRequests > 0 && (
                  <span className="nav-badge ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {pendingRequests}
                  </span>
                )
              })}
              {renderNavButton({ id: 'hospitals', label: 'Hospital Management', icon: Building2 })}

              <p className="sidebar-section-label text-slate-400 text-[9px] font-bold uppercase px-4 mt-4 mb-1 tracking-widest">Distribution</p>
              {renderNavButton({ id: 'forecasting', label: 'Demand Forecasting', icon: Activity })}
              {renderNavButton({ id: 'distribution', label: 'Distribution Recommendation:', icon: Map })}
              {renderNavButton({ id: 'hospital_history', label: 'Distribution Summary', icon: ClipboardList })}
              {renderNavButton({ id: 'recall', label: 'Donor Recall', icon: RefreshCw })}
              {renderNavButton({ id: 'donation_events', label: 'Donation Events', icon: Calendar })}

              <p className="sidebar-section-label text-slate-400 text-[9px] font-bold uppercase px-4 mt-4 mb-1 tracking-widest">Analytics</p>
              {renderNavButton({ id: 'reports', label: 'Reports', icon: ClipboardList })}
              {isSuperAdmin && renderNavButton({ id: 'audit_logs', label: 'Audit Logs', icon: FileText })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className={`py-4 border-t border-slate-100 text-xs text-slate-400 ${sidebarCollapsed ? 'px-2 flex justify-center' : 'px-4'}`}>
            {sidebarCollapsed ? (
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Gateway Connected" />
            ) : (
              <div className="sidebar-foot-copy">
                <p className="font-mono text-[10px]">Portal v2.4.0</p>
                <div className="flex items-center gap-1 mt-1 text-emerald-600 font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>Gateway Connected</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {railTip && (
        <div className="sidebar-rail-tip" style={{ top: railTip.top }} role="tooltip">
          {railTip.label}
        </div>
      )}

      {/* MAIN CONTENT WORKSPACE */}
      <div className={`content-area bg-slate-50/50 ${sidebarCollapsed ? 'is-collapsed' : ''}`}>

        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">{tabTitles[tab]}</h1>
            <p className="text-xs text-slate-400 font-medium">{tabSubs[tab]}</p>
          </div>
          <div className="flex items-center gap-4">
            {criticalCount > 0 && (
              <button
                onClick={() => setTab('mobilize')}
                className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#C21C24] hover:bg-rose-100/50 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Urgent: O- Stock Critical</span>
              </button>
            )}
            <div className="h-8 w-px bg-slate-200"></div>
            <Link
              to="/"
              title="Logout"
              className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* PAGE BODY */}
        <div className="p-8 flex-1">

          {/* TAB: DASHBOARD OVERVIEW */}
          {tab === 'dashboard' && (
            <div className="fade-in space-y-6">

              {/* Quick stats grids */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Stock</p>
                  <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalUnits} units</p>
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">Across all type reserves</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Active Donors</p>
                  <p className="text-2xl font-extrabold text-slate-900 font-mono">1,247</p>
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">Davao City regional pool</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Critical Deficits</p>
                  <p className="text-2xl font-extrabold text-[#C21C24] font-mono">{criticalCount}</p>
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">Below safety reserves</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Eligible Pool</p>
                  <p className="text-2xl font-extrabold text-emerald-600 font-mono">312</p>
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">Ready for dispatch matching</p>
                </div>
              </div>

              {/* Progress stock grids */}
              <div className="grid lg:grid-cols-3 gap-6">

                {/* Left Progress Stock Bars */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-5 tracking-tight">Active Reserves vs Safety Thresholds</h3>
                    <div className="space-y-4">
                      {inventory.map((blood, idx) => {
                        const pct = Math.min((blood.units / (blood.threshold * 2.5)) * 100, 100);
                        const thresholdPct = Math.min((blood.threshold / (blood.threshold * 2.5)) * 100, 100);
                        const delay = `${idx * 0.08}s`;
                        const isCritical = blood.status === 'critical';
                        const isLow = blood.status === 'low';

                        const shimmerClass = isCritical
                          ? 'bar-shimmer bar-shimmer-red'
                          : isLow
                            ? 'bar-shimmer bar-shimmer-amber'
                            : 'bar-shimmer bar-shimmer-emerald';

                        return (
                          <div key={blood.type} className="flex items-center gap-4 text-xs font-semibold">
                            {/* Status live dot */}
                            <div className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
                              {isCritical && (
                                <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              )}
                              {isLow && (
                                <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" style={{ animationDuration: '1.8s' }} />
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? 'bg-[#C21C24]' : isLow ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                            </div>

                            {/* Blood type label */}
                            <span className="w-8 font-bold text-slate-900 text-xs font-mono">{blood.type}</span>

                            {/* Progress bar track with threshold marker */}
                            <div className="relative flex-grow bg-slate-100 rounded-full h-3 overflow-visible">
                              {/* Animated fill bar — starts at 0, transitions to real % on mount */}
                              <div
                                className={`h-3 rounded-full ${shimmerClass}`}
                                style={{
                                  width: barsAnimated ? `${pct}%` : '0%',
                                  transition: `width 1s cubic-bezier(0.34, 1.08, 0.64, 1) ${delay}`,
                                }}
                              />
                              {/* Threshold marker tick */}
                              <div
                                className="threshold-tick absolute top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-slate-400/70 z-10"
                                style={{ left: `${thresholdPct}%` }}
                                title={`Safety threshold: ${blood.threshold} units`}
                              />
                            </div>

                            {/* Unit count */}
                            <span className="w-16 text-right font-bold text-slate-800">{blood.units} units</span>

                            {/* Status badge */}
                            <span className={`w-20 text-[10px] font-bold px-2 py-0.5 rounded text-center border ${isCritical
                              ? 'bg-rose-50 border-rose-100 text-[#C21C24] pulse-red'
                              : isLow
                                ? 'bg-amber-50 border-amber-100 text-amber-700'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              }`}>
                              {isCritical ? 'Critical' : isLow ? 'Low' : 'Stable'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Side Info Cards */}
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-slate-900 text-xs mb-1 uppercase tracking-wider">Gateway Telemetry</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4">{smsLogs.length} matching alerts dispatched via Semaphore API today.</p>
                    <button onClick={() => setTab('smslog')} className="w-full border border-slate-200 text-slate-650 hover:bg-slate-50 py-2 rounded-lg text-xs font-bold transition-all">
                      View Dispatch Logs
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: BLOOD INVENTORY */}
          {tab === 'inventory' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden fade-in">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Blood Type</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Active Inventory</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Safe Minimum</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Reserves Level</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Status Badge</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Operational Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                  {inventory.map((blood) => (
                    <tr
                      key={blood.type}
                      onClick={() => { setSelectedInventoryType(blood.type); setTab('blood_records'); }}
                      className={`hover:bg-slate-50/30 transition-colors cursor-pointer ${blood.status === 'critical' ? 'bg-rose-50/20' : ''}`}
                    >
                      <td className="px-6 py-4"><span className="text-base font-black text-slate-900 font-mono">{blood.type}</span></td>
                      <td className="px-6 py-4">
                        <span className={`text-base font-bold font-mono ${blood.status === 'critical' ? 'text-[#C21C24]' : blood.status === 'low' ? 'text-amber-600' : 'text-slate-800'
                          }`}>{blood.units}</span>
                        <span className="text-slate-400 font-medium ml-1">units</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono">{blood.threshold} units</td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${blood.status === 'critical' ? 'bg-[#C21C24]' : blood.status === 'low' ? 'bg-amber-400' : 'bg-emerald-500'
                              }`}
                            style={{ width: `${Math.min((blood.units / (blood.threshold * 2.5)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${blood.status === 'critical' ? 'bg-rose-50 border-rose-100 text-[#C21C24]' :
                          blood.status === 'low' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          }`}>
                          {blood.status === 'critical' ? 'CRITICAL' : blood.status === 'low' ? 'LOWSTOCK' : 'STABLE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 font-medium flex items-center gap-1 text-[10px]">
                          View Donors <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: BLOOD RECORDS (Specific Blood Type) */}
          {tab === 'blood_records' && selectedInventoryType && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden fade-in">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Donors with Blood Type {selectedInventoryType}</h3>
                <button onClick={() => setTab('inventory')} className="text-xs text-blue-600 hover:underline">Back to Inventory</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Donor Name</th>
                      <th className="px-6 py-3 text-left">Blood Type</th>
                      <th className="px-6 py-3 text-left">Blood Donated Date</th>
                      <th className="px-6 py-3 text-left">Expiry Date (35 Days)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                    {donors.filter(d => d.bloodType === selectedInventoryType).map(donor => {
                      const donatedDate = new Date(donor.lastDonation);
                      const expiryDate = new Date(donatedDate.getTime() + 35 * 24 * 60 * 60 * 1000);
                      return (
                        <tr key={donor.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => { setSelectedDonor(donor); setTab('donor_detail'); }}>
                          <td className="px-6 py-4 font-bold text-slate-900">{donor.name}</td>
                          <td className="px-6 py-4"><span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">{donor.bloodType}</span></td>
                          <td className="px-6 py-4 text-slate-600">{donatedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td className="px-6 py-4 text-slate-500">{expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DONOR DETAIL */}
          {tab === 'donor_detail' && selectedDonor && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden fade-in p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-lg">Donor Details</h3>
                <button onClick={() => setTab('blood_records')} className="text-sm text-blue-600 hover:underline">Back to List</button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div><strong>Name:</strong> {selectedDonor.name}</div>
                <div><strong>Blood Type:</strong> {selectedDonor.bloodType}</div>
                <div><strong>Last Donation:</strong> {new Date(selectedDonor.lastDonation).toLocaleDateString()}</div>
                <div><strong>Expiry Date:</strong> {new Date(new Date(selectedDonor.lastDonation).getTime() + 35 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                <div><strong>Status:</strong> {selectedDonor.status || 'N/A'}</div>
                <div><strong>Contact:</strong> {selectedDonor.phone || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* TAB: DONOR RECALL (CAPSTONE) */}
          {tab === 'recall' && (
            <div className="space-y-6 fade-in">
              {/* Top Panel: Scan & Trigger Section */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">Eligible Donor Detection (Donor Recall)</h3>
                    <p className="text-xs text-slate-500 mt-1">Detects donors whose last donation was 85–90 days ago and triggers SMS notifications.</p>
                  </div>
                  <button
                    onClick={() => setShowSmsConfirmModal(true)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch SMS Recall
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left">Donor Name</th>
                        <th className="px-6 py-3 text-left">Blood Type</th>
                        <th className="px-6 py-3 text-left">Last Donation Date</th>
                        <th className="px-6 py-3 text-left">Days Since Donation</th>
                        <th className="px-6 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {(() => {
                        const eligible = donors.map(donor => {
                          const today = new Date('2026-06-27');
                          const lastDonationDate = new Date(donor.lastDonation);
                          const diffTime = Math.abs(today - lastDonationDate);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return { ...donor, diffDays };
                        }).filter(donor => donor.diffDays >= 85 && donor.diffDays <= 90);

                        if (eligible.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                No eligible donors currently in the 85–90 day recall window.
                              </td>
                            </tr>
                          );
                        }

                        return eligible.map(donor => (
                          <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5 font-bold text-slate-900">{donor.name}</td>
                            <td className="px-6 py-3.5">
                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">{donor.bloodType}</span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-655">{donor.lastDonation}</td>
                            <td className="px-6 py-3.5 text-amber-600 font-extrabold">{donor.diffDays} Days</td>
                            <td className="px-6 py-3.5 text-center">
                              <button
                                onClick={() => {
                                  setAdminRecallConfirm({
                                    isOpen: true,
                                    isBulk: false,
                                    donorName: donor.name,
                                    donorId: donor.id,
                                    eligibleCount: 1,
                                    action: () => {
                                      dispatchRecallSMS(donor.id, authSystemUser?.id || 'USR-002');
                                      const msg = `🩸 Hello ${donor.name}. Your 90-day donation interval is complete! You are eligible to donate again. Visit bloodlinkdvo.ph to learn more.`;
                                      dispatchSMSLog(donor.name, donor.phone || '+63 917 123 4567', msg, '#C21C24', donor.name.split(' ').map(n => n[0]).join(''));
                                      setAdminRecallSuccess({ isOpen: true, message: `Recall SMS dispatched to ${donor.name} via Semaphore Gateway.` });
                                    }
                                  });
                                }}
                                className="bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded font-bold hover:bg-slate-800 transition"
                              >
                                Send Recall
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Panel: Historical Log Table (Matching Table 16 Schema) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">Recall Logs History</h3>
                    <p className="text-xs text-slate-500 mt-1">Logs showing SMS dispatch status, donor responses, and initiating staff.</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Table: donor_recalls</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left">Recall ID</th>
                        <th className="px-6 py-3 text-left">Donor</th>
                        <th className="px-6 py-3 text-left">Recall Date</th>
                        <th className="px-6 py-3 text-center">SMS Status</th>
                        <th className="px-6 py-3 text-center">Donor Response</th>
                        <th className="px-6 py-3 text-left">Processed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {donorRecalls.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                            No dispatch history logged yet.
                          </td>
                        </tr>
                      ) : (
                        donorRecalls.map(r => {
                          const donorObj = donors.find(d => d.id === r.donorId);
                          const userObj = users.find(u => u.id === r.processedBy);
                          return (
                            <tr key={r.recallId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3.5 font-mono text-slate-400 text-[10px]">{r.recallId}</td>
                              <td className="px-6 py-3.5">
                                <p className="font-bold text-slate-900">{donorObj?.name || 'Unknown Donor'}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{r.donorId}</p>
                              </td>
                              <td className="px-6 py-3.5 font-mono text-slate-500">{r.recallDate}</td>
                              <td className="px-6 py-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${r.smsStatus === 'Sent' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                  r.smsStatus === 'Failed' ? 'bg-rose-50 border-rose-100 text-[#C21C24]' :
                                    'bg-amber-50 border-amber-100 text-amber-700'
                                  }`}>
                                  {r.smsStatus}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                {r.donorResponse ? (
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${r.donorResponse === 'Committed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                    r.donorResponse === 'Declined' ? 'bg-rose-50 border-rose-100 text-[#C21C24]' :
                                      'bg-slate-50 border-slate-200 text-slate-650'
                                    }`}>
                                    {r.donorResponse}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal italic">Waiting Response</span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-slate-650">
                                {r.processedBy ? (
                                  <div>
                                    <p className="font-bold text-slate-700">{userObj?.name || r.processedBy}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{userObj?.role || 'Staff'}</p>
                                  </div>
                                ) : (
                                  <span className="text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[9px] font-bold">🤖 Automated System</span>
                                )}
                              </td>
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

          {/* TAB: DONOR TURNOUT LOG */}
          {tab === 'turnout' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden fade-in">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs tracking-tight">Turnout Tracker (Davao Facilities)</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live arrivals feed</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Donor Profile</th>
                      <th className="px-6 py-3 text-left">Blood Type</th>
                      <th className="px-6 py-3 text-left">Target Center</th>
                      <th className="px-6 py-3 text-left">Response Alert</th>
                      <th className="px-6 py-3 text-left">Facility Arrival Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">Maria C. Santos</td>
                      <td className="px-6 py-4"><span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-[#C21C24] font-black rounded text-[10px] font-mono">O-</span></td>
                      <td className="px-6 py-4 text-slate-600">SPMC Blood Production Services</td>
                      <td className="px-6 py-4 text-[#C21C24] font-bold">YES</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${arrivedAtFacility
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'
                          }`}>
                          {arrivedAtFacility ? 'Arrived at Facility' : 'Awaiting Arrival'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">Juan P. Dela Cruz</td>
                      <td className="px-6 py-4"><span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-[#C21C24] font-black rounded text-[10px] font-mono">O-</span></td>
                      <td className="px-6 py-4 text-slate-600">SPMC Blood Production Services</td>
                      <td className="px-6 py-4 text-[#C21C24] font-bold">YES</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50 border-amber-100 text-amber-700">
                          Awaiting Arrival
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">Ana Marie Reyes</td>
                      <td className="px-6 py-4"><span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-[#C21C24] font-black rounded text-[10px] font-mono">O-</span></td>
                      <td className="px-6 py-4 text-slate-600">SPMC Blood Production Services</td>
                      <td className="px-6 py-4 text-[#C21C24] font-bold">YES</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 border-emerald-100 text-emerald-700">
                          Arrived at Facility
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DONOR DENSITY MAP */}
          {tab === 'donormap' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm fade-in">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Blood hospitals partnered with SNBC and other bloodbanks</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#C21C24] rounded-full"></span>SPMC target</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>Registered Donors</span>
                </div>
              </div>
              <div ref={densityMapRef} id="densityMap" className="h-[500px]"></div>
            </div>
          )}

          {/* TAB: USER MANAGEMENT */}
          {tab === 'users' && (
            <div className="space-y-4 fade-in">

              {/* RBAC Role Notice */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Role-Based Access Control (RBAC)</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    {isSuperAdmin
                      ? 'You are logged in as Super Admin. You can manage all system users including Administrator accounts and audit logs.'
                      : 'You are logged in as Administrator. You can verify accounts and create Hospital User logins. Super Admin accounts can only be managed by Super Admins.'}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">System Access Privileges</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{users.length} system users registered</p>
                  </div>
                  {(isSuperAdmin || isAdministrator) && (
                    <div className="relative flex items-center justify-end min-h-[40px] w-full max-w-[520px]">
                      {/* MAIN BUTTON */}
                      <motion.button
                        layout
                        transition={SPRING}
                        onClick={() => setSplitOpen(true)}
                        className="absolute z-10 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                        initial={false}
                        animate={{
                          scaleX: splitOpen ? 1.5 : 1,
                          scaleY: splitOpen ? 0.9 : 1,
                          opacity: splitOpen ? 0 : 1,
                          filter: splitOpen ? 'blur(8px)' : 'blur(0px)',
                          pointerEvents: splitOpen ? 'none' : 'auto',
                        }}
                      >
                        <Plus className="w-4 h-4" /> Add System User
                      </motion.button>

                      {/* SPLIT ROW */}
                      <motion.div
                        layout
                        transition={SPRING}
                        className="absolute z-0 flex items-center justify-end gap-1.5"
                        initial={false}
                        animate={{
                          scaleX: splitOpen ? 1 : 0.2,
                          scaleY: splitOpen ? 1 : 0.9,
                          opacity: splitOpen ? 1 : 0,
                          filter: splitOpen ? 'blur(0px)' : 'blur(8px)',
                          pointerEvents: splitOpen ? 'auto' : 'none',
                        }}
                      >
                        {/* BACK BUTTON */}
                        <motion.button
                          onClick={() => setSplitOpen(false)}
                          className="flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 p-2 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition shadow-sm cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Back"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </motion.button>

                        {[
                          { label: 'Registry', role: 'Registry Staff', roleId: 'ROLE-003' },
                          { label: 'Blood Bank', role: 'Blood Bank Staff', roleId: 'ROLE-004' },
                          { label: 'Issuance', role: 'Issuance Personnel', roleId: 'ROLE-005' },
                          { label: 'Hospital', role: 'Hospital User', roleId: 'ROLE-006' },
                          { label: 'Admin', role: 'Administrator', roleId: 'ROLE-002' },
                          ...(isSuperAdmin ? [{ label: 'Super Admin', role: 'Super Admin', roleId: 'ROLE-001' }] : [])
                        ].map((item, index) => (
                          <motion.button
                            key={index}
                            onClick={() => {
                              setAddUserForm({
                                firstName: '',
                                lastName: '',
                                email: '',
                                passwordHash: '',
                                contactNumber: '',
                                role: item.role,
                                roleId: item.roleId,
                                status: 'Active',
                                hospitalId: ''
                              });
                              setShowAddUserModal(true);
                              setSplitOpen(false);
                            }}
                            className="rounded-lg border border-slate-205 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-slate-900 transition shadow-sm cursor-pointer whitespace-nowrap"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {item.label}
                          </motion.button>
                        ))}
                      </motion.div>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left">User ID</th>
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Role</th>
                        <th className="px-6 py-3 text-left">Email Contact</th>
                        <th className="px-6 py-3 text-left">Account Status</th>
                        {(isSuperAdmin || isAdministrator) && <th className="px-6 py-3 text-left">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                      {users.map((u) => {
                        const roleColors = {
                          'Super Admin': 'bg-purple-50 border-purple-200 text-purple-700',
                          'Administrator': 'bg-blue-50 border-blue-200 text-blue-700',
                          'Registry Staff': 'bg-emerald-50 border-emerald-200 text-emerald-700',
                          'Blood Bank Staff': 'bg-orange-50 border-orange-200 text-orange-700',
                          'Issuance Personnel': 'bg-amber-50 border-amber-200 text-amber-700',
                          'Hospital User': 'bg-slate-50 border-slate-200 text-slate-600',
                        };
                        const roleCls = roleColors[u.role] || 'bg-slate-50 border-slate-200 text-slate-600';
                        const isSuperAdminUser = u.role === 'Super Admin';
                        const canEdit = isSuperAdmin || (!isSuperAdminUser && isAdministrator);
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-400">{u.id}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${roleCls}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-mono">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 border-emerald-100 text-emerald-700">
                                {u.status}
                              </span>
                            </td>
                            {(isSuperAdmin || isAdministrator) && (
                              <td className="px-6 py-4">
                                {canEdit ? (
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setEditUserForm({
                                        firstName: u.firstName || u.name?.split(' ')[0] || '',
                                        lastName: u.lastName || u.name?.split(' ').slice(1).join(' ') || '',
                                        email: u.email || '',
                                        contactNumber: u.contactNumber || '',
                                        role: u.role || 'Registry Staff',
                                        roleId: u.roleId || 'ROLE-003',
                                        status: u.status || 'Active',
                                      });
                                      setShowEditUserModal(true);
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                  >
                                    ✎ Edit
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-300">Protected</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* TAB: DONOR MANAGEMENT */}
          {tab === 'donors' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden fade-in">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="search">
                  <input
                    type="text"
                    placeholder="Search registry..."
                    className="search__input text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="search__button" type="button">
                    <Search className="search__icon" />
                  </button>
                </div>
                <button
                  onClick={() => setFlaggedStatus(!accountFlagged)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${accountFlagged
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{accountFlagged ? 'Medical Hold Applied (Maria Santos)' : 'Flag / Apply Deferral Record'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Registry ID</th>
                      <th className="px-6 py-3 text-left">Donor Name</th>
                      <th className="px-6 py-3 text-left">Blood Type</th>
                      <th className="px-6 py-3 text-left">Phone Number</th>
                      <th className="px-6 py-3 text-left">Donor Status</th>
                      <th className="px-6 py-3 text-left">Registry Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                    {donors
                      .filter(d =>
                        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        d.bloodType.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-slate-400">{d.id}</td>
                          <td className="px-6 py-3.5 font-bold text-slate-900">{d.name}</td>
                          <td className="px-6 py-3.5"><span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">{d.bloodType}</span></td>
                          <td className="px-6 py-3.5 text-slate-500 font-mono font-normal">{d.phone}</td>
                          <td className="px-6 py-3.5">
                            {(() => {
                              const daysSince = Math.floor((new Date() - new Date(d.lastDonation)) / (1000 * 60 * 60 * 24));
                              if (daysSince >= 90) {
                                return <span className="text-amber-650 bg-amber-50 px-2 py-0.5 border border-amber-100 rounded text-[10px] font-bold">Lapsed</span>;
                              }
                              return d.totalDonations > 1 ? (
                                <span className="text-emerald-600 font-bold">Regular</span>
                              ) : (
                                <span className="text-blue-600 font-bold">New</span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${d.name === 'Maria C. Santos' && accountFlagged
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              }`}>
                              {d.name === 'Maria C. Santos' && accountFlagged ? 'Temporary Deferral' : 'Cleared'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SMS LOGS — Table 17 Schema */}
          {tab === 'smslog' && (
            <div className="space-y-5 fade-in">
              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Sent', value: smsLogs.filter(l => l.status === 'Sent').length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'Failed', value: smsLogs.filter(l => l.status === 'Failed').length, color: 'text-[#C21C24]', bg: 'bg-rose-50', border: 'border-rose-100' },
                  { label: 'Pending', value: smsLogs.filter(l => l.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-xl p-4`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">SMS deliveries</p>
                  </div>
                ))}
              </div>

              {/* Full Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">SMS Gateway Transaction Log</h3>
                    <p className="text-xs text-slate-500 mt-1">All SMS delivery attempts via the configured gateway. Failed entries include error details.</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Table: sms_logs</span>
                </div>
                <div className="overflow-x-auto">
                  {smsLogs.length === 0 ? (
                    <div className="px-5 py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                      <span>No SMS transaction records located.</span>
                    </div>
                  ) : (
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3 text-left">SMS ID</th>
                          <th className="px-5 py-3 text-left">Donor</th>
                          <th className="px-5 py-3 text-left">Recall ID</th>
                          <th className="px-5 py-3 text-left">Message</th>
                          <th className="px-5 py-3 text-left">Sent At</th>
                          <th className="px-5 py-3 text-center">Status</th>
                          <th className="px-5 py-3 text-left">Error Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {smsLogs.map((log, i) => (
                          <tr key={log.smsId || i} className="hover:bg-slate-50/50 transition-colors">
                            {/* SMS ID */}
                            <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">{log.smsId || '—'}</td>

                            {/* Donor */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: log.color || '#94a3b8' }}>
                                  {log.initials}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 whitespace-nowrap">{log.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{log.phone}</p>
                                </div>
                              </div>
                            </td>

                            {/* Recall ID */}
                            <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                              {log.recallId || <span className="italic font-normal text-slate-300">none</span>}
                            </td>

                            {/* Message */}
                            <td className="px-5 py-3.5 max-w-xs">
                              <p className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-slate-600 leading-relaxed line-clamp-2">
                                {log.message || log.msg}
                              </p>
                            </td>

                            {/* Sent At */}
                            <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                              {log.sentAt ? (
                                <>
                                  <p>{log.sentAt.split('T')[0]}</p>
                                  <p className="text-slate-400">{log.sentAt.split('T')[1]}</p>
                                </>
                              ) : log.time || '—'}
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap ${log.status === 'Sent' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                log.status === 'Failed' ? 'bg-rose-50 border-rose-100 text-[#C21C24]' :
                                  log.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                    'bg-emerald-50 border-emerald-100 text-emerald-700'
                                }`}>
                                {log.status || 'Sent'}
                              </span>
                            </td>

                            {/* Error Details */}
                            <td className="px-5 py-3.5 max-w-xs">
                              {log.errorMessage
                                ? <p className="bg-rose-50 border border-rose-100 text-[#C21C24] rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed font-mono">{log.errorMessage}</p>
                                : <span className="text-slate-300 italic font-normal">—</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: BLOOD ISSUANCE */}
          {tab === 'issuance' && (
            <div className="space-y-4 fade-in">
              {/* Emergency Retracking Banner */}
              {emergencyBloodType && (() => {
                const logs = getLastDistributionByBloodType(emergencyBloodType);
                return logs.length > 0 ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#C21C24] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-[#C21C24] text-sm mb-1">⚠ Emergency Retrack – {emergencyBloodType} Unavailable</p>
                        <p className="text-xs text-rose-700 mb-3">The last {emergencyBloodType} distribution was sent to the hospitals below. Contact them to check for availability and request a temporary loan.</p>
                        <div className="space-y-2">
                          {logs.slice(0, 3).map(log => {
                            const hosp = hospitals.find(h => h.id === log.hospitalId);
                            return (
                              <div key={log.id} className="bg-white border border-rose-100 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{log.hospitalName}</p>
                                  <p className="text-[10px] text-slate-500">{log.units} bags distributed on {log.date}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-slate-700">{hosp?.contact}</p>
                                  <p className="text-[10px] font-mono text-blue-600">{hosp?.phone}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={() => setEmergencyBloodType(null)} className="text-rose-400 hover:text-rose-600"><XCircle className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">Hospital Blood Issuance Ledger</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Blood bags released to partner hospitals and blood centres</p>
                  </div>
                  <button onClick={() => {
                    setCreateIssuanceForm({
                      hospitalId: hospitals[0]?.id || '',
                      bloodType: 'O+',
                      component: 'PRBC',
                      units: 1,
                      urgency: 'routine',
                      ward: '',
                      diagnosis: '',
                      contactPerson: '',
                      contactNumber: ''
                    });
                    setShowCreateIssuanceModal(true);
                  }} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition flex items-center gap-2 shadow-sm cursor-pointer">
                    <Plus className="w-4 h-4" /> Create Issuance
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 text-left">Reference No</th>
                        <th className="px-6 py-4 text-left">Requesting Hospital</th>
                        <th className="px-6 py-4 text-left">Blood Type / Units</th>
                        <th className="px-6 py-4 text-left">Urgency</th>
                        <th className="px-6 py-4 text-left">Contact Person</th>
                        <th className="px-6 py-4 text-left">Issuance Status</th>
                        <th className="px-6 py-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                      {bloodRequests.map((req) => {
                        const hospRecord = hospitals.find(h => h.id === req.hospitalId);
                        const inventoryItem = inventory.find(i => i.type === req.patientBloodType);
                        const stockInsufficient = inventoryItem && inventoryItem.units < req.units;
                        return (
                          <tr key={req.refNo} className={`hover:bg-slate-50/50 transition-colors ${stockInsufficient ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-400">{req.refNo}</td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{req.hospital}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{hospRecord?.address || req.ward}</p>
                              {req.diagnosis && <p className="text-[9px] text-blue-600 font-bold mt-1">Dx: {req.diagnosis}</p>}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">{req.patientBloodType}</span>
                              <span className="ml-2 font-bold text-slate-800">{req.units} bags</span>
                              {stockInsufficient && (
                                <p className="text-[9px] text-[#C21C24] font-bold mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Insufficient stock
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${req.urgency === 'emergency' ? 'bg-rose-50 border-rose-100 text-[#C21C24]' : req.urgency === 'urgent' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                                }`}>{req.urgency}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{req.contactPerson}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{req.contactNumber}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${req.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                req.status === 'Processing' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                  req.status === 'Fulfilled' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-[#C21C24]'
                                }`}>{req.status}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2 flex-wrap">
                                {req.status === 'Pending' && !stockInsufficient && (
                                  <button onClick={() => handleRequestAction(req.refNo, 'Processing')} className="bg-blue-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded hover:bg-blue-700 transition">Process</button>
                                )}
                                {req.status === 'Pending' && stockInsufficient && (
                                  <button onClick={() => setEmergencyBloodType(req.patientBloodType)} className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded hover:bg-rose-700 transition flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Retrack
                                  </button>
                                )}
                                {req.status === 'Processing' && (
                                  <button onClick={() => updateBloodRequestStatus(req.refNo, 'Fulfilled')} className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded hover:bg-emerald-700 transition">Fulfill</button>
                                )}
                                {req.status !== 'Fulfilled' && req.status !== 'Declined' && (
                                  <button onClick={() => updateBloodRequestStatus(req.refNo, 'Declined')} className="border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[10px] px-2.5 py-1.5 rounded transition">Decline</button>
                                )}
                                {(req.status === 'Fulfilled' || req.status === 'Declined') && (
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HOSPITAL MANAGEMENT – FULL CRUD */}
          {tab === 'hospitals' && (
            <div className="space-y-4 fade-in">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">Partner Hospital & Blood Centre Registry</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{hospitals.length} registered partners</p>
                  </div>
                  <button
                    onClick={() => { setEditingHospital(null); setHospitalForm({ name: '', type: 'Government', contact: '', phone: '', email: '', address: '' }); setShowHospitalModal(true); }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Hospital
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left">ID</th>
                        <th className="px-6 py-3 text-left">Hospital / Blood Centre</th>
                        <th className="px-6 py-3 text-left">Type</th>
                        <th className="px-6 py-3 text-left">Registration Status</th>
                        <th className="px-6 py-3 text-left">Contact Person</th>
                        <th className="px-6 py-3 text-left">Phone</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">Address</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                      {hospitals.map(h => (
                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-400">{h.id}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{h.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${h.type === 'Government' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                              h.type === 'Blood Bank' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                                'bg-slate-50 border-slate-200 text-slate-600'
                              }`}>{h.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${h.registrationStatus === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                              h.registrationStatus === 'Suspended' ? 'bg-rose-50 border-rose-100 text-[#C21C24]' :
                                'bg-amber-50 border-amber-100 text-amber-700'
                              }`}>{h.registrationStatus || 'Pending'}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{h.contact}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">{h.phone}</td>
                          <td className="px-6 py-4 text-slate-500">{h.email}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-[180px] truncate">{h.address}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingHospital(h); setHospitalForm({ name: h.name, type: h.type, contact: h.contact, phone: h.phone, email: h.email || '', address: h.address || '', registrationStatus: h.registrationStatus || 'Pending' }); setShowHospitalModal(true); }}
                                className="border border-blue-100 bg-blue-50 text-blue-700 font-bold text-[10px] px-2.5 py-1 rounded hover:bg-blue-100 transition"
                              >Edit</button>
                              <button
                                onClick={() => { if (window.confirm(`Delete ${h.name}?`)) deleteHospital(h.id); }}
                                className="border border-slate-200 bg-slate-50 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                              >Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DEMAND FORECASTING – OVERVIEW + DRILL-DOWN */}
          {tab === 'forecasting' && (() => {
            // Safety guard — persist middleware may return undefined for new fields
            const gf = Array.isArray(granularForecasts) ? granularForecasts : [];

            const isOverview = fcHospital === 'ALL' && fcBloodType === 'ALL' && fcComponent === 'ALL';

            // ── OVERVIEW MODE: Aggregate all forecasts per week ──
            const allWeekLabels = [...new Set(gf.map(f => f.forecastWeekLabel))].sort();
            const overviewChartData = (() => {
              // Historical: sum actuals per week slot across all combos (use a representative sample to avoid double-counting)
              // Each unique (hospital, bloodType, component) combo has the same historicalWeeks dates → grab one set
              const sampleHistorical = gf[0]?.historicalWeeks || [];

              const histPart = sampleHistorical.map((w, idx) => {
                // Sum actuals for this week index across all unique combos (plain object, no Map constructor)
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

              // Predicted: sum predictedDemand for each forecastWeekLabel
              const predPart = allWeekLabels.map(wkLabel => {
                const rows = gf.filter(f => f.forecastWeekLabel === wkLabel);
                const totalPred = rows.reduce((s, f) => s + f.predictedDemand, 0);
                const totalUpper = rows.reduce((s, f) => s + f.upperBound, 0);
                const totalLower = rows.reduce((s, f) => s + f.lowerBound, 0);
                return { label: wkLabel, actual: null, predicted: totalPred, upper: totalUpper, lower: totalLower };
              });

              return [...histPart, ...predPart];
            })();

            // ── FILTERED MODE: specific combo ──
            const filtered = gf.filter(f =>
              (fcHospital === 'ALL' || f.hospitalId === fcHospital) &&
              (fcBloodType === 'ALL' || f.bloodTypeId === fcBloodType) &&
              (fcComponent === 'ALL' || f.componentId === fcComponent)
            );

            // Aggregate filtered by week (when partially filtered, sum remaining)
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
                          className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                          ↩ Reset to Overview
                        </button>
                      )}
                      <button onClick={() => generateGranularForecast(fcWeeks)}
                        className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-sm">
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
                        <p className="text-2xl font-extrabold text-slate-900 font-mono">{totalForecastedUnitsNextWk}</p>
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
                        <p className="text-2xl font-extrabold text-amber-600 font-mono">{highestDemandCombo?.predictedDemand ?? '—'}</p>
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
                            return (
                              <button key={hosp.id} onClick={() => { setFcHospital(hosp.id); setRecHospital(hosp.id); }}
                                className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition text-left group">
                                <div className="w-36 flex-shrink-0">
                                  <p className="font-bold text-slate-800 text-xs leading-tight group-hover:text-indigo-600 transition">{hosp.name.split('(')[0].trim()}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{hosp.id}</p>
                                </div>
                                <div className="flex-1">
                                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${barW}%` }} />
                                  </div>
                                </div>
                                <div className="w-20 text-right flex-shrink-0">
                                  <span className="font-extrabold text-slate-900 font-mono text-sm">{total}</span>
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
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-indigo-50/40 transition text-left group"
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
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${isRising ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                        isFalling ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                          'bg-slate-50 border-slate-200 text-slate-500'
                                        }`}>
                                        {isRising ? '↑ Rising' : isFalling ? '↓ Falling' : '→ Stable'}
                                      </span>
                                    </div>

                                    {/* Bag count */}
                                    <div className="w-24 text-right flex-shrink-0">
                                      <span className="font-black text-indigo-600 font-mono text-base">{totalBags}</span>
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
                                <p className="text-2xl font-black text-indigo-600 font-mono">{totalBags}</p>
                                <p className="text-[10px] text-slate-400">total bags next week</p>
                              </div>
                            </div>

                            {/* KPI strip */}
                            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                              {[
                                { label: 'Blood Types', value: byType.length },
                                { label: 'Components', value: [...new Set(hospRows.map(f => f.componentId))].length },
                                { label: 'Highest Demand', value: hospRows.length ? hospRows.reduce((a, b) => b.predictedDemand > a.predictedDemand ? b : a, hospRows[0]) : null, render: v => v ? `${v.bloodTypeId} ${v.componentId}` : '—' },
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
                                      <span className="font-black text-indigo-600 font-mono text-sm">{total}</span>
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
                                          <span className="font-extrabold text-slate-800 font-mono text-sm w-8 text-right">{f.predictedDemand}</span>
                                          <span className="text-[9px] text-slate-400 w-16 text-right">±{f.lowerBound}–{f.upperBound}</span>
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border w-16 text-center ${f.slope > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' :
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

          {/* TAB: DISTRIBUTION RECOMMENDATION (CAPSTONE) – EQUITY ALGORITHM */}
          {/* TAB: DISTRIBUTION RECOMMENDATION (CAPSTONE) – EQUITY ALGORITHM */}
          {tab === 'distribution' && (() => {
            const allocations = getEquityAllocations();
            return (
              <div className="space-y-5 fade-in">
                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-bold mb-0.5">Equity-Based Blood Distribution Algorithm</p>
                    <p className="text-blue-700">Allocations are computed proportionally based on hospital type weighting (Government 1.5×, Blood Bank 1.2×, Private 1.0×) and the next predicted demand week. Only units above the safety threshold are released.</p>
                  </div>
                </div>

                {allocations.map(({ bloodType, status, allocations: hospAllocs }) => (
                  <div key={bloodType} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className={`px-6 py-3 border-b border-slate-100 flex items-center justify-between ${status === 'critical' ? 'bg-rose-50/30' : status === 'low' ? 'bg-amber-50/20' : ''
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-sm font-mono">{bloodType}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${status === 'critical' ? 'text-[#C21C24]' : status === 'low' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>{status === 'critical' ? '⚠ Critical' : status === 'low' ? '↓ Low Stock' : '✓ Stable'}</span>
                        <span className="text-[10px] text-slate-400">Stock: {hospAllocs[0]?.currentStock} / Threshold: {hospAllocs[0]?.threshold} / Releasable: {hospAllocs[0]?.safeToRelease}</span>
                      </div>
                      {hospAllocs[0]?.safeToRelease === 0 && (
                        <button onClick={() => handleEmergencyRetrack(bloodType)} className="flex items-center gap-1.5 text-[10px] font-bold text-[#C21C24] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded hover:bg-rose-100 transition">
                          <AlertTriangle className="w-3 h-3" /> Emergency Retrack
                        </button>
                      )}
                    </div>
                    {hospAllocs[0]?.safeToRelease > 0 ? (
                      <table className="min-w-full">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-3 text-left">Hospital / Centre</th>
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-left">Weight</th>
                            <th className="px-6 py-3 text-left">Suggested Units</th>
                            <th className="px-6 py-3 text-left">Emergency Contact</th>
                            <th className="px-6 py-3 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                          {hospAllocs.map(a => (
                            <tr key={a.hospitalId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 font-bold text-slate-900">{a.hospitalName}</td>
                              <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${a.hospitalType === 'Government' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                  a.hospitalType === 'Blood Bank' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                                    'bg-slate-50 border-slate-200 text-slate-600'
                                  }`}>{a.hospitalType}</span>
                              </td>
                              <td className="px-6 py-3 font-mono text-slate-600">{a.hospitalType === 'Government' ? '1.5×' : a.hospitalType === 'Blood Bank' ? '1.2×' : '1.0×'}</td>
                              <td className="px-6 py-3">
                                <span className="text-lg font-black text-slate-900 font-mono">{a.suggestedUnits}</span>
                                <span className="text-slate-400 ml-1 text-[10px]">bags</span>
                              </td>
                              <td className="px-6 py-3">
                                <p className="font-bold text-slate-700">{a.hospitalContact}</p>
                                <p className="font-mono text-[10px] text-blue-600">{a.hospitalPhone}</p>
                              </td>
                              <td className="px-6 py-3">
                                {a.suggestedUnits > 0 ? (
                                  <button
                                    onClick={() => {
                                      setAllocateTarget({ hospitalId: a.hospitalId, hospitalName: a.hospitalName, bloodType, units: a.suggestedUnits });
                                      setShowAllocateModal(true);
                                    }}
                                    className="bg-emerald-600 text-white font-bold text-[10px] px-3 py-1.5 rounded hover:bg-emerald-700 transition"
                                  >
                                    Allocate
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400">No surplus</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="px-6 py-5 text-xs text-amber-700 font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Cannot allocate – stock is at or below safety threshold. Use Emergency Retrack to locate a lending source.
                      </div>
                    )}
                  </div>
                ))}
                {/* PERSISTENT RECOMMENDATIONS REQUIRING APPROVAL (Table 15) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                        <Database className="w-4 h-4 text-indigo-600" /> Distribution Recommendations
                        <span className="text-[10px] font-mono text-slate-400 ml-1">Table 15</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Output of the Equity-Based Allocation algorithm. Nothing takes effect until an Administrator explicitly approves it.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (granularForecasts.length === 0) {
                          generateGranularForecast(4);
                          setTimeout(() => generateRecommendationsFromForecast(), 100);
                        } else {
                          generateRecommendationsFromForecast();
                        }
                      }}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Generate from Latest Forecast
                    </button>
                  </div>

                  {/* Status filter tabs */}
                  {(() => {
                    const allRecs = recommendations || [];
                    const counts = {
                      All: allRecs.length,
                      Pending: allRecs.filter(r => r.status === 'Pending').length,
                      Approved: allRecs.filter(r => r.status === 'Approved').length,
                      Rejected: allRecs.filter(r => r.status === 'Rejected').length,
                    };
                    const [recFilter, setRecFilter] = window.__recFilterState || [null, null];
                    // Use local state via a simple trick — read from dataset
                    const activeFilter = document.getElementById('rec-filter-active')?.dataset?.filter || 'All';

                    const filtered = activeFilter === 'All' ? allRecs :
                      allRecs.filter(r => r.status === activeFilter);

                    return (
                      <>
                        <div className="px-6 pt-3 pb-0 flex gap-2 border-b border-slate-100">
                          {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
                            <button
                              key={f}
                              id={f === 'All' ? 'rec-filter-active' : undefined}
                              data-filter={f === activeFilter ? f : undefined}
                              onClick={e => {
                                // Toggle active filter via DOM dataset
                                document.getElementById('rec-filter-active')?.removeAttribute('id');
                                e.currentTarget.id = 'rec-filter-active';
                                e.currentTarget.dataset.filter = f;
                                // Force re-render by dispatching a harmless state update
                                document.getElementById('rec-filter-active').dispatchEvent(new Event('change', { bubbles: true }));
                              }}
                              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition -mb-px ${activeFilter === f
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                              {f} <span className="ml-1 bg-slate-100 px-1 rounded font-mono">{counts[f]}</span>
                            </button>
                          ))}
                        </div>

                        <div className="overflow-x-auto">
                          {allRecs.length === 0 ? (
                            <div className="px-6 py-12 text-center text-slate-400 text-xs">
                              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p>No recommendations yet. Click <strong>Generate from Latest Forecast</strong> to create recommendations from the MLR forecast output.</p>
                            </div>
                          ) : (
                            <table className="min-w-full text-left text-xs font-semibold text-slate-650">
                              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <tr>
                                  <th className="px-5 py-3 text-left">Rec. ID</th>
                                  <th className="px-5 py-3 text-left">Forecast ID</th>
                                  <th className="px-5 py-3 text-left">Hospital</th>
                                  <th className="px-5 py-3 text-center">Blood Type</th>
                                  <th className="px-5 py-3 text-left">Component</th>
                                  <th className="px-5 py-3 text-center">Qty</th>
                                  <th className="px-5 py-3 text-left">Date Generated</th>
                                  <th className="px-5 py-3 text-center">Status</th>
                                  <th className="px-5 py-3 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {allRecs.map(rec => {
                                  const hosp = hospitals.find(h => h.id === rec.hospitalId);
                                  return (
                                    <tr key={rec.recommendationId} className="hover:bg-slate-50/50 transition-colors">
                                      {/* Rec ID */}
                                      <td className="px-5 py-3 font-mono font-bold text-slate-900 text-[10px]">{rec.recommendationId}</td>

                                      {/* Forecast ID — FK link */}
                                      <td className="px-5 py-3">
                                        <span className="font-mono text-[10px] bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                          #{rec.forecastId}
                                        </span>
                                      </td>

                                      {/* Hospital */}
                                      <td className="px-5 py-3 font-bold text-slate-800 whitespace-nowrap">
                                        {rec.hospitalName || hosp?.name || rec.hospitalId}
                                      </td>

                                      {/* Blood Type */}
                                      <td className="px-5 py-3 text-center">
                                        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[10px] font-mono">
                                          {rec.bloodTypeId}
                                        </span>
                                      </td>

                                      {/* Component */}
                                      <td className="px-5 py-3 text-slate-700">{rec.componentId}</td>

                                      {/* Qty */}
                                      <td className="px-5 py-3 text-center font-mono font-bold text-slate-900">
                                        {rec.recommendedQuantity}
                                        <span className="text-[9px] text-slate-400 ml-1">bags</span>
                                      </td>

                                      {/* Date Generated */}
                                      <td className="px-5 py-3 font-mono text-[10px] text-slate-500">
                                        {rec.recommendationDate || '—'}
                                      </td>

                                      {/* Status */}
                                      <td className="px-5 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap ${rec.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                          rec.status === 'Rejected' ? 'bg-rose-50 text-[#C21C24] border-rose-100' :
                                            'bg-amber-50 text-amber-700 border-amber-100'
                                          }`}>
                                          {rec.status}
                                        </span>
                                      </td>

                                      {/* Actions */}
                                      <td className="px-5 py-3">
                                        {rec.status === 'Pending' ? (
                                          <div className="flex items-center justify-center gap-2">
                                            <button
                                              onClick={() => approveRecommendation(rec.recommendationId)}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1 rounded transition"
                                            >
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => rejectRecommendation(rec.recommendationId)}
                                              className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[10px] px-3 py-1 rounded transition"
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="text-center text-[10px] text-slate-400">
                                            <p className="font-bold text-slate-600">{rec.approvedBy || '—'}</p>
                                            <p className="font-mono">{rec.actedAt ? rec.actedAt.replace('T', ' ') : ''}</p>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>
            );
          })()}

          {/* TAB: DISTRIBUTION HISTORY */}
          {tab === 'hospital_history' && (
            <div className="space-y-4 fade-in">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">Distribution Summary</h3>
                  <select
                    value={distHospitalFilter}
                    onChange={e => setDistHospitalFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-slate-50 outline-none focus:border-slate-800"
                  >
                    <option value="ALL">All Hospitals</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left">Dist. ID</th>
                        <th className="px-6 py-3 text-left">Hospital</th>
                        <th className="px-6 py-3 text-left">Units Released</th>
                        <th className="px-6 py-3 text-left">Date</th>
                        <th className="px-6 py-3 text-left">Allocated By</th>
                        <th className="px-6 py-3 text-left">View Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                      {distributionLog
                        .filter(log => distHospitalFilter === 'ALL' || log.hospitalId === distHospitalFilter)
                        .filter(log => !emergencyBloodType || log.bloodType === emergencyBloodType)
                        .map(log => (
                          <tr
                            key={log.id}
                            className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                            onClick={() => openDistLog(log)}
                          >
                            <td className="px-6 py-3 font-mono text-[11px] font-bold text-slate-400">{log.id}</td>
                            <td className="px-6 py-3 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{log.hospitalName}</td>
                            <td className="px-6 py-3 font-bold text-slate-800 font-mono">{log.units} bags</td>
                            <td className="px-6 py-3 text-slate-600">{log.date}</td>
                            <td className="px-6 py-3 text-slate-500">{log.allocatedBy}</td>
                            <td className="px-6 py-3">
                              <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1 font-bold">View Record <ChevronRight className="w-3 h-3" /></span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {distributionLog
                    .filter(log => distHospitalFilter === 'ALL' || log.hospitalId === distHospitalFilter)
                    .filter(log => !emergencyBloodType || log.bloodType === emergencyBloodType)
                    .length === 0 && (
                      <div className="px-6 py-12 text-center text-slate-400 text-xs">No distribution records found.</div>
                    )}
                </div>
              </div>

              {/* Emergency Retrack highlight banner */}
              {emergencyBloodType && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#C21C24] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-[#C21C24] text-sm mb-0.5">Emergency Retrack – Blood Type {emergencyBloodType}</p>
                    <p className="text-xs text-rose-700">Showing only <strong>{emergencyBloodType}</strong> distributions. Click any row to view full details and locate a possible lending source.</p>
                  </div>
                  <button onClick={() => setEmergencyBloodType(null)} className="text-rose-400 hover:text-rose-600"><XCircle className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          )}

          {/* TAB: DISTRIBUTION RECORD DETAIL (inline page, same pattern as blood_records) */}
          {tab === 'dist_record_detail' && selectedDistLog && (() => {
            const fmt = d => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            const getBulkDistributionData = (log) => {
              const types = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

              return types.map(type => {
                let unitsReleased = 0;
                if (type === log.bloodType) {
                  unitsReleased = log.units;
                } else {
                  // Deterministic mock units released in bulk for other types based on record ID
                  const hash = (log.id.charCodeAt(log.id.length - 1) + type.charCodeAt(0)) % 5;
                  unitsReleased = hash === 0 ? 0 : hash === 1 ? 1 : hash === 2 ? 2 : 0;
                }

                const distDate = new Date(log.date);
                const requestDate = new Date(distDate.getTime() - 2 * 24 * 60 * 60 * 1000);
                const expiryDate = new Date(distDate.getTime() + 35 * 24 * 60 * 60 * 1000);

                return {
                  type,
                  unitsReleased,
                  requestDate,
                  distDate,
                  expiryDate
                };
              });
            };

            return (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden fade-in space-y-4 p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">Distribution Record — {selectedDistLog.id}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedDistLog.hospitalName}</p>
                  </div>
                  <button
                    onClick={() => setTab('hospital_history')}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >← Back to Distribution Summary</button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-6 py-3">Blood Type</th>
                        <th className="px-6 py-3">Units Released</th>
                        <th className="px-6 py-3">Date of Request</th>
                        <th className="px-6 py-3">Date of Distribution</th>
                        <th className="px-6 py-3">Expiry Date (35-day)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-655">
                      {getBulkDistributionData(selectedDistLog).map((item) => (
                        <tr key={item.type} className={`hover:bg-slate-50/50 transition-colors ${item.unitsReleased > 0 ? 'bg-emerald-50/10' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="text-base font-black text-slate-900 font-mono">{item.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            {item.unitsReleased > 0 ? (
                              <>
                                <span className="text-base font-bold font-mono text-slate-800">{item.unitsReleased}</span>
                                <span className="text-slate-400 font-medium ml-1">units</span>
                              </>
                            ) : (
                              <span className="text-slate-350 font-normal">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {item.unitsReleased > 0 ? (
                              <span className="text-slate-600 font-mono">{fmt(item.requestDate)}</span>
                            ) : (
                              <span className="text-slate-350 font-normal">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {item.unitsReleased > 0 ? (
                              <span className="text-emerald-700 font-bold font-mono">{fmt(item.distDate)}</span>
                            ) : (
                              <span className="text-slate-350 font-normal">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {item.unitsReleased > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-100 border-slate-200 text-slate-700 font-mono">
                                {fmt(item.expiryDate)}
                              </span>
                            ) : (
                              <span className="text-slate-350 font-normal">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Extra hospital info footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-6">
                    <span><span className="font-bold text-slate-700">Receiving Hospital:</span> {selectedDistLog.hospitalName}</span>
                    <span><span className="font-bold text-slate-700">Allocated By:</span> {selectedDistLog.allocatedBy}</span>
                    <span><span className="font-bold text-slate-700">Record ID:</span> <span className="font-mono">{selectedDistLog.id}</span></span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB: REPORTS */}
          {tab === 'reports' && (() => {
            const mbdData = [
              { venue: 'Davao City Hall', date: '2026-06-20', target: 100, collected: 85, deferrals: 15, ncu: 1, ns: 84 },
              { venue: 'Gaisano Mall Bajada', date: '2026-06-15', target: 50, collected: 48, deferrals: 8, ncu: 0, ns: 48 },
              { venue: 'SM City Davao', date: '2026-06-10', target: 80, collected: 82, deferrals: 12, ncu: 2, ns: 80 },
              { venue: 'SPMC Compound Campaign', date: '2026-06-05', target: 120, collected: 115, deferrals: 18, ncu: 3, ns: 112 },
            ];

            const totalMbdCollected = mbdData.reduce((sum, item) => sum + item.collected, 0);
            const totalMbdTarget = mbdData.reduce((sum, item) => sum + item.target, 0);
            const avgMbdTurnout = Math.round((totalMbdCollected / totalMbdTarget) * 100);

            return (
              <div className="space-y-4 fade-in">
                {/* Reports Header & Toggle */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReportsTab('stock')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${reportsTab === 'stock'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100'
                        }`}
                    >
                      Daily Stock Summary
                    </button>
                    <button
                      onClick={() => setReportsTab('mbd')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${reportsTab === 'mbd'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-655 hover:bg-slate-100'
                        }`}
                    >
                      MBD Collections Report
                    </button>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Print / Export PDF
                  </button>
                </div>

                {/* Report Content */}
                {reportsTab === 'stock' ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 print:border-none print:shadow-none">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-4 text-center">
                      <h3 className="font-extrabold text-slate-900 text-base">SNBC DAILY BLOOD STOCK REPORT</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">GENERATED ON: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} | SYSTEM: BLOODLINK DVO</p>
                    </div>

                    {/* Stock Overview Table */}
                    <div className="overflow-x-auto border border-slate-150 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider text-left">
                          <tr>
                            <th className="px-6 py-3">Blood Type</th>
                            <th className="px-6 py-3 text-center">PRBC (bags)</th>
                            <th className="px-6 py-3 text-center">Platelets (bags)</th>
                            <th className="px-6 py-3 text-center">FFP (bags)</th>
                            <th className="px-6 py-3 text-center">Cryo (bags)</th>
                            <th className="px-6 py-3 text-center">CryoSup (bags)</th>
                            <th className="px-6 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                          {inventory.map((item) => (
                            <tr key={item.type} className="hover:bg-slate-50/30">
                              <td className="px-6 py-4 font-black text-slate-900 font-mono">{item.type}</td>
                              <td className="px-6 py-4 text-center font-bold text-slate-800 font-mono">{item.units}</td>
                              <td className="px-6 py-4 text-center text-slate-600 font-mono">{item.platelets || 0}</td>
                              <td className="px-6 py-4 text-center text-slate-600 font-mono">{item.ffp || 0}</td>
                              <td className="px-6 py-4 text-center text-slate-600 font-mono">{item.cryo || 0}</td>
                              <td className="px-6 py-4 text-center text-slate-600 font-mono">{item.cryosup || 0}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.status === 'safe'
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                  : item.status === 'low'
                                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                                    : 'bg-rose-50 border-rose-100 text-[#C21C24]'
                                  }`}>
                                  {item.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-bold border-t border-slate-200">
                            <td className="px-6 py-4 text-slate-800">TOTAL BAGS</td>
                            <td className="px-6 py-4 text-center text-slate-900 font-mono">{inventory.reduce((s, i) => s + (i.units || 0), 0)}</td>
                            <td className="px-6 py-4 text-center text-slate-900 font-mono">{inventory.reduce((s, i) => s + (i.platelets || 0), 0)}</td>
                            <td className="px-6 py-4 text-center text-slate-900 font-mono">{inventory.reduce((s, i) => s + (i.ffp || 0), 0)}</td>
                            <td className="px-6 py-4 text-center text-slate-900 font-mono">{inventory.reduce((s, i) => s + (i.cryo || 0), 0)}</td>
                            <td className="px-6 py-4 text-center text-slate-900 font-mono">{inventory.reduce((s, i) => s + (i.cryosup || 0), 0)}</td>
                            <td className="px-6 py-4 text-center text-slate-500">—</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 print:border-none print:shadow-none">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-4 text-center">
                      <h3 className="font-extrabold text-slate-900 text-base">MOBILE BLOOD DONATION (MBD) COLLECTIONS REPORT</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">GENERATED ON: {new Date().toLocaleDateString()} | SOURCE: REGISTRY & LAB SYNC</p>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Collected Bags</p>
                        <p className="text-xl font-extrabold text-slate-900 font-mono">{totalMbdCollected}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Average Turnout Rate</p>
                        <p className="text-xl font-extrabold text-indigo-600 font-mono">{avgMbdTurnout}%</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Deferral Records</p>
                        <p className="text-xl font-extrabold text-amber-600 font-mono">{mbdData.reduce((s, i) => s + i.deferrals, 0)}</p>
                      </div>
                    </div>

                    {/* Camps Table */}
                    <div className="overflow-x-auto border border-slate-150 rounded-lg">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider text-left">
                          <tr>
                            <th className="px-6 py-3">MBD Venue / Campaign</th>
                            <th className="px-6 py-3 text-center">Date</th>
                            <th className="px-6 py-3 text-center">Target (bags)</th>
                            <th className="px-6 py-3 text-center">Collected (bags)</th>
                            <th className="px-6 py-3 text-center">Turnout</th>
                            <th className="px-6 py-3 text-center">Deferrals</th>
                            <th className="px-6 py-3 text-center">Serology Positive (NCU)</th>
                            <th className="px-6 py-3 text-center">Serology Negative (NS)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                          {mbdData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30">
                              <td className="px-6 py-4 font-bold text-slate-900">{item.venue}</td>
                              <td className="px-6 py-4 text-center text-slate-500 font-mono">{item.date}</td>
                              <td className="px-6 py-4 text-center font-bold text-slate-600 font-mono">{item.target}</td>
                              <td className="px-6 py-4 text-center font-bold text-slate-800 font-mono">{item.collected}</td>
                              <td className="px-6 py-4 text-center font-bold text-slate-900 font-mono">{Math.round((item.collected / item.target) * 100)}%</td>
                              <td className="px-6 py-4 text-center text-amber-600 font-mono">{item.deferrals}</td>
                              <td className="px-6 py-4 text-center text-rose-600 font-mono">{item.ncu}</td>
                              <td className="px-6 py-4 text-center text-emerald-700 font-mono">{item.ns}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: AUDIT LOGS (Table 18) */}
          {tab === 'audit_logs' && isSuperAdmin && (
            <div className="space-y-4 fade-in">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">Audit Logs (Table 18)</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded">
                    Total: {auditLogs ? auditLogs.length : 0} logs
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs font-semibold text-slate-650">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-6 py-3">Log ID</th>
                        <th className="px-6 py-3">User ID</th>
                        <th className="px-6 py-3">Action</th>
                        <th className="px-6 py-3">Module</th>
                        <th className="px-6 py-3 text-center">Record ID</th>
                        <th className="px-6 py-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-normal text-slate-600">
                      {(auditLogs || []).map((log) => (
                        <tr key={log.logId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{log.logId}</td>
                          <td className="px-6 py-3.5 font-mono text-slate-500">{log.userId}</td>
                          <td className="px-6 py-3.5 font-medium text-slate-800">{log.action}</td>
                          <td className="px-6 py-3.5">
                            <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center">
                              {log.module}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center font-mono text-[10px]">{log.recordId || '—'}</td>
                          <td className="px-6 py-3.5 text-slate-450 font-mono text-[10px]">{log.performedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── DONATION EVENTS TAB (Table 6) ─────────────────────────────── */}
          {tab === 'donation_events' && (
            <div className="space-y-4 fade-in">

              {/* Header card */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                      <Calendar size={15} className="text-red-600" />
                      Donation Events — Table 6
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Manage scheduled blood donation drives and collection events</p>
                  </div>
                  <button
                    onClick={() => {
                      setEventForm({
                        province: 'Davao del Sur',
                        cityMunicipality: 'Davao City',
                        barangayOrganization: '',
                        eventDate: new Date().toISOString().slice(0, 10)
                      });
                      setEventSaved(false);
                      setShowEventModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all shadow-sm"
                  >
                    <Plus size={13} /> Add Event
                  </button>
                </div>

                {/* Events Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs font-semibold text-slate-650">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-5 py-3">Event ID</th>
                        <th className="px-5 py-3">Province</th>
                        <th className="px-5 py-3">City / Municipality</th>
                        <th className="px-5 py-3">Barangay / Organization</th>
                        <th className="px-5 py-3">Event Date</th>
                        <th className="px-5 py-3">Registered By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-normal text-slate-600">
                      {(donationEvents || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-[11px]">
                            <Calendar size={28} className="mx-auto mb-2 opacity-25" />
                            No donation events recorded yet. Click <strong>Add Event</strong> to create one.
                          </td>
                        </tr>
                      ) : (
                        (donationEvents || []).map((ev) => (
                          <tr key={ev.eventId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{ev.eventId}</td>
                            <td className="px-5 py-3.5">{ev.province}</td>
                            <td className="px-5 py-3.5">{ev.cityMunicipality}</td>
                            <td className="px-5 py-3.5">{ev.barangayOrganization || <span className="text-slate-300">—</span>}</td>
                            <td className="px-5 py-3.5">
                              <span className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                {ev.eventDate}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-450 text-[10px]">{ev.registeredBy || authSystemUser?.username || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* NOTE MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h4 className="font-bold text-sm text-slate-900 mb-1 tracking-tight">Pre-Submission Status Action Note</h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Enter a reference message that will immediately sync to the user's dashboard registry log.</p>
            <textarea
              rows="3"
              placeholder="e.g. Attending doctor signature validated. Staging units at SPMC center release desk. Present original form upon collection."
              className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none resize-none mb-4 bg-slate-50/45"
              value={selectedRequestNote}
              onChange={(e) => setSelectedRequestNote(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-2.5 text-xs font-semibold">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-650 rounded hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveRequestStatusWithNote}
                className="px-4 py-2 bg-blue-650 text-white rounded hover:bg-blue-700 transition-all shadow-sm"
              >
                Save Status note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOSPITAL CRUD MODAL */}
      {showHospitalModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-lg shadow-xl fade-in">
            <h4 className="font-bold text-sm text-slate-900 mb-1 tracking-tight">
              {editingHospital ? 'Edit Hospital / Blood Centre' : 'Add Hospital / Blood Centre'}
            </h4>
            <p className="text-xs text-slate-400 mb-5">All fields are used for the distribution algorithm and emergency contact lookup.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Hospital / Centre Name</label>
                <input type="text" value={hospitalForm.name} onChange={e => setHospitalForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Davao Medical School Foundation" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition bg-slate-50/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Type</label>
                <select value={hospitalForm.type} onChange={e => setHospitalForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-slate-800">
                  <option>Government</option>
                  <option>Private</option>
                  <option>Blood Bank</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Contact Person</label>
                <input type="text" value={hospitalForm.contact} onChange={e => setHospitalForm(f => ({ ...f, contact: e.target.value }))} placeholder="Dr. Juan Dela Cruz" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition bg-slate-50/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Phone</label>
                <input type="text" value={hospitalForm.phone} onChange={e => setHospitalForm(f => ({ ...f, phone: e.target.value }))} placeholder="0917-000-0000" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition bg-slate-50/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" value={hospitalForm.email} onChange={e => setHospitalForm(f => ({ ...f, email: e.target.value }))} placeholder="blood@hospital.ph" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition bg-slate-50/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Registration Status</label>
                <select value={hospitalForm.registrationStatus} onChange={e => setHospitalForm(f => ({ ...f, registrationStatus: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-slate-800">
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Suspended</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Address</label>
                <input type="text" value={hospitalForm.address} onChange={e => setHospitalForm(f => ({ ...f, address: e.target.value }))} placeholder="Purok 5, Tigatto, Davao City" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none transition bg-slate-50/50" />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 text-xs font-semibold mt-5">
              <button onClick={() => setShowHospitalModal(false)} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-650 rounded hover:bg-slate-100 transition-all">Cancel</button>
              <button
                onClick={() => {
                  if (!hospitalForm.name.trim()) return setNoticeModal({ isOpen: true, title: 'Required Field Missing', message: 'Hospital name is required.', variant: 'warning' });

                  if (!editingHospital) {
                    const isDup = hospitals.some(h => h.name.toLowerCase() === hospitalForm.name.trim().toLowerCase());
                    if (isDup) {
                      return setNoticeModal({
                        isOpen: true,
                        title: 'Duplicate Entry Detected',
                        message: `A hospital with the name "${hospitalForm.name.trim()}" is already registered in the system.`,
                        variant: 'danger'
                      });
                    }
                  }

                  if (editingHospital) {
                    updateHospital(editingHospital.id, hospitalForm);
                  } else {
                    addHospital(hospitalForm);
                  }
                  setShowHospitalModal(false);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition-all shadow-sm"
              >
                {editingHospital ? 'Save Changes' : 'Add Hospital'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribution log detail is now an inline page (tab === 'dist_record_detail'), not a modal */}

      {/* ALLOCATE CONFIRMATION MODAL */}
      {showAllocateModal && allocateTarget && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowAllocateModal(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm modal-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white rounded-t-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm Allocation</p>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight">Release Blood Stock</h4>
            </div>
            <div className="p-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  You are about to release{' '}
                  <span className="font-black text-slate-900">{allocateTarget.units} bags</span> of{' '}
                  <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded text-[11px] font-mono">{allocateTarget.bloodType}</span>{' '}
                  to <span className="font-bold text-slate-900">{allocateTarget.hospitalName}</span>.
                </p>
                <p className="text-[10px] text-slate-500 mt-2">This will immediately decrement the inventory and log the distribution. This action cannot be undone.</p>
              </div>
              <div className="flex gap-2.5 text-xs font-semibold">
                <button
                  onClick={() => setShowAllocateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-650 rounded-lg hover:bg-slate-100 transition"
                >Cancel</button>
                <button
                  onClick={() => {
                    recordDistribution(allocateTarget.hospitalId, allocateTarget.hospitalName, allocateTarget.bloodType, allocateTarget.units);
                    setShowAllocateModal(false);
                    setAllocateTarget(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
                >Confirm Allocate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH SMS RECALL CONFIRMATION MODAL */}
      {showSmsConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowSmsConfirmModal(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm modal-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm SMS Dispatch</p>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight">Send Donor Recall Messages</h4>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">You are about to send <span className="font-black text-slate-900">automated SMS recall messages</span> to all eligible donors (85–90 day interval complete) via the <span className="font-bold text-blue-700">Semaphore Philippine Gateway</span>.</p>
                <p className="text-[10px] text-slate-500 bg-white/70 border border-blue-100 rounded-lg p-2.5 font-mono leading-relaxed">"Hello [Donor]. Your 90-day donation interval is complete! You are eligible to donate again. Visit bloodlinkdvo.ph."</p>
              </div>
              <div className="flex gap-2.5 text-xs font-semibold">
                <button
                  onClick={() => setShowSmsConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-650 rounded-lg hover:bg-slate-100 transition"
                >Cancel</button>
                <button
                  onClick={() => {
                    dispatchEligibilityReminders();
                    setShowSmsConfirmModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-1.5"
                ><Send className="w-3.5 h-3.5" /> Confirm Dispatch</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD SYSTEM USER MODAL — Table 2: Users */}
      {showAddUserModal && (isSuperAdmin || isAdministrator) && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => { setShowAddUserModal(false); setUserSaved(false); }}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg modal-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white rounded-t-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrative Tool · Table 2: Users</p>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight">
                Register New {addUserForm.role === 'Registry Staff' ? 'Registry' : addUserForm.role === 'Blood Bank Staff' ? 'Blood Bank' : addUserForm.role === 'Issuance Personnel' ? 'Issuance' : addUserForm.role === 'Hospital User' ? 'Hospital' : addUserForm.role === 'Administrator' ? 'Admin' : 'Super Admin'}
              </h4>
            </div>
            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {userSaved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-lg text-xs font-bold text-center">
                  User registered successfully!
                </div>
              )}

              {/* first_name & last_name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">First Name <span className="text-rose-500">*</span></label>
                  <input type="text" value={addUserForm.firstName} onChange={e => setAddUserForm(f => ({ ...f, firstName: e.target.value }))} placeholder="e.g. Jane" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Last Name <span className="text-rose-500">*</span></label>
                  <input type="text" value={addUserForm.lastName} onChange={e => setAddUserForm(f => ({ ...f, lastName: e.target.value }))} placeholder="e.g. Doe" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
                </div>
              </div>

              {/* email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Email Address <span className="text-rose-500">*</span></label>
                <input type="email" value={addUserForm.email} onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))} placeholder="jane.doe@bloodlink.dvo" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
              </div>

              {/* password_hash */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Password</label>
                <input type="password" value={addUserForm.passwordHash} onChange={e => setAddUserForm(f => ({ ...f, passwordHash: e.target.value }))} placeholder="Enter initial password" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
                <p className="text-[9px] text-slate-400 mt-0.5">Stored as password_hash (VARCHAR 255)</p>
              </div>

              {/* contact_number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Contact Number</label>
                <input type="text" value={addUserForm.contactNumber} onChange={e => setAddUserForm(f => ({ ...f, contactNumber: e.target.value }))} placeholder="e.g. +63 917 123 4567" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
              </div>



              {/* hospital_id — conditional */}
              {addUserForm.role === 'Hospital User' && (
                <div className="bg-purple-50/40 p-3 rounded-lg border border-purple-100/50 space-y-2 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">Affiliated Hospital / Facility (FK)</label>
                    <select
                      value={addUserForm.hospitalId}
                      onChange={e => {
                        const targetId = e.target.value;
                        const match = hospitals.find(h => h.id === targetId);
                        if (match) {
                          const nameParts = (match.contact || 'Hospital Admin').split(' ');
                          setAddUserForm(f => ({
                            ...f,
                            hospitalId: targetId,
                            firstName: nameParts[0] || 'Hospital',
                            lastName: nameParts.slice(1).join(' ') || 'Admin',
                            email: match.email || '',
                            contactNumber: match.phone || ''
                          }));
                        } else {
                          setAddUserForm(f => ({ ...f, hospitalId: '' }));
                        }
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:border-slate-800"
                    >
                      <option value="">Select hospital...</option>
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.name} ({h.registrationStatus || 'Pending'})</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[9.5px] text-purple-600 font-medium italic">💡 Selecting an affiliated hospital will automatically fetch the registered Contact Person, Email, and Phone details, and will mark the hospital registration as <b>Active (Approved)</b> upon registration.</p>
                </div>
              )}

              {/* status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">Account Status</label>
                <select value={addUserForm.status} onChange={e => setAddUserForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-slate-800">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-0.5">ENUM('Active','Inactive') — default: Active</p>
              </div>

              {/* Metadata note */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-[9px] text-slate-500 font-semibold"><span className="font-bold text-slate-700">Note:</span> user_id (PK), created_at, and updated_at are auto-generated by the system upon submission.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 text-xs font-semibold pt-2">
                <button
                  onClick={() => { setShowAddUserModal(false); setUserSaved(false); }}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-655 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >Cancel</button>
                <button
                  onClick={() => {
                    if (!addUserForm.firstName.trim() || !addUserForm.lastName.trim() || !addUserForm.email.trim()) return setNoticeModal({ isOpen: true, title: 'Required Fields Missing', message: 'First name, last name, and email are required.', variant: 'warning' });

                    const isDupEmail = users.some(u => u.email.toLowerCase() === addUserForm.email.trim().toLowerCase());
                    if (isDupEmail) {
                      return setNoticeModal({
                        isOpen: true,
                        title: 'Duplicate User Email',
                        message: `A user account with email "${addUserForm.email.trim()}" is already registered.`,
                        variant: 'danger'
                      });
                    }

                    addUser(addUserForm);
                    setUserSaved(true);
                    setAddUserForm({ firstName: '', lastName: '', email: '', passwordHash: '', contactNumber: '', role: 'Registry Staff', roleId: 'ROLE-003', status: 'Active', hospitalId: '' });
                    setTimeout(() => {
                      setUserSaved(false);
                      setShowAddUserModal(false);
                    }, 1200);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm cursor-pointer"
                >Register User</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SYSTEM USER MODAL */}
      {showEditUserModal && editingUser && (isSuperAdmin || isAdministrator) && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => { setShowEditUserModal(false); setEditUserSaved(false); setEditingUser(null); }}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg modal-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white rounded-t-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrative Tool · Table 2: Users</p>
                <h4 className="font-bold text-slate-900 text-sm tracking-tight">Edit System User — {editingUser.id}</h4>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${editingUser.role === 'Super Admin' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>{editingUser.role}</span>
            </div>
            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {editUserSaved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2">
                  <span className="text-lg">✓</span> User updated successfully!
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">First Name <span className="text-rose-500">*</span></label>
                  <input type="text" value={editUserForm.firstName} onChange={e => setEditUserForm(f => ({ ...f, firstName: e.target.value }))} placeholder="e.g. Jane" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Last Name <span className="text-rose-500">*</span></label>
                  <input type="text" value={editUserForm.lastName} onChange={e => setEditUserForm(f => ({ ...f, lastName: e.target.value }))} placeholder="e.g. Doe" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Email Address <span className="text-rose-500">*</span></label>
                <input type="email" value={editUserForm.email} onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Contact Number</label>
                <input type="text" value={editUserForm.contactNumber} onChange={e => setEditUserForm(f => ({ ...f, contactNumber: e.target.value }))} placeholder="e.g. +63 917 123 4567" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50" />
              </div>

              {/* Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">Assigned Role <span className="text-rose-500">*</span></label>
                  <select
                    value={editUserForm.role}
                    onChange={e => {
                      const roleMap = { 'Super Admin': 'ROLE-001', 'Administrator': 'ROLE-002', 'Registry Staff': 'ROLE-003', 'Blood Bank Staff': 'ROLE-004', 'Issuance Personnel': 'ROLE-005', 'Hospital User': 'ROLE-006' };
                      setEditUserForm(f => ({ ...f, role: e.target.value, roleId: roleMap[e.target.value] || 'ROLE-003' }));
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-slate-800"
                    disabled={editingUser.role === 'Super Admin' && !isSuperAdmin}
                  >
                    <option>Registry Staff</option>
                    <option>Blood Bank Staff</option>
                    <option>Issuance Personnel</option>
                    <option>Hospital User</option>
                    <option>Administrator</option>
                    {isSuperAdmin && <option>Super Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">Role ID</label>
                  <input type="text" value={editUserForm.roleId} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-100 text-slate-500 outline-none font-mono" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">Account Status</label>
                <select value={editUserForm.status} onChange={e => setEditUserForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-slate-800">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-0.5">ENUM('Active','Inactive') — updated_at auto-recorded</p>
              </div>

              {/* Metadata note */}
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-[9px] text-amber-700 font-semibold"><span className="font-bold">Audit:</span> This change will be logged in the Audit Log with the performing admin's user_id and a timestamp.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 text-xs font-semibold pt-2">
                <button
                  onClick={() => { setShowEditUserModal(false); setEditUserSaved(false); setEditingUser(null); }}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >Cancel</button>
                <button
                  onClick={() => {
                    if (!editUserForm.firstName.trim() || !editUserForm.lastName.trim() || !editUserForm.email.trim()) return setNoticeModal({ isOpen: true, title: 'Required Fields Missing', message: 'First name, last name, and email are required.', variant: 'warning' });
                    updateUser(editingUser.id, editUserForm);
                    setEditUserSaved(true);
                    setTimeout(() => {
                      setEditUserSaved(false);
                      setShowEditUserModal(false);
                      setEditingUser(null);
                    }, 1400);
                  }}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                >Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD DONATION EVENT MODAL — Table 6: Donation Events ─────────── */}
      {showEventModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => { setShowEventModal(false); setEventSaved(false); }}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md modal-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white rounded-t-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Tool · Table 6: Donation Events</p>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight">Create Donation Event</h4>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-3">
              {eventSaved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-lg text-xs font-bold text-center">
                  Donation event saved successfully!
                </div>
              )}

              {/* Province */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                  Province <span className="text-rose-500">*</span>
                </label>
                <select
                  value={eventForm.province}
                  onChange={e => setEventForm(f => ({ ...f, province: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50"
                >
                  <option value="Davao del Sur">Davao del Sur</option>
                  <option value="Davao del Norte">Davao del Norte</option>
                  <option value="Davao Oriental">Davao Oriental</option>
                  <option value="Davao de Oro">Davao de Oro</option>
                  <option value="Davao Occidental">Davao Occidental</option>
                </select>
              </div>

              {/* City / Municipality */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                  City / Municipality <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventForm.cityMunicipality}
                  onChange={e => setEventForm(f => ({ ...f, cityMunicipality: e.target.value }))}
                  placeholder="e.g. Davao City"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50"
                />
              </div>

              {/* Barangay / Organization */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                  Barangay / Organization
                </label>
                <input
                  type="text"
                  value={eventForm.barangayOrganization}
                  onChange={e => setEventForm(f => ({ ...f, barangayOrganization: e.target.value }))}
                  placeholder="e.g. Barangay Poblacion / DLSU-D Chapter"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50"
                />
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                  Event Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={eventForm.eventDate}
                  onChange={e => setEventForm(f => ({ ...f, eventDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-slate-50/50"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 text-xs font-semibold pt-2">
                <button
                  onClick={() => { setShowEventModal(false); setEventSaved(false); }}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-650 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!eventForm.cityMunicipality.trim() || !eventForm.eventDate.trim()) {
                      return setNoticeModal({ isOpen: true, title: 'Required Fields Missing', message: 'City/Municipality and Event Date are required.', variant: 'warning' });
                    }
                    addDonationEvent({ ...eventForm, registeredBy: authSystemUser?.username || 'admin' });
                    setEventSaved(true);
                    setEventForm({
                      province: 'Davao del Sur',
                      cityMunicipality: 'Davao City',
                      barangayOrganization: '',
                      eventDate: new Date().toISOString().slice(0, 10)
                    });
                    setTimeout(() => {
                      setEventSaved(false);
                      setShowEventModal(false);
                    }, 1200);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DIRECT MANUAL ISSUANCE MODAL ─── */}
      {showCreateIssuanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col modal-in">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-white font-bold text-sm">Direct Blood Unit Issuance (Admin Override)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Directly issue blood units bypassing the requisition queue verification</p>
              </div>
              <button onClick={() => setShowCreateIssuanceModal(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Target Hospital <span className="text-rose-500">*</span></label>
                  <select
                    value={createIssuanceForm.hospitalId}
                    onChange={e => setCreateIssuanceForm(f => ({ ...f, hospitalId: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
                  >
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Urgency Status <span className="text-rose-500">*</span></label>
                  <select
                    value={createIssuanceForm.urgency}
                    onChange={e => setCreateIssuanceForm(f => ({ ...f, urgency: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Blood Type <span className="text-rose-500">*</span></label>
                  <select
                    value={createIssuanceForm.bloodType}
                    onChange={e => setCreateIssuanceForm(f => ({ ...f, bloodType: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none bg-white font-mono font-medium"
                  >
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Component Type <span className="text-rose-500">*</span></label>
                  <select
                    value={createIssuanceForm.component}
                    onChange={e => setCreateIssuanceForm(f => ({ ...f, component: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
                  >
                    {COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">No. of Bags <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={createIssuanceForm.units}
                    onChange={e => setCreateIssuanceForm(f => ({ ...f, units: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none bg-white font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  value={createIssuanceForm.diagnosis}
                  onChange={e => setCreateIssuanceForm(f => ({ ...f, diagnosis: e.target.value }))}
                  placeholder="e.g. Severe Anemia"
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Contact Person <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={createIssuanceForm.contactPerson}
                    onChange={e => setCreateIssuanceForm(f => ({ ...f, contactPerson: e.target.value }))}
                    placeholder="Dr. or Nurse Name"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Contact Number <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={createIssuanceForm.contactNumber}
                    onChange={e => setCreateIssuanceForm(f => ({ ...f, contactNumber: e.target.value }))}
                    placeholder="e.g. 0917-XXX-XXXX"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 text-xs font-bold bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setShowCreateIssuanceModal(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-650 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const f = createIssuanceForm;
                  if (!f.hospitalId || !f.contactPerson.trim() || !f.contactNumber.trim()) {
                    return setNoticeModal({ isOpen: true, title: 'Required Fields Missing', message: 'Please fill in all required fields marked with *.', variant: 'warning' });
                  }

                  const targetHosp = hospitals.find(h => h.id === f.hospitalId);

                  // Check stock availability
                  const inventoryItem = inventory.find(i => i.type === f.bloodType);
                  if (!inventoryItem || inventoryItem.units < f.units) {
                    return setNoticeModal({ isOpen: true, title: 'Insufficient Inventory', message: `Current OLS units for type ${f.bloodType} is ${inventoryItem?.units || 0}. Maximum units requested cannot exceed available stock.`, variant: 'danger' });
                  }

                  // 1. Add request
                  const refNo = addBloodRequest({
                    hospital: targetHosp?.name || 'Unknown Hospital',
                    hospitalId: f.hospitalId,
                    urgency: f.urgency,
                    dateNeeded: new Date().toLocaleDateString(),
                    contactPerson: f.contactPerson,
                    contactNumber: f.contactNumber,
                    diagnosis: f.diagnosis,
                    ward: f.ward,
                    patientBloodType: f.bloodType,
                    units: f.units,
                    items: [{ bloodType: f.bloodType, component: f.component, units: f.units }],
                    filedByIssuance: true
                  });

                  // 2. Approve/dispatch request directly (decrements inventory & creates details logs)
                  approveRequest(refNo);

                  setShowCreateIssuanceModal(false);
                  setIssuanceSuccessModal({
                    isOpen: true,
                    refNo,
                    hospital: targetHosp?.name || 'Hospital',
                    units: f.units,
                    bloodType: f.bloodType,
                    component: f.component
                  });
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-lg transition shadow-sm cursor-pointer"
              >
                Dispatch & Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DIRECT MANUAL ISSUANCE SUCCESS MODAL ─── */}
      <SuccessModal
        isOpen={issuanceSuccessModal.isOpen}
        title="Direct Issuance Completed!"
        message="The manual blood dispatch transaction has been logged."
        confirmText="Acknowledge & Close"
        onClose={() => setIssuanceSuccessModal({ isOpen: false, refNo: '', hospital: '', units: 0, bloodType: '', component: '' })}
        details={[
          { label: "Ref No", value: issuanceSuccessModal.refNo },
          { label: "Hospital", value: issuanceSuccessModal.hospital },
          { label: "Components", value: `${issuanceSuccessModal.units} × ${issuanceSuccessModal.bloodType} ${issuanceSuccessModal.component}` },
          { label: "Inventory Status", value: "Updated Successfully" },
          { label: "Ledger Logs", value: "Registered in General Ledger" }
        ]}
      />

      {/* ─── GENERIC NOTICE / VALIDATION MODAL ─── */}
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

      {/* ─── ADMIN SMS RECALL CONFIRMATION MODAL ─── */}
      <ConfirmationModal
        isOpen={adminRecallConfirm.isOpen}
        title={adminRecallConfirm.isBulk ? `Dispatch Bulk Recall to ${adminRecallConfirm.eligibleCount} Donors?` : `Dispatch Recall SMS to ${adminRecallConfirm.donorName}?`}
        message={adminRecallConfirm.isBulk
          ? `This will dispatch re-eligibility recall alerts to all ${adminRecallConfirm.eligibleCount} eligible donors via Semaphore Gateway. Please confirm to proceed.`
          : `This will dispatch a recall SMS to ${adminRecallConfirm.donorName} via Semaphore Gateway. Please confirm to proceed.`
        }
        confirmText="Confirm Dispatch"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => {
          if (adminRecallConfirm.action) adminRecallConfirm.action();
          setAdminRecallConfirm({ isOpen: false, donorId: '', donorName: '', isBulk: false, eligibleCount: 0, action: null });
        }}
        onCancel={() => setAdminRecallConfirm({ isOpen: false, donorId: '', donorName: '', isBulk: false, eligibleCount: 0, action: null })}
      />

      {/* ─── ADMIN SMS RECALL SUCCESS MODAL ─── */}
      <SuccessModal
        isOpen={adminRecallSuccess.isOpen}
        title="SMS Dispatched Successfully"
        message={adminRecallSuccess.message}
        confirmText="Acknowledge & Close"
        onClose={() => setAdminRecallSuccess({ isOpen: false, message: '' })}
      />

    </div>
  );
}
