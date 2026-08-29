import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const initialInventory = [
  // ── Sample Dataset: Blood Componentss ──
  { type: 'O+', units: 25, platelets: 180, ffp: 293, cryo: 113, cryosup: 51, threshold: 15, status: 'safe' },
  { type: 'A+', units: 9, platelets: 64, ffp: 160, cryo: 85, cryosup: 31, threshold: 10, status: 'low' },
  { type: 'B+', units: 9, platelets: 52, ffp: 140, cryo: 42, cryosup: 20, threshold: 10, status: 'low' },
  { type: 'AB+', units: 4, platelets: 25, ffp: 40, cryo: 8, cryosup: 4, threshold: 5, status: 'critical' },
  { type: 'O-', units: 4, platelets: 15, ffp: 0, cryo: 0, cryosup: 0, threshold: 5, status: 'critical' },
  { type: 'A-', units: 2, platelets: 10, ffp: 0, cryo: 1, cryosup: 0, threshold: 3, status: 'critical' },
  { type: 'B-', units: 1, platelets: 8, ffp: 1, cryo: 0, cryosup: 0, threshold: 3, status: 'critical' },
  { type: 'AB-', units: 1, platelets: 5, ffp: 0, cryo: 0, cryosup: 0, threshold: 2, status: 'critical' }
];

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
  { id: 'USR-006', name: 'Dr. Roberto Santos', role: 'Hospital User', email: 'hospital@bloodlink.dvo', status: 'Active', hospitalId: 'HOSP-001' }
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

const initialBloodInventory = [
  // O+ (25 units)
  ...Array.from({ length: 25 }, (_, i) => ({
    unitId: `BU-2026-O+-${String(i + 1).padStart(3, '0')}`,
    donationId: `DON-001`,
    bloodTypeId: 'O+',
    componentId: 'PRBC',
    collectionDate: '2026-03-10',
    expirationDate: '2026-04-21',
    quantity: 450,
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    inventoryStatus: 'Available',
    recordedBy: 'USR-004'
  })),
  // A+ (9 units)
  ...Array.from({ length: 9 }, (_, i) => ({
    unitId: `BU-2026-A+-${String(i + 1).padStart(3, '0')}`,
    donationId: `DON-002`,
    bloodTypeId: 'A+',
    componentId: 'PRBC',
    collectionDate: '2026-06-15',
    expirationDate: '2026-07-20',
    quantity: 450,
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    inventoryStatus: 'Available',
    recordedBy: 'USR-004'
  })),
  // B+ (9 units)
  ...Array.from({ length: 9 }, (_, i) => ({
    unitId: `BU-2026-B+-${String(i + 1).padStart(3, '0')}`,
    donationId: `DON-003`,
    bloodTypeId: 'B+',
    componentId: 'PRBC',
    collectionDate: '2026-05-20',
    expirationDate: '2026-06-25',
    quantity: 450,
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    inventoryStatus: 'Available',
    recordedBy: 'USR-004'
  })),
  // AB+ (4 units)
  ...Array.from({ length: 4 }, (_, i) => ({
    unitId: `BU-2026-AB+-${String(i + 1).padStart(3, '0')}`,
    donationId: `DON-001`,
    bloodTypeId: 'AB+',
    componentId: 'PRBC',
    collectionDate: '2026-04-05',
    expirationDate: '2026-05-10',
    quantity: 450,
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    inventoryStatus: 'Available',
    recordedBy: 'USR-004'
  })),
  // O- (4 units)
  ...Array.from({ length: 4 }, (_, i) => ({
    unitId: `BU-2026-O--${String(i + 1).padStart(3, '0')}`,
    donationId: `DON-001`,
    bloodTypeId: 'O-',
    componentId: 'PRBC',
    collectionDate: '2026-01-15',
    expirationDate: '2026-02-20',
    quantity: 450,
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    inventoryStatus: 'Available',
    recordedBy: 'USR-004'
  })),
  // A- (2 units)
  ...Array.from({ length: 2 }, (_, i) => ({
    unitId: `BU-2026-A--${String(i + 1).padStart(3, '0')}`,
    donationId: `DON-002`,
    bloodTypeId: 'A-',
    collectionDate: '2026-06-25',
    expirationDate: '2026-07-30',
    componentId: 'PRBC',
    quantity: 450,
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    inventoryStatus: 'Available',
    recordedBy: 'USR-004'
  })),
  // B- (1 unit)
  {
    unitId: 'BU-2026-B--001',
    donationId: 'DON-003',
    bloodTypeId: 'B-',
    componentId: 'PRBC',
    collectionDate: '2026-05-20',
    expirationDate: '2026-06-25',
    quantity: 450,
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    inventoryStatus: 'Available',
    recordedBy: 'USR-004'
  },
  // AB- (1 unit)
  {
    unitId: 'BU-2026-AB--001',
    donationId: 'DON-001',
    bloodTypeId: 'AB-',
    componentId: 'PRBC',
    collectionDate: '2026-04-05',
    expirationDate: '2026-05-10',
    quantity: 450,
    safetyStatus: 'Cleared',
    intendedUse: 'Transfusable',
    inventoryStatus: 'Available',
    recordedBy: 'USR-004'
  }
];

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
      recommendations: initialRecommendations,
      auditLogs: initialAuditLogs,
      donorRecalls: initialDonorRecalls,
      bloodIssuance: [],
      bloodIssuanceDetails: [],
      inventory: initialInventory,
      bloodRequests: initialRequests,
      hospitals: initialHospitals,
      users: initialUsers,
      forecastData: initialForecastData,
      granularForecasts: [], // Seeded by generateGranularForecast on first call
      distributionLog: initialDistributionLog,
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
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
      loginSystemUser: (email) => {
        const emailLower = email.toLowerCase();
        const found = get().users.find(u => u.email.toLowerCase() === emailLower);
        if (found) {
          set({ authSystemUser: found });
          return found;
        }
        // Fallback for demo flexibility
        let user = null;
        if (emailLower.includes('superadmin')) {
          user = { id: 'USR-001', name: 'DOH Super Admin', role: 'Super Admin', email: 'superadmin@bloodlink.dvo', hospitalId: null };
        } else if (emailLower.includes('admin')) {
          user = { id: 'USR-002', name: 'DOH Medical Officer IV', role: 'Administrator', email: 'admin@bloodlink.dvo', hospitalId: null };
        } else if (emailLower.includes('registry')) {
          user = { id: 'USR-003', name: 'Nurse Joy Cruz', role: 'Registry Staff', email: 'registry@bloodlink.dvo', hospitalId: null };
        } else if (emailLower.includes('bloodbank') || emailLower.includes('bank')) {
          user = { id: 'USR-004', name: 'RMT Mark Lopez', role: 'Blood Bank Staff', email: 'bloodbank@bloodlink.dvo', hospitalId: null };
        } else if (emailLower.includes('issuance')) {
          user = { id: 'USR-005', name: 'SNBC Issuance Officer', role: 'Issuance Personnel', email: 'issuance@bloodlink.dvo', hospitalId: null };
        } else if (emailLower.includes('hospital') || emailLower.includes('spmc')) {
          user = { id: 'USR-006', name: 'Dr. Roberto Santos', role: 'Hospital User', email: 'hospital@bloodlink.dvo', hospitalId: 'HOSP-001' };
        }
        if (user) {
          set({ authSystemUser: user });
          return user;
        }
        return null;
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
      addHospital: (form) => {
        const id = 'HOSP-' + String(Date.now()).slice(-4);
        const newHospital = { id, ...form };
        set((state) => ({ hospitals: [...state.hospitals, newHospital] }));
      },

      updateHospital: (id, form) => {
        set((state) => ({
          hospitals: state.hospitals.map(h => h.id === id ? { ...h, ...form } : h)
        }));
      },

      deleteHospital: (id) => {
        set((state) => ({
          hospitals: state.hospitals.filter(h => h.id !== id)
        }));
      },

      // ─── Registry Operations ─────────────────────────────────────────────
      addDonor: (newDonor) => {
        set((state) => ({ donors: [newDonor, ...state.donors] }));
      },

      addDonationEvent: (eventForm) => {
        const eventId = 'EVT-' + Math.floor(100 + Math.random() * 900);
        const newEvent = {
          eventId: eventId,
          event_id: eventId,
          province: eventForm.province || '',
          cityMunicipality: eventForm.cityMunicipality || '',
          city_municipality: eventForm.cityMunicipality || '',
          barangayOrganization: eventForm.barangayOrganization || '',
          barangay_organization: eventForm.barangayOrganization || '',
          eventDate: eventForm.eventDate || '',
          event_date: eventForm.eventDate || '',
          createdAt: new Date().toLocaleString(),
          created_at: new Date().toLocaleString()
        };
        set((state) => ({
          donationEvents: [...state.donationEvents, newEvent],
          auditLogs: [{
            logId: 'LOG-' + Math.floor(100 + Math.random() * 900),
            userId: state.authSystemUser?.id || 'USR-001',
            action: `Added Donation Event: ${newEvent.barangayOrganization} (${newEvent.eventDate})`,
            module: 'Donation Events',
            recordId: eventId,
            oldValue: null,
            newValue: JSON.stringify(newEvent),
            performedAt: new Date().toLocaleString()
          }, ...state.auditLogs]
        }));
        return newEvent;
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
      generateGranularForecast: (weeksAhead = 4) => {
        const { hospitals, inventory } = get();
        const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
        const COMPONENTS = ['PRBC', 'Platelet Concentrate', 'FFP', 'Cryoprecipitate', 'Cryosupernate'];

        const BASE_WEEK = new Date('2026-05-05');

        // ── Matrix helper functions ─────────────────────────────────────────
        const matTranspose = (M) => {
          const rows = M.length, cols = M[0].length;
          const R = Array.from({ length: cols }, () => Array(rows).fill(0));
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
              R[c][r] = M[r][c];
          return R;
        };

        const matMultiply = (A, B) => {
          const rA = A.length, cA = A[0].length, cB = B[0].length;
          const R = Array.from({ length: rA }, () => Array(cB).fill(0));
          for (let r = 0; r < rA; r++)
            for (let c = 0; c < cB; c++)
              for (let k = 0; k < cA; k++)
                R[r][c] += A[r][k] * B[k][c];
          return R;
        };

        const matInvert = (M) => {
          const n = M.length;
          const A = M.map(row => [...row]);
          const I = Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
          );
          for (let i = 0; i < n; i++) {
            let maxEl = Math.abs(A[i][i]), maxRow = i;
            for (let k = i + 1; k < n; k++)
              if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; }
            [A[i], A[maxRow]] = [A[maxRow], A[i]];
            [I[i], I[maxRow]] = [I[maxRow], I[i]];
            const d = A[i][i] || 1e-12;
            for (let k = 0; k < n; k++) { A[i][k] /= d; I[i][k] /= d; }
            for (let h = 0; h < n; h++) {
              if (h !== i) {
                const f = A[h][i];
                for (let k = 0; k < n; k++) { A[h][k] -= f * A[i][k]; I[h][k] -= f * I[i][k]; }
              }
            }
          }
          return I;
        };

        // ── Step 1: Build GLOBAL observation dataset ────────────────────────
        // Each row: [hospScale, compWeight, rarityFactor, weekIdx] → actual demand
        const RARITY = { 'O+': 1.0, 'A+': 0.8, 'B+': 0.7, 'AB+': 0.3, 'O-': 0.6, 'A-': 0.4, 'B-': 0.2, 'AB-': 0.1 };
        const COMP_W = { 'PRBC': 1.0, 'Platelet Concentrate': 0.6, 'FFP': 0.5, 'Cryoprecipitate': 0.3, 'Cryosupernate': 0.2 };
        const HOSP_S = { 'Government': 1.5, 'Blood Bank': 1.2 };

        // Collect all groups' historical data
        const groups = [];
        hospitals.forEach(hosp => {
          BLOOD_TYPES.forEach(bt => {
            const inv = inventory.find(i => i.type === bt);
            if (!inv) return;
            COMPONENTS.forEach(comp => {
              const rarityFactor = RARITY[bt] || 0.5;
              const compFactor = COMP_W[comp] || 0.5;
              const hospFactor = HOSP_S[hosp.type] || 1.0;
              const baseDemand = Math.round(8 * rarityFactor * compFactor * hospFactor);
              if (baseDemand === 0) return;

              const hospScale = HOSP_S[hosp.type] || 1.0;
              const compWeight = COMP_W[comp] || 0.5;

              const historicalWeeks = [];
              for (let w = 0; w < 8; w++) {
                const weekDate = new Date(BASE_WEEK);
                weekDate.setDate(weekDate.getDate() + w * 7);
                const noise = Math.round((Math.random() - 0.4) * baseDemand * 0.3);
                historicalWeeks.push({
                  week: w,
                  date: weekDate.toISOString().slice(0, 10),
                  actual: Math.max(0, baseDemand + noise)
                });
              }

              groups.push({ hosp, bt, comp, hospScale, compWeight, historicalWeeks });
            });
          });
        });

        // ── Step 2: Build GLOBAL X and Y matrices (across ALL groups × weeks) ──
        // X columns: [1 (intercept), weekIdx, hospScale, compWeight]
        // This ensures X2 and X3 vary across rows → X^T X is non-singular
        const globalX = [];
        const globalY = [];
        groups.forEach(({ hospScale, compWeight, historicalWeeks }) => {
          historicalWeeks.forEach(({ week, actual }) => {
            globalX.push([1, week, hospScale, compWeight]);
            globalY.push([actual]);
          });
        });

        // ── Step 3: Solve global MLR: beta = (X^T X)^-1 X^T Y ──────────────
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
        try {
          const XT = matTranspose(globalX);
          const XTX = matMultiply(XT, globalX);
          const XTXinv = matInvert(XTX);
          const XTY = matMultiply(XT, globalY);
          const beta = matMultiply(XTXinv, XTY);
          b0 = isFinite(beta[0][0]) ? beta[0][0] : 0;
          b1 = isFinite(beta[1][0]) ? beta[1][0] : 0;
          b2 = isFinite(beta[2][0]) ? beta[2][0] : 0;
          b3 = isFinite(beta[3][0]) ? beta[3][0] : 0;
        } catch (_) {
          // Fallback: coefficients remain 0, predictions rely on MA4 only
        }

        // ── Step 4: Generate predictions per group ───────────────────────────
        const results = [];
        let forecastIdSeq = 1;

        groups.forEach(({ hosp, bt, comp, hospScale, compWeight, historicalWeeks }) => {
          // MA4 on last 4 weeks for smoothing
          const maLast = historicalWeeks.slice(-4)
            .reduce((sum, w) => sum + w.actual, 0) / 4;

          for (let i = 1; i <= weeksAhead; i++) {
            const weekDate = new Date(BASE_WEEK);
            weekDate.setDate(weekDate.getDate() + (8 + i - 1) * 7);

            // MLR prediction: y = b0 + b1*weekIdx + b2*hospScale + b3*compWeight
            const weekIdx = 8 + i - 1;
            const mlrPred = b0 + b1 * weekIdx + b2 * hospScale + b3 * compWeight;
            // Blend MLR (70%) with MA4 (30%) for stability
            const predicted = Math.max(0, Math.round(0.7 * mlrPred + 0.3 * maLast));
            const margin = Math.max(1, Math.round(predicted * 0.08));

            results.push({
              forecastId: forecastIdSeq++,
              hospitalId: hosp.id,
              hospitalName: hosp.name,
              bloodTypeId: bt,
              componentId: comp,
              forecastWeek: weekDate.toISOString().slice(0, 10),
              forecastWeekLabel: `Wk ${8 + i}`,
              predictedDemand: predicted,
              upperBound: predicted + margin,
              lowerBound: Math.max(0, predicted - margin),
              generatedAt: new Date().toISOString(),
              historicalWeeks,
              mlrCoefficients: { b0: +b0.toFixed(3), b1: +b1.toFixed(3), b2: +b2.toFixed(3), b3: +b3.toFixed(3) },
              maLast: +maLast.toFixed(1),
              weeksAhead: i,
            });
          }
        });

        set({ granularForecasts: results });
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

      updateDonorMedical: (id, medicalForm) => {
        set((state) => {
          const donationId = 'DON-' + Math.floor(100 + Math.random() * 900);
          const testId = 'LAB-' + Math.floor(100 + Math.random() * 900);

          const newDonation = {
            donationId,
            donorId: id,
            eventId: medicalForm.eventId || 'EVT-001',
            bloodTypeId: medicalForm.bloodType || 'O+',
            donationDate: medicalForm.donationDate || new Date().toISOString().slice(0, 10),
            screeningOutcome: medicalForm.screeningOutcome || 'Accepted',
            deferralReason: medicalForm.deferralReason || '',
            deferralEndDate: medicalForm.deferralEndDate || ''
          };

          const newLabResult = {
            testId,
            donationId,
            hemoglobinResult: medicalForm.hemoglobinResult || '14.5',
            bloodTypeConfirmed: medicalForm.bloodType || 'O+',
            hbsagResult: medicalForm.hbsagResult || 'Non-Reactive',
            syphilisResult: medicalForm.syphilisResult || 'Non-Reactive',
            hivResult: medicalForm.hivResult || 'Non-Reactive',
            hcvResult: medicalForm.hcvResult || 'Non-Reactive',
            malariaResult: medicalForm.malariaResult || 'Non-Reactive',
            natResult: medicalForm.natResult || 'Non-Reactive',
            othersResult: '',
            recordedBy: state.authSystemUser?.id || 'USR-003'
          };

          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          const newAuditLog = {
            logId: auditLogId,
            userId: state.authSystemUser?.id || 'USR-003',
            action: `Recorded Onsite Screening Outcome for donor ${id}`,
            module: 'Registry',
            recordId: id,
            oldValue: JSON.stringify(state.donors.find(d => d.id === id) || null),
            newValue: JSON.stringify(medicalForm),
            performedAt: new Date().toLocaleString()
          };

          const updatedDonors = state.donors.map(d => d.id === id ? { ...d, ...medicalForm } : d);

          return {
            donors: updatedDonors,
            donations: [newDonation, ...state.donations],
            labTestResults: [newLabResult, ...state.labTestResults],
            auditLogs: [newAuditLog, ...state.auditLogs]
          };
        });
      },

      addLabTestResult: (labForm) => {
        set((state) => {
          const testId = 'LAB-' + Math.floor(100 + Math.random() * 900);
          const newLabResult = {
            testId,
            donationId: labForm.donationId || '',
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

          // Update corresponding donor's bloodType if linked
          const donation = state.donations.find(d => d.donationId === labForm.donationId);
          let updatedDonors = state.donors;
          if (donation) {
            updatedDonors = state.donors.map(d =>
              d.id === donation.donorId
                ? { ...d, bloodType: labForm.bloodTypeConfirmed }
                : d
            );
          }

          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          const newAuditLog = {
            logId: auditLogId,
            userId: state.authSystemUser?.id || 'USR-003',
            action: `Encoded Laboratory Test Results for test ${testId}`,
            module: 'Laboratory',
            recordId: testId,
            oldValue: null,
            newValue: JSON.stringify(newLabResult),
            performedAt: new Date().toLocaleString()
          };

          return {
            labTestResults: [newLabResult, ...state.labTestResults],
            donors: updatedDonors,
            auditLogs: [newAuditLog, ...state.auditLogs]
          };
        });
      },

      addUser: (userForm) => {
        const id = 'USR-' + String(Math.floor(Math.random() * 900) + 100);
        const now = new Date();

        set((state) => {
          let finalFirstName = userForm.firstName || '';
          let finalLastName = userForm.lastName || '';
          let finalEmail = userForm.email || '';
          let finalContactNumber = userForm.contactNumber || '';

          // If Hospital User, fetch hospital details and auto-approve the hospital
          let updatedHospitals = state.hospitals;
          if (userForm.role === 'Hospital User' && userForm.hospitalId) {
            const targetHosp = state.hospitals.find(h => h.id === userForm.hospitalId);
            if (targetHosp) {
              const nameParts = (targetHosp.contact || 'Hospital Admin').split(' ');
              finalFirstName = nameParts[0] || 'Hospital';
              finalLastName = nameParts.slice(1).join(' ') || 'Admin';
              finalEmail = targetHosp.email || finalEmail;
              finalContactNumber = targetHosp.phone || finalContactNumber;

              // Automatically mark the affiliated hospital as Active
              updatedHospitals = state.hospitals.map(h =>
                h.id === userForm.hospitalId ? { ...h, registrationStatus: 'Active' } : h
              );
            }
          }

          const newUser = {
            id,
            roleId: userForm.roleId || null,
            firstName: finalFirstName,
            lastName: finalLastName,
            name: `${finalFirstName} ${finalLastName}`.trim(),
            email: finalEmail,
            passwordHash: userForm.passwordHash || '••••••••',
            contactNumber: finalContactNumber,
            status: userForm.status || 'Active',
            role: userForm.role || 'Registry Staff',
            hospitalId: userForm.hospitalId || null,
            createdAt: now.toLocaleString(),
            updatedAt: now.toLocaleString()
          };

          return {
            users: [...state.users, newUser],
            hospitals: updatedHospitals,
            auditLogs: [{
              logId: 'LOG-' + Math.floor(100 + Math.random() * 900),
              userId: state.authSystemUser?.id || 'USR-001',
              action: `Created new system user ${newUser.name} (${newUser.role})`,
              module: 'User Management',
              recordId: id,
              oldValue: null,
              newValue: JSON.stringify({ id, role: newUser.role, email: newUser.email }),
              performedAt: now.toLocaleString()
            }, ...state.auditLogs]
          };
        });
      },

      updateUser: (userId, updatedFields) => {
        const now = new Date();
        set((state) => {
          const roleMap = { 'Super Admin': 'ROLE-001', 'Administrator': 'ROLE-002', 'Registry Staff': 'ROLE-003', 'Blood Bank Staff': 'ROLE-004', 'Issuance Personnel': 'ROLE-005', 'Hospital User': 'ROLE-006' };
          const updatedUsers = state.users.map(u => {
            if (u.id !== userId) return u;
            const firstName = updatedFields.firstName ?? u.firstName;
            const lastName = updatedFields.lastName ?? u.lastName;
            const role = updatedFields.role ?? u.role;
            return {
              ...u,
              firstName,
              lastName,
              name: `${firstName} ${lastName}`.trim(),
              email: updatedFields.email ?? u.email,
              contactNumber: updatedFields.contactNumber ?? u.contactNumber,
              role,
              roleId: roleMap[role] ?? u.roleId,
              status: updatedFields.status ?? u.status,
              updatedAt: now.toLocaleString(),
            };
          });
          const targetUser = updatedUsers.find(u => u.id === userId);
          return {
            users: updatedUsers,
            auditLogs: [{
              logId: 'LOG-' + Math.floor(100 + Math.random() * 900),
              userId: state.authSystemUser?.id || 'USR-001',
              action: `Updated system user ${targetUser?.name} (${targetUser?.role})`,
              module: 'User Management',
              recordId: userId,
              oldValue: null,
              newValue: JSON.stringify({ role: targetUser?.role, email: targetUser?.email, status: targetUser?.status }),
              performedAt: now.toLocaleString()
            }, ...state.auditLogs]
          };
        });
      },

      // ─── Blood Requests ─────────────────────────────────────────────────
      addBloodRequest: (reqForm) => {
        const refNo = 'REQ-' + Math.floor(1000 + Math.random() * 9000);
        const dateString = new Date().toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const newRequest = {
          refNo,
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
          items: reqForm.items || [], // Array of { bloodType, component, units }
          filedByIssuance: reqForm.filedByIssuance || false, // true if filed by Issuance Personnel
          filedBy: reqForm.filedBy || null, // name of the issuance officer who filed it
        };
        set((state) => ({ bloodRequests: [newRequest, ...state.bloodRequests] }));
        return refNo;
      },

      updateBloodRequestStatus: (refNo, status, statusNote = '') => {
        set((state) => ({
          bloodRequests: state.bloodRequests.map((req) =>
            req.refNo === refNo ? { ...req, status, statusNote } : req
          )
        }));
      },

      rejectRequest: (refNo) => {
        set((state) => ({
          bloodRequests: state.bloodRequests.map(req => req.refNo === refNo ? { ...req, status: 'Rejected' } : req)
        }));
      },

      verifyRequest: (refNo) => {
        set((state) => {
          const req = state.bloodRequests.find(r => r.refNo === refNo);
          if (!req) return state;

          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          const newAuditLog = {
            logId: auditLogId,
            userId: state.authSystemUser?.id || 'USR-005',
            action: `Verified Request ${refNo} for ${req.hospital} (Sent to Blood Bank)`,
            module: 'Issuance',
            recordId: refNo,
            oldValue: 'Pending Verification',
            newValue: 'Verified',
            performedAt: new Date().toLocaleString()
          };

          return {
            bloodRequests: state.bloodRequests.map(r => r.refNo === refNo ? { ...r, status: 'Verified' } : r),
            auditLogs: [newAuditLog, ...state.auditLogs]
          };
        });
      },

      approveRequest: (refNo) => {
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

      recordBloodUnit: (unitForm) => {
        set((state) => {
          let assignedUnitId = (unitForm.unitId || unitForm.unitRefId || '').trim();
          if (!assignedUnitId) {
            const existingIds = state.bloodInventory.map(u => {
              const numeric = parseInt(String(u.unitId).replace(/\D/g, ''), 10);
              return isNaN(numeric) ? 0 : numeric;
            });
            const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            assignedUnitId = `BU-2026-${String(nextNum).padStart(3, '0')}`;
          }

          const newUnit = {
            unitId: assignedUnitId,
            donationId: unitForm.donationId || ('DON-' + Math.floor(100 + Math.random() * 900)),
            bloodTypeId: unitForm.bloodType || 'O+',
            componentId: unitForm.component || 'PRBC',
            collectionDate: unitForm.collectionDate || new Date().toISOString().slice(0, 10),
            expirationDate: unitForm.expirationDate || new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            quantity: parseFloat(unitForm.quantity) || 450,
            safetyStatus: unitForm.safetyStatus || 'Cleared',
            intendedUse: unitForm.intendedUse || 'Transfusable',
            inventoryStatus: unitForm.inventoryStatus || 'Available',
            recordedBy: state.authSystemUser?.id || 'USR-004',
            updatedAt: new Date().toLocaleString()
          };

          const newInventory = state.inventory.map(item => {
            if (item.type === newUnit.bloodTypeId && newUnit.safetyStatus === 'Cleared' && newUnit.intendedUse === 'Transfusable') {
              const componentKey = {
                'PRBC': 'units',
                'Platelet Concentrate': 'platelets',
                'FFP': 'ffp',
                'Cryoprecipitate': 'cryo',
                'Cryosupernate': 'cryosup'
              }[newUnit.componentId];
              if (componentKey) {
                const newTotal = (item[componentKey] || 0) + 1;
                const status = (componentKey === 'units' ? newTotal : item.units) < item.threshold ? 'critical' : (componentKey === 'units' ? newTotal : item.units) === item.threshold ? 'low' : 'safe';
                return { ...item, [componentKey]: newTotal, status };
              }
            }
            return item;
          });

          const auditLogId = 'LOG-' + Math.floor(100 + Math.random() * 900);
          const newAuditLog = {
            logId: auditLogId,
            userId: state.authSystemUser?.id || 'USR-004',
            action: `Recorded Blood Unit ${newUnit.unitId} (${newUnit.componentId}, ${newUnit.bloodTypeId})`,
            module: 'Blood Bank',
            recordId: newUnit.unitId,
            oldValue: null,
            newValue: JSON.stringify(newUnit),
            performedAt: new Date().toLocaleString()
          };

          return {
            bloodInventory: [newUnit, ...state.bloodInventory],
            inventory: newInventory,
            auditLogs: [newAuditLog, ...state.auditLogs]
          };
        });
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

      dispatchRecallSMS: (donorId, processedBy = null) => {
        set((state) => {
          const recallId = 'REC-L' + Math.floor(100 + Math.random() * 900);
          const newRecall = {
            recallId,
            donorId,
            recallDate: new Date().toISOString().split('T')[0],
            smsStatus: 'Sent',
            donorResponse: null,
            processedBy
          };
          return { donorRecalls: [newRecall, ...state.donorRecalls] };
        });
      },

      resetMobilization: () => {
        set({ mobilizeFlowStep: 0, scanProgress: 0, scannedCount: 0, matchedCount: 0, criteriaChecked: 0, totalConfirmed: 12, currentPhase: 1, smsLogs: [] });
      }
    }),
    {
      name: 'bloodlink-dvo-store',
      version: 10,
      migrate: () => {
        return undefined;
      }
    }
  )
);
