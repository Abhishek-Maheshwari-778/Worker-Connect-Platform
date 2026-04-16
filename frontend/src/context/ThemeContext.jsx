import { createContext, useContext, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

// ── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  labour: 'lc_theme_labour',
  client: 'lc_theme_client',
  admin:  'lc_theme_admin',
  public: 'lc_theme_public',
};

const getStored = (role) => {
  try { return localStorage.getItem(STORAGE_KEYS[role] || STORAGE_KEYS.public) === 'dark'; }
  catch { return false; }
};

const setStored = (role, isDark) => {
  try { localStorage.setItem(STORAGE_KEYS[role] || STORAGE_KEYS.public, isDark ? 'dark' : 'light'); }
  catch {}
};

export const ThemeProvider = ({ children }) => {
  // Each role has its own independent dark state
  const [themes, setThemes] = useState({
    labour: getStored('labour'),
    client: getStored('client'),
    admin:  getStored('admin'),
    public: getStored('public'),
  });

  const toggle = useCallback((role = 'public') => {
    setThemes(prev => {
      const next = { ...prev, [role]: !prev[role] };
      setStored(role, next[role]);
      return next;
    });
  }, []);

  const isDark = useCallback((role = 'public') => {
    return themes[role] ?? false;
  }, [themes]);

  // Legacy: used by SettingsPage toggle which calls toggle() with no arg or with role
  // Keep a `dark` property pointing to current user's role for backward compat
  return (
    <ThemeContext.Provider value={{ themes, toggle, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};