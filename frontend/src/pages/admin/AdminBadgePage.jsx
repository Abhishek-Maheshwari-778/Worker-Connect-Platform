import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Trophy, Shield, Star, Zap, CheckCircle, Award,
  TrendingUp, Crown, RefreshCw, Loader2, AlertTriangle,
  Users, BarChart2, Flag, Trash2, ChevronRight, Target
} from 'lucide-react';
import adminService from '@/services/adminService';
import Avatar from '@/components/common/Avatar';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const BADGE_ICONS = {
  verified:           { icon: Shield,      color: 'text-blue-600',   bg: 'bg-blue-100',    border: 'border-blue-200'   },
  top_rated:          { icon: Star,        color: 'text-amber-600',  bg: 'bg-amber-100',   border: 'border-amber-200'  },
  fast_responder:     { icon: Zap,         color: 'text-green-600',  bg: 'bg-green-100',   border: 'border-green-200'  },
  reliable_worker:    { icon: CheckCircle, color: 'text-teal-600',   bg: 'bg-teal-100',    border: 'border-teal-200'   },
  highly_experienced: { icon: Award,       color: 'text-purple-600', bg: 'bg-purple-100',  border: 'border-purple-200' },
  rising_star:        { icon: TrendingUp,  color: 'text-orange-600', bg: 'bg-orange-100',  border: 'border-orange-200' },
  premium_labour:     { icon: Crown,       color: 'text-yellow-700', bg: 'bg-yellow-100',  border: 'border-yellow-200' },
};

const LEVEL_COLORS = ['','bg-gray-200','bg-green-200','bg-teal-200','bg-blue-200','bg-indigo-200','bg-purple-200','bg-pink-200','bg-orange-200','bg-amber-200','bg-yellow-200'];
const LEVEL_NAMES  = ['','Beginner','Apprentice','Skilled','Proficient','Expert','Master','Elite','Legend','Champion','Grand Master'];

/* ── Stat Card ─────────────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color = 'text-orange-600', bg = 'bg-orange-50' }) => (
  <div className={`${bg} rounded-2xl border border-gray-100 p-4`}>
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
    </div>
    <p className={`text-2xl font-display font-black ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

/* ── Badge Distribution Row ────────────────────────────────────────────────── */
const BadgeRow = ({ item, total }) => {
  const cfg = BADGE_ICONS[item.badge] || {};
  const Icon = cfg.icon || Award;
  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-9 h-9 rounded-xl ${cfg.bg || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${cfg.color || 'text-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
          <span className="text-xs font-bold text-gray-600">{item.count} workers ({pct}%)</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${cfg.bg?.replace('bg-', 'bg-').replace('-100', '-400') || 'bg-orange-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/* ── Flagged Rating Row ────────────────────────────────────────────────────── */
const FlaggedRow = ({ rating, onUnflag, onDelete }) => (
  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <p className="text-sm font-bold text-gray-900">{rating.ratedBy?.name}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          🚩 {rating.flagReason?.replace(/_/g, ' ')}
        </span>
        <span className="text-[10px] text-gray-400">→ rated {rating.ratedUser?.name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{'⭐'.repeat(rating.overallRating)} {rating.overallRating}/5</span>
        <span>{rating.job?.title}</span>
        <span>{formatDate(rating.createdAt, 'dd MMM yyyy')}</span>
      </div>
      {rating.review && (
        <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">"{rating.review}"</p>
      )}
    </div>
    <div className="flex flex-col gap-1.5 flex-shrink-0">
      <button onClick={() => onUnflag(rating._id)}
        className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors">
        ✓ Allow
      </button>
      <button onClick={() => onDelete(rating._id)}
        className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">
        <Trash2 className="w-3 h-3 inline mr-1" />Delete
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const AdminBadgePage = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-badge-stats'],
    queryFn:  () => adminService.getBadgeStats().then(r => r.data.data),
    refetchInterval: 60000,
  });

  const { data: flaggedData } = useQuery({
    queryKey: ['admin-flagged-ratings'],
    queryFn:  () => adminService.getFlaggedRatings().then(r => r.data),
  });

  const recalcMut = useMutation({
    mutationFn: () => adminService.recalculateAllBadges(),
    onSuccess: (res) => {
      toast.success(`✅ Recalculated ${res.data.data.done} profiles`);
      qc.invalidateQueries(['admin-badge-stats']);
    },
    onError: () => toast.error('Recalculation failed'),
  });

  const unflagMut = useMutation({
    mutationFn: (id) => adminService.unflagRating(id),
    onSuccess: () => { toast.success('Rating cleared'); qc.invalidateQueries(['admin-flagged-ratings']); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminService.deleteFlaggedRating(id),
    onSuccess: () => { toast.success('Fraudulent rating deleted'); qc.invalidateQueries(['admin-flagged-ratings']); },
  });

  const flaggedRatings = flaggedData?.data || [];
  const totalProfiles  = stats?.totalProfiles || 0;

  const TABS = [
    { key: 'overview', label: 'Overview'                                        },
    { key: 'badges',   label: 'Badge Distribution'                             },
    { key: 'levels',   label: 'Level Distribution'                             },
    { key: 'fraud',    label: `Fraud${flaggedRatings.length > 0 ? ` (${flaggedRatings.length})` : ''}` },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Badge & Reputation Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor badge distribution, trust scores, and fraud protection.</p>
        </div>
        <button
          onClick={() => recalcMut.mutate()}
          disabled={recalcMut.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          {recalcMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Recalculate All Badges
        </button>
      </div>

      {/* Top stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users}       label="Total Workers"     value={totalProfiles}             sub="on platform"                   color="text-blue-600"   bg="bg-blue-50"   />
          <StatCard icon={Shield}      label="Verified Workers"  value={stats?.badgeDistribution?.find(b=>b.badge==='verified')?.count || 0} sub={`${stats?.badgeDistribution?.find(b=>b.badge==='verified')?.pct || 0}% of total`} color="text-green-600"  bg="bg-green-50"  />
          <StatCard icon={Target}      label="Avg Trust Score"   value={`${stats?.avgTrustScore || 0}%`} sub="platform average"           color="text-purple-600" bg="bg-purple-50" />
          <StatCard icon={Flag}        label="Flagged Ratings"   value={stats?.flaggedRatingsCount || 0} sub="pending review"              color="text-red-600"    bg="bg-red-50"    />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top scorers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Top 5 Scorers
            </h2>
            <div className="space-y-3">
              {(stats.topScorers || []).map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                    #{i + 1}
                  </span>
                  <img
                    src={p.user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.name||'U')}&background=f97316&color=fff&size=32`}
                    alt={p.user?.name}
                    className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.user?.name}</p>
                    <p className="text-xs text-gray-400">Lv.{p.level} · {p.completedJobs} jobs</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-orange-600">{p.score}</p>
                    <p className="text-[10px] text-gray-400">pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick badge summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-400" /> Badge Summary
            </h2>
            <div className="space-y-2.5">
              {(stats.badgeDistribution || []).map(item => {
                const cfg = BADGE_ICONS[item.badge] || {};
                const Icon = cfg.icon || Award;
                return (
                  <div key={item.badge} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg ${cfg.bg || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color || 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.bg?.replace('-100', '-400') || 'bg-orange-400'}`}
                          style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-600 flex-shrink-0 w-20 text-right">
                      {item.count} <span className="font-normal text-gray-400">({item.pct}%)</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Badge Distribution tab */}
      {activeTab === 'badges' && stats && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Badge Distribution — {totalProfiles} total workers</h2>
          <div className="divide-y divide-gray-50">
            {(stats.badgeDistribution || []).map(item => (
              <BadgeRow key={item.badge} item={item} total={totalProfiles} />
            ))}
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
            <p className="text-xs text-gray-500">
              <strong>{stats.unverifiedCount}</strong> workers ({Math.round((stats.unverifiedCount / totalProfiles) * 100)}%) have not yet verified their Aadhaar.
            </p>
          </div>
        </div>
      )}

      {/* Level Distribution tab */}
      {activeTab === 'levels' && stats && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Level Distribution</h2>
          <div className="space-y-3">
            {/* Deduplicate and fill all 10 levels */}
            {Array.from({ length: 10 }, (_, i) => {
              const lvl = i + 1;
              // Sum counts for same level (handles duplicate _id from aggregate)
              const count = (stats.levelDistribution || [])
                .filter(item => (item._id || 1) === lvl)
                .reduce((sum, item) => sum + (item.count || 0), 0);
              const pct = totalProfiles > 0 ? Math.round((count / totalProfiles) * 100) : 0;
              const bg  = LEVEL_COLORS[lvl] || 'bg-gray-200';
              return (
                <div key={`level-${lvl}`} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-bold text-gray-700 flex-shrink-0">
                    Lv.{lvl} {LEVEL_NAMES[lvl]}
                  </span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bg} transition-all duration-700`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-24 text-right flex-shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fraud tab */}
      {activeTab === 'fraud' && (
        <div className="space-y-3">
          {flaggedRatings.length > 0 ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-800">
                  {flaggedRatings.length} rating{flaggedRatings.length !== 1 ? 's' : ''} flagged as potentially fraudulent. Review and take action below.
                </p>
              </div>
              {flaggedRatings.map(r => (
                <FlaggedRow
                  key={r._id}
                  rating={r}
                  onUnflag={(id) => unflagMut.mutate(id)}
                  onDelete={(id) => deleteMut.mutate(id)}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-500">No flagged ratings</p>
              <p className="text-sm text-gray-400 mt-1">The anti-fraud system hasn't detected any suspicious activity.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBadgePage;