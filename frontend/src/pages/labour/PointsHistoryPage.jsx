/**
 * PointsHistoryPage — shows a labour worker their full XP and achievement history.
 * Route: /labour/points
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Trophy, Star, Briefcase, Shield, Award,
  Sparkles, TrendingUp, Crown, CheckCircle,
  ChevronRight, ArrowLeft, Zap, Target
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import userService from '@/services/userService';
import { BadgeList, BADGE_CONFIG } from '@/components/common/BadgeChip';
import { formatDate } from '@/utils/helpers';

const LEVEL_NAMES = [
  '','Beginner','Apprentice','Skilled','Proficient',
  'Expert','Master','Elite','Legend','Champion','Grand Master',
];
const LEVEL_GRADIENT = [
  '','from-gray-400 to-gray-500','from-green-400 to-emerald-500',
  'from-teal-400 to-cyan-500','from-blue-400 to-indigo-500',
  'from-indigo-400 to-purple-500','from-purple-400 to-fuchsia-500',
  'from-pink-400 to-rose-500','from-orange-400 to-red-500',
  'from-amber-400 to-orange-500','from-yellow-300 to-amber-500',
];

const LEVEL_THRESHOLDS = [0,200,500,1000,2000,3500,5500,8000,12000,18000,Infinity];

/* ── XP sources breakdown ──────────────────────────────────────────────────── */
const XP_SOURCES = [
  { icon: Briefcase,   label: 'Per completed job',         xp: 50,  color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { icon: Star,        label: 'Per 5★ rating received',    xp: 100, color: 'text-amber-600',  bg: 'bg-amber-50'  },
  { icon: CheckCircle, label: 'Per rating received',        xp: 10,  color: 'text-teal-600',   bg: 'bg-teal-50'   },
  { icon: Shield,      label: 'Aadhaar verified',           xp: 200, color: 'text-blue-700',   bg: 'bg-blue-50'   },
  { icon: Award,       label: 'Per badge earned',           xp: 75,  color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: CheckCircle, label: '95%+ completion rate bonus', xp: 100, color: 'text-green-600',  bg: 'bg-green-50'  },
];

/* ── Timeline icon resolver ────────────────────────────────────────────────── */
const getTimelineIcon = (type) => {
  if (type?.startsWith('level_')) return { icon: Sparkles, bg: 'bg-purple-100', text: 'text-purple-700' };
  if (type === 'verified')        return { icon: Shield,   bg: 'bg-blue-100',   text: 'text-blue-700'   };
  if (type === 'first_job')       return { icon: Briefcase,bg: 'bg-orange-100', text: 'text-orange-700' };
  if (type?.startsWith('job_'))   return { icon: Trophy,   bg: 'bg-amber-100',  text: 'text-amber-700'  };
  const cfg = BADGE_CONFIG[type];
  if (cfg) return { icon: cfg.icon, bg: cfg.bg, text: cfg.text };
  return { icon: Award, bg: 'bg-gray-100', text: 'text-gray-600' };
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
const PointsHistoryPage = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['badges', user?._id],
    queryFn:  () => userService.getUserBadges(user._id).then(r => r.data.data),
    enabled:  !!user?._id,
  });

  const level         = data?.level         || 1;
  const points        = data?.points        || 0;
  const levelProgress = data?.levelProgress || 0;
  const nextLevelPts  = data?.nextLevelPoints|| 200;
  const trustScore    = data?.trustScore    || 0;
  const badges        = data?.badges        || [];
  const timeline      = data?.achievementTimeline || [];
  const prevLevelPts  = LEVEL_THRESHOLDS[Math.max(level - 1, 0)];
  const gradient      = LEVEL_GRADIENT[level] || 'from-orange-400 to-amber-500';

  const trustColor = trustScore >= 80 ? '#10b981' : trustScore >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

      {/* Back */}
      <Link to="/labour" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      {/* ── Hero XP Card ─────────────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-6 text-white shadow-xl overflow-hidden relative`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%,#fff,transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Your Level</p>
              <p className="font-display font-black text-5xl">{level}</p>
              <p className="font-bold text-xl text-white/90 mt-0.5">{LEVEL_NAMES[level]}</p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-white/70 text-xs">Trust Score</p>
              <p className="font-black text-2xl" style={{ color: trustColor === '#10b981' ? '#d1fae5' : trustColor === '#f59e0b' ? '#fef3c7' : '#fee2e2' }}>
                {trustScore}%
              </p>
            </div>
          </div>

          {/* XP bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80 font-semibold">{points} XP</span>
              <span className="text-white/60">{nextLevelPts < Infinity ? `${nextLevelPts} XP for Lv.${level + 1}` : 'Max Level!'}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${Math.min(100, levelProgress)}%` }}
              />
            </div>
            <p className="text-white/60 text-xs">
              {nextLevelPts < Infinity
                ? `${nextLevelPts - points} XP needed · ${LEVEL_NAMES[Math.min(level + 1, 10)]} next`
                : '🏆 Grand Master achieved!'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Trophy,     label: 'Total XP',    value: points,        color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { icon: Award,      label: 'Badges',      value: badges.length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Target,     label: 'Trust Score', value: `${trustScore}%`, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
            <p className={`font-display font-black text-xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Earned Badges ────────────────────────────────────────────────────── */}
      {badges.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-400" /> Earned Badges
            </h2>
            <span className="text-xs font-bold text-gray-400">{badges.length} total</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map(b => {
              const cfg = BADGE_CONFIG[b.type];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <div key={b.type} className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 ${cfg.bg} ${cfg.border}`}>
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon className={`w-5 h-5 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
                    <p className="text-[10px] text-gray-400">
                      {b.awardedAt ? `Earned ${formatDate(b.awardedAt, 'dd MMM yyyy')}` : 'Recently earned'}
                    </p>
                  </div>
                  <CheckCircle className={`w-4 h-4 ${cfg.text} flex-shrink-0`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── How XP is earned ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" /> How XP is Earned
        </h2>
        <div className="space-y-2.5">
          {XP_SOURCES.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${s.bg}`}>
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="flex-1 text-sm text-gray-700 font-medium">{s.label}</p>
              <span className={`text-sm font-black ${s.color} flex-shrink-0`}>+{s.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Level roadmap ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" /> Level Roadmap
        </h2>
        <div className="space-y-2">
          {LEVEL_NAMES.slice(1).map((name, i) => {
            const lvl  = i + 1;
            const xp   = LEVEL_THRESHOLDS[i];
            const done = lvl <= level;
            const current = lvl === level;
            return (
              <div key={lvl}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  current  ? 'bg-orange-50 border-2 border-orange-300' :
                  done     ? 'bg-green-50 border border-green-100'     :
                             'bg-gray-50 border border-gray-100 opacity-60'
                }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                  current ? 'bg-orange-500 text-white' :
                  done    ? 'bg-green-500 text-white'  :
                            'bg-gray-200 text-gray-500'
                }`}>
                  {done ? '✓' : lvl}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${current ? 'text-orange-700' : done ? 'text-green-700' : 'text-gray-500'}`}>
                    Level {lvl} — {name}
                    {current && <span className="ml-2 text-[10px] bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full">YOU ARE HERE</span>}
                  </p>
                </div>
                <span className={`text-xs font-bold flex-shrink-0 ${done ? 'text-green-600' : 'text-gray-400'}`}>
                  {xp === 0 ? 'Start' : `${xp} XP`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Achievement Timeline ──────────────────────────────────────────────── */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" /> Achievement Timeline
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-1">
              {timeline.map((entry, i) => {
                const { icon: Icon, bg, text } = getTimelineIcon(entry.type);
                return (
                  <div key={i} className="flex items-start gap-4 pl-1 pb-4 relative">
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 relative z-10 ring-2 ring-white`}>
                      <Icon className={`w-4 h-4 ${text}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-bold text-gray-900">{entry.label}</p>
                      {entry.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {entry.earnedAt ? formatDate(entry.earnedAt, 'dd MMM yyyy') : 'Recently'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard CTA ──────────────────────────────────────────────────── */}
      <Link to="/labour/leaderboard"
        className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white shadow-lg shadow-orange-200 hover:shadow-xl transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold">See Your Rank</p>
            <p className="text-white/70 text-xs">Compare with top workers</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
      </Link>

      <div className="h-4" />
    </div>
  );
};

export default PointsHistoryPage;