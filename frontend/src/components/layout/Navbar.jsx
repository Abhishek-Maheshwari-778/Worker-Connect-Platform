import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, ChevronDown, LogOut, User,
  Settings, HardHat, ArrowRight
} from 'lucide-react';
import { useAuth }          from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import Avatar                from '@/components/common/Avatar';
import NotificationPanel     from '@/components/notifications/NotificationPanel';
import { useClickOutside }   from '@/hooks/useHooks';

const PUBLIC_NAV = [
  { to: '/',         label: 'Home',     end: true },
  { to: '/about',    label: 'About'   },
  { to: '/services', label: 'Services' },
  { to: '/blog',     label: 'Blog'    },
  { to: '/contact',  label: 'Contact' },
];

const Navbar = ({ onMenuToggle, transparent = false }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { panelOpen, setPanelOpen }       = useNotifications();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useClickOutside(() => setDropOpen(false));

  const isPublicPage = ['/', '/about', '/services', '/blog', '/contact'].includes(location.pathname);
  const isDark       = isPublicPage && transparent;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashPath = user ? `/${user.role}` : '/dashboard';

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      isDark ? 'bg-transparent' : 'bg-white/95 backdrop-blur-lg border-b border-surface-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3">
            {onMenuToggle && (
              <button onClick={onMenuToggle} className="btn-ghost btn-icon lg:hidden -ml-1">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                <HardHat className="w-4 h-4 text-white" />
              </div>
              <span className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Labour<span className="text-accent">Connect</span> <span className="text-xs font-medium opacity-70 block sm:inline-block border-l border-slate-300 ml-2 pl-2">ShramSetu Bharat</span>
              </span>
            </Link>
          </div>

          {/* Desktop nav links (public pages) */}
          {isPublicPage && !isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {PUBLIC_NAV.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isDark
                        ? isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                        : isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:text-slate-900 hover:bg-surface-100'
                    }`
                  }>
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notification bell — uses panel inside */}
                <NotificationPanel />

                {/* User dropdown */}
                <div className="relative" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-100 transition-colors"
                  >
                    <Avatar src={user?.avatar?.url} name={user?.name} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 card shadow-float animate-slide-down z-50">
                      <div className="p-3 border-b border-surface-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 capitalize mt-0.5">{user?.role} Account</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link to={dashPath} onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-surface-100 transition-colors">
                          <User className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link to={`${dashPath}/settings`} onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-surface-100 transition-colors">
                          <Settings className="w-4 h-4" /> Settings
                        </Link>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger-light transition-colors">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login"
                className="group hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all duration-200">
                Login / Sign Up
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;