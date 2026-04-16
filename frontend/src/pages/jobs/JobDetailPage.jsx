import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Building2 } from 'lucide-react';
import {
  MapPin, Clock, Users, IndianRupee, Calendar, ArrowLeft,
  Zap, MessageCircle, CheckCircle, X, AlertTriangle,
  XCircle, Loader2, Shield, Star, Eye, Briefcase,
  RefreshCw
} from 'lucide-react';
import jobService   from '@/services/jobService';
import chatService  from '@/services/chatService';
import { useAuth }  from '@/context/AuthContext';
import { useProfileGate } from '@/hooks/useProfileGate';
import ProfileGateBanner from '@/components/common/ProfileGateBanner';
import { useSocket } from '@/context/SocketContext';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import Avatar        from '@/components/common/Avatar';
// ✅ REMOVED: import Navbar from '@/components/layout/Navbar';
import { formatDate, formatCurrency, JOB_STATUS_LABELS, JOB_STATUS_CSS } from '@/utils/helpers';
import toast from 'react-hot-toast';

/* ── Guard banner component ────────────────────────────────────────────────── */
const GuardBanner = ({ type, children }) => {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
    error:   'bg-red-50   border-red-200   text-red-700   dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
    success: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
    info:    'bg-blue-50  border-blue-200  text-blue-700  dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
  };
  const icons = {
    warning: <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    error:   <XCircle       className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle   className="w-4 h-4 flex-shrink-0 mt-0.5" />,
    info:    <Shield        className="w-4 h-4 flex-shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  );
};

/* ── Apply Modal ───────────────────────────────────────────────────────────── */
const ApplyModal = ({ job, onClose, onSuccess }) => {
  const [proposal, setProposal] = useState('');
  const [wage,     setWage]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const minWage = job.budgetMin || 0;
  const maxWage = job.budgetMax || Infinity;

  const validate = () => {
    if (!wage || isNaN(Number(wage)) || Number(wage) <= 0) {
      setError('Please enter your expected daily wage.'); return false;
    }
    if (Number(wage) < minWage * 0.5) {
      setError(`Wage seems too low. Minimum budget is ₹${minWage}.`); return false;
    }
    if (Number(wage) > maxWage * 2) {
      setError(`Wage seems too high. Maximum budget is ₹${maxWage}.`); return false;
    }
    return true;
  };

  const handleApply = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await jobService.applyToJob(job._id, {
        proposalMsg:  proposal.trim(),
        proposedWage: Number(wage),
      });
      toast.success('Application submitted! Check My Applications for updates.', { duration: 5000, icon: '✅' });
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Application failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(15,23,42,0.5)' }}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-gray-900 dark:text-white">Apply for Job</h3>
            <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5 truncate max-w-[260px]">{job.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-600 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Your Expected Daily Wage (₹) *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={wage}
                onChange={e => { setWage(e.target.value); setError(''); }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900"
                placeholder={`${minWage}–${maxWage}`}
                min={0}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              Client's budget: ₹{minWage}–₹{maxWage}/{job.budgetType}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Proposal Message <span className="text-gray-400 dark:text-slate-500 normal-case font-normal">(optional but recommended)</span>
            </label>
            <textarea
              value={proposal}
              onChange={e => setProposal(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 resize-none"
              placeholder="Introduce yourself. Why are you a good fit?…"
            />
            <p className="text-xs text-gray-400 dark:text-slate-500 text-right mt-1">{proposal.length}/500</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl p-3 text-xs text-orange-700 dark:text-orange-300 space-y-1">
            <p className="font-semibold">💡 Tips for a stronger application:</p>
            <ul className="list-disc list-inside space-y-0.5 text-orange-600 dark:text-orange-400">
              <li>Mention your relevant skills and years of experience</li>
              <li>Keep your wage expectation realistic</li>
              <li>Respond quickly if the client messages you</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleApply} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-orange-200">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── MAIN PAGE ──────────────────────────────────────────────────────────────── */
const JobDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const { user, isAuthenticated, isLabour } = useAuth();
  const { on }   = useSocket();

  // Scoped dark mode — use labour role if logged in as labour, else public
  const role = user?.role || 'public';
  const { wrapperProps } = useRoleTheme(role);

  const [applyOpen, setApplyOpen] = useState(false);
  const [jobDeleted, setJobDeleted] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn:  () => jobService.getJobById(id).then(r => r.data.data),
    retry: 1,
  });

  useEffect(() => {
    const offDeleted = on('job:deleted', ({ jobId }) => {
      if (jobId === id) setJobDeleted(true);
    });
    const offUpdated = on('job:updated', ({ _id }) => {
      if (_id === id || _id === id.toString()) refetch();
    });
    return () => { offDeleted?.(); offUpdated?.(); };
  }, [on, id, refetch]);

  const withdrawMut = useMutation({
    mutationFn: () => jobService.withdrawApplication(id),
    onSuccess: () => {
      qc.invalidateQueries(['job', id]);
      qc.invalidateQueries(['my-applications']);
      toast.success('Application withdrawn successfully.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Could not withdraw application.');
    },
  });

  const chatMut = useMutation({
    mutationFn: () => chatService.getOrCreateConversation({ participantId: data?.postedBy?._id, jobId: id }),
    onSuccess: (res) => navigate(`/labour/chat/${res.data.data._id}`),
    onError:   (err) => toast.error(err.message),
  });

  const { canAct: gateOpen } = useProfileGate();

  // ✅ REMOVED: All <Navbar /> references from loading and error states
  if (isLoading) return (
    <div {...wrapperProps}>
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="skeleton h-6 w-24 rounded" />
        <div className="skeleton h-10 w-2/3 rounded" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
      </div>
    </div>
  );

  if (jobDeleted) return (
    <div {...wrapperProps}>
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Job No Longer Available</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">This job has been cancelled by the client.</p>
        <div className="flex items-center gap-3 justify-center">
          <Link to="/jobs" className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
            Browse Other Jobs
          </Link>
          <Link to="/labour/applications" className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            My Applications
          </Link>
        </div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div {...wrapperProps}>
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-slate-400 mb-4">Job not found or may have been removed.</p>
        <Link to="/jobs" className="btn-outline btn">← Back to Jobs</Link>
      </div>
    </div>
  );

  const job    = data;
  const myApp  = job.applicants?.find(a => {
    const lid = a.labour?._id || a.labour;
    return lid?.toString() === user?._id?.toString();
  });
  const isOwner       = job.postedBy?._id?.toString() === user?._id?.toString();
  const isOpen        = job.status === 'open';
  const isCancelled   = job.status === 'cancelled';
  const isInProgress  = job.status === 'in_progress';
  const isCompleted   = job.status === 'completed';
  const alreadyApplied = !!myApp;
  const canApply = isLabour && isOpen && !alreadyApplied && !isOwner && isAuthenticated && gateOpen;
  const canWithdraw   = alreadyApplied && ['applied','shortlisted'].includes(myApp?.status);
  const wasAccepted   = myApp?.status === 'accepted';
  const wasRejected   = myApp?.status === 'rejected';

  const statusCss   = JOB_STATUS_CSS[job.status]   || 'badge-gray';
  const statusLabel = JOB_STATUS_LABELS[job.status] || job.status;

  return (
    <div {...wrapperProps}>
      {/* ✅ REMOVED: <Navbar /> - Layout already provides it */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fade-in">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors -ml-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {isCancelled && (
          <GuardBanner type="error">
            <strong>This job has been cancelled</strong> by the client. Applications are closed.
            {myApp && ' Your application has been marked as cancelled.'}
          </GuardBanner>
        )}
        {isInProgress && !myApp && isLabour && (
          <GuardBanner type="warning">
            <strong>This job is currently In Progress</strong> — the client has already hired workers and is not accepting new applications.
          </GuardBanner>
        )}
        {isCompleted && (
          <GuardBanner type="info">
            <strong>This job has been completed.</strong> Applications are no longer accepted.
          </GuardBanner>
        )}
        {alreadyApplied && isOpen && (
          <GuardBanner type={wasAccepted ? 'success' : wasRejected ? 'error' : 'info'}>
            {wasAccepted  && <><strong>🎉 You were accepted for this job!</strong> Contact the client to confirm start details.</>}
            {wasRejected  && <><strong>Not selected this time.</strong> Keep applying — more jobs are available.</>}
            {!wasAccepted && !wasRejected && (
              <><strong>You have already applied to this job.</strong> Status: <span className="capitalize font-semibold">{myApp.status}</span>. Check My Applications for updates.</>
            )}
          </GuardBanner>
        )}
        {!isAuthenticated && (
          <GuardBanner type="info">
            <strong>Login required to apply.</strong>{' '}
            <Link to="/login" className="underline font-semibold">Sign in here</Link> to submit your application.
          </GuardBanner>
        )}

        {/* ── MAIN JOB CARD ── */}
        <div className="card">
          <div className="card-body-lg space-y-5">

            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`badge ${statusCss}`}>{statusLabel}</span>
                  {job.isUrgent && (
                    <span className="badge badge-orange flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Urgent
                    </span>
                  )}
                  {job.isGroupJob && <span className="badge-gray badge">Group Job</span>}
                </div>
                <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{job.title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">{job.category?.replace(/_/g,' ')}</p>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <Avatar src={job.postedBy?.avatar?.url} name={job.postedBy?.name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{job.postedBy?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Client</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
  <Avatar src={job.postedBy?.avatar?.url} name={job.postedBy?.name} size="md" />
  <div>
    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{job.postedBy?.name}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400">Client</p>
  </div>

  {/* ✅ NEW: View Client Profile Button */}
  {isLabour && job.postedBy?._id && (
    <Link 
      to={`/client/${job.postedBy._id}`}
      className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-200"
    >
      <Building2 className="w-3.5 h-3.5" />
      View Profile
    </Link>
  )}
</div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: IndianRupee, label:'Budget',        value:`₹${job.budgetMin}–₹${job.budgetMax}/${job.budgetType}` },
                { icon: Users,       label:'Workers Needed', value:`${job.totalLabourNeeded} worker${job.totalLabourNeeded>1?'s':''}` },
                { icon: Calendar,    label:'Start Date',    value: formatDate(job.startDate) },
                { icon: MapPin,      label:'Location',      value: job.location?.city ? `${job.location.city}${job.location.state?', '+job.location.state:''}` : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-surface-50 dark:bg-slate-700/50 rounded-xl p-3 border border-surface-200 dark:border-slate-600">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1 line-clamp-1">{value || '—'}</p>
                </div>
              ))}
            </div>

            {job.description && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Job Description</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            )}

            {job.requirements?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Skill Requirements</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map(r => (
                    <span key={r.skill} className="badge-blue badge">{r.skill} × {r.count}</span>
                  ))}
                </div>
              </div>
            )}

            {job.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.tags.map(t => <span key={t} className="badge-gray badge">#{t}</span>)}
              </div>
            )}

            {isLabour && !myApp && isOpen && (
              <div className="pt-3 border-t border-surface-100 dark:border-slate-700">
                <ProfileGateBanner action="apply" />
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-3 border-t border-surface-100 dark:border-slate-700">
              {canApply && (
                <button
                  onClick={() => setApplyOpen(true)}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-200 text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Apply Now
                </button>
              )}

              {isLabour && alreadyApplied && (
                <div className="flex items-center gap-3 flex-1 flex-wrap">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
                    wasAccepted ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' :
                    wasRejected ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300' :
                    'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                  }`}>
                    {wasAccepted  && <CheckCircle className="w-4 h-4" />}
                    {wasRejected  && <XCircle className="w-4 h-4" />}
                    {!wasAccepted && !wasRejected && <Clock className="w-4 h-4" />}
                    Applied · {myApp?.status?.charAt(0).toUpperCase() + myApp?.status?.slice(1)}
                  </div>
                  {canWithdraw && (
                    <button
                      onClick={() => {
                        if (window.confirm('Withdraw this application? This cannot be undone.')) {
                          withdrawMut.mutate();
                        }
                      }}
                      disabled={withdrawMut.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-700 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-60"
                    >
                      {withdrawMut.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <XCircle className="w-3.5 h-3.5" />
                      }
                      Withdraw
                    </button>
                  )}
                  <Link to="/labour/applications"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:border-orange-300 hover:text-orange-600 transition-all">
                    <Eye className="w-3.5 h-3.5" /> My Applications
                  </Link>
                </div>
              )}

              {!isAuthenticated && isOpen && (
                <Link to="/login"
                  className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all text-sm text-center">
                  Login to Apply
                </Link>
              )}

              {isOwner && (
                <Link to={`/client/jobs/${job._id}/applicants`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all text-sm shadow-lg shadow-orange-200">
                  <Users className="w-4 h-4" />
                  View Applicants ({job.applicants?.length || 0})
                </Link>
              )}

              {isLabour && !isOwner && alreadyApplied && wasAccepted && (
                <button
                  onClick={() => chatMut.mutate()}
                  disabled={chatMut.isPending}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                >
                  {chatMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  Message Client
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Applicants preview (owner only) */}
        {isOwner && job.applicants?.length > 0 && (
          <div className="card card-body space-y-3">
            <h2 className="section-title">Applicants ({job.applicants.length})</h2>
            {job.applicants.slice(0, 4).map(app => (
              <div key={app._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-slate-700/50 border border-surface-200 dark:border-slate-600">
                <Avatar src={app.labour?.avatar?.url} name={app.labour?.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{app.labour?.name}</p>
                  {app.proposedWage > 0 && <p className="text-xs text-orange-600 font-medium">₹{app.proposedWage}/day</p>}
                  {app.proposalMsg && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{app.proposalMsg}</p>}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  app.status === 'accepted'    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  app.status === 'rejected'    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                  app.status === 'shortlisted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
            {job.applicants.length > 4 && (
              <Link to={`/client/jobs/${job._id}/applicants`}
                className="text-sm text-primary font-semibold hover:underline text-center block">
                View all {job.applicants.length} applicants →
              </Link>
            )}
          </div>
        )}

        {isLabour && !isAuthenticated && (
          <div className="text-center py-4">
            <Link to="/login" className="text-orange-500 font-semibold hover:underline text-sm">
              Login to apply for this job →
            </Link>
          </div>
        )}
      </div>

      {applyOpen && (
        <ApplyModal
          job={job}
          onClose={() => setApplyOpen(false)}
          onSuccess={() => {
            setApplyOpen(false);
            qc.invalidateQueries(['job', id]);
            qc.invalidateQueries(['my-applications']);
            qc.invalidateQueries(['recommended-jobs']);
            qc.invalidateQueries(['jobs']);
          }}
        />
      )}
    </div>
  );
};

export default JobDetailPage;