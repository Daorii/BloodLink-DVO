import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiLogin, apiLogout, apiGetUsers, apiCreateUser, apiUpdateUser, clearToken } from '../services/api';
import { apiGetHospitals, apiCreateHospital, apiUpdateHospital, apiDeleteHospital } from '../services/api';
import { apiGetDonors, apiCreateDonor, apiUpdateDonor, apiDeleteDonor } from '../services/api';
import { apiGetDonationEvents, apiCreateDonationEvent, apiUpdateDonationEvent, apiDeleteDonationEvent } from '../services/api';
import { apiCreateDonation, apiGetDonations, apiUpdateDonationOutcome } from '../services/api';
import { apiCreateLabResult, apiGetLabResults, apiGetDonationBySerial } from '../services/api';
import { apiGetRecalls, apiCreateRecall, apiCreateBulkRecalls, apiUpdateRecallResponse } from '../services/api';
import { apiGetBloodRequests, apiCreateBloodRequest, apiUpdateBloodRequestStatus } from '../services/api';
import { apiGetBloodIssuances, apiCreateBloodIssuance, apiApproveBloodRelease } from '../services/api';
import { apiGetBloodInventory, apiCreateBloodInventory, apiVerifyBloodInventory, apiGetWalkinIssuances, apiCreateWalkinIssuance } from '../services/api';

const initialDonors = [
  // ── Sample Dataset: Donor Registrationssss ──
  {
    id: 'D001', name: 'Juan P. Dela Cruz', sex: 'Male', civilStatus: 'Single', dob: '1998-05-12',
    bloodType: 'O+', address: 'Buhangin, Davao City', donationDate: '2026-03-10', status: 'Regular',
    lastDonation: '2026-03-10', remarks: 'Eligible', phone: '+63 917 111 1111', distance: '1.2 km', totalDonations: 4
  },
  {
    id: 'D002', name: 'Maria A. Santos', sex: 'Female', civilStatus: 'Married', dob: '1992-09-08',
    bloodType: 'A+', address: 'Matina, Davao City', donationDate: '2026-06-15', status: 'New',
    lastDonation: '2026-06-15', remarks: 'Eligible', phone: '+63 917 222 2222', distance: '3.4 km', totalDonations: 1
  },
  {
    id: 'D003', name: 'Robert L. Tan', sex: 'Male', civilStatus: 'Single', dob: '1988-12-04',
    bloodType: 'B-', address: 'Talomo, Davao City', donationDate: '2026-05-20', status: 'Regular',
    lastDonation: '2026-05-20', remarks: 'Eligible', phone: '+63 917 333 3333', distance: '5.1 km', totalDonations: 2
  },
  {
    id: 'D004', name: 'Sarah G. Cruz', sex: 'Female', civilStatus: 'Single', dob: '2000-03-16',
    bloodType: 'AB+', address: 'Mintal, Davao City', donationDate: '2026-04-05', status: 'Regular',
    lastDonation: '2026-04-05', remarks: 'Eligible', phone: '+63 917 444 4444', distance: '8.2 km', totalDonations: 5
  },
  {
    id: 'D005', name: 'Joseph M. Castro', sex: 'Male', civilStatus: 'Single', dob: '1995-07-22',
    bloodType: 'O-', address: 'Agdao, Davao City', donationDate: '2026-01-15', status: 'Regular',
    lastDonation: '2026-01-15', remarks: 'Eligible', phone: '+63 917 888 8888', distance: '2.5 km', totalDonations: 8
  },
  {
    id: 'D006', name: 'Elena F. Diaz', sex: 'Female', civilStatus: 'Married', dob: '1990-11-30',
    bloodType: 'A-', address: 'Lanang, Davao City', donationDate: '2026-06-25', status: 'Regular',
    lastDonation: '2026-06-25', remarks: 'Eligible', phone: '+63 917 999 9999', distance: '4.1 km', totalDonations: 3
  },
  {
    id: 'D007', name: 'Mark Anthony V. Reyes', sex: 'Male', civilStatus: 'Single', dob: '1993-02-14',
    bloodType: 'B-', address: 'Toril, Davao City', donationDate: '2026-02-28', status: 'Regular',
    lastDonation: '2026-02-28', remarks: 'Eligible', phone: '+63 917 777 7777', distance: '12.4 km', totalDonations: 4
  },
  {
    id: 'D008', name: 'Patricia J. Gomez', sex: 'Female', civilStatus: 'Single', dob: '1997-08-19',
    bloodType: 'O-', address: 'Cabantian, Davao City', donationDate: '2026-05-01', status: 'Regular',
    lastDonation: '2026-05-01', remarks: 'Eligible', phone: '+63 917 654 3210', distance: '6.7 km', totalDonations: 2
  },
  // ── Sample Dataset: Deferred Donorsssss ──
  {
    id: 'D014', name: 'Miguel S. Alcantara', sex: 'Male',
    bloodType: 'O+', address: 'Davao City', donationDate: '2026-02-05', status: 'Deferred',
    lastDonation: '2026-02-05', remarks: 'Low Hemoglobin (Temporary)', phone: '+63 917 555 5555', distance: '2.0 km', totalDonations: 3
  },
  {
    id: 'D022', name: 'Clarisse D. Villamin', sex: 'Female',
    bloodType: 'A-', address: 'Davao City', donationDate: '2026-02-10', status: 'Deferred',
    lastDonation: '2026-02-10', remarks: 'Recent Tattoo (Temporary)', phone: '+63 917 666 6666', distance: '4.5 km', totalDonations: 1
  }
];

// Stock summary is now computed from bloodInventory (DB-driven).
const initialInventory = [];


const initialRequests = [
  {
    refNo: 'REQ-4821',
    hospital: 'Southern Philippines Medical Center (SPMC)',
    hospitalId: 'HOSP-001',
    urgency: 'urgent',
    dateNeeded: '2026-06-20',
    contactPerson: 'Dr. Juan Dela Cruz, MD',
    contactNumber: '+63 917 000 0001',
    status: 'Pending Verification',
    submittedAt: 'June 19, 2026, 9:30 AM',
    notes: 'Urgent release needed for cardiac surgery.',
    diagnosis: 'Open Heart Surgery',
    ward: 'Ward 4B, Room 201',
    hospitalRefNo: 'SPMC-2026-04821',
    patientBloodType: 'O-',
    units: 2,
    items: [
      { bloodType: 'O-', component: 'PRBC', units: 2 }
    ]
  }
];

const initialHospitals = [
  {
    id: 'HOSP-001',
    name: 'Southern Philippines Medical Center (SPMC)',
    type: 'Government',
    contact: 'Dr. Maria Santos',
    phone: '0917-000-0001',
    email: 'bloodbank@spmc.gov.ph',
    address: 'J.P. Laurel Ave., Bajada, Davao City',
    registrationStatus: 'Active'
  },
  {
    id: 'HOSP-002',
    name: 'Davao Doctors Hospital',
    type: 'Private',
    contact: 'Dr. Juan Reyes',
    phone: '0917-000-0002',
    email: 'blood@davaodoctors.com',
    address: 'E. Quirino Ave., Davao City',
    registrationStatus: 'Active'
  },
  {
    id: 'HOSP-003',
    name: 'San Pedro Hospital',
    type: 'Private',
    contact: 'Dr. Ana Cruz',
    phone: '0917-000-0003',
    email: 'blood@sanpedro.ph',
    address: 'Ponciano St., Davao City',
    registrationStatus: 'Active'
  },
  {
    id: 'HOSP-004',
    name: 'Philippine Red Cross – Davao Chapter',
    type: 'Blood Bank',
    contact: 'Ms. Joy Villanueva',
    phone: '0917-000-0004',
    email: 'davao@redcross.org.ph',
    address: 'Anda St., Davao City',
    registrationStatus: 'Active'
  }
];
const initialUsers = [
  { id: 'USR-001', name: 'DOH Super Admin', role: 'Super Admin', email: 'superadmin@bloodlink.dvo', status: 'Active', hospitalId: null },
  { id: 'USR-002', name: 'DOH Medical Officer IV', role: 'Administrator', email: 'admin@bloodlink.dvo', status: 'Active', hospitalId: null },
  { id: 'USR-003', name: 'Nurse Joy Cruz', role: 'Registry Staff', email: 'registry@bloodlink.dvo', status: 'Active', hospitalId: null },
  { id: 'USR-004', name: 'RMT Mark Lopez', role: 'Blood Bank Staff', email: 'bloodbank@bloodlink.dvo', status: 'Active', hospitalId: null },
  { id: 'USR-005', name: 'SNBC Issuance Officer', role: 'Issuance Personnel', email: 'issuance@bloodlink.dvo', status: 'Active', hospitalId: null },
  { id: 'USR-006', name: 'Dr. Roberto Santos', role: 'Hospital User', email: 'hospital@bloodlink.dvo', status: 'Active', hospitalId: 'HOSP-001' },
  { id: 'USR-007', name: 'Dr. Clara Santos (RMT)', role: 'Serology Staff', email: 'serology@bloodlink.dvo', status: 'Active', hospitalId: null },
  { id: 'USR-008', name: 'Engr. Miguel Reyes', role: 'Production Staff', email: 'production@bloodlink.dvo', status: 'Active', hospitalId: null }
];

const initialComponentProcessingLogs = [
  {
    processingId: 'PROC-001',
    unitRef: 'WB-2026-9041',
    donorName: 'Juan Dela Cruz',
    bloodType: 'O+',
    sourceVolume: 450,
    componentType: 'PRBC',
    yieldVolume: 280,
    processingMethod: 'Heavy Spin 4000 RPM x 10m @ 4�C',
    processedBy: 'Engr. Marco Reyes (RMT)',
    processedAt: '2026-09-01 10:30 AM',
    expiryDate: '2026-10-06',
    status: 'Completed'
  },
  {
    processingId: 'PROC-002',
    unitRef: 'WB-2026-9042',
    donorName: 'Maria Clara',
    bloodType: 'A+',
    sourceVolume: 450,
    componentType: 'Platelet Concentrate',
    yieldVolume: 65,
    processingMethod: 'Light Spin 2000 RPM x 5m @ 22�C',
    processedBy: 'Engr. Marco Reyes (RMT)',
    processedAt: '2026-09-02 02:15 PM',
    expiryDate: '2026-09-07',
    status: 'Completed'
  },
  {
    processingId: 'PROC-003',
    unitRef: 'WB-2026-9043',
    donorName: 'Andres Bonifacio',
    bloodType: 'B-',
    sourceVolume: 450,
    componentType: 'FFP',
    yieldVolume: 220,
    processingMethod: 'Rapid Freeze @ -30�C',
    processedBy: 'Engr. Marco Reyes (RMT)',
    processedAt: '2026-09-03 11:00 AM',
    expiryDate: '2027-09-03',
    status: 'Completed'
  }
];

const initialDonationEvents = [
  { eventId: 'EVT-001', province: 'Davao del Sur', cityMunicipality: 'Davao City', barangayOrganization: 'Buhangin Gym', eventDate: '2026-03-10' },
  { eventId: 'EVT-002', province: 'Davao del Sur', cityMunicipality: 'Davao City', barangayOrganization: 'Matina Center', eventDate: '2026-06-15' }
];

const initialDonations = [
  { donationId: 'DON-001', donorId: 'D001', eventId: 'EVT-001', bloodTypeId: 'O+', donationDate: '2026-03-10', screeningOutcome: 'Accepted' },
  { donationId: 'DON-002', donorId: 'D002', eventId: 'EVT-002', bloodTypeId: 'A+', donationDate: '2026-06-15', screeningOutcome: 'Accepted' },
  { donationId: 'DON-003', donorId: 'D003', eventId: 'EVT-001', bloodTypeId: 'B-', donationDate: '2026-05-20', screeningOutcome: 'Accepted' },
  { donationId: 'DON-004', donorId: 'D014', eventId: 'EVT-001', bloodTypeId: 'O+', donationDate: '2026-02-05', screeningOutcome: 'Temporarily Deferred', deferralReason: 'Low Hemoglobin', deferralEndDate: '2026-04-05' }
];

const initialLabTestResults = [
  { testId: 'LAB-001', donationId: 'DON-001', hemoglobinResult: '14.2', bloodTypeConfirmed: 'O+', hbsagResult: 'Non-Reactive', syphilisResult: 'Non-Reactive', hivResult: 'Non-Reactive', hcvResult: 'Non-Reactive', malariaResult: 'Non-Reactive', natResult: 'Non-Reactive', othersResult: '', recordedBy: 'USR-003' },
  { testId: 'LAB-002', donationId: 'DON-002', hemoglobinResult: '13.5', bloodTypeConfirmed: 'A+', hbsagResult: 'Non-Reactive', syphilisResult: 'Non-Reactive', hivResult: 'Non-Reactive', hcvResult: 'Non-Reactive', malariaResult: 'Non-Reactive', natResult: 'Non-Reactive', othersResult: '', recordedBy: 'USR-003' },
  { testId: 'LAB-003', donationId: 'DON-003', hemoglobinResult: '15.1', bloodTypeConfirmed: 'B-', hbsagResult: 'Non-Reactive', syphilisResult: 'Non-Reactive', hivResult: 'Non-Reactive', hcvResult: 'Non-Reactive', malariaResult: 'Non-Reactive', natResult: 'Non-Reactive', othersResult: '', recordedBy: 'USR-003' }
];

// Blood inventory is now fully DB-driven — loaded via fetchBloodInventoryFromAPI on mount.
const initialBloodInventory = [];

const initialRecommendations = [
  {
    recommendationId: 'REC-001',
    forecastId: 1,   // FK → granularForecasts[0].forecastId
    hospitalId: 'HOSP-001',
    hospitalName: 'Southern Philippines Medical Center (SPMC)',
    bloodTypeId: 'O+',
    componentId: 'PRBC',
    recommendedQuantity: 14,
    recommendationDate: '2026-07-02',
    status: 'Approved',
    approvedBy: 'USR-002',
    actedAt: '2026-07-02T10:14:00'
  },
  {
    recommendationId: 'REC-002',
    forecastId: 2,
    hospitalId: 'HOSP-002',
    hospitalName: 'Davao Doctors Hospital',
    bloodTypeId: 'A+',
    componentId: 'PRBC',
    recommendedQuantity: 9,
    recommendationDate: '2026-07-02',
    status: 'Approved',
    approvedBy: 'USR-002',
    actedAt: '2026-07-02T10:15:30'
  },
  {
    recommendationId: 'REC-003',
    forecastId: 3,
    hospitalId: 'HOSP-001',
    hospitalName: 'Southern Philippines Medical Center (SPMC)',
    bloodTypeId: 'B+',
    componentId: 'Platelet Concentrate',
    recommendedQuantity: 6,
    recommendationDate: '2026-07-02',
    status: 'Rejected',
    approvedBy: 'USR-001',
    actedAt: '2026-07-02T11:00:00'
  },
  {
    recommendationId: 'REC-004',
    forecastId: 4,
    hospitalId: 'HOSP-003',
    hospitalName: 'San Pedro Hospital of Davao City',
    bloodTypeId: 'O-',
    componentId: 'FFP',
    recommendedQuantity: 5,
    recommendationDate: '2026-07-07',
    status: 'Pending',
    approvedBy: null,
    actedAt: null
  },
  {
    recommendationId: 'REC-005',
    forecastId: 5,
    hospitalId: 'HOSP-002',
    hospitalName: 'Davao Doctors Hospital',
    bloodTypeId: 'AB+',
    componentId: 'PRBC',
    recommendedQuantity: 3,
    recommendationDate: '2026-07-07',
    status: 'Pending',
    approvedBy: null,
    actedAt: null
  },
  {
    recommendationId: 'REC-006',
    forecastId: 6,
    hospitalId: 'HOSP-001',
    hospitalName: 'Southern Philippines Medical Center (SPMC)',
    bloodTypeId: 'O+',
    componentId: 'FFP',
    recommendedQuantity: 7,
    recommendationDate: '2026-07-07',
    status: 'Pending',
    approvedBy: null,
    actedAt: null
  }
];

const initialAuditLogs = [
  { logId: 'LOG-001', userId: 'USR-002', action: 'Login successful', module: 'Auth', recordId: 'USR-002', oldValue: null, newValue: null, performedAt: 'July 2, 2026, 8:44 AM' }
];

const initialDonorRecalls = [
  {
    recallId: 'REC-L001',
    donorId: 'D001',
    recallDate: '2026-06-10',
    smsStatus: 'Sent',
    donorResponse: 'Committed',
    processedBy: null // System-automated
  },
  {
    recallId: 'REC-L002',
    donorId: 'D002',
    recallDate: '2026-06-15',
    smsStatus: 'Sent',
    donorResponse: 'No Response',
    processedBy: null // System-automated
  },
  {
    recallId: 'REC-L003',
    donorId: 'D003',
    recallDate: '2026-06-20',
    smsStatus: 'Failed',
    donorResponse: null,
    processedBy: 'USR-003' // Manually triggered by Nurse Joy Cruz
  },
  {
    recallId: 'REC-L004',
    donorId: 'D004',
    recallDate: '2026-06-25',
    smsStatus: 'Sent',
    donorResponse: 'Committed',
    processedBy: 'USR-002' // Manually triggered by DOH Officer IV
  },
  {
    recallId: 'REC-L005',
    donorId: 'D005',
    recallDate: '2026-06-26',
    smsStatus: 'Pending',
    donorResponse: null,
    processedBy: null // System-automated
  }
];

// 8‑week historical + 4 predicted weeks with upper/lower confidence bounds
const initialForecastData = [
  { week: 'Wk 1', demand: 112, actual: 108, upper: 118, lower: 106 },
  { week: 'Wk 2', demand: 118, actual: 125, upper: 126, lower: 110 },
  { week: 'Wk 3', demand: 125, actual: 120, upper: 133, lower: 117 },
  { week: 'Wk 4', demand: 130, actual: 138, upper: 138, lower: 122 },
  { week: 'Wk 5', demand: 122, actual: 119, upper: 130, lower: 114 },
  { week: 'Wk 6', demand: 140, actual: 145, upper: 150, lower: 130 },
  { week: 'Wk 7', demand: 155, actual: 150, upper: 165, lower: 145 },
  { week: 'Wk 8', demand: 160, actual: 162, upper: 172, lower: 148 },
  { week: 'Wk 9 (P)', demand: 168, actual: null, upper: 180, lower: 156 },
  { week: 'Wk 10 (P)', demand: 172, actual: null, upper: 185, lower: 159 },
  { week: 'Wk 11 (P)', demand: 165, actual: null, upper: 178, lower: 152 },
  { week: 'Wk 12 (P)', demand: 175, actual: null, upper: 190, lower: 160 },
];

// Seed some initial distribution logs
const initialDistributionLog = [
  {
    id: 'DIST-001',
    hospitalId: 'HOSP-001',
    hospitalName: 'Southern Philippines Medical Center (SPMC)',
    bloodType: 'O+',
    units: 6,
    date: '2026-06-20',
    allocatedBy: 'Admin User'
  },
  {
    id: 'DIST-002',
    hospitalId: 'HOSP-002',
    hospitalName: 'Davao Doctors Hospital',
    bloodType: 'A+',
    units: 4,
    date: '2026-06-21',
    allocatedBy: 'Admin User'
  },
  {
    id: 'DIST-003',
    hospitalId: 'HOSP-003',
    hospitalName: 'San Pedro Hospital',
    bloodType: 'B+',
    units: 3,
    date: '2026-06-22',
    allocatedBy: 'Admin User'
  },
  {
    id: 'DIST-004',
    hospitalId: 'HOSP-001',
    hospitalName: 'Southern Philippines Medical Center (SPMC)',
    bloodType: 'O-',
    units: 2,
    date: '2026-06-23',
    allocatedBy: 'Admin User'
  },
];

// Equity‑based allocation algorithm:
// Proportionally distribute available units across hospitals using forecast demand weight.
// Each hospital receives: floor( (hospitalWeight / totalWeight) * availableUnits )
function computeEquityAllocation(inventory, hospitals, forecastData) {
  // Use the most recent predicted week demand as the weight base
  const latestDemand = forecastData.filter(w => w.actual === null);
  const demandForecast = latestDemand.length > 0 ? latestDemand[0].demand : 160;

  // Assign weights: government hospitals get 1.5x, blood banks get 1.2x, private 1.0x
  const weights = { Government: 1.5, 'Blood Bank': 1.2, Private: 1.0 };
  const totalWeight = hospitals.reduce((sum, h) => sum + (weights[h.type] || 1), 0);

  return inventory.map(inv => {
    // Safety buffer: only distribute units above threshold
    const safeToRelease = Math.max(0, inv.units - inv.threshold);

    const allocations = hospitals.map(h => {
      const hospitalWeight = weights[h.type] || 1;
      const share = (hospitalWeight / totalWeight);
      const allocatedUnits = Math.floor(share * safeToRelease);
      return {
        hospitalId: h.id,
        hospitalName: h.name,
        hospitalType: h.type,
        hospitalContact: h.contact,
        hospitalPhone: h.phone,
        hospitalEmail: h.email,
        bloodType: inv.type,
        suggestedUnits: allocatedUnits,
        inventoryStatus: inv.status,
        currentStock: inv.units,
        threshold: inv.threshold,
        safeToRelease,
        forecastDemand: demandForecast,
      };
    });

    return { bloodType: inv.type, status: inv.status, allocations };
  });
}

export const useBloodStore = create(
  persist(
    (set, get) => ({
      // ─── State ──────────────────────────────────────────────────────────
      donors: initialDonors,
      donationEvents: initialDonationEvents,
      donations: initialDonations,
      labTestResults: initialLabTestResults,
      bloodInventory: initialBloodInventory,
      walkinIssuances: [],
      recommendations: initialRecommendations,
      auditLogs: initialAuditLogs,
      donorRecalls: initialDonorRecalls,
      recalls: [], // API-backed recall history
      bloodIssuance: [],
      bloodIssuanceDetails: [],
      bloodIssuances: [], // DB-backed issuances
      inventory: initialInventory,
      componentProcessingLogs: initialComponentProcessingLogs,
      bloodRequests: initialRequests,
      hospitals: initialHospitals,
      users: initialUsers,
      forecastData: initialForecastData,
      granularForecasts: [], // Seeded by generateGranularForecast on first call
      distributionLog: initialDistributionLog,
      // Equity allocation results map — keyed by 'bloodType|component'
      // Persists across tab switches; not persisted to localStorage
      equityResultsMap: {}, // { 'O+|PRBC': { results: [], meta: {} }, ... }
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      // Save one equity computation result into the map (keyed by 'bt|comp')
      setEquityResult: (key, results, meta) => set(state => ({
        equityResultsMap: { ...state.equityResultsMap, [key]: { results, meta } }
      })),

      // Clear all equity results (e.g., on logout)
      clearEquityResults: () => set({ equityResultsMap: {} }),

      smsLogs: [
        {
          smsId: 'SMS-001',
          donorId: 'D001',
          recallId: 'REC-L001',
          name: 'Juan P. Dela Cruz',
          phone: '+63 917 456 7890',
          initials: 'JD',
          color: '#C21C24',
          message: '\uD83E\uDE78 Hello Juan P. Dela Cruz. Your 90-day donation interval is complete! You are eligible to donate blood again. Visit bloodlinkdvo.ph to learn more.',
          sentAt: '2026-06-10T08:14:22',
          status: 'Sent',
          errorMessage: null
        },
        {
          smsId: 'SMS-002',
          donorId: 'D002',
          recallId: 'REC-L002',
          name: 'Maria A. Santos',
          phone: '+63 918 234 5678',
          initials: 'MS',
          color: '#2563EB',
          message: '\uD83E\uDE78 Hello Maria A. Santos. Your 90-day donation interval is complete! You are eligible to donate blood again. Visit bloodlinkdvo.ph to learn more.',
          sentAt: '2026-06-15T09:30:10',
          status: 'Sent',
          errorMessage: null
        },
        {
          smsId: 'SMS-003',
          donorId: 'D003',
          recallId: 'REC-L003',
          name: 'Robert L. Tan',
          phone: '+63 920 111 2222',
          initials: 'RT',
          color: '#7C3AED',
          message: '\uD83E\uDE78 Hello Robert L. Tan. Your 90-day donation interval is complete! You are eligible to donate blood again. Visit bloodlinkdvo.ph to learn more.',
          sentAt: '2026-06-20T11:05:44',
          status: 'Failed',
          errorMessage: 'Recipient number is not a valid mobile number or is currently out of network coverage.'
        },
        {
          smsId: 'SMS-004',
          donorId: 'D004',
          recallId: 'REC-L004',
          name: 'Sarah G. Cruz',
          phone: '+63 921 555 6789',
          initials: 'SC',
          color: '#059669',
          message: '\uD83E\uDE78 Hello Sarah G. Cruz. Your 90-day donation interval is complete! You are eligible to donate blood again. Visit bloodlinkdvo.ph to learn more.',
          sentAt: '2026-06-25T14:22:38',
          status: 'Sent',
          errorMessage: null
        },
        {
          smsId: 'SMS-005',
          donorId: 'D005',
          recallId: 'REC-L005',
          name: 'Joseph M. Castro',
          phone: '+63 922 888 9012',
          initials: 'JC',
          color: '#D97706',
          message: '\uD83E\uDE78 Hello Joseph M. Castro. Your 90-day donation interval is complete! You are eligible to donate blood again. Visit bloodlinkdvo.ph to learn more.',
          sentAt: '2026-06-26T07:58:01',
          status: 'Pending',
          errorMessage: null
        }
      ],
      currentUser: {
        id: 'BLD-482931',
        name: 'Maria C. Santos',
        phone: '+63 917 123 4567',
        bloodType: 'O-',
        address: 'Brgy. Buhangin, Davao City'
      },
      authSystemUser: {
        id: 'USR-002',
        name: 'DOH Medical Officer IV',
        role: 'Administrator',
        email: 'admin@bloodlink.dvo',
        hospitalId: null
      },
      loginSystemUser: async (email, password) => {
        // ── DEV BYPASS: pass123 skips API entirely — instant local auth ──
        // Hardcoded mock roster so this always works regardless of persisted state.
        const DEV_PASSWORD = 'pass123';
        const MOCK_ROSTER = [
          { id: 'USR-001', name: 'DOH Super Admin',          role: 'Super Admin',        email: 'superadmin@bloodlink.dvo', status: 'Active', hospitalId: null },
          { id: 'USR-002', name: 'DOH Medical Officer IV',   role: 'Administrator',       email: 'admin@bloodlink.dvo',      status: 'Active', hospitalId: null },
          { id: 'USR-003', name: 'Nurse Joy Cruz',           role: 'Registry Staff',      email: 'registry@bloodlink.dvo',   status: 'Active', hospitalId: null },
          { id: 'USR-004', name: 'RMT Mark Lopez',           role: 'Blood Bank Staff',    email: 'bloodbank@bloodlink.dvo',  status: 'Active', hospitalId: null },
          { id: 'USR-005', name: 'SNBC Issuance Officer',    role: 'Issuance Personnel',  email: 'issuance@bloodlink.dvo',   status: 'Active', hospitalId: null },
          { id: 'USR-006', name: 'Dr. Roberto Santos',       role: 'Hospital User',       email: 'hospital@bloodlink.dvo',   status: 'Active', hospitalId: 'HOSP-001' },
          { id: 'USR-007', name: 'Dr. Clara Santos (RMT)',   role: 'Serology Staff',      email: 'serology@bloodlink.dvo',   status: 'Active', hospitalId: null },
          { id: 'USR-008', name: 'Engr. Miguel Reyes',       role: 'Production Staff',    email: 'production@bloodlink.dvo', status: 'Active', hospitalId: null },
        ];

        // ── Try Laravel API first so protected operations (including PhilSMS
        // recalls) receive a Sanctum token. ──
        try {
          const data = await apiLogin(email, password);
          if (data.user && data.token) {
            set({ authSystemUser: data.user });
            return data.user;
          }
        } catch (err) {
          console.warn('[BloodLink] API login failed, using local fallback:', err.message);
        }

        // ── DEV fallback when the Laravel API is unavailable ──
        if (password === DEV_PASSWORD) {
          const emailLower = email.toLowerCase();
          const devUser = MOCK_ROSTER.find(u => u.email.toLowerCase() === emailLower);
          if (devUser) {
            console.info('[BloodLink] DEV fallback — logged in as:', devUser.role);
            set({ authSystemUser: devUser });
            return devUser;
          }
        }

        // ── Last resort: persisted local users array ──
        const emailLower = email.toLowerCase();
        const found = get().users.find(u => u.email.toLowerCase() === emailLower);
        if (found) {
          set({ authSystemUser: found });
          return found;
        }
        return null;
      },

      logoutSystemUser: async () => {
        try { await apiLogout(); } catch (_) {}
        clearToken();
        set({ authSystemUser: null });
      },

      fetchUsersFromAPI: async () => {
        try {
          const data = await apiGetUsers();
          if (data.users) set({ users: data.users });
        } catch (err) {
          console.warn('[BloodLink] Could not fetch users from API:', err.message);
        }
      },
      accountFlagged: false,
      arrivedAtFacility: false,

      // Mobilization Simulation State
      mobilizeFlowStep: 0,
      mobilizeTarget: 'O-',
      mobilizeFacility: 'SPMC Blood Production Services',
      scanProgress: 0,
      scannedCount: 0,
      matchedCount: 0,
      criteriaChecked: 0,
      totalConfirmed: 12,
      currentPhase: 1,

      // ─── Hospital CRUD ──────────────────────────────────────────────────
      fetchHospitalsFromAPI: async () => {
        try {
          const data = await apiGetHospitals();
          if (data.hospitals) set({ hospitals: data.hospitals });
        } catch (err) {
          console.warn('[BloodLink] Could not fetch hospitals from API:', err.message);
        }
      },

      addHospital: async (form) => {
        try {
          const data = await apiCreateHospital(form);
          if (data.hospital) { set((s) => ({ hospitals: [...s.hospitals, data.hospital] })); return; }
        } catch (err) {
          if (err?.status && err.status < 500) throw err;
          console.error('[BloodLink] API createHospital failed:', err.message, err.status || '');
        }
        const id = 'HOSP-' + String(Date.now()).slice(-4);
        set((s) => ({ hospitals: [...s.hospitals, { id, ...form }] }));
      },

      updateHospital: async (id, form) => {
        const numericId = parseInt(id.replace('HOSP-', ''), 10);
        if (!isNaN(numericId)) {
          try {
            const data = await apiUpdateHospital(numericId, form);
            if (data.hospital) { set((s) => ({ hospitals: s.hospitals.map(h => h.id === id ? { ...h, ...data.hospital } : h) })); return; }
          } catch (err) {
            if (err?.status && err.status < 500) throw err;
            console.error('[BloodLink] API updateHospital failed:', err.message, err.status || '');
          }
        }
        set((s) => ({ hospitals: s.hospitals.map(h => h.id === id ? { ...h, ...form } : h) }));
      },

      deleteHospital: async (id) => {
        const numericId = parseInt(id.replace('HOSP-', ''), 10);
        if (!isNaN(numericId)) {
          try { await apiDeleteHospital(numericId); } catch (err) { console.error('[BloodLink] API deleteHospital failed:', err.message); }
        }
        set((s) => ({ hospitals: s.hospitals.filter(h => h.id !== id) }));
      },

      // ─── Registry Operations ─────────────────────────────────────────────
      fetchDonorsFromAPI: async () => {
        try {
          const data = await apiGetDonors();
          if (data.donors) set({ donors: data.donors });
        } catch (err) {
          console.warn('[BloodLink] Could not fetch donors from API:', err.message);
        }
      },

      addDonor: async (newDonor) => {
        try {
          // Map the frontend's newDonor shape → what the API controller expects
          const payload = {
            firstName:      newDonor.firstName      || newDonor.name?.split(' ')[0] || '',
            middleName:     newDonor.middleName      || null,
            lastName:       newDonor.lastName        || newDonor.name?.split(' ').slice(-1)[0] || '',
            sex:            newDonor.sex             || '',
            civilStatus:    newDonor.civilStatus     || '',
            dob:            newDonor.dob             || newDonor.birthDate || '',
            address:        newDonor.address         || '',
            contactNumber:  newDonor.contactNumber   || newDonor.phone || '',
            email:          newDonor.email           || null,
            bloodType:      newDonor.bloodType       || null,
            status:         newDonor.status          || newDonor.donorStatus || 'New',
            donationDate:   newDonor.registrationDate|| newDonor.donationDate || new Date().toISOString().slice(0,10),
            lastDonation:   newDonor.lastDonation    || null,
            totalDonations: newDonor.totalDonations  || 0,
            remarks:        newDonor.remarks         || null,
          };
          const data = await apiCreateDonor(payload);
          if (data.donor) { set((s) => ({ donors: [data.donor, ...s.donors] })); return; }
        } catch (err) {
          if (err?.status && err.status < 500) throw err;
          console.error('[BloodLink] API createDonor failed, using local fallback:', err.message, err.status || '', err.data || '');
        }
        // Fallback: local-only
        set((state) => ({ donors: [newDonor, ...state.donors] }));
      },

      // Registry profile edits only. Medical eligibility and donation outcomes use
      // their separate clinical workflow and are intentionally not changed here.
      updateDonor: async (id, changes) => {
        const numericId = parseInt(String(id).replace(/\D/g, ''), 10);
        const payload = {
          firstName:     changes.firstName,
          middleName:    changes.middleName || null,
          lastName:      changes.lastName,
          sex:           changes.sex,
          civilStatus:   changes.civilStatus,
          dob:           changes.dob,
          address:       changes.address,
          contactNumber: changes.contactNumber,
          email:         changes.email || null,
        };

        if (Number.isNaN(numericId)) return { success: false, error: 'Invalid donor record.' };
        try {
          const data = await apiUpdateDonor(numericId, payload);
          if (data.donor) {
            set(state => ({ donors: state.donors.map(donor => donor.id === id ? data.donor : donor) }));
            return { success: true, donor: data.donor };
          }
          return { success: false, error: 'The server did not return the updated donor.' };
        } catch (err) {
          console.error('[BloodLink] updateDonor failed:', err.message, err.status || '');
          return { success: false, error: err.message || 'Could not update donor.' };
        }
      },

      fetchDonationEventsFromAPI: async () => {
        try {
          const data = await apiGetDonationEvents();
          if (data.donationEvents) set({ donationEvents: data.donationEvents });
        } catch (err) {
          console.warn('[BloodLink] Could not fetch donation events from API:', err.message);
        }
      },

      fetchDonationsFromAPI: async () => {
        try {
          const data = await apiGetDonations();
          if (data.donations) set({ donations: data.donations });
        } catch (err) {
          console.warn('[BloodLink] Could not fetch donations from API:', err.message);
        }
      },

      fetchBloodRequestsFromAPI: async () => {
        try {
          const data = await apiGetBloodRequests();
          if (data.bloodRequests) set({ bloodRequests: data.bloodRequests });
        } catch (err) {
          console.warn('[BloodLink] Could not fetch blood requests from API:', err.message);
        }
      },

      fetchBloodIssuancesFromAPI: async () => {
        try {
          const data = await apiGetBloodIssuances();
          if (data.issuances) set({ bloodIssuances: data.issuances });
        } catch (err) {
          console.warn('[BloodLink] Could not fetch blood issuances from API:', err.message);
        }
      },

      // Blood Bank Staff: process a verified request → creates issuance, sets request to Ready for Release
      processBloodRequest: async ({ requestId, requestRef, items, remarks, isPartial }) => {
        try {
          const data = await apiCreateBloodIssuance({ requestId, items, remarks, isPartial });
          if (data.issuance) {
            set(state => ({ bloodIssuances: [data.issuance, ...state.bloodIssuances] }));
          }
          // Refresh requests so status updates
          const reqData = await apiGetBloodRequests();
          if (reqData.bloodRequests) set({ bloodRequests: reqData.bloodRequests });
          return { success: true, issuance: data.issuance };
        } catch (err) {
          console.error('[BloodLink] processBloodRequest failed:', err.message);
          return { success: false, error: err.message };
        }
      },

      // Issuance Personnel: approve physical release of prepared blood units
      approveBloodRelease: async ({ issuanceId, remarks }) => {
        try {
          const data = await apiApproveBloodRelease(issuanceId, { remarks });
          if (data.issuance) {
            set(state => ({
              bloodIssuances: state.bloodIssuances.map(i =>
                i.issuanceId === issuanceId ? data.issuance : i
              )
            }));
          }
          const reqData = await apiGetBloodRequests();
          if (reqData.bloodRequests) set({ bloodRequests: reqData.bloodRequests });
          // Re-fetch inventory so the UI reflects deducted units immediately
          const { fetchBloodInventoryFromAPI } = get();
          await fetchBloodInventoryFromAPI();
          return { success: true };
        } catch (err) {
          console.error('[BloodLink] approveBloodRelease failed:', err.message);
          return { success: false, error: err.message };
        }
      },

      fetchLabResultsFromAPI: async () => {
        try {
          const data = await apiGetLabResults();
          if (data.labResults) set({ labTestResults: data.labResults });
        } catch (err) {
          console.warn('[BloodLink] Could not fetch lab results from API:', err.message);
        }
      },

      addDonationEvent: async (eventForm) => {
        const payload = {
          province:             eventForm.province || '',
          cityMunicipality:     eventForm.cityMunicipality || '',
          barangayOrganization: eventForm.barangayOrganization || '',
          eventDate:            eventForm.eventDate || '',
        };

        // ── Try API first ──
        try {
          const data = await apiCreateDonationEvent(payload);
          if (data.donationEvent) {
            set((s) => ({
              donationEvents: [...s.donationEvents, data.donationEvent],
              auditLogs: [{ logId: 'LOG-' + Math.floor(100 + Math.random() * 900), userId: s.authSystemUser?.id || 'USR-001', action: `Added Donation Event: ${data.donationEvent.barangayOrganization} (${data.donationEvent.eventDate})`, module: 'Donation Events', recordId: data.donationEvent.eventId, oldValue: null, newValue: JSON.stringify(data.donationEvent), performedAt: new Date().toLocaleString() }, ...s.auditLogs]
            }));
            return data.donationEvent;
          }
        } catch (err) {
          if (err?.status && err.status < 500) throw err;
          console.error('[BloodLink] API createDonationEvent failed:', err.message, err.status || '');
        }

        // ── Fallback: local-only ──
        const eventId = 'EVT-' + Math.floor(100 + Math.random() * 900);
        const newEvent = { eventId, event_id: eventId, province: payload.province, cityMunicipality: payload.cityMunicipality, city_municipality: payload.cityMunicipality, barangayOrganization: payload.barangayOrganization, barangay_organization: payload.barangayOrganization, eventDate: payload.eventDate, event_date: payload.eventDate, createdAt: new Date().toLocaleString(), created_at: new Date().toLocaleString() };
        set((s) => ({ donationEvents: [...s.donationEvents, newEvent], auditLogs: [{ logId: 'LOG-' + Math.floor(100 + Math.random() * 900), userId: s.authSystemUser?.id || 'USR-001', action: `Added Donation Event: ${newEvent.barangayOrganization} (${newEvent.eventDate})`, module: 'Donation Events', recordId: eventId, oldValue: null, newValue: JSON.stringify(newEvent), performedAt: new Date().toLocaleString() }, ...s.auditLogs] }));
        return newEvent;
      },

      updateDonationEvent: async (eventId, eventForm) => {
        const numericId = parseInt(String(eventId).replace('EVT-', ''), 10);
        const payload = {
          province:             eventForm.province,
          cityMunicipality:     eventForm.cityMunicipality,
          barangayOrganization: eventForm.barangayOrganization,
          eventDate:            eventForm.eventDate,
        };

        if (!isNaN(numericId)) {
          try {
            const data = await apiUpdateDonationEvent(numericId, payload);
            if (data.donationEvent) {
              set((s) => ({
                donationEvents: s.donationEvents.map(e => (e.eventId === eventId || e.event_id === eventId) ? { ...e, ...data.donationEvent } : e),
                auditLogs: [{ logId: 'LOG-' + Math.floor(100 + Math.random() * 900), userId: s.authSystemUser?.id || 'USR-001', action: `Updated Donation Event: ${data.donationEvent.barangayOrganization} (${data.donationEvent.eventDate})`, module: 'Donation Events', recordId: eventId, oldValue: null, newValue: JSON.stringify(data.donationEvent), performedAt: new Date().toLocaleString() }, ...s.auditLogs]
              }));
              return;
            }
          } catch (err) {
            if (err?.status && err.status < 500) throw err;
            console.error('[BloodLink] API updateDonationEvent failed:', err.message);
          }
        }

        // Fallback: local-only
        set((s) => ({
          donationEvents: s.donationEvents.map(e => (e.eventId === eventId || e.event_id === eventId) ? { ...e, ...payload, city_municipality: payload.cityMunicipality, barangay_organization: payload.barangayOrganization, event_date: payload.eventDate } : e)
        }));
      },

      deleteDonationEvent: async (eventId) => {
        const numericId = parseInt(String(eventId).replace('EVT-', ''), 10);
        if (!isNaN(numericId)) {
          try {
            await apiDeleteDonationEvent(numericId);
          } catch (err) {
            console.error('[BloodLink] API deleteDonationEvent failed:', err.message);
          }
        }

        set((s) => ({
          donationEvents: s.donationEvents.filter(e => e.eventId !== eventId && e.event_id !== eventId),
          auditLogs: [{ logId: 'LOG-' + Math.floor(100 + Math.random() * 900), userId: s.authSystemUser?.id || 'USR-001', action: `Deleted Donation Event ${eventId}`, module: 'Donation Events', recordId: eventId, oldValue: null, newValue: null, performedAt: new Date().toLocaleString() }, ...s.auditLogs]
        }));
      },


      // ─── Distribution & Equity Allocation ───────────────────────────────
      getEquityAllocations: () => {
        const { inventory, hospitals, forecastData } = get();
        return computeEquityAllocation(inventory, hospitals, forecastData);
      },

      recordDistribution: (hospitalId, hospitalName, bloodType, units) => {
        const { inventory } = get();
        const id = 'DIST-' + String(Date.now()).slice(-5);
        const date = new Date().toISOString().slice(0, 10);
        const log = { id, hospitalId, hospitalName, bloodType, units, date, allocatedBy: 'Admin User' };

        // Decrement inventory
        const newInventory = inventory.map(item => {
          if (item.type === bloodType) {
            const newUnits = Math.max(0, item.units - units);
            const status = newUnits < item.threshold ? 'critical' : newUnits === item.threshold ? 'low' : 'safe';
            return { ...item, units: newUnits, status };
          }
          return item;
        });

        set((state) => ({
          distributionLog: [log, ...state.distributionLog],
          inventory: newInventory
        }));
      },

      // Find the last time a hospital received a specific blood type (for emergency retracking)
      getLastDistributionByBloodType: (bloodType) => {
        const { distributionLog } = get();
        return distributionLog
          .filter(log => log.bloodType === bloodType)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      },

      // ─── Forecasting (Legacy weekly chart) ──────────────────────────────
      generateNextWeeks: (weeks = 4) => {
        const { forecastData } = get();
        const actuals = forecastData.filter(w => w.actual !== null);
        const n = actuals.length;
        const slope = n >= 2
          ? (actuals[n - 1].demand - actuals[0].demand) / (n - 1)
          : 5;
        const lastDemand = actuals.length > 0 ? actuals[n - 1].demand : 160;
        const existingPredicted = forecastData.filter(w => w.actual === null).length;
        const totalWeeks = forecastData.length;
        const newWeeks = [];
        for (let i = 1; i <= weeks; i++) {
          const wkNum = totalWeeks + existingPredicted + i;
          const demand = Math.round(lastDemand + slope * (existingPredicted + i));
          const margin = Math.round(demand * 0.07);
          newWeeks.push({ week: `Wk ${wkNum} (P)`, demand, actual: null, upper: demand + margin, lower: demand - margin });
        }
        set((state) => ({ forecastData: [...state.forecastData, ...newWeeks] }));
      },

      // ─── Granular Forecast: Multiple Linear Regression (MLR) ─────────────
      // Correct MLR approach:
      //   1. Collect all hospital × blood type × component × week observations into one GLOBAL matrix
      //   2. Solve a single set of OLS coefficients b = (X^T X)^-1 X^T Y
      //      where X = [1, week, hospScale, compWeight] — these vary ACROSS groups
      //   3. For each group, predict future weeks using the learned global coefficients + MA4 blending
      //   NOTE: Per-group matrices with constant X2/X3 are SINGULAR → that's why the old approach crashed.
      generateGranularForecast: async (weeksAhead = 4) => {
        const { hospitals } = get();
        const authToken = localStorage.getItem('bloodlink_api_token');

        // ── Try real Python MLR service first ─────────────────────────────
        try {
          // Fetch predictions AND real historical data in parallel
          const [predRes, histRes] = await Promise.all([
            fetch('http://localhost:8000/api/ml/predict', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify({ weeks_ahead: weeksAhead }),
            }),
            fetch('http://localhost:5001/historical?weeks=8'),
          ]);

          if (predRes.ok) {
            const data    = await predRes.json();
            // Real CSV historical data (null-safe if /historical fails)
            const histData = histRes.ok ? await histRes.json() : null;

            // Build lookup: groupKey -> real historical weeks array from CSV
            const groupHistMap = {};
            if (histData?.byGroup) {
              histData.byGroup.forEach(g => {
                const key = `${g.hospitalId}|${g.bloodTypeId}|${g.componentId}`;
                groupHistMap[key] = g.weeks.map(w => ({
                  week:   w.weekIndex - 1,
                  date:   w.weekStartDate,
                  actual: w.demand,
                }));
              });
            }

            const BASE_WEEK = new Date();
            let seq = 1;

            const results = (data.predictions || []).map(p => {
              const weekDate = new Date(BASE_WEEK);
              weekDate.setDate(weekDate.getDate() + p.weeksAhead * 7);

              const hosp = hospitals.find(h =>
                h.id === p.hospitalId ||
                `HOSP-${String(h.id).replace('HOSP-', '').padStart(3, '0')}` === p.hospitalId ||
                h.name === p.hospitalName
              );

              // Use REAL CSV historical weeks; fallback to empty array
              const groupKey = `${p.hospitalId}|${p.bloodTypeId}|${p.componentId}`;
              const historicalWeeks = groupHistMap[groupKey] || [];

              return {
                forecastId:       seq++,
                hospitalId:       hosp?.id ?? p.hospitalId,
                hospitalName:     p.hospitalName,
                bloodTypeId:      p.bloodTypeId,
                componentId:      p.componentId,
                forecastWeek:     weekDate.toISOString().slice(0, 10),
                forecastWeekLabel:`Wk ${p.weeksAhead}`,
                predictedDemand:  p.predictedDemand,
                upperBound:       Math.round(p.predictedDemand * 1.08),
                lowerBound:       Math.max(0, Math.round(p.predictedDemand * 0.92)),
                generatedAt:      data.metadata?.generatedAt ?? new Date().toISOString(),
                weeksAhead:       p.weeksAhead,
                historicalWeeks,
                mlSource:         'python-mlr',
                mlMetrics:        data.metadata ?? {},
              };
            });


            set({ granularForecasts: results });
            console.log(`[MLR] Loaded ${results.length} forecasts from Python service (R²=${data.metadata?.r2_test ?? '?'})`);
            return;
          }
        } catch (err) {
          console.warn('[MLR] Python ML service unavailable — falling back to JS simulation.', err?.message);
        }

        // ── Fallback: JS MLR simulation (original implementation) ──────────
        const { inventory } = get();
        const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
        const COMPONENTS  = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];
        const BASE_WEEK   = new Date('2026-05-05');
        const RARITY = { 'O+': 1.0, 'A+': 0.8, 'B+': 0.7, 'AB+': 0.3, 'O-': 0.6, 'A-': 0.4, 'B-': 0.2, 'AB-': 0.1 };
        const COMP_W = { 'PRBC': 1.0, 'Platelet Concentrate': 0.6, 'FFP': 0.5, 'Cryoprecipitate': 0.3, 'Cryosupernate': 0.2 };
        const HOSP_S = { 'Government': 1.5, 'Blood Bank': 1.2 };

        const matTranspose = M => M[0].map((_, c) => M.map(r => r[c]));
        const matMultiply  = (A, B) => A.map(rA => B[0].map((_, cB) => rA.reduce((s, v, k) => s + v * B[k][cB], 0)));
        const matInvert    = M => {
          const n = M.length, A = M.map(r => [...r]);
          const I = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
          for (let i = 0; i < n; i++) {
            let mR = i;
            for (let k = i+1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[mR][i])) mR = k;
            [A[i], A[mR]] = [A[mR], A[i]]; [I[i], I[mR]] = [I[mR], I[i]];
            const d = A[i][i] || 1e-12;
            A[i] = A[i].map(v => v/d); I[i] = I[i].map(v => v/d);
            for (let h = 0; h < n; h++) if (h !== i) {
              const f = A[h][i];
              A[h] = A[h].map((v, k) => v - f * A[i][k]);
              I[h] = I[h].map((v, k) => v - f * I[i][k]);
            }
          }
          return I;
        };

        const groups = [];
        hospitals.forEach(hosp => {
          BLOOD_TYPES.forEach(bt => {
            if (!inventory.find(i => i.type === bt)) return;
            COMPONENTS.forEach(comp => {
              const rarityFactor = RARITY[bt] || 0.5, compFactor = COMP_W[comp] || 0.5;
              const hospFactor = HOSP_S[hosp.type] || 1.0;
              const baseDemand = Math.round(8 * rarityFactor * compFactor * hospFactor);
              if (!baseDemand) return;
              const historicalWeeks = Array.from({ length: 8 }, (_, w) => {
                const d = new Date(BASE_WEEK); d.setDate(d.getDate() + w * 7);
                return { week: w, date: d.toISOString().slice(0, 10), actual: Math.max(0, baseDemand + Math.round((Math.random() - 0.4) * baseDemand * 0.3)) };
              });
              groups.push({ hosp, bt, comp, hospScale: HOSP_S[hosp.type] || 1.0, compWeight: COMP_W[comp] || 0.5, historicalWeeks });
            });
          });
        });

        const gX = [], gY = [];
        groups.forEach(({ hospScale, compWeight, historicalWeeks }) =>
          historicalWeeks.forEach(({ week, actual }) => { gX.push([1, week, hospScale, compWeight]); gY.push([actual]); })
        );
        let b0=0, b1=0, b2=0, b3=0;
        try { const XT = matTranspose(gX), beta = matMultiply(matMultiply(matInvert(matMultiply(XT, gX)), XT), gY); [b0,b1,b2,b3] = [0,1,2,3].map(i => isFinite(beta[i][0]) ? beta[i][0] : 0); } catch (_) {}

        const results = []; let fid = 1;
        groups.forEach(({ hosp, bt, comp, hospScale, compWeight, historicalWeeks }) => {
          const maLast = historicalWeeks.slice(-4).reduce((s, w) => s + w.actual, 0) / 4;
          for (let i = 1; i <= weeksAhead; i++) {
            const wd = new Date(BASE_WEEK); wd.setDate(wd.getDate() + (8+i-1)*7);
            const predicted = Math.max(0, Math.round(0.7*(b0+b1*(8+i-1)+b2*hospScale+b3*compWeight) + 0.3*maLast));
            const margin = Math.max(1, Math.round(predicted * 0.08));
            results.push({ forecastId: fid++, hospitalId: hosp.id, hospitalName: hosp.name, bloodTypeId: bt, componentId: comp, forecastWeek: wd.toISOString().slice(0, 10), forecastWeekLabel: `Wk ${8+i}`, predictedDemand: predicted, upperBound: predicted+margin, lowerBound: Math.max(0, predicted-margin), generatedAt: new Date().toISOString(), historicalWeeks, mlrCoefficients: { b0: +b0.toFixed(3), b1: +b1.toFixed(3), b2: +b2.toFixed(3), b3: +b3.toFixed(3) }, maLast: +maLast.toFixed(1), weeksAhead: i, mlSource: 'js-simulation' });
          }
        });
        set({ granularForecasts: results });
        console.warn('[MLR] Using JS simulation fallback.');
      },

      // ─── Donor Registration ─────────────────────────────────────────────
      registerDonor: (form) => {
        const id = 'BLD-' + Math.floor(100000 + Math.random() * 900000);
        const name = `${form.firstName} ${form.lastName}`;
        const newDonor = {
          ...form,
          id,
          name,
          totalDonations: form.donatedBefore === 'yes' ? 1 : 0,
          alertsResponded: 0,
          livesImpacted: form.donatedBefore === 'yes' ? 3 : 0,
          arrived: false,
          distance: '2.5 km'
        };
        set((state) => ({
          donors: [newDonor, ...state.donors],
          currentUser: newDonor
        }));
        return id;
      },

      updateDonorMedical: async (id, medicalForm) => {
        // This now calls PUT /api/donations/{id}/outcome
        // The donation record must already exist (created by lab staff)
        const numericDonationId = medicalForm.donation_id || null;

        if (numericDonationId) {
          try {
            await apiUpdateDonationOutcome(numericDonationId, {
              screeningOutcome: medicalForm.screeningOutcome || 'Accepted',
              deferralReason:   medicalForm.deferralReason  || null,
              deferralEndDate:  medicalForm.deferralEndDate || null,
            });
          } catch (err) {
            console.error('[BloodLink] API updateDonationOutcome failed:', err.message, err.status || '');
          }
        }

        // Always update local state
        set((state) => {
          const updatedDonors = state.donors.map(d => d.id === id ? { ...d, ...medicalForm } : d);
          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          return {
            donors: updatedDonors,
            auditLogs: [{ logId: auditLogId, userId: state.authSystemUser?.id || 'USR-003', action: `Recorded Screening Outcome for donor ${id}`, module: 'Registry', recordId: id, oldValue: null, newValue: JSON.stringify(medicalForm), performedAt: new Date().toLocaleString() }, ...state.auditLogs]
          };
        });
      },

      addLabTestResult: async (labForm) => {
        // ── Try API first: create donation record + lab results together ──
        const numericDonorId  = parseInt(String(labForm.donorId  ?? '').replace(/^D0*/i, ''), 10);
        const numericEventId  = labForm.eventId
          ? parseInt(String(labForm.eventId).replace(/^EVT-0*/i, ''), 10) : null;

        let apiSucceeded = false;
        if (!isNaN(numericDonorId) || labForm.serialNumber) {
          try {
            await apiCreateLabResult({
              donorId:            numericDonorId,
              eventId:            (!isNaN(numericEventId) ? numericEventId : null),
              donationDate:       labForm.donationDate || new Date().toISOString().slice(0, 10),
              serialNumber:       labForm.serialNumber || null,
              hemoglobinResult:   labForm.hemoglobinResult   || null,
              bloodTypeConfirmed: labForm.bloodTypeConfirmed || null,
              hbsagResult:        labForm.hbsagResult        || null,
              syphilisResult:     labForm.syphilisResult     || null,
              hivResult:          labForm.hivResult          || null,
              hcvResult:          labForm.hcvResult          || null,
              malariaResult:      labForm.malariaResult      || null,
              natResult:          labForm.natResult          || null,
              othersResult:       labForm.othersResult       || null,
              screeningOutcome:   labForm.screeningOutcome   || null,
              deferralReason:     labForm.deferralReason     || null,
            });
            apiSucceeded = true;
          } catch (err) {
            if (err?.status && err.status < 500) throw err;
            console.error('[BloodLink] API createLabResult failed:', err.message, err.status || '');
          }
        }

        // ── If API succeeded, re-fetch from DB (prevents local duplicate) ──
        if (apiSucceeded) {
          try {
            const [labData, donData] = await Promise.all([apiGetLabResults(), apiGetDonations()]);
            const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
            set((state) => ({
              labTestResults: labData.labResults ?? state.labTestResults,
              donations:      donData.donations  ?? state.donations,
              auditLogs: [{
                logId: auditLogId, userId: state.authSystemUser?.id || 'USR-003',
                action: `Encoded Lab Result — Serial ${labForm.serialNumber || 'auto'}`,
                module: 'Laboratory', recordId: labForm.donorId, oldValue: null,
                newValue: labForm.bloodTypeConfirmed, performedAt: new Date().toLocaleString()
              }, ...state.auditLogs]
            }));
            return;
          } catch (_) { /* fall through to local state update */ }
        }

        // ── Offline fallback: update local state only ──
        set((state) => {
          const testId = 'LAB-' + Math.floor(100 + Math.random() * 900);
          const newLabResult = {
            testId,
            donationId: labForm.donationId || '',
            serialNumber: labForm.serialNumber || '',
            hemoglobinResult: labForm.hemoglobinResult || '14.5',
            bloodTypeConfirmed: labForm.bloodTypeConfirmed || 'O+',
            hbsagResult: labForm.hbsagResult || 'Non-Reactive',
            syphilisResult: labForm.syphilisResult || 'Non-Reactive',
            hivResult: labForm.hivResult || 'Non-Reactive',
            hcvResult: labForm.hcvResult || 'Non-Reactive',
            malariaResult: labForm.malariaResult || 'Non-Reactive',
            natResult: labForm.natResult || 'Non-Reactive',
            othersResult: labForm.othersResult || '',
            recordedBy: state.authSystemUser?.id || 'USR-003'
          };

          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          return {
            labTestResults: [newLabResult, ...state.labTestResults],
            auditLogs: [{
              logId: auditLogId, userId: state.authSystemUser?.id || 'USR-003',
              action: `Encoded Laboratory Test Results for test ${testId}`,
              module: 'Laboratory', recordId: testId, oldValue: null,
              newValue: JSON.stringify(newLabResult), performedAt: new Date().toLocaleString()
            }, ...state.auditLogs]
          };
        });
      },

      recordDonation: async (form) => {
        // Called by Registry to record a donation with serial number from the DHQ.
        // Does NOT include lab results — those are handled by Serology.
        const numericDonorId = parseInt(String(form.donorId ?? '').replace(/^D0*/i, ''), 10);
        const numericEventId = form.eventId
          ? parseInt(String(form.eventId).replace(/^EVT-0*/i, ''), 10) : null;

        if (isNaN(numericDonorId)) throw new Error('Invalid donor ID');

        const data = await apiCreateDonation({
          donorId:          numericDonorId,
          eventId:          (!isNaN(numericEventId) ? numericEventId : null),
          donationDate:     form.donationDate || new Date().toISOString().slice(0, 10),
          serialNumber:     form.serialNumber || null,
          screeningOutcome: form.screeningOutcome || null,
          deferralReason:   form.deferralReason   || null,
          deferralEndDate:  form.deferralEndDate   || null,
        });

        // Re-fetch donations to keep the list current
        try {
          const donData = await apiGetDonations();
          set({ donations: donData.donations ?? [] });
        } catch (_) {}

        return data;
      },

      fetchDonationBySerial: async (serial) => {
        // Serology uses this to auto-populate donor info from a DHQ serial number.
        return apiGetDonationBySerial(serial);
      },

      addUser: async (userForm) => {
        const now = new Date();

        // Hospital affiliation identifies the facility only. It must never copy
        // a hospital contact into a distinct user account.
        const state = get();
        const finalFirstName = userForm.firstName || '';
        const finalLastName  = userForm.lastName  || '';
        const finalEmail     = userForm.email     || '';
        const finalContact   = userForm.contactNumber || '';

        const payload = {
          firstName: finalFirstName, lastName: finalLastName,
          email: finalEmail, contactNumber: finalContact,
          password: userForm.passwordHash || userForm.password || '',
          role: userForm.role || 'Registry Staff',
          status: userForm.status || 'Active',
          hospitalId: userForm.hospitalId || null,
        };

        // ── Try API first ──
        try {
          const data = await apiCreateUser(payload);
          if (data.user) {
            set((s) => ({
              users: [...s.users, data.user],
              auditLogs: [{ logId: 'LOG-' + Math.floor(100 + Math.random() * 900), userId: s.authSystemUser?.id || 'USR-001', action: `Created new system user ${data.user.name} (${data.user.role})`, module: 'User Management', recordId: data.user.id, oldValue: null, newValue: JSON.stringify({ id: data.user.id, role: data.user.role, email: data.user.email }), performedAt: now.toLocaleString() }, ...s.auditLogs]
            }));
            return;
          }
        } catch (err) {
          // A validation rejection must never be turned into a local success.
          if (err?.status && err.status < 500) throw err;
          console.error('[BloodLink] API createUser failed, using local fallback:', err.message, err.status || '', err.data || '');
        }

        // ── Fallback: local-only ──
        const id = 'USR-' + String(Math.floor(Math.random() * 900) + 100);
        const newUser = { id, roleId: userForm.roleId || null, firstName: finalFirstName, lastName: finalLastName, name: `${finalFirstName} ${finalLastName}`.trim(), email: finalEmail, contactNumber: finalContact, status: userForm.status || 'Active', role: userForm.role || 'Registry Staff', hospitalId: userForm.hospitalId || null, createdAt: now.toLocaleString(), updatedAt: now.toLocaleString() };
        set((s) => ({ users: [...s.users, newUser], auditLogs: [{ logId: 'LOG-' + Math.floor(100 + Math.random() * 900), userId: s.authSystemUser?.id || 'USR-001', action: `Created new system user ${newUser.name} (${newUser.role})`, module: 'User Management', recordId: id, oldValue: null, newValue: JSON.stringify({ id, role: newUser.role, email: newUser.email }), performedAt: now.toLocaleString() }, ...s.auditLogs] }));
      },

      updateUser: async (userId, updatedFields) => {
        const now = new Date();
        const roleMap = { 'Super Admin': 'ROLE-001', 'Administrator': 'ROLE-002', 'Registry Staff': 'ROLE-003', 'Blood Bank Staff': 'ROLE-004', 'Issuance Personnel': 'ROLE-005', 'Hospital User': 'ROLE-006', 'Serology Staff': 'ROLE-007', 'Production Staff': 'ROLE-008' };

        // ── Try API first ──
        const numericId = parseInt(userId.replace('USR-', ''), 10);
        if (!isNaN(numericId)) {
          try {
            const data = await apiUpdateUser(numericId, updatedFields);
            if (data.user) {
              set((s) => {
                const updatedUsers = s.users.map(u => u.id === userId ? { ...u, ...data.user } : u);
                const target = updatedUsers.find(u => u.id === userId);
                return { users: updatedUsers, auditLogs: [{ logId: 'LOG-' + Math.floor(100 + Math.random() * 900), userId: s.authSystemUser?.id || 'USR-001', action: `Updated system user ${target?.name} (${target?.role})`, module: 'User Management', recordId: userId, oldValue: null, newValue: JSON.stringify({ role: target?.role, email: target?.email, status: target?.status }), performedAt: now.toLocaleString() }, ...s.auditLogs] };
              });
              return;
            }
          } catch (err) {
            if (err?.status && err.status < 500) throw err;
            console.error('[BloodLink] API updateUser failed, using local fallback:', err.message, err.status || '', err.data || '');
          }
        }

        // ── Fallback: local-only ──
        set((state) => {
          const updatedUsers = state.users.map(u => {
            if (u.id !== userId) return u;
            const firstName = updatedFields.firstName ?? u.firstName;
            const lastName  = updatedFields.lastName  ?? u.lastName;
            const role      = updatedFields.role      ?? u.role;
            return { ...u, firstName, lastName, name: `${firstName} ${lastName}`.trim(), email: updatedFields.email ?? u.email, contactNumber: updatedFields.contactNumber ?? u.contactNumber, role, roleId: roleMap[role] ?? u.roleId, status: updatedFields.status ?? u.status, updatedAt: now.toLocaleString() };
          });
          const targetUser = updatedUsers.find(u => u.id === userId);
          return { users: updatedUsers, auditLogs: [{ logId: 'LOG-' + Math.floor(100 + Math.random() * 900), userId: state.authSystemUser?.id || 'USR-001', action: `Updated system user ${targetUser?.name} (${targetUser?.role})`, module: 'User Management', recordId: userId, oldValue: null, newValue: JSON.stringify({ role: targetUser?.role, email: targetUser?.email, status: targetUser?.status }), performedAt: now.toLocaleString() }, ...state.auditLogs] };
        });
      },

      // ─── Blood Requests ─────────────────────────────────────────────────
      addBloodRequest: async (reqForm) => {
        const refNo = 'REQ-' + Math.floor(1000 + Math.random() * 9000);
        const dateString = new Date().toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const newRequest = {
          refNo,
          requestId: null, // will be set from API response
          hospital: reqForm.hospital || 'Unknown Hospital',
          hospitalId: reqForm.hospitalId || 'HOSP-001',
          urgency: reqForm.urgency || 'routine',
          dateNeeded: reqForm.dateNeeded || '',
          contactPerson: reqForm.contactPerson || '',
          contactNumber: reqForm.contactNumber || '',
          status: reqForm.filedByIssuance ? 'Verified' : 'Pending Verification',
          submittedAt: dateString,
          diagnosis: reqForm.diagnosis || '',
          ward: reqForm.ward || '',
          notes: reqForm.notes || '',
          hospitalRefNo: reqForm.hospitalRefNo || '',
          statusNote: '',
          items: reqForm.items || [],
          filedByIssuance: reqForm.filedByIssuance || false,
          filedBy: reqForm.filedBy || null,
        };

        // Try API
        let apiSucceeded = false;
        try {
          const hospitalNumId = parseInt(String(reqForm.hospitalId || '').replace(/^HOSP-0*/i, ''), 10);
          const data = await apiCreateBloodRequest({
            hospitalId:          isNaN(hospitalNumId) ? 1 : hospitalNumId,
            urgency:             reqForm.urgency ? (reqForm.urgency.charAt(0).toUpperCase() + reqForm.urgency.slice(1)) : 'Routine',
            dateNeeded:          reqForm.dateNeeded || '',
            requestingPersonnel: reqForm.contactPerson || reqForm.filedBy || 'Unknown',
            hospitalRefNo:       reqForm.hospitalRefNo || null,
            ward:                reqForm.ward || null,
            diagnosis:           reqForm.diagnosis || null,
            remarks:             reqForm.notes || null,
            filedByIssuance:     reqForm.filedByIssuance || false,
            items:               (reqForm.items || []).map(i => ({ bloodType: i.bloodType, component: i.component, units: i.units })),
          });
          if (data.bloodRequest) {
            newRequest.refNo      = data.bloodRequest.refNo || refNo;
            newRequest.requestId  = data.bloodRequest.requestId ?? null;
            apiSucceeded = true;
            // Re-fetch from DB so the store has the canonical server record (prevents duplicates)
            try {
              const reqData = await apiGetBloodRequests();
              if (reqData.bloodRequests) {
                set({ bloodRequests: reqData.bloodRequests });
                return newRequest.refNo;
              }
            } catch (_) { /* fall through to local add below */ }
          }
        } catch (err) {
          if (err?.status && err.status < 500) throw err;
          console.error('[BloodLink] API createBloodRequest failed:', err.message);
        }

        // Only add locally if API did not succeed (offline/fallback mode)
        if (!apiSucceeded) {
          set((state) => ({ bloodRequests: [newRequest, ...state.bloodRequests] }));
        }
        return newRequest.refNo;
      },

      updateBloodRequestStatus: async (refNo, status, statusNote = '') => {
        // Try API
        try {
          const req = get().bloodRequests.find(r => r.refNo === refNo);
          if (req?.requestId) {
            await apiUpdateBloodRequestStatus(req.requestId, { status, remarks: statusNote });
            // Re-fetch from DB to get the true persisted state
            try {
              const reqData = await apiGetBloodRequests();
              if (reqData.bloodRequests) { set({ bloodRequests: reqData.bloodRequests }); return; }
            } catch (_) {}
          }
        } catch (err) { console.error('[BloodLink] API updateBloodRequestStatus failed:', err.message); }
        // Fallback: update locally
        set((state) => ({
          bloodRequests: state.bloodRequests.map((req) =>
            req.refNo === refNo ? { ...req, status, statusNote } : req
          )
        }));
      },

      rejectRequest: async (refNo) => {
        try {
          const req = get().bloodRequests.find(r => r.refNo === refNo);
          if (req?.requestId) {
            await apiUpdateBloodRequestStatus(req.requestId, { status: 'Rejected' });
            // Re-fetch from DB so the queue immediately reflects the rejection
            try {
              const reqData = await apiGetBloodRequests();
              if (reqData.bloodRequests) { set({ bloodRequests: reqData.bloodRequests }); return; }
            } catch (_) {}
          }
        } catch (err) { console.error('[BloodLink] API rejectRequest failed:', err.message); }
        // Fallback: update locally
        set((state) => ({
          bloodRequests: state.bloodRequests.map(req => req.refNo === refNo ? { ...req, status: 'Rejected' } : req)
        }));
      },

      verifyRequest: async (refNo) => {
        try {
          const req = get().bloodRequests.find(r => r.refNo === refNo);
          if (req?.requestId) {
            await apiUpdateBloodRequestStatus(req.requestId, { status: 'Verified' });
            // Re-fetch from DB so queue immediately reflects the new status
            try {
              const reqData = await apiGetBloodRequests();
              if (reqData.bloodRequests) {
                const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
                set((state) => ({
                  bloodRequests: reqData.bloodRequests,
                  auditLogs: [{ logId: auditLogId, userId: state.authSystemUser?.id || 'USR-005', action: `Verified Request ${refNo} for ${req.hospital} (Sent to Blood Bank)`, module: 'Issuance', recordId: refNo, oldValue: 'Pending Verification', newValue: 'Verified', performedAt: new Date().toLocaleString() }, ...state.auditLogs]
                }));
                return;
              }
            } catch (_) {}
          }
        } catch (err) { console.error('[BloodLink] API verifyRequest failed:', err.message); }
        // Fallback: update locally
        set((state) => {
          const req = state.bloodRequests.find(r => r.refNo === refNo);
          if (!req) return state;
          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          return {
            bloodRequests: state.bloodRequests.map(r => r.refNo === refNo ? { ...r, status: 'Verified' } : r),
            auditLogs: [{ logId: auditLogId, userId: state.authSystemUser?.id || 'USR-005', action: `Verified Request ${refNo} for ${req.hospital} (Sent to Blood Bank)`, module: 'Issuance', recordId: refNo, oldValue: 'Pending Verification', newValue: 'Verified', performedAt: new Date().toLocaleString() }, ...state.auditLogs]
          };
        });
      },

      approveRequest: async (refNo) => {
        // Persist to DB first
        try {
          const req = get().bloodRequests.find(r => r.refNo === refNo);
          if (req?.requestId) await apiUpdateBloodRequestStatus(req.requestId, { status: 'Fulfilled' });
        } catch (err) { console.error('[BloodLink] API approveRequest failed:', err.message); }

        set((state) => {
          const req = state.bloodRequests.find(r => r.refNo === refNo);
          if (!req) return state;

          const items = req.items && req.items.length > 0
            ? req.items
            : (req.patientBloodType
              ? [{ bloodType: req.patientBloodType, component: req.component || 'PRBC', units: req.units || 1 }]
              : []);

          let updatedBloodInventory = [...state.bloodInventory];
          let totalIssuedCount = 0;

          // Match inventory units for each requested item
          items.forEach(item => {
            const matchable = updatedBloodInventory
              .filter(u => u.bloodType === item.bloodType && u.component === item.component && u.inventoryStatus === 'Available')
              .slice(0, item.units);

            totalIssuedCount += matchable.length;

            updatedBloodInventory = updatedBloodInventory.map(u => {
              const isMatched = matchable.some(mu => mu.unitId === u.unitId);
              return isMatched ? { ...u, inventoryStatus: 'Issued' } : u;
            });
          });

          // Generate issuance transaction (Table 12)
          const issuanceId = 'ISS-' + Math.floor(100 + Math.random() * 900);
          const newIssuance = {
            issuanceId,
            requestId: refNo,
            hospitalId: req.hospitalId || 'HOSP-001',
            processedBy: state.authSystemUser?.id || 'USR-005',
            issuanceDate: new Date().toISOString(),
            remarks: 'Issued and dispatched by Blood Bank'
          };

          // Generate issuance details (Table 13)
          const matchedUnitsForDetails = updatedBloodInventory.filter(u => u.inventoryStatus === 'Issued' && !state.bloodIssuanceDetails.some(d => d.unitId === u.unitId));
          const newIssuanceDetails = matchedUnitsForDetails.map(mu => ({
            detailId: 'DET-' + Math.floor(1000 + Math.random() * 9000),
            issuanceId,
            unitId: mu.unitId,
            quantity: mu.quantity || 450
          }));

          // Decrement aggregate inventory
          const newInventory = state.inventory.map(item => {
            const matchReq = items.find(i => i.bloodType === item.type);
            if (matchReq) {
              const newUnits = Math.max(0, item.units - matchReq.units);
              const status = newUnits < item.threshold ? 'critical' : newUnits === item.threshold ? 'low' : 'safe';
              return { ...item, units: newUnits, status };
            }
            return item;
          });

          // Record audit log
          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          const newAuditLog = {
            logId: auditLogId,
            userId: state.authSystemUser?.id || 'USR-005',
            action: `Dispatched Blood Request ${refNo} (Issued ${totalIssuedCount} units to ${req.hospital})`,
            module: 'Issuance',
            recordId: refNo,
            oldValue: 'Verified',
            newValue: 'Issued',
            performedAt: new Date().toLocaleString()
          };

          return {
            bloodRequests: state.bloodRequests.map(r => r.refNo === refNo ? { ...r, status: 'Issued' } : r),
            bloodInventory: updatedBloodInventory,
            bloodIssuance: [newIssuance, ...state.bloodIssuance],
            bloodIssuanceDetails: [...newIssuanceDetails, ...state.bloodIssuanceDetails],
            inventory: newInventory,
            auditLogs: [newAuditLog, ...state.auditLogs]
          };
        });
      },

      // ── Fetch inventory from API ─────────────────────────────────────────
      fetchBloodInventoryFromAPI: async () => {
        try {
          const data = await apiGetBloodInventory();
          if (data.bloodInventory) set({ bloodInventory: data.bloodInventory });
        } catch (err) {
          console.error('[BloodLink] fetchBloodInventoryFromAPI failed:', err.message);
        }
      },

      recordBloodUnit: async (unitForm) => {
        // Always try the API. If it fails, throw so the caller can show a real error.
        // We no longer fall back to local-state-only — that caused records to disappear
        // when the page re-mounted and fetchBloodInventoryFromAPI() overwrote local state.
        await apiCreateBloodInventory({
          donationId:     unitForm.donationId ? parseInt(unitForm.donationId, 10) : null,
          unitCode:       unitForm.unitId         || null,
          bloodType:      unitForm.bloodType      || 'O+',
          component:      unitForm.component      || 'PRBC',
          volumeCC:       unitForm.volumeCC != null && unitForm.volumeCC !== '' ? parseFloat(unitForm.volumeCC) : (parseFloat(unitForm.quantity) || 0),
          collectionDate: unitForm.collectionDate || new Date().toISOString().slice(0, 10),
          expirationDate: unitForm.expirationDate || '',
          safetyStatus:   unitForm.safetyStatus   || 'Cleared',
          intendedUse:    unitForm.intendedUse    || 'Transfusable',
          remarks:        unitForm.remarks        || null,
          statusDate:     unitForm.statusDate     || null,
        });
        // API succeeded — re-fetch canonical inventory from DB
        try {
          const data = await apiGetBloodInventory();
          if (data.bloodInventory) set({ bloodInventory: data.bloodInventory });
        } catch (_) { /* non-critical: UI will refresh on next mount */ }
      },

      verifyBloodUnit: async (unitId, action, rejectionReason = null) => {
        await apiVerifyBloodInventory(unitId, action, rejectionReason);
        try {
          const data = await apiGetBloodInventory();
          if (data.bloodInventory) set({ bloodInventory: data.bloodInventory });
        } catch (_) { /* non-critical */ }
      },

      // ── Walk-in / Direct Issuance ─────────────────────────────────
      fetchWalkinIssuances: async () => {
        try {
          const data = await apiGetWalkinIssuances();
          if (data?.data) set({ walkinIssuances: data.data });
        } catch (_) { /* non-critical */ }
      },

      createWalkinIssuance: async (payload) => {
        await apiCreateWalkinIssuance(payload);
        // Refresh both inventory and walkin log
        try {
          const [invData, wiData] = await Promise.all([
            apiGetBloodInventory(),
            apiGetWalkinIssuances(),
          ]);
          const patch = {};
          if (invData?.bloodInventory) patch.bloodInventory = invData.bloodInventory;
          if (wiData?.data)            patch.walkinIssuances = wiData.data;
          set(patch);
        } catch (_) { /* non-critical */ }
      },

      approveRecommendation: (recId) => {
        set((state) => {
          const updatedRecs = state.recommendations.map(r => r.recommendationId === recId ? { ...r, status: 'Approved', approvedBy: state.authSystemUser?.id || 'USR-002', actedAt: new Date().toLocaleString() } : r);

          const targetRec = state.recommendations.find(r => r.recommendationId === recId);
          let newInventory = state.inventory;
          if (targetRec) {
            const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
            const newAuditLog = {
              logId: auditLogId,
              userId: state.authSystemUser?.id || 'USR-002',
              action: `Approved Distribution Recommendation ${recId} for ${targetRec.hospitalId}`,
              module: 'Allocation',
              recordId: recId,
              oldValue: 'Pending',
              newValue: 'Approved',
              performedAt: new Date().toLocaleString()
            };

            newInventory = state.inventory.map(item => {
              if (item.type === targetRec.bloodTypeId) {
                const componentKey = {
                  'PRBC': 'units',
                  'Platelet Concentrate': 'platelets',
                  'FFP': 'ffp',
                  'Cryoprecipitate': 'cryo',
                  'Cryosupernate': 'cryosup'
                }[targetRec.componentId];
                if (componentKey) {
                  const newTotal = Math.max(0, (item[componentKey] || 0) - targetRec.recommendedQuantity);
                  const status = (componentKey === 'units' ? newTotal : item.units) < item.threshold ? 'critical' : (componentKey === 'units' ? newTotal : item.units) === item.threshold ? 'low' : 'safe';
                  return { ...item, [componentKey]: newTotal, status };
                }
              }
              return item;
            });

            return {
              recommendations: updatedRecs,
              inventory: newInventory,
              auditLogs: [newAuditLog, ...state.auditLogs]
            };
          }
          return { recommendations: updatedRecs };
        });
      },

            rejectRecommendation: (recId) => {
        set((state) => {
          const updatedRecs = state.recommendations.map(r => r.recommendationId === recId ? { ...r, status: 'Rejected', approvedBy: state.authSystemUser?.id || 'USR-002', actedAt: new Date().toISOString().slice(0, 19) } : r);

          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          const newAuditLog = {
            logId: auditLogId,
            userId: state.authSystemUser?.id || 'USR-002',
            action: `Rejected Distribution Recommendation ${recId}`,
            module: 'Allocation',
            recordId: recId,
            oldValue: 'Pending',
            newValue: 'Rejected',
            performedAt: new Date().toLocaleString()
          };

          return {
            recommendations: updatedRecs,
            auditLogs: [newAuditLog, ...state.auditLogs]
          };
        });
      },

      // ─── Generate Recommendations from Forecast (Table 15) ───────────────
      // Reads granularForecasts Week 9 (nearest future week) for each
      // hospital × blood type × component combination, takes the top-demand
      // entries, and creates Pending recommendation records with real forecastId FK.
      generateRecommendationsFromForecast: () => {
        set((state) => {
          const gf = state.granularForecasts;
          if (!gf || gf.length === 0) return {};

          const today = new Date().toISOString().slice(0, 10);

          // Take the very first future week label present in forecasts
          const weekLabels = [...new Set(gf.map(f => f.forecastWeekLabel))].sort();
          const nextWeekLabel = weekLabels[0]; // e.g. "Wk 9"

          // Filter to that week only
          const nextWeekForecasts = gf.filter(f => f.forecastWeekLabel === nextWeekLabel);

          // Sort by predicted demand descending, take top entries
          const sorted = [...nextWeekForecasts].sort((a, b) => b.predictedDemand - a.predictedDemand);

          // Deduplicate by hospital+bloodType+component (take highest predicted)
          const seen = new Set();
          const unique = sorted.filter(f => {
            const key = `${f.hospitalId}|${f.bloodTypeId}|${f.componentId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          // Take top 8 entries to avoid overwhelming the table
          const topForecasts = unique.slice(0, 8);

          // Build next REC ID sequence
          const existing = state.recommendations;
          const maxId = existing.reduce((max, r) => {
            const num = parseInt(r.recommendationId.replace('REC-', ''), 10);
            return isNaN(num) ? max : Math.max(max, num);
          }, 0);

          const newRecs = topForecasts.map((f, idx) => ({
            recommendationId: `REC-${String(maxId + idx + 1).padStart(3, '0')}`,
            forecastId: f.forecastId,           // Real FK → granularForecasts.forecastId
            hospitalId: f.hospitalId,
            hospitalName: f.hospitalName,
            bloodTypeId: f.bloodTypeId,
            componentId: f.componentId,
            recommendedQuantity: f.predictedDemand,
            recommendationDate: today,
            status: 'Pending',
            approvedBy: null,
            actedAt: null
          }));

          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          const newAuditLog = {
            logId: auditLogId,
            userId: state.authSystemUser?.id || 'USR-002',
            action: `Generated ${newRecs.length} distribution recommendations from Forecast ${nextWeekLabel}`,
            module: 'Allocation',
            recordId: nextWeekLabel,
            oldValue: null,
            newValue: `${newRecs.length} Pending`,
            performedAt: new Date().toLocaleString()
          };

          return {
            recommendations: [...newRecs, ...state.recommendations],
            auditLogs: [newAuditLog, ...state.auditLogs]
          };
        });
      },


      updateInventoryUnits: (type, units) => {
        set((state) => {
          const newInventory = state.inventory.map((item) => {
            if (item.type === type) {
              const status = units < item.threshold ? 'critical' : units === item.threshold ? 'low' : 'safe';
              return { ...item, units, status };
            }
            return item;
          });
          return { inventory: newInventory };
        });
      },

      // ─── Misc ────────────────────────────────────────────────────────────
      setFlaggedStatus: (flagged) => set({ accountFlagged: flagged }),

      setArrivalStatus: (arrived) => {
        set((state) => {
          const updatedUser = state.currentUser ? { ...state.currentUser, arrived } : null;
          const updatedDonors = state.donors.map((d) =>
            d.id === state.currentUser?.id ? { ...d, arrived } : d
          );
          return { arrivedAtFacility: arrived, currentUser: updatedUser, donors: updatedDonors };
        });
      },

      triggerMobilization: (target = 'O-', facility = 'SPMC Blood Production Services') => {
        set({ mobilizeFlowStep: 1, mobilizeTarget: target, mobilizeFacility: facility, scanProgress: 0, scannedCount: 0, matchedCount: 0, criteriaChecked: 0, totalConfirmed: 12, currentPhase: 1 });
      },

      setMobilizeFlowStep: (step) => set({ mobilizeFlowStep: step }),

      setScanProgress: (progress, scanned, matched, criteria) => {
        set({ scanProgress: progress, scannedCount: scanned, matchedCount: matched, criteriaChecked: criteria });
      },

      setPhaseDetails: (phase, confirmedCount) => set({ currentPhase: phase, totalConfirmed: confirmedCount }),

      dispatchSMSLog: (name, phone, msg, color, initials, donorId = null, recallId = null) => {
        const now = new Date();
        const smsId = 'SMS-' + Math.floor(100 + Math.random() * 900);
        const log = {
          smsId,
          donorId,
          recallId,
          name,
          phone,
          initials,
          color,
          message: msg,
          sentAt: now.toISOString().slice(0, 19), // 'YYYY-MM-DDTHH:mm:ss'
          status: 'Sent',
          errorMessage: null
        };
        set((state) => ({ smsLogs: [log, ...state.smsLogs] }));
      },

      // Fetch all recall records from API
      fetchRecallsFromAPI: async () => {
        try {
          const data = await apiGetRecalls();
          if (data.recalls) set({ recalls: data.recalls });
        } catch (e) {
          console.error('fetchRecallsFromAPI error:', e);
        }
      },

      dispatchRecallSMS: async (donorId, processedBy = null, { recallReason, smsMessage } = {}) => {
        try {
          const numericId = parseInt(String(donorId).replace(/^D0*/i, ''), 10);
          const data = await apiCreateRecall({
            donor_id:      numericId,
            recall_reason: recallReason ?? 'Critical Shortage Match',
            sms_message:   smsMessage   ?? undefined,
          });
          // Prepend to API-backed list
          set((state) => ({ recalls: [data.recall, ...state.recalls] }));
          // Also update legacy local state for compatibility
          set((state) => ({
            donorRecalls: [{
              recallId: 'REC-' + data.recall.recallId,
              donorId,
              recallDate: data.recall.recallDate,
              smsStatus: data.recall.smsStatus,
              donorResponse: null,
              processedBy
            }, ...state.donorRecalls]
          }));
          return data;
        } catch (e) {
          console.error('dispatchRecallSMS error:', e);
          throw e;
        }
      },

      dispatchBulkRecallSMS: async (donorIds, processedBy = null, { recallReason, smsMessage } = {}) => {
        try {
          const numericIds = donorIds.map(id => parseInt(String(id).replace(/^D0*/i, ''), 10));
          const data = await apiCreateBulkRecalls({
            donor_ids:     numericIds,
            recall_reason: recallReason ?? 'Critical Shortage Match',
            sms_message:   smsMessage   ?? undefined,
          });
          if (data.recalls) {
            set((state) => ({ recalls: [...data.recalls, ...state.recalls] }));
          }
          return data;
        } catch (e) {
          console.error('dispatchBulkRecallSMS error:', e);
          throw e;
        }
      },

      updateRecallResponse: async (recallId, donorResponse) => {
        try {
          const data = await apiUpdateRecallResponse(recallId, { donor_response: donorResponse });
          set((state) => ({
            recalls: state.recalls.map(r =>
              (r.recallId === recallId || r.recall_id === recallId)
                ? { ...r, donorResponse }
                : r
            ),
          }));
          return data;
        } catch (e) {
          console.error('updateRecallResponse error:', e);
          throw e;
        }
      },

      
      processComponentUnit: (data) => {
        const now = new Date();
        const processingId = 'PROC-' + Math.floor(1000 + Math.random() * 9000);
        
        let daysToAdd = 35;
        if (data.componentType === 'Platelet Concentrate') daysToAdd = 5;
        else if (data.componentType === 'FFP' || data.componentType === 'Cryoprecipitate' || data.componentType === 'Cryosupernate') daysToAdd = 365;

        const expDateObj = new Date();
        expDateObj.setDate(expDateObj.getDate() + daysToAdd);
        const expiryDate = expDateObj.toISOString().split('T')[0];

        const newLog = {
          processingId,
          unitRef: data.unitRef || ('WB-2026-' + Math.floor(1000 + Math.random() * 9000)),
          donorName: data.donorName || 'Anonymous Donor',
          bloodType: data.bloodType || 'O+',
          sourceVolume: parseInt(data.sourceVolume || 450, 10),
          componentType: data.componentType || 'PRBC',
          yieldVolume: parseInt(data.yieldVolume || 280, 10),
          processingMethod: data.processingMethod || 'Standard Centrifugation',
          processedBy: data.processedBy || 'Production Staff',
          processedAt: now.toLocaleString(),
          expiryDate,
          status: 'Completed'
        };

        const updatedInventory = (get().inventory || []).map(item => {
          if (item.type === newLog.bloodType) {
            return { ...item, units: item.units + 1 };
          }
          return item;
        });

        const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
        const newAuditLog = {
          logId: auditLogId,
          userId: get().authSystemUser?.id || 'USR-008',
          action: "Production Staff processed " + newLog.sourceVolume + "mL Whole Blood into " + newLog.componentType + " (" + newLog.yieldVolume + "mL) for type " + newLog.bloodType,
          module: 'Production Component Processing',
          recordId: processingId,
          oldValue: null,
          newValue: JSON.stringify(newLog),
          performedAt: now.toLocaleString()
        };

        set(state => ({
          componentProcessingLogs: [newLog, ...(state.componentProcessingLogs || [])],
          inventory: updatedInventory,
          auditLogs: [newAuditLog, ...(state.auditLogs || [])]
        }));

        return newLog;
      },

      resetMobilization: () => {
        set({ mobilizeFlowStep: 0, scanProgress: 0, scannedCount: 0, matchedCount: 0, criteriaChecked: 0, totalConfirmed: 12, currentPhase: 1, smsLogs: [] });
      }
    }),
    {
      name: 'bloodlink-dvo-store',
      version: 15,
      migrate: (persistedState) => {
        // v15: both inventory and bloodInventory are now DB-driven — wipe stale sample data
        return { ...persistedState, bloodInventory: [], inventory: [] };
      }
    }
  )
);
