import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  HardHat, ArrowRight, ArrowLeft, Menu, X,
  Home, Info, Briefcase, BookOpen, Phone,
  ArrowUp, Sun, Moon
} from 'lucide-react';
import { useRoleTheme }  from '@/hooks/useRoleTheme';

const NAV_LINKS = [
  { to: '/',         label: 'Home',     icon: Home,     end: true },
  { to: '/about',    label: 'About',    icon: Info },
  { to: '/services', label: 'Services', icon: Briefcase },
  { to: '/blog',     label: 'Blog',     icon: BookOpen },
  { to: '/contact',  label: 'Contact',  icon: Phone },
];

const PublicLayout = ({ children }) => {
  // Auth not needed here — NavigationGuard handles redirects
  const location  = useLocation();
  const navigate  = useNavigate();
  const { dark, toggle: toggleDark, wrapperProps } = useRoleTheme('public');

  const [scrolled,      setScrolled]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [showScrollUp,  setShowScrollUp]  = useState(false);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollUp(window.scrollY > 400);
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div
      {...wrapperProps}
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        dark ? 'dark bg-slate-900 text-slate-100' : 'bg-white text-gray-900'
      }`}
    >
      {/* ── STICKY NAVBAR ──────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? dark
            ? 'bg-slate-900/95 backdrop-blur-lg shadow-lg border-b border-slate-700'
            : 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100'
          : 'bg-slate-900/95 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Back button (shown on sub-pages only, left of logo) */}
            {!isHome && (
              <button
                onClick={() => navigate(-1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
                  scrolled && !dark
                    ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50 border border-gray-200 bg-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10 border border-white/20'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <HardHat className="w-4 h-4 text-white" />
              </div>
              <span className={`font-display font-bold text-lg transition-colors ${
                scrolled && !dark ? 'text-gray-900' : 'text-white'
              }`}>
                Labour<span className="text-orange-500">Connect</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {NAV_LINKS.map(({ to, label, end }) => (
                <NavLink
                  key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? scrolled && !dark
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-white/15 text-white'
                        : scrolled && !dark
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Right side: dark toggle + CTA */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {/* Single icon dark mode toggle */}
              <button
                onClick={toggleDark}
                title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  scrolled && !dark
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : dark
                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Login/Sign Up — always shown on public pages */}
              {/* NavigationGuard handles redirect if already authenticated */}
              <Link
                to="/login"
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white transition-all duration-200"
              >
                Login / Sign Up
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Mobile: dark toggle + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleDark}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  dark ? 'bg-amber-500/20 text-amber-300' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  scrolled && !dark ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                }`}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-96' : 'max-h-0'}`}>
          <div className={`border-t px-4 py-3 space-y-1 shadow-xl ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to} to={to} end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : dark
                        ? 'text-slate-200 hover:bg-slate-700'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                Login / Sign Up <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── PAGE CONTENT (pt-16 to clear fixed navbar) ───────────────────── */}
      <main className={`flex-1 ${isHome ? 'pt-0' : 'pt-16'}`}>
        {children}
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className={`pt-14 pb-8 ${dark ? 'bg-slate-950 text-gray-400' : 'bg-slate-950 text-gray-400'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <HardHat className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl text-white">
                  Labour<span className="text-orange-500">Connect</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                India's most trusted daily wage labour hiring platform.
              </p>
              <p className="text-xs text-gray-600">support@labourconnect.in</p>
            </div>
            {[
              { title: 'Company',     links: [['Home','/'],['About','/about'],['Services','/services'],['Blog','/blog'],['Contact','/contact']] },
              { title: 'For Clients', links: [['Post a Job','/register'],['Browse Workers','/register'],['Pricing','/services']] },
              { title: 'For Workers', links: [['Create Profile','/register'],['Browse Jobs','/login'],['Govt. Schemes','/login']] },
            ].map(col => (
              <div key={col.title}>
                <p className="font-semibold text-white text-sm mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link to={href} className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} Labour Connect. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                <span key={l} className="hover:text-gray-400 cursor-pointer transition-colors">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── MOBILE floating back button (sub-pages only) ──────────────────── */}
      {!isHome && (
        <button
          onClick={() => navigate(-1)}
          className="fixed bottom-6 left-4 z-50 md:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 shadow-xl text-sm font-semibold text-gray-700 hover:border-orange-400 hover:text-orange-600 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}

      {/* ── SCROLL TO TOP ─────────────────────────────────────────────────── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-4 z-50 w-11 h-11 rounded-2xl bg-orange-500 text-white shadow-xl flex items-center justify-center hover:bg-orange-600 active:scale-95 transition-all duration-300 ${
          showScrollUp ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default PublicLayout;