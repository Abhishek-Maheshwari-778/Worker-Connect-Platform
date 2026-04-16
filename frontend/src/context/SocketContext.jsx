import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef   = useRef(null);
  const listenersRef = useRef({});          // { eventName: Set of callbacks }
  const [isConnected,  setIsConnected]  = useState(false);
  const [onlineUsers,  setOnlineUsers]  = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL || '/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection:        true,
      reconnectionAttempts: 10,
      reconnectionDelay:    1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('user:online', user._id);
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      // Suppress noisy errors — auto-reconnect handles it
      console.warn('Socket connection error:', err.message);
    });

    socket.on('presence:update', (users) => setOnlineUsers(users));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  /* ── Generic subscribe / unsubscribe ────────────────────────────────────── */
  const on = useCallback((event, cb) => {
    socketRef.current?.on(event, cb);
    return () => socketRef.current?.off(event, cb);
  }, []);

  const off = useCallback((event, cb) => {
    socketRef.current?.off(event, cb);
  }, []);

  /* ── Emit helpers ────────────────────────────────────────────────────────── */
  const joinRoom    = (roomId)  => socketRef.current?.emit('room:join', roomId);
  const sendMessage = (payload) => socketRef.current?.emit('message:send', payload);
  const startTyping = (roomId)  => socketRef.current?.emit('typing:start', { roomId, userId: user?._id });
  const stopTyping  = (roomId)  => socketRef.current?.emit('typing:stop',  { roomId, userId: user?._id });

  /* ── Convenience listeners (kept for backward compat) ────────────────────── */
  const onMessage   = (cb) => { socketRef.current?.on('message:receive',  cb); return () => socketRef.current?.off('message:receive',  cb); };
  const onTyping    = (cb) => { socketRef.current?.on('typing:update',    cb); return () => socketRef.current?.off('typing:update',    cb); };
  const onJobStatus = (cb) => { socketRef.current?.on('job:statusUpdate', cb); return () => socketRef.current?.off('job:statusUpdate', cb); };
  const onJobExpired = (cb) => { 
  socketRef.current?.on('job:expired', cb); 
  return () => socketRef.current?.off('job:expired', cb); 
};

const onJobExpiringSoon = (cb) => { 
  socketRef.current?.on('job:expiring-soon', cb); 
  return () => socketRef.current?.off('job:expiring-soon', cb); 
};


  const isUserOnline = (userId) => onlineUsers.includes(userId);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected, onlineUsers,
      on, off,
      joinRoom, sendMessage, startTyping, stopTyping,
      onMessage, onTyping, onJobStatus, isUserOnline,
      onJobExpired,      // ✅ NEW
      onJobExpiringSoon, // ✅ NEW
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};