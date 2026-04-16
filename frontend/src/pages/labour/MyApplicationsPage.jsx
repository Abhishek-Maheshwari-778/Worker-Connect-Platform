import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ClipboardList, MapPin, IndianRupee, Calendar,
  Clock, CheckCircle, XCircle, Star, AlertCircle,
  ArrowRight, ChevronDown, Loader2, RefreshCw,
  Briefcase, Trophy, ThumbsUp
} from 'lucide-react';
import jobService    from '@/services/jobService';
import { useSocket } from '@/context/SocketContext';
import { EmptyState, Pagination } from '@/components/common/UIComponents';
import RatingModal   from '@/components/common/RatingModal';
import { formatDate, formatCurrency, timeAgo } from '@/utils/helpers';
import toast from 'react-hot-toast';

/* ── Status config ─────────────────────────────────────────────────────────── */
const S = {
  applied:     { label:'Pending',     icon:Clock,        bg:'bg-blue-50',   border:'border-blue-200',  text:'text-blue-700',  dot:'bg-blue-500 animate-pulse', bar:'bg-blue-400',   sub:'Waiting for client response'        },
  shortlisted: { label:'Shortlisted', icon:Star,         bg:'bg-amber-50',  border:'border-amber-200', text:'text-amber-700', dot:'bg-amber-500',              bar:'bg-amber-400',  sub:'Client is reviewing your profile'   },
  accepted:    { label:'Accepted',    icon:CheckCircle,  bg:'bg-green-50',  border:'border-green-200', text:'text-green-700', dot:'bg-green-500',              bar:'bg-green-500',  sub:'You got the job — work in progress!' },
  rejected:    { label:'Rejected',    icon:XCircle,      bg:'bg-red-50',    border:'border-red-200',   text:'text-red-700',   dot:'bg-red-400',                bar:'bg-red-400',    sub:'Not selected this time'             },
  withdrawn:   { label:'Withdrawn',   icon:AlertCircle,  bg:'bg-gray-50',   border:'border-gray-200',  text:'text-gray-500',  dot:'bg-gray-400',               bar:'bg-gray-300',   sub:'You withdrew this application'      },
  cancelled:   { label:'Cancelled',   icon:XCircle,      bg:'bg-gray-50',   border:'border-gray-200',  text:'text-gray-400',  dot:'bg-gray-300',               bar:'bg-gray-200',   sub:'This job was removed by the client' },
  completed:   { label:'Completed',   icon:Trophy,       bg:'bg-purple-50', border:'border-purple-200',text:'text-purple-700',dot:'bg-purple-500',             bar:'bg-purple-400', sub:'Job completed successfully 🎉'       },
};

const TABS = [
  { value:'all',       label:'All'        },
  { value:'active',    label:'Active'     },
  { value:'applied',   label:'Pending'    },
  { value:'shortlisted',label:'Shortlisted'},
  { value:'accepted',  label:'Accepted'   },
  { value:'completed', label:'Completed'  },
  { value:'rejected',  label:'Rejected'   },
];

/* ─── Determine display status ─────────────────────────────────────────────── */
const getDisplayStatus = (job) => {
  if (!job) return 'applied';
  const appStatus = job.myApplication?.status || 'applied';
  if (job.status === 'cancelled') return 'cancelled';
  if (job.status === 'completed' && appStatus === 'accepted') return 'completed';
  return appStatus;
};

/* ── Application Card ──────────────────────────────────────────────────────── */
const AppCard = ({ job, highlight, onRate }) => {
  const [expanded, setExpanded] = useState(false);
  const qc       = useQueryClient();
  const app      = job.myApplication;
  const dispStatus = getDisplayStatus(job);
  const meta       = S[dispStatus] || S.applied;
  const Icon       = meta.icon;

  const isCompleted  = dispStatus === 'completed';
  const isAccepted   = dispStatus === 'accepted';
  const canWithdraw  = ['applied','shortlisted'].includes(app?.status) && job.status !== 'cancelled';
  const canRate      = isCompleted && !job.hasRatedClient;
  const alreadyRated = isCompleted && job.hasRatedClient;

  const withdrawMut = useMutation({
    mutationFn: () => jobService.withdrawApplication(job._id),
    onSuccess:  () => { qc.invalidateQueries(['my-applications']); toast.success('Application withdrawn'); },
    onError:    (err) => toast.error(err.message),
  });

  return (
    <div
      className={`bg-white rounded-2xl border-2 ${meta.border} overflow-hidden transition-all duration-300 hover:shadow-md ${highlight ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
    >
      {/* Colour bar */}
      <div className={`h-1.5 w-full ${meta.bar}`} />

      {/* Status strip */}
      <div className={`${meta.bg} px-4 py-2.5 flex items-center justify-between flex-wrap gap-2`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
          <Icon className={`w-3.5 h-3.5 ${meta.text} flex-shrink-0`} />
          <span className={`text-xs font-bold ${meta.text}`}>{meta.label}</span>
          <span className={`text-xs ${meta.text} opacity-60 hidden sm:inline`}>— {meta.sub}</span>
        </div>
        <span className="text-[11px] text-gray-400">{timeAgo(app?.appliedAt)}</span>
      </div>

      <div className="p-4">
        {/* Title */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <Link to={`/jobs/${job._id}`}
              className="font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-1 text-base block">
              {job.title}
            </Link>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{job.category?.replace(/_/g,' ')}</p>
          </div>
          <button onClick={() => setExpanded(!expanded)}
            className={`flex-shrink-0 p-1.5 rounded-xl border transition-all ${expanded ? 'bg-orange-50 border-orange-200' : 'border-gray-200 hover:border-orange-200'}`}>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-xs text-gray-500">
          {job.location?.city && (
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location.city}{job.location.state ? `, ${job.location.state}` : ''}</span>
          )}
          <span className="flex items-center gap-1 text-orange-600 font-semibold">
            <IndianRupee className="w-3.5 h-3.5" />
            {formatCurrency(job.budgetMin).replace('₹','')}–{formatCurrency(job.budgetMax)}/{job.budgetType}
          </span>
          {job.startDate && (
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(job.startDate, 'dd MMM yyyy')}</span>
          )}
          {/* Client name */}
          {job.postedBy?.name && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> {job.postedBy.name}
            </span>
          )}
        </div>

        {/* Expanded proposal */}
        {expanded && (
          <div className="pt-3 border-t border-gray-100 space-y-3 animate-fade-in mb-3">
            {app?.proposedWage > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Your proposed wage</span>
                <span className="font-bold text-orange-600">{formatCurrency(app.proposedWage)}/day</span>
              </div>
            )}
            {app?.proposalMsg && (
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">Your proposal</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 leading-relaxed">
                  {app.proposalMsg}
                </p>
              </div>
            )}
            <p className="text-[11px] text-gray-400">
              Applied on {formatDate(app?.appliedAt, 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
        )}

        {/* ── Action footer ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link to={`/jobs/${job._id}`}
            className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold hover:underline">
            View Job <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Withdraw */}
            {canWithdraw && (
              <button
                onClick={() => withdrawMut.mutate()}
                disabled={withdrawMut.isPending}
                className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {withdrawMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Withdraw
              </button>
            )}

            {/* Accepted badge */}
            {isAccepted && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
                <CheckCircle className="w-3.5 h-3.5" /> Confirmed
              </span>
            )}

            {/* Completed badge */}
            {isCompleted && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                <Trophy className="w-3.5 h-3.5" /> Completed
              </span>
            )}

            {/* Rate Client — ONLY on completed jobs, ONLY if not already rated */}
            {canRate && (
              <button
                onClick={() => onRate(job)}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-all shadow-sm"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Rate Client
              </button>
            )}

            {/* Already rated badge */}
            {alreadyRated && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <ThumbsUp className="w-3.5 h-3.5" /> Rated ✓
              </span>
            )}

            {/* Cancelled */}
            {dispStatus === 'cancelled' && (
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">Job Removed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const MyApplicationsPage = () => {
  const qc      = useQueryClient();
  const { on }  = useSocket();

  const [activeTab,     setActiveTab]     = useState('all');
  const [page,          setPage]          = useState(1);
  const [highlightedId, setHighlightedId] = useState(null);
  const [ratingModal,   setRatingModal]   = useState(null);

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['my-applications', { page }],
    queryFn:  () => jobService.getMyApplications({ page, limit: 20 }).then(r => r.data),
    refetchInterval: 30000,
  });

  const allJobs    = data?.data        || [];
  const total      = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  /* ── Real-time socket ────────────────────────────────────────────────────── */
  useEffect(() => {
    const offStatus = on('application:statusUpdate', ({ jobId, status }) => {
      qc.setQueryData(['my-applications', { page }], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map(job => {
            if (job._id !== jobId) return job;
            return { ...job, myApplication: { ...job.myApplication, status } };
          }),
        };
      });
      setHighlightedId(jobId);
      setTimeout(() => setHighlightedId(null), 3000);
      const msgs = {
        accepted:    '🎉 Your application was accepted!',
        rejected:    'Application update — not selected this time.',
        shortlisted: '⭐ You have been shortlisted!',
      };
      if (msgs[status]) toast(msgs[status], { duration: 5000 });
    });

    // Job completed by client → update job status, prompt to rate
    const offJobUpdated = on('job:updated', ({ _id, status }) => {
      if (status !== 'completed') return;
      qc.setQueryData(['my-applications', { page }], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map(job =>
            job._id === _id ? { ...job, status: 'completed' } : job
          ),
        };
      });
      // Find the job and open rate modal
      const completedJob = allJobs.find(j => j._id === _id);
      if (completedJob && completedJob.myApplication?.status === 'accepted') {
        toast('✅ Job marked as complete! Please rate the client.', { duration: 6000 });
        qc.invalidateQueries(['my-applications']);
      }
    });

    const offDeleted = on('job:deleted', ({ jobId }) => {
      qc.setQueryData(['my-applications', { page }], (old) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map(job => job._id === jobId ? { ...job, status: 'cancelled' } : job) };
      });
    });

    return () => { offStatus?.(); offJobUpdated?.(); offDeleted?.(); };
  }, [on, qc, page, allJobs]);

  /* ── Tab filtering ──────────────────────────────────────────────────────── */
  const counts = allJobs.reduce((acc, j) => {
    const ds = getDisplayStatus(j);
    acc[ds] = (acc[ds] || 0) + 1;
    return acc;
  }, {});

  const activeCount   = (counts.applied || 0) + (counts.shortlisted || 0) + (counts.accepted || 0);
  const completedCount = counts.completed || 0;

  const filtered = (() => {
    switch (activeTab) {
      case 'all':       return allJobs;
      case 'active':    return allJobs.filter(j => ['applied','shortlisted','accepted'].includes(getDisplayStatus(j)));
      case 'completed': return allJobs.filter(j => getDisplayStatus(j) === 'completed');
      default:          return allJobs.filter(j => getDisplayStatus(j) === activeTab);
    }
  })();

  const handleRate = (job) => {
    setRatingModal({
      job,
      ratedUser: {
        _id:    job.postedBy?._id,
        name:   job.postedBy?.name,
        avatar: job.postedBy?.avatar,
        role:   'client',
      },
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {total > 0 ? `${total} total application${total !== 1 ? 's' : ''}` : 'Track all your job applications here.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => qc.invalidateQueries(['my-applications'])}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link to="/jobs" className="btn-primary btn flex-shrink-0">
            Browse Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Summary stat cards */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { status:'applied',     label:'Pending',     cls:'border-blue-200  bg-blue-50',   txt:'text-blue-700'   },
            { status:'shortlisted', label:'Shortlisted', cls:'border-amber-200 bg-amber-50',  txt:'text-amber-700'  },
            { status:'accepted',    label:'In Progress', cls:'border-green-200 bg-green-50',  txt:'text-green-700'  },
            { status:'completed',   label:'Completed',   cls:'border-purple-200 bg-purple-50',txt:'text-purple-700' },
          ].map(s => (
            <button key={s.status}
              onClick={() => setActiveTab(activeTab === s.status ? 'all' : s.status)}
              className={`rounded-2xl border-2 p-3 text-center transition-all hover:shadow-sm ${activeTab === s.status ? s.cls + ' shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
              <p className={`text-2xl font-display font-bold ${activeTab === s.status ? s.txt : 'text-gray-800'}`}>
                {counts[s.status] || 0}
              </p>
              <p className={`text-xs mt-0.5 ${activeTab === s.status ? s.txt : 'text-gray-400'}`}>{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Pending rate reminder */}
      {completedCount > 0 && allJobs.some(j => getDisplayStatus(j) === 'completed' && !j.hasRatedClient) && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Rate your client!</p>
            <p className="text-xs text-amber-600 mt-0.5">You have completed jobs waiting for your rating.</p>
          </div>
          <button onClick={() => setActiveTab('completed')}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors">
            View
          </button>
        </div>
      )}

      {/* Tab pills */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => {
          const count = t.value === 'all' ? total
            : t.value === 'active' ? activeCount
            : (counts[t.value] || 0);
          const isActive = activeTab === t.value;
          return (
            <button key={t.value}
              onClick={() => { setActiveTab(t.value); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? t.value === 'completed'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
              }`}>
              {t.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-40 skeleton rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div className="space-y-4">
            {filtered.map(job => (
              <AppCard
                key={job._id}
                job={job}
                highlight={highlightedId === job._id}
                onRate={handleRate}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={
            activeTab === 'completed' ? 'No completed jobs yet' :
            activeTab === 'active'    ? 'No active applications' :
            activeTab !== 'all'       ? `No ${S[activeTab]?.label || activeTab} applications` :
            'No applications yet'
          }
          description={
            activeTab === 'completed' ? 'Jobs you finish will appear here with an option to rate the client.' :
            activeTab !== 'all'       ? 'Try a different tab above.' :
            'Browse open jobs and apply to start tracking here.'
          }
          action={
            activeTab !== 'all'
              ? <button onClick={() => setActiveTab('all')} className="btn-outline btn">Show All</button>
              : <Link to="/jobs" className="btn-primary btn">Browse Jobs</Link>
          }
        />
      )}

      {/* Rating modal — only for labour rating client */}
      {ratingModal && (
        <RatingModal
          job={ratingModal.job}
          ratedUser={ratingModal.ratedUser}
          onClose={() => setRatingModal(null)}
          onSuccess={() => {
            qc.invalidateQueries(['my-applications']);
            setRatingModal(null);
            toast.success('Rating submitted! Thank you.');
          }}
        />
      )}
    </div>
  );
};

export default MyApplicationsPage;