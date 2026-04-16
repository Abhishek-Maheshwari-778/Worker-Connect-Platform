// import { useState, useEffect, useRef } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useNavigate, Link } from 'react-router-dom';
// import {
//   Search, SlidersHorizontal, MapPin, X, Zap, RefreshCw,
//   ArrowLeft, Briefcase, Clock, IndianRupee, Users,
//   TrendingUp, Filter, ChevronDown, BookmarkPlus, Bookmark,
//   Share2, Grid3x3, List, ArrowUpDown, Building2, Send
// } from 'lucide-react';
// import jobService   from '@/services/jobService';
// import JobCard      from '@/components/common/JobCard';
// import { EmptyState, Pagination } from '@/components/common/UIComponents';
// // ✅ NO Navbar import — JobsPage renders inside LabourLayout which already has Navbar
// import { JOB_CATEGORIES, timeAgo, formatCurrency } from '@/utils/helpers';
// import { useDebounce } from '@/hooks/useHooks';
// import { useSocket }   from '@/context/SocketContext';
// import { useAuth }     from '@/context/AuthContext';
// import toast from 'react-hot-toast';

// /* ── Category colors ─────────────────────────────────────────────────────────── */
// const CAT_COLORS = {
//   construction:'bg-orange-100 text-orange-700 border-orange-200',
//   electrical:  'bg-yellow-100 text-yellow-700 border-yellow-200',
//   plumbing:    'bg-blue-100 text-blue-700 border-blue-200',
//   painting:    'bg-pink-100 text-pink-700 border-pink-200',
//   carpentry:   'bg-amber-100 text-amber-700 border-amber-200',
//   welding:     'bg-red-100 text-red-700 border-red-200',
//   cleaning:    'bg-cyan-100 text-cyan-700 border-cyan-200',
//   gardening:   'bg-green-100 text-green-700 border-green-200',
//   moving:      'bg-purple-100 text-purple-700 border-purple-200',
//   security:    'bg-slate-100 text-slate-700 border-slate-200',
//   driving:     'bg-indigo-100 text-indigo-700 border-indigo-200',
//   cooking:     'bg-rose-100 text-rose-700 border-rose-200',
//   other:       'bg-gray-100 text-gray-600 border-gray-200',
// };

// /* ── Stat bubble ─────────────────────────────────────────────────────────────── */
// const StatBubble = ({ icon: Icon, label, value, color }) => (
//   <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
//     <Icon className={`w-4 h-4 ${color}`} />
//     <div>
//       <p className="font-black text-white text-sm leading-none">{value}</p>
//       <p className="text-white/60 text-[10px] leading-none mt-0.5">{label}</p>
//     </div>
//   </div>
// );

// /* ── List-view row ────────────────────────────────────────────────────────────── */
// const JobListRow = ({ job, onApply, isSaved, onSave }) => {
//   const catMeta = JOB_CATEGORIES.find(c => c.value === job.category);
//   const color   = CAT_COLORS[job.category] || CAT_COLORS.other;
//   // Role-aware link built from current path
//   const { user } = useAuth();
//   const jobLink  = user?.role === 'labour' ? `/labour/jobs/${job._id}` :
//                    user?.role === 'client' ? `/client/browse-jobs/${job._id}` :
//                    `/jobs/${job._id}`;

//   return (
//     <Link to={jobLink}
//       className="bg-white rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-md transition-all p-4 flex items-center gap-4 group block">
//       <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg border ${color}`}>
//         {catMeta?.label.split(' ')[0] || '💼'}
//       </div>
//       <div className="flex-1 min-w-0">
//         <div className="flex items-center gap-2 mb-0.5">
//           <p className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-700">{job.title}</p>
//           {job.isUrgent && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200 flex-shrink-0 flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" />Urgent</span>}
//         </div>
//         <div className="flex items-center gap-3 text-xs text-gray-500">
//           <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.postedBy?.name || 'Client'}</span>
//           {job.location?.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location.city}</span>}
//           <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(job.createdAt)}</span>
//         </div>
//       </div>
//       <div className="flex items-center gap-3 flex-shrink-0">
//         <div className="text-right hidden sm:block">
//           <p className="font-black text-gray-900 text-sm">₹{job.budgetMin}–{job.budgetMax}</p>
//           <p className="text-[10px] text-gray-400">/{job.budgetType === 'daily' ? 'day' : job.budgetType}</p>
//         </div>
//         <button onClick={e => { e.preventDefault(); e.stopPropagation(); onSave(job._id); }}
//           className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50">
//           {isSaved ? <Bookmark className="w-4 h-4 fill-orange-500 text-orange-500" /> : <BookmarkPlus className="w-4 h-4" />}
//         </button>
//       </div>
//     </Link>
//   );
// };

// /* ══════════════════════════════════════════════════════════════════════════════
//    MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════ */
// const JobsPage = () => {
//   const navigate  = useNavigate();
//   const qc        = useQueryClient();
//   const { on }    = useSocket();
//   const { user, isLabour } = useAuth();

//   const [search,      setSearch]      = useState('');
//   const [category,    setCategory]    = useState('');
//   const [city,        setCity]        = useState('');
//   const [budgetMax,   setBudgetMax]   = useState('');
//   const [budgetMin,   setBudgetMin]   = useState('');
//   const [isUrgent,    setIsUrgent]    = useState(false);
//   const [sortBy,      setSortBy]      = useState('createdAt');
//   const [page,        setPage]        = useState(1);
//   const [viewMode,    setViewMode]    = useState('grid');
//   const [filtersOpen, setFiltersOpen] = useState(false);
//   const [newJobBanner,setNewJobBanner]= useState(null);
//   const [savedJobs,   setSavedJobs]   = useState(() => {
//     try { return JSON.parse(localStorage.getItem('lc_saved_jobs') || '[]'); }
//     catch { return []; }
//   });
//   const [applyingJob, setApplyingJob] = useState(null);
//   const [proposalMsg, setProposalMsg] = useState('');
//   const searchRef = useRef(null);

//   const dSearch = useDebounce(search, 400);
//   const dCity   = useDebounce(city,   400);

//   /* Real-time */
//   useEffect(() => {
//     const offNew     = on('job:new',     (j) => { setNewJobBanner({ title: j.title }); setTimeout(() => setNewJobBanner(null), 10000); });
//     const offUpdated = on('job:updated', ()  => qc.invalidateQueries(['jobs']));
//     const offDeleted = on('job:deleted', ()  => qc.invalidateQueries(['jobs']));
//     return () => { offNew?.(); offUpdated?.(); offDeleted?.(); };
//   }, [on, qc]);

//   /* Data */
//   const { data, isLoading, isFetching } = useQuery({
//     queryKey: ['jobs', { dSearch, category, dCity, budgetMax, budgetMin, isUrgent, sortBy, page }],
//     queryFn: () => jobService.getJobs({
//       search:    dSearch   || undefined,
//       category:  category  || undefined,
//       city:      dCity     || undefined,
//       budgetMax: budgetMax || undefined,
//       budgetMin: budgetMin || undefined,
//       isUrgent:  isUrgent  || undefined,
//       sortBy, page, limit: 12, status: 'open',
//     }).then(r => r.data),
//     keepPreviousData: true,
//   });

//   /* Apply */
//   const applyMut = useMutation({
//     mutationFn: ({ jobId, msg }) => jobService.applyToJob(jobId, { proposalMsg: msg }),
//     onSuccess: () => {
//       toast.success('✅ Application submitted!');
//       qc.invalidateQueries(['jobs']);
//       setApplyingJob(null); setProposalMsg('');
//     },
//     onError: (err) => toast.error(err?.response?.data?.message || 'Failed to apply'),
//   });

//   /* Client history */
//   const { data: clientHistoryData } = useQuery({
//     queryKey: ['my-client-history'],
//     queryFn:  () => jobService.getClientHistory().then(r => r.data.data),
//     enabled:  !!isLabour,
//     staleTime: 5 * 60 * 1000,
//   });
//   const clientHistoryMap = clientHistoryData || {};

//   const jobs       = data?.data       || [];
//   const totalPages = data?.meta?.totalPages || 1;
//   const total      = data?.meta?.total || 0;

//   const clearFilters = () => {
//     setSearch(''); setCategory(''); setCity('');
//     setBudgetMax(''); setBudgetMin(''); setIsUrgent(false);
//     setSortBy('createdAt'); setPage(1);
//     searchRef.current?.focus();
//   };

//   const hasFilters = dSearch || category || dCity || budgetMax || budgetMin || isUrgent;
//   const activeCount = [category, dCity, budgetMax, budgetMin, isUrgent ? 'x' : ''].filter(Boolean).length;

//   const toggleSave = (jobId) => {
//     setSavedJobs(prev => {
//       const next = prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId];
//       localStorage.setItem('lc_saved_jobs', JSON.stringify(next));
//       toast.success(prev.includes(jobId) ? 'Removed from saved' : '🔖 Job saved!', { duration: 1500 });
//       return next;
//     });
//   };

//   const handleShare = (job) => {
//     const url = `${window.location.origin}/jobs/${job._id}`;
//     if (navigator.share) navigator.share({ title: job.title, url });
//     else { navigator.clipboard.writeText(url); toast.success('🔗 Link copied!'); }
//   };

//   const trendingCategories = [...new Set(jobs.map(j => j.category))].slice(0, 5);

//   return (
//     // ✅ No Navbar here — LabourLayout already provides it
//     <div className="min-h-screen bg-gray-50">

//       {/* ── Hero ── */}
//       <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden">
//         <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4" />
//         <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
//         <div className="relative max-w-4xl mx-auto px-4 pt-5 pb-10">
//           {/* Back button */}
//           <button onClick={() => navigate(-1)}
//             className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold mb-5 transition-colors group">
//             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
//           </button>
//           <div className="text-center space-y-3 mb-7">
//             <h1 className="text-3xl sm:text-4xl font-display font-black text-white">Find Your Next Job</h1>
//             <p className="text-blue-200 text-sm">
//               {total > 0 ? `${total.toLocaleString()} open jobs waiting for you` : 'Browse daily work opportunities near you'}
//             </p>
//           </div>
//           <div className="relative max-w-2xl mx-auto">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input ref={searchRef}
//               className="w-full pl-12 pr-12 py-4 rounded-2xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none shadow-xl focus:ring-4 focus:ring-white/30"
//               placeholder="Search by job title, skill, or location…"
//               value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
//             />
//             {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
//           </div>
//           <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
//             <StatBubble icon={Briefcase}   label="Open Jobs"  value={total}                                    color="text-blue-200" />
//             <StatBubble icon={Zap}         label="Urgent"     value={jobs.filter(j=>j.isUrgent).length||'—'}   color="text-yellow-200" />
//             <StatBubble icon={TrendingUp}  label="Categories" value={trendingCategories.length||'—'}            color="text-green-200" />
//           </div>
//         </div>
//       </div>

//       {/* Real-time banner */}
//       {newJobBanner && (
//         <div className="bg-green-500 text-white text-sm font-semibold py-3 px-4 flex items-center justify-center gap-3">
//           <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
//           🆕 New job posted: <strong className="truncate max-w-[200px]">"{newJobBanner.title}"</strong>
//           <button onClick={() => { qc.invalidateQueries(['jobs']); setNewJobBanner(null); }}
//             className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold flex-shrink-0">
//             <RefreshCw className="w-3.5 h-3.5" /> Show
//           </button>
//           <button onClick={() => setNewJobBanner(null)} className="opacity-70 hover:opacity-100 flex-shrink-0"><X className="w-4 h-4" /></button>
//         </div>
//       )}

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

//         {/* Category chips */}
//         <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
//           <button onClick={() => { setCategory(''); setPage(1); }}
//             className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-2 flex-shrink-0 ${!category ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
//             All Jobs {!category && total > 0 && <span className="bg-white/30 px-1.5 rounded-full">{total}</span>}
//           </button>
//           <button onClick={() => { setIsUrgent(!isUrgent); setPage(1); }}
//             className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-2 flex-shrink-0 ${isUrgent ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-200 hover:border-orange-400'}`}>
//             <Zap className="w-3 h-3" /> Urgent Only
//           </button>
//           {JOB_CATEGORIES.map(cat => {
//             const [emoji, ...rest] = cat.label.split(' ');
//             const active = category === cat.value;
//             const color  = CAT_COLORS[cat.value] || CAT_COLORS.other;
//             return (
//               <button key={cat.value}
//                 onClick={() => { setCategory(active ? '' : cat.value); setPage(1); }}
//                 className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-2 flex-shrink-0 ${active ? `${color} border-current` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
//                 {emoji} {rest.join(' ')}
//               </button>
//             );
//           })}
//         </div>

//         {/* Toolbar */}
//         <div className="flex items-center justify-between gap-3 flex-wrap">
//           <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
//             {isLoading ? 'Loading…' : <>{total.toLocaleString()} job{total!==1?'s':''}{hasFilters && <span className="text-gray-400 font-normal"> (filtered)</span>}</>}
//             {isFetching && !isLoading && <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
//           </p>
//           <div className="flex items-center gap-2">
//             <div className="relative">
//               <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
//                 className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white text-gray-700 focus:outline-none cursor-pointer">
//                 <option value="createdAt">Newest First</option>
//                 <option value="budgetMax">Highest Pay</option>
//                 <option value="startDate">Start Date</option>
//               </select>
//               <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
//               <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
//             </div>
//             <button onClick={() => setFiltersOpen(!filtersOpen)}
//               className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-2 ${filtersOpen||activeCount>0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
//               <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
//               {activeCount > 0 && <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] font-black flex items-center justify-center">{activeCount}</span>}
//             </button>
//             {hasFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-2 rounded-xl hover:bg-red-50"><X className="w-3.5 h-3.5" /> Clear</button>}
//             <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
//               <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode==='grid'?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-50'}`}><Grid3x3 className="w-3.5 h-3.5" /></button>
//               <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode==='list'?'bg-blue-600 text-white':'text-gray-500 hover:bg-gray-50'}`}><List className="w-3.5 h-3.5" /></button>
//             </div>
//           </div>
//         </div>

//         {/* Repeat client legend */}
//         {isLabour && Object.keys(clientHistoryMap).length > 0 && (
//           <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-2xl flex-wrap">
//             <span className="text-xs font-bold text-gray-600 flex-shrink-0">Client indicators:</span>
//             <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500" />Trusted (3+ done)</span>
//             <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700"><span className="w-2 h-2 rounded-full bg-blue-500" />Repeat Client</span>
//             <span className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700"><span className="w-2 h-2 rounded-full bg-violet-400" />Previous Client</span>
//           </div>
//         )}

//         {/* Advanced filters */}
//         {filtersOpen && (
//           <div className="bg-white rounded-3xl border-2 border-gray-100 p-5 shadow-sm animate-fade-in">
//             <div className="flex items-center justify-between mb-4">
//               <p className="font-bold text-gray-800 flex items-center gap-2"><Filter className="w-4 h-4 text-blue-500" /> Advanced Filters</p>
//               {activeCount > 0 && <button onClick={clearFilters} className="text-xs font-bold text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Clear all</button>}
//             </div>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//               <div>
//                 <label className="text-xs font-bold text-gray-500 mb-1.5 block">City / Location</label>
//                 <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
//                   <input className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="e.g. Lucknow" value={city} onChange={e => { setCity(e.target.value); setPage(1); }} /></div>
//               </div>
//               <div>
//                 <label className="text-xs font-bold text-gray-500 mb-1.5 block">Min Budget (₹/day)</label>
//                 <div className="relative"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
//                   <input type="number" min="0" className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="e.g. 300" value={budgetMin} onChange={e => { setBudgetMin(e.target.value); setPage(1); }} /></div>
//               </div>
//               <div>
//                 <label className="text-xs font-bold text-gray-500 mb-1.5 block">Max Budget (₹/day)</label>
//                 <div className="relative"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
//                   <input type="number" min="0" className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="e.g. 1000" value={budgetMax} onChange={e => { setBudgetMax(e.target.value); setPage(1); }} /></div>
//               </div>
//               <div>
//                 <label className="text-xs font-bold text-gray-500 mb-1.5 block">Sort By</label>
//                 <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400 cursor-pointer" value={sortBy} onChange={e => setSortBy(e.target.value)}>
//                   <option value="createdAt">Newest First</option>
//                   <option value="budgetMax">Highest Pay</option>
//                   <option value="startDate">Earliest Start</option>
//                 </select>
//               </div>
//             </div>
//             {(budgetMin || budgetMax) && (
//               <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
//                 <IndianRupee className="w-3.5 h-3.5 flex-shrink-0" />
//                 <span>Showing jobs paying{budgetMin && <strong> ₹{budgetMin}+</strong>}{budgetMin && budgetMax && ' up to'}{budgetMax && <strong> ₹{budgetMax}</strong>} per day</span>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Saved jobs strip */}
//         {savedJobs.length > 0 && !hasFilters && (
//           <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
//             <Bookmark className="w-4 h-4 text-amber-600 fill-amber-600 flex-shrink-0" />
//             <p className="text-xs font-semibold text-amber-800">You have <strong>{savedJobs.length}</strong> saved job{savedJobs.length>1?'s':''}.</p>
//             <button onClick={() => setSavedJobs([])} className="ml-auto text-[10px] font-bold text-amber-600 hover:text-amber-800 underline">Clear</button>
//           </div>
//         )}

//         {/* Job grid / list */}
//         {isLoading ? (
//           <div className={viewMode==='grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
//             {[1,2,3,4,5,6].map(i => <div key={i} className={`bg-white rounded-2xl border border-gray-100 animate-pulse ${viewMode==='grid'?'h-52':'h-20'}`} />)}
//           </div>
//         ) : jobs.length > 0 ? (
//           <>
//             {viewMode === 'grid' ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
//                 {jobs.map(job => (
//                   <div key={job._id} className="relative group">
//                     <JobCard job={job}
//                       showApplyBtn={isLabour}
//                       onApply={setApplyingJob}
//                       clientHistory={isLabour ? clientHistoryMap[job.postedBy?._id?.toString()] : undefined}
//                     />
//                     {/* Save + Share overlay */}
//                     <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
//                       <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSave(job._id); }}
//                         className="w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center hover:scale-110 border border-gray-100">
//                         {savedJobs.includes(job._id) ? <Bookmark className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> : <BookmarkPlus className="w-3.5 h-3.5 text-gray-500" />}
//                       </button>
//                       <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleShare(job); }}
//                         className="w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center hover:scale-110 border border-gray-100">
//                         <Share2 className="w-3.5 h-3.5 text-gray-500" />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="space-y-2.5">
//                 {jobs.map(job => (
//                   <JobListRow key={job._id} job={job} onApply={setApplyingJob} isSaved={savedJobs.includes(job._id)} onSave={toggleSave} />
//                 ))}
//               </div>
//             )}
//             <Pagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
//           </>
//         ) : (
//           <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
//             <div className="text-6xl mb-4">🔍</div>
//             <p className="font-bold text-gray-700 text-xl mb-2">No jobs found</p>
//             <p className="text-gray-400 text-sm mb-6">{hasFilters ? 'Try adjusting your filters.' : 'No open jobs right now. Check back soon!'}</p>
//             {hasFilters && <button onClick={clearFilters} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">Clear All Filters</button>}
//           </div>
//         )}
//       </div>

//       {/* ── Apply Modal ── */}
//       {applyingJob && (
//         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
//           style={{ backdropFilter:'blur(6px)', background:'rgba(0,0,0,0.55)' }}
//           onClick={() => { setApplyingJob(null); setProposalMsg(''); }}>
//           <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
//             <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-5">
//               <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Apply for Job</p>
//               <p className="font-display font-bold text-white text-lg line-clamp-2">{applyingJob.title}</p>
//               <div className="flex items-center gap-3 mt-1.5 text-sm text-blue-200">
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
//                       <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{r.skill}</span>
//                     ))}
//                   </div>
//                 </div>
//               )}
//               <div>
//                 <label className="text-xs font-bold text-gray-600 mb-1.5 block">Message to Client <span className="text-gray-400 font-normal">(optional)</span></label>
//                 <textarea value={proposalMsg} onChange={e => setProposalMsg(e.target.value)}
//                   rows={3} maxLength={500}
//                   placeholder="Briefly introduce yourself and mention your relevant experience..."
//                   className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
//                 />
//                 <p className="text-[10px] text-gray-400 mt-1">{proposalMsg.length}/500</p>
//               </div>
//               <div className="flex gap-3">
//                 <button onClick={() => { setApplyingJob(null); setProposalMsg(''); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
//                 <button onClick={() => applyMut.mutate({ jobId: applyingJob._id, msg: proposalMsg })}
//                   disabled={applyMut.isPending}
//                   className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-blue-200">
//                   {applyMut.isPending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Applying…</> : <><Send className="w-4 h-4" />Submit</>}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default JobsPage;

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, MapPin, X, Zap, RefreshCw,
  ArrowLeft, Briefcase, Clock, IndianRupee, Users,
  TrendingUp, Filter, ChevronDown, BookmarkPlus, Bookmark,
  Share2, Grid3x3, List, ArrowUpDown, Building2, Send
} from 'lucide-react';
import jobService   from '@/services/jobService';
import JobCard      from '@/components/common/JobCard';
import { EmptyState, Pagination } from '@/components/common/UIComponents';
import { JOB_CATEGORIES, timeAgo, formatCurrency } from '@/utils/helpers';
import { useDebounce } from '@/hooks/useHooks';
import { useSocket }   from '@/context/SocketContext';
import { useAuth }     from '@/context/AuthContext';
import toast from 'react-hot-toast';

/* ── Category colors ─────────────────────────────────────────────────────────── */
const CAT_COLORS = {
  construction:'bg-orange-100 text-orange-700 border-orange-200',
  electrical:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  plumbing:    'bg-blue-100 text-blue-700 border-blue-200',
  painting:    'bg-pink-100 text-pink-700 border-pink-200',
  carpentry:   'bg-amber-100 text-amber-700 border-amber-200',
  welding:     'bg-red-100 text-red-700 border-red-200',
  cleaning:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  gardening:   'bg-green-100 text-green-700 border-green-200',
  moving:      'bg-purple-100 text-purple-700 border-purple-200',
  security:    'bg-slate-100 text-slate-700 border-slate-200',
  driving:     'bg-indigo-100 text-indigo-700 border-indigo-200',
  cooking:     'bg-rose-100 text-rose-700 border-rose-200',
  other:       'bg-gray-100 text-gray-600 border-gray-200',
};

/* ── Stat bubble ─────────────────────────────────────────────────────────────── */
const StatBubble = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
    <Icon className={`w-4 h-4 ${color}`} />
    <div>
      <p className="font-black text-white text-sm leading-none">{value}</p>
      <p className="text-white/60 text-[10px] leading-none mt-0.5">{label}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const JobsPage = () => {
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const { on }    = useSocket();
  const { user, isLabour } = useAuth();

  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('');
  const [city,        setCity]        = useState('');
  const [budgetMax,   setBudgetMax]   = useState('');
  const [budgetMin,   setBudgetMin]   = useState('');
  const [isUrgent,    setIsUrgent]    = useState(false);
  const [sortBy,      setSortBy]      = useState('createdAt');
  const [page,        setPage]        = useState(1);
  const [viewMode,    setViewMode]    = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [newJobBanner,setNewJobBanner]= useState(null);
  
  const { data: savedJobsData } = useQuery({
    queryKey: ['saved-jobs-list'],
    queryFn: () => jobService.getSavedJobs({ page: 1, limit: 100 }).then(r => r.data.data),
    enabled: !!isLabour,
  });

  const savedJobIds = new Set(savedJobsData?.map(j => j._id) || []);
  const [applyingJob, setApplyingJob] = useState(null);
  const [proposalMsg, setProposalMsg] = useState('');
  const searchRef = useRef(null);

  const dSearch = useDebounce(search, 400);
  const dCity   = useDebounce(city,   400);

  /* Real-time */
  useEffect(() => {
    const offNew     = on('job:new',     (j) => { setNewJobBanner({ title: j.title }); setTimeout(() => setNewJobBanner(null), 10000); });
    const offUpdated = on('job:updated', ()  => qc.invalidateQueries(['jobs']));
    const offDeleted = on('job:deleted', ()  => qc.invalidateQueries(['jobs']));
    return () => { offNew?.(); offUpdated?.(); offDeleted?.(); };
  }, [on, qc]);

  /* Data */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', { dSearch, category, dCity, budgetMax, budgetMin, isUrgent, sortBy, page }],
    queryFn: () => jobService.getJobs({
      search:    dSearch   || undefined,
      category:  category  || undefined,
      city:      dCity     || undefined,
      budgetMax: budgetMax || undefined,
      budgetMin: budgetMin || undefined,
      isUrgent:  isUrgent  || undefined,
      sortBy, page, limit: 12, status: 'open',
    }).then(r => r.data),
    keepPreviousData: true,
  });

  /* Apply mutation */
  const applyMut = useMutation({
    mutationFn: ({ jobId, msg }) => jobService.applyToJob(jobId, { proposalMsg: msg }),
    onSuccess: () => {
      toast.success('✅ Application submitted!');
      qc.invalidateQueries(['jobs']);
      setApplyingJob(null); setProposalMsg('');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to apply'),
  });
  
  const saveMut = useMutation({
    mutationFn: (jobId) => jobService.saveJob(jobId),
    onSuccess: () => {
      qc.invalidateQueries(['saved-jobs-list']);
      toast.success('Job saved');
    },
    onError: () => toast.error('Failed to save job')
  });

  const unsaveMut = useMutation({
    mutationFn: (jobId) => jobService.unsaveJob(jobId),
    onSuccess: () => {
      qc.invalidateQueries(['saved-jobs-list']);
      toast.success('Removed from saved');
    },
    onError: () => toast.error('Failed to remove job')
  });

  /* Client history */
  const { data: clientHistoryData } = useQuery({
    queryKey: ['my-client-history'],
    queryFn:  () => jobService.getClientHistory().then(r => r.data.data),
    enabled:  !!isLabour,
    staleTime: 5 * 60 * 1000,
  });
  const clientHistoryMap = clientHistoryData || {};

  const jobs       = data?.data       || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total      = data?.meta?.total || 0;

  const clearFilters = () => {
    setSearch(''); setCategory(''); setCity('');
    setBudgetMax(''); setBudgetMin(''); setIsUrgent(false);
    setSortBy('createdAt'); setPage(1);
    searchRef.current?.focus();
  };

  const hasFilters = dSearch || category || dCity || budgetMax || budgetMin || isUrgent;
  const activeCount = [category, dCity, budgetMax, budgetMin, isUrgent ? 'x' : ''].filter(Boolean).length;

  const toggleSave = (jobId, isSaved) => {
    if (isSaved) {
      unsaveMut.mutate(jobId);
    } else {
      saveMut.mutate(jobId);
    }
  };

  const handleShare = (job) => {
    const url = `${window.location.origin}/jobs/${job._id}`;
    if (navigator.share) navigator.share({ title: job.title, url });
    else { navigator.clipboard.writeText(url); toast.success('🔗 Link copied!'); }
  };

  const trendingCategories = [...new Set(jobs.map(j => j.category))].slice(0, 5);

  return (
    /* ✅ NO NAVBAR HERE - LabourLayout provides it */
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" /> Browse Jobs
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {total > 0 ? `${total.toLocaleString()} open jobs available` : 'Find work that matches your skills'}
          </p>
        </div>

        <div className="flex items-center gap-2">

          {/* ✅ Saved Jobs Button */}
          <Link
            to="/labour/saved-jobs"
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-all text-sm font-semibold"
          >
            <Bookmark className="w-4 h-4" />
            Saved Jobs

            {savedJobsData?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {savedJobsData.length}
              </span>
            )}
          </Link>

          {/* Existing View Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode==='grid'?'bg-primary text-white':'text-gray-500 hover:bg-gray-50'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode==='list'?'bg-primary text-white':'text-gray-500 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              className="input pl-10 text-sm w-full"
              placeholder="Search by skill, job title, or keyword..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative w-44">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-10 text-sm w-full"
              placeholder="City"
              value={city}
              onChange={e => { setCity(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${filtersOpen || activeCount > 0 ? 'bg-primary text-white border-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeCount > 0 && <span className="ml-1 bg-white/30 px-1.5 rounded-full text-xs">{activeCount}</span>}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {filtersOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Min Budget (₹/day)</label>
              <input 
                type="number" 
                className="input text-sm w-full" 
                placeholder="e.g. 500"
                value={budgetMin}
                onChange={e => { setBudgetMin(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max Budget (₹/day)</label>
              <input 
                type="number" 
                className="input text-sm w-full" 
                placeholder="e.g. 2000"
                value={budgetMax}
                onChange={e => { setBudgetMax(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sort By</label>
              <select 
                className="input text-sm w-full"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="createdAt">Newest First</option>
                <option value="budgetMax">Highest Pay</option>
                <option value="startDate">Start Date</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div 
                  onClick={() => { setIsUrgent(!isUrgent); setPage(1); }}
                  className={`relative w-10 h-5 rounded-full transition-all ${isUrgent ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isUrgent ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Urgent Only</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => { setCategory(''); setPage(1); }}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${!category ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
        >
          All Categories
        </button>
        {JOB_CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => { setCategory(category === cat.value ? '' : cat.value); setPage(1); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${category === cat.value ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-medium">
          {isLoading ? 'Loading jobs...' : `${total} job${total !== 1 ? 's' : ''} found`}
          {isFetching && <RefreshCw className="inline w-3 h-3 ml-2 text-primary animate-spin" />}
        </p>
      </div>

      {/* Job Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 skeleton rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {jobs.map(job => (
              <div key={job._id} className="h-full">
                <JobCard 
                    job={job}
                    showApplyBtn={isLabour && job.status === 'open'}
                    onApply={setApplyingJob}
                    clientHistory={clientHistoryMap[job.postedBy?._id?.toString()]}
                    isSaved={savedJobIds.has(job._id)}
                    onToggleSave={toggleSave}
                  />
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={hasFilters ? 'Try adjusting your filters to see more results.' : 'No open jobs available right now. Check back soon!'}
          action={hasFilters ? <button onClick={clearFilters} className="btn-outline btn">Clear Filters</button> : null}
        />
      )}

      {/* ── Apply Modal (Blue Theme for JobsPage) ── */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter:'blur(6px)', background:'rgba(0,0,0,0.55)' }}
          onClick={() => { setApplyingJob(null); setProposalMsg(''); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-5">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Apply for Job</p>
              <p className="font-display font-bold text-white text-lg line-clamp-2">{applyingJob.title}</p>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-blue-200">
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
                      <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{r.skill}</span>
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
                  placeholder="Briefly introduce yourself and mention your relevant experience..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
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

export default JobsPage;