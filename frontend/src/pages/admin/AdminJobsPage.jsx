import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import adminService from '@/services/adminService';
import { EmptyState, Pagination } from '@/components/common/UIComponents';
import { formatDate, formatCurrency, JOB_STATUS_CSS, JOB_STATUS_LABELS, JOB_CATEGORIES } from '@/utils/helpers';

const AdminJobsPage = () => {
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', { status, category, page }],
    queryFn:  () => adminService.getAllJobs({
      status:   status   || undefined,
      category: category || undefined,
      page, limit: 15,
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const jobs       = data?.data       || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total      = data?.meta?.total || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">All Jobs</h1>
        <p className="text-slate-500 mt-1">{total} total job postings</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto text-sm" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {Object.entries(JOB_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input w-auto text-sm" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {JOB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : jobs.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Job</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden sm:table-cell">Budget</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden lg:table-cell">Posted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {jobs.map(job => (
                  <tr key={job._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[200px]">{job.title}</p>
                      <p className="text-xs text-slate-500 capitalize">{job.category}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-slate-700 truncate max-w-[120px]">{job.postedBy?.name || '—'}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[120px]">{job.postedBy?.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-700">
                      {formatCurrency(job.budgetMin)}–{formatCurrency(job.budgetMax)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${JOB_STATUS_CSS[job.status] || 'badge-gray'}`}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                      {formatDate(job.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={Briefcase} title="No jobs found" />
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default AdminJobsPage;
