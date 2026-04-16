import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { useProfileGate } from '@/hooks/useProfileGate';

/**
 * ProfileGateBanner
 * Shows a contextual banner when user cannot perform an action.
 * Pass `action="apply"` or `action="post"` or `action="chat"` for context.
 */
const ProfileGateBanner = ({ action = 'apply', className = '' }) => {
  const gate = useProfileGate();
  if (gate.canAct) return null;

  const cfg = {
    incomplete_profile: {
      icon:    AlertTriangle,
      bg:      'bg-amber-50 border-amber-200',
      text:    'text-amber-800',
      sub:     'text-amber-600',
      iconCls: 'text-amber-500',
      btnCls:  'bg-amber-500 hover:bg-amber-600',
    },
    verification_pending: {
      icon:    Clock,
      bg:      'bg-blue-50 border-blue-200',
      text:    'text-blue-800',
      sub:     'text-blue-600',
      iconCls: 'text-blue-500',
      btnCls:  null,
    },
    not_verified: {
      icon:    Shield,
      bg:      'bg-orange-50 border-orange-200',
      text:    'text-orange-800',
      sub:     'text-orange-600',
      iconCls: 'text-orange-500',
      btnCls:  'bg-orange-500 hover:bg-orange-600',
    },
  };

  const c   = cfg[gate.gateType] || cfg.not_verified;
  const Icon = c.icon;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 ${c.bg} ${className}`}>
      <div className={`w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-5 h-5 ${c.iconCls}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${c.text}`}>{gate.message}</p>
        {gate.subtext && <p className={`text-xs mt-0.5 ${c.sub}`}>{gate.subtext}</p>}
      </div>
      {gate.cta && gate.href && (
        <Link to={gate.href}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors shadow-sm ${c.btnCls}`}>
          {gate.cta} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
};

export default ProfileGateBanner;