/**
 * BadgeToast — animated popup when a badge is earned or level-up occurs.
 * Rendered as a custom toast via react-hot-toast.
 */
import { useEffect, useState } from 'react';
import { Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BADGE_CONFIG } from '@/components/common/BadgeChip';

/* ── Badge earned toast ────────────────────────────────────────────────────── */
export const BadgeEarnedToast = ({ badges = [], score, level, levelName, userId }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const first = badges[0];
  const cfg   = first ? BADGE_CONFIG[first.type] : null;
  const Icon  = cfg?.icon || Trophy;

  return (
    <div className={`flex items-center gap-4 min-w-[280px] max-w-sm transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${cfg ? cfg.bg : 'bg-amber-100'} border-2 ${cfg ? cfg.border : 'border-amber-200'}`}>
        <Icon className={`w-7 h-7 ${cfg ? cfg.text : 'text-amber-600'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-xs font-black text-amber-600 uppercase tracking-wide">Badge Earned!</p>
        </div>
        <p className="font-bold text-gray-900 text-sm truncate">
          {badges.length === 1
            ? cfg?.label || first?.type
            : `${badges.length} new badges!`}
        </p>
        {badges.length === 1 && cfg && (
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{BADGE_CONFIG[first.type]?.label}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-400 font-medium">{score} pts · Lv.{level} {levelName}</span>
        </div>
      </div>
    </div>
  );
};

/* ── Level up toast ────────────────────────────────────────────────────────── */
export const LevelUpToast = ({ level, levelName }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const LEVEL_COLORS = [
    '', 'bg-gray-100', 'bg-green-100', 'bg-teal-100', 'bg-blue-100',
    'bg-indigo-100', 'bg-purple-100', 'bg-pink-100', 'bg-orange-100',
    'bg-amber-100', 'bg-yellow-100',
  ];
  const LEVEL_TEXT = [
    '', 'text-gray-600', 'text-green-700', 'text-teal-700', 'text-blue-700',
    'text-indigo-700', 'text-purple-700', 'text-pink-700', 'text-orange-700',
    'text-amber-800', 'text-yellow-800',
  ];

  const bg   = LEVEL_COLORS[level] || 'bg-orange-100';
  const text = LEVEL_TEXT[level]   || 'text-orange-700';

  return (
    <div className={`flex items-center gap-4 min-w-[280px] transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <span className="text-2xl">⬆️</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <p className="text-xs font-black text-purple-600 uppercase tracking-wide">Level Up!</p>
        </div>
        <p className="font-bold text-gray-900 text-sm">
          Level {level} Reached!
        </p>
        <p className={`text-sm font-black ${text}`}>{levelName}</p>
      </div>
    </div>
  );
};

/* ── Hook: listen for badge events and fire toasts ─────────────────────────── */
export const useBadgeToasts = (socket, userId) => {
  useEffect(() => {
    if (!socket || !userId) return;

    const onBadgeEarned = ({ badges, score, trustScore, level, levelName, points }) => {
      if (!badges?.length) return;

      // Rich badge toast
      const { toast } = require('react-hot-toast');
      toast.custom(
        (t) => (
          <div className={`bg-white rounded-2xl shadow-2xl border-2 border-amber-200 px-4 py-3 transition-all duration-300 ${t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <BadgeEarnedToast
              badges={badges}
              score={score}
              level={level}
              levelName={levelName}
              userId={userId}
            />
          </div>
        ),
        { duration: 6000, position: 'top-right' }
      );
    };

    const onLevelUp = ({ level, levelName, points }) => {
      const { toast } = require('react-hot-toast');
      toast.custom(
        (t) => (
          <div className={`bg-white rounded-2xl shadow-2xl border-2 border-purple-200 px-4 py-3 transition-all duration-300 ${t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <LevelUpToast level={level} levelName={levelName} />
          </div>
        ),
        { duration: 7000, position: 'top-right' }
      );
    };

    socket.on('badge:earned', onBadgeEarned);
    socket.on('level:up',     onLevelUp);

    return () => {
      socket.off('badge:earned', onBadgeEarned);
      socket.off('level:up',     onLevelUp);
    };
  }, [socket, userId]);
};