/**
 * LevelUpModal — Full-screen celebration when a worker levels up.
 * Triggered by socket event 'level:up'.
 * Also shows "New Badge Unlocked" celebration for badge:earned.
 */
import { useEffect, useState } from 'react';
import { X, Sparkles, Trophy, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import BadgeChip, { BADGE_CONFIG } from '@/components/common/BadgeChip';

const LEVEL_COLORS = [
  '','from-gray-400 to-gray-500',
  'from-green-400 to-emerald-500',
  'from-teal-400 to-cyan-500',
  'from-blue-400 to-indigo-500',
  'from-indigo-400 to-purple-500',
  'from-purple-400 to-fuchsia-500',
  'from-pink-400 to-rose-500',
  'from-orange-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-yellow-300 to-amber-500',
];

const LEVEL_NAMES = [
  '','Beginner','Apprentice','Skilled','Proficient',
  'Expert','Master','Elite','Legend','Champion','Grand Master',
];

/* ── Confetti particle ─────────────────────────────────────────────────────── */
const Particle = ({ delay, color, x }) => (
  <div
    className="absolute w-2 h-2 rounded-sm animate-bounce"
    style={{
      left: `${x}%`, top: '-8px',
      backgroundColor: color,
      animationDelay: `${delay}ms`,
      animationDuration: `${800 + Math.random() * 600}ms`,
    }}
  />
);

/* ── Level Up Modal ────────────────────────────────────────────────────────── */
export const LevelUpModal = ({ level, levelName, points, onClose }) => {
  const [visible, setVisible] = useState(false);
  const gradient = LEVEL_COLORS[level] || 'from-orange-400 to-amber-500';
  const COLORS = ['#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#ef4444'];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>

      {/* Confetti */}
      <div className="absolute inset-x-0 top-0 overflow-hidden h-40 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle key={i} delay={i * 80} color={COLORS[i % COLORS.length]} x={Math.random() * 100} />
        ))}
      </div>

      <div
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}
        onClick={e => e.stopPropagation()}>

        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${gradient} px-8 pt-10 pb-8 text-center relative`}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #fff, transparent 70%)' }} />
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-white/25 backdrop-blur flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-4xl">⬆️</span>
            </div>
            <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">Level Up!</p>
            <p className="text-white font-display font-black text-4xl mb-1">Level {level}</p>
            <p className="text-white/90 font-bold text-xl">{levelName}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 bg-amber-50 rounded-2xl px-4 py-3">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <p className="font-bold text-amber-800">{points} XP total</p>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">
            Amazing work! You've reached <strong>{levelName}</strong> level by completing jobs and earning great reviews.
          </p>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              Close
            </button>
            <Link to="/labour/leaderboard" onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md flex items-center justify-center gap-1.5">
              Leaderboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Badge Unlocked Modal ──────────────────────────────────────────────────── */
export const BadgeUnlockedModal = ({ badges = [], score, level, levelName, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [idx,     setIdx]     = useState(0);
  const badge = badges[idx];
  const cfg   = badge ? BADGE_CONFIG[badge.type] : null;
  const Icon  = cfg?.icon || Trophy;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const next = () => {
    if (idx < badges.length - 1) setIdx(i => i + 1);
    else onClose();
  };

  if (!badge || !cfg) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}>

      <div
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}
        onClick={e => e.stopPropagation()}>

        {/* Badge icon header */}
        <div className={`${cfg.bg} px-8 pt-10 pb-8 text-center border-b-2 ${cfg.border}`}>
          <div className={`w-24 h-24 rounded-3xl ${cfg.bg} border-4 ${cfg.border} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
            <Icon className={`w-12 h-12 ${cfg.text}`} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Badge Unlocked!</p>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className={`font-display font-black text-2xl ${cfg.text}`}>{cfg.label}</p>
          {badges.length > 1 && (
            <p className="text-gray-400 text-xs mt-1">{idx + 1} of {badges.length}</p>
          )}
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{cfg.label} badge has been added to your profile.</p>

          <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-2xl px-4 py-3">
            <div className="text-center">
              <p className="text-lg font-black text-orange-600">{score}</p>
              <p className="text-[10px] text-gray-400">Score</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-black text-purple-600">Lv.{level}</p>
              <p className="text-[10px] text-gray-400">{levelName}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              Dismiss
            </button>
            <button onClick={next}
              className={`flex-1 py-3 rounded-xl ${cfg.bg} border-2 ${cfg.border} ${cfg.text} text-sm font-bold transition-colors flex items-center justify-center gap-1.5`}>
              {idx < badges.length - 1 ? 'Next Badge' : 'View Profile'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Hook: listen and show modals ──────────────────────────────────────────── */
export const useGamificationModals = () => {
  const [levelUpData,  setLevelUpData]  = useState(null);
  const [badgeData,    setBadgeData]    = useState(null);
  const { socket }  = useSocket();
  const { user }    = useAuth();

  useEffect(() => {
    if (!socket || user?.role !== 'labour') return;

    const onLevelUp = (data) => setLevelUpData(data);
    const onBadge   = (data) => {
      if (data.badges?.length > 0) setBadgeData(data);
    };

    socket.on('level:up',    onLevelUp);
    socket.on('badge:earned', onBadge);
    return () => {
      socket.off('level:up',    onLevelUp);
      socket.off('badge:earned', onBadge);
    };
  }, [socket, user?.role]);

  const closeLevelUp = () => setLevelUpData(null);
  const closeBadge   = () => setBadgeData(null);

  return { levelUpData, badgeData, closeLevelUp, closeBadge };
};