// // import { Link } from 'react-router-dom';
// // import { MapPin, Clock, Users, Zap, IndianRupee, RefreshCw,
// //          CheckCircle, Shield } from 'lucide-react';
// // import { formatCurrency, timeAgo, JOB_STATUS_CSS, JOB_STATUS_LABELS } from '@/utils/helpers';
// // import { useAuth } from '@/context/AuthContext';
// // import Avatar from './Avatar';

// // /* ── Role-aware job link ────────────────────────────────────────────────────── */
// // const useJobLink = (jobId) => {
// //   const { user } = useAuth();
// //   if (user?.role === 'labour') return `/labour/jobs/${jobId}`;
// //   if (user?.role === 'client') return `/client/browse-jobs/${jobId}`;
// //   if (user?.role === 'admin')  return `/admin/jobs`;
// //   return `/jobs/${jobId}`;
// // };

// // /* ── Repeat client badge ─────────────────────────────────────────────────────── */
// // const getRepeatBadge = (history) => {
// //   if (!history) return null;
// //   const { completedJobs = 0, inProgressJobs = 0, reliabilityScore = 0 } = history;
// //   const validJobs = completedJobs + inProgressJobs;
// //   if (validJobs === 0) return null;
// //   if (reliabilityScore >= 75 && completedJobs >= 3)
// //     return { label:'Trusted Client',  sub:`${completedJobs}× completed`, icon:Shield,     cls:'bg-emerald-50 text-emerald-700 border-emerald-300', dot:'bg-emerald-500', tier:'trusted' };
// //   if (completedJobs >= 2 || (completedJobs >= 1 && inProgressJobs >= 1))
// //     return { label:'Repeat Client',   sub:`${completedJobs} job${completedJobs>1?'s':''} done`, icon:RefreshCw,  cls:'bg-blue-50 text-blue-700 border-blue-300',     dot:'bg-blue-500',    tier:'repeat'  };
// //   return { label:'Previous Client', sub:"Worked before",   icon:CheckCircle, cls:'bg-violet-50 text-violet-700 border-violet-300', dot:'bg-violet-400',  tier:'previous'};
// // };

// // /* ── Reliability bar ─────────────────────────────────────────────────────────── */
// // const ReliabilityBar = ({ score }) => {
// //   const pct   = Math.min(100, score);
// //   const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400';
// //   const tcolor= pct >= 75 ? '#059669' : pct >= 50 ? '#2563eb' : '#d97706';
// //   return (
// //     <div className="flex items-center gap-1.5">
// //       <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
// //         <div className={`h-full rounded-full ${color}`} style={{ width:`${pct}%`, transition:'width .7s' }} />
// //       </div>
// //       <span className="text-[9px] font-black" style={{ color: tcolor }}>{pct}%</span>
// //     </div>
// //   );
// // };

// // /* ══════════════════════════════════════════════════════════════════════════════
// //    JOB CARD
// // ══════════════════════════════════════════════════════════════════════════════ */
// // const JobCard = ({ job, showApplyBtn = false, onApply, myAppStatus, clientHistory }) => {
// //   if (!job) return null;

// //   const jobLink     = useJobLink(job._id);
// //   const statusCss   = JOB_STATUS_CSS[job.status]   || 'badge-gray';
// //   const statusLabel = JOB_STATUS_LABELS[job.status] || job.status;
// //   const badge       = getRepeatBadge(clientHistory);
// //   const BadgeIcon   = badge?.icon;

// //   return (
// //     <Link
// //       to={jobLink}
// //       className={`block group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-200 overflow-hidden ${badge?.tier === 'trusted' ? 'ring-1 ring-emerald-200' : ''}`}
// //     >
// //       {/* Trusted glow border */}
// //       {badge?.tier === 'trusted' && (
// //         <div className="absolute inset-0 rounded-2xl border-2 border-emerald-300 pointer-events-none z-10" />
// //       )}

// //       <div className="flex flex-col h-full p-4 space-y-3">

// //         {/* ── Repeat Client Banner ── */}
// //         {badge && (
// //           <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${badge.cls} -mx-0 -mt-0`}>
// //             <div className="flex items-center gap-2">
// //               <span className={`w-2 h-2 rounded-full ${badge.dot} flex-shrink-0`} />
// //               <BadgeIcon className="w-3.5 h-3.5 flex-shrink-0" />
// //               <div>
// //                 <p className="text-[11px] font-black leading-none">{badge.label}</p>
// //                 <p className="text-[9px] opacity-70 leading-none mt-0.5">{badge.sub}</p>
// //               </div>
// //             </div>
// //             {clientHistory?.reliabilityScore !== undefined && (
// //               <div className="w-20 flex-shrink-0">
// //                 <ReliabilityBar score={clientHistory.reliabilityScore} />
// //               </div>
// //             )}
// //           </div>
// //         )}

// //         {/* ── Header: avatar + status badges ── */}
// //         <div className="flex items-start justify-between gap-2">
// //           <div className="flex items-center gap-2.5 min-w-0">
// //             <div className="relative flex-shrink-0">
// //               {/* Fixed avatar size — always w-9 h-9 */}
// //               <div className="w-9 h-9">
// //                 <Avatar src={job.postedBy?.avatar?.url} name={job.postedBy?.name} size="sm" />
// //               </div>
// //               {badge?.tier === 'trusted' && (
// //                 <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center border border-white z-10">
// //                   <CheckCircle className="w-2.5 h-2.5 text-white fill-white" />
// //                 </span>
// //               )}
// //             </div>
// //             <div className="min-w-0">
// //               <p className="text-xs text-slate-500 truncate flex items-center gap-1">
// //                 {job.postedBy?.name ?? 'Client'}
// //                 {badge && (
// //                   <span className={`text-[9px] font-bold px-1 rounded-sm ${
// //                     badge.tier === 'trusted' ? 'bg-emerald-100 text-emerald-700' :
// //                     badge.tier === 'repeat'  ? 'bg-blue-100 text-blue-700' :
// //                     'bg-violet-100 text-violet-700'
// //                   }`}>
// //                     {clientHistory?.totalJobs}× worked
// //                   </span>
// //                 )}
// //               </p>
// //               <p className="text-[11px] text-slate-400">{timeAgo(job.createdAt)}</p>
// //             </div>
// //           </div>
// //           <div className="flex items-center gap-1.5 flex-shrink-0">
// //             {job.isUrgent && <span className="badge badge-orange gap-1 text-[10px]"><Zap className="w-3 h-3" />Urgent</span>}
// //             <span className={`badge ${statusCss} text-[10px]`}>{statusLabel}</span>
// //           </div>
// //         </div>

// //         {/* ── Title + category ── */}
// //         <div>
// //           <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 text-sm">
// //             {job.title}
// //           </h3>
// //           <p className="text-xs text-slate-500 mt-0.5 capitalize">{job.category}</p>
// //         </div>

// //         {/* ── Description ── */}
// //         <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed flex-1">
// //           {job.description}
// //         </p>

// //         {/* ── Match score (recommendations) ── */}
// //         {job._recommendationScore !== undefined && (
// //           <div className="flex items-center gap-1.5">
// //             <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
// //               <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
// //                 style={{ width:`${Math.min(100, Math.round((job._recommendationScore / 120) * 100))}%` }} />
// //             </div>
// //             <span className="text-[10px] font-bold text-orange-600 flex-shrink-0">
// //               {Math.min(100, Math.round((job._recommendationScore / 120) * 100))}% match
// //             </span>
// //           </div>
// //         )}

// //         {/* ── Client history stat grid (repeat/trusted only) ── */}
// //         {badge && clientHistory && (
// //           <div className="grid grid-cols-3 gap-1 text-center">
// //             {[
// //               { val: clientHistory.completedJobs,  label: 'Completed' },
// //               { val: clientHistory.inProgressJobs, label: 'Active' },
// //               { val: clientHistory.lastWorked
// //                   ? `${Math.floor((Date.now()-new Date(clientHistory.lastWorked))/86400000)}d`
// //                   : '—',
// //                 label: 'Last job' },
// //             ].map(({ val, label }) => (
// //               <div key={label} className={`rounded-lg p-1.5 ${badge.cls.split(' ')[0]}`}>
// //                 <p className="text-[10px] font-black text-gray-700">{val}</p>
// //                 <p className="text-[9px] text-gray-500">{label}</p>
// //               </div>
// //             ))}
// //           </div>
// //         )}

// //         {/* ── Meta row ── */}
// //         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
// //           {job.location?.city && (
// //             <span className="flex items-center gap-1">
// //               <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
// //               {job.location.city}{job.location.state ? `, ${job.location.state}` : ''}
// //             </span>
// //           )}
// //           <span className="flex items-center gap-1">
// //             <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
// //             {job.totalLabourNeeded} worker{job.totalLabourNeeded > 1 ? 's' : ''}
// //           </span>
// //           {job.startDate && (
// //             <span className="flex items-center gap-1">
// //               <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
// //               {new Date(job.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
// //             </span>
// //           )}
// //         </div>

// //         {/* ── Footer: budget + apply ── */}
// //         <div className="flex items-center justify-between pt-2 border-t border-surface-100 mt-auto">
// //           <div className="flex items-center gap-0.5 text-primary font-semibold text-sm">
// //             <IndianRupee className="w-3.5 h-3.5" />
// //             <span>
// //               {formatCurrency(job.budgetMin, 'INR').replace('₹', '')}–
// //               {formatCurrency(job.budgetMax, 'INR').replace('₹', '')}
// //             </span>
// //             <span className="text-xs text-slate-400 font-normal ml-0.5">
// //               /{job.budgetType === 'daily' ? 'day' : job.budgetType}
// //             </span>
// //           </div>

// //           <div className="flex items-center gap-2">
// //             {myAppStatus && (
// //               <span className={`badge badge-${myAppStatus==='accepted'?'green':myAppStatus==='rejected'?'red':'blue'} text-[10px]`}>
// //                 {myAppStatus.charAt(0).toUpperCase() + myAppStatus.slice(1)}
// //               </span>
// //             )}
// //             {showApplyBtn && job.status === 'open' && !myAppStatus && (
// //               <button
// //                 className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm shadow-orange-100 flex-shrink-0"
// //                 onClick={e => {
// //                   e.preventDefault();    // stop Link navigation
// //                   e.stopPropagation();   // stop event bubbling
// //                   onApply?.(job);
// //                 }}
// //               >
// //                 ✅ Apply
// //               </button>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </Link>
// //   );
// // };

// // export default JobCard;

// import { Link } from 'react-router-dom';
// import { MapPin, Clock, Users, Zap, IndianRupee, RefreshCw, CheckCircle, Shield } from 'lucide-react';
// import { formatCurrency, timeAgo, JOB_STATUS_CSS, JOB_STATUS_LABELS } from '@/utils/helpers';
// import { useAuth } from '@/context/AuthContext';
// import Avatar from './Avatar';

// /* ── Role-aware job link ────────────────────────────────────────────────────── */
// const useJobLink = (jobId) => {
//   const { user } = useAuth();
//   if (user?.role === 'labour') return `/labour/jobs/${jobId}`;
//   if (user?.role === 'client') return `/client/browse-jobs/${jobId}`;
//   if (user?.role === 'admin')  return `/admin/jobs`;
//   return `/jobs/${jobId}`;
// };

// /* ── Repeat client badge ─────────────────────────────────────────────────────── */
// const getRepeatBadge = (history) => {
//   if (!history) return null;
//   const { completedJobs = 0, inProgressJobs = 0, reliabilityScore = 0 } = history;
//   const validJobs = completedJobs + inProgressJobs;
//   if (validJobs === 0) return null;
//   if (reliabilityScore >= 75 && completedJobs >= 3)
//     return { label:'Trusted Client',  sub:`${completedJobs}× completed`, icon:Shield,     cls:'bg-emerald-50 text-emerald-700 border-emerald-300', dot:'bg-emerald-500', tier:'trusted' };
//   if (completedJobs >= 2 || (completedJobs >= 1 && inProgressJobs >= 1))
//     return { label:'Repeat Client',   sub:`${completedJobs} job${completedJobs>1?'s':''} done`, icon:RefreshCw,  cls:'bg-blue-50 text-blue-700 border-blue-300',     dot:'bg-blue-500',    tier:'repeat'  };
//   return { label:'Previous Client', sub:"Worked before",   icon:CheckCircle, cls:'bg-violet-50 text-violet-700 border-violet-300', dot:'bg-violet-400',  tier:'previous'};
// };

// /* ── Reliability bar ─────────────────────────────────────────────────────────── */
// const ReliabilityBar = ({ score }) => {
//   const pct   = Math.min(100, score);
//   const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400';
//   const tcolor= pct >= 75 ? '#059669' : pct >= 50 ? '#2563eb' : '#d97706';
//   return (
//     <div className="flex items-center gap-1.5">
//       <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
//         <div className={`h-full rounded-full ${color}`} style={{ width:`${pct}%`, transition:'width .7s' }} />
//       </div>
//       <span className="text-[9px] font-black" style={{ color: tcolor }}>{pct}%</span>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════════════════════════
//    JOB CARD - Uniform sizing, no refresh on click
// ══════════════════════════════════════════════════════════════════════════════ */
// const JobCard = ({ job, showApplyBtn = false, onApply, myAppStatus, clientHistory }) => {
//   if (!job) return null;

//   const jobLink     = useJobLink(job._id);
//   const statusCss   = JOB_STATUS_CSS[job.status]   || 'badge-gray';
//   const statusLabel = JOB_STATUS_LABELS[job.status] || job.status;
//   const badge       = getRepeatBadge(clientHistory);
//   const BadgeIcon   = badge?.icon;

//   return (
//     <Link
//       to={jobLink}
//       className={`group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col ${badge?.tier === 'trusted' ? 'ring-1 ring-emerald-200' : ''}`}
//     >
//       {/* Trusted glow border */}
//       {badge?.tier === 'trusted' && (
//         <div className="absolute inset-0 rounded-2xl border-2 border-emerald-300 pointer-events-none z-10" />
//       )}

//       <div className="flex flex-col h-full p-4 space-y-3">

//         {/* ── Repeat Client Banner ── */}
//         {badge && (
//           <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${badge.cls}`}>
//             <div className="flex items-center gap-2">
//               <span className={`w-2 h-2 rounded-full ${badge.dot} flex-shrink-0`} />
//               <BadgeIcon className="w-3.5 h-3.5 flex-shrink-0" />
//               <div>
//                 <p className="text-[11px] font-black leading-none">{badge.label}</p>
//                 <p className="text-[9px] opacity-70 leading-none mt-0.5">{badge.sub}</p>
//               </div>
//             </div>
//             {clientHistory?.reliabilityScore !== undefined && (
//               <div className="w-20 flex-shrink-0">
//                 <ReliabilityBar score={clientHistory.reliabilityScore} />
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── Header: avatar + status badges ── */}
//         <div className="flex items-start justify-between gap-2">
//           <div className="flex items-center gap-2.5 min-w-0">
//             <div className="relative flex-shrink-0">
//               {/* Fixed avatar size */}
//               <Avatar src={job.postedBy?.avatar?.url} name={job.postedBy?.name} size="sm" />
//               {badge?.tier === 'trusted' && (
//                 <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center border border-white z-10">
//                   <CheckCircle className="w-2.5 h-2.5 text-white fill-white" />
//                 </span>
//               )}
//             </div>
//             <div className="min-w-0">
//               <p className="text-xs text-slate-500 truncate flex items-center gap-1">
//                 {job.postedBy?.name ?? 'Client'}
//                 {badge && (
//                   <span className={`text-[9px] font-bold px-1 rounded-sm ${
//                     badge.tier === 'trusted' ? 'bg-emerald-100 text-emerald-700' :
//                     badge.tier === 'repeat'  ? 'bg-blue-100 text-blue-700' :
//                     'bg-violet-100 text-violet-700'
//                   }`}>
//                     {clientHistory?.totalJobs}×
//                   </span>
//                 )}
//               </p>
//               <p className="text-[11px] text-slate-400">{timeAgo(job.createdAt)}</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-1.5 flex-shrink-0">
//             {job.isUrgent && <span className="badge badge-orange gap-1 text-[10px]"><Zap className="w-3 h-3" />Urgent</span>}
//             <span className={`badge ${statusCss} text-[10px]`}>{statusLabel}</span>
//           </div>
//         </div>

//         {/* ── Title + category ── */}
//         <div>
//           <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 text-sm">
//             {job.title}
//           </h3>
//           <p className="text-xs text-slate-500 mt-0.5 capitalize">{job.category}</p>
//         </div>

//         {/* ── Description ── */}
//         <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed flex-1 min-h-[40px]">
//           {job.description}
//         </p>

//         {/* ── Match score (recommendations) ── */}
//         {job._recommendationScore !== undefined && (
//           <div className="flex items-center gap-1.5">
//             <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
//               <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
//                 style={{ width:`${Math.min(100, Math.round((job._recommendationScore / 120) * 100))}%` }} />
//             </div>
//             <span className="text-[10px] font-bold text-orange-600 flex-shrink-0">
//               {Math.min(100, Math.round((job._recommendationScore / 120) * 100))}% match
//             </span>
//           </div>
//         )}

//         {/* ── Meta row ── */}
//         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-2">
//           {job.location?.city && (
//             <span className="flex items-center gap-1">
//               <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
//               {job.location.city}{job.location.state ? `, ${job.location.state}` : ''}
//             </span>
//           )}
//           <span className="flex items-center gap-1">
//             <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
//             {job.totalLabourNeeded} needed
//           </span>
//           {job.startDate && (
//             <span className="flex items-center gap-1">
//               <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
//               {new Date(job.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
//             </span>
//           )}
//         </div>

//         {/* ── Footer: budget + apply ── */}
//         <div className="flex items-center justify-between pt-3 border-t border-surface-100 mt-auto">
//           <div className="flex items-center gap-0.5 text-primary font-semibold text-sm">
//             <IndianRupee className="w-3.5 h-3.5" />
//             <span>
//               {formatCurrency(job.budgetMin, 'INR').replace('₹', '')}–
//               {formatCurrency(job.budgetMax, 'INR').replace('₹', '')}
//             </span>
//             <span className="text-xs text-slate-400 font-normal ml-0.5">
//               /{job.budgetType === 'daily' ? 'day' : job.budgetType}
//             </span>
//           </div>

//           <div className="flex items-center gap-2">
//             {myAppStatus && (
//               <span className={`badge badge-${myAppStatus==='accepted'?'green':myAppStatus==='rejected'?'red':'blue'} text-[10px]`}>
//                 {myAppStatus.charAt(0).toUpperCase() + myAppStatus.slice(1)}
//               </span>
//             )}
//             {showApplyBtn && !myAppStatus && (
//               <button
//                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm flex-shrink-0"
//                 onClick={e => {
//                   e.preventDefault();    // stop Link navigation
//                   e.stopPropagation();   // stop event bubbling
//                   onApply?.(job);
//                 }}
//               >
//                 Apply Now
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// };

// export default JobCard;

import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Zap, IndianRupee, RefreshCw, CheckCircle, Shield, Bookmark, BookmarkCheck } from 'lucide-react';
import { formatCurrency, timeAgo, JOB_STATUS_CSS, JOB_STATUS_LABELS } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';
import Avatar from './Avatar';
import { useState, useEffect } from 'react';

/* ── Role-aware job link ────────────────────────────────────────────────────── */
const useJobLink = (jobId) => {
  const { user } = useAuth();
  if (user?.role === 'labour') return `/labour/jobs/${jobId}`;
  if (user?.role === 'client') return `/client/browse-jobs/${jobId}`;
  if (user?.role === 'admin')  return `/admin/jobs`;
  return `/jobs/${jobId}`;
};

/* ── Repeat client badge ─────────────────────────────────────────────────────── */
const getRepeatBadge = (history) => {
  if (!history) return null;
  const { completedJobs = 0, inProgressJobs = 0, reliabilityScore = 0 } = history;
  const validJobs = completedJobs + inProgressJobs;
  if (validJobs === 0) return null;
  if (reliabilityScore >= 75 && completedJobs >= 3)
    return { label:'Trusted Client',  sub:`${completedJobs}× completed`, icon:Shield,     cls:'bg-emerald-50 text-emerald-700 border-emerald-300', dot:'bg-emerald-500', tier:'trusted' };
  if (completedJobs >= 2 || (completedJobs >= 1 && inProgressJobs >= 1))
    return { label:'Repeat Client',   sub:`${completedJobs} job${completedJobs>1?'s':''} done`, icon:RefreshCw,  cls:'bg-blue-50 text-blue-700 border-blue-300',     dot:'bg-blue-500',    tier:'repeat'  };
  return { label:'Previous Client', sub:"Worked before",   icon:CheckCircle, cls:'bg-violet-50 text-violet-700 border-violet-300', dot:'bg-violet-400',  tier:'previous'};
};

/* ── Reliability bar ─────────────────────────────────────────────────────────── */
const ReliabilityBar = ({ score }) => {
  const pct   = Math.min(100, score);
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400';
  const tcolor= pct >= 75 ? '#059669' : pct >= 50 ? '#2563eb' : '#d97706';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width:`${pct}%`, transition:'width .7s' }} />
      </div>
      <span className="text-[9px] font-black" style={{ color: tcolor }}>{pct}%</span>
    </div>
  );
};

/* ── Countdown Timer Component ──────────────────────────────────────────────── */
const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('No expiry');
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
        return;
      }

      setExpired(false);
      setIsUrgent(diff < 24 * 60 * 60 * 1000);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, 60000); // ✅ FIXED (1 min)

    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div
      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
        expired
          ? 'bg-red-100 text-red-600'
          : isUrgent
          ? 'bg-red-50 text-red-600 animate-pulse'
          : 'bg-orange-50 text-orange-600'
      }`}
    >
      <Clock className="w-3 h-3" />
      {timeLeft}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   JOB CARD - Uniform sizing, no refresh on click
══════════════════════════════════════════════════════════════════════════════ */
const JobCard = ({ job, showApplyBtn = false, onApply, myAppStatus, clientHistory, isSaved = false, onToggleSave }) => {
  if (!job) return null;

  const jobLink     = useJobLink(job._id);
  const statusCss   = JOB_STATUS_CSS[job.status]   || 'badge-gray';
  const statusLabel = JOB_STATUS_LABELS[job.status] || job.status;
  const badge       = getRepeatBadge(clientHistory);
  const BadgeIcon   = badge?.icon;
  const { user }    = useAuth();
  const isLabour    = user?.role === 'labour';

  const handlePreviewClick = (e) => {
    // Allow the Link navigation to happen naturally
    // The modal will open based on the route
  };

  return (
    <div className={`block group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-primary hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col ${badge?.tier === 'trusted' ? 'ring-1 ring-emerald-200' : ''}`}>
      {/* Trusted glow border */}
      {badge?.tier === 'trusted' && (
        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-300 pointer-events-none z-10" />
      )}

      <div className="flex flex-col h-full p-4 space-y-3">

        {/* ── Header: Save button + Timer ── */}
        <div className="flex items-center justify-between">
          <CountdownTimer expiresAt={job.expiresAt} />
          
          {isLabour && onToggleSave && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(job._id, isSaved);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                isSaved 
                  ? 'bg-orange-100 text-orange-600' 
                  : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-500'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* ── Repeat Client Banner ── */}
        {badge && (
          <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${badge.cls}`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${badge.dot} flex-shrink-0`} />
              <BadgeIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-black leading-none">{badge.label}</p>
                <p className="text-[9px] opacity-70 leading-none mt-0.5">{badge.sub}</p>
              </div>
            </div>
            {clientHistory?.reliabilityScore !== undefined && (
              <div className="w-20 flex-shrink-0">
                <ReliabilityBar score={clientHistory.reliabilityScore} />
              </div>
            )}
          </div>
        )}

        {/* ── Header: avatar + status badges ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              {/* Show Mediator Avatar if Labour, else Client */}
              {isLabour && job.postedBy?.clientProfile?.assignedEmployee ? (
                <Avatar 
                  src={job.postedBy.clientProfile.assignedEmployee.avatar?.url} 
                  name={job.postedBy.clientProfile.assignedEmployee.name} 
                  size="sm" 
                />
              ) : (
                <Avatar src={job.postedBy?.avatar?.url} name={job.postedBy?.name} size="sm" />
              )}
              {badge?.tier === 'trusted' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center border border-white z-10">
                  <CheckCircle className="w-2.5 h-2.5 text-white fill-white" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                {isLabour && job.postedBy?.clientProfile?.assignedEmployee 
                  ? `${job.postedBy.clientProfile.assignedEmployee.name} (Mediator)`
                  : (job.postedBy?.name ?? 'Client')
                }
                {badge && (
                  <span className={`text-[9px] font-bold px-1 rounded-sm ${
                    badge.tier === 'trusted' ? 'bg-emerald-100 text-emerald-700' :
                    badge.tier === 'repeat'  ? 'bg-blue-100 text-blue-700' :
                    'bg-violet-100 text-violet-700'
                  }`}>
                    {clientHistory?.totalJobs}×
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-400">{timeAgo(job.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {job.isUrgent && <span className="badge badge-orange gap-1 text-[10px]"><Zap className="w-3 h-3" />Urgent</span>}
            <span className={`badge ${statusCss} text-[10px]`}>{statusLabel}</span>
          </div>
        </div>

        {/* ── Title + category ── */}
        <div>
          <Link to={jobLink}>
            <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 text-sm">
              {job.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{job.category}</p>
        </div>

        {/* ── Description ── */}
        <Link to={jobLink} className="flex-1">
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed min-h-[40px]">
            {job.description}
          </p>
        </Link>

        {/* ── Match score (recommendations) ── */}
        {job._recommendationScore !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                style={{ width:`${Math.min(100, Math.round((job._recommendationScore / 120) * 100))}%` }} />
            </div>
            <span className="text-[10px] font-bold text-orange-600 flex-shrink-0">
              {Math.min(100, Math.round((job._recommendationScore / 120) * 100))}% match
            </span>
          </div>
        )}

        {/* ── Meta row ── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-2">
          {job.location?.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              {job.location.city}{job.location.state ? `, ${job.location.state}` : ''}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
            {job.totalLabourNeeded} needed
          </span>
          {job.startDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
              {new Date(job.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
            </span>
          )}
        </div>

        {/* ── Footer: budget + actions ── */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-100 mt-auto">
          <div className="flex items-center gap-0.5 text-primary font-semibold text-sm">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>
              {formatCurrency(job.budgetMin, 'INR').replace('₹', '')}–
              {formatCurrency(job.budgetMax, 'INR').replace('₹', '')}
            </span>
            <span className="text-xs text-slate-400 font-normal ml-0.5">
              /{job.budgetType === 'daily' ? 'day' : job.budgetType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {myAppStatus && (
              <span className={`badge badge-${myAppStatus==='accepted'?'green':myAppStatus==='rejected'?'red':'blue'} text-[10px]`}>
                {myAppStatus.charAt(0).toUpperCase() + myAppStatus.slice(1)}
              </span>
            )}
            
            {/* ✅ CHANGED: Preview button instead of Apply */}
            {showApplyBtn && !myAppStatus && new Date(job.expiresAt) > new Date() && (
              <Link
                to={jobLink}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm flex-shrink-0"
              >
                Preview
              </Link>
            )}

            {new Date(job.expiresAt) < new Date() && (
              <span className="text-[10px] text-red-500 font-bold px-2 py-1 bg-red-50 rounded-lg">
                Expired
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;