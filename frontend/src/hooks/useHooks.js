import { useState, useEffect, useCallback, useRef } from 'react';

// ── useLocalStorage ────────────────────────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; }
    catch { return initialValue; }
  });

  const set = (val) => {
    try {
      const v = val instanceof Function ? val(value) : val;
      setValue(v);
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  };

  return [value, set];
};

// ── useDebounce ────────────────────────────────────────────────────────────────
export const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// ── useGeolocation ─────────────────────────────────────────────────────────────
export const useGeolocation = () => {
  const [location,  setLocation]  = useState(null);
  const [error,     setError]     = useState(null);
  const [loading,   setLoading]   = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocation is not supported'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude });
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
  }, []);

  return { location, error, loading, getLocation };
};

// ── useIntersectionObserver (for infinite scroll / lazy load) ─────────────────
export const useIntersectionObserver = (options = {}) => {
  const ref       = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), options);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, visible];
};

// ── useClickOutside ────────────────────────────────────────────────────────────
export const useClickOutside = (callback) => {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) callback(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);
  return ref;
};

// ── useWindowSize ──────────────────────────────────────────────────────────────
export const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
};
