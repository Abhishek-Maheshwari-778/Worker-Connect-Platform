import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Trophy, Medal, Star, Briefcase, Crown, Award,
  TrendingUp, Zap, Shield, CheckCircle, Target,
  ChevronRight, Flame, BarChart2, Users, MapPin,
  RefreshCw, Loader2, Search, ArrowUp, ArrowDown,
  Minus, Sparkles
} from 'lucide-react';
import userService from '@/services/userService';
import { BadgeList } from '@/components/common/BadgeChip';
import { Pagination } from '@/components/common/UIComponents';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

/* ── Constants ─────────────────────────────────────────────────────────────── */
const LEVEL_COLORS = [
  '', 'bg-gray-200 text-gray-600', 'bg-green-100 text-green-700',
  'bg-teal-100 text-teal-700', 'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700', 'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-800', 'bg-yellow-100 text-yellow-800',
];

const LEVEL_NAMES = [
  '', 'Beginner', 'Apprentice', 'Skilled', 'Proficient',
  'Expert', 'Master', 'Elite', 'Legend', 'Champion', 'Grand Master',
];

const SKILLS = [
  '', 'Masonry', 'Bricklaying', 'Electrical Wiring', 'Pipe Fitting',
  'Wall Painting', 'Carpentry', 'Arc Welding', 'Driving',
  'House Cleaning', 'Gardening', 'AC Installation', 'Plumbing',
];

const PERIODS = [
  { value: 'all',   label: 'All Time',    icon: Trophy  },
  { value: 'month', label: 'This Month',  icon: BarChart2 },
  { value: 'week',  label: 'This Week',   icon: Flame   },
];

/* ── Trust score ring ──────────────────────────────────────────────────────── */
const TrustRing = ({ score = 0, size = 36 }) => {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color }}>
        {score}
      </span>
    </div>
  );
};

/* ── Level pill ────────────────────────────────────────────────────────────── */
const LevelPill = ({ level = 1, size = 'sm' }) => {
  const cls = LEVEL_COLORS[level] || LEVEL_COLORS[1];
  if (size === 'xs') return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cls}`}>
      Lv.{level}
    </span>
  );
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cls} flex items-center gap-1`}>
      <Sparkles className="w-2.5 h-2.5" /> {LEVEL_NAMES[level] || `Lv.${level}`}
    </span>
  );
};

/* ── Rank badge ────────────────────────────────────────────────────────────── */
const RankBadge = ({ rank }) => {
  if (rank === 1) return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 flex-shrink-0 ring-2 ring-amber-300">
      <Trophy className="w-5 h-5 text-white" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-md flex-shrink-0 ring-2 ring-slate-300">
      <Medal className="w-5 h-5 text-white" />
    </div>
  );
  if (rank === 3) return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-300 to-amber-600 flex items-center justify-center shadow-md shadow-orange-100 flex-shrink-0 ring-2 ring-orange-300">
      <Award className="w-5 h-5 text-white" />
    </div>
  );
  return (
    <div className="w-11 h-11 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-black text-gray-500">#{rank}</span>
    </div>
  );
};

/* ── Score change indicator ────────────────────────────────────────────────── */
const ScoreChange = ({ change }) => {
  if (!change || change === 0) return <Minus className="w-3 h-3 text-gray-400" />;
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-green-600 text-[10px] font-bold">
      <ArrowUp className="w-3 h-3" />{change}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-red-500 text-[10px] font-bold">
      <ArrowDown className="w-3 h-3" />{Math.abs(change)}
    </span>
  );
};

/* ── Podium ────────────────────────────────────────────────────────────────── */
const Podium = ({ profiles }) => {
  if (profiles.length < 3) return null;
  const order  = [profiles[1], profiles[0], profiles[2]];
  const podCfg = [
    { label: '2nd', height: 'h-20', bg: 'from-slate-100 to-slate-200', border: 'border-slate-300', crown: null,   glow: '' },
    { label: '1st', height: 'h-28', bg: 'from-amber-50 to-yellow-100', border: 'border-amber-400', crown: <Crown className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />, glow: 'shadow-xl shadow-amber-200' },
    { label: '3rd', height: 'h-16', bg: 'from-orange-50 to-amber-50',  border: 'border-orange-300', crown: null,  glow: '' },
  ];

  return (
    <div className="flex items-end justify-center gap-3 mb-6 px-2">
      {order.map((p, i) => {
        const cfg = podCfg[i];
        return (
          <Link key={p._id} to={`/labourers/${p.user?._id}`}
            className={`flex-1 max-w-[130px] rounded-3xl border-2 p-3.5 text-center bg-gradient-to-b ${cfg.bg} ${cfg.border} ${cfg.glow} transition-all hover:scale-105 hover:-translate-y-1`}>
            {cfg.crown}
            <div className="relative mx-auto w-fit mb-2">
              <img
                src={p.user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.name || 'U')}&background=f97316&color=fff&size=64`}
                alt={p.user?.name}
                className="w-14 h-14 rounded-2xl object-cover border-3 border-white shadow-md mx-auto"
              />
              <LevelPill level={p.level} size="xs" />
            </div>
            <p className="font-bold text-gray-900 text-xs truncate">{p.user?.name}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-amber-700">{(p.averageRating || 0).toFixed(1)}</span>
            </div>
            <div className={`${cfg.height} mt-2 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-b ${cfg.bg} border ${cfg.border}`}>
              <p className="font-display font-black text-xl text-gray-800">{p.score}</p>
              <p className="text-[9px] text-gray-500 font-semibold">pts</p>
            </div>
            <p className="text-[10px] font-bold text-gray-500 mt-1.5">{cfg.label}</p>
          </Link>
        );
      })}
    </div>
  );
};

/* ── Weekly winner banner ──────────────────────────────────────────────────── */
const WeeklyWinnerBanner = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['weekly-winner'],
    queryFn:  () => userService.getWeeklyWinner().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 shadow-xl shadow-orange-200">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)' }} />
      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black text-amber-100 uppercase tracking-widest">
              🏆 Labourer of the Week
            </span>
          </div>
          <p className="font-display font-black text-white text-xl truncate">{data.user?.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-amber-100 text-xs font-semibold">
              <Briefcase className="w-3 h-3" /> {data.weeklyJobsCompleted || 0} jobs
            </span>
            <span className="flex items-center gap-1 text-amber-100 text-xs font-semibold">
              <Star className="w-3 h-3 fill-current" /> {(data.averageRating || 0).toFixed(1)} rating
            </span>
            <span className="flex items-center gap-1 text-amber-100 text-xs font-semibold">
              <Target className="w-3 h-3" /> {data.score} pts
            </span>
          </div>
        </div>
        <Link to={`/labourers/${data.user?._id}`}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 backdrop-blur text-white text-xs font-bold hover:bg-white/30 transition-all ring-1 ring-white/30">
          Profile <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

/* ── Stat chip ─────────────────────────────────────────────────────────────── */
const StatChip = ({ icon: Icon, value, label, color = 'text-gray-600' }) => (
  <div className="flex items-center gap-1">
    <Icon className={`w-3 h-3 ${color} flex-shrink-0`} />
    <span className={`text-xs font-bold ${color}`}>{value}</span>
    {label && <span className="text-[10px] text-gray-400">{label}</span>}
  </div>
);

/* ── Leaderboard row ───────────────────────────────────────────────────────── */
const LeaderRow = ({ profile, isCurrentUser, prevRank }) => {
  const rankChange = prevRank ? prevRank - profile.rank : 0;

  return (
    <Link to={`/labourers/${profile.user?._id}`}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 group
        ${isCurrentUser
          ? 'bg-orange-50 border-orange-300 shadow-sm shadow-orange-100'
          : profile.rank <= 3
            ? 'bg-gradient-to-r from-amber-50/50 to-white border-amber-200 hover:border-amber-300'
            : 'bg-white border-gray-100 hover:border-orange-200'
        }`}>

      {/* Rank */}
      <RankBadge rank={profile.rank} />

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={profile.user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user?.name || 'U')}&background=f97316&color=fff&size=48`}
          alt={profile.user?.name}
          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
        />
        {isCurrentUser && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center">
            <span className="text-[7px] text-white font-black">ME</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className={`font-bold text-sm truncate group-hover:text-orange-600 transition-colors
            ${isCurrentUser ? 'text-orange-700' : 'text-gray-900'}`}>
            {profile.user?.name}
            {isCurrentUser && <span className="text-orange-400 ml-1">· You</span>}
          </p>
          <LevelPill level={profile.level} size="xs" />
        </div>
        {profile.user?.location?.city && (
          <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-1">
            <MapPin className="w-2.5 h-2.5" />
            {profile.user.location.city}{profile.user.location.state ? `, ${profile.user.location.state}` : ''}
          </p>
        )}
        <BadgeList badges={profile.badges || []} max={2} size="sm" />
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <TrustRing score={profile.trustScore || 0} size={32} />
          <div className="text-right">
            <p className="text-xs font-black text-orange-600">{profile.score}<span className="text-[9px] font-normal text-gray-400 ml-0.5">pts</span></p>
            <ScoreChange change={rankChange} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatChip icon={Star} value={(profile.averageRating || 0).toFixed(1)} color="text-amber-500" />
          <StatChip icon={Briefcase} value={profile.completedJobs || 0} label="jobs" />
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 flex-shrink-0 transition-colors" />
    </Link>
  );
};

/* ── Your rank card ────────────────────────────────────────────────────────── */
const YourRankCard = ({ userId, profiles, total }) => {
  const myProfile = profiles.find(p => p.user?._id === userId);
  if (!myProfile) return null;

  const percentile = myProfile.rank
    ? Math.round(((total - myProfile.rank) / total) * 100)
    : 0;

  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-4 text-white shadow-lg shadow-orange-200">
      <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-2">Your Ranking</p>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="font-display font-black text-4xl">#{myProfile.rank}</p>
          <p className="text-xs text-orange-200">of {total}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-orange-200">Score</span>
            <span className="font-black">{myProfile.score} pts</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-orange-200">Trust</span>
            <span className="font-black">{myProfile.trustScore || 0}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-orange-200">Top</span>
            <span className="font-black">{percentile}%</span>
          </div>
        </div>
        <div className="text-center">
          <LevelPill level={myProfile.level} />
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton row ──────────────────────────────────────────────────────────── */
const SkeletonRow = () => (
  <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white animate-pulse">
    <div className="w-11 h-11 rounded-2xl bg-gray-200 flex-shrink-0" />
    <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-32" />
      <div className="h-2 bg-gray-200 rounded w-24" />
      <div className="h-4 bg-gray-100 rounded w-36" />
    </div>
    <div className="w-16 space-y-1.5 flex-shrink-0">
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-100 rounded" />
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const LeaderboardPage = () => {
  const [period,       setPeriod]       = useState('all');
  const [skill,        setSkill]        = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [liveUpdate,   setLiveUpdate]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const { user }  = useAuth();
  const { on }    = useSocket();
  const qc        = useQueryClient();
  const searchRef = useRef(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['leaderboard', { period, skill, page }],
    queryFn:  () => userService.getLeaderboard({ period, skill, page, limit: 20 }).then(r => r.data),
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  const profiles   = data?.data        || [];
  const total      = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;
  const top3       = profiles.slice(0, 3);
  const rest       = profiles.slice(3);

  /* Real-time leaderboard update */
  useEffect(() => {
    const off = on('leaderboard:update', () => {
      setLiveUpdate(true);
      setLastUpdated(new Date());
      setTimeout(() => setLiveUpdate(false), 3000);
      qc.invalidateQueries(['leaderboard']);
    });
    return () => off?.();
  }, [on, qc]);

  /* Filter by search */
  const filtered = search.trim()
    ? profiles.filter(p => p.user?.name?.toLowerCase().includes(search.toLowerCase()))
    : profiles;

  const showPodium = page === 1 && !search && top3.length >= 3;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="text-center relative">
        {liveUpdate && (
          <div className="absolute top-0 right-0 flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Update
          </div>
        )}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-200">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display font-black text-3xl text-gray-900">Top Labourers</h1>
        <p className="text-gray-500 text-sm mt-1">
          {total > 0 ? `${total} workers ranked by performance` : 'Ranked by performance score'}
        </p>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400 mt-1">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* ── Weekly Winner ── */}
      <WeeklyWinnerBanner />

      {/* ── Your rank (if labour) ── */}
      {user?.role === 'labour' && total > 0 && (
        <YourRankCard userId={user._id} profiles={profiles} total={total} />
      )}

      {/* ── Filters ── */}
      <div className="space-y-2.5">
        {/* Period tabs */}
        <div className="flex rounded-2xl border border-gray-200 overflow-hidden bg-white p-1 gap-1">
          {PERIODS.map(p => {
            const Icon = p.icon;
            return (
              <button key={p.value}
                onClick={() => { setPeriod(p.value); setPage(1); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  period === p.value
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Skill filter + search */}
        <div className="flex gap-2">
          <select
            value={skill}
            onChange={e => { setSkill(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 outline-none focus:border-orange-400">
            <option value="">All Skills</option>
            {SKILLS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search worker…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          {isFetching && (
            <div className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center bg-white">
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-14 h-14 mx-auto mb-4 text-gray-200" />
          <p className="font-bold text-gray-500 text-lg">
            {search ? `No results for "${search}"` : 'No labourers ranked yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different name' : 'Complete jobs to appear on the leaderboard'}
          </p>
          {search && (
            <button onClick={() => setSearch('')}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Podium — top 3, page 1, no search */}
          {showPodium && <Podium profiles={top3} />}

          {/* Rows */}
          <div className="space-y-2.5">
            {(search ? filtered : (page === 1 ? profiles : profiles)).map(p => (
              <LeaderRow
                key={p._id}
                profile={p}
                isCurrentUser={p.user?._id === user?._id}
                prevRank={null}
              />
            ))}
          </div>

          {/* Pagination */}
          {!search && totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); window.scrollTo(0,0); }} />
          )}
        </>
      )}

      {/* ── Legend ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Score Formula</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-2">
            <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Rating × <strong>40</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-2">
            <Briefcase className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>Jobs × <strong>2</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 rounded-xl p-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span>Completion × <strong>20</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 rounded-xl p-2">
            <Zap className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <span>Response × <strong>10</strong></span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-3">
          Trust Score = Rating (40%) + Completion (35%) + Verified (15%) + Activity (10%)
        </p>
      </div>

    </div>
  );
};

export default LeaderboardPage;