import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// ── Date formatters ────────────────────────────────────────────────────────────
export const formatDate = (date, pattern = 'dd MMM yyyy') =>
  date ? format(new Date(date), pattern) : '—';

export const timeAgo = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '';

export const chatTimestamp = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d))     return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd/MM/yy');
};

// ── Currency formatter ─────────────────────────────────────────────────────────
export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 })
    .format(amount ?? 0);

// ── Truncate text ──────────────────────────────────────────────────────────────
export const truncate = (str, len = 100) =>
  str && str.length > len ? str.slice(0, len) + '…' : (str ?? '');

// ── Get initials for avatar fallback ──────────────────────────────────────────
export const getInitials = (name = '') => {
  if (!name || typeof name !== 'string') return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w?.[0]?.toUpperCase() || '').join('') || '?';
};

// ── Job status display ─────────────────────────────────────────────────────────
export const JOB_STATUS_LABELS = {
  open:        'Open',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  on_hold:     'On Hold',
};

export const JOB_STATUS_CSS = {
  open:        'status-open',
  in_progress: 'status-in_progress',
  completed:   'status-completed',
  cancelled:   'status-cancelled',
  on_hold:     'status-on_hold',
};

// ── Application status display ────────────────────────────────────────────────
export const APP_STATUS_CSS = {
  applied:     'badge-blue',
  shortlisted: 'badge-yellow',
  accepted:    'badge-green',
  rejected:    'badge-red',
  withdrawn:   'badge-gray',
};

// ── Skill categories ──────────────────────────────────────────────────────────
export const JOB_CATEGORIES = [
  { value: 'construction', label: '🏗️ Construction' },
  { value: 'electrical',   label: '⚡ Electrical' },
  { value: 'plumbing',     label: '🔧 Plumbing' },
  { value: 'painting',     label: '🎨 Painting' },
  { value: 'carpentry',    label: '🪚 Carpentry' },
  { value: 'welding',      label: '🔩 Welding' },
  { value: 'cleaning',     label: '🧹 Cleaning' },
  { value: 'gardening',    label: '🌱 Gardening' },
  { value: 'moving',       label: '📦 Moving' },
  { value: 'security',     label: '🔒 Security' },
  { value: 'driving',      label: '🚗 Driving' },
  { value: 'cooking',      label: '🍳 Cooking' },
  { value: 'other',        label: '💼 Other' },
];

export const BADGE_META = {
  verified:      { label: 'Verified',      color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '✓' },
  top_rated:     { label: 'Top Rated',     color: 'text-amber-600',  bg: 'bg-amber-50',  icon: '⭐' },
  fast_responder:{ label: 'Fast Responder',color: 'text-green-600',  bg: 'bg-green-50',  icon: '⚡' },
  experienced:   { label: 'Experienced',   color: 'text-purple-600', bg: 'bg-purple-50', icon: '🏅' },
  expert:        { label: 'Expert',        color: 'text-rose-600',   bg: 'bg-rose-50',   icon: '🎖️' },
};

// ── Validation helpers ────────────────────────────────────────────────────────
export const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
export const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
export const isValidPassword = (p)  => p?.length >= 8 && /\d/.test(p);

// ── Build query string from object (skipping undefined / empty) ───────────────
export const buildQuery = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

// ── File size display ──────────────────────────────────────────────────────────
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};