import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import {
  Mail, Search, Star, StarOff, Reply, Trash2, X,
  Check, Clock, AlertTriangle, Filter, RefreshCw,
  ChevronDown, Send, Eye, Tag, Phone, User,
  Inbox, MailOpen, CheckCircle, Archive
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Status config ─────────────────────────────────────────────────────────── */
const STATUS_CFG = {
  new:     { label: 'New',     color: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-500',   icon: Inbox },
  read:    { label: 'Read',    color: 'bg-gray-100 text-gray-600 border-gray-200',    dot: 'bg-gray-400',   icon: MailOpen },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500',  icon: CheckCircle },
  closed:  { label: 'Closed',  color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400',  icon: Archive },
};
const PRIORITY_CFG = {
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' },
  high:   { label: 'High',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
  normal: { label: 'Normal', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  low:    { label: 'Low',    color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

/* ── Time formatter ────────────────────────────────────────────────────────── */
const timeAgo = (date) => {
  const d = Math.floor((Date.now() - new Date(date)) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
};

/* ── Message Detail Modal ─────────────────────────────────────────────────── */
const MessageModal = ({ contact, onClose, onUpdate }) => {
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const replyMut = useMutation({
    mutationFn: (msg) => api.post(`/admin/contacts/${contact._id}/reply`, { message: msg }),
    onSuccess: () => {
      toast.success('✅ Reply sent to ' + contact.email);
      qc.invalidateQueries(['admin-contacts']);
      setReplyText('');
      setShowReply(false);
      onUpdate?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to send reply'),
  });

  const updateMut = useMutation({
    mutationFn: (data) => api.patch(`/admin/contacts/${contact._id}`, data),
    onSuccess: () => { qc.invalidateQueries(['admin-contacts']); onUpdate?.(); },
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/admin/contacts/${contact._id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['admin-contacts']); onClose(); },
  });

  const scfg = STATUS_CFG[contact.status] || STATUS_CFG.new;
  const pcfg = PRIORITY_CFG[contact.priority] || PRIORITY_CFG.normal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:'blur(6px)', background:'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${scfg.color}`}>{scfg.label}</span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${pcfg.color}`}>{pcfg.label} Priority</span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 capitalize">{contact.category}</span>
            </div>
            <h2 className="font-bold text-gray-900 text-lg leading-snug truncate">{contact.subject}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 flex-shrink-0">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Sender info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{contact.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-orange-600 hover:underline">
                  <Mail className="w-3 h-3" />{contact.email}
                </a>
                {contact.phone && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="w-3 h-3" />{contact.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(contact.createdAt)}
            </div>
          </div>
        </div>

        {/* Message body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Original message */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Original Message</p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{contact.message}</p>
          </div>

          {/* Reply thread */}
          {contact.replies?.map((reply, i) => (
            <div key={i} className="bg-blue-50 border border-blue-100 rounded-2xl p-5 ml-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <Reply className="w-3 h-3" /> Reply by {reply.sentBy}
                </p>
                <p className="text-[10px] text-blue-400">{timeAgo(reply.sentAt)}</p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{reply.message}</p>
            </div>
          ))}

          {/* Reply composer */}
          {showReply && (
            <div className="border-2 border-orange-200 rounded-2xl p-5 bg-orange-50/30">
              <p className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
                <Reply className="w-3.5 h-3.5 text-orange-500" /> Reply to {contact.name}
              </p>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Type your reply... This will be emailed directly to the user."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => replyMut.mutate(replyText)}
                  disabled={!replyText.trim() || replyMut.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold disabled:opacity-50 hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  {replyMut.isPending ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</> : <><Send className="w-3.5 h-3.5" />Send Reply</>}
                </button>
                <button onClick={() => { setShowReply(false); setReplyText(''); }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <p className="text-[10px] text-gray-400 ml-auto">Sends to: {contact.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-100 bg-gray-50 flex-wrap">
          {!showReply && (
            <button onClick={() => setShowReply(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors">
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
          )}
          <button onClick={() => updateMut.mutate({ isStarred: !contact.isStarred })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100">
            {contact.isStarred ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
            {contact.isStarred ? 'Unstar' : 'Star'}
          </button>
          {/* Status selector */}
          <select
            value={contact.status}
            onChange={e => updateMut.mutate({ status: e.target.value })}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 bg-white cursor-pointer focus:outline-none focus:border-orange-400"
          >
            <option value="new">Mark New</option>
            <option value="read">Mark Read</option>
            <option value="replied">Mark Replied</option>
            <option value="closed">Mark Closed</option>
          </select>
          <button onClick={() => { if (window.confirm('Delete this message?')) deleteMut.mutate(); }}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function AdminContactsPage() {
  const qc = useQueryClient();
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState('');
  const [priorityF,  setPriorityF]  = useState('');
  const [page,       setPage]       = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contacts', { search, statusF, priorityF, page }],
    queryFn:  () => api.get('/admin/contacts', { params: {
      search:   search   || undefined,
      status:   statusF  || undefined,
      priority: priorityF|| undefined,
      page, limit: 20,
    }}).then(r => r.data.data),
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const contacts   = data?.contacts  || [];
  const stats      = data?.stats     || {};
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage user queries, complaints, and feedback</p>
        </div>
        <button onClick={() => qc.invalidateQueries(['admin-contacts'])}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'new',     label: 'New',     icon: Inbox,       color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { key: 'read',    label: 'Read',    icon: MailOpen,    color: 'text-gray-600 bg-gray-50 border-gray-200' },
          { key: 'replied', label: 'Replied', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
          { key: 'closed',  label: 'Closed',  icon: Archive,     color: 'text-slate-600 bg-slate-50 border-slate-200' },
        ].map(s => (
          <button key={s.key}
            onClick={() => setStatusF(statusF === s.key ? '' : s.key)}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${statusF === s.key ? s.color + ' shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
            <s.icon className={`w-5 h-5 ${statusF === s.key ? '' : 'text-gray-400'}`} />
            <div className="text-left">
              <p className="text-xl font-black text-gray-800">{stats[s.key] || 0}</p>
              <p className="text-xs font-semibold text-gray-500">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or subject…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
        </div>
        <select value={priorityF} onChange={e => { setPriorityF(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-orange-400 cursor-pointer">
          <option value="">All Priorities</option>
          <option value="urgent">🔴 Urgent</option>
          <option value="high">🟡 High</option>
          <option value="normal">🔵 Normal</option>
          <option value="low">⚪ Low</option>
        </select>
        {(search || statusF || priorityF) && (
          <button onClick={() => { setSearch(''); setStatusF(''); setPriorityF(''); setPage(1); }}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Message list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-bold text-gray-500 text-lg">No messages found</p>
          <p className="text-gray-400 text-sm mt-1">No contact submissions match your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          {contacts.map((c, idx) => {
            const scfg = STATUS_CFG[c.status] || STATUS_CFG.new;
            const pcfg = PRIORITY_CFG[c.priority] || PRIORITY_CFG.normal;
            return (
              <div key={c._id}
                onClick={() => setSelected(c)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-orange-50/50 transition-colors border-b last:border-b-0 border-gray-50 ${c.status === 'new' ? 'bg-blue-50/30' : ''}`}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-bold truncate ${c.status === 'new' ? 'text-gray-900' : 'text-gray-700'}`}>{c.name}</p>
                    {c.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${pcfg.color}`}>{pcfg.label}</span>
                  </div>
                  <p className={`text-sm truncate mb-0.5 ${c.status === 'new' ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{c.subject}</p>
                  <p className="text-xs text-gray-400 truncate">{c.message.substring(0, 80)}{c.message.length > 80 ? '…' : ''}</p>
                </div>
                {/* Right side */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <p className="text-xs text-gray-400">{timeAgo(c.createdAt)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scfg.color}`}>{scfg.label}</span>
                  {c.replies?.length > 0 && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Reply className="w-2.5 h-2.5" />{c.replies.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-orange-300">
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-orange-300">
            Next →
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <MessageModal
          contact={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {
            qc.invalidateQueries(['admin-contacts']);
            // Refresh selected contact data
            api.get(`/admin/contacts/${selected._id}`).then(r => setSelected(r.data.data)).catch(() => {});
          }}
        />
      )}
    </div>
  );
}