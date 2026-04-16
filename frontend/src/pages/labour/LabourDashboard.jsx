// import { useState, useEffect, useRef } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { Link } from 'react-router-dom';
// import {
//   Briefcase, ClipboardList, Star, AlertTriangle,
//   ArrowRight, Sparkles, CheckCircle, Clock,
//   XCircle, Bell, TrendingUp, Eye, RefreshCw,
//   Trophy, Target, Zap, Award, Crown, Shield,
//   ChevronRight, Flame, Send
// } from 'lucide-react';
// import { useAuth }   from '@/context/AuthContext';
// import ProfileGateBanner from '@/components/common/ProfileGateBanner';
// import { useProfileGate } from '@/hooks/useProfileGate';
// import { useSocket } from '@/context/SocketContext';
// import jobService    from '@/services/jobService';
// import api           from '@/services/api';
// import userService   from '@/services/userService';
// import { StatCard, EmptyState, SkeletonCard } from '@/components/common/UIComponents';
// import JobCard from '@/components/common/JobCard';
// import BadgeChip, { BadgeList, BADGE_CONFIG } from '@/components/common/BadgeChip';
// import toast from 'react-hot-toast';

// /* ── Animated counter ──────────────────────────────────────────────────────── */
// const AnimCount = ({ value, duration = 600 }) => {
//   const [display, setDisplay] = useState(0);
//   const prev   = useRef(0);
//   const frameR = useRef(null);

//   useEffect(() => {
//     const target = Number(value) || 0;
//     const start  = prev.current;
//     const diff   = target - start;
//     if (diff === 0) return;
//     const startTime = performance.now();

//     const tick = (now) => {
//       const elapsed = now - startTime;
//       const progress = Math.min(elapsed / duration, 1);
//       const ease = 1 - Math.pow(1 - progress, 3);
//       setDisplay(Math.round(start + diff * ease));
//       if (progress < 1) frameR.current = requestAnimationFrame(tick);
//       else { prev.current = target; }
//     };
//     frameR.current = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(frameR.current);
//   }, [value, duration]);

//   return <span>{display}</span>;
// };

// /* ── Status mini-badge ─────────────────────────────────────────────────────── */
// const StatusChip = ({ status }) => {
//   const cfg = {
//     applied:     { label:'Pending',     cls:'bg-blue-100 text-blue-700'  },
//     shortlisted: { label:'Shortlisted', cls:'bg-amber-100 text-amber-700'},
//     accepted:    { label:'Accepted',    cls:'bg-green-100 text-green-700'},
//     rejected:    { label:'Rejected',    cls:'bg-red-100 text-red-600'    },
//     withdrawn:   { label:'Withdrawn',   cls:'bg-gray-100 text-gray-500'  },
//   };
//   const c = cfg[status] || cfg.applied;
//   return (
//     <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>
//       {c.label}
//     </span>
//   );
// };

// /* ── Recent application mini-card ─────────────────────────────────────────── */
// const AppMiniCard = ({ job }) => {
//   const app    = job.myApplication;
//   const status = app?.status || 'applied';
//   const borderCls = status === 'accepted' ? 'border-green-200' :
//                     status === 'rejected' ? 'border-red-200'   :
//                     status === 'shortlisted' ? 'border-amber-200' :
//                     'border-gray-100';

//   return (
//     <Link to={`/jobs/${job._id}`}
//       className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 ${borderCls} bg-white hover:shadow-sm transition-all group`}>
//       <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
//         <Briefcase className="w-4 h-4 text-orange-500" />
//       </div>
//       <div className="flex-1 min-w-0">
//         <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
//           {job.title}
//         </p>
//         <div className="flex items-center gap-2 mt-1">
//           <StatusChip status={status} />
//           <span className="text-[11px] text-gray-400">
//             {job.location?.city || ''}
//           </span>
//         </div>
//       </div>
//       <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-1" />
//     </Link>
//   );
// };

// /* ── Level name helper ─────────────────────────────────────────────────────── */
// const LEVEL_NAMES = [
//   '', 'Beginner', 'Apprentice', 'Skilled', 'Proficient',
//   'Expert', 'Master', 'Elite', 'Legend', 'Champion', 'Grand Master',
// ];
// const LEVEL_COLORS = [
//   '', 'text-gray-500', 'text-green-600', 'text-teal-600', 'text-blue-600',
//   'text-indigo-600', 'text-purple-600', 'text-pink-600', 'text-orange-600',
//   'text-amber-600', 'text-yellow-500',
// ];

// /* ── Reputation Card ───────────────────────────────────────────────────────── */
// const ReputationCard = ({ userId }) => {
//   const { data, isLoading } = useQuery({
//     queryKey: ['badges-dash', userId],
//     queryFn:  () => userService.getUserBadges(userId).then(r => r.data.data),
//     enabled:  !!userId,
//     staleTime: 60000,
//   });

//   if (isLoading) return (
//     <div className="rounded-3xl border border-gray-100 bg-white p-5 animate-pulse space-y-3">
//       <div className="h-5 bg-gray-200 rounded w-32" />
//       <div className="h-3 bg-gray-100 rounded w-full" />
//       <div className="h-20 bg-gray-100 rounded-2xl" />
//     </div>
//   );

//   if (!data) return null;

//   const level         = data.level         || 1;
//   const levelProgress = data.levelProgress || 0;
//   const points        = data.points        || 0;
//   const nextLevelPts  = data.nextLevelPoints || 200;
//   const trustScore    = data.trustScore    || 0;
//   const badges        = data.badges        || [];
//   const badgeProgress = (data.badgeProgress || []).slice(0, 2); // top 2 in progress

//   const trustColor = trustScore >= 80 ? '#10b981' : trustScore >= 60 ? '#f59e0b' : '#ef4444';
//   const trustLabel = trustScore >= 80 ? 'Excellent' : trustScore >= 60 ? 'Good' : 'Building';

//   return (
//     <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
//             <Trophy className="w-5 h-5 text-white" />
//           </div>
//           <div>
//             <p className="text-white font-display font-bold text-base">Your Reputation</p>
//             <p className="text-orange-100 text-xs">
//               Level {level} · {LEVEL_NAMES[level] || 'Expert'}
//             </p>
//           </div>
//         </div>
//         <Link to="/labour/leaderboard"
//           className="flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-colors">
//           Leaderboard <ChevronRight className="w-3.5 h-3.5" />
//         </Link>
//       </div>

//       <div className="p-5 space-y-4">
//         {/* Stats row */}
//         <div className="grid grid-cols-3 gap-3">
//           {/* Level + XP */}
//           <div className="col-span-2 space-y-2">
//             <div className="flex items-center justify-between">
//               <span className={`text-xs font-black ${LEVEL_COLORS[level] || 'text-gray-600'}`}>
//                 Lv.{level} · {LEVEL_NAMES[level]}
//               </span>
//               <span className="text-[10px] text-gray-400">{points} / {nextLevelPts} XP</span>
//             </div>
//             <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
//               <div
//                 className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-1000"
//                 style={{ width: `${Math.min(100, levelProgress)}%` }}
//               />
//             </div>
//             <p className="text-[10px] text-gray-400">
//               {nextLevelPts - points > 0
//                 ? `${nextLevelPts - points} XP to ${LEVEL_NAMES[Math.min(level + 1, 10)]}`
//                 : '🎉 Max level!'}
//             </p>
//           </div>

//           {/* Trust score */}
//           <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-2">
//             <div className="relative" style={{ width: 44, height: 44 }}>
//               <svg width={44} height={44} viewBox="0 0 44 44">
//                 <circle cx="22" cy="22" r="17" fill="none" stroke="#e5e7eb" strokeWidth="4" />
//                 <circle cx="22" cy="22" r="17" fill="none" stroke={trustColor} strokeWidth="4"
//                   strokeDasharray={`${(trustScore/100) * 2 * Math.PI * 17} ${2 * Math.PI * 17}`}
//                   strokeLinecap="round" transform="rotate(-90 22 22)"
//                 />
//               </svg>
//               <span className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{ color: trustColor }}>
//                 {trustScore}
//               </span>
//             </div>
//             <p className="text-[9px] font-bold text-gray-400 mt-1">TRUST</p>
//             <p className="text-[9px] font-bold" style={{ color: trustColor }}>{trustLabel}</p>
//           </div>
//         </div>

//         {/* Badges earned */}
//         {badges.length > 0 ? (
//           <div>
//             <div className="flex items-center justify-between mb-2">
//               <p className="text-xs font-bold text-gray-600">
//                 🏅 {badges.length} Badge{badges.length !== 1 ? 's' : ''} Earned
//               </p>
//               <Link to={`/labourers/${userId}`}
//                 className="text-[10px] text-orange-500 font-bold hover:underline">View all</Link>
//             </div>
//             <BadgeList badges={badges} max={3} size="sm" />
//           </div>
//         ) : (
//           <div className="text-center py-2">
//             <p className="text-xs text-gray-400">No badges yet — complete jobs to earn them!</p>
//           </div>
//         )}

//         {/* Next badge progress */}
//         {badgeProgress.length > 0 && (
//           <div className="space-y-2.5">
//             <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
//               <Target className="w-3.5 h-3.5 text-orange-400" /> Next Badges
//             </p>
//             {badgeProgress.map(item => {
//               const cfg = BADGE_CONFIG[item.badge];
//               if (!cfg) return null;
//               const Icon = cfg.icon;
//               // Show the first incomplete sub-item
//               const nextItem = item.items.find(i => !i.done);
//               return (
//                 <div key={item.badge} className={`flex items-center gap-3 p-3 rounded-2xl ${cfg.bg} border ${cfg.border}`}>
//                   <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 border ${cfg.border}`}>
//                     <Icon className={`w-4 h-4 ${cfg.text}`} />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-1">
//                       <p className={`text-[11px] font-bold ${cfg.text}`}>{item.label}</p>
//                       <span className={`text-[10px] font-black ${cfg.text}`}>{item.overallPct}%</span>
//                     </div>
//                     <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
//                       <div className={`h-full rounded-full transition-all duration-700 bg-current ${cfg.text}`}
//                         style={{ width: `${item.overallPct}%` }} />
//                     </div>
//                     {nextItem && (
//                       <p className="text-[10px] text-gray-500 mt-1 truncate">
//                         {nextItem.label}: {nextItem.current} / {nextItem.target}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* CTA */}
//         <div className="flex gap-2">
//           <Link to="/labour/points"
//             className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-purple-200 text-purple-600 text-xs font-bold hover:bg-purple-50 transition-colors">
//             <Sparkles className="w-3.5 h-3.5" /> My XP
//           </Link>
//           <Link to="/labour/leaderboard"
//             className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-orange-200 text-orange-600 text-xs font-bold hover:bg-orange-50 transition-colors">
//             <Trophy className="w-3.5 h-3.5" /> Leaderboard
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════════════════════
//    MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════ */
// const LabourDashboard = () => {
//   const { user }  = useAuth();
//   const qc        = useQueryClient();
//   const { on }    = useSocket();
//   const profile   = user?.labourProfile;

//   const [liveNotif, setLiveNotif] = useState(null); // flash on real-time update

//   /* ── Queries ─────────────────────────────────────────────────────────────── */
//   const { data: recommended, isLoading: loadingRec } = useQuery({
//     queryKey: ['recommended-jobs'],
//     queryFn:  () => jobService.getRecommendedJobs({ limit: 6 }).then(r => r.data.data),
//     enabled:  !!profile,
//     refetchInterval: 60000,
//   });

//   const { data: appsData } = useQuery({
//     queryKey: ['my-applications-dash'],
//     queryFn:  () => jobService.getMyApplications({ page: 1, limit: 5 }).then(r => r.data),
//     refetchInterval: 30000,
//   });

//   /* ── Fresh profile — live KPI data (completedJobs, averageRating, accepted) ── */
//   const { data: freshUser } = useQuery({
//     queryKey: ['auth-me-live'],
//     queryFn:  () => api.get('/auth/me').then(r => r.data.data),
//     refetchInterval: 30000,
//     staleTime: 0,
//   });
//   const liveProfile = (freshUser?.labourProfile && typeof freshUser.labourProfile === 'object')
//     ? freshUser.labourProfile
//     : profile;

//   /* ── Client history for repeat-client badges on recommended jobs ─────────── */
//   const { data: clientHistoryRaw } = useQuery({
//     queryKey: ['my-client-history'],
//     queryFn:  () => jobService.getClientHistory().then(r => r.data.data),
//     staleTime: 5 * 60 * 1000,
//   });
//   const clientHistoryMap = clientHistoryRaw || {};

//   /* ── Apply mutation ── */
//   const [applyingJob, setApplyingJob] = useState(null);
//   const [proposalMsg, setProposalMsg] = useState('');
//   const applyMut = useMutation({
//     mutationFn: ({ jobId, msg }) => jobService.applyToJob(jobId, { proposalMsg: msg }),
//     onSuccess: () => {
//       toast.success('✅ Application submitted successfully!');
//       qc.invalidateQueries(['recommended-jobs']);
//       qc.invalidateQueries(['my-applications-dash']);
//       setApplyingJob(null); setProposalMsg('');
//     },
//     onError: (err) => toast.error(err?.response?.data?.message || 'Failed to apply'),
//   });
//   const handleApply = (job) => { setApplyingJob(job); setProposalMsg(''); };

//   const apps  = appsData?.data || [];
//   const total = appsData?.meta?.total || 0;

//   /* ── Derived application counts ──────────────────────────────────────────── */
//   const pending     = apps.filter(j => j.myApplication?.status === 'applied').length;
//   const accepted    = apps.filter(j => j.myApplication?.status === 'accepted').length;
//   const shortlisted = apps.filter(j => j.myApplication?.status === 'shortlisted').length;

//   /* ── Real-time socket events ─────────────────────────────────────────────── */
//   useEffect(() => {
//     /* New job posted → refresh recommendations */
//     const offNew = on('job:new', (job) => {
//       qc.invalidateQueries(['recommended-jobs']);
//       setLiveNotif({ msg: `New job: "${job.title}"`, type: 'info' });
//       setTimeout(() => setLiveNotif(null), 5000);
//     });

//     /* Job deleted → remove from recommendations */
//     const offDeleted = on('job:deleted', () => {
//       qc.invalidateQueries(['recommended-jobs']);
//       qc.invalidateQueries(['jobs']);
//     });

//     /* Application status changed by client */
//     const offStatus = on('application:statusUpdate', ({ jobId, status }) => {
//       qc.invalidateQueries(['my-applications-dash']);
//       qc.invalidateQueries(['my-applications']);

//       const msgs = {
//         accepted:    { msg: '🎉 An application was accepted!',       type: 'success' },
//         rejected:    { msg: '📋 An application status was updated.', type: 'info'    },
//         shortlisted: { msg: '⭐ You have been shortlisted!',         type: 'success' },
//       };
//       if (msgs[status]) {
//         setLiveNotif(msgs[status]);
//         setTimeout(() => setLiveNotif(null), 6000);
//       }
//     });

//     /* Badge earned → flash notification */
//     const offBadge = on('badge:earned', ({ badges: newBadges, level, levelName }) => {
//       if (newBadges?.length > 0) {
//         const names = newBadges.map(b => b.type.replace(/_/g,' ')).join(', ');
//         setLiveNotif({ msg: `🏅 New badge${newBadges.length > 1 ? 's' : ''} earned: ${names}!`, type: 'success' });
//         setTimeout(() => setLiveNotif(null), 7000);
//       }
//       qc.invalidateQueries(['badges-dash', user?._id]);
//     });

//     const offLevelUp = on('level:up', ({ level, levelName }) => {
//       setLiveNotif({ msg: `⬆️ Level Up! You reached Level ${level} — ${levelName}!`, type: 'success' });
//       setTimeout(() => setLiveNotif(null), 8000);
//       qc.invalidateQueries(['badges-dash', user?._id]);
//     });

//     return () => { offNew?.(); offDeleted?.(); offStatus?.(); offBadge?.(); offLevelUp?.(); };
//   }, [on, qc, user?._id]);

//   /* ── Profile checks ─────────────────────────────────────────────────────── */
//   const isProfileComplete = !!profile;
//   const { canAct, gateType } = useProfileGate();
//   const hasSkills         = (profile?.skills?.length ?? 0) > 0;
//   const isVerified        = user?.isVerified;
//   const aadhaarStatus     = profile?.aadhaarDoc?.status;

//   /* ── Stats ──────────────────────────────────────────────────────────────── */
//   const stats = [
//     { label: 'Jobs Applied',   value: total,
//       icon: ClipboardList, color: 'text-primary',   bgColor: 'bg-primary-50',   live: true },
//     { label: 'Completed Jobs', value: liveProfile?.completedJobs ?? 0,
//       icon: CheckCircle,   color: 'text-success',   bgColor: 'bg-success-light', live: true },
//     { label: 'Avg. Rating',
//       value: liveProfile?.averageRating ? liveProfile.averageRating.toFixed(1) : '—',
//       suffix: liveProfile?.averageRating ? '★' : '',
//       icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-50' },
//     { label: 'Accepted',       value: accepted,
//       icon: TrendingUp, color: 'text-accent', bgColor: 'bg-accent-50', live: true },
//   ];

//   /* ── Time-based greeting ────────────────────────────────────────────────── */
//   const hour     = new Date().getHours();
//   const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

//   return (
//     <div className="space-y-6 animate-fade-in">

//       {/* ── Live notification flash ───────────────────────────────────────── */}
//       {liveNotif && (
//         <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium animate-fade-in ${
//           liveNotif.type === 'success'
//             ? 'bg-green-50 border-green-200 text-green-800'
//             : 'bg-blue-50 border-blue-200 text-blue-800'
//         }`}>
//           <Bell className="w-4 h-4 flex-shrink-0" />
//           {liveNotif.msg}
//           <button onClick={() => setLiveNotif(null)} className="ml-auto opacity-60 hover:opacity-100">
//             <XCircle className="w-4 h-4" />
//           </button>
//         </div>
//       )}

//       {/* ── Header ───────────────────────────────────────────────────────── */}
//       <div className="flex items-start justify-between gap-4 flex-wrap">
//         <div>
//           <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
//           <p className="text-slate-500 mt-1 text-sm">Here's your work activity today.</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => {
//               qc.invalidateQueries(['my-applications-dash']);
//               qc.invalidateQueries(['recommended-jobs']);
//               qc.invalidateQueries(['auth-me-live']);
//               qc.invalidateQueries(['my-client-history']);
//               toast.success('Dashboard refreshed');
//             }}
//             className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all"
//           >
//             <RefreshCw className="w-3.5 h-3.5" /> Refresh
//           </button>
//           <Link to="/jobs" className="btn-accent btn hidden sm:flex flex-shrink-0">
//             Browse Jobs <ArrowRight className="w-4 h-4" />
//           </Link>
//         </div>
//       </div>

//       {/* ── Alert banners ─────────────────────────────────────────────────── */}
//       {(!isProfileComplete || !hasSkills) && (
//         <div className="card border-amber-200 bg-amber-50">
//           <div className="card-body flex items-start gap-3">
//             <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
//             <div className="flex-1">
//               <p className="text-sm font-semibold text-amber-800">Complete your profile to get more jobs</p>
//               <p className="text-xs text-amber-700 mt-1">Add your skills, wage expectations, and location to start receiving job recommendations.</p>
//             </div>
//             <Link to="/labour/settings" className="btn-sm btn border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 flex-shrink-0">
//               Complete
//             </Link>
//           </div>
//         </div>
//       )}

//       {!isVerified && isProfileComplete && aadhaarStatus !== 'pending' && (
//         <div className="card border-blue-200 bg-blue-50">
//           <div className="card-body flex items-start gap-3">
//             <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
//             <div className="flex-1">
//               <p className="text-sm font-semibold text-blue-800">Get your identity verified</p>
//               <p className="text-xs text-blue-700 mt-1">Upload your Aadhaar to get the Verified badge and unlock more job opportunities.</p>
//             </div>
//             <Link to="/labour/settings" className="btn-sm btn border border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200 flex-shrink-0">
//               Verify Now
//             </Link>
//           </div>
//         </div>
//       )}

//       {aadhaarStatus === 'pending' && (
//         <div className="card border-orange-200 bg-orange-50">
//           <div className="card-body flex items-start gap-3">
//             <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
//             <div>
//               <p className="text-sm font-semibold text-orange-800">Aadhaar under review</p>
//               <p className="text-xs text-orange-700 mt-1">Your identity document is being reviewed by our team. Usually takes 24 hours.</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── Stats grid ────────────────────────────────────────────────────── */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         {stats.map(s => (
//           <div key={s.label} className={`rounded-2xl p-4 border border-surface-200 ${s.bgColor} relative overflow-hidden`}>
//             {s.live && (
//               <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />
//             )}
//             <div className={`w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center mb-2`}>
//               <s.icon className={`w-4 h-4 ${s.color}`} />
//             </div>
//             <p className={`text-2xl font-display font-bold ${s.color}`}>
//               {typeof s.value === 'number'
//                 ? <AnimCount value={s.value} />
//                 : s.value
//               }
//               {s.suffix && <span className="text-lg ml-0.5">{s.suffix}</span>}
//             </p>
//             <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
//           </div>
//         ))}
//       </div>

//       {/* ── Application status summary ─────────────────────────────────────── */}
//       {total > 0 && (
//         <div className="grid grid-cols-3 gap-3">
//           {[
//             { label:'Pending Review', count: pending,     cls:'border-blue-200 bg-blue-50  text-blue-700',  icon: Clock        },
//             { label:'Shortlisted',    count: shortlisted, cls:'border-amber-200 bg-amber-50 text-amber-700', icon: Star         },
//             { label:'Accepted',       count: accepted,    cls:'border-green-200 bg-green-50 text-green-700', icon: CheckCircle  },
//           ].map(s => (
//             <Link key={s.label} to="/labour/applications"
//               className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 ${s.cls} hover:shadow-sm transition-all text-center`}>
//               <s.icon className="w-5 h-5 mb-1 opacity-80" />
//               <p className="text-xl font-display font-bold">
//                 <AnimCount value={s.count} />
//               </p>
//               <p className="text-[11px] font-semibold mt-0.5 opacity-80">{s.label}</p>
//             </Link>
//           ))}
//         </div>
//       )}

//       {/* ── Reputation Card ───────────────────────────────────────────────── */}
//       <ReputationCard userId={user?._id} />

//       {/* ── Recommended jobs ──────────────────────────────────────────────── */}
//       <div>
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <h2 className="section-title">Recommended Jobs</h2>
//             <p className="section-subtitle">Matched to your skills &amp; location</p>
//           </div>
//           <Link to="/jobs"
//             className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
//             See all <ArrowRight className="w-3.5 h-3.5" />
//           </Link>
//         </div>

//         {loadingRec ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
//           </div>
//         ) : recommended?.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {recommended.map(job => (
//               <JobCard key={job._id} job={job}
//                 showApplyBtn
//                 onApply={handleApply}
//                 clientHistory={clientHistoryMap[job.postedBy?._id?.toString()]}
//               />
//             ))}
//           </div>
//         ) : (
//           <EmptyState
//             icon={Sparkles}
//             title="No recommendations yet"
//             description="Complete your profile with skills and location to see personalised job matches."
//             action={<Link to="/labour/settings" className="btn-primary btn">Complete Profile</Link>}
//           />
//         )}
//       </div>

//       {/* ── Recent applications ───────────────────────────────────────────── */}
//       {apps.length > 0 && (
//         <div>
//           <div className="flex items-center justify-between mb-3">
//             <div>
//               <h2 className="section-title">Recent Applications</h2>
//               <p className="section-subtitle">Updates in real-time</p>
//             </div>
//             <Link to="/labour/applications"
//               className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
//               View all <ArrowRight className="w-3.5 h-3.5" />
//             </Link>
//           </div>

//           <div className="space-y-2.5">
//             {apps.slice(0, 5).map(job => <AppMiniCard key={job._id} job={job} />)}
//           </div>

//           <div className="mt-3 flex justify-center">
//             <Link to="/labour/applications"
//               className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary-200 bg-primary-50 text-primary text-sm font-semibold hover:bg-primary-100 transition-colors">
//               <ClipboardList className="w-4 h-4" />
//               Manage all applications
//               <ArrowRight className="w-3.5 h-3.5" />
//             </Link>
//           </div>
//         </div>
//       )}
//       {/* ── Apply Modal ── */}
//       {applyingJob && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
//           style={{ backdropFilter:'blur(6px)', background:'rgba(0,0,0,0.55)' }}
//           onClick={() => { setApplyingJob(null); setProposalMsg(''); }}>
//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
//             onClick={e => e.stopPropagation()}>
//             <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-5">
//               <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Apply for Job</p>
//               <p className="font-display font-bold text-white text-lg line-clamp-2">{applyingJob.title}</p>
//               <div className="flex items-center gap-3 mt-1.5 text-sm text-orange-200">
//                 <span>{applyingJob.postedBy?.name}</span>
//                 {applyingJob.location?.city && <><span>·</span><span>📍 {applyingJob.location.city}</span></>}
//                 <span className="ml-auto font-bold text-white">₹{applyingJob.budgetMin}–{applyingJob.budgetMax}/day</span>
//               </div>
//             </div>
//             <div className="p-6 space-y-4">
//               {applyingJob.requirements?.length > 0 && (
//                 <div>
//                   <p className="text-xs font-bold text-gray-500 mb-2">Required Skills:</p>
//                   <div className="flex flex-wrap gap-1.5">
//                     {applyingJob.requirements.map((r, i) => (
//                       <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{r.skill}</span>
//                     ))}
//                   </div>
//                 </div>
//               )}
//               <div>
//                 <label className="text-xs font-bold text-gray-600 mb-1.5 block">
//                   Message to Client <span className="text-gray-400 font-normal">(optional)</span>
//                 </label>
//                 <textarea value={proposalMsg} onChange={e => setProposalMsg(e.target.value)}
//                   rows={3} maxLength={500}
//                   placeholder="Introduce yourself and mention your relevant experience..."
//                   className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
//                 />
//                 <p className="text-[10px] text-gray-400 mt-1">{proposalMsg.length}/500</p>
//               </div>
//               <div className="flex gap-3">
//                 <button onClick={() => { setApplyingJob(null); setProposalMsg(''); }}
//                   className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
//                 <button onClick={() => applyMut.mutate({ jobId: applyingJob._id, msg: proposalMsg })}
//                   disabled={applyMut.isPending}
//                   className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-md">
//                   {applyMut.isPending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Applying…</> : <><Send className="w-4 h-4"/>Submit Application</>}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LabourDashboard;

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import {
  Briefcase, ClipboardList, Star, AlertTriangle,
  ArrowRight, Sparkles, CheckCircle, Clock,
  XCircle, Bell, TrendingUp, RefreshCw,
  Trophy, Target, Zap, Award, Crown, Shield,
  ChevronRight, Flame, Send
} from 'lucide-react';
import { useAuth }   from '@/context/AuthContext';
import ProfileGateBanner from '@/components/common/ProfileGateBanner';
import { useProfileGate } from '@/hooks/useProfileGate';
import { useSocket } from '@/context/SocketContext';
import jobService    from '@/services/jobService';
import api           from '@/services/api';
import userService   from '@/services/userService';
import { StatCard, EmptyState, SkeletonCard } from '@/components/common/UIComponents';
import JobCard from '@/components/common/JobCard';
import BadgeChip, { BadgeList, BADGE_CONFIG } from '@/components/common/BadgeChip';
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
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * ease));
      if (progress < 1) frameR.current = requestAnimationFrame(tick);
      else { prev.current = target; }
    };
    frameR.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameR.current);
  }, [value, duration]);

  return <span>{display}</span>;
};

/* ── Status mini-badge ─────────────────────────────────────────────────────── */
const StatusChip = ({ status }) => {
  const cfg = {
    applied:     { label:'Pending',     cls:'bg-blue-100 text-blue-700'  },
    shortlisted: { label:'Shortlisted', cls:'bg-amber-100 text-amber-700'},
    accepted:    { label:'Accepted',    cls:'bg-green-100 text-green-700'},
    rejected:    { label:'Rejected',    cls:'bg-red-100 text-red-600'    },
    withdrawn:   { label:'Withdrawn',   cls:'bg-gray-100 text-gray-500'  },
  };
  const c = cfg[status] || cfg.applied;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  );
};

/* ── Recent application mini-card ─────────────────────────────────────────── */
const AppMiniCard = ({ job }) => {
  const app    = job.myApplication;
  const status = app?.status || 'applied';
  const borderCls = status === 'accepted' ? 'border-green-200' :
                    status === 'rejected' ? 'border-red-200'   :
                    status === 'shortlisted' ? 'border-amber-200' :
                    'border-gray-100';

  return (
    <Link to={`/labour/jobs/${job._id}`}
      className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 ${borderCls} bg-white hover:shadow-sm transition-all group`}>
      <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-4 h-4 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
          {job.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <StatusChip status={status} />
          <span className="text-[11px] text-gray-400">
            {job.location?.city || ''}
          </span>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-1" />
    </Link>
  );
};

/* ── Level name helper ─────────────────────────────────────────────────────── */
const LEVEL_NAMES = [
  '', 'Beginner', 'Apprentice', 'Skilled', 'Proficient',
  'Expert', 'Master', 'Elite', 'Legend', 'Champion', 'Grand Master',
];
const LEVEL_COLORS = [
  '', 'text-gray-500', 'text-green-600', 'text-teal-600', 'text-blue-600',
  'text-indigo-600', 'text-purple-600', 'text-pink-600', 'text-orange-600',
  'text-amber-600', 'text-yellow-500',
];

/* ── Reputation Card ───────────────────────────────────────────────────────── */
const ReputationCard = ({ userId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['badges-dash', userId],
    queryFn:  () => userService.getUserBadges(userId).then(r => r.data.data),
    enabled:  !!userId,
    staleTime: 60000,
  });

  if (isLoading) return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 animate-pulse space-y-3">
      <div className="h-5 bg-gray-200 rounded w-32" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-20 bg-gray-100 rounded-2xl" />
    </div>
  );

  if (!data) return null;

  const level         = data.level         || 1;
  const levelProgress = data.levelProgress || 0;
  const points        = data.points        || 0;
  const nextLevelPts  = data.nextLevelPoints || 200;
  const trustScore    = data.trustScore    || 0;
  const badges        = data.badges        || [];
  const badgeProgress = (data.badgeProgress || []).slice(0, 2);

  const trustColor = trustScore >= 80 ? '#10b981' : trustScore >= 60 ? '#f59e0b' : '#ef4444';
  const trustLabel = trustScore >= 80 ? 'Excellent' : trustScore >= 60 ? 'Good' : 'Building';

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-display font-bold text-base">Your Reputation</p>
            <p className="text-orange-100 text-xs">
              Level {level} · {LEVEL_NAMES[level] || 'Expert'}
            </p>
          </div>
        </div>
        <Link to="/labour/leaderboard"
          className="flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-colors">
          Leaderboard <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Level + XP */}
          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black ${LEVEL_COLORS[level] || 'text-gray-600'}`}>
                Lv.{level} · {LEVEL_NAMES[level]}
              </span>
              <span className="text-[10px] text-gray-400">{points} / {nextLevelPts} XP</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-1000"
                style={{ width: `${Math.min(100, levelProgress)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {nextLevelPts - points > 0
                ? `${nextLevelPts - points} XP to ${LEVEL_NAMES[Math.min(level + 1, 10)]}`
                : '🎉 Max level!'}
            </p>
          </div>

          {/* Trust score */}
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-2">
            <div className="relative" style={{ width: 44, height: 44 }}>
              <svg width={44} height={44} viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="17" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <circle cx="22" cy="22" r="17" fill="none" stroke={trustColor} strokeWidth="4"
                  strokeDasharray={`${(trustScore/100) * 2 * Math.PI * 17} ${2 * Math.PI * 17}`}
                  strokeLinecap="round" transform="rotate(-90 22 22)"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{ color: trustColor }}>
                {trustScore}
              </span>
            </div>
            <p className="text-[9px] font-bold text-gray-400 mt-1">TRUST</p>
            <p className="text-[9px] font-bold" style={{ color: trustColor }}>{trustLabel}</p>
          </div>
        </div>

        {/* Badges earned */}
        {badges.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-600">
                🏅 {badges.length} Badge{badges.length !== 1 ? 's' : ''} Earned
              </p>
              <Link to={`/labourers/${userId}`}
                className="text-[10px] text-orange-500 font-bold hover:underline">View all</Link>
            </div>
            <BadgeList badges={badges} max={3} size="sm" />
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">No badges yet — complete jobs to earn them!</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const LabourDashboard = () => {
  const { user, isLabour } = useAuth();
  const qc        = useQueryClient();
  const { on }    = useSocket();
  const profile   = user?.labourProfile;

  const [liveNotif, setLiveNotif] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null);
  const [proposalMsg, setProposalMsg] = useState('');

  /* ── Queries ─────────────────────────────────────────────────────────────── */
  // ✅ FIXED: Recommendations now fetch if user exists (removed strict profile check)
  const { data: recommended, isLoading: loadingRec } = useQuery({
    queryKey: ['recommended-jobs'],
    queryFn:  () => jobService.getRecommendedJobs({ limit: 6 }).then(r => r.data.data),
    enabled:  !!user,  // Changed from !!profile to !!user
    refetchInterval: 60000,
  });

  const { data: appsData } = useQuery({
    queryKey: ['my-applications-dash'],
    queryFn:  () => jobService.getMyApplications({ page: 1, limit: 5 }).then(r => r.data),
    refetchInterval: 30000,
  });

  /* ── Fresh profile — live KPI data ── */
  const { data: freshUser } = useQuery({
    queryKey: ['auth-me-live'],
    queryFn:  () => api.get('/auth/me').then(r => r.data.data),
    refetchInterval: 30000,
    staleTime: 0,
  });
  const liveProfile = freshUser?.labourProfile || profile;

  /* ── Client history ── */
  const { data: clientHistoryRaw } = useQuery({
    queryKey: ['my-client-history'],
    queryFn:  () => jobService.getClientHistory().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const clientHistoryMap = clientHistoryRaw || {};

  /* ── Apply mutation ── */
  const applyMut = useMutation({
    mutationFn: ({ jobId, msg }) => jobService.applyToJob(jobId, { proposalMsg: msg }),
    onSuccess: () => {
      toast.success('✅ Application submitted!');
      qc.invalidateQueries(['recommended-jobs']);
      qc.invalidateQueries(['my-applications-dash']);
      setApplyingJob(null); setProposalMsg('');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to apply'),
  });

  const apps  = appsData?.data || [];
  const total = appsData?.meta?.total || 0;

  /* ── Derived counts ── */
  const pending     = apps.filter(j => j.myApplication?.status === 'applied').length;
  const accepted    = apps.filter(j => j.myApplication?.status === 'accepted').length;
  const shortlisted = apps.filter(j => j.myApplication?.status === 'shortlisted').length;

  /* ── Real-time socket events ── */
  useEffect(() => {
    const offNew = on('job:new', () => qc.invalidateQueries(['recommended-jobs']));
    const offStatus = on('application:statusUpdate', () => {
      qc.invalidateQueries(['my-applications-dash']);
      qc.invalidateQueries(['my-applications']);
    });
    const offBadge = on('badge:earned', () => qc.invalidateQueries(['badges-dash', user?._id]));
    const offLevelUp = on('level:up', () => qc.invalidateQueries(['badges-dash', user?._id]));

    return () => { offNew?.(); offStatus?.(); offBadge?.(); offLevelUp?.(); };
  }, [on, qc, user?._id]);

  /* ── Profile checks ── */
  const isProfileComplete = !!profile;
  const { canAct } = useProfileGate();
  const hasSkills = (profile?.skills?.length ?? 0) > 0;
  const isVerified = user?.isVerified;
  const aadhaarStatus = profile?.aadhaarDoc?.status;

  /* ── Saved Jobs Query ────────────────────────────────────────────────────── */
const { data: savedJobsData, isLoading: loadingSaved } = useQuery({
  queryKey: ['saved-jobs'],
  queryFn: () => jobService.getSavedJobs({ limit: 6 }).then(r => r.data),
  enabled: !!user && !!isLabour,
});

const savedJobs = savedJobsData?.data || [];
const savedJobIds = new Set(savedJobs.map(j => j._id));

/* ── Save/Unsave Mutation ─────────────────────────────────────────────────── */
const toggleSaveMut = useMutation({
  mutationFn: ({ jobId, isSaved }) => {
    if (isSaved) {
      return jobService.unsaveJob(jobId);
    } else {
      return jobService.saveJob(jobId);
    }
  },
  onSuccess: (_, { isSaved }) => {
    qc.invalidateQueries(['saved-jobs']);
    qc.invalidateQueries(['recommended-jobs']);
    toast.success(isSaved ? 'Removed from saved jobs' : 'Job saved for later');
  },
  onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update saved jobs'),
});

const handleToggleSave = (jobId, isSaved) => {
  toggleSaveMut.mutate({ jobId, isSaved });
};


  /* ── Stats (Real-time data) ── */
  const stats = [
    { label: 'Jobs Applied',   value: total, icon: ClipboardList, color: 'text-primary',   bgColor: 'bg-primary-50', live: true },
    { label: 'Completed Jobs', value: liveProfile?.completedJobs ?? 0, icon: CheckCircle, color: 'text-success', bgColor: 'bg-success-light', live: true },
    { label: 'Avg. Rating', value: liveProfile?.averageRating ? liveProfile.averageRating.toFixed(1) : '—', suffix: liveProfile?.averageRating ? '★' : '', icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { label: 'Accepted', value: accepted, icon: TrendingUp, color: 'text-accent', bgColor: 'bg-accent-50', live: true },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Live notification */}
      {liveNotif && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium animate-fade-in ${
          liveNotif.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <Bell className="w-4 h-4 flex-shrink-0" />
          {liveNotif.msg}
          <button onClick={() => setLiveNotif(null)} className="ml-auto opacity-60 hover:opacity-100">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">Here's your work activity today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              qc.invalidateQueries(['my-applications-dash']);
              qc.invalidateQueries(['recommended-jobs']);
              qc.invalidateQueries(['auth-me-live']);
              toast.success('Dashboard refreshed');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link to="/labour/jobs" className="btn-accent btn hidden sm:flex flex-shrink-0">
            Browse Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Alert banners */}
      {(!isProfileComplete || !hasSkills) && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="card-body flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Complete your profile to get more jobs</p>
              <p className="text-xs text-amber-700 mt-1">Add your skills, wage expectations, and location.</p>
            </div>
            <Link to="/labour/settings" className="btn-sm btn border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 flex-shrink-0">
              Complete
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid - Real-time KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border border-surface-200 ${s.bgColor} relative overflow-hidden`}>
            {s.live && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />}
            <div className={`w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-display font-bold ${s.color}`}>
              {typeof s.value === 'number' ? <AnimCount value={s.value} /> : s.value}
              {s.suffix && <span className="text-lg ml-0.5">{s.suffix}</span>}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Application status summary */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'Pending Review', count: pending, cls:'border-blue-200 bg-blue-50 text-blue-700', icon: Clock },
            { label:'Shortlisted', count: shortlisted, cls:'border-amber-200 bg-amber-50 text-amber-700', icon: Star },
            { label:'Accepted', count: accepted, cls:'border-green-200 bg-green-50 text-green-700', icon: CheckCircle },
          ].map(s => (
            <Link key={s.label} to="/labour/applications"
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 ${s.cls} hover:shadow-sm transition-all text-center`}>
              <s.icon className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-xl font-display font-bold"><AnimCount value={s.count} /></p>
              <p className="text-[11px] font-semibold mt-0.5 opacity-80">{s.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Reputation Card */}
      <ReputationCard userId={user?._id} />

      {/* Recommended jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Recommended For You</h2>
            <p className="section-subtitle">Based on your skills & location</p>
          </div>
          <Link to="/labour/jobs" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingRec ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : recommended?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
    {recommended.map(job => (
      <JobCard 
        key={job._id} 
        job={job}
        showApplyBtn
        onApply={setApplyingJob}
        clientHistory={clientHistoryMap[job.postedBy?._id?.toString()]}
        isSaved={savedJobIds.has(job._id)}
        onToggleSave={handleToggleSave}
      />
    ))}
  </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No recommendations yet"
            description={hasSkills ? "We're finding jobs that match your profile." : "Add skills to your profile to see recommendations."}
            action={!hasSkills && <Link to="/labour/settings" className="btn-primary btn">Complete Profile</Link>}
          />
        )}
      </div>

      {/* Recent applications */}
      {apps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="section-title">Recent Applications</h2>
              <p className="section-subtitle">Updates in real-time</p>
            </div>
            <Link to="/labour/applications" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {apps.slice(0, 5).map(job => <AppMiniCard key={job._id} job={job} />)}
          </div>
        </div>
      )}
      {/* ── Saved Jobs Section ─────────────────────────────────────────────────── */}
{isLabour && savedJobs.length > 0 && (
  <div className="mt-8">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <BookmarkCheck className="w-5 h-5 text-orange-500" />
        <h2 className="section-title">Saved Jobs</h2>
      </div>
      <Link to="/labour/saved-jobs" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
        View all <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {savedJobs.slice(0, 4).map(job => (
        <div key={job._id} className="relative group">
          <JobCard 
            job={job}
            showApplyBtn={!job.isExpired}
            onApply={setApplyingJob}
            clientHistory={clientHistoryMap[job.postedBy?._id?.toString()]}
            isSaved={true}
            onToggleSave={handleToggleSave}
          />
          {/* Quick remove button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleSave(job._id, true);
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
            title="Remove from saved"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </div>
)}

      {/* ── Apply Modal (Orange Theme for Labour Dashboard) ── */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter:'blur(6px)', background:'rgba(0,0,0,0.55)' }}
          onClick={() => { setApplyingJob(null); setProposalMsg(''); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-5">
              <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Apply for Job</p>
              <p className="font-display font-bold text-white text-lg line-clamp-2">{applyingJob.title}</p>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-orange-200">
                <span>{applyingJob.postedBy?.name}</span>
                {applyingJob.location?.city && <><span>·</span><span>📍 {applyingJob.location.city}</span></>}
                <span className="ml-auto font-bold text-white">₹{applyingJob.budgetMin}–{applyingJob.budgetMax}/day</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {applyingJob.requirements?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {applyingJob.requirements.map((r, i) => (
                      <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{r.skill}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                  Message to Client <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea 
                  value={proposalMsg} 
                  onChange={e => setProposalMsg(e.target.value)}
                  rows={3} 
                  maxLength={500}
                  placeholder="Introduce yourself and mention your relevant experience..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                <p className="text-[10px] text-gray-400 mt-1">{proposalMsg.length}/500</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setApplyingJob(null); setProposalMsg(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => applyMut.mutate({ jobId: applyingJob._id, msg: proposalMsg })}
                  disabled={applyMut.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
                >
                  {applyMut.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Applying…</>
                  ) : (
                    <><Send className="w-4 h-4"/>Submit Application</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourDashboard;