import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Clock, Mail, Trash2, Search, Filter,
  RefreshCw, Loader2, AlertTriangle, CheckCircle,
  UserX, Ghost, TrendingDown, Calendar, Download,
  ChevronDown, X, Eye, Briefcase, BarChart2, Bell
} from 'lucide-react';
import adminService from '@/services/adminService';
import { formatDate, timeAgo } from '@/utils/helpers';
import Avatar from '@/components/common/Avatar';
import toast from 'react-hot-toast';

/* ── Risk badge ──────────────────────────────────────────────────────────────── */
const RISK_CONFIG = {
  ghost:    { label: 'Ghost Account',  cls: 'bg-red-100 text-red-800 border-red-200',    dot: 'bg-red-500',    icon: Ghost    },
  dormant:  { label: 'Dormant',        cls: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', icon: TrendingDown },
  at_risk:  { label: 'At Risk',        cls: 'bg-amber-100 text-amber-800 border-amber-200',   dot: 'bg-amber-500',  icon: AlertTriangle },
};

/* ── Email compose modal ─────────────────────────────────────────────────────── */
const EmailModal = ({ users, onClose }) => {
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const TEMPLATES = [
    { label: 'General Re-engagement', text: "We'd love to see you back on Labour Connect. New opportunities await!" },
    { label: 'Profile Incomplete',    text: "Your profile is almost ready! Complete it to start getting hired or find workers." },
    { label: 'New Features',          text: "We've launched exciting new features — dispute resolution, verified badges, and more!" },
    { label: 'Exclusive Offer',       text: "As a valued member, we're offering you priority listing for the next 30 days if you return." },
  ];

  const mut = useMutation({
    mutationFn: () => adminService.sendReengagementEmail({
      userIds: users.map(u => u._id),
      customMessage: msg.trim() || undefined,
    }),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`✅ ${d.sent} emails sent${d.failed > 0 ? `, ${d.failed} failed` : ''}`);
      qc.invalidateQueries(['admin-inactive']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Re-engagement Email</p>
              <p className="text-blue-100 text-xs">{users.length} recipient{users.length > 1 ? 's' : ''} selected</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipients preview */}
          <div className="flex -space-x-2 mb-1">
            {users.slice(0,5).map(u => (
              <img key={u._id}
                src={u.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||'U')}&background=3b82f6&color=fff&size=28`}
                className="w-7 h-7 rounded-full border-2 border-white"
                alt={u.name} title={u.name}
              />
            ))}
            {users.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                +{users.length - 5}
              </div>
            )}
          </div>

          {/* Quick templates */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Quick Templates:</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map(t => (
                <button key={t.label} onClick={() => setMsg(t.text)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                    msg === t.text ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Custom message */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Custom Message (optional)</label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
              placeholder="Leave blank to use default message, or type a custom one..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>

          {/* Preview box */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
            <p className="font-bold mb-1">Email will include:</p>
            <ul className="space-y-0.5 text-blue-700">
              <li>• Personalised greeting with user's name</li>
              <li>• {msg.trim() || "Default re-engagement message"}</li>
              <li>• Role-specific call-to-action (job opportunities or workers)</li>
              <li>• Direct login link</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => mut.mutate()} disabled={mut.isPending}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-md">
              {mut.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                : <><Mail className="w-4 h-4" /> Send Emails</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Delete confirm modal ────────────────────────────────────────────────────── */
const DeleteModal = ({ users, onClose }) => {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState('');

  const mut = useMutation({
    mutationFn: () => adminService.deleteGhostAccounts({ userIds: users.map(u => u._id) }),
    onSuccess: (res) => {
      toast.success(`🗑️ ${res.data.data.deleted} accounts deleted`);
      qc.invalidateQueries(['admin-inactive']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Delete Ghost Accounts</p>
              <p className="text-red-100 text-xs">{users.length} account{users.length > 1 ? 's' : ''} selected</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <p className="font-bold mb-1">This action is permanent and will:</p>
              <ul className="space-y-0.5 text-red-700">
                <li>• Delete the user account and all profile data</li>
                <li>• Remove associated labour/client profile</li>
                <li>• This cannot be undone</li>
              </ul>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-600 mb-1.5">Type <span className="text-red-600 font-black">DELETE</span> to confirm:</p>
            <input value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={() => mut.mutate()} disabled={confirm !== 'DELETE' || mut.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
              {mut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Confirm Delete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── User row card ───────────────────────────────────────────────────────────── */
const UserRow = ({ user, selected, onToggle }) => {
  const rc = RISK_CONFIG[user.risk] || RISK_CONFIG.at_risk;
  const Icon = rc.icon;

  return (
    <div
      onClick={() => onToggle(user._id)}
      className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all group ${
        selected ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
      }`}>

      {/* Checkbox */}
      <div className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all mt-0.5 ${
        selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-blue-400'
      }`}>
        {selected && <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />}
      </div>

      {/* Avatar */}
      <Avatar src={user.avatar?.url} name={user.name} size="sm" className="flex-shrink-0" />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-bold text-gray-900 text-sm">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${rc.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
              {rc.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
              user.role === 'labour' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>{user.role}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Joined {formatDate(user.createdAt)}
          </span>
          <span className={`flex items-center gap-1 font-semibold ${user.daysSinceLogin > 180 ? 'text-red-600' : user.daysSinceLogin > 90 ? 'text-orange-600' : 'text-amber-600'}`}>
            <Clock className="w-3 h-3" />
            {user.lastLogin ? `${user.daysSinceLogin}d since login` : `Never logged in`}
          </span>
          {!user.isProfileComplete && (
            <span className="flex items-center gap-1 text-purple-600 font-semibold">
              <UserX className="w-3 h-3" /> Profile incomplete
            </span>
          )}
          {user.labourProfile?.completedJobs > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <Briefcase className="w-3 h-3" /> {user.labourProfile.completedJobs} jobs done
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function AdminInactiveUsersPage() {
  const qc = useQueryClient();
  const [selected,    setSelected]    = useState(new Set());
  const [type,        setType]        = useState('');
  const [days,        setDays]        = useState('90');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [emailModal,  setEmailModal]  = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const searchTimer = useRef(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-inactive', { type, days, page }],
    queryFn:  () => adminService.getInactiveUsers({ type: type || undefined, days, page, limit: 20 }).then(r => r.data),
    keepPreviousData: true,
  });

  const users      = data?.data        || [];
  const total      = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;
  const stats      = data?.stats       || {};

  const filtered   = search.trim()
    ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    : users;

  const selectedUsers = users.filter(u => selected.has(u._id));
  const allSelected   = filtered.length > 0 && filtered.every(u => selected.has(u._id));

  const toggleUser  = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll   = () => {
    if (allSelected) setSelected(s => { const n = new Set(s); filtered.forEach(u => n.delete(u._id)); return n; });
    else             setSelected(s => { const n = new Set(s); filtered.forEach(u => n.add(u._id)); return n; });
  };
  const clearSelect = () => setSelected(new Set());

  const exportCSV = () => {
    const rows = filtered.map(u => [u.name, u.email, u.role, u.daysSinceLogin + 'd inactive', u.risk, u.isProfileComplete ? 'complete' : 'incomplete', formatDate(u.createdAt)]);
    const csv  = [['Name','Email','Role','Inactive','Risk','Profile','Joined'], ...rows].map(r => r.join(',')).join('\n');
    const a    = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `inactive-users-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const STAT_CARDS = [
    { label: 'Total Inactive',    value: stats.inactive90   || 0, color: 'text-orange-700', bg: 'bg-orange-50', icon: Clock      },
    { label: 'No Profile',        value: stats.noProfile    || 0, color: 'text-purple-700', bg: 'bg-purple-50', icon: UserX      },
    { label: 'Never Logged In',   value: stats.neverLoggedIn|| 0, color: 'text-red-700',    bg: 'bg-red-50',    icon: Ghost      },
    { label: 'Total Users',       value: stats.total        || 0, color: 'text-blue-700',   bg: 'bg-blue-50',   icon: Users      },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
              <Ghost className="w-4 h-4 text-orange-600" />
            </div>
            <h1 className="page-title">Inactive User Cleanup</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Users with no activity · {total} found
            {isFetching && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 disabled:opacity-40 transition-all">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 transition-all">
            {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl border border-gray-100 p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <p className="text-[11px] font-semibold text-gray-500">{c.label}</p>
            </div>
            <p className={`text-2xl font-display font-black ${c.color}`}>{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400" />
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); setSelected(new Set()); }}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-orange-400">
          <option value="">All Types</option>
          <option value="no_profile">No Profile</option>
          <option value="never_login">Never Logged In</option>
          <option value="inactive">Profile Done, Inactive</option>
          <option value="labour">Labour Only</option>
          <option value="client">Client Only</option>
        </select>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
          {[['30','30d'],['60','60d'],['90','90d'],['180','6mo'],['365','1yr']].map(([v,l]) => (
            <button key={v} onClick={() => { setDays(v); setPage(1); setSelected(new Set()); }}
              className={`px-2.5 py-2 text-xs font-bold transition-all ${days === v ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl animate-fade-in flex-wrap">
          <span className="text-sm font-bold text-blue-800">{selected.size} user{selected.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setEmailModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm">
              <Mail className="w-3.5 h-3.5" /> Send Email
            </button>
            <button onClick={() => setDeleteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors shadow-sm">
              <Trash2 className="w-3.5 h-3.5" /> Delete Accounts
            </button>
            <button onClick={clearSelect}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-300 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Select all + count */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <button onClick={toggleAll}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${allSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
              {allSelected && <CheckCircle className="w-3 h-3 text-white fill-white" />}
            </div>
            {allSelected ? 'Deselect all' : `Select all ${filtered.length}`}
          </button>
          <span className="text-xs text-gray-400">{total} total results</span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
          <p className="font-bold text-gray-500 text-lg">No inactive users found</p>
          <p className="text-sm text-gray-400 mt-1">{search ? 'Try a different search' : 'All users are active!'}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {filtered.map(u => (
              <UserRow key={u._id} user={u} selected={selected.has(u._id)} onToggle={toggleUser} />
            ))}
          </div>
          {!search && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-orange-300">← Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:border-orange-300">Next →</button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {emailModal  && <EmailModal  users={selectedUsers} onClose={() => setEmailModal(false)}  />}
      {deleteModal && <DeleteModal users={selectedUsers} onClose={() => setDeleteModal(false)} />}
    </div>
  );
}