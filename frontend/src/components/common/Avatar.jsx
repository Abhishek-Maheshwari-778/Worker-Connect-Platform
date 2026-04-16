import { getInitials } from '@/utils/helpers';

const sizeCls = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

// Deterministic colour from name
const COLOURS = [
  'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',  'bg-cyan-100 text-cyan-700',
];
const colourFor = (name = '') => COLOURS[(name?.charCodeAt(0) || 0) % COLOURS.length];

const Avatar = ({ src, name, size = 'md', className = '', online = false }) => {
  name = name || '';
  const base = `${sizeCls[size]} rounded-full flex-shrink-0 relative overflow-hidden`;

  return (
    <span className={`inline-block relative flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${base} object-cover`} />
      ) : (
        <span className={`${base} ${colourFor(name)} flex items-center justify-center font-semibold`}>
          {getInitials(name) || '?'}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
      )}
    </span>
  );
};

export default Avatar;