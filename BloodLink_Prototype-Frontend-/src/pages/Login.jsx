import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useBloodStore } from '../store/useBloodStore';
import { isValidEmail } from '../utils/validation';
import bloodlinkLogo from '../assets/bloodlinks_logo/bloodlink-logo.png';
import davaoLogo from '../assets/bloodlinks_logo/davao-logo.png';
import snbc1 from '../assets/facilities/snbc/snbc-1.jpg';

const destinationForRole = {
  'Super Admin': '/superadmin/dashboard',
  Administrator: '/admin/dashboard',
  'Registry Staff': '/registry/dashboard',
  'Issuance Personnel': '/issuance/dashboard',
  'Hospital User': '/issuance/dashboard',
  'Serology Staff': '/serology/dashboard',
  'Production Staff': '/production/dashboard',
};

export default function Login() {
  const navigate = useNavigate();
  const loginSystemUser = useBloodStore((state) => state.loginSystemUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isValidEmail(email)) return setError('Enter your registered work email address.');
    if (!password) return setError('Enter your password to continue.');

    setIsSubmitting(true);
    try {
      const user = await loginSystemUser(email.trim(), password);
      if (!user) return setError('We could not sign you in with those credentials.');
      navigate(destinationForRole[user.role] || '/', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'We could not sign you in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="min-h-screen bg-slate-950 text-slate-900 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
    <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 text-white">
      <img src={snbc1} alt="National Blood Center Mindanao" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-rose-950/75" />
      <div className="relative flex items-center gap-3"><img src={bloodlinkLogo} alt="BloodLink DVO" className="h-12 w-auto brightness-0 invert" /><span className="h-8 w-px bg-white/25" /><img src={davaoLogo} alt="Davao City" className="h-12 w-auto" /></div>
      <div className="relative max-w-xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-wide"><ShieldCheck className="h-4 w-4 text-rose-300" />SECURE OPERATIONS PORTAL</div><h1 className="text-5xl font-black leading-[1.04] tracking-tight">Every donation matters. Every access point does too.</h1><p className="mt-6 max-w-lg text-base leading-7 text-slate-300">BloodLink DVO connects the teams who coordinate safe, timely blood services across Davao City.</p></div>
      <div className="relative flex items-center gap-3 text-xs text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-400" />Authorized personnel only · Activity is recorded for operational security.</div>
    </section>

    <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to Landing Page</Link>
        <div className="mb-9 flex items-center gap-2 lg:hidden"><img src={bloodlinkLogo} alt="BloodLink DVO" className="h-9 w-auto" /><img src={davaoLogo} alt="Davao City" className="h-10 w-auto" /></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_60px_-28px_rgba(15,23,42,.35)] sm:p-9">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-700"><LockKeyhole className="h-5 w-5" /></div>
          <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Sign in to BloodLink</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Use the work email and password assigned to your account.</p>
          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-medium leading-5 text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 flex-none" />{error}</div>}
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Work email</span><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoComplete="email" autoFocus type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@bloodlink.dvo" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100" /></div></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Password</span><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            <button disabled={isSubmitting} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-wait disabled:opacity-70"><LogIn className="h-4 w-4" />{isSubmitting ? 'Verifying secure access…' : 'Sign in'}</button>
          </form>
          <div className="mt-7 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500">Need help accessing your account? Contact your BloodLink system administrator.</div>
        </div>
        <p className="mt-6 text-center text-[11px] text-slate-400">BloodLink DVO</p>
      </div>
    </section>
  </main>;
}
