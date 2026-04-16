import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import { useAuth }   from './AuthContext';
import { useSocket } from './SocketContext';
import notificationService from '@/services/notificationService';
import toast from 'react-hot-toast';
import { BADGE_CONFIG } from '@/components/common/BadgeChip';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { socket }                = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(true);
  const [filter,        setFilter]        = useState('all');
  const [category,      setCategory]      = useState('all');
  const [panelOpen,     setPanelOpen]     = useState(false);

  const initialized = useRef(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (reset = false, overrideFilter, overrideCategory) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const pg  = reset ? 1 : page;
      const f   = overrideFilter   ?? filter;
      const cat = overrideCategory ?? category;
      const res = await notificationService.getAll({
        page: pg, limit: 15,
        filter: f,
        ...(cat !== 'all' && { category: cat }),
      });
      const { data: items, meta } = res.data;
      if (reset) {
        setNotifications(items || []);
        setPage(2);
      } else {
        setNotifications(prev => {
          const ids = new Set(prev.map(n => n._id));
          return [...prev, ...(items || []).filter(n => !ids.has(n._id))];
        });
        setPage(p => p + 1);
      }
      setUnreadCount(meta?.unreadCount ?? 0);
      setHasMore((items || []).length === 15);
    } catch (err) {
      console.error('Notifications fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page, filter, category]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && !initialized.current) {
      initialized.current = true;
      fetchNotifications(true);
    }
    if (!isAuthenticated) {
      initialized.current = false;
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // ── Filter/Category change ─────────────────────────────────────────────────
  const changeFilter = useCallback((f) => {
    setFilter(f);
    setPage(1);
    setHasMore(true);
    fetchNotifications(true, f, category);
  }, [category, fetchNotifications]);

  const changeCategory = useCallback((cat) => {
    setCategory(cat);
    setPage(1);
    setHasMore(true);
    fetchNotifications(true, filter, cat);
  }, [filter, fetchNotifications]);

  // ── Socket real-time ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNew = (notif) => {
      setNotifications(prev => {
        if (prev.find(n => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount(c => c + 1);
      // Toast popup
      toast(
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-orange-600 text-sm">🔔</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{notif.title}</p>
            <p className="text-xs text-gray-500 truncate">{notif.description}</p>
          </div>
        </div>,
        { duration: 4000, style: { padding: '10px 12px', borderRadius: '14px' } }
      );
      if (navigator?.vibrate) navigator.vibrate([100, 50, 100]);
    };

    const onCount = ({ count }) => setUnreadCount(count);

    /* ── Badge earned — rich animated toast ─────────────────────────────── */
    const onBadgeEarned = ({ badges = [], score, level, levelName, points }) => {
      if (!badges.length) return;
      const first = badges[0];
      const cfg   = BADGE_CONFIG[first?.type] || {};
      const names = badges.map(b => BADGE_CONFIG[b.type]?.label || b.type).join(' & ');

      toast.custom(
        (t) => (
          <div className={`bg-white rounded-2xl shadow-2xl border-2 border-amber-200 px-4 py-3 flex items-center gap-3 min-w-[270px] transition-all duration-300 ${t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className={`w-12 h-12 rounded-2xl ${cfg.bg || 'bg-amber-100'} flex items-center justify-center flex-shrink-0 shadow`}>
              <span className="text-xl">🏅</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Badge Earned!</p>
              <p className="font-bold text-gray-900 text-sm truncate">{names}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{score} pts · Lv.{level} {levelName}</p>
            </div>
          </div>
        ),
        { duration: 6000, position: 'top-right' }
      );
    };

    /* ── Level up — celebration toast ────────────────────────────────────── */
    const onLevelUp = ({ level, levelName }) => {
      toast.custom(
        (t) => (
          <div className={`bg-white rounded-2xl shadow-2xl border-2 border-purple-200 px-4 py-3 flex items-center gap-3 min-w-[270px] transition-all duration-300 ${t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-xl">⬆️</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Level Up!</p>
              <p className="font-bold text-gray-900 text-sm">Level {level} Reached</p>
              <p className="text-xs font-bold text-purple-700">{levelName}</p>
            </div>
          </div>
        ),
        { duration: 7000, position: 'top-right' }
      );
    };

    socket.on('notification:new',         onNew);
    socket.on('notification:unreadCount', onCount);
    socket.on('badge:earned',             onBadgeEarned);
    socket.on('level:up',                 onLevelUp);
    return () => {
      socket.off('notification:new',         onNew);
      socket.off('notification:unreadCount', onCount);
      socket.off('badge:earned',             onBadgeEarned);
      socket.off('level:up',                 onLevelUp);
    };
  }, [socket]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    const prev = notifications.find(n => n._id === id);
    if (prev?.isRead) return;
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    try {
      await notificationService.markRead(id);
    } catch {
      setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: false } : n));
      setUnreadCount(c => c + 1);
    }
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await notificationService.markAllRead(); } catch (_) {}
  }, []);

  const hide = useCallback(async (id) => {
    setNotifications(ns => ns.filter(n => n._id !== id));
    setUnreadCount(c => {
      const notif = notifications.find(n => n._id === id);
      return notif && !notif.isRead ? Math.max(0, c - 1) : c;
    });
    try { await notificationService.hide(id); } catch (_) {}
  }, [notifications]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try { await notificationService.clearAll(); } catch (_) {}
  }, []);

  const handleAction = useCallback(async (id, actionType, replyMessage) => {
    try {
      const res = await notificationService.handleAction(id, { actionType, replyMessage });
      setNotifications(ns => ns.map(n => n._id === id ? res.data.data : n));
    } catch (_) {}
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchNotifications(false);
  }, [loading, hasMore, fetchNotifications]);

  const refresh = useCallback(() => fetchNotifications(true), [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading, hasMore,
      filter, category, panelOpen,
      setPanelOpen,
      changeFilter, changeCategory,
      markRead, markAllRead, hide, clearAll, handleAction,
      loadMore, refresh,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};