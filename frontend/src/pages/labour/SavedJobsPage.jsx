// frontend/src/pages/labour/SavedJobsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Bookmark, Trash2, Briefcase,
  Loader2, AlertCircle
} from 'lucide-react';
import jobService from '@/services/jobService';
import userService from '@/services/userService';
import JobCard from '@/components/common/JobCard';
import { EmptyState, Pagination } from '@/components/common/UIComponents';
import toast from 'react-hot-toast';

const SavedJobsPage = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [applyingJob, setApplyingJob] = useState(null);

  /* ── Fetch Saved Jobs ──────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['saved-jobs', { page }],
    queryFn: () => jobService.getSavedJobs({ page, limit: 12 }).then(r => r.data),
  });

  /* ── Fetch Client History ──────────────────────────────────────────────── */
  const { data: clientHistoryRaw } = useQuery({
    queryKey: ['my-client-history'],
    queryFn: () => jobService.getClientHistory().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const savedJobs = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;
  const clientHistoryMap = clientHistoryRaw || {};

  /* ── Unsave Mutation ───────────────────────────────────────────────────── */
  const unsaveMut = useMutation({
    mutationFn: (jobId) => jobService.unsaveJob(jobId),
    onSuccess: () => {
      qc.invalidateQueries(['saved-jobs']);
      toast.success('Removed from saved jobs');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to remove'),
  });

  const handleToggleSave = (jobId, isSaved) => {
    if (isSaved) {
      unsaveMut.mutate(jobId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/labour/jobs" 
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
>
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-orange-500" />
            Saved Jobs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {total > 0 ? `${total} job${total !== 1 ? 's' : ''} saved` : 'Jobs you save appear here'}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 skeleton rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : savedJobs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedJobs.map(job => (
              <div key={job._id} className="relative group">
                <JobCard
                  job={job}
                  showApplyBtn={!job.isExpired}
                  onApply={setApplyingJob}
                  clientHistory={clientHistoryMap[job.postedBy?._id?.toString()]}
                  isSaved={true}
                  onToggleSave={handleToggleSave}
                />
                {/* Quick Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => unsaveMut.mutate(job._id)}
                    disabled={unsaveMut.isPending}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-red-500 shadow-sm hover:bg-red-50 transition-colors"
                    title="Remove from saved"
                  >
                    {unsaveMut.isPending && unsaveMut.variables === job._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="Browse jobs and click the bookmark icon to save them for later."
          action={<Link to="/labour/jobs" className="btn-primary btn">Browse Jobs</Link>}
        />
      )}
    </div>
  );
};

export default SavedJobsPage;