
import { useCallback, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';

// Smooth transition style injected briefly during toggle
const injectTransition = () => {
  if (document.getElementById('__lc_theme_anim__')) return;
  const s = document.createElement('style');
  s.id = '__lc_theme_anim__';
  s.textContent = `[data-layout-root] *, [data-layout-root] *::before, [data-layout-root] *::after {
    transition: background-color 0.35s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
  }`;
  document.head.appendChild(s);
  setTimeout(() => document.getElementById('__lc_theme_anim__')?.remove(), 400);
};

export const useRoleTheme = (role = 'public') => {
  const { isDark, toggle: ctxToggle } = useTheme();
  const dark = isDark(role);

  const toggle = useCallback(() => {
    injectTransition();
    ctxToggle(role);
  }, [ctxToggle, role]);

  const wrapperProps = useMemo(() => ({
    'data-layout-root': true,
    'data-theme': dark ? 'dark' : 'light',
    // Apply Tailwind's `dark` class on the wrapper div for dark: variants
    className: dark ? 'dark' : '',
  }), [dark]);

  return { dark, toggle, wrapperProps };
};