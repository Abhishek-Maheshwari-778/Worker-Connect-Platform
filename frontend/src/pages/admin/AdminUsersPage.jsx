import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ShieldOff, Shield, Trash2, Users,
  AlertTriangle, X, FileText
} from 'lucide-react';
import adminService from '@/services/adminService';
import Avatar      from '@/components/common/Avatar';
import { EmptyState, Pagination, Alert } from '@/components/common/UIComponents';
import Spinner     from '@/components/common/Spinner';
import { formatDate } from '@/utils/helpers';
import { useDebounce } from '@/hooks/useHooks';
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
  const qc = useQueryClient();
  const [page,          setPage]          = useState(1);
  const [search,        setSearch]        = useState('');
  const [roleFilter,    setRoleFilter]    = useState('');
  const [suspFilter,    setSuspFilter]    = useState('');
  const [confirmDel,    setConfirmDel]    = useState(null);
  const [suspendModal,  setSuspendModal]  = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [assignModal,   setAssignModal]   = useState(null);
  const [selectedEmp,   setSelectedEmp]   = useState('');

  const dSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { dSearch, roleFilter, suspFilter, page }],
    queryFn:  () => adminService.getAllUsers({
      search:      dSearch    || undefined,
      role:        roleFilter || undefined,
      isSuspended: suspFilter || undefined,
      page, limit: 15,
    }).then(r => r.data),
    keepPreviousData: true,
  });
  
  const { data: employeesData } = useQuery({
    queryKey: ['admin-employees'],
    queryFn:  () => adminService.getEmployees().then(r => r.data),
  });
  const employees = employeesData?.data || [];

  const users      = data?.data            || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total      = data?.meta?.total      || 0;

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }) => adminService.toggleSuspension(userId, reason),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries(['admin-users']);
      toast.success(vars.isSuspending ? '🚫 User suspended & notified' : '✅ User reactivated');
      setSuspendModal(null);
      setSuspendReason('');
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => adminService.deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      toast.success('User deleted');
      setConfirmDel(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, empId }) => adminService.assignEmployee(userId, empId),
    onSuccess: () => {
      qc.invalidateQueries(['admin-users']);
      toast.success('Mediator assigned successfully');
      setAssignModal(null);
      setSelectedEmp('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Assignment failed'),
  });

  const handleSuspendClick = (user) => {
    if (user.isSuspended) {
      suspendMutation.mutate({ userId: user._id, reason: 'Reactivated by admin', isSuspending: false });
    } else {
      setSuspendModal(user);
    }
  };

  const handleConfirmSuspend = () => {
    if (!suspendReason.trim()) { toast.error('Please provide a reason'); return; }
    suspendMutation.mutate({ userId: suspendModal._id, reason: suspendReason.trim(), isSuspending: true });
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="page-title">User Management</h1>
        <p className="text-slate-500 mt-1">{total} registered users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input w-auto text-sm" value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="labour">Labour</option>
          <option value="client">Client</option>
        </select>
        <select className="input w-auto text-sm" value={suspFilter}
          onChange={e => { setSuspFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : users.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar?.url} name={user.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          {user.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${user.role === 'labour' ? 'badge-primary' : 'badge-accent'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-slate-500">{formatDate(user.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {user.isSuspended ? (
                        <div>
                          <span className="badge badge-danger">Suspended</span>
                          {user.suspendReason && (
                            <p className="text-[10px] text-red-500 mt-0.5 max-w-[140px] truncate"
                              title={user.suspendReason}>
                              {user.suspendReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSuspendClick(user)}
                          disabled={suspendMutation.isPending}
                          title={user.isSuspended ? 'Reactivate account' : 'Suspend account'}
                          className={`btn-icon btn ${user.isSuspended ? 'text-success hover:bg-success-light' : 'text-warning hover:bg-warning-light'}`}
                        >
                          {user.isSuspended
                            ? <Shield className="w-4 h-4" />
                            : <ShieldOff className="w-4 h-4" />
                          }
                        </button>
                        {(user.role === 'labour' || user.role === 'client') && (
                          <button
                            onClick={() => setAssignModal(user)}
                            title="Assign Mediator"
                            className="btn-icon btn text-indigo-600 hover:bg-indigo-50"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDel(user)}
                          title="Delete user"
                          className="btn-icon btn text-danger hover:bg-danger-light"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search filters." />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ── Delete confirm modal ───────────────────────────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-float p-6 space-y-4 animate-slide-up">
            <h3 className="font-display font-semibold text-slate-900">Delete User</h3>
            <Alert
              type="error"
              message={`Are you sure you want to permanently delete "${confirmDel.name}"? This cannot be undone.`}
            />
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="btn-outline btn flex-1">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDel._id)}
                disabled={deleteMutation.isPending}
                className="btn-danger btn flex-1"
              >
                {deleteMutation.isPending ? <Spinner size="sm" color="text-white" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend reason modal ───────────────────────────────────────────── */}
      {suspendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setSuspendModal(null); setSuspendReason(''); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <ShieldOff className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Suspend Account</p>
                  <p className="text-red-100 text-xs">{suspendModal.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setSuspendModal(null); setSuspendReason(''); }}
                className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-bold mb-0.5">This will immediately:</p>
                  <ul className="space-y-0.5 text-amber-700">
                    <li>• Kick the user out of all active sessions</li>
                    <li>• Block all future login attempts</li>
                    <li>• Send an email notification to the user</li>
                  </ul>
                </div>
              </div>

              {/* Quick reason chips */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">Quick reasons:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Fake profile / identity',
                    'Fraudulent activity',
                    'Abusive behaviour',
                    'Spam / repeated violations',
                    'Payment dispute',
                  ].map(r => (
                    <button
                      key={r}
                      onClick={() => setSuspendReason(r)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        suspendReason === r
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom reason */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Suspension reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Explain why this account is being suspended. This will be included in the email sent to the user..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1">{suspendReason.length}/300 characters</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setSuspendModal(null); setSuspendReason(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSuspend}
                  disabled={suspendMutation.isPending || !suspendReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {suspendMutation.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Suspending…</>
                  ) : (
                    <><ShieldOff className="w-4 h-4" /> Suspend Account</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Employee Modal ───────────────────────────────────────────── */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-float p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Assign Mediator</h3>
                <p className="text-sm text-slate-500">For {assignModal.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Employee</label>
              <select 
                className="input w-full"
                value={selectedEmp}
                onChange={e => setSelectedEmp(e.target.value)}
              >
                <option value="">Choose an employee...</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.location?.city || 'No Area'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setAssignModal(null)} className="btn-outline btn flex-1 py-2.5 rounded-xl">
                Cancel
              </button>
              <button
                onClick={() => assignMutation.mutate({ userId: assignModal._id, empId: selectedEmp })}
                disabled={assignMutation.isPending || !selectedEmp}
                className="btn-primary btn flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsersPage;