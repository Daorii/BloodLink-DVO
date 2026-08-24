import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBloodStore } from '../store/useBloodStore';
import { Heart, ArrowLeft, ArrowRight, User, Shield, Check, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';

export default function DonorRegister() {
  const navigate = useNavigate();
  const registerDonor = useBloodStore((state) => state.registerDonor);

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [donorId, setDonorId] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const healthQs = [
    'I am in good health and feeling well today.',
    'I weigh at least 50 kg.',
    'I have not had any major illness, surgery, or tattoo in the last 12 months.',
    'I am not currently taking antibiotics or prescription medication.',
    'I have not donated blood within the last 3 months.',
  ];

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    sex: '',
    phone: '',
    email: '',
    address: '',
    preferredCenter: '',
    bloodType: '',
    weight: '',
    donatedBefore: '',
    lastDonation: '',
    health: [false, false, false, false, false],
    consent: false
  });

  const getEligibilityStatus = () => {
    if (form.donatedBefore === 'no' || !form.donatedBefore) {
      return {
        eligible: true,
        title: 'Eligible to Donate',
        message: 'First-time donors are welcome. You can donate right away after registration.'
      };
    }
    if (form.lastDonation) {
      const days = Math.floor((new Date() - new Date(form.lastDonation)) / (1000 * 60 * 60 * 24));
      if (days >= 90) {
        return {
          eligible: true,
          title: 'Eligible to Donate',
          message: `${days} days since last donation — you meet the 90-day requirement.`
        };
      }
      const ready = new Date(new Date(form.lastDonation).getTime() + 90 * 24 * 60 * 60 * 1000);
      return {
        eligible: false,
        title: 'Not Yet Eligible',
        message: `You can donate again on ${ready.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}. BloodLink DVO will notify you automatically.`
      };
    }
    return {
      eligible: true,
      title: 'Eligible to Donate',
      message: 'You will be added to the active pool.'
    };
  };

  const eligibility = getEligibilityStatus();

  const handleHealthCheckboxChange = (index) => {
    const newHealth = [...form.health];
    newHealth[index] = !newHealth[index];
    setForm({ ...form, health: newHealth });
  };

  const submit = () => {
    if (!form.consent) return;
    const generatedId = registerDonor(form);
    setDonorId(generatedId);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={bloodlinkLogo} alt="Logo" className="h-full max-w-none object-cover object-left" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 tracking-tight">BloodLink</span>
              <span className="font-medium text-[10px] text-[#C21C24] ml-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded">DVO</span>
            </div>
          </div>
          <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Gateway</span>
          </Link>
        </div>
      </header>

      {/* Progress Indicator */}
      {!submitted && (
        <div className="bg-white border-b border-slate-200 py-4">
          <div className="max-w-xl mx-auto px-6">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-2">
              <span className={step >= 1 ? 'text-slate-900' : ''}>1. Personal Information</span>
              <span className={step >= 2 ? 'text-slate-900' : ''}>2. Blood & Health</span>
              <span className={step >= 3 ? 'text-slate-900' : ''}>3. Verify Consent</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-[#C21C24] h-1.5 rounded-full transition-all duration-350" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Area */}
      <main className="max-w-xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center">
        {!submitted ? (
          <div className="w-full">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm fade-in">
                <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Personal Information</h2>
                <p className="text-slate-500 text-xs mb-6">Create your donor profile. Fields marked with an asterisk (<span className="text-red-500">*</span>) are required.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="e.g. Maria" 
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                        value={form.firstName} 
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        placeholder="e.g. Santos" 
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                        value={form.lastName} 
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
                      <input 
                        type="date" 
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                        value={form.dob} 
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Sex <span className="text-red-500">*</span></label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                        value={form.sex} 
                        onChange={(e) => setForm({ ...form, sex: e.target.value })}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                      <input 
                        type="tel" 
                        placeholder="+63 9XX XXX XXXX" 
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                        value={form.phone} 
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="e.g. maria@gmail.com" 
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                        value={form.email} 
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Home Address in Davao City <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. Brgy. Buhangin, Davao City" 
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                      value={form.address} 
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Used for emergency distance matching (RA 10173 compliant).</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Preferred Blood Center</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                      value={form.preferredCenter} 
                      onChange={(e) => setForm({ ...form, preferredCenter: e.target.value })}
                    >
                      <option value="">Any Center (Recommended)</option>
                      <option value="SPMC Blood Production Services">SPMC Blood Production Services</option>
                      <option value="Philippine Red Cross – Davao Chapter">Philippine Red Cross – Davao Chapter</option>
                      <option value="SNBC – Mindanao (DOH-Davao)">SNBC – Mindanao (DOH-Davao)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setStep(2)} 
                    className="inline-flex items-center gap-1.5 bg-[#C21C24] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    disabled={!form.firstName || !form.lastName || !form.phone || !form.address}
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm fade-in">
                <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Blood & Donation Info</h2>
                <p className="text-slate-500 text-xs mb-6">Provide physical metrics to accurately route emergency alerts.</p>

                {/* Blood Type Grid */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Blood Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-4 gap-2">
                    {bloodTypes.map((bt) => (
                      <button 
                        key={bt} 
                        onClick={() => setForm({ ...form, bloodType: bt })}
                        className={`py-3.5 border rounded-lg text-sm font-bold transition flex items-center justify-center ${form.bloodType === bt ? 'border-[#C21C24] bg-rose-50 text-[#C21C24]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {bt}
                      </button>
                    ))}
                  </div>
                  {form.bloodType === 'O-' && (
                    <div className="flex gap-2 items-start bg-rose-50/50 border border-rose-100 rounded-lg p-3 mt-3 text-xs text-[#C21C24] font-medium">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>O- is the universal blood type, critically required for emergency trauma cases in Davao City.</span>
                    </div>
                  )}
                </div>

                {/* Weight and Donation History */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Weight (kg) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      placeholder="e.g. 55" 
                      min="50"
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                      value={form.weight} 
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Minimum 50 kg required.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Have you donated blood before?</label>
                    <select 
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                      value={form.donatedBefore}
                      onChange={(e) => setForm({ ...form, donatedBefore: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No, first time</option>
                    </select>
                  </div>
                  
                  {form.donatedBefore === 'yes' && (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Donation Date</label>
                      <input 
                        type="date" 
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition outline-none bg-slate-50/50"
                        value={form.lastDonation} 
                        onChange={(e) => setForm({ ...form, lastDonation: e.target.value })}
                      />
                      {form.lastDonation && (
                        <div className={`mt-2 text-xs font-semibold flex items-center gap-1.5 ${eligibility.eligible ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {eligibility.eligible ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{eligibility.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Health Declaration */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                  <h3 className="font-bold text-slate-800 mb-3 text-xs flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>Medical Pre-Screening Affirmations</span>
                  </h3>
                  <div className="space-y-3">
                    {healthQs.map((q, i) => (
                      <label key={i} className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-0.5 w-4 h-4 text-[#C21C24] border-slate-300 rounded flex-shrink-0 cursor-pointer"
                          checked={form.health[i]}
                          onChange={() => handleHealthCheckboxChange(i)}
                        />
                        <span className="text-xs text-slate-650 font-medium select-none leading-relaxed">{q}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition-all py-2.5">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button 
                    onClick={() => setStep(3)} 
                    className="inline-flex items-center gap-1.5 bg-[#C21C24] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    disabled={!form.bloodType || !form.weight}
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="fade-in">
                <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Review & Consent</h2>
                  <p className="text-slate-500 text-xs mb-6">Confirm that your data matches exactly to prevent verification delays.</p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="border border-slate-100 bg-slate-50/40 rounded-xl p-4">
                      <h3 className="font-bold text-slate-800 mb-3 text-xs">Profile Details</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Name</span><span className="font-semibold text-slate-800">{form.firstName} {form.lastName}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Gender</span><span className="font-semibold text-slate-800">{form.sex || '—'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Mobile</span><span className="font-semibold text-slate-800">{form.phone || '—'}</span></div>
                        <div className="flex justify-between pb-0"><span className="text-slate-400">Address</span><span className="font-semibold text-slate-800 text-right max-w-[140px] truncate">{form.address || '—'}</span></div>
                      </div>
                    </div>

                    <div className="border border-slate-100 bg-slate-50/40 rounded-xl p-4">
                      <h3 className="font-bold text-slate-800 mb-3 text-xs">Medical Profile</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Blood Type</span><span className="font-black text-[#C21C24] text-sm">{form.bloodType || '—'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Weight</span><span className="font-semibold text-slate-800">{form.weight ? `${form.weight} kg` : '—'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400">Donation History</span><span className="font-semibold text-slate-800">{form.donatedBefore === 'yes' ? 'Previous donor' : 'First-time donor'}</span></div>
                        {form.lastDonation && (
                          <div className="flex justify-between pb-0"><span className="text-slate-400">Last Date</span><span className="font-semibold text-slate-800">{form.lastDonation}</span></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Banner */}
                  <div className={`border rounded-xl p-4 mb-6 flex gap-3 items-start ${eligibility.eligible ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-amber-50/50 border-amber-100 text-amber-800'}`}>
                    <div className="mt-0.5">
                      {eligibility.eligible ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs">{eligibility.title}</p>
                      <p className="text-[11px] text-slate-650 mt-0.5 leading-relaxed">{eligibility.message}</p>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 mb-1.5 text-xs">Data Privacy Agreement (R.A. 10173)</h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Your registration data will be safely cached locally. It is accessible solely by authorised Davao City medical operations desks at SPMC, PRC, and SNBC for emergency donor mobilization routing. We do not sell or distribute personal metrics.</p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-0.5 w-4 h-4 text-[#C21C24] border-slate-300 rounded flex-shrink-0 cursor-pointer"
                        checked={form.consent}
                        onChange={() => setForm({ ...form, consent: !form.consent })}
                      />
                      <span className="text-xs text-slate-700 font-bold select-none leading-relaxed">I consent to the processing of my medical metrics and agree to receive urgent SMS notifications.</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition-all py-2.5">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button 
                    onClick={submit} 
                    disabled={!form.consent} 
                    className="inline-flex items-center gap-1.5 bg-[#C21C24] text-white px-8 py-3 rounded-full text-xs font-bold hover:bg-[#A8181F] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Register as Voluntary Donor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SUCCESS VIEW */
          <div className="fade-in text-center bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Registration Complete</h2>
            <p className="text-sm text-slate-655 mb-1">Welcome to the network, <span className="font-semibold text-[#C21C24]">{form.firstName}</span>!</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
              We have added your profile to the local dashboard pools. You will receive emergency alerts at <span className="font-medium text-slate-800">{form.phone}</span> when <span className="font-bold text-[#C21C24]">{form.bloodType}</span> blood matches a critical shortage.
            </p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 mb-8 inline-block">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Assigned Profile ID</p>
              <p className="text-2xl font-extrabold text-slate-900 tracking-wider font-mono">{donorId}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/donor/dashboard')} className="bg-[#C21C24] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#A8181F] transition-all shadow-sm">
                Open Donor Portal
              </button>
              <Link to="/" className="border border-slate-200 text-slate-500 hover:bg-slate-50 px-6 py-2.5 rounded-full text-xs font-bold transition-all text-center">
                Return Gateway
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
