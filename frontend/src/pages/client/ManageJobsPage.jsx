import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Edit2, Trash2, PlusCircle,
  MapPin, Calendar, IndianRupee, AlertCircle,
  Loader2, CheckCircle, XCircle, Zap, RefreshCw,
  Clock, BarChart3
} from 'lucide-react';
import jobService   from '@/services/jobService';
import userService  from '@/services/userService';
import { useSocket } from '@/context/SocketContext';
import { EmptyState, Pagination } from '@/components/common/UIComponents';
import RatingModal from '@/components/common/RatingModal';
import { formatCurrency } from '@/utils/helpers';
import toast from 'react-hot-toast';
import CountdownTimer from '@/components/common/CountdownTimer';

/* ── Status config ─────────────────────────────────────────────────────────── */
const STATUS = {
  open:        { label:'Open',        dot:'bg-green-500',  bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200',  barCls:'bg-green-400'  },
  in_progress: { label:'In Progress', dot:'bg-blue-500',   bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200',   barCls:'bg-blue-400'   },
  completed:   { label:'Completed',   dot:'bg-gray-400',   bg:'bg-gray-50',   text:'text-gray-600',   border:'border-gray-200',   barCls:'bg-gray-300'   },
  cancelled:   { label:'Cancelled',   dot:'bg-red-400',    bg:'bg-red-50',    text:'text-red-600',    border:'border-red-200',    barCls:'bg-red-400'    },
  expired:     { label:'Expired',     dot:'bg-red-500',    bg:'bg-red-50',    text:'text-red-700',    border:'border-red-200',    barCls:'bg-red-500'    }, // ✅ NEW
};

const TABS = [
  { value:'',            label:'All'         },
  { value:'open',        label:'Open'        },
  { value:'in_progress', label:'In Progress' },
  { value:'completed',   label:'Completed'   },
  { value:'cancelled',   label:'Cancelled'   },
  { value:'expired',     label:'Expired'     }, // ✅ NEW
];

/* ── Job Card ──────────────────────────────────────────────────────────────── */
const JobCard = ({ job, onEdit, onDelete, onComplete, completing, highlight }) => {
  const s               = STATUS[job.status] || STATUS.open;
  const applicantCount  = job.applicants?.length || 0;
  const pendingCount    = job.applicants?.filter(a => ['applied','shortlisted'].includes(a.status)).length || 0;
  const acceptedCount   = job.applicants?.filter(a => a.status === 'accepted').length || 0;
  const rejectedCount   = job.applicants?.filter(a => a.status === 'rejected').length || 0;
  const canEdit         = !['completed','cancelled'].includes(job.status);

  return (
    <div className={`bg-white rounded-2xl border-2 ${s.border} overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${highlight ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}>
      {/* Top colour bar */}
      <div className={`h-1.5 w-full ${s.barCls}`} />

      {/* Status header */}
      <div className={`${s.bg} px-5 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot} ${job.status === 'open' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
          {job.isUrgent && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              <Zap style={{width:9,height:9}}/> Urgent
            </span>
          )}
          {job.status === 'in_progress' && acceptedCount > 0 && (
            <span className="text-[11px] text-blue-600 font-semibold">
              · {acceptedCount} worker{acceptedCount!==1?'s':''} hired
            </span>
          )}
        </div>
        <span className="text-[11px] text-gray-400 flex-shrink-0">
          {new Date(job.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
        </span>
      </div>
      {/* Expiry Warning for Open Jobs */}
{job.status === 'open' && (
  <div className="mt-3">
    <CountdownTimer 
      expiresAt={job.expiresAt} 
      isExpired={job.isExpired}
      size="md"
    />
  </div>
)}

{job.isExpired && (
  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
    ⚠️ This job has expired and is no longer visible to workers. 
    <Link to={`/client/jobs/${job._id}/applicants`} className="font-bold underline ml-1">
      Review existing applicants
    </Link>
  </div>
)}

      <div className="p-5">
        {/* Title + applicant count */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-gray-900 text-base leading-snug truncate">{job.title}</h3>
            <span className="inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
              {job.category?.replace(/_/g,' ')}
            </span>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-display font-bold text-gray-900">{applicantCount}</p>
            <p className="text-[11px] text-gray-400">applicant{applicantCount!==1?'s':''}</p>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-orange-400" />
            {formatCurrency(job.budgetMin)}–{formatCurrency(job.budgetMax)}/{job.budgetType}
          </span>
          {job.location?.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {job.location.city}{job.location.state ? `, ${job.location.state}` : ''}
            </span>
          )}
          {job.startDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {new Date(job.startDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            {job.totalLabourNeeded} needed
          </span>
        </div>

        {/* Applicant breakdown bar */}
        {applicantCount > 0 && (
          <div className="mb-4">
            {/* Progress bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 mb-2">
              {acceptedCount > 0  && <div className="bg-green-500 transition-all" style={{width:`${(acceptedCount/applicantCount)*100}%`}} />}
              {pendingCount > 0   && <div className="bg-orange-400 transition-all" style={{width:`${(pendingCount/applicantCount)*100}%`}} />}
              {rejectedCount > 0  && <div className="bg-red-300 transition-all" style={{width:`${(rejectedCount/applicantCount)*100}%`}} />}
            </div>
            <div className="flex gap-3 flex-wrap">
              {pendingCount > 0   && <span className="flex items-center gap-1 text-[11px] text-orange-600 font-medium"><span className="w-2 h-2 rounded-full bg-orange-400"/>{pendingCount} pending</span>}
              {acceptedCount > 0  && <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium"><span className="w-2 h-2 rounded-full bg-green-500"/>{acceptedCount} accepted</span>}
              {rejectedCount > 0  && <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium"><span className="w-2 h-2 rounded-full bg-red-400"/>{rejectedCount} rejected</span>}
            </div>
          </div>
        )}

        {/* Cancelled reason */}
        {job.status === 'cancelled' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
            ⚠️ This job was cancelled. All applicants have been notified.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/client/jobs/${job._id}/applicants`}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            {applicantCount > 0 ? `${applicantCount} Applicant${applicantCount!==1?'s':''}` : 'View Applicants'}
          </Link>

          {canEdit && (
            <button
              onClick={() => onEdit(job)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}

          {job.status === 'in_progress' && (
            <button
              onClick={() => onComplete(job)}
              disabled={completing === job._id}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-green-200 text-xs font-semibold text-green-600 hover:bg-green-50 hover:border-green-400 transition-all disabled:opacity-60"
            >
              {completing === job._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Complete
            </button>
          )}
          {job.status !== 'cancelled' && (
            <button
              onClick={() => onDelete(job)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Edit Modal ────────────────────────────────────────────────────────────── */
const EditModal = ({ job, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title:       job.title       || '',
    description: job.description || '',
    budgetMin:   job.budgetMin   || '',
    budgetMax:   job.budgetMax   || '',
    budgetType:  job.budgetType  || 'daily',
    isUrgent:    job.isUrgent    || false,
    endDate:     job.endDate ? job.endDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (Number(form.budgetMax) < Number(form.budgetMin)) { toast.error('Max budget must be ≥ min'); return; }
    setLoading(true);
    try {
      await jobService.updateJob(job._id, form);
      toast.success('Job updated!');
      onSaved();
    } catch (err) { toast.error(err.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  const F = ({ label, children }) => (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );

  const cls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white text-gray-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{backdropFilter:'blur(6px)',background:'rgba(15,23,42,0.5)'}}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-display font-bold text-gray-900">Edit Job</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
          <F label="Job Title *">
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={cls} placeholder="e.g. Plumber needed for 3 days" />
          </F>
          <F label="Description">
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} className={`${cls} resize-none`} placeholder="Describe the work, tools needed, requirements…" />
          </F>
          <div className="grid grid-cols-3 gap-3">
            <F label="Min (₹)">
              <input type="number" value={form.budgetMin} onChange={e=>setForm(f=>({...f,budgetMin:e.target.value}))} className={cls} min={0} />
            </F>
            <F label="Max (₹)">
              <input type="number" value={form.budgetMax} onChange={e=>setForm(f=>({...f,budgetMax:e.target.value}))} className={cls} min={0} />
            </F>
            <F label="Pay Type">
              <select value={form.budgetType} onChange={e=>setForm(f=>({...f,budgetType:e.target.value}))} className={cls}>
                <option value="daily">Per Day</option>
                <option value="hourly">Per Hour</option>
                <option value="fixed">Fixed</option>
              </select>
            </F>
          </div>
          <F label="End Date">
            <input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} className={cls} />
          </F>
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Mark as Urgent</p>
              <p className="text-xs text-gray-400 mt-0.5">Urgent jobs get priority in worker search results</p>
            </div>
            <button onClick={()=>setForm(f=>({...f,isUrgent:!f.isUrgent}))}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.isUrgent?'bg-orange-500':'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.isUrgent?'left-6':'left-0.5'}`} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Delete Confirm Modal ──────────────────────────────────────────────────── */
const DeleteModal = ({ job, loading, onClose, onConfirm }) => {
  const activeApplicants = job.applicants?.filter(a => ['applied','shortlisted'].includes(a.status)).length || 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{backdropFilter:'blur(6px)',background:'rgba(15,23,42,0.5)'}}>
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="font-display font-bold text-gray-900 text-lg">Cancel Job Posting?</h3>
          <p className="text-sm text-gray-500 mt-2">
            <strong>"{job.title}"</strong> will be cancelled. Workers can no longer apply.
          </p>
          {activeApplicants > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-left">
              <p className="font-bold mb-1">⚠️ {activeApplicants} active applicant{activeApplicants!==1?'s':''} will be notified:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Each applicant receives a cancellation notification</li>
                <li>Their applications will show as "Cancelled"</li>
                <li>The job will move to your Cancelled tab</li>
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Keep Job
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Cancel Job
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
const ManageJobsPage = () => {
  const qc       = useQueryClient();
  const { on }   = useSocket();

  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [editJob,      setEditJob]      = useState(null);
  const [deleteJob,    setDeleteJob]    = useState(null);
  const [highlightId,  setHighlightId]  = useState(null);
  const [ratingModal,  setRatingModal]  = useState(null); // { job, labourUser }
  const [completing,   setCompleting]   = useState(null); // jobId being completed

  /* ── Real-time socket listeners ────────────────────────────────────────── */
  useEffect(() => {
    // When a labour is accepted → job becomes in_progress → update card in real-time
    const offStatusChanged = on('job:statusChanged', ({ jobId, jobStatus }) => {
      qc.setQueryData(
        ['my-postings', { status: statusFilter, page }],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map(j =>
              j._id === jobId ? { ...j, status: jobStatus } : j
            ),
          };
        }
      );
      // Highlight the changed card
      setHighlightId(jobId);
      setTimeout(() => setHighlightId(null), 3000);
    });

    // When job deleted (e.g. from admin), update locally
    const offDeleted = on('job:deleted', ({ jobId }) => {
      qc.setQueryData(
        ['my-postings', { status: statusFilter, page }],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map(j =>
              j._id === jobId ? { ...j, status: 'cancelled' } : j
            ),
          };
        }
      );
    });

    return () => { offStatusChanged?.(); offDeleted?.(); };
  }, [on, qc, statusFilter, page]);

  /* ── Query ─────────────────────────────────────────────────────────────── */
  const { data: allJobsData } = useQuery({
  queryKey: ['my-postings-all'],
  queryFn: () => jobService.getMyPostings({ page: 1, limit: 1000 }) // no status filter
                  .then(r => r.data),
  staleTime: 1000 * 60 * 5, // cache 5 min
});

 const allJobs = allJobsData?.data || [];
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-postings', { status: statusFilter, page }],
    queryFn:  () => jobService.getMyPostings({ status: statusFilter || undefined, page, limit: 10 })
                      .then(r => r.data),
    keepPreviousData: true,
    refetchInterval: 30000,
  });

  const jobs       = data?.data            || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = allJobs.length;

  // Tab counts from all fetched data (use overall totals from server if available)

const counts = allJobs.reduce((acc, j) => {
  acc[j.status] = (acc[j.status] || 0) + 1;
  return acc;
}, {});

  /* ── Delete ─────────────────────────────────────────────────────────────── */
  const deleteMut = useMutation({
    mutationFn: (id) => jobService.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries(['my-postings']);
      qc.invalidateQueries(['jobs']);
      toast.success('Job cancelled — applicants notified');
      setDeleteJob(null);
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  });

  const handleComplete = async (job) => {
    if (!window.confirm(`Mark "${job.title}" as completed? This cannot be undone.`)) return;
    setCompleting(job._id);
    try {
      await jobService.completeJob(job._id);
      qc.invalidateQueries(['my-postings']);
      qc.invalidateQueries(['jobs']);
      toast.success('Job marked as completed!');
      // Open rating modal for first accepted labour
      const accepted = job.applicants?.filter(a => a.status === 'accepted');
      if (accepted?.length > 0) {
        setRatingModal({
          job,
          ratedUsers: accepted.map(a => a.labour).filter(Boolean),
          currentIdx: 0,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed');
    } finally {
      setCompleting(null);
    }
  };

  if (isError) return (
    <div className="text-center py-16">
      <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">Failed to load job postings.</p>
      <button onClick={() => qc.invalidateQueries(['my-postings'])}
        className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">My Job Postings</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {total > 0 ? `${total} total posting${total!==1?'s':''}` : 'No jobs posted yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => qc.invalidateQueries(['my-postings'])}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link to="/client/post-job"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200 transition-all">
            <PlusCircle className="w-4 h-4" /> Post New Job
          </Link>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => {
          const count = t.value ? (counts[t.value] || 0) : total;
          const s     = t.value ? STATUS[t.value] : null;
          return (
            <button key={t.value}
              onClick={() => { setStatusFilter(t.value); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                statusFilter === t.value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
              }`}>
              {t.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusFilter === t.value ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-52 skeleton rounded-2xl animate-pulse" />)}
        </div>
      ) : jobs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <JobCard
                key={job._id}
                job={job}
                onEdit={j => setEditJob(j)}
                onDelete={j => setDeleteJob(j)}
                onComplete={handleComplete}
                completing={completing}
                highlight={highlightId === job._id}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={Briefcase}
          title={statusFilter ? `No ${STATUS[statusFilter]?.label || ''} jobs` : 'No job postings yet'}
          description={
            statusFilter === 'cancelled'
              ? 'No cancelled jobs. Cancelled jobs appear here when you delete a posting.'
              : statusFilter
              ? 'Try a different status tab.'
              : 'Post your first job to start receiving applications from verified workers.'
          }
          action={
            statusFilter
              ? <button onClick={() => setStatusFilter('')} className="btn-outline btn">Show All</button>
              : <Link to="/client/post-job" className="btn-accent btn">Post First Job</Link>
          }
        />
      )}

      {/* Modals */}
      {editJob && (
        <EditModal
          job={editJob}
          onClose={() => setEditJob(null)}
          onSaved={() => {
            qc.invalidateQueries(['my-postings']);
            qc.invalidateQueries(['jobs']);
            setEditJob(null);
          }}
        />
      )}

      {deleteJob && (
        <DeleteModal
          job={deleteJob}
          loading={deleteMut.isPending}
          onClose={() => setDeleteJob(null)}
          onConfirm={() => deleteMut.mutate(deleteJob._id)}
        />
      )}

      {/* Rating modal — appears after marking job complete */}
      {ratingModal && ratingModal.ratedUsers?.[ratingModal.currentIdx] && (
        <RatingModal
          job={ratingModal.job}
          ratedUser={ratingModal.ratedUsers[ratingModal.currentIdx]}
          onClose={() => setRatingModal(null)}
          onSuccess={() => {
            const nextIdx = ratingModal.currentIdx + 1;
            if (nextIdx < ratingModal.ratedUsers.length) {
              setRatingModal(r => ({ ...r, currentIdx: nextIdx }));
            } else {
              setRatingModal(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default ManageJobsPage;