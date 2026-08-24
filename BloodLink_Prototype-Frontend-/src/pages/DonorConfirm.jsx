import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBloodStore } from '../store/useBloodStore';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import { 
  Heart, 
  Check, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Award, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Smile,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function DonorConfirm() {
  const navigate = useNavigate();

  // Zustand State
  const currentUser = useBloodStore((state) => state.currentUser);
  const arrivedAtFacility = useBloodStore((state) => state.arrivedAtFacility);
  const setArrivalStatus = useBloodStore((state) => state.setArrivalStatus);

  const steps = [
    { title: 'Screening & Registration', desc: 'Brief vital check at the front counter desk.', time: '~15 mins' },
    { title: 'Blood Draw Procedure', desc: '450 mL whole blood collection — clean and safe.', time: '~10 mins' },
    { title: 'Recovery & Refreshments', desc: 'Rest period with light snack provisions.', time: '~15 mins' },
    { title: 'Ledger Registry Update', desc: 'BloodLink DVO automatically locks next 90-day cycle.', time: 'Auto' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Top Header */}
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

      {/* Main Confirmation Content */}
      <main className="max-w-2xl mx-auto w-full px-6 py-10 space-y-6 flex-grow">
        
        {/* Slip Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm text-center fade-in">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mobilization Confirmed</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Confirmation Ticket: #BLD-2026-03-4821</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Registered March 19, 2026 · 9:54 AM</p>

          <div className="flex items-center gap-4 py-5 border-t border-b border-slate-100 mt-6 text-left">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-black text-[#C21C24]">{currentUser?.bloodType || 'O-'}</span>
            </div>
            <div className="flex-grow">
              <h2 className="text-sm font-bold text-slate-900">SPMC Blood Bank Counter</h2>
              <p className="text-xs text-slate-400 font-medium">JP Laurel Ave, Bajada · Mapped match</p>
            </div>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">Active</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-5 text-xs text-slate-650 text-left">
            <div className="flex justify-between"><span className="text-slate-400">Donor Name</span><span className="font-semibold text-slate-800">{currentUser?.name || 'Maria C. Santos'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Donor Registry ID</span><span className="font-semibold text-slate-800 font-mono">{currentUser?.id || 'BLD-482931'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Target Type</span><span className="font-bold text-[#C21C24]">{currentUser?.bloodType || 'O-'} Match</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Expected Date</span><span className="font-semibold text-slate-800">March 19, 2026</span></div>
          </div>
          
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left flex gap-2.5 items-start text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Recovery Lock Period</p>
              <p className="text-slate-500 mt-0.5 leading-relaxed">Your next donation eligibility window will lock automatically for 90 days following collection clearance.</p>
            </div>
          </div>
        </div>

        {/* Impact Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm fade-in">
          <h3 className="font-bold text-sm tracking-tight mb-4 uppercase text-slate-400 tracking-wider">Voluntary Track Record</h3>
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg py-3">
              <p className="text-2xl font-black font-mono">3</p>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">Lives Saved</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg py-3">
              <p className="text-2xl font-black font-mono">450</p>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">mL Volume</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg py-3">
              <p className="text-2xl font-black font-mono">8</p>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">Total Count</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex gap-3 items-center">
            <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Veteran Donor Rank Unlocked</p>
              <p className="text-[10px] text-slate-400 mt-0.5">8 successful mobilizations completed. Top tier donor profile.</p>
            </div>
          </div>
        </div>

        {/* Mark Arrival Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm fade-in">
          <h3 className="font-bold text-slate-900 text-sm mb-1 tracking-tight">Mark Arrival at SPMC</h3>
          <p className="text-slate-550 text-xs mb-5 leading-relaxed">
            Upon entering SPMC Blood Production Services, tap below to notify desk coordinators of your presence and update your turnout status in real time.
          </p>
          {!arrivedAtFacility ? (
            <button 
              onClick={() => setArrivalStatus(true)} 
              className="w-full bg-[#C21C24] text-white py-3 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-4 h-4" />
              <span>Confirm Desk Arrival</span>
            </button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center flex items-center justify-center gap-2 text-emerald-800 fade-in font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Arrival Logged · Please approach the counter desk.</span>
            </div>
          )}
        </div>

        {/* Timeline Checklist */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm fade-in">
          <h3 className="font-bold text-slate-900 text-sm mb-4 tracking-tight">SPMC In-Facility Donation Workflow</h3>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs border ${
                  i === 0 && arrivedAtFacility 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                    : i === 0 
                      ? 'bg-slate-900 border-slate-800 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {i === 0 && arrivedAtFacility ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-xs text-slate-905">{step.title}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{step.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Post-Care Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 fade-in">
          <h3 className="font-bold text-slate-805 text-xs mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Smile className="w-4 h-4 text-slate-500" />
            <span>Post-Donation Care Protocols</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-semibold">
            <li className="flex items-start gap-2"><span>•</span> Drink extra water for the next 24 to 48 hours.</li>
            <li className="flex items-start gap-2"><span>•</span> Avoid strenuous physical tasks or lifting for 12 hours.</li>
            <li className="flex items-start gap-2"><span>•</span> Keep the adhesive bandage on for at least 4 hours.</li>
            <li className="flex items-start gap-2"><span>•</span> If lightheadedness occurs, lie down immediately and lift feet.</li>
          </ul>
        </div>

        {/* Navigation CTAs */}
        <div className="flex gap-3 pt-2">
          <button 
            onClick={() => navigate('/donor/dashboard')} 
            className="flex-grow bg-[#C21C24] text-white py-3 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all shadow-sm"
          >
            Go to My Dashboard
          </button>
          <Link to="/" className="w-28 border border-slate-200 text-slate-650 hover:bg-slate-50 py-3 rounded-full text-xs font-bold transition-all text-center">
            Gateway
          </Link>
        </div>
      </main>
    </div>
  );
}
