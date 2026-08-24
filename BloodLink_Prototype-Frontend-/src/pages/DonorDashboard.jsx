import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBloodStore } from '../store/useBloodStore';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Heart, 
  User, 
  LogOut, 
  AlertTriangle, 
  Info, 
  MapPin, 
  Activity, 
  Calendar, 
  History, 
  Building2, 
  Bell, 
  FileText,
  Award,
  CheckCircle2,
  Clock,
  ChevronRight,
  Phone,
  Compass
} from 'lucide-react';

export default function DonorDashboard() {
  const navigate = useNavigate();
  
  // Zustand State
  const donors = useBloodStore((state) => state.donors);
  const currentUser = useBloodStore((state) => state.currentUser);
  const inventory = useBloodStore((state) => state.inventory);
  const bloodRequests = useBloodStore((state) => state.bloodRequests);
  const addBloodRequest = useBloodStore((state) => state.addBloodRequest);
  const accountFlagged = useBloodStore((state) => state.accountFlagged);
  const arrivedAtFacility = useBloodStore((state) => state.arrivedAtFacility);
  const mobilizeFlowStep = useBloodStore((state) => state.mobilizeFlowStep);
  const resetMobilization = useBloodStore((state) => state.resetMobilization);

  // Local UI State
  const [tab, setTab] = useState('overview');
  const [showAlert, setShowAlert] = useState(true);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [lastRefNo, setLastRefNo] = useState('');
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Form State
  const [reqForm, setReqForm] = useState({
    patientName: '',
    patientAge: '',
    patientBloodType: '',
    units: '',
    diagnosis: '',
    hospital: '',
    physician: '',
    ward: '',
    hospitalRefNo: '',
    bloodCenter: '',
    urgency: '',
    dateNeeded: '',
    contactPerson: currentUser?.name || '',
    contactNumber: currentUser?.phone || '',
    notes: ''
  });

  // Check if current user has active request
  const myRequests = bloodRequests.filter(
    (r) => r.contactNumber === currentUser?.phone || r.contactPerson === currentUser?.name
  );
  const hasActiveRequest = myRequests.some(
    (r) => r.status === 'Pending' || r.status === 'Processing'
  );

  // Eligibility Math
  const getEligibilityStatus = () => {
    if (!currentUser?.lastDonation) {
      return { eligible: true, days: 125, title: 'Ready to Donate', message: 'You meet all eligibility criteria.' };
    }
    const days = Math.floor((new Date() - new Date(currentUser.lastDonation)) / (1000 * 60 * 60 * 24));
    if (days >= 90) {
      return {
        eligible: true,
        days,
        title: 'Ready to Donate',
        message: `${days} days since last donation — you meet the 90-day requirement.`
      };
    }
    const ready = new Date(new Date(currentUser.lastDonation).getTime() + 90 * 24 * 60 * 60 * 1000);
    return {
      eligible: false,
      days,
      title: 'Not Yet Eligible',
      message: `You can donate again on ${ready.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}.`
    };
  };

  const eligibility = getEligibilityStatus();

  // Mock donation activity data for Chart
  const chartData = [
    { name: 'Nov 23', units: 1 },
    { name: 'Mar 24', units: 2 },
    { name: 'Jul 24', units: 3 },
    { name: 'Nov 24', units: 4 },
    { name: 'Mar 25', units: 5 },
    { name: 'Jul 25', units: 6 },
    { name: 'Nov 25', units: 7 }
  ];

  // Donation history matching mock data
  const donationHistory = [
    { date: 'November 14, 2025', facility: 'SPMC Blood Production Services', trigger: 'BloodLink DVO Alert' },
    { date: 'July 10, 2025', facility: 'Philippine Red Cross – Davao Chapter', trigger: 'Routine Donation' },
    { date: 'March 05, 2025', facility: 'SPMC Blood Production Services', trigger: 'BloodLink DVO Alert' },
    { date: 'November 12, 2024', facility: 'SPMC Blood Production Services', trigger: 'Routine Donation' },
    { date: 'July 14, 2024', facility: 'Philippine Red Cross – Davao Chapter', fill: 'BloodLink DVO Alert', trigger: 'BloodLink DVO Alert' },
    { date: 'March 10, 2024', facility: 'SNBC – Mindanao (DOH-Davao)', trigger: 'Routine Donation' },
    { date: 'November 05, 2023', facility: 'SPMC Blood Production Services', trigger: 'First-time Donation' }
  ];

  const bloodCenters = [
    { name: 'SPMC Blood Production Services', address: 'JP Laurel Ave, Bajada · Open 24/7', distance: '1.2 km', hours: '24/7', phone: '(082) 227-2731', urgent: true },
    { name: 'Philippine Red Cross – Davao Chapter', address: 'Roxas Ave, Davao City · 8:00 AM - 5:00 PM', distance: '3.4 km', hours: '8 AM - 5 PM', phone: '(082) 221-2131', urgent: false },
    { name: 'SNBC – Mindanao (DOH-Davao)', address: 'DOH Compound, Bajada · 8:00 AM - 5:00 PM', distance: '1.5 km', hours: '8 AM - 5 PM', phone: '(082) 300-1122', urgent: false }
  ];

  const alertHistory = [
    { title: 'Urgent: O- Blood Needed at SPMC', date: 'Today, 9:41 AM', message: 'Hi Maria! O- blood is critically needed at SPMC Blood Production Services. You last donated 4 months ago and are eligible. Please visit as soon as possible.', response: mobilizeFlowStep >= 2 ? 'Donated' : 'Awaiting', type: 'shortage' },
    { title: 'Re-Eligibility Alert', date: 'Feb 12, 2026', message: 'Hello Maria. Your 90-day donation interval is complete! You are now eligible to donate blood again. Thank you for saving lives.', response: 'Re-Eligibility', type: 'eligible' },
    { title: 'Urgent: O- Blood Needed at SPMC', date: 'Nov 14, 2025', message: 'O- blood critically low. Eligible donors needed at SPMC.', response: 'Donated', type: 'shortage' }
  ];

  // Map Initialization
  useEffect(() => {
    if (tab === 'overview' && mapRef.current) {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([7.0731, 125.6128], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const spmcIcon = L.divIcon({
        className: 'custom-icon-spmc',
        html: `<div style="background-color: #C21C24; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker([7.0731, 125.6128], { icon: spmcIcon })
        .bindPopup('<b>SPMC Blood Production Services</b><br>JP Laurel Ave, Bajada')
        .addTo(map);

      const donorIcon = L.divIcon({
        className: 'custom-icon-donor',
        html: `<div style="background-color: #475569; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([7.0822, 125.6210], { icon: donorIcon })
        .bindPopup('<b>Your Approximate Location</b><br>Brgy. Buhangin')
        .addTo(map);

      L.polyline([[7.0822, 125.6210], [7.0731, 125.6128]], {
        color: '#C21C24',
        weight: 1.5,
        dashArray: '4,4'
      }).addTo(map);

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [tab]);

  const submitRequest = () => {
    const ref = addBloodRequest(reqForm);
    setLastRefNo(ref);
    setRequestSubmitted(true);
    setReqForm({
      patientName: '',
      patientAge: '',
      patientBloodType: '',
      units: '',
      diagnosis: '',
      hospital: '',
      physician: '',
      ward: '',
      hospitalRefNo: '',
      bloodCenter: '',
      urgency: '',
      dateNeeded: '',
      contactPerson: currentUser?.name || '',
      contactNumber: currentUser?.phone || '',
      notes: ''
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={bloodlinkLogo} alt="Logo" className="h-full max-w-none object-cover object-left" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight">BloodLink</span>
              <span className="font-medium text-xs text-[#C21C24] ml-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded">DVO</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-slate-900 font-bold text-sm">{currentUser?.name || 'Maria Santos'}</p>
              <p className="text-slate-400 text-xs font-semibold">{currentUser?.id || 'BLD-482931'}</p>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <Link to="/" className="text-slate-500 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-6">
        
        {/* Profile Card & Alerts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left: Premium Profile Details Card */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-2xl font-black text-[#C21C24] tracking-tight">{currentUser?.bloodType || 'O-'}</span>
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[#C21C24] font-bold uppercase tracking-wider bg-rose-50 border border-rose-100 rounded px-2 py-0.5">
                  {currentUser?.bloodType === 'O-' ? 'Universal Donor' : 'Compatible Recipient'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2 leading-tight">
                  {currentUser?.bloodType === 'O-' ? 'O Negative Pool' : `${currentUser?.bloodType} Positive`}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">ID: {currentUser?.id || 'BLD-482931'}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Status</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 ${eligibility.eligible ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${eligibility.eligible ? 'bg-emerald-500 pulse-green' : 'bg-slate-350'}`}></span>
                  {eligibility.eligible ? 'Active & Ready' : 'In Recovery'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Donations</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{currentUser?.totalDonations || 7}</p>
              </div>
            </div>
          </div>

          {/* Right: Urgent Alert Panel (Soft warning design, not glaring) */}
          <div className="lg:col-span-2">
            {showAlert && mobilizeFlowStep > 0 && mobilizeFlowStep < 4 ? (
              <div className="bg-white border-2 border-rose-200 rounded-xl p-6 shadow-sm h-full flex flex-col justify-between transition-all">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center flex-shrink-0 text-[#C21C24]">
                    <Bell className="w-5 h-5 pulse-dot" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 tracking-tight">Active Emergency Shortage Match</h3>
                      <span className="text-[10px] text-slate-400 font-semibold">Received just now</span>
                    </div>
                    <p className="text-xs text-slate-650 mt-1 leading-relaxed">
                      SPMC Blood Production Services requires <strong className="text-[#C21C24]">O- Blood</strong> immediately. You are mapped as the nearest eligible matched donor (<strong className="text-slate-800">1.2 km away</strong>).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => navigate('/donor/notification')} 
                    className="flex-1 bg-[#C21C24] text-white py-2 px-4 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Accept Mobilization Alert</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setShowAlert(false)} className="border border-slate-200 text-slate-650 hover:bg-slate-50 py-2 px-4 rounded-lg text-xs font-bold transition-all">
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full flex items-center justify-center text-center">
                <div className="max-w-sm">
                  <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1">No Active Emergencies</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Davao City blood supplies are currently stable for your blood type. You will receive an SMS immediately if a matching urgent need arises.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Total Donations</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{currentUser?.totalDonations || 7}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Alerts Answered</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{currentUser?.alertsResponded || 4}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
              <Heart className="w-4 h-4 text-[#C21C24]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Lives Saved</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{(currentUser?.totalDonations || 7) * 3}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Last Donated</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{eligibility.days}d ago</p>
            </div>
          </div>
        </div>

        {/* Sleek Sub Navigation Tabs */}
        <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {[
            { id: 'overview', label: 'Overview', icon: Compass },
            { id: 'eligibility', label: 'Interval Status', icon: Calendar },
            { id: 'history', label: 'Donation History', icon: History },
            { id: 'centers', label: 'Blood Centers', icon: Building2 },
            { id: 'alerts', label: 'Alert History', icon: Bell },
            { id: 'request', label: 'Request Blood Referral', icon: FileText }
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`py-3.5 px-4 font-semibold text-xs tracking-tight transition-all border-b-2 flex items-center gap-2 flex-shrink-0 ${
                  tab === t.id 
                    ? 'border-[#C21C24] text-[#C21C24] font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB: OVERVIEW */}
        {tab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6 fade-in">
            
            {/* Eligibility Ring Panel */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-4 tracking-tight">Active Mobilization Clearance</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-28 h-28 ring-progress" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#F1F5F9" strokeWidth="8"/>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray="314" strokeDashoffset="0" strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-slate-900">100%</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Cleared</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs flex-1 text-slate-650">
                    <div className="flex justify-between border-b border-slate-50 pb-1"><span>Last Donation</span><span className="font-semibold text-slate-900">{currentUser?.lastDonation || 'Nov 14, 2025'}</span></div>
                    <div className="flex justify-between border-b border-slate-50 pb-1"><span>Recovery Time</span><span className="font-semibold text-emerald-600">{eligibility.days} days ✓</span></div>
                    <div className="flex justify-between border-b border-slate-50 pb-1"><span>Target Lock</span><span className="font-semibold">90 days</span></div>
                    <div className="flex justify-between"><span>Status</span><span className="font-bold text-emerald-600">Eligible</span></div>
                  </div>
                </div>
              </div>
              
              {mobilizeFlowStep > 0 && mobilizeFlowStep < 4 && (
                <button 
                  onClick={() => navigate('/donor/notification')} 
                  className="w-full mt-6 bg-[#C21C24] text-white text-center py-2.5 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all shadow-sm"
                >
                  Respond to Active Shortage →
                </button>
              )}
            </div>

            {/* Map Panel */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Nearest Dispatch Center</h3>
                <span className="text-xs font-bold text-[#C21C24] bg-rose-50 border border-rose-100 rounded px-2 py-0.5">SPMC Bajada · 1.2 km away</span>
              </div>
              <div ref={mapRef} id="miniMap" className="mb-4 rounded-lg overflow-hidden border border-slate-200"></div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> JP Laurel Ave, Davao City</span>
                <span className="font-bold text-slate-700">Estimated Transit: 5 mins</span>
              </div>
            </div>

            {/* Activity Chart Card */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 tracking-tight">Units Donated Frequency (2024–2025)</h3>
              <div style={{ height: '200px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} domain={[0, 8]} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="units" stroke="#C21C24" fill="rgba(194, 28, 36, 0.04)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* TAB: ELIGIBILITY */}
        {tab === 'eligibility' && (
          <div className="grid md:grid-cols-2 gap-6 fade-in">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 tracking-tight">90-Day Interval Validation</h3>
              <div className="space-y-3.5 text-xs text-slate-650">
                <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-400">Last Donation Date</span><span className="font-bold text-slate-800">{currentUser?.lastDonation || 'November 14, 2025'}</span></div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-400">Facility</span><span className="font-bold text-slate-800">SPMC Blood Production Services</span></div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-400">Days Elapsed</span><span className="font-extrabold text-emerald-600 text-sm">{eligibility.days} days</span></div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-400">Safety Threshold</span><span className="font-bold text-slate-800">90 days (Whole Blood)</span></div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-400">Surplus Rest Time</span><span className="font-semibold text-emerald-600">+{eligibility.days - 90} days clear</span></div>
                <div className="flex justify-between items-center py-1"><span className="text-slate-450">Clearance Status</span><span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded text-xs">Cleared</span></div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-4 tracking-tight">Interval History Log</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-700 text-xs font-bold flex-shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-xs text-slate-900">Emergency Donation Registered</p>
                      <p className="text-[10px] text-slate-400">{currentUser?.lastDonation || 'Nov 14, 2025'} · 450 mL (Whole Blood)</p>
                    </div>
                  </div>
                  <div className="ml-3.5 border-l border-slate-200 pl-4 py-1.5">
                    <p className="text-[10px] text-slate-400">90-day mandatory clinical interval locks</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0">✓</div>
                    <div>
                      <p className="font-semibold text-xs text-slate-900">Validation Cleared</p>
                      <p className="text-[10px] text-slate-400">February 12, 2026 · Auto-notifications reactivated</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-500 leading-relaxed">
                <p className="font-bold text-slate-700 mb-1">Voluntary Intervals</p>
                <span>BloodLink DVO locks matching requests during recovery. Once recovery completes, you are added back to the active pool.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HISTORY */}
        {tab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Complete Profile Ledger</h3>
              <span className="text-xs font-semibold text-slate-500">{donationHistory.length} logs · {donationHistory.length * 3} lives sustained</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Donation Date</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Center / Facility</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Volume</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Reason / Trigger</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-450 uppercase tracking-wider">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donationHistory.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-xs font-bold text-slate-400">{donationHistory.length - i}</td>
                      <td className="px-6 py-3.5 text-xs font-semibold text-slate-900">{d.date}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">{d.facility}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">450 mL (Whole Blood)</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          d.trigger.includes('Alert') 
                            ? 'bg-rose-50 border-rose-100 text-[#C21C24]' 
                            : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          {d.trigger}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs font-bold text-emerald-600">3 lives saved</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3.5 bg-emerald-50/45 border-t border-slate-100 text-xs text-emerald-800 font-semibold">
              Thank you for your consistency. Your 7 registered donations have contributed to saving approximately 21 lives in Davao City.
            </div>
          </div>
        )}

        {/* TAB: CENTERS */}
        {tab === 'centers' && (
          <div className="grid md:grid-cols-3 gap-6 fade-in">
            {bloodCenters.map((center) => (
              <div key={center.name} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      center.urgent 
                        ? 'bg-rose-50 border-rose-100 text-[#C21C24]' 
                        : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    }`}>
                      {center.urgent ? 'O- Emergency Need' : 'Inventory Stable'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1 tracking-tight">{center.name}</h4>
                  <p className="text-[11px] text-slate-400 mb-4 font-semibold">{center.address}</p>
                  
                  <div className="space-y-2 text-xs text-slate-650 border-t border-slate-100 pt-4">
                    <div className="flex justify-between"><span>Distance Radius</span><span className="font-bold text-[#C21C24]">{center.distance}</span></div>
                    <div className="flex justify-between"><span>Operating Hours</span><span className="font-medium text-slate-900">{center.hours}</span></div>
                    <div className="flex justify-between items-center">
                      <span>Contact Desk</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{center.phone}</span>
                    </div>
                  </div>
                </div>

                {center.urgent && eligibility.eligible && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => navigate('/donor/notification')} 
                      className="w-full bg-[#C21C24] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all shadow-sm"
                    >
                      Route Dispatch Alert →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB: ALERTS */}
        {tab === 'alerts' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden fade-in">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900 text-sm tracking-tight">Historical Notification Log</h3></div>
            <div className="divide-y divide-slate-100">
              {alertHistory.map((alert, i) => (
                <div key={i} className="px-6 py-4 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        alert.type === 'shortage' 
                          ? 'bg-rose-50 border-rose-100 text-[#C21C24]' 
                          : 'bg-blue-50 border-blue-100 text-blue-700'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{alert.title}</p>
                        <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{alert.date}</p>
                        <p className="text-xs text-slate-650 bg-slate-50 rounded-lg border border-slate-200/60 p-3 mt-2.5 leading-relaxed font-mono text-[11px] max-w-2xl">{alert.message}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      alert.response === 'Donated' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                      alert.response === 'Re-Eligibility' ? 'bg-indigo-50 border-indigo-100 text-indigo-750' :
                      alert.response === 'Awaiting' ? 'bg-rose-50 border-rose-100 text-[#C21C24]' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      {alert.response}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: REQUEST BLOOD */}
        {tab === 'request' && (
          <div className="fade-in space-y-6">
            
            {/* Guide Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 flex items-start gap-3.5 shadow-sm">
              <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-800 font-bold text-xs">Clinical Pre-Submission Protocol</p>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                  Hospital releases in Davao require signed physical request forms. Complete this digital registration to dispatch emergency inventories at the target center before your arrival. You must still present physical documentation during pickup.
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 items-start">
              
              {/* Left Column: Form or Blocked States */}
              <div>
                {/* State A: Locked if has active request */}
                {hasActiveRequest && !requestSubmitted && (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center flex flex-col justify-center shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4 text-slate-500">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 tracking-tight">Active Request Logged</h3>
                    <p className="text-slate-500 text-xs mb-4">You have a request undergoing administrative matching. To submit another request, the current record must be completed.</p>
                    
                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 text-left space-y-2 text-xs text-slate-650">
                      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5">Pending Request Profile:</p>
                      {myRequests.find(r => r.status === 'Pending' || r.status === 'Processing') && (
                        <>
                          <div className="flex justify-between"><span>Patient Name</span><span className="font-semibold text-slate-800">{myRequests.find(r => r.status === 'Pending' || r.status === 'Processing')?.patientName}</span></div>
                          <div className="flex justify-between"><span>Blood Required</span><span className="font-bold text-[#C21C24]">{myRequests.find(r => r.status === 'Pending' || r.status === 'Processing')?.patientBloodType}</span></div>
                          <div className="flex justify-between"><span>Matching Status</span><span className="font-bold text-slate-850 capitalize">{myRequests.find(r => r.status === 'Pending' || r.status === 'Processing')?.status}</span></div>
                          <div className="flex justify-between"><span>Registry ID</span><span className="font-mono font-bold text-slate-800">{myRequests.find(r => r.status === 'Pending' || r.status === 'Processing')?.refNo}</span></div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* State B: Blocked if account is flagged */}
                {accountFlagged && !requestSubmitted && !hasActiveRequest && (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center flex flex-col justify-center shadow-sm">
                    <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-[#C21C24]">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 tracking-tight">Account Restricted</h3>
                    <p className="text-slate-500 text-xs mb-4">Your voluntary account is marked under verification review. Requests cannot be completed until checks clear.</p>
                    <p className="text-slate-500 text-xs mb-5 font-semibold">Please contact operations desks at SPMC Blood Production: (082) 227-2731.</p>
                    <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-4 text-[10px] text-[#C21C24] leading-relaxed font-semibold">
                      To resolve flagging errors, report to the nearest SPMC facility with local ID credentials and signed request documents.
                    </div>
                  </div>
                )}

                {/* State C: Request Form */}
                {!hasActiveRequest && !accountFlagged && !requestSubmitted && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-1 tracking-tight">Referral Submission Form</h3>
                    <p className="text-slate-550 text-xs mb-6">Input metrics exactly matching your doctor-signed forms.</p>

                    <div className="space-y-5">
                      {/* Patient Group */}
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-1.5">1. Patient Profile</p>
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              placeholder="e.g. Jose R. Reyes" 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.patientName}
                              onChange={(e) => setReqForm({ ...reqForm, patientName: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Patient Age</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 45" 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.patientAge}
                              onChange={(e) => setReqForm({ ...reqForm, patientAge: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Blood Type <span className="text-red-500">*</span></label>
                            <select 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.patientBloodType}
                              onChange={(e) => setReqForm({ ...reqForm, patientBloodType: e.target.value })}
                            >
                              <option value="">Select type</option>
                              <option value="A+">A+</option><option value="A-">A-</option>
                              <option value="B+">B+</option><option value="B-">B-</option>
                              <option value="AB+">AB+</option><option value="AB-">AB-</option>
                              <option value="O+">O+</option><option value="O-">O-</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Units (Bags) <span className="text-red-500">*</span></label>
                            <input 
                              type="number" 
                              placeholder="e.g. 2" 
                              min="1"
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.units}
                              onChange={(e) => setReqForm({ ...reqForm, units: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Diagnosis <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              placeholder="e.g. Dengue, Trauma" 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.diagnosis}
                              onChange={(e) => setReqForm({ ...reqForm, diagnosis: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Hospital Group */}
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-1.5">2. Medical Facility Details</p>
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name <span className="text-red-500">*</span></label>
                            <select 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.hospital}
                              onChange={(e) => setReqForm({ ...reqForm, hospital: e.target.value })}
                            >
                              <option value="">Select hospital</option>
                              <option value="Southern Philippines Medical Center (SPMC)">Southern Philippines Medical Center (SPMC)</option>
                              <option value="Davao Doctors Hospital">Davao Doctors Hospital</option>
                              <option value="San Pedro Hospital">San Pedro Hospital</option>
                              <option value="Brokenshire Memorial Hospital">Brokenshire Memorial Hospital</option>
                              <option value="Davao Regional Medical Center">Davao Regional Medical Center</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Attending MD <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              placeholder="e.g. Dr. Juan Dela Cruz, MD" 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.physician}
                              onChange={(e) => setReqForm({ ...reqForm, physician: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Hospital Request Slip ID</label>
                            <input 
                              type="text" 
                              placeholder="e.g. SPMC-2026-04821" 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.hospitalRefNo}
                              onChange={(e) => setReqForm({ ...reqForm, hospitalRefNo: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Request Parameters */}
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-1.5">3. Dispatch Parameters</p>
                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Target Blood Center <span className="text-red-500">*</span></label>
                            <select 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.bloodCenter}
                              onChange={(e) => setReqForm({ ...reqForm, bloodCenter: e.target.value })}
                            >
                              <option value="">Select center</option>
                              <option value="SPMC Blood Production Services">SPMC Blood Production Services</option>
                              <option value="Philippine Red Cross – Davao Chapter">Philippine Red Cross – Davao Chapter</option>
                              <option value="SNBC – Mindanao (DOH-Davao)">SNBC – Mindanao (DOH-Davao)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Level <span className="text-red-500">*</span></label>
                            <select 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.urgency}
                              onChange={(e) => setReqForm({ ...reqForm, urgency: e.target.value })}
                            >
                              <option value="">Select urgency</option>
                              <option value="routine">Routine — 24 hours</option>
                              <option value="urgent">Urgent — 3-6 hours</option>
                              <option value="emergency">Emergency — Immediate</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Date Needed <span className="text-red-500">*</span></label>
                            <input 
                              type="date" 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.dateNeeded}
                              onChange={(e) => setReqForm({ ...reqForm, dateNeeded: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Attending Contact Name <span className="text-red-500">*</span></label>
                            <input 
                              type="text" 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.contactPerson}
                              onChange={(e) => setReqForm({ ...reqForm, contactPerson: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Attending Contact Phone <span className="text-red-500">*</span></label>
                            <input 
                              type="tel" 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/45"
                              value={reqForm.contactNumber}
                              onChange={(e) => setReqForm({ ...reqForm, contactNumber: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Additional Clinical Notes</label>
                            <textarea 
                              rows="2" 
                              placeholder="Describe specialized blood product requirements, target components, or special instructions..." 
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none resize-none bg-slate-50/45"
                              value={reqForm.notes}
                              onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })}
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed font-medium">
                        <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>Pre-submission saves operational staging time, but releasing requires presenting physical signed documentation at the center desk.</span>
                      </div>

                      <button 
                        onClick={submitRequest}
                        className="w-full bg-[#C21C24] text-white py-3 rounded-full text-xs font-bold hover:bg-[#A8181F] transition-all disabled:opacity-50 shadow-sm"
                        disabled={!reqForm.patientName || !reqForm.patientBloodType || !reqForm.units || !reqForm.hospital || !reqForm.physician || !reqForm.bloodCenter || !reqForm.urgency || !reqForm.dateNeeded}
                      >
                        Submit Referral Request
                      </button>
                    </div>
                  </div>
                )}

                {/* State D: Success state */}
                {requestSubmitted && (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center flex flex-col justify-center shadow-sm fade-in">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 tracking-tight">Referral Registered</h3>
                    <p className="text-slate-500 text-xs mb-6">Inventory staging notification has been dispatched to the target blood desk.</p>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 inline-block w-full">
                      <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Referral Reference ID</p>
                      <p className="text-2xl font-extrabold text-slate-900 tracking-widest font-mono leading-tight">{lastRefNo}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Present this reference ID at the releasing counter.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left flex gap-2.5 items-start text-xs text-slate-500 leading-relaxed font-medium">
                      <AlertTriangle className="w-4 h-4 text-slate-450 flex-shrink-0 mt-0.5" />
                      <span>Bring the original doctor-signed request form. Releasing matches cannot complete without physical records.</span>
                    </div>
                    
                    <button onClick={() => setRequestSubmitted(false)} className="w-full border border-slate-200 text-slate-650 hover:bg-slate-50 py-2.5 rounded-lg text-xs font-bold transition-all">
                      Submit New Referral
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Submitted Requests Registry */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs tracking-tight">Active Referral Registry</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{myRequests.length} referrals</span>
                </div>
                {myRequests.length === 0 ? (
                  <div className="px-5 py-16 text-center text-slate-400 text-xs flex-1 flex flex-col items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300 mb-2" />
                    <span>No pre-submitted referrals found on this profile.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 overflow-y-auto max-h-[580px] flex-1">
                    {myRequests.map((req, i) => (
                      <div key={i} className="p-5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{req.patientName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{req.hospital}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            req.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            req.status === 'Processing' ? 'bg-blue-50 border-blue-100 text-blue-750' :
                            req.status === 'Fulfilled' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-[#C21C24]'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-slate-500 mb-3">
                          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-1.5 text-center">
                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Blood Type</p>
                            <p className="font-extrabold text-[#C21C24] text-xs">{req.patientBloodType}</p>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-1.5 text-center">
                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Volume Requested</p>
                            <p className="font-extrabold text-slate-800 text-xs">{req.units} units</p>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded px-2 py-1.5 text-center">
                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Urgency Tier</p>
                            <p className="font-extrabold text-slate-800 text-xs capitalize">{req.urgency}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 border-t border-slate-50 pt-3">
                          <span>Ref: <span className="font-mono font-bold text-slate-700">{req.refNo}</span></span>
                          <span>{req.submittedAt}</span>
                        </div>

                        {req.statusNote && (
                          <div className="mt-3 bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex gap-2 items-start text-xs text-blue-750">
                            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed font-semibold">Center Action Log: {req.statusNote}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
