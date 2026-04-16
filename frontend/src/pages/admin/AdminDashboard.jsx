import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Briefcase, ShieldCheck, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import adminService from '@/services/adminService';
import { StatCard, SkeletonCard } from '@/components/common/UIComponents';
import Avatar from '@/components/common/Avatar';
import { formatDate, JOB_STATUS_CSS, JOB_STATUS_LABELS } from '@/utils/helpers';

const AdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => adminService.getDashboard().then(r => r.data.data),
    refetchInterval: 60000,
  });

  const stats = data?.stats;

  const statCards = [
    { label: 'Total Users',        value: stats?.totalUsers,          icon: Users,       color: 'text-primary',  bgColor: 'bg-primary-50'   },
    { label: 'Active Jobs',        value: stats?.openJobs,            icon: Briefcase,   color: 'text-accent',   bgColor: 'bg-accent-50'    },
    { label: 'Pending Verifications', value: stats?.pendingVerifications, icon: ShieldCheck, color: 'text-warning', bgColor: 'bg-warning-light'},
    { label: 'Completed Jobs',     value: stats?.completedJobs,       icon: TrendingUp,  color: 'text-success',  bgColor: 'bg-success-light'},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform overview and management.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          isLoading
            ? <div key={s.label} className="skeleton h-24 rounded-2xl" />
            : <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Sub-stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Labourers', value: stats.totalLabour },
            { label: 'Total Clients',   value: stats.totalClients },
            { label: 'Total Jobs',      value: stats.totalJobs },
          ].map(s => (
            <div key={s.label} className="card card-body text-center">
              <p className="text-2xl font-display font-bold text-slate-900">{s.value ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/verifications', icon: ShieldCheck, label: 'Review Verifications',
            desc: `${stats?.pendingVerifications || 0} pending`, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { to: '/admin/users',         icon: Users,       label: 'Manage Users',
            desc: `${stats?.totalUsers || 0} total`,            color: 'bg-primary-50 border-primary-200 text-primary-700' },
          { to: '/admin/jobs',          icon: Briefcase,   label: 'Monitor Jobs',
            desc: `${stats?.openJobs || 0} open`,               color: 'bg-surface-100 border-surface-300 text-slate-700' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md ${color}`}>
            <span className="p-2.5 rounded-xl bg-white shadow-sm flex-shrink-0">
              <Icon className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs opacity-70 mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent users */}
        <div className="card card-body space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-base">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {isLoading
            ? [1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)
            : (data?.recentUsers || []).map(user => (
                <div key={user._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors">
                  <Avatar src={user.avatar?.url} name={user.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge ${user.role === 'labour' ? 'badge-blue' : 'badge-orange'}`}>{user.role}</span>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(user.createdAt, 'dd MMM')}</p>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Recent jobs */}
        <div className="card card-body space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-base">Recent Jobs</h2>
            <Link to="/admin/jobs" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {isLoading
            ? [1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)
            : (data?.recentJobs || []).map(job => (
                <div key={job._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors">
                  <span className="p-2 rounded-xl bg-primary-50 flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.postedBy?.name} · {job.category}</p>
                  </div>
                  <span className={`badge ${JOB_STATUS_CSS[job.status] || 'badge-gray'} flex-shrink-0`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
