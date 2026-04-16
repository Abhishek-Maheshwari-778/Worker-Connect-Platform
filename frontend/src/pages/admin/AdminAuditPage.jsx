import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, ShieldOff, ShieldCheck, Trash2, CheckCircle,
  XCircle, Flag, RefreshCw, Loader2, Search, Filter,
  Calendar, BarChart2, AlertTriangle, Info, User,
  Download, ChevronDown, ChevronRight, Clock,
  Award, Zap, Star, Activity, Eye
} from 'lucide-react';
import adminService from '@/services/adminService';
import { formatDate, timeAgo } from '@/utils/helpers';

/* ── Config ────────────────────────────────────────────────────────────────── */
const ACTION_CONFIG = {
  user_suspended:        { label: 'User Suspended',         icon: ShieldOff,    color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500'     },
  user_reactivated:      { label: 'User Reactivated',       icon: ShieldCheck,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500'   },
  user_deleted:          { label: 'User Deleted',           icon: Trash2,       color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300',    dot: 'bg-red-600'     },
  verification_approved: { label: 'Verification Approved',  icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500'    },
  verification_rejected: { label: 'Verification Rejected',  icon: XCircle,      color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', dot: 'bg-orange-500'  },
  job_deleted:           { label: 'Job Deleted',            icon: Trash2,       color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', dot: 'bg-orange-500'  },
  job_removed_fraud:     { label: 'Job Removed (Fraud)',    icon: Flag,         color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500'     },
  job_fraud_warned:      { label: 'Fraud Warning Sent',     icon: AlertTriangle,color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-500'   },
  job_fraud_cleared:     { label: 'Fraud Flag Cleared',     icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500'   },
  badges_recalculated:   { label: 'Badges Recalculated',    icon: Award,        color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200', dot: 'bg-purple-500'  },
  fraud_scan_run:        { label: 'Fraud Scan Run',         icon: Zap,          color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200', dot: 'bg-indigo-500'  },
  rating_deleted:        { label: 'Rating Deleted',         icon: Star,         color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-200',   dot: 'bg-rose-500'    },
  rating_unflagged:      { label: 'Rating Unflagged',       icon: CheckCircle,  color: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-200',   dot: 'bg-teal-500'    },
  custom:                { label: 'Custom Action',           icon: Activity,     color: 'text-gray-600',   bg: 'bg-gray-50',    border: 'border-gray-200',   dot: 'bg-gray-400'    },
};

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-800 border-red-200'    },
  warning:  { label: 'Warning',  cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  info:     { label: 'Info',     cls: 'bg-blue-100 text-blue-800 border-blue-200'  },
};

const CATEGORY_CONFIG = {
  user:         { label: 'User',         color: 'text-red-600',    bg: 'bg-red-50'     },
  verification: { label: 'Verification', color: 'text-blue-600',   bg: 'bg-blue-50'    },
  job:          { label: 'Job',          color: 'text-orange-600', bg: 'bg-orange-50'  },
  fraud:        { label: 'Fraud',        color: 'text-rose-600',   bg: 'bg-rose-50'    },
  system:       { label: 'System',       color: 'text-purple-600', bg: 'bg-purple-50'  },
  rating:       { label: 'Rating',       color: 'text-amber-600',  bg: 'bg-amber-50'   },
};

/* ── Stats bar ─────────────────────────────────────────────────────────────── */
const StatsBar = ({ stats }) => {
  const cards = [
    { label: 'Total Actions', value: stats?.total    || 0, icon: Activity,     color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Today',         value: stats?.today    || 0, icon: Clock,        color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Critical',      value: stats?.critical || 0, icon: AlertTriangle,color: 'text-red-600',    bg: 'bg-red-50'    },
    { label: 'Warnings',      value: stats?.warning  || 0, icon: Info,         color: 'text-amber-600',  bg: 'bg-amber-50'  },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-2xl border border-gray-100 p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <c.icon className={`w-4 h-4 ${c.color}`} />
            <p className="text-xs font-semibold text-gray-500">{c.label}</p>
          </div>
          <p className={`text-2xl font-display font-black ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
};

/* ── Category breakdown ─────────────────────────────────────────────────────── */
const CategoryBreakdown = ({ byCat = [] }) => {
  const max = byCat[0]?.count || 1;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-orange-400" /> Actions by Category
      </h3>
      <div className="space-y-2.5">
        {byCat.map(item => {
          const cfg = CATEGORY_CONFIG[item._id] || {};
          return (
            <div key={item._id} className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-20 text-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                {cfg.label || item._id}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-current ${cfg.color} transition-all duration-700`}
                  style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-600 w-8 text-right flex-shrink-0">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Top admins ─────────────────────────────────────────────────────────────── */
const TopAdmins = ({ byAdmin = [] }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <User className="w-4 h-4 text-orange-400" /> Most Active Admins
    </h3>
    <div className="space-y-3">
      {byAdmin.map((a, i) => (
        <div key={a._id} className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
            i === 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
          }`}>#{i+1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{a.adminName}</p>
            <p className="text-[10px] text-gray-400">{formatDate(a.lastAction)}</p>
          </div>
          <span className="text-sm font-black text-orange-600 flex-shrink-0">{a.count}</span>
        </div>
      ))}
      {byAdmin.length === 0 && <p className="text-sm text-gray-400 text-center py-3">No actions yet</p>}
    </div>
  </div>
);

/* ── Log entry row ──────────────────────────────────────────────────────────── */
const LogEntry = ({ log, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg  = ACTION_CONFIG[log.action] || ACTION_CONFIG.custom;
  const Icon = cfg.icon;
  const sev  = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />
      )}

      <div className={`relative flex gap-4 pb-4 group`}>
        {/* Icon dot */}
        <div className={`w-10 h-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 z-10 shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon className={`w-4 h-4 ${cfg.color}`} />
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 bg-white rounded-2xl border p-4 transition-all group-hover:shadow-sm ${
          log.severity === 'critical' ? 'border-red-100' : log.severity === 'warning' ? 'border-amber-100' : 'border-gray-100'
        }`}>
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sev.cls}`}>
                {sev.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(log.createdAt)}
            </span>
          </div>

          <p className="text-sm text-gray-800 font-medium leading-snug">{log.description}</p>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {/* Admin who did it */}
            <div className="flex items-center gap-1.5">
              <img
                src={log.adminId?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.adminName||'A')}&background=f97316&color=fff&size=20`}
                className="w-4 h-4 rounded-full flex-shrink-0"
                alt=""
              />
              <span className="font-semibold text-gray-700">{log.adminName}</span>
            </div>
            {log.targetName && (
              <>
                <span className="text-gray-300">·</span>
                <span>on <strong className="text-gray-700">{log.targetName}</strong></span>
              </>
            )}
            {log.ipAddress && (
              <>
                <span className="text-gray-300">·</span>
                <span className="font-mono text-[10px]">{log.ipAddress}</span>
              </>
            )}
          </div>

          {/* Expandable metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-orange-500 mt-2 transition-colors"
              >
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {expanded ? 'Hide details' : 'View details'}
              </button>
              {expanded && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-mono text-gray-600 overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(log.metadata, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Date group header ──────────────────────────────────────────────────────── */
const DateHeader = ({ date }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-gray-100" />
    <span className="text-[11px] font-bold text-gray-400 px-2 bg-white">{date}</span>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

/* ── Export button ──────────────────────────────────────────────────────────── */
const exportCSV = (logs) => {
  const headers = ['Date', 'Admin', 'Action', 'Category', 'Severity', 'Description', 'Target', 'IP'];
  const rows = logs.map(l => [
    new Date(l.createdAt).toLocaleString(),
    l.adminName,
    l.action,
    l.category,
    l.severity,
    `"${l.description.replace(/"/g, "'")}"`,
    l.targetName || '',
    l.ipAddress  || '',
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const AdminAuditPage = () => {
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('');
  const [severity,    setSeverity]    = useState('');
  const [action,      setAction]      = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-audit', { debouncedSearch, category, severity, action, dateFrom, dateTo, page }],
    queryFn:  () => adminService.getAuditLogs({
      search:   debouncedSearch || undefined,
      category: category       || undefined,
      severity: severity       || undefined,
      action:   action         || undefined,
      dateFrom: dateFrom       || undefined,
      dateTo:   dateTo         || undefined,
      page, limit: 25,
    }).then(r => r.data),
    keepPreviousData: true,
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const { data: summaryData } = useQuery({
    queryKey: ['admin-audit-summary'],
    queryFn:  () => adminService.getAuditSummary().then(r => r.data.data),
    staleTime: 60000,
  });

  const logs       = data?.data        || [];
  const total      = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;
  const stats      = data?.stats       || {};

  /* Group logs by date */
  const grouped = logs.reduce((acc, log) => {
    const day = formatDate(log.createdAt, 'dd MMM yyyy') || new Date(log.createdAt).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});

  const hasFilters = category || severity || action || dateFrom || dateTo || debouncedSearch;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
            <h1 className="page-title">Platform Audit Log</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Complete history of all admin actions.
            {total > 0 && <span className="ml-1 font-bold text-gray-700">{total} total entries</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all">
            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
          <button onClick={() => exportCSV(logs)} disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <StatsBar stats={stats} />

      {/* ── Summary charts ── */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CategoryBreakdown byCat={summaryData.byCat || []} />
          <TopAdmins byAdmin={summaryData.byAdmin || []} />
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="space-y-2.5">
        <div className="flex gap-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by admin, action, target…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
              showFilters || hasFilters
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
          </button>
          {hasFilters && (
            <button
              onClick={() => { setCategory(''); setSeverity(''); setAction(''); setDateFrom(''); setDateTo(''); setSearch(''); }}
              className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 px-2">
              Clear all
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-indigo-400">
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-indigo-400">
              <option value="">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-indigo-400">
              <option value="">All Actions</option>
              {Object.entries(ACTION_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1 block">From Date</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1 block">To Date</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-indigo-400" />
            </div>
          </div>
        )}
      </div>

      {/* ── Timeline Log ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 space-y-2 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-48" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-indigo-300" />
          </div>
          <p className="font-bold text-gray-500 text-lg">No audit logs found</p>
          <p className="text-sm text-gray-400 mt-1">
            {hasFilters ? 'Try adjusting your filters' : 'Admin actions will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-bold text-gray-700">
              Showing {logs.length} of {total} entries
            </p>
            {isFetching && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
          </div>

          {/* Grouped timeline */}
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <DateHeader date={date} />
              {dayLogs.map((log, i) => (
                <LogEntry
                  key={log._id}
                  log={log}
                  isLast={i === dayLogs.length - 1 && date === Object.keys(grouped)[Object.keys(grouped).length - 1]}
                />
              ))}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-indigo-300 disabled:opacity-40 transition-all">
                ← Prev
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-indigo-300 disabled:opacity-40 transition-all">
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAuditPage;