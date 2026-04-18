import { Star, Inbox, AlertCircle } from 'lucide-react';
import { BADGE_META } from '@/utils/helpers';

// ── Badge ──────────────────────────────────────────────────────────────────────
export const Badge = ({ type }) => {
  const meta = BADGE_META[type];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
      <span>{meta.icon}</span>{meta.label}
    </span>
  );
};

// ── RatingStars ────────────────────────────────────────────────────────────────
export const RatingStars = ({ rating = 0, max = 5, size = 'sm', showValue = true }) => {
  const filled = Math.round(rating);
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`${sz} ${i < filled ? 'fill-amber-400 text-amber-400' : 'fill-surface-200 text-surface-200'}`} />
      ))}
      {showValue && (
        <span className="ml-1 text-xs text-slate-500 font-medium">
          {rating > 0 ? rating.toFixed(1) : 'No ratings'}
        </span>
      )}
    </span>
  );
};

// ── StatCard ───────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon: Icon, color = 'text-primary', bgColor = 'bg-primary-50', change, suffix = '' }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-display font-bold text-slate-900 mt-1">
          {value ?? '—'}{suffix}
        </p>
        {change !== undefined && (
          <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-success' : 'text-danger'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% this month
          </p>
        )}
      </div>
      {Icon && (
        <span className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </span>
      )}
    </div>
  </div>
);

// ── EmptyState ─────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description = '', action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-100 mb-4">
      <Icon className="w-8 h-8 text-slate-400" />
    </span>
    <h3 className="font-semibold text-slate-700 text-lg">{title}</h3>
    {description && <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// ── Alert ──────────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'info', message, className = '' }) => {
  const styles = {
    info:    'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-success-light text-success border-green-200',
    warning: 'bg-warning-light text-warning border-amber-200',
    error:   'bg-danger-light text-danger border-red-200',
  };
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm ${styles[type]} ${className}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{typeof message === 'string' ? message : (message?.message || JSON.stringify(message))}</span>
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────────────────────────
export const SkeletonCard = () => (
  <div className="card card-body space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
    <div className="skeleton h-3 w-full rounded" />
    <div className="skeleton h-3 w-5/6 rounded" />
    <div className="flex gap-2 mt-2">
      <div className="skeleton h-6 w-16 rounded-full" />
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  </div>
);

// ── Divider with label ─────────────────────────────────────────────────────────
export const DividerText = ({ text }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-surface-200" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-white px-3 text-xs text-slate-500 font-medium">{text}</span>
    </div>
  </div>
);

// ── Pagination ─────────────────────────────────────────────────────────────────
export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button className="btn-outline btn-sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>← Prev</button>
      <span className="text-sm text-slate-500 px-3">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      <button className="btn-outline btn-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next →</button>
    </div>
  );
};
