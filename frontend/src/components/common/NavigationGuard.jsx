/**
 * NavigationGuard v2
 * ──────────────────
 * 1. Replaces history entries so back button can't reach public pages
 *    while user is authenticated.
 * 2. Redirects authenticated users away from public/auth routes.
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PUBLIC_ROUTES  = ['/', '/login', '/register', '/about', '/services', '/blog', '/contact',
                        '/forgot-password'];
const DASHBOARD      = { labour: '/labour', client: '/client', admin: '/admin' };
const DASH_PREFIXES  = ['/labour', '/client', '/admin'];

const NavigationGuard = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Block public routes while authenticated ──────────────────────────────── */
  useEffect(() => {
    if (loading || !isAuthenticated || !user?.role) return;
    const isPublic = PUBLIC_ROUTES.includes(location.pathname) ||
                     location.pathname.startsWith('/reset-password') ||
                     location.pathname.startsWith('/verify-email');
    if (isPublic) {
      navigate(DASHBOARD[user.role] || '/labour', { replace: true });
    }
  }, [isAuthenticated, user?.role, location.pathname, loading, navigate]);

  /* ── Prevent back navigation out of dashboard ──────────────────────────────── */
  useEffect(() => {
    if (loading || !isAuthenticated || !user?.role) return;
    const onDash = DASH_PREFIXES.some(p => location.pathname.startsWith(p));
    if (!onDash) return;

    // Replace current history entry — removes the "previous" public page from history stack
    // This means back button has nothing to go back to that's outside the dashboard
    window.history.replaceState(
      { ...window.history.state, _guarded: true },
      '',
      location.pathname + location.search
    );

    const onPopState = () => {
      // If still authenticated, push forward to current route
      if (sessionStorage.getItem('token')) {
        window.history.pushState(null, '', location.pathname + location.search);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isAuthenticated, user?.role, location.pathname, loading]);

  return null;
};

export default NavigationGuard;