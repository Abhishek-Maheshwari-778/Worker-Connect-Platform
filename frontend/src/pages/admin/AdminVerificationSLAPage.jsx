import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, Clock, AlertTriangle, CheckCircle,
  RefreshCw, Loader2, Search, Filter, X,
  User, Building2, FileText, Eye, ExternalLink,
  TrendingUp, Zap, Target, BarChart2, Bell
} from 'lucide-react';
import adminService from '@/services/adminService';
import Avatar from '@/components/common/Avatar';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

/* ── SLA config ─────────────────────────────────────────────────────────────── */
const SLA_CONFIG = {
  green: {
    label:   'On Time',
    cls:     'bg-green-100 text-green-800 border-green-200',
    barCls:  'bg-green-500',
    ringCls: 'stroke-green-500',
    badge:   'bg-green-50 text-green-700 border-green-200',
    glow:    '',
  },
  amber: {
    label:   'Due Soon',
    cls:     'bg-amber-100 text-amber-800 border-amber-200',
    barCls:  'bg-amber-500',
    ringCls: 'stroke-amber-500',
    badge:   'bg-amber-50 text-amber-700 border-amber-200',
    glow:    'shadow-amber-100',
  },
  red: {
    label:   'OVERDUE',
    cls:     'bg-red-100 text-red-800 border-red-200 animate-pulse',
    barCls:  'bg-red-500',
    ringCls: 'stroke-red-500',
    badge:   'bg-red-50 text-red-700 border-red-200',
    glow:    'shadow-red-100 border-red-200',
  },
};

/* ── Hours clock ring ───────────────────────────────────────────────────────── */
const SLARing = ({ hours, size = 52 }) => {
  const maxHours = 48;
  const pct  = Math.min(hours / maxHours, 1);
  const r    = size * 0.38;
  const circ = 2 * Math.PI * r;
  const fill = pct * circ;
  const color = hours < 12 ? '#22c55e' : hours < 24 ? '#f59e0b' : '#ef4444';
  const bgColor = hours < 12 ? '#dcfce7' : hours < 24 ? '#fef3c7' : '#fee2e2';
  const label = hours < 1 ? `${Math.round(hours * 60)}m` : `${hours.toFixed(1)}h`;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill={bgColor} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size*0.09} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black leading-none" style={{ fontSize: size * 0.22, color }}>{label}</span>
        <span className="text-gray-400 leading-none" style={{ fontSize: size * 0.13 }}>waiting</span>
      </div>
    </div>
  );
};

/* ── Progress bar ────────────────────────────────────────────────────────────── */
const SLABar = ({ hours }) => {
  const pct   = Math.min((hours / 24) * 100, 100);
  const color = hours < 12 ? 'bg-green-500' : hours < 24 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-gray-400">0h</span>
        <span className="text-gray-500 font-bold">24h SLA target</span>
        <span className="text-gray-400">48h</span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* SLA marker at 24h (50%) */}
        <div className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-60" style={{ left: '50%' }} />
        <div className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min((hours / 48) * 100, 100)}%` }} />
      </div>
    </div>
  );
};

/* ── Verification card ──────────────────────────────────────────────────────── */
const VerifCard = ({ profile, onReview }) => {
  const sc      = SLA_CONFIG[profile.slaStatus] || SLA_CONFIG.green;
  const isClient= profile.profileType === 'client';
  const docUrl  = profile.aadhaarDoc?.url;

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-md ${
      profile.slaStatus === 'red'   ? 'border-red-200 shadow-sm shadow-red-50'
      : profile.slaStatus === 'amber' ? 'border-amber-200'
                                      : 'border-gray-100'
    }`}>
      {/* SLA colour bar */}
      <div className={`h-1 w-full ${
        profile.slaStatus === 'red'   ? 'bg-red-500'
        : profile.slaStatus === 'amber' ? 'bg-amber-400'
                                        : 'bg-green-500'
      }`} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* SLA ring */}
          <SLARing hours={profile.hoursWaiting} size={56} />

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
              <div className="flex items-center gap-2">
                <Avatar src={profile.user?.avatar?.url} name={profile.user?.name} size="sm" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{profile.user?.name}</p>
                  <p className="text-xs text-gray-400">{profile.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sc.cls}`}>
                  {sc.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  isClient ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  {isClient ? <><Building2 className="w-2.5 h-2.5 inline mr-0.5" />Client</> : <><User className="w-2.5 h-2.5 inline mr-0.5" />Labour</>}
                </span>
              </div>
            </div>

            {/* SLA progress bar */}
            <div className="mt-2 mb-3">
              <SLABar hours={profile.hoursWaiting} />
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Submitted {formatDate(profile.submittedAt)}
              </span>
              {profile.user?.phone && (
                <span className="font-mono">{profile.user.phone}</span>
              )}
              {profile.isBreached && (
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  SLA BREACHED by {Math.round(profile.hoursWaiting - 24)}h
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Doc preview + action */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {docUrl && (
              <a href={docUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors">
                <Eye className="w-3.5 h-3.5" /> View Doc
              </a>
            )}
            {!docUrl && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <FileText className="w-3 h-3" /> No document uploaded
              </span>
            )}
          </div>
          <button onClick={() => onReview(profile)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm ${
              profile.slaStatus === 'red'
                ? 'bg-red-500 hover:bg-red-600 shadow-red-100'
                : 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-100'
            }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {profile.slaStatus === 'red' ? 'Review NOW' : 'Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Review modal ────────────────────────────────────────────────────────────── */
const ReviewModal = ({ profile, onClose }) => {
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const mut = useMutation({
    mutationFn: (action) => adminService.reviewVerification(profile._id, {
      action, reviewNote: note, profileType: profile.profileType,
    }),
    onSuccess: (_, action) => {
      toast.success(`✅ Verification ${action}`);
      qc.invalidateQueries(['admin-verif-sla']);
      qc.invalidateQueries(['admin-verifications']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  const sc     = SLA_CONFIG[profile.slaStatus] || SLA_CONFIG.green;
  const docUrl = profile.aadhaarDoc?.url;
  const isClient = profile.profileType === 'client';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className={`px-6 py-5 ${
          profile.slaStatus === 'red'   ? 'bg-gradient-to-br from-red-500 to-red-600'
          : profile.slaStatus === 'amber' ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                                          : 'bg-gradient-to-br from-green-500 to-emerald-600'
        } sticky top-0`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <SLARing hours={profile.hoursWaiting} size={44} />
              <div>
                <p className="font-bold text-white">{profile.user?.name}</p>
                <p className="text-white/70 text-xs">{profile.slaLabel} · {profile.hoursWaiting}h waiting</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <Avatar src={profile.user?.avatar?.url} name={profile.user?.name} size="lg" />
            <div>
              <p className="font-bold text-gray-900">{profile.user?.name}</p>
              <p className="text-sm text-gray-500">{profile.user?.email}</p>
              {profile.user?.phone && <p className="text-xs text-gray-400 font-mono">{profile.user.phone}</p>}
              <p className="text-xs text-gray-400 mt-1 capitalize">{isClient ? 'Client' : 'Labour'} · Submitted {formatDate(profile.submittedAt)}</p>
            </div>
          </div>

          {/* SLA bar */}
          <SLABar hours={profile.hoursWaiting} />

          {/* Document */}
          {docUrl ? (
            <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Aadhaar Document
                </span>
                <a href={docUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Full Size
                </a>
              </div>
              {!docUrl.toLowerCase().includes('.pdf') && (
                <img src={docUrl} alt="Aadhaar" className="w-full max-h-40 object-contain bg-gray-100 p-2" />
              )}
              {docUrl.toLowerCase().includes('.pdf') && (
                <div className="p-4 text-center text-sm text-gray-500">PDF document — click "Open Full Size" to view</div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 text-center">
              ⚠️ No document uploaded yet
            </div>
          )}

          {/* Review note */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Review Note (sent to user if rejected)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="e.g. Document unclear, please reupload..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-orange-400" />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => mut.mutate('rejected')} disabled={mut.isPending}
              className="flex-1 py-2.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-60">
              ✗ Reject
            </button>
            <button onClick={() => mut.mutate('approved')} disabled={mut.isPending}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
              {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {mut.isPending ? 'Processing…' : '✓ Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function AdminVerificationSLAPage() {
  const qc = useQueryClient();
  const [selected,    setSelected]   = useState(null);
  const [filterSLA,   setFilterSLA]  = useState('');
  const [filterType,  setFilterType] = useState('');
  const [search,      setSearch]     = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-verif-sla', { filterType }],
    queryFn:  () => adminService.getVerificationSLA({ type: filterType || undefined }).then(r => r.data.data),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const all    = data?.pending || [];
  const stats  = data?.stats   || {};

  const filtered = all.filter(p => {
    if (filterSLA && p.slaStatus !== filterSLA) return false;
    if (search && !p.user?.name?.toLowerCase().includes(search.toLowerCase()) && !p.user?.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort: red first, then amber, then green, then by hours desc
  const SLA_ORDER = { red: 0, amber: 1, green: 2 };
  const sorted = [...filtered].sort((a, b) => {
    const so = SLA_ORDER[a.slaStatus] - SLA_ORDER[b.slaStatus];
    return so !== 0 ? so : b.hoursWaiting - a.hoursWaiting;
  });

  const STAT_CARDS = [
    { label: 'Total Pending',   value: stats.total          || 0, color: 'text-blue-700',   bg: 'bg-blue-50',   icon: Clock         },
    { label: 'SLA Breached',    value: stats.breached        || 0, color: 'text-red-700',    bg: 'bg-red-50',    icon: AlertTriangle  },
    { label: 'Due Soon',        value: stats.dueSoon         || 0, color: 'text-amber-700',  bg: 'bg-amber-50',  icon: Bell           },
    { label: 'On Time',         value: stats.onTime          || 0, color: 'text-green-700',  bg: 'bg-green-50',  icon: CheckCircle    },
    { label: 'Resolved Today',  value: stats.resolvedToday   || 0, color: 'text-purple-700', bg: 'bg-purple-50', icon: ShieldCheck    },
    { label: 'Avg Resolution',  value: `${stats.avgResolutionTime || 0}h`, color: 'text-indigo-700', bg: 'bg-indigo-50', icon: Target },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-green-600" />
            </div>
            <h1 className="page-title">Verification SLA Tracker</h1>
          </div>
          <p className="text-slate-500 text-sm">
            24-hour SLA target · {stats.total || 0} pending
            {stats.breached > 0 && <span className="ml-1 font-bold text-red-600 animate-pulse">⚠️ {stats.breached} breached</span>}
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-green-300 transition-all">
          {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      </div>

      {/* SLA gauge row */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-700 text-sm">Overall SLA Compliance</p>
            <span className={`text-lg font-display font-black ${
              (stats.slaRate || 0) >= 80 ? 'text-green-600' : (stats.slaRate || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>{stats.slaRate || 0}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${
              (stats.slaRate || 0) >= 80 ? 'bg-green-500' : (stats.slaRate || 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`} style={{ width: `${stats.slaRate || 0}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5">
            <span>0%</span>
            <span className="font-semibold text-green-600">Target: 80%+</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl border border-gray-100 p-4`}>
            <div className="flex items-center gap-2 mb-1.5">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <p className="text-[10px] font-semibold text-gray-500 leading-tight">{c.label}</p>
            </div>
            <p className={`text-xl font-display font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* SLA legend */}
      <div className="flex items-center gap-4 px-1">
        <p className="text-xs font-bold text-gray-500">SLA Status:</p>
        {[
          { color: 'bg-green-500', label: '< 12h — On Time'  },
          { color: 'bg-amber-500', label: '12–24h — Due Soon' },
          { color: 'bg-red-500',   label: '> 24h — Overdue'  },
        ].map(s => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-3 h-3 rounded-full ${s.color}`} /> {s.label}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400" />
        </div>
        <select value={filterSLA} onChange={e => setFilterSLA(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-green-400">
          <option value="">All SLA</option>
          <option value="red">🔴 Overdue</option>
          <option value="amber">🟡 Due Soon</option>
          <option value="green">🟢 On Time</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-green-400">
          <option value="">All Types</option>
          <option value="labour">Labour Only</option>
          <option value="client">Client Only</option>
        </select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
          <p className="font-bold text-gray-500 text-lg">No pending verifications</p>
          <p className="text-sm text-gray-400 mt-1">
            {filterSLA || search ? 'Try adjusting your filters' : 'All documents reviewed — great work!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.map(p => (
            <VerifCard key={p._id} profile={p} onReview={setSelected} />
          ))}
        </div>
      )}

      {/* Review modal */}
      {selected && <ReviewModal profile={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}