import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, MessageCircle, Briefcase, Star,
  Shield, Clock, Award, ChevronDown, ChevronUp,
  ExternalLink, IndianRupee, Users, Quote, Zap,
  TrendingUp, Crown, CheckCircle, Target, Sparkles,
  Calendar, Trophy, ThumbsUp
} from 'lucide-react';
import userService   from '@/services/userService';
import ratingService from '@/services/ratingService';
import chatService   from '@/services/chatService';
import jobService    from '@/services/jobService';
import { RatingStars } from '@/components/common/UIComponents';
import BadgeChip, { BadgeList, BADGE_CONFIG } from '@/components/common/BadgeChip';
import RatingModal   from '@/components/common/RatingModal';
import Navbar        from '@/components/layout/Navbar';
import { formatCurrency, timeAgo, formatDate } from '@/utils/helpers';
import { useAuth }   from '@/context/AuthContext';
import toast         from 'react-hot-toast';

/* ── Level config ──────────────────────────────────────────────────────────── */
const LEVEL_NAMES = [
  '', 'Beginner', 'Apprentice', 'Skilled', 'Proficient',
  'Expert', 'Master', 'Elite', 'Legend', 'Champion', 'Grand Master',
];
const LEVEL_COLORS = [
  '', 'bg-gray-100 text-gray-600', 'bg-green-100 text-green-700',
  'bg-teal-100 text-teal-700', 'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700', 'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-800', 'bg-yellow-100 text-yellow-800',
];

/* ── Trust Score Ring ──────────────────────────────────────────────────────── */
const TrustRing = ({ score = 0 }) => {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Fair';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: 72, height: 72 }}>
        <svg width={72} height={72} viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black" style={{ color }}>{score}</span>
          <span className="text-[8px] text-gray-400 font-semibold">TRUST</span>
        </div>
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
    </div>
  );
};

/* ── XP Progress Bar ───────────────────────────────────────────────────────── */
const XPBar = ({ level = 1, levelProgress = 0, points = 0, nextLevelPoints = 200 }) => {
  const cls = LEVEL_COLORS[level] || LEVEL_COLORS[1];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${cls} flex items-center gap-1`}>
          <Sparkles className="w-3 h-3" /> Lv.{level} · {LEVEL_NAMES[level] || 'Expert'}
        </span>
        <span className="text-[10px] text-gray-400 font-medium">{points} / {nextLevelPoints} XP</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-1000"
          style={{ width: `${Math.min(100, levelProgress)}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400">
        {nextLevelPoints - points > 0
          ? `${nextLevelPoints - points} XP to reach ${LEVEL_NAMES[Math.min(level + 1, 10)] || 'Max'}`
          : 'Max level reached! 🎉'}
      </p>
    </div>
  );
};

/* ── Badge Progress Card ───────────────────────────────────────────────────── */
const BadgeProgressCard = ({ item }) => {
  const cfg = BADGE_CONFIG[item.badge];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${cfg.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800">{item.label}</p>
          <p className="text-[10px] text-gray-400">{item.overallPct}% complete</p>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
          {item.overallPct}%
        </span>
      </div>
      {/* Overall progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all duration-700 ${cfg.bg.replace('bg-', 'bg-').replace('-100', '-400')}`}
          style={{ width: `${item.overallPct}%` }} />
      </div>
      {/* Sub-items */}
      <div className="space-y-1.5">
        {item.items.map((sub, i) => (
          <div key={i} className="flex items-center gap-2">
            {sub.done
              ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
              : <div className="w-3 h-3 rounded-full border-2 border-gray-300 flex-shrink-0" />
            }
            <span className={`text-[10px] flex-1 ${sub.done ? 'text-green-700 font-semibold line-through' : 'text-gray-500'}`}>
              {sub.label}
            </span>
            <span className="text-[10px] font-bold text-gray-600 flex-shrink-0">
              {sub.current} / {sub.target}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Achievement timeline entry ────────────────────────────────────────────── */
const AchievementEntry = ({ entry }) => {
  const cfg = BADGE_CONFIG[entry.type];
  const Icon = cfg?.icon || Trophy;
  const bg   = cfg?.bg   || 'bg-orange-100';
  const text = cfg?.text || 'text-orange-700';

  return (
    <div className="flex items-start gap-3 group">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 mt-0.5 ring-2 ring-white`}>
        <Icon className={`w-4 h-4 ${text}`} />
      </div>
      <div className="flex-1 min-w-0 pb-4 border-b border-gray-100 last:border-0">
        <p className="text-sm font-bold text-gray-900">{entry.label}</p>
        {entry.description && (
          <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
        )}
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {entry.earnedAt ? formatDate(entry.earnedAt, 'dd MMM yyyy') : 'Recently'}
        </p>
      </div>
    </div>
  );
};

/* ── Rating bar ────────────────────────────────────────────────────────────── */
const RatingBar = ({ label, value }) => {
  if (!value) return null;
  const pct = (value / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-amber-600 w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
};

/* ── Review card ───────────────────────────────────────────────────────────── */
const ReviewCard = ({ r }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 mb-3">
        <img
          src={r.ratedBy?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.ratedBy?.name||'C')}&background=f97316&color=fff&size=40`}
          alt={r.ratedBy?.name}
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{r.ratedBy?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(r.createdAt)}</p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= r.overallRating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
              ))}
            </div>
          </div>
          {r.job?.title && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 mt-1">
              <Briefcase style={{width:10,height:10}} />{r.job.title}
            </span>
          )}
        </div>
      </div>
      {r.review && (
        <div className="bg-gray-50 rounded-xl px-3.5 py-2.5 relative">
          <Quote className="w-3 h-3 text-gray-300 absolute top-2 left-2" />
          <p className={`text-sm text-gray-600 leading-relaxed pl-3 ${expanded ? '' : 'line-clamp-3'}`}>
            {r.review}
          </p>
          {r.review.length > 120 && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs text-orange-500 font-semibold mt-1 hover:underline flex items-center gap-0.5">
              {expanded
                ? <><ChevronUp style={{width:12,height:12}}/> Less</>
                : <><ChevronDown style={{width:12,height:12}}/> Read more</>}
            </button>
          )}
        </div>
      )}
      {(r.workQuality || r.punctuality || r.behaviour || r.communication) && (
        <div className="mt-3 space-y-1.5">
          <RatingBar label="Work Quality"  value={r.workQuality}   />
          <RatingBar label="Punctuality"   value={r.punctuality}   />
          <RatingBar label="Behaviour"     value={r.behaviour}     />
          <RatingBar label="Communication" value={r.communication} />
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const LabourerProfilePage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const { user, isClient, isAuthenticated } = useAuth();

  const [ratingModal, setRatingModal] = useState(null);
  const [showAllRev,  setShowAllRev]  = useState(false);
  const [activeTab,   setActiveTab]   = useState('overview'); // overview | badges | timeline

  /* ── Data fetching ─────────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['labour-profile', id],
    queryFn:  () => userService.getLabourPublicProfile(id).then(r => r.data.data),
  });

  const { data: ratingsData } = useQuery({
    queryKey: ['ratings', id],
    queryFn:  () => ratingService.getUserRatings(id, { type: 'client_to_labour', limit: 20 }).then(r => r.data),
  });

  const { data: badgeData } = useQuery({
    queryKey: ['badges', id],
    queryFn:  () => userService.getUserBadges(id).then(r => r.data.data),
  });

  const { data: completedJobs } = useQuery({
    queryKey: ['completed-jobs-with-labour', id],
    queryFn:  () => jobService.getMyPostings({ status: 'completed', limit: 20 }).then(r => r.data.data),
    enabled:  isClient && !!user,
  });

  /* ── Chat mutation ─────────────────────────────────────────────────────── */
  const chatMut = useMutation({
    mutationFn: () => chatService.getOrCreateConversation({ participantId: id }),
    onSuccess:  (res) => navigate(`/client/chat/${res.data.data._id}`),
    onError:    (err) => toast.error(err.message),
  });

  /* ── Loading ───────────────────────────────────────────────────────────── */
  if (isLoading) return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-20" />
        <div className="bg-white rounded-3xl h-64" />
        {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl" />)}
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Worker profile not found.</p>
        <button onClick={() => navigate(-1)} className="btn-outline btn">← Go Back</button>
      </div>
    </div>
  );

  const profile     = data.labourProfile || {};
  const ratings     = ratingsData?.data   || [];
  const showRatings = showAllRev ? ratings : ratings.slice(0, 3);
  const isOwnProfile= user?._id?.toString() === id?.toString();

  const rateableJob  = completedJobs?.find(j =>
    j.hiredLabourers?.some(h => h.labour?.toString() === id || h.labour?._id?.toString() === id)
  );
  const alreadyRated = ratings.some(r => r.ratedBy?._id?.toString() === user?._id?.toString());

  /* Badge data from leaderboard endpoint */
  const level         = badgeData?.level         || profile.level         || 1;
  const levelProgress = badgeData?.levelProgress || 0;
  const points        = badgeData?.points        || profile.points        || 0;
  const nextLevelPts  = badgeData?.nextLevelPoints || 200;
  const trustScore    = badgeData?.trustScore    || profile.trustScore    || 0;
  const badgeProgress = badgeData?.badgeProgress || [];
  const timeline      = badgeData?.achievementTimeline || [];
  const badges        = badgeData?.badges        || profile.badges        || [];

  /* Average breakdown */
  const avgBreakdown = ratings.length > 0 ? {
    workQuality:   (ratings.filter(r=>r.workQuality).reduce((s,r)=>s+r.workQuality,0)   / (ratings.filter(r=>r.workQuality).length   || 1)) || 0,
    punctuality:   (ratings.filter(r=>r.punctuality).reduce((s,r)=>s+r.punctuality,0)   / (ratings.filter(r=>r.punctuality).length   || 1)) || 0,
    behaviour:     (ratings.filter(r=>r.behaviour).reduce((s,r)=>s+r.behaviour,0)       / (ratings.filter(r=>r.behaviour).length     || 1)) || 0,
    communication: (ratings.filter(r=>r.communication).reduce((s,r)=>s+r.communication,0) / (ratings.filter(r=>r.communication).length || 1)) || 0,
  } : null;

  const TABS = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'badges',    label: `Badges${badges.length > 0 ? ` (${badges.length})` : ''}` },
    { key: 'timeline',  label: 'Timeline'  },
    { key: 'reviews',   label: `Reviews${ratings.length > 0 ? ` (${ratings.length})` : ''}` },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fade-in">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* ── HERO CARD ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 80% 50%,#fff,transparent 60%)' }} />
            {/* Level badge on banner */}
            <div className="absolute top-3 right-4">
              <span className={`text-xs font-black px-3 py-1 rounded-full ${LEVEL_COLORS[level] || LEVEL_COLORS[1]} shadow-sm flex items-center gap-1`}>
                <Sparkles className="w-3 h-3" /> Lv.{level} · {LEVEL_NAMES[level]}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-14 mb-4">
              <div className="relative">
                <img
                  src={data.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name||'U')}&background=f97316&color=fff&size=96`}
                  alt={data.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl"
                />
                {data.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                {profile.isAvailable && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white animate-pulse" />
                )}
              </div>

              {/* Trust ring + action buttons */}
              <div className="flex items-end gap-3 pb-1">
                {trustScore > 0 && <TrustRing score={trustScore} />}
                {!isOwnProfile && (
                  <div className="flex flex-col gap-2">
                    {isClient && (
                      <button onClick={() => chatMut.mutate()} disabled={chatMut.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-200 disabled:opacity-60">
                        <MessageCircle className="w-4 h-4" />
                        {chatMut.isPending ? 'Opening…' : 'Message'}
                      </button>
                    )}
                    {isClient && rateableJob && !alreadyRated && (
                      <button onClick={() => setRatingModal({ job: rateableJob, ratedUser: { _id: id, name: data.name, avatar: data.avatar, role: 'labour' } })}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-amber-300 text-amber-700 bg-amber-50 text-sm font-bold hover:bg-amber-100 transition-all">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Rate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Name + status */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display font-bold text-2xl text-gray-900">{data.name}</h1>
              {data.isVerified && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
              {profile.isAvailable
                ? <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Available</span>
                : <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Unavailable</span>
              }
            </div>

            {/* Location */}
            {data.location?.city && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {data.location.city}{data.location.state ? `, ${data.location.state}` : ''}
              </p>
            )}

            {/* Rating row */}
            {profile.averageRating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(profile.averageRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <span className="font-bold text-amber-600">{profile.averageRating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({profile.totalRatings || 0} review{profile.totalRatings !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Badges row */}
            {badges.length > 0 && (
              <BadgeList badges={badges} max={4} size="md" className="mb-4" />
            )}

            {/* XP progress bar */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <XPBar level={level} levelProgress={levelProgress} points={points} nextLevelPoints={nextLevelPts} />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100">
              {[
                { icon: Briefcase,  label: 'Jobs',       value: profile.completedJobs || 0 },
                { icon: Clock,      label: 'Experience',  value: `${profile.experience || 0}y` },
                { icon: Target,     label: 'Completion',  value: `${profile.completionRate || 0}%` },
                { icon: Users,      label: 'Radius',      value: `${profile.workingRadius || 20}km` },
              ].map(s => (
                <div key={s.label} className="text-center py-2 px-1 rounded-xl hover:bg-gray-50 transition-colors">
                  <s.icon className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                  <p className="font-display font-bold text-gray-900 text-sm">{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1">
          {TABS.map(t => (
            <button key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Bio */}
            {profile.bio && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-orange-400" /> About
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {(profile.skills || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(s => (
                    <span key={s.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
                      {s.name}
                      {s.yearsOfExp > 0 && <span className="opacity-60">· {s.yearsOfExp}y</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Work details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Work Details</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: IndianRupee, label: 'Daily Wage', value: (profile.dailyWageMin && profile.dailyWageMax) ? `₹${profile.dailyWageMin}–₹${profile.dailyWageMax}` : '—' },
                  { icon: Clock, label: 'Preferred Shift', value: profile.preferredShift ? profile.preferredShift.charAt(0).toUpperCase() + profile.preferredShift.slice(1) : '—' },
                  { icon: MapPin, label: 'Working Radius', value: `${profile.workingRadius || 20} km` },
                  { icon: Briefcase, label: 'Experience', value: `${profile.experience || 0} yr${profile.experience !== 1 ? 's' : ''}` },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">{item.label}</p>
                      <p className="text-sm font-bold text-gray-800">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            {(profile.portfolioImages || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 mb-3">Portfolio</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {profile.portfolioImages.map(img => (
                    <a key={img._id} href={img.url} target="_blank" rel="noreferrer"
                      className="group aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                      <img src={img.url} alt={img.caption || 'Work'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BADGES TAB */}
        {activeTab === 'badges' && (
          <div className="space-y-4">
            {/* Earned badges */}
            {badges.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-400" /> Earned Badges
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map(b => {
                    const cfg = BADGE_CONFIG[b.type];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                      <div key={b.type} className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${cfg.bg} ${cfg.border}`}>
                        <div className={`w-11 h-11 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <Icon className={`w-5 h-5 ${cfg.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{cfg.label in BADGE_CONFIG ? `Earned ${b.awardedAt ? formatDate(b.awardedAt, 'dd MMM yyyy') : 'recently'}` : ''}</p>
                        </div>
                        <CheckCircle className={`w-5 h-5 ${cfg.text} flex-shrink-0`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Badge progress */}
            {badgeProgress.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-400" /> In Progress
                </h2>
                <div className="space-y-3">
                  {badgeProgress.map(item => (
                    <BadgeProgressCard key={item.badge} item={item} />
                  ))}
                </div>
              </div>
            )}

            {badges.length === 0 && badgeProgress.length === 0 && (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">No badges yet</p>
                <p className="text-sm text-gray-400 mt-1">Complete jobs and get rated to earn badges</p>
              </div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-400" /> Achievement Timeline
            </h2>
            {timeline.length > 0 ? (
              <div className="space-y-1">
                {timeline.map((entry, i) => (
                  <AchievementEntry key={i} entry={entry} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Trophy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No achievements yet</p>
                <p className="text-xs text-gray-400 mt-1">Milestones appear here as the worker grows</p>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Reviews
                {ratings.length > 0 && <span className="text-sm font-normal text-gray-400">({ratings.length})</span>}
              </h2>
              {profile.averageRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-2xl text-amber-500">{profile.averageRating.toFixed(1)}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(profile.averageRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400">{ratings.length} ratings</span>
                  </div>
                </div>
              )}
            </div>

            {avgBreakdown && (avgBreakdown.workQuality > 0 || avgBreakdown.punctuality > 0) && (
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-2">
                <RatingBar label="Work Quality"  value={avgBreakdown.workQuality   || 0} />
                <RatingBar label="Punctuality"   value={avgBreakdown.punctuality   || 0} />
                <RatingBar label="Behaviour"     value={avgBreakdown.behaviour     || 0} />
                <RatingBar label="Communication" value={avgBreakdown.communication || 0} />
              </div>
            )}

            <div className="p-4 space-y-3">
              {showRatings.length > 0 ? (
                <>
                  {showRatings.map(r => <ReviewCard key={r._id} r={r} />)}
                  {ratings.length > 3 && (
                    <button onClick={() => setShowAllRev(!showAllRev)}
                      className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all flex items-center justify-center gap-2">
                      {showAllRev
                        ? <><ChevronUp className="w-4 h-4" /> Show Less</>
                        : <><ChevronDown className="w-4 h-4" /> Show All {ratings.length} Reviews</>}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-8 h-8 text-gray-200 fill-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No reviews yet</p>
                  <p className="text-xs text-gray-400 mt-1">Reviews appear here after completed jobs</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      {ratingModal && (
        <RatingModal
          job={ratingModal.job}
          ratedUser={ratingModal.ratedUser}
          onClose={() => setRatingModal(null)}
          onSuccess={() => {
            qc.invalidateQueries(['ratings', id]);
            qc.invalidateQueries(['labour-profile', id]);
            qc.invalidateQueries(['badges', id]);
            setRatingModal(null);
            toast.success('Rating submitted!');
          }}
        />
      )}
    </div>
  );
};

export default LabourerProfilePage;