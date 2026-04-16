import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '@/services/authService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,            setUser]           = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('user')) || null; }
    catch { return null; }
  });
  const [token,           setToken]          = useState(() => sessionStorage.getItem('token') || null);
  const [loading,         setLoading]        = useState(true);
  
  const [suspensionReason,setSuspensionReason] = useState(null); // set when kicked via socket

  // ── Persist user + token ─────────────────────────────────────────────────
  const persist = useCallback((userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    sessionStorage.setItem('user',  JSON.stringify(userData));
    sessionStorage.setItem('token', tokenStr);
  }, []);

  const clear = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  }, []);

  // ── Hydrate from server on mount ──────────────────────────────────────────
  useEffect(() => {
  const hydrate = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await authService.getMe();
      setUser(data.data);
      sessionStorage.setItem('user', JSON.stringify(data.data));
    } catch {
      clear();
    } finally {
      setLoading(false);
    }
  };

  hydrate();
}, [token]); // ✅ FIXED

  // ── Actions ───────────────────────────────────────────────────────────────
  const login = async (credentials) => {
  const { data } = await authService.login(credentials);

  // Save token first
  setToken(data.token);
  sessionStorage.setItem('token', data.token);

  // Fetch fresh user data from backend
  const res = await authService.getMe();
  const freshUser = res.data.data;

  persist(freshUser, data.token);

  return data;
};

  const register = async (payload) => {
    const { data } = await authService.register(payload);
    persist(data.data, data.token);
    return data;
  };

  const logout = async () => {
    try { await authService.logout(); } catch (_) {}
    clear();
    toast.success('Logged out successfully');
  };

  const updateUser = (updatesOrFullUser) => {
    // If the argument looks like a full user object (has _id, role, email),
    // replace entirely. Otherwise shallow-merge with deep location merge.
    const isFullUser = updatesOrFullUser?._id && updatesOrFullUser?.email;
    const updated = isFullUser
      ? updatesOrFullUser                            // full replacement
      : {
          ...user,
          ...updatesOrFullUser,
          location: updatesOrFullUser.location
            ? { ...(user?.location || {}), ...updatesOrFullUser.location }
            : (user?.location || undefined),
          avatar: updatesOrFullUser.avatar || user?.avatar,
        };
    setUser(updated);
    sessionStorage.setItem('user', JSON.stringify(updated));
  };

  // ── Role helpers ──────────────────────────────────────────────────────────
  const isLabour = user?.role === 'labour';
  const isClient = user?.role === 'client';
  const isAdmin  = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  // ── Socket: listen for instant kick when admin suspends ───────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Dynamically import socket to avoid circular deps
    let socket = null;
    try {
      // Connect directly using the stored token
      const { io } = require('socket.io-client');
      socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
      });

      socket.emit('user:online', user?._id);

      socket.on('account:suspended', ({ reason, message }) => {
        setSuspensionReason(reason || message || 'Your account has been suspended.');
        // Clear auth but keep suspension reason for display
        setToken(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        toast.error('Your account has been suspended by an administrator.', { duration: 8000 });
      });

      socket.on('account:reactivated', ({ message }) => {
        setSuspensionReason(null);
        toast.success(message || 'Your account has been reactivated!', { duration: 6000 });
      });
    } catch (_) {}

    return () => { socket?.disconnect(); };
  }, [isAuthenticated, token, user?._id]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout, updateUser,
      isAuthenticated, isLabour, isClient, isAdmin,
      suspensionReason, setSuspensionReason,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};