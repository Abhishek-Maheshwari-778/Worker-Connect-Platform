import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Clock, CheckCircle, MessageCircle,
  ChevronRight, Shield, Users, Briefcase, Search,
  Filter, RefreshCw, Loader2, X, FileText, Bell
} from 'lucide-react';
import disputeService from '@/services/disputeService';
import { timeAgo, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  open:              { label: 'Open',           cls: 'bg-blue-100 text-blue-800 border-blue-200',       dot: 'bg-blue-500'    },
  under_review:      { label: 'Under Review',   cls: 'bg-amber-100 text-amber-800 border-amber-200',    dot: 'bg-amber-500'   },
  awaiting_response: { label: 'Awaiting',       cls: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500'  },
  resolved:          { label: 'Resolved',       cls: 'bg-green-100 text-green-800 border-green-200',    dot: 'bg-green-500'   },
  closed:            { label: 'Closed',         cls: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400'    },
  escalated:         { label: 'Escalated',      cls: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500'  },
};

const PRIORITY_CLR = {
  urgent: 'bg-red-100 text-red-800 border-red-300',
  high:   'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low:    'bg-blue-100 text-blue-800 border-blue-200',
};

const TYPE_LABELS = {
  payment_not_made: 'Payment Not Made', work_not_done: 'Work Not Done',
  work_quality: 'Poor Work Quality', harassment: 'Harassment',
  fraud: 'Fraud', contract_breach: 'Contract Breach',
  unsafe_conditions: 'Unsafe Conditions', other: 'Other',
};

const RESOLUTION_OPTIONS = [
  { value: 'favour_client',      label: 'Favour Client'       },
  { value: 'favour_labour',      label: 'Favour Worker'       },
  { value: 'mutual_agreement',   label: 'Mutual Agreement'    },
  { value: 'no_action',          label: 'No Action Required'  },
  { value: 'escalated_external', label: 'Escalate Externally' },
];

/* ── Review Modal ──────────────────────────────────────────────────────────── */
function ReviewModal({ dispute, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    status:         dispute.status,
    priority:       dispute.priority,
    resolution:     dispute.resolution || '',
    resolutionNote: dispute.resolutionNote || '',
    adminNotes:     dispute.adminNotes || '',
    dueDate:        dispute.dueDate ? dispute.dueDate.split('T')[0] : '',
  });

  const mut = useMutation({
    mutationFn: () => disputeService.review(dispute._id, form),
    onSuccess: () => {
      toast.success('Dispute updated');
      qc.invalidateQueries(['admin-disputes']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  const isResolving = ['resolved','closed'].includes(form.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-5 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Review Dispute</p>
              <p className="text-white font-bold text-base leading-snug">{dispute.disputeId}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{dispute.title?.slice(0, 60)}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Parties summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-400 mb-1">RAISED BY</p>
              <div className="flex items-center gap-2">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dispute.raisedBy?.name||'U')}&background=3b82f6&color=fff&size=28`} className="w-7 h-7 rounded-lg" alt="" />
                <div className="min-w-0"><p className="text-xs font-bold text-gray-800 truncate">{dispute.raisedBy?.name}</p><p className="text-[10px] text-gray-400">{dispute.raisedBy?.email}</p></div>
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[10px] font-bold text-red-400 mb-1">AGAINST</p>
              <div className="flex items-center gap-2">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dispute.against?.name||'U')}&background=ef4444&color=fff&size=28`} className="w-7 h-7 rounded-lg" alt="" />
                <div className="min-w-0"><p className="text-xs font-bold text-gray-800 truncate">{dispute.against?.name}</p><p className="text-[10px] text-gray-400">{dispute.against?.email}</p></div>
              </div>
            </div>
          </div>

          {/* Job */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-gray-700">{dispute.job?.title}</p>
            {dispute.amount && <span className="ml-auto text-xs font-black text-red-600">₹{dispute.amount.toLocaleString()}</span>}
          </div>

          {/* Description */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 max-h-24 overflow-y-auto">
            <p className="text-xs text-gray-600 leading-relaxed">{dispute.description}</p>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
              {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
              {['urgent','high','medium','low'].map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>

          {/* Resolution — only when resolving */}
          {isResolving && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Resolution Decision *</label>
                <select value={form.resolution} onChange={e => setForm(f => ({...f, resolution: e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                  <option value="">Select resolution…</option>
                  {RESOLUTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Resolution Note (sent to both parties)</label>
                <textarea value={form.resolutionNote} onChange={e => setForm(f => ({...f, resolutionNote: e.target.value}))}
                  rows={3} placeholder="Explain the resolution decision…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-indigo-400" />
              </div>
            </>
          )}

          {/* Admin notes (private) */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block flex items-center gap-1">
              <FileText className="w-3 h-3" /> Admin Notes (private)
            </label>
            <textarea value={form.adminNotes} onChange={e => setForm(f => ({...f, adminNotes: e.target.value}))}
              rows={2} placeholder="Internal notes not visible to parties…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-indigo-400" />
          </div>

          {/* Due date */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Response Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={() => mut.mutate()} disabled={mut.isPending || (isResolving && !form.resolution)}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {mut.isPending ? 'Saving…' : 'Update Dispute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Dispute row card ──────────────────────────────────────────────────────── */
function DisputeRow({ d, onReview }) {
  const sc  = STATUS_CONFIG[d.status] || STATUS_CONFIG.open;
  const pc  = PRIORITY_CLR[d.priority] || PRIORITY_CLR.medium;
  const unread = !d.viewedByAdmin;

  return (
    <div className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
      unread ? 'border-orange-200 shadow-sm shadow-orange-50' : 'border-gray-100'
    }`}>
      <div className="flex items-start gap-4">
        {/* Priority indicator */}
        <div className={`w-2 h-16 rounded-full flex-shrink-0 ${
          d.priority === 'urgent' ? 'bg-red-500' : d.priority === 'high' ? 'bg-orange-400' : d.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
        }`} />

        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-gray-400">{d.disputeId}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sc.cls} flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${pc}`}>{d.priority}</span>
              {unread && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500 text-white">NEW</span>}
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(d.createdAt)}
            </span>
          </div>

          <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{d.title}</h3>

          {/* Parties */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(d.raisedBy?.name||'U')}&background=3b82f6&color=fff&size=20`} className="w-5 h-5 rounded-full" alt="" />
              <span className="font-semibold text-gray-700">{d.raisedBy?.name}</span>
            </div>
            <span className="text-gray-300">vs</span>
            <div className="flex items-center gap-1.5">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(d.against?.name||'U')}&background=ef4444&color=fff&size=20`} className="w-5 h-5 rounded-full" alt="" />
              <span className="font-semibold text-gray-700">{d.against?.name}</span>
            </div>
            <span className="text-gray-300">·</span>
            <span className="truncate max-w-[120px]">{d.job?.title}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{TYPE_LABELS[d.type] || d.type}</span>
            {d.amount && <span className="text-[10px] font-black text-red-600">₹{d.amount.toLocaleString()}</span>}
            {d.messages?.length > 0 && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <MessageCircle className="w-3 h-3" /> {d.messages.length}
              </span>
            )}
            {d.dueDate && !['resolved','closed'].includes(d.status) && (
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${new Date(d.dueDate) < new Date() ? 'text-red-600' : 'text-amber-600'}`}>
                <Clock className="w-3 h-3" />
                {new Date(d.dueDate) < new Date() ? 'Overdue' : `Due ${formatDate(d.dueDate)}`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button onClick={() => onReview(d)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors">
            <Shield className="w-3.5 h-3.5" /> Review
          </button>
          <Link to={`/disputes/${d._id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> Thread
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function AdminDisputesPage() {
  const qc = useQueryClient();
  const [reviewDisp, setReviewDisp] = useState(null);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [priority, setPriority] = useState('');
  const [type,     setType]     = useState('');
  const [page,     setPage]     = useState(1);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-disputes', { search, status, priority, type, page }],
    queryFn:  () => disputeService.getAllAdmin({
      search:   search   || undefined,
      status:   status   || undefined,
      priority: priority || undefined,
      type:     type     || undefined,
      page, limit: 15,
    }).then(r => r.data),
    keepPreviousData: true,
    refetchInterval: 30000,
  });

  const disputes   = data?.data || [];
  const total      = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;
  const stats      = data?.stats || {};

  const STAT_CARDS = [
    { label: 'Total',        value: stats.total        || 0, color: 'text-gray-700',   bg: 'bg-gray-50'    },
    { label: 'Open',         value: stats.open         || 0, color: 'text-blue-700',   bg: 'bg-blue-50'    },
    { label: 'Under Review', value: stats.under_review || 0, color: 'text-amber-700',  bg: 'bg-amber-50'   },
    { label: 'Resolved',     value: stats.resolved     || 0, color: 'text-green-700',  bg: 'bg-green-50'   },
    { label: 'Unviewed',     value: stats.unviewed     || 0, color: 'text-orange-700', bg: 'bg-orange-50'  },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <h1 className="page-title">Dispute Management</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Review and resolve conflicts between clients and workers.
            {stats.unviewed > 0 && <span className="ml-1 font-bold text-orange-600">{stats.unviewed} new</span>}
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-all">
          {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {STAT_CARDS.map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl border border-gray-100 p-3 text-center`}>
            <p className={`text-xl font-display font-black ${c.color}`}>{c.value}</p>
            <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search disputes…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-purple-400">
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-purple-400">
          <option value="">All Priority</option>
          {['urgent','high','medium','low'].map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-purple-400">
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-500 text-lg">No disputes found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {disputes.map(d => (
              <DisputeRow key={d._id} d={d} onReview={setReviewDisp} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-purple-300">← Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-purple-300">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Review modal */}
      {reviewDisp && <ReviewModal dispute={reviewDisp} onClose={() => setReviewDisp(null)} />}
    </div>
  );
}