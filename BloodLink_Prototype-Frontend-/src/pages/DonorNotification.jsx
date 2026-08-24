import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBloodStore } from '../store/useBloodStore';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Heart, 
  ArrowLeft, 
  Bell, 
  AlertTriangle, 
  Check, 
  Clock, 
  HelpCircle, 
  X, 
  MapPin, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function DonorNotification() {
  const navigate = useNavigate();

  // Zustand State
  const currentUser = useBloodStore((state) => state.currentUser);
  const mobilizeFlowStep = useBloodStore((state) => state.mobilizeFlowStep);
  const setPhaseDetails = useBloodStore((state) => state.setPhaseDetails);

  // Local State
  const [responded, setResponded] = useState(false);
  const [responseType, setResponseType] = useState('');
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!responded && mapRef.current) {
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
        className: 'custom-icon-spmc-big',
        html: `<div style="background-color: #C21C24; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker([7.0731, 125.6128], { icon: spmcIcon })
        .bindPopup('<b>SPMC Blood Production Services</b><br>JP Laurel Ave, Bajada')
        .addTo(map)
        .openPopup();

      const donorIcon = L.divIcon({
        className: 'custom-icon-donor-big',
        html: `<div style="background-color: #475569; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([7.0822, 125.6210], { icon: donorIcon })
        .bindPopup('<b>Your Location</b>')
        .addTo(map);

      L.polyline([[7.0822, 125.6210], [7.0731, 125.6128]], {
        color: '#C21C24',
        weight: 1.5,
        dashArray: '5,5'
      }).addTo(map);

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [responded]);

  const handleResponse = (type) => {
    setResponseType(type);
    setResponded(true);

    if (type === 'yes') {
      setPhaseDetails(1, 13);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={bloodlinkLogo} alt="Logo" className="h-full max-w-none object-cover object-left" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 tracking-tight">BloodLink</span>
              <span className="font-medium text-[10px] text-[#C21C24] ml-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded">DVO</span>
            </div>
          </div>
          <Link to="/donor/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      {/* RESPONSE SELECTION VIEW */}
      {!responded && (
        <main className="max-w-2xl mx-auto w-full px-6 py-8 space-y-6 flex-grow flex flex-col justify-center">
          
          {/* Header Banner */}
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 bg-white border border-rose-200 rounded-lg flex items-center justify-center flex-shrink-0 text-[#C21C24]">
              <ShieldAlert className="w-5 h-5 pulse-dot" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Emergency Shortage Match</h1>
              <p className="text-xs text-slate-500 mt-0.5">SPMC Blood Production Services · Target Type: <strong className="text-[#C21C24]">{currentUser?.bloodType || 'O-'}</strong></p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Dispatched via Semaphore PH API · 8 minutes ago</p>
            </div>
          </div>

          {/* SMS Mockup Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden">
                  <img src={bloodlinkLogo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-slate-800">BloodLink DVO Alert</span>
              </div>
              <span>SMS Gateway</span>
            </div>
            
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-xs text-slate-700 leading-relaxed font-mono">
              <p className="font-bold text-slate-900">🩸 URGENT BLOOD NEEDED</p>
              <p className="mt-2">Hi {currentUser?.firstName || 'Maria'}! {currentUser?.bloodType || 'O-'} blood is critically low at SPMC Blood Production Services.</p>
              <p className="mt-1">You are eligible to donate (last donated 4 months ago).</p>
              <p className="mt-2">📍 Proximity: 1.2 km away (JP Laurel Ave)</p>
              <p className="mt-1">⏰ Hours: Open 24/7</p>
              <p className="mt-2">Can you support today? Reply YES to confirm.</p>
            </div>
          </div>

          {/* Stats & Proximity Details Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3.5 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Target Need</p>
                <p className="text-2xl font-black text-[#C21C24] font-mono">{currentUser?.bloodType || 'O-'}</p>
              </div>
              <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3.5 text-center">
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Stock Level</p>
                <p className="text-2xl font-black text-slate-800 font-mono">3 units</p>
                <p className="text-[9px] text-[#C21C24] font-bold mt-0.5">Critical (Min: 5)</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Facility Transit Route</p>
              <div ref={mapRef} id="alertMap" className="rounded-lg overflow-hidden border border-slate-200 mb-3"></div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> SPMC Blood Bank Counter</p>
                <p className="mt-1">JP Laurel Ave, Bajada · open 24/7 · (082) 227-2731</p>
                <p className="text-[10px] text-slate-450 mt-1.5 font-bold uppercase">Transit: 1.2 km (~5-7 mins ride)</p>
              </div>
            </div>
          </div>

          {/* Response Buttons */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <p className="text-center font-bold text-sm text-slate-850">Can you donate at SPMC today?</p>
            <div className="grid gap-2.5">
              <button 
                onClick={() => handleResponse('yes')} 
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#C21C24] text-white py-3.5 px-6 rounded-lg text-sm font-bold hover:bg-[#A8181F] transition-all shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>YES — I am arriving today</span>
              </button>
              
              <button 
                onClick={() => handleResponse('maybe')} 
                className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white py-3 px-6 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
              >
                <Clock className="w-4 h-4" />
                <span>MAYBE — I will arrive later</span>
              </button>
              
              <button 
                onClick={() => handleResponse('no')} 
                className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 py-3 px-6 rounded-lg text-xs font-bold transition-all"
              >
                <X className="w-4 h-4" />
                <span>NO — Unavailable this time</span>
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 font-semibold leading-relaxed mt-2">Your response dynamically routes into center coordinator turnout lists.</p>
          </div>

        </main>
      )}

      {/* YES RESPONSE VIEW */}
      {responded && responseType === 'yes' && (
        <main className="max-w-md mx-auto w-full px-6 py-12 flex-grow flex flex-col justify-center fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Response Registered</h2>
            <p className="text-sm text-slate-655 mb-6">Thank you, <span className="font-semibold text-[#C21C24]">{currentUser?.firstName || 'Maria'}</span>. Your arrival is logged at the SPMC coordinator panel.</p>
            
            {/* Before coming checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left mb-6">
              <h3 className="font-bold text-xs text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span>Pre-Donation Prep</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-semibold">
                <li className="flex items-start gap-2">✓ <span>Eat a proper meal before arriving.</span></li>
                <li className="flex items-start gap-2">✓ <span>Drink 2-3 glasses of water.</span></li>
                <li className="flex items-start gap-2">✓ <span>Bring a valid government ID.</span></li>
                <li className="flex items-start gap-2">✓ <span>Wear short-sleeved clothing.</span></li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-500 mb-8 space-y-1">
              <p className="font-bold text-slate-800">📍 SPMC Blood Production Services</p>
              <p>JP Laurel Ave, Bajada · open 24/7</p>
              <p className="font-bold text-[#C21C24] mt-1">1.2 km away · ~5 mins transit</p>
            </div>

            <button 
              onClick={() => navigate('/donor/confirm')} 
              className="w-full bg-[#C21C24] text-white py-3 px-6 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all shadow-sm"
            >
              Access Mobilization Dashboard →
            </button>
          </div>
        </main>
      )}

      {/* MAYBE RESPONSE VIEW */}
      {responded && responseType === 'maybe' && (
        <main className="max-w-md mx-auto w-full px-6 py-12 flex-grow flex flex-col justify-center fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
              <Clock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Response Registered</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">Thank you. Your tentative response is logged. Every unit helps save lives when supplies run thin.</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-500 mb-8 space-y-1">
              <p className="font-bold text-slate-800">📍 SPMC Blood Production Services</p>
              <p>JP Laurel Ave, Bajada · open 24/7</p>
            </div>

            <button onClick={() => navigate('/donor/dashboard')} className="w-full bg-slate-900 text-white py-2.5 px-6 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm">
              Return to Dashboard
            </button>
          </div>
        </main>
      )}

      {/* NO RESPONSE VIEW */}
      {responded && responseType === 'no' && (
        <main className="max-w-md mx-auto w-full px-6 py-12 flex-grow flex flex-col justify-center fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
              <X className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Response Registered</h2>
            <p className="text-sm text-slate-605 mb-8 leading-relaxed">We understand. We will alert you again once your next re-eligibility window opens. Thank you for your support!</p>
            
            <button onClick={() => navigate('/donor/dashboard')} className="w-full bg-slate-900 text-white py-2.5 px-6 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm">
              Return to Dashboard
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
