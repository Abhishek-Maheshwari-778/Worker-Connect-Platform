import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, AlertTriangle, Zap, Eye, Trash2,
  CheckCircle, RefreshCw, Loader2, Search,
  ChevronDown, ChevronUp, X, Flag, TrendingUp,
  Clock, Users, IndianRupee, Copy, BarChart2,
  Ban, FileText, Bell, ExternalLink, Filter
} from 'lucide-react';
import adminService from '@/services/adminService';
import { formatDate, timeAgo } from '@/utils/helpers';
import { useSocket } from '@/context/SocketContext';
import toast from 'react-hot-toast';

/* ── Rule config ───────────────────────────────────────────────────────────── */
const RULE_CONFIG = {
  duplicate_title:  { label: 'Duplicate Title',     icon: Copy,         color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200' },
  high_wage:        { label: 'Suspicious High Wage', icon: IndianRupee,  color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200'    },
  ghost_job:        { label: 'Ghost Job',            icon: Eye,          color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200' },
  never_completed:  { label: 'Never Completes',      icon: Ban,          color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-300'    },
  rapid_posting:    { label: 'Rapid Posting',        icon: Zap,          color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
  no_hire_pattern:  { label: 'No Hire Pattern',      icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  bait_wage:        { label: 'Bait Wage',            icon: AlertTriangle,color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-200'   },
};

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-800 border-red-300',    dot: 'bg-red-500'    },
  high:     { label: 'High',     cls: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   cls: 'bg-amber-100 text-amber-800 border-amber-300',    dot: 'bg-amber-500'  },
  low:      { label: 'Low',      cls: 'bg-blue-100 text-blue-800 border-blue-200',       dot: 'bg-blue-400'   },
};

const ACTION_CONFIG = {
  cleared: { label: 'Cleared',  cls: 'bg-green-100 text-green-700 border-green-200'  },
  warned:  { label: 'Warned',   cls: 'bg-amber-100 text-amber-700 border-amber-200'  },
  removed: { label: 'Removed',  cls: 'bg-red-100 text-red-700 border-red-200'        },
  none:    { label: 'Pending',  cls: 'bg-gray-100 text-gray-600 border-gray-200'     },
};

/* ── Score ring ────────────────────────────────────────────────────────────── */
const ScoreRing = ({ score = 0, size = 48 }) => {
  const r     = size * 0.38;
  const circ  = 2 * Math.PI * r;
  const fill  = (score / 100) * circ;
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f97316' : score >= 20 ? '#f59e0b' : '#22c55e';
  const label = score >= 70 ? 'Critical' : score >= 40 ? 'High' : score >= 20 ? 'Med' : 'Low';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size*0.08} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.08}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black leading-none" style={{ fontSize: size * 0.22, color }}>{score}</span>
        <span className="font-semibold leading-none text-gray-400" style={{ fontSize: size * 0.14 }}>{label}</span>
      </div>
    </div>
  );
};

/* ── Stats overview cards ──────────────────────────────────────────────────── */
const StatsRow = ({ stats }) => {
  const ov = stats?.overview || {};
  const cards = [
    { label: 'Total Flagged',  value: ov.flagged  || 0, icon: Flag,         color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100'    },
    { label: 'Critical',       value: ov.critical  || 0, icon: AlertTriangle, color: 'text-red-700',   bg: 'bg-red-100',   border: 'border-red-200'    },
    { label: 'Jobs Removed',   value: ov.removed  || 0, icon: Trash2,        color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Cleared Clean',  value: ov.cleared  || 0, icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100'  },
    { label: 'Avg Risk Score', value: Math.round(ov.avgScore || 0), icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', suffix: '/100' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-2xl border ${c.border} p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <c.icon className={`w-4 h-4 ${c.color}`} />
            <p className="text-xs font-semibold text-gray-500">{c.label}</p>
          </div>
          <p className={`text-2xl font-display font-black ${c.color}`}>
            {c.value}{c.suffix || ''}
          </p>
        </div>
      ))}
    </div>
  );
};

/* ── Fraud type breakdown ──────────────────────────────────────────────────── */
const TypeBreakdown = ({ byType = [] }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <BarChart2 className="w-4 h-4 text-orange-400" /> Fraud Type Breakdown
    </h3>
    <div className="space-y-2.5">
      {byType.map(item => {
        const cfg = RULE_CONFIG[item._id] || {};
        const Icon = cfg.icon || Flag;
        const max = byType[0]?.count || 1;
        return (
          <div key={item._id} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg ${cfg.bg || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-3.5 h-3.5 ${cfg.color || 'text-gray-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 bg-current ${cfg.color || 'text-orange-500'}`}
                  style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-700 w-4 text-right">{item.count}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.label || item._id}
              </span>
            </div>
          </div>
        );
      })}
      {byType.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No fraud detected yet</p>
      )}
    </div>
  </div>
);

/* ── Top offenders ─────────────────────────────────────────────────────────── */
const TopOffenders = ({ offenders = [] }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-red-400" /> Top Offenders
    </h3>
    <div className="space-y-3">
      {offenders.map((o, i) => (
        <div key={o._id} className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
            i === 0 ? 'bg-red-100 text-red-700' : i === 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
          }`}>#{i + 1}</span>
          <img
            src={o.user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(o.user?.name||'U')}&background=f97316&color=fff&size=32`}
            className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
            alt={o.user?.name}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{o.user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{o.user?.email}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-black text-red-600">{o.count} jobs</p>
            <p className="text-[10px] text-gray-400">avg {Math.round(o.avgScore)} score</p>
          </div>
        </div>
      ))}
      {offenders.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No repeat offenders</p>
      )}
    </div>
  </div>
);

/* ── Flag chip ─────────────────────────────────────────────────────────────── */
const FlagChip = ({ flag }) => {
  const cfg  = RULE_CONFIG[flag.type] || {};
  const Icon = cfg.icon || Flag;
  const sev  = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.low;
  return (
    <span title={flag.description}
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border} cursor-help`}>
      <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
      <Icon className="w-2.5 h-2.5" />
      {cfg.label || flag.type}
    </span>
  );
};

/* ── Review Modal ──────────────────────────────────────────────────────────── */
const ReviewModal = ({ job, onClose, onSuccess }) => {
  const [action, setAction] = useState('warned');
  const [note,   setNote]   = useState('');
  const qc = useQueryClient();

  const reviewMut = useMutation({
    mutationFn: () => adminService.reviewFraudJob(job._id, { action, note }),
    onSuccess: () => {
      toast.success(`Job ${action} successfully`);
      qc.invalidateQueries(['admin-fraud-jobs']);
      qc.invalidateQueries(['admin-fraud-stats']);
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  const ACTIONS = [
    { value: 'cleared', label: 'Clear — Not Fraud',   icon: CheckCircle, cls: 'border-green-300 bg-green-50 text-green-700',  desc: 'Remove all flags. Job is legitimate.' },
    { value: 'warned',  label: 'Warn Client',          icon: Bell,        cls: 'border-amber-300 bg-amber-50 text-amber-700',  desc: 'Send warning notification to client.' },
    { value: 'removed', label: 'Remove Job',           icon: Trash2,      cls: 'border-red-300 bg-red-50 text-red-700',        desc: 'Cancel job and notify client.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-100 text-xs font-bold uppercase tracking-widest mb-1">Review Flagged Job</p>
              <p className="font-display font-bold text-white text-lg leading-snug">{job.title}</p>
              <p className="text-red-200 text-xs mt-1">by {job.postedBy?.name} · Score: {job.fraudScore}/100</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Flags summary */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Detected Issues:</p>
            <div className="flex flex-wrap gap-1.5">
              {(job.fraudFlags || []).map((f, i) => <FlagChip key={i} flag={f} />)}
            </div>
          </div>

          {/* Flag details */}
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {(job.fraudFlags || []).map((f, i) => {
              const cfg = RULE_CONFIG[f.type] || {};
              return (
                <div key={i} className={`text-xs p-2.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <p className={`font-bold ${cfg.color} mb-0.5`}>{cfg.label || f.type}</p>
                  <p className="text-gray-600">{f.description}</p>
                </div>
              );
            })}
          </div>

          {/* Action selection */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Take Action:</p>
            <div className="space-y-2">
              {ACTIONS.map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.value}
                    onClick={() => setAction(a.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      action === a.value ? a.cls + ' ring-2 ring-offset-1 ring-current' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${action === a.value ? '' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm font-bold ${action === a.value ? '' : 'text-gray-700'}`}>{a.label}</p>
                      <p className={`text-[11px] ${action === a.value ? 'opacity-80' : 'text-gray-400'}`}>{a.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Admin Note (included in client notification)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Optional: explain the reason for this action..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={() => reviewMut.mutate()}
              disabled={reviewMut.isPending}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white text-sm font-bold hover:from-red-600 hover:to-rose-700 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
              {reviewMut.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                : <><Shield className="w-4 h-4" /> Confirm Action</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Job card ──────────────────────────────────────────────────────────────── */
const FraudJobCard = ({ job, onReview }) => {
  const [expanded, setExpanded] = useState(false);
  const sev    = job.fraudScore >= 70 ? 'critical' : job.fraudScore >= 40 ? 'high' : job.fraudScore >= 20 ? 'medium' : 'low';
  const sevCfg = SEVERITY_CONFIG[sev];
  const actCfg = ACTION_CONFIG[job.fraudAction || 'none'];

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
      sev === 'critical' ? 'border-red-200 shadow-sm shadow-red-50'
      : sev === 'high'   ? 'border-orange-200'
                         : 'border-gray-100'
    }`}>
      {/* Top severity bar */}
      <div className={`h-1 w-full ${
        sev === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-500'
        : sev === 'high'   ? 'bg-gradient-to-r from-orange-400 to-amber-400'
        : sev === 'medium' ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                           : 'bg-gradient-to-r from-blue-300 to-blue-400'
      }`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4">
          <ScoreRing score={job.fraudScore} size={52} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-gray-900 text-base leading-snug">{job.title}</h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sevCfg.cls}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${sevCfg.dot} mr-1`} />
                  {sevCfg.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actCfg.cls}`}>
                  {actCfg.label}
                </span>
              </div>
            </div>

            {/* Client info */}
            <div className="flex items-center gap-2 mb-2">
              <img
                src={job.postedBy?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.postedBy?.name||'U')}&background=f97316&color=fff&size=24`}
                className="w-5 h-5 rounded-full flex-shrink-0"
                alt=""
              />
              <span className="text-xs text-gray-600 font-medium">{job.postedBy?.name}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{job.postedBy?.email}</span>
              {job.postedBy?.isSuspended && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Suspended</span>
              )}
            </div>

            {/* Job meta */}
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span className="capitalize font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{job.category}</span>
              <span>₹{job.budgetMin}–₹{job.budgetMax}/{job.budgetType}</span>
              <span className={`font-semibold capitalize ${
                job.status === 'open' ? 'text-green-600' : job.status === 'cancelled' ? 'text-red-500' : 'text-gray-500'
              }`}>{job.status}</span>
              <span>{timeAgo(job.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Flag chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(job.fraudFlags || []).map((f, i) => <FlagChip key={i} flag={f} />)}
        </div>

        {/* Expandable details */}
        {expanded && (
          <div className="mt-4 space-y-2 border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-600 mb-2">Flag Details:</p>
            {(job.fraudFlags || []).map((f, i) => {
              const cfg = RULE_CONFIG[f.type] || {};
              return (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <div className={`w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {cfg.icon && <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{f.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Detected {formatDate(f.detectedAt)}</p>
                  </div>
                </div>
              );
            })}
            {job.fraudNote && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-600 mb-1">Admin Note:</p>
                <p className="text-xs text-gray-700">{job.fraudNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Less' : 'Details'}
          </button>
          <div className="flex-1" />
          {job.fraudAction === 'none' && (
            <button
              onClick={() => onReview(job)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold hover:from-red-600 hover:to-rose-700 transition-all shadow-sm shadow-red-200">
              <Shield className="w-3.5 h-3.5" /> Review
            </button>
          )}
          {job.fraudAction !== 'none' && (
            <button
              onClick={() => onReview(job)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Re-review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const AdminFraudPage = () => {
  const qc              = useQueryClient();
  const { on }          = useSocket();
  const [reviewJob,     setReviewJob]     = useState(null);
  const [search,        setSearch]        = useState('');
  const [severityFilter,setSeverityFilter]= useState('');
  const [typeFilter,    setTypeFilter]    = useState('');
  const [page,          setPage]          = useState(1);
  const [liveAlert,     setLiveAlert]     = useState(null);

  /* Fetch flagged jobs */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-fraud-jobs', { severityFilter, typeFilter, page }],
    queryFn:  () => adminService.getFraudJobs({
      severity: severityFilter || undefined,
      type:     typeFilter     || undefined,
      page, limit: 12,
    }).then(r => r.data),
    keepPreviousData: true,
  });

  /* Fetch stats */
  const { data: statsData } = useQuery({
    queryKey: ['admin-fraud-stats'],
    queryFn:  () => adminService.getFraudStats().then(r => r.data.data),
    staleTime: 60000,
  });

  /* Scan mutation */
  const scanMut = useMutation({
    mutationFn: () => adminService.runFraudScan(),
    onSuccess: (res) => {
      toast.success(`✅ Scan complete: ${res.data.data.newlyFlagged} suspicious jobs found`);
      qc.invalidateQueries(['admin-fraud-jobs']);
      qc.invalidateQueries(['admin-fraud-stats']);
    },
    onError: () => toast.error('Scan failed'),
  });

  /* Real-time socket — new fraud flag from server */
  useEffect(() => {
    const off = on('fraud:new-flag', ({ title, fraudScore, flags }) => {
      setLiveAlert({ title, fraudScore, flags });
      qc.invalidateQueries(['admin-fraud-jobs']);
      qc.invalidateQueries(['admin-fraud-stats']);
      setTimeout(() => setLiveAlert(null), 8000);
    });
    return () => off?.();
  }, [on, qc]);

  const jobs       = data?.data        || [];
  const total      = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  /* Client-side search filter */
  const filtered = search.trim()
    ? jobs.filter(j =>
        j.title?.toLowerCase().includes(search.toLowerCase()) ||
        j.postedBy?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : jobs;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <h1 className="page-title">Job Fraud Detection</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Automatically detect and review suspicious job postings.
            {total > 0 && <span className="font-bold text-red-600 ml-1">{total} flagged</span>}
          </p>
        </div>
        <button
          onClick={() => scanMut.mutate()}
          disabled={scanMut.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white text-sm font-bold hover:from-red-600 hover:to-rose-700 transition-all shadow-md shadow-red-100 disabled:opacity-60"
        >
          {scanMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {scanMut.isPending ? 'Scanning…' : 'Run Full Scan'}
        </button>
      </div>

      {/* ── Live alert ── */}
      {liveAlert && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl animate-fade-in">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-800">🚨 New Fraud Alert</p>
            <p className="text-xs text-red-600 truncate">"{liveAlert.title}" flagged with score {liveAlert.fraudScore}/100</p>
          </div>
          <button onClick={() => setLiveAlert(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Stats row ── */}
      <StatsRow stats={statsData} />

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TypeBreakdown byType={statsData?.byType || []} />
        <TopOffenders offenders={statsData?.topOffenders || []} />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search job title or client…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>
        <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-red-400">
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-red-400">
          <option value="">All Types</option>
          {Object.entries(RULE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {isFetching && <div className="flex items-center"><Loader2 className="w-4 h-4 text-red-400 animate-spin" /></div>}
      </div>

      {/* ── Job cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-3xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="font-bold text-gray-700 text-lg">
            {search ? `No results for "${search}"` : 'No suspicious jobs found'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {search ? 'Try a different search term' : 'Run a scan to check for suspicious patterns'}
          </p>
          {!search && (
            <button onClick={() => scanMut.mutate()} disabled={scanMut.isPending}
              className="mt-5 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              <RefreshCw className="w-4 h-4" /> Run Scan Now
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(job => (
              <FraudJobCard key={job._id} job={job} onReview={setReviewJob} />
            ))}
          </div>

          {/* Pagination */}
          {!search && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                    page === p ? 'bg-red-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
                  }`}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Detection Rules Reference ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Flag className="w-4 h-4 text-red-400" /> Detection Rules Reference
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(RULE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const scoreMap = { duplicate_title:25, high_wage:20, ghost_job:30, never_completed:35, rapid_posting:20, no_hire_pattern:15, bait_wage:25 };
            return (
              <div key={key} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">+{scoreMap[key]} fraud score</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {reviewJob && (
        <ReviewModal
          job={reviewJob}
          onClose={() => setReviewJob(null)}
          onSuccess={() => setReviewJob(null)}
        />
      )}
    </div>
  );
};

export default AdminFraudPage;