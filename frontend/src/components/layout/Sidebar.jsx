import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/common/Avatar';

const Sidebar = ({ navItems, open, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-surface-200 z-40
        flex flex-col transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:h-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-surface-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">LC</span>
            </span>
            <span className="font-display font-bold text-slate-900">
              Labour<span className="text-accent">Connect</span>
            </span>
          </div>
          <button className="btn-ghost btn-icon lg:hidden" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── User info ── */}
        <div className="px-4 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar?.url} name={user?.name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) =>
            item.divider ? (
              <div key={item.key} className="pt-3 pb-1 px-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                {item.icon && <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '1.1rem', height: '1.1rem' }} />}
                <span>{item.label}</span>
                {item.badge != null && (
                  <span className="ml-auto badge-orange badge text-[10px] px-1.5 py-0">{item.badge}</span>
                )}
              </NavLink>
            )
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-surface-100">
          <p className="text-[11px] text-slate-400 text-center">Labour Connect v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
