import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight, FileClock,
  KeyRound, LockKeyhole, LogOut, RefreshCw, Search, ShieldCheck,
  ShieldEllipsis, UserCog, UserX, Users, XCircle,
} from 'lucide-react';
import { useBloodStore } from '../store/useBloodStore';
import { apiGetAuditLogs, apiGetSecurityOverview, apiRevokeUserSessions } from '../services/api';

const STATUS_STYLE = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  Suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  Locked: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_ACTIONS = ['Active', 'Suspended', 'Locked', 'Inactive'];

function statusClass(status) {
  return STATUS_STYLE[status] || STATUS_STYLE.Inactive;
}

function MetricCard({ label, value, hint, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-900 text-white border-slate-800',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-70">{label}</p><p className="mt-2 text-3xl font-black tabular-nums">{value}</p></div>
      <Icon className="h-5 w-5 opacity-80" />
    </div>
    <p className="mt-3 text-xs font-medium opacity-75">{hint}</p>
  </div>;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const authSystemUser = useBloodStore((state) => state.authSystemUser);
  const users = useBloodStore((state) => state.users);
  const fetchUsersFromAPI = useBloodStore((state) => state.fetchUsersFromAPI);
  const updateUser = useBloodStore((state) => state.updateUser);
  const logoutSystemUser = useBloodStore((state) => state.logoutSystemUser);
  const [tab, setTab] = useState('overview');
  const [logs, setLogs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [query, setQuery] = useState('');
  const [logQuery, setLogQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      await fetchUsersFromAPI();
      const [summary, audit] = await Promise.all([apiGetSecurityOverview(), apiGetAuditLogs({ perPage: 100 })]);
      setOverview(summary.overview);
      setLogs(audit.logs || []);
    } catch (error) {
      setNotice(error.message || 'Security records could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSecurityData(); }, []);

  const isSuperAdmin = authSystemUser?.role === 'Super Admin';
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => [user.id, user.name, user.email, user.role, user.status].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [users, query]);
  const modules = useMemo(() => ['All', ...new Set(logs.map((log) => log.module).filter(Boolean))], [logs]);
  const filteredLogs = useMemo(() => logs.filter((log) => {
    const term = logQuery.trim().toLowerCase();
    const matchesTerm = !term || [log.actorName, log.action, log.module, log.recordId, log.ipAddress].some((value) => String(value || '').toLowerCase().includes(term));
    return matchesTerm && (moduleFilter === 'All' || log.module === moduleFilter);
  }), [logs, logQuery, moduleFilter]);

  const changeStatus = async (user, status) => {
    if (user.id === authSystemUser?.id) { setNotice('You cannot change the status of your own account.'); return; }
    setBusyId(user.id);
    setNotice('');
    try {
      await updateUser(user.id, { status });
      await loadSecurityData();
      setNotice(`${user.name}'s account is now ${status.toLowerCase()}.`);
    } catch (error) { setNotice(error.message || 'Account status could not be changed.'); }
    finally { setBusyId(''); }
  };

  const revokeSessions = async (user) => {
    if (user.id === authSystemUser?.id) { setNotice('Use Sign out to end your own session.'); return; }
    setBusyId(`${user.id}-sessions`);
    try {
      await apiRevokeUserSessions(Number(String(user.id).replace('USR-', '')));
      await loadSecurityData();
      setNotice(`All active sessions for ${user.name} were revoked.`);
    } catch (error) { setNotice(error.message || 'Sessions could not be revoked.'); }
    finally { setBusyId(''); }
  };

  const handleLogout = async () => { await logoutSystemUser(); navigate('/'); };

  if (!isSuperAdmin) return <main className="min-h-screen bg-slate-950 grid place-items-center p-6"><section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"><ShieldEllipsis className="mx-auto h-10 w-10 text-rose-600" /><h1 className="mt-4 text-xl font-black text-slate-900">Restricted workspace</h1><p className="mt-2 text-sm text-slate-500">The Security Console is available only to Super Administrators.</p><Link to="/admin/dashboard" className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white">Return to dashboard</Link></section></main>;

  const nav = [
    ['overview', 'Security overview', ShieldCheck], ['accounts', 'Accounts & access', Users],
    ['audit', 'Audit trail', FileClock], ['policies', 'Security policy', LockKeyhole],
  ];

  return <div className="min-h-screen bg-slate-50 text-slate-800">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 p-5 text-slate-300 lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-black text-white">BloodLink DVO</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Security console</p></div></div>
      <nav className="mt-6 space-y-1">{nav.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${tab === id ? 'bg-white text-slate-950' : 'hover:bg-white/10 hover:text-white'}`}><Icon className="h-4 w-4" />{label}<ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" /></button>)}</nav>
      <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-bold text-white">{authSystemUser?.name}</p><p className="mt-1 text-[10px] text-slate-500">Super Administrator</p><button onClick={handleLogout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-[11px] font-bold hover:bg-white/10"><LogOut className="h-3.5 w-3.5" />Sign out</button></div>
    </aside>
    <main className="lg:ml-72"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:px-8"><div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-rose-600">Privileged administration</p><h1 className="text-lg font-black text-slate-900">{nav.find(([id]) => id === tab)?.[1]}</h1></div><button onClick={loadSecurityData} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button></header>
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        {notice && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-semibold text-indigo-800"><span>{notice}</span><button onClick={() => setNotice('')}><XCircle className="h-4 w-4" /></button></div>}
        {tab === 'overview' && <div className="space-y-6"><div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white"><div className="flex gap-4"><ShieldCheck className="h-8 w-8 flex-none text-rose-400" /><div><h2 className="text-xl font-black">Govern access. Preserve accountability.</h2><p className="mt-1 max-w-2xl text-sm text-slate-300">This workspace is for account security and system oversight. Operational blood-bank workflows remain in the Administrator dashboard.</p></div></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Active accounts" value={overview?.activeAccounts ?? '—'} hint="Accounts able to sign in" icon={CheckCircle2} tone="emerald" /><MetricCard label="Restricted accounts" value={overview?.restrictedAccounts ?? '—'} hint="Inactive, suspended, or locked" icon={UserX} tone="rose" /><MetricCard label="Active sessions" value={overview?.activeSessions ?? '—'} hint="Issued personal access tokens" icon={KeyRound} tone="slate" /><MetricCard label="Events today" value={overview?.eventsToday ?? '—'} hint="Recorded security and account events" icon={Activity} tone="amber" /></div><div className="grid gap-5 xl:grid-cols-3"><section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-black text-slate-900">Recent security activity</h2><p className="text-xs text-slate-400">Append-only, server-recorded events</p></div><button onClick={() => setTab('audit')} className="text-xs font-bold text-rose-700">View audit trail</button></div><div className="divide-y divide-slate-100">{logs.slice(0, 6).map((log) => <div key={log.id} className="flex gap-3 px-5 py-3"><div className="mt-1 h-2 w-2 rounded-full bg-rose-500" /><div className="min-w-0"><p className="text-xs font-bold text-slate-700">{log.action}</p><p className="mt-0.5 text-[11px] text-slate-400">{log.actorName || 'System'} · {log.module} · {log.performedAt}</p></div></div>)}{!logs.length && <p className="px-5 py-8 text-sm text-slate-400">No server audit events yet.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-900">Security posture</h2><div className="mt-4 space-y-4 text-xs"><p className="flex gap-2 text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Protected account actions are logged.</p><p className="flex gap-2 text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Sessions can be revoked remotely.</p><p className="flex gap-2 text-slate-600"><AlertTriangle className="h-4 w-4 text-amber-500" />MFA and password-policy enforcement are planned policy controls.</p></div></section></div></div>}
        {tab === 'accounts' && <section className="rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black text-slate-900">Account & access control</h2><p className="text-xs text-slate-400">Change status or revoke access without deleting accountable records.</p></div><label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-400"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a user" className="w-48 bg-transparent text-xs text-slate-700 outline-none" /></label></div><div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Account</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Controls</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredUsers.map((user) => <tr key={user.id}><td className="px-5 py-4"><p className="text-xs font-bold text-slate-800">{user.name}</p><p className="mt-1 text-[11px] text-slate-400">{user.email} · {user.id}</p></td><td className="px-5 py-4 text-xs font-semibold text-slate-600">{user.role}</td><td className="px-5 py-4"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(user.status)}`}>{user.status}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><select disabled={busyId === user.id || user.id === authSystemUser?.id} value={user.status} onChange={(event) => changeStatus(user, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-600 disabled:opacity-50">{STATUS_ACTIONS.map((status) => <option key={status}>{status}</option>)}</select><button disabled={busyId === `${user.id}-sessions` || user.id === authSystemUser?.id} onClick={() => revokeSessions(user)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">Revoke sessions</button></div></td></tr>)}{!filteredUsers.length && <tr><td colSpan="4" className="px-5 py-10 text-center text-sm text-slate-400">No accounts match your search.</td></tr>}</tbody></table></div></section>}
        {tab === 'audit' && <section className="rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-black text-slate-900">Audit trail</h2><p className="text-xs text-slate-400">Recorded by the server; users cannot edit or remove these entries.</p></div><div className="flex gap-2"><label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-400"><Search className="h-4 w-4" /><input value={logQuery} onChange={(event) => setLogQuery(event.target.value)} placeholder="Search events" className="w-36 bg-transparent text-xs text-slate-700 outline-none" /></label><select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-600">{modules.map((module) => <option key={module}>{module}</option>)}</select></div></div><div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">When</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Event</th><th className="px-5 py-3">Record</th><th className="px-5 py-3">IP address</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredLogs.map((log) => <tr key={log.id}><td className="whitespace-nowrap px-5 py-3 text-[11px] text-slate-500">{log.performedAt}</td><td className="px-5 py-3 text-xs font-bold text-slate-700">{log.actorName || 'System'}</td><td className="px-5 py-3"><p className="text-xs font-semibold text-slate-700">{log.action}</p><p className="text-[10px] text-slate-400">{log.module}</p></td><td className="px-5 py-3 font-mono text-[11px] text-slate-500">{log.recordId || '—'}</td><td className="px-5 py-3 font-mono text-[11px] text-slate-500">{log.ipAddress || '—'}</td></tr>)}{!filteredLogs.length && <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-400">No matching audit events.</td></tr>}</tbody></table></div></section>}
        {tab === 'policies' && <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6"><LockKeyhole className="h-7 w-7 text-rose-600" /><h2 className="mt-3 text-xl font-black text-slate-900">Privileged-access policy</h2><p className="mt-2 text-sm leading-6 text-slate-600">This release establishes the enforcement foundation: server-authorized Super Admin actions, account status controls, remote session revocation, and an append-only audit trail.</p><div className="mt-6 space-y-3">{[['Account lifecycle', 'Use Active, Suspended, Locked, and Inactive rather than deleting system accounts.'], ['Privileged roles', 'Only Super Administrators can manage Administrator and Super Admin accounts.'], ['Audit retention', 'Every login, logout, account change, and session revocation is recorded server-side.'], ['Next security hardening', 'Add MFA, password expiry, trusted-device checks, and configurable retention after the core workflow is approved.']].map(([title, text]) => <div key={title} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-800">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>)}</div></section>}
      </div>
    </main>
  </div>;
}
