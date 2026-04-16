import { Shield, Star, Zap, CheckCircle, Award, TrendingUp, Crown } from 'lucide-react';

export const BADGE_CONFIG = {
  verified:           { label: 'Verified',            icon: Shield,       bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',   glow: 'shadow-blue-200'   },
  top_rated:          { label: 'Top Rated',            icon: Star,         bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',  glow: 'shadow-amber-200'  },
  fast_responder:     { label: 'Fast Responder',       icon: Zap,          bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-200',  glow: 'shadow-green-200'  },
  reliable_worker:    { label: 'Reliable Worker',      icon: CheckCircle,  bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200',   glow: 'shadow-teal-200'   },
  highly_experienced: { label: 'Highly Experienced',   icon: Award,        bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200', glow: 'shadow-purple-200' },
  rising_star:        { label: 'Rising Star',          icon: TrendingUp,   bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200', glow: 'shadow-orange-200' },
  premium_labour:     { label: 'Premium Labour',       icon: Crown,        bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-300', glow: 'shadow-yellow-200' },
};

export const BADGE_TOOLTIPS = {
  verified:           'Aadhaar identity verified by admin',
  top_rated:          'Average rating ≥ 4.5 with 10+ reviews',
  fast_responder:     'Responds to job offers within 5 minutes',
  reliable_worker:    'Completes 90%+ of accepted jobs',
  highly_experienced: 'Completed 50+ jobs on Labour Connect',
  rising_star:        'Rating ≥ 4.7 in first 10 jobs',
  premium_labour:     'Elite: High rating + 30 jobs + 95% completion + verified',
};

/**
 * BadgeChip — pill badge with icon, label, tooltip
 * size: 'sm' | 'md' | 'lg'
 */
const BadgeChip = ({ type, size = 'md', showLabel = true, className = '' }) => {
  const cfg = BADGE_CONFIG[type];
  if (!cfg) return null;
  const Icon = cfg.icon;

  const sizes = {
    sm: { wrap: 'px-2 py-0.5 text-[10px] gap-1', icon: 'w-3 h-3' },
    md: { wrap: 'px-2.5 py-1 text-xs gap-1.5',   icon: 'w-3.5 h-3.5' },
    lg: { wrap: 'px-3 py-1.5 text-sm gap-2',      icon: 'w-4 h-4' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <span
      title={BADGE_TOOLTIPS[type] || cfg.label}
      className={`inline-flex items-center font-semibold rounded-full border shadow-sm
        ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.glow} ${s.wrap} ${className}`}
    >
      <Icon className={`${s.icon} flex-shrink-0`} />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
};

/**
 * BadgeList — renders multiple badges
 */
export const BadgeList = ({ badges = [], max, size = 'md', className = '' }) => {
  if (!badges.length) return null;
  const list = max ? badges.slice(0, max) : badges;
  const extra = max && badges.length > max ? badges.length - max : 0;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {list.map(b => (
        <BadgeChip key={b.type || b} type={b.type || b} size={size} />
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-500 border border-gray-200">
          +{extra} more
        </span>
      )}
    </div>
  );
};

export default BadgeChip;