import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle, XCircle, MessageCircle, Star,
  Users, Clock, MapPin, IndianRupee,
  Loader2, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';
import jobService   from '@/services/jobService';
import chatService  from '@/services/chatService';
import Avatar       from '@/components/common/Avatar';
import { RatingStars, EmptyState } from '@/components/common/UIComponents';
import { formatCurrency } from '@/utils/helpers';
import toast from 'react-hot-toast';
import RatingModal from '@/components/common/RatingModal';

/* ── Status config ─────────────────────────────────────────────────────────── */
const A_STATUS = {
  applied:     { label:'Pending',     bg:'bg-blue-100',  text:'text-blue-700',  dot:'bg-blue-500'  },
  shortlisted: { label:'Shortlisted', bg:'bg-amber-100', text:'text-amber-700', dot:'bg-amber-500' },
  accepted:    { label:'Accepted',    bg:'bg-green-100', text:'text-green-700', dot:'bg-green-500' },
  rejected:    { label:'Rejected',    bg:'bg-red-100',   text:'text-red-700',   dot:'bg-red-400'   },
  withdrawn:   { label:'Withdrawn',   bg:'bg-gray-100',  text:'text-gray-600',  dot:'bg-gray-400'  },
};

/* ── Applicant Card ────────────────────────────────────────────────────────── */
const ApplicantCard = ({ app, jobId, jobTitle, pendingMutationId, onAction, onChat, onRate }) => {
  const [expanded, setExpanded] = useState(false);
  const isBusy    = pendingMutationId === app.labour?._id;
  const meta      = A_STATUS[app.status] || A_STATUS.applied;
  const canDecide = ['applied', 'shortlisted'].includes(app.status);

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-200 hover:shadow-md overflow-hidden ${canDecide ? 'border-orange-100' : 'border-gray-100'}`}>
      <div className={`h-1 w-full ${app.status === 'accepted' ? 'bg-green-500' : app.status === 'rejected' ? 'bg-red-400' : 'bg-orange-400'}`} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link to={`/labourers/${app.labour?._id}`} className="flex-shrink-0">
            <div className="relative">
              <img
                src={app.labour?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.labour?.name || 'L')}&background=f97316&color=fff&size=64`}
                alt={app.labour?.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-100"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${meta.dot}`} />
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`/labourers/${app.labour?._id}`}
                  className="font-bold text-gray-900 hover:text-orange-600 transition-colors truncate block">
                  {app.labour?.name || 'Worker'}
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  {app.labour?.labourProfile?.aadhaarDoc?.status === 'approved' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">✓ Verified</span>
                  )}
                </div>
              </div>
              {app.proposedWage > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-orange-600 text-base">{formatCurrency(app.proposedWage)}</p>
                  <p className="text-[11px] text-gray-400">per day</p>
                </div>
              )}
            </div>

            {app.proposalMsg && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                "{app.proposalMsg}"
              </p>
            )}
          </div>
        </div>

        {/* Expand proposal */}
        {app.proposalMsg && (
          <button onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Less' : 'Full proposal'}
          </button>
        )}
        {expanded && app.proposalMsg && (
          <div className="mt-2 p-3 bg-orange-50 rounded-xl border border-orange-100 text-sm text-gray-700 leading-relaxed">
            {app.proposalMsg}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-50">
          <button onClick={() => onChat(app.labour?._id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <MessageCircle className="w-3.5 h-3.5" /> Message
          </button>

          <Link to={`/labourers/${app.labour?._id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all">
            View Profile
          </Link>

          {canDecide && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => onAction(app.labour?._id, 'rejected')}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Reject
              </button>
              <button
                onClick={() => onAction(app.labour?._id, 'accepted', app.proposedWage)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-all disabled:opacity-50 shadow-sm"
              >
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Accept
              </button>
            </div>
          )}

          {app.status === 'accepted' && (
            <div className="ml-auto flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                <CheckCircle className="w-3.5 h-3.5" /> Accepted ✓
              </span>
              {onRate && (
                <button
                  onClick={e => { e.stopPropagation(); onRate(app); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Rate
                </button>
              )}
            </div>
          )}

          {app.status === 'rejected' && (
            <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              Rejected
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── MAIN PAGE ──────────────────────────────────────────────────────────────── */
const JobApplicantsPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [busyId,      setBusyId]      = useState(null);
  const [ratingModal, setRatingModal] = useState(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn:  () => jobService.getJobById(id).then(r => r.data.data),
    refetchInterval: 15000,
  });

  const handleAction = async (labourId, status, agreedWage) => {
    setBusyId(labourId);
    try {
      await jobService.updateApplicantStatus(id, labourId, { status, agreedWage });
      qc.invalidateQueries(['job', id]);
      qc.invalidateQueries(['my-postings']);
      const labels = { accepted: 'Labour accepted!', rejected: 'Application rejected.', shortlisted: 'Shortlisted!' };
      toast.success(labels[status] || 'Updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const chatMut = useMutation({
    mutationFn: (participantId) => chatService.getOrCreateConversation({ participantId, jobId: id }),
    onSuccess:  (res) => navigate(`/client/chat/${res.data.data._id}`),
    onError:    (err) => toast.error(err.message),
  });

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 skeleton w-48 rounded" />
      {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
    </div>
  );

  if (!job) return <p className="text-slate-500">Job not found.</p>;

  const applicants = job.applicants || [];
  const pending    = applicants.filter(a => ['applied', 'shortlisted'].includes(a.status));
  const accepted   = applicants.filter(a => a.status === 'accepted');
  const rejected   = applicants.filter(a => a.status === 'rejected');

  const rateHandler = job.status === 'completed'
    ? (a) => setRatingModal({
        job,
        ratedUser: { _id: a.labour?._id, name: a.labour?.name, avatar: a.labour?.avatar, role: 'labour' },
      })
    : null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to My Postings
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="page-title truncate">{job.title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {job.location?.city} · {formatCurrency(job.budgetMin)}–{formatCurrency(job.budgetMax)}/{job.budgetType}
            </p>
          </div>
          <Link to="/client/jobs"
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all">
            <Briefcase className="w-3.5 h-3.5" /> All Postings
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: applicants.length, bg: 'bg-gray-50',  text: 'text-gray-700',  border: 'border-gray-200'  },
          { label: 'Pending',  value: pending.length,    bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200'  },
          { label: 'Accepted', value: accepted.length,   bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
          { label: 'Rejected', value: rejected.length,   bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200'   },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-3 text-center`}>
            <p className={`text-2xl font-display font-bold ${s.text}`}>{s.value}</p>
            <p className={`text-xs mt-0.5 ${s.text} opacity-80`}>{s.label}</p>
          </div>
        ))}
      </div>

      {applicants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="Share your job link to attract workers. Matching workers will also be notified automatically."
        />
      ) : (
        <div className="space-y-6">

          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                Pending Review <span className="text-orange-500">({pending.length})</span>
              </h2>
              {pending.map(app => (
                <ApplicantCard key={app._id} app={app} jobId={id} jobTitle={job.title}
                  pendingMutationId={busyId} onAction={handleAction}
                  onChat={labourId => chatMut.mutate(labourId)}
                  onRate={rateHandler}
                />
              ))}
            </div>
          )}

          {/* Accepted */}
          {accepted.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Accepted <span className="text-green-600">({accepted.length})</span>
              </h2>
              {accepted.map(app => (
                <ApplicantCard key={app._id} app={app} jobId={id} jobTitle={job.title}
                  pendingMutationId={busyId} onAction={handleAction}
                  onChat={labourId => chatMut.mutate(labourId)}
                  onRate={rateHandler}
                />
              ))}
            </div>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-bold text-gray-500 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                Not Selected <span className="text-red-400">({rejected.length})</span>
              </h2>
              {rejected.map(app => (
                <ApplicantCard key={app._id} app={app} jobId={id} jobTitle={job.title}
                  pendingMutationId={busyId} onAction={handleAction}
                  onChat={labourId => chatMut.mutate(labourId)}
                  onRate={rateHandler}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rating modal */}
      {ratingModal && (
        <RatingModal
          job={ratingModal.job}
          ratedUser={ratingModal.ratedUser}
          onClose={() => setRatingModal(null)}
          onSuccess={() => {
            qc.invalidateQueries(['job', id]);
            setRatingModal(null);
            toast.success('Rating submitted!');
          }}
        />
      )}
    </div>
  );
};

export default JobApplicantsPage;