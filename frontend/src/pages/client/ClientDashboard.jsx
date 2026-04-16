import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import CountdownTimer from '@/components/common/CountdownTimer';
import {
  Briefcase, Users, CheckCircle, Clock,
  ArrowRight, PlusCircle, Bell, XCircle,
  TrendingUp, IndianRupee, Zap, RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth }   from '@/context/AuthContext';
import ProfileGateBanner from '@/components/common/ProfileGateBanner';
import { useProfileGate } from '@/hooks/useProfileGate';
import { useSocket } from '@/context/SocketContext';
import jobService    from '@/services/jobService';
import { EmptyState, SkeletonCard } from '@/components/common/UIComponents';
import toast from 'react-hot-toast';

/* ── Animated counter ──────────────────────────────────────────────────────── */
const AnimCount = ({ value, duration = 600 }) => {
  const [display, setDisplay] = useState(0);
  const prev   = useRef(0);
  const frameR = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const start  = prev.current;
    const diff   = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * ease));
      if (progress < 1) frameR.current = requestAnimationFrame(tick);
      else prev.current = target;
    };
    frameR.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameR.current);
  }, [value, duration]);

  return <span>{display}</span>;
};

/* ── Job mini-card for recent postings ─────────────────────────────────────── */
const JobMiniCard = ({ job }) => {
  const statusCls = {
    open:        'border-green-200 bg-green-50',
    in_progress: 'border-blue-200  bg-blue-50',
    completed:   'border-gray-200  bg-gray-50',
    cancelled:   'border-red-200   bg-red-50',
    expired:     'border-red-200   bg-red-50',
  };
  const statusDot = {
    open:        'bg-green-500 animate-pulse',
    in_progress: 'bg-blue-500',
    completed:   'bg-gray-400',
    cancelled:   'bg-red-400',
    expired:     'bg-red-500', 
  };
  const statusLabel = {
    open:        'Open',
    in_progress: 'In Progress',
    completed:   'Completed',
    cancelled:   'Cancelled',
    expired:     'Expired', 
  };

  const pendingCount = job.applicants?.filter(a => ['applied','shortlisted'].includes(a.status)).length || 0;

  return (
    <Link to={`/client/jobs/${job._id}/applicants`}
      className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 ${statusCls[job.status] || 'border-gray-200 bg-white'} hover:shadow-sm transition-all group`}>
      <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-4 h-4 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
          {job.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-600">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[job.status] || 'bg-gray-400'}`} />
            {statusLabel[job.status] || job.status}
          </span>
          {pendingCount > 0 && (
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
              {pendingCount} pending
            </span>
          )}
          <span className="text-[11px] text-gray-400">
            {job.applicants?.length || 0} applicant{job.applicants?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-1" />
      {/* ✅ NEW: Countdown Timer for client's jobs */}
      {job.status === 'open' && (
        <div className="mt-1">
          <CountdownTimer 
            expiresAt={job.expiresAt} 
            isExpired={job.isExpired}
            size="sm"
          />
        </div>
      )}

      {job.isExpired && (
        <p className="text-[10px] text-red-600 font-medium">
          ⚠️ This job has expired and is no longer accepting applications
        </p>
      )}
    </Link>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const ClientDashboard = () => {
  const { user } = useAuth();
  const qc       = useQueryClient();
  const { on }   = useSocket();

  const [liveNotif, setLiveNotif] = useState(null);
  const { canAct } = useProfileGate();

  /* ── Queries ─────────────────────────────────────────────────────────────── */
  const { data: postingsData, isLoading } = useQuery({
    queryKey: ['my-postings', { status: '', page: 1 }],
    queryFn:  () => jobService.getMyPostings({ page: 1, limit: 10 }).then(r => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const jobs  = postingsData?.data        || [];
  const total = postingsData?.meta?.total || 0;

  /* ── Derived stats ───────────────────────────────────────────────────────── */
  const open        = jobs.filter(j => j.status === 'open').length;
  const inProgress  = jobs.filter(j => j.status === 'in_progress').length;
  const completed   = jobs.filter(j => j.status === 'completed').length;
  const cancelled   = jobs.filter(j => j.status === 'cancelled').length;

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants?.length || 0), 0);
  const pendingApplicants = jobs.reduce((sum, j) => sum + (j.applicants?.filter(a => ['applied','shortlisted'].includes(a.status)).length || 0), 0);

  /* ── Real-time socket ────────────────────────────────────────────────────── */
  useEffect(() => {
    /* New application comes in */
    const offApply = on('notification:new', (notif) => {
      if (notif.type === 'job_applied') {
        qc.invalidateQueries(['my-postings']);
        setLiveNotif({
          msg:  `${notif.senderName} applied for a job!`,
          type: 'info',
        });
        setTimeout(() => setLiveNotif(null), 6000);
      }
    });

    /* Job status changed (open → in_progress) */
    const offStatusChanged = on('job:statusChanged', () => {
      qc.invalidateQueries(['my-postings']);
    });

    /* Application withdrawn by labour */
    const offWithdrawn = on('application:withdrawn', ({ labourName }) => {
      qc.invalidateQueries(['my-postings']);
      setLiveNotif({ msg: `${labourName} withdrew their application.`, type: 'warning' });
      setTimeout(() => setLiveNotif(null), 5000);
    });

    return () => { offApply?.(); offStatusChanged?.(); offWithdrawn?.(); };
  }, [on, qc]);

  /* ── Greeting ───────────────────────────────────────────────────────────── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* ── Stats config ────────────────────────────────────────────────────────── */
  const stats = [
    { label:'Total Postings',    value: total,           icon: Briefcase,    color:'text-primary',   bg:'bg-primary-50',   live: false },
    { label:'Open Jobs',         value: open,            icon: Clock,        color:'text-warning',   bg:'bg-warning-light',live: true  },
    { label:'In Progress',       value: inProgress,      icon: TrendingUp,   color:'text-blue-500',  bg:'bg-blue-50',      live: true  },
    { label:'Pending Applicants',value: pendingApplicants,icon:Users,        color:'text-accent',    bg:'bg-accent-50',    live: true  },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Live notification flash ────────────────────────────────────────── */}
      {liveNotif && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium animate-fade-in ${
          liveNotif.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{liveNotif.msg}</span>
          <Link to="/client/jobs"
            className="text-xs font-bold underline opacity-80 hover:opacity-100 mr-2">
            View Jobs
          </Link>
          <button onClick={() => setLiveNotif(null)} className="opacity-60 hover:opacity-100">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {pendingApplicants > 0
              ? <span className="text-orange-600 font-semibold">{pendingApplicants} applicant{pendingApplicants!==1?'s':''} waiting for your response</span>
              : 'Manage your job postings and hired workers.'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { qc.invalidateQueries(['my-postings']); toast.success('Dashboard refreshed'); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {canAct ? (
            <Link to="/client/post-job"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200 transition-all hidden sm:flex">
              <PlusCircle className="w-4 h-4" /> Post a Job
            </Link>
          ) : (
            <Link to="/client/settings"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-200 text-gray-500 text-sm font-semibold hidden sm:flex cursor-not-allowed" title="Verify your Aadhaar to post jobs">
              🔒 Verify to Post
            </Link>
          )}
        </div>
      </div>

      {/* ── Pending applicants alert ───────────────────────────────────────── */}
      {pendingApplicants > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-orange-50 border-2 border-orange-200">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-orange-800 text-sm">
              {pendingApplicants} applicant{pendingApplicants!==1?'s':''} waiting for your response
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              Review and accept or reject applicants to move your jobs forward.
            </p>
          </div>
          <Link to="/client/jobs"
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors">
            Review Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Stats grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border border-surface-200 ${s.bg} relative overflow-hidden`}>
            {s.live && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Updates in real-time" />
            )}
            <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-display font-bold ${s.color}`}>
              <AnimCount value={s.value} />
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Status breakdown row ──────────────────────────────────────────── */}
      {total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:'Open',        value: open,        cls:'border-green-200 bg-green-50  text-green-700',  dot:'bg-green-500 animate-pulse' },
            { label:'In Progress', value: inProgress,  cls:'border-blue-200  bg-blue-50   text-blue-700',   dot:'bg-blue-500'                },
            { label:'Completed',   value: completed,   cls:'border-gray-200  bg-gray-50   text-gray-600',   dot:'bg-gray-400'                },
            { label:'Cancelled',   value: cancelled,   cls:'border-red-200   bg-red-50    text-red-600',    dot:'bg-red-400'                 },
          ].map(s => (
            <button key={s.label}
              onClick={() => { /* navigate to managed jobs with filter */ }}
              className={`flex flex-col items-center p-3 rounded-2xl border-2 ${s.cls} hover:shadow-sm transition-all`}>
              <div className="flex items-center gap-1 mb-1">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              </div>
              <p className="text-xl font-display font-bold"><AnimCount value={s.value} /></p>
              <p className="text-[11px] font-semibold mt-0.5 opacity-80">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to:'/client/post-job',  icon:PlusCircle, label:'Post a New Job',   desc:'Hire workers quickly',   cls:'bg-accent-50  border-accent-200  text-accent-700'   },
          { to:'/client/labourers', icon:Users,      label:'Browse Workers',   desc:'Find skilled labourers', cls:'bg-primary-50 border-primary-200 text-primary-700' },
          { to:'/client/jobs',      icon:Briefcase,  label:'Manage All Jobs',  desc:'View and edit postings', cls:'bg-surface-100 border-surface-300 text-slate-700'  },
        ].map(({ to, icon:Icon, label, desc, cls }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md ${cls}`}>
            <span className="p-2.5 rounded-xl bg-white shadow-sm flex-shrink-0">
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs opacity-70 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent postings ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="section-title">Recent Job Postings</h2>
            <p className="section-subtitle">Click any job to review applicants</p>
          </div>
          <Link to="/client/jobs"
            className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl animate-pulse" />)}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-2.5">
            {jobs.slice(0, 5).map(job => <JobMiniCard key={job._id} job={job} />)}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No job postings yet"
            description="Post your first job and start receiving applications from skilled workers."
            action={<Link to="/client/post-job" className="btn-primary btn">Post First Job</Link>}
          />
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;