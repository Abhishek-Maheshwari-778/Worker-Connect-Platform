import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, MessageCircle, ArrowLeft, Search,
  Check, CheckCheck, Image, Smile, X,
  Reply, Edit2, Trash2, MoreVertical,
  Loader2, Download, Camera, Paperclip,
  ChevronDown, AlertCircle
} from 'lucide-react';
import chatService from '@/services/chatService';
import { useAuth }   from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { EmptyState } from '@/components/common/UIComponents';
import { chatTimestamp } from '@/utils/helpers';
import toast from 'react-hot-toast';

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const STYLES = `
@keyframes msgIn  { from{opacity:0;transform:translateY(8px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes msgInR { from{opacity:0;transform:translateY(8px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes typDot { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
@keyframes swipeIn{ from{transform:translateX(-8px);opacity:0} to{transform:translateX(0);opacity:1} }

.msg-in  { animation: msgIn  .22s cubic-bezier(.34,1.56,.64,1) both }
.msg-inR { animation: msgInR .22s cubic-bezier(.34,1.56,.64,1) both }
.typ-dot { animation: typDot 1.4s ease-in-out infinite }
.ctx-menu{ animation: swipeIn .18s ease both }

.chat-bg {
  background-color: #f0ece4;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8bfaf' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.msg-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,.15) transparent }
.msg-scroll::-webkit-scrollbar { width: 4px }
.msg-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 4px }

.msg-bubble-own  { border-radius: 18px 4px 18px 18px }
.msg-bubble-other{ border-radius: 4px 18px 18px 18px }

.action-btn { transition: all .15s ease; }
.action-btn:hover { transform: scale(1.1); }
`;

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
// Extracts sender ID as plain string from any message format
const getSenderId = (msg) => {
  const s = msg?.sender;
  if (!s) return '';
  // Populated: { _id: "abc", name: "..." }
  if (s._id) return s._id.toString();
  // Plain string/ObjectId
  return s.toString();
};

// Extracts current user ID from user object (handles all formats)
const extractUserId = (user) => {
  if (!user) return '';
  const id = user._id || user.id;
  if (!id) return '';
  return id.toString();
};

/* ─── Tick icon ────────────────────────────────────────────────────────────── */
const Tick = ({ msg, userId }) => {
  // Only show ticks on OWN messages (userId is null for received messages)
  if (!userId) return null;
  // Temp/optimistic message — show single grey tick (sending)
  if (msg._id?.startsWith?.('temp')) return <Check className="w-3 h-3 opacity-60" />;
  // Check if anyone OTHER than the sender has read it
  const isRead = (msg.readBy || []).some(r => {
    const rid = r?.user?._id || r?.user || r;
    return rid?.toString() !== userId?.toString();
  });
  if (isRead) return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
  // Delivered (in DB) but not read
  return <CheckCheck className="w-3.5 h-3.5 text-white/60" />;
};

/* ─── Reply preview inside bubble ─────────────────────────────────────────── */
const ReplyPreview = ({ msg, isOwn }) => {
  if (!msg?.replyTo) return null;
  const rt = msg.replyTo;
  return (
    <div className={`mb-2 px-3 py-2 rounded-xl text-xs border-l-4 ${isOwn ? 'bg-white/20 border-white/50 text-white/80' : 'bg-black/5 border-orange-400 text-gray-600'}`}>
      <p className="font-bold mb-0.5 opacity-80">
        {getSenderId(rt)?.toString() === getSenderId(msg)?.toString() ? 'You' : 'Replied'}
      </p>
      <p className="line-clamp-2">{rt.type === 'image' ? '📷 Photo' : rt.content}</p>
    </div>
  );
};

/* ─── Context menu ─────────────────────────────────────────────────────────── */
const CtxMenu = ({ x, y, isOwn, msg, onReply, onEdit, onDelete, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', fn), 0);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);

  const items = [
    { icon: Reply,  label: 'Reply',  action: onReply, always: true },
    { icon: Edit2,  label: 'Edit',   action: onEdit,  always: false, show: isOwn && !msg.isDeleted && msg.type !== 'image' },
    { icon: Trash2, label: 'Delete', action: onDelete,always: false, show: isOwn && !msg.isDeleted, danger: true },
  ].filter(i => i.always || i.show);

  return (
    <div
      ref={ref}
      className="ctx-menu fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-1 min-w-[140px]"
      style={{ left: Math.min(x, window.innerWidth - 160), top: Math.min(y, window.innerHeight - 160) }}
    >
      {items.map(item => (
        <button key={item.label}
          onClick={() => { item.action(); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${item.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700'}`}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </button>
      ))}
    </div>
  );
};

/* ─── Message bubble ───────────────────────────────────────────────────────── */
const Bubble = ({ msg, isOwn, showAvatar, otherUser, onReply, onEdit, onDelete, isNew }) => {
  const [ctx, setCtx] = useState(null);

  const handleRightClick = (e) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY });
  };

  const handleLongPress = useRef(null);
  const startLongPress = (e) => {
    handleLongPress.current = setTimeout(() => {
      const touch = e.touches?.[0];
      if (touch) setCtx({ x: touch.clientX, y: touch.clientY });
    }, 500);
  };
  const cancelLongPress = () => clearTimeout(handleLongPress.current);

  const ownBg  = 'bg-gradient-to-br from-orange-500 to-orange-600';
  const otherBg = 'bg-white';

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-3 group ${isNew ? (isOwn ? 'msg-inR' : 'msg-in') : ''}`}
      onContextMenu={handleRightClick}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      {/* Other user avatar */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0 self-end mr-1.5">
          {showAvatar && (
            <img
              src={otherUser?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name||'U')}&background=f97316&color=fff&size=32`}
              alt={otherUser?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
        </div>
      )}

      <div className={`max-w-[72%] sm:max-w-[60%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Reply arrow button (appears on hover) */}
        <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div
            className={`relative px-3 py-2 shadow-sm ${isOwn ? `${ownBg} text-white msg-bubble-own` : `${otherBg} text-gray-800 border border-gray-100 msg-bubble-other`} ${msg.isDeleted ? 'opacity-60' : ''}`}
          >
            {/* Reply preview */}
            <ReplyPreview msg={msg} isOwn={isOwn} />

            {/* Image */}
            {msg.type === 'image' && msg.attachment?.url && !msg.isDeleted && (
              <div className="mb-1.5 relative group/img">
                <img
                  src={msg.attachment.url}
                  alt="Photo"
                  className="max-w-full rounded-xl max-h-60 object-cover cursor-pointer"
                  onClick={() => window.open(msg.attachment.url, '_blank')}
                />
                <a
                  href={msg.attachment.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                </a>
              </div>
            )}

            {/* Text */}
            <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${msg.isDeleted ? 'italic text-sm opacity-70' : ''}`}>
              {msg.isDeleted
                ? '🚫 This message was deleted'
                : msg.content !== '📷 Photo' || msg.type !== 'image'
                ? msg.content
                : null
              }
            </p>

            {/* Edited badge */}
            {msg.isEdited && !msg.isDeleted && (
              <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'} ml-1`}>(edited)</span>
            )}

            {/* Timestamp + tick */}
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                {chatTimestamp(msg.createdAt)}
              </span>
              <Tick msg={msg} userId={isOwn ? getSenderId(msg) : null} />
            </div>
          </div>

          {/* Reply hover button */}
          {!msg.isDeleted && (
            <button
              onClick={() => onReply(msg)}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-orange-600 hover:border-orange-300 transition-all action-btn mx-1 flex-shrink-0"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Context menu */}
      {ctx && (
        <CtxMenu
          x={ctx.x} y={ctx.y}
          isOwn={isOwn} msg={msg}
          onReply={() => onReply(msg)}
          onEdit={() => onEdit(msg)}
          onDelete={() => onDelete(msg)}
          onClose={() => setCtx(null)}
        />
      )}
    </div>
  );
};

/* ─── Typing indicator ─────────────────────────────────────────────────────── */
const TypingBubble = ({ user }) => (
  <div className="flex justify-start mb-1 px-3 msg-in">
    <div className="w-8 flex-shrink-0 self-end mr-1.5">
      <img
        src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'U')}&background=f97316&color=fff&size=32`}
        alt={user?.name} className="w-8 h-8 rounded-full object-cover"
      />
    </div>
    <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
      <div className="flex gap-1 items-center h-4">
        {[0,1,2].map(i => (
          <span key={i} className="typ-dot w-2 h-2 rounded-full bg-gray-400 block"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  </div>
);

/* ─── Date divider ─────────────────────────────────────────────────────────── */
const DateDivider = ({ date }) => {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYest  = new Date(now - 86400000).toDateString() === d.toDateString();
  const label   = isToday ? 'Today' : isYest ? 'Yesterday' : d.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  return (
    <div className="flex justify-center my-4">
      <span className="bg-white/80 backdrop-blur-sm text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
        {label}
      </span>
    </div>
  );
};

/* ─── Conversation item ────────────────────────────────────────────────────── */
const ConvItem = ({ conv, isActive, userId, basePath, navigate, onDelete }) => {
  const [hovered,  setHovered]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const other   = conv.participants?.find(p => (p._id || p)?.toString() !== userId?.toString());
  const unread  = conv.unreadCounts?.find(u => (u.user?._id || u.user)?.toString() === userId?.toString())?.count || 0;
  const lastMsg = conv.lastMessage?.content || 'Start a conversation';

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-gray-50 transition-colors ${isActive ? 'bg-orange-50' : hovered ? 'bg-gray-50' : 'bg-white'}`}
      style={{ borderLeft: isActive ? '3px solid #f97316' : '3px solid transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      onClick={() => navigate(`${basePath}/${conv._id}`)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={other?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=f97316&color=fff&size=40`}
          alt={other?.name}
          className="w-11 h-11 rounded-full object-cover"
        />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center px-1 border-2 border-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
            {other?.name || 'Unknown'}
          </p>
          {/* Show time when not hovered, show dots when hovered */}
          {hovered ? (
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(m => !m); }}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {conv.lastMessage?.sentAt ? chatTimestamp(conv.lastMessage.sentAt) : ''}
            </span>
          )}
        </div>
        {conv.jobRef && (
          <p className="text-[11px] text-orange-500 font-medium truncate">📋 {conv.jobRef?.title}</p>
        )}
        <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
          {lastMsg}
        </p>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-3 top-12 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-1.5 min-w-[170px]"
          style={{ animation: 'swipeIn .15s ease both' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => { navigate(`${basePath}/${conv._id}`); setMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-gray-400" />
            Open Chat
          </button>
          <div className="h-px bg-gray-100 mx-3 my-1" />
          <button
            onClick={() => { setMenuOpen(false); onDelete(conv._id); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Chat
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CHAT PAGE
═══════════════════════════════════════════════════════════════════════════ */
const ChatPage = ({ basePath }) => {
  const { convId: activeConvId } = useParams();
  const convId = activeConvId; // alias for compatibility
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { socket, joinRoom, sendMessage: socketSend, onMessage, onTyping, startTyping, stopTyping, on } = useSocket();
  const qc         = useQueryClient();

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const fileRef      = useRef(null);
  const typingTimer  = useRef(null);
  const newMsgIds    = useRef(new Set());

  const [input,       setInput]       = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [localMsgs,   setLocalMsgs]   = useState([]);
  const [replyTo,     setReplyTo]     = useState(null);
  const [editTarget,  setEditTarget]  = useState(null);
  const [imagePreview,setImagePreview]= useState(null);
  const [imageFile,   setImageFile]   = useState(null);
  const [search,         setSearch]         = useState('');
  const [atBottom,       setAtBottom]       = useState(true);
  const [newMsgCount,    setNewMsgCount]    = useState(0);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null); // convId to confirm delete
  const [convMenuOpen,   setConvMenuOpen]   = useState(null); // convId with open menu
  const [stableConvs,    setStableConvs]    = useState([]);   // stable sorted list

  /* ── Conversations ────────────────────────────────────────────────────────── */
  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn:  () => chatService.getMyConversations().then(r => r.data.data),
    refetchInterval: 10000,
  });

  // Stabilize sidebar order — prevents conversations jumping on refetch
  // Only reorder when a genuinely new message arrives (lastMessage changes)
  useEffect(() => {
    if (!convsData) return;
    setStableConvs(prev => {
      if (prev.length === 0) return convsData; // first load — use server order
      // Merge: update existing entries in place, append truly new ones at top
      const updated = prev.map(p => convsData.find(c => c._id === p._id) || p);
      const newOnes = convsData.filter(c => !prev.find(p => p._id === c._id));
      return [...newOnes, ...updated];
    });
  }, [convsData]);

  const conversations = stableConvs.length > 0 ? stableConvs : (convsData || []);
  const filtered = search
    ? conversations.filter(c => {
        const myIdLocal = extractUserId(user);
        const other = c.participants?.find(p => (p._id||p)?.toString() !== myIdLocal);
        return other?.name?.toLowerCase().includes(search.toLowerCase()) || c.jobRef?.title?.toLowerCase().includes(search.toLowerCase());
      })
    : conversations;

  const activeConv = conversations.find(c => c._id === convId);
  const myIdStr    = extractUserId(user);
  const otherUser  = activeConv?.participants?.find(p => (p._id||p)?.toString() !== myIdStr);

  /* ── Messages ─────────────────────────────────────────────────────────────── */
  const { data: msgsData, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', convId],
    queryFn:  () => chatService.getMessages(convId, { limit: 100 }).then(r => r.data.data),
    enabled:  !!convId,
  });

  useEffect(() => {
    if (msgsData) {
      setLocalMsgs(msgsData);
      // When messages load, conversation unread resets — refresh sidebar
      qc.invalidateQueries(['conversations']);
    }
  }, [msgsData]);

  /* ── Auto-scroll ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewMsgCount(0);
    }
  }, [localMsgs, otherTyping]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAtBottom(isNearBottom);
    if (isNearBottom) setNewMsgCount(0);
  };

  /* ── Join room + socket events ───────────────────────────────────────────── */
  useEffect(() => {
    if (!convId || !socket) return;
    joinRoom(convId);

    const offMsg = onMessage(msg => {
      setLocalMsgs(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        newMsgIds.current.add(msg._id);
        return [...prev, msg];
      });
      qc.invalidateQueries(['conversations']);
      // If we're viewing the conversation, send read receipt
      if (document.visibilityState === 'visible') {
        socket.emit('messages:read', { conversationId: convId, readBy: user._id });
        chatService.getMessages(convId, { limit: 1 }).catch(() => {}); // trigger server-side markRead
      }
      if (!atBottom) setNewMsgCount(c => c + 1);
    });

    const offTyping = onTyping(({ userId: tid, isTyping: t }) => {
      const myIdStr = extractUserId(user);
    if (tid?.toString() !== myIdStr) setOtherTyping(t);
    });

    // Read receipts
    const offRead = on('messages:read', ({ conversationId, readBy }) => {
      if (conversationId !== convId) return;
      setLocalMsgs(prev => prev.map(m => {
        const sid = getSenderId(m);
        const myIdForRead = extractUserId(user);
        if (!myIdForRead || sid?.toString() !== myIdForRead) return m;
        if ((m.readBy || []).some(r => (r?.user || r)?.toString() === readBy)) return m;
        return { ...m, readBy: [...(m.readBy || []), { user: readBy }] };
      }));
    });

    // Message edited
    const offEdited = on('message:edited', ({ messageId, content }) => {
      setLocalMsgs(prev => prev.map(m =>
        m._id === messageId ? { ...m, content, isEdited: true } : m
      ));
    });

    // Message deleted
    const offDeleted = on('message:deleted', ({ messageId }) => {
      setLocalMsgs(prev => prev.map(m =>
        m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted', attachment: null } : m
      ));
    });

    return () => { offMsg?.(); offTyping?.(); offRead?.(); offEdited?.(); offDeleted?.(); };
  }, [convId, socket, atBottom]);

  /* ── Delete conversation ─────────────────────────────────────────────────── */
  const deleteConvMut = useMutation({
    mutationFn: (convId) => chatService.deleteConversation(convId),
    onSuccess: (_, convId) => {
      setStableConvs(prev => prev.filter(c => c._id !== convId));
      qc.invalidateQueries(['conversations']);
      setDeleteConfirm(null);
      setConvMenuOpen(null);
      if (convId === activeConvId) navigate(basePath);
      toast.success('Conversation deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  /* ── Send message ─────────────────────────────────────────────────────────── */
  const sendMut = useMutation({
    mutationFn: async ({ content, imageFile, replyToId }) => {
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        if (replyToId) fd.append('replyToId', replyToId);
        return chatService.sendImage(convId, fd);
      }
      return chatService.sendMessage(convId, { content, replyToId });
    },
    onMutate: ({ content, imageFile }) => {
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id:       tempId,
        content:   imageFile ? '📷 Photo' : content,
        type:      imageFile ? 'image' : 'text',
        sender:    { _id: user._id, name: user.name, avatar: user.avatar },
        createdAt: new Date().toISOString(),
        readBy:    [],
        replyTo:   replyTo,
        attachment: imageFile ? { url: URL.createObjectURL(imageFile) } : null,
      };
      newMsgIds.current.add(tempId);
      setLocalMsgs(prev => [...prev, tempMsg]);
      setReplyTo(null);
      setImagePreview(null);
      setImageFile(null);
      return { tempId };
    },
    onSuccess: (res, _vars, ctx) => {
      const newMsg = res.data.data;
      setLocalMsgs(prev => {
        const without = prev.filter(m => m._id !== ctx.tempId);
        if (without.find(m => m._id === newMsg._id)) return without;
        newMsgIds.current.add(newMsg._id);
        return [...without, newMsg];
      });
      socketSend({ roomId: convId, message: newMsg });
      qc.invalidateQueries(['conversations']);
    },
    onError: (_err, _vars, ctx) => {
      setLocalMsgs(prev => prev.filter(m => m._id !== ctx?.tempId));
      toast.error('Failed to send message');
    },
  });

  /* ── Edit message ─────────────────────────────────────────────────────────── */
  const editMut = useMutation({
    mutationFn: ({ id, content }) => chatService.editMessage(id, content),
    onSuccess: (res) => {
      const m = res.data.data;
      setLocalMsgs(prev => prev.map(x => x._id === m._id ? { ...x, content: m.content, isEdited: true } : x));
      socket?.emit('message:edited', { conversationId: convId, messageId: m._id, content: m.content });
      setEditTarget(null);
      setInput('');
    },
    onError: () => toast.error('Edit failed'),
  });

  /* ── Delete message ───────────────────────────────────────────────────────── */
  const deleteMut = useMutation({
    mutationFn: (id) => chatService.deleteMessage(id),
    onSuccess: (_, id) => {
      setLocalMsgs(prev => prev.map(m => m._id === id ? { ...m, isDeleted: true, content: 'This message was deleted', attachment: null } : m));
      socket?.emit('message:deleted', { conversationId: convId, messageId: id });
    },
    onError: () => toast.error('Delete failed'),
  });

  /* ── Handlers ─────────────────────────────────────────────────────────────── */
  const handleSend = () => {
    if (editTarget) {
      if (!input.trim()) return;
      editMut.mutate({ id: editTarget._id, content: input.trim() });
      return;
    }
    if (!input.trim() && !imageFile) return;
    if (!convId) return;
    sendMut.mutate({ content: input.trim(), imageFile, replyToId: replyTo?._id });
    setInput('');
    clearTimeout(typingTimer.current);
    stopTyping(convId);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (editTarget) return;
    startTyping(convId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => stopTyping(convId), 1500);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const cancelEdit = () => { setEditTarget(null); setInput(''); };
  const startEdit  = (msg) => { setEditTarget(msg); setInput(msg.content); inputRef.current?.focus(); };

  /* ── Single source of truth for current user ID ── */
  const myId = extractUserId(user);

  function isOwn(msg) {
    if (!myId) return false;
    const senderId = getSenderId(msg);
    if (!senderId) return false;
    return senderId === myId;
  }

  /* ── Group messages by date and sender ────────────────────────────────────── */
  const grouped = localMsgs.map((msg, i) => {
    const prev     = localMsgs[i - 1];
    const prevDate = prev ? new Date(prev.createdAt).toDateString() : null;
    const currDate = new Date(msg.createdAt).toDateString();
    const showDate = prevDate !== currDate;

    const prevSender = getSenderId(prev)?.toString();
    const currSender = getSenderId(msg)?.toString();
    const showAvatar = !isOwn(msg) && (prevSender !== currSender || showDate);

    return { msg, showDate, showAvatar, isNew: newMsgIds.current.has(msg._id) };
  });

  const totalUnread = conversations.reduce((s, c) => {
    return s + (c.unreadCounts?.find(u => (u.user?._id || u.user)?.toString() === extractUserId(user))?.count || 0);
  }, 0);

  return (
    <>
      <style>{STYLES}</style>
      <div className="flex h-[calc(100vh-5rem)] -my-4 overflow-hidden rounded-2xl shadow-card">

        {/* ══════════ SIDEBAR ══════════ */}
        <div className={`flex-shrink-0 flex flex-col bg-white border-r border-gray-100 ${convId ? 'hidden sm:flex w-72 lg:w-80' : 'flex w-full sm:w-72 lg:w-80'}`}>

          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-gray-900 text-lg">Chats</h2>
                {totalUnread > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {totalUnread}
                  </span>
                )}
              </div>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chats…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-orange-400 bg-gray-50 focus:bg-white transition-colors"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-3.5 h-3.5" /></button>}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(conv => (
                <ConvItem
                  key={conv._id}
                  conv={conv}
                  userId={user._id}
                  isActive={conv._id === convId}
                  basePath={basePath}
                  navigate={navigate}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={MessageCircle}
                  title={search ? 'No chats found' : 'No conversations yet'}
                  description="Start a conversation from a job page or worker profile."
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Delete Conversation Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter:'blur(6px)', background:'rgba(15,23,42,0.5)' }}>
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-display font-bold text-gray-900 text-lg">Delete Conversation?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This chat will be removed from your inbox. The other person can still see their copy.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConvMut.mutate(deleteConfirm)}
                disabled={deleteConvMut.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteConvMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CHAT AREA ══════════ */}
        {convId ? (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0 z-10">
              <button onClick={() => navigate(basePath)}
                className="sm:hidden w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              {otherUser ? (
                <>
                  <div className="relative flex-shrink-0">
                    <img
                      src={otherUser.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name||'U')}&background=f97316&color=fff&size=40`}
                      alt={otherUser.name} className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{otherUser.name}</p>
                    <p className="text-[11px] text-gray-400 capitalize">
                      {otherTyping
                        ? <span className="text-green-500 font-semibold">typing…</span>
                        : otherUser.role
                      }
                    </p>
                  </div>
                  {activeConv?.jobRef && (
                    <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-100">
                      <span className="text-xs font-semibold text-orange-700 max-w-[130px] truncate">
                        📋 {activeConv.jobRef.title}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse w-32" />
              )}
            </div>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto msg-scroll chat-bg"
              onScroll={handleScroll}
            >
              <div className="py-4">
                {msgsLoading ? (
                  <div className="flex justify-center pt-12">
                    <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                  </div>
                ) : grouped.length > 0 ? (
                  <>
                    {grouped.map(({ msg, showDate, showAvatar, isNew }) => (
                      <div key={msg._id}>
                        {showDate && <DateDivider date={msg.createdAt} />}
                        <Bubble
                          msg={msg}
                          isOwn={isOwn(msg)}
                          showAvatar={showAvatar}
                          otherUser={otherUser}
                          onReply={setReplyTo}
                          onEdit={startEdit}
                          onDelete={m => deleteMut.mutate(m._id)}
                          isNew={isNew}
                        />
                      </div>
                    ))}
                    {otherTyping && <TypingBubble user={otherUser} />}
                    <div ref={bottomRef} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 pt-20 text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-orange-400" />
                    </div>
                    <p className="font-semibold text-gray-700">Start the conversation</p>
                    <p className="text-sm text-gray-400 max-w-[200px]">
                      {activeConv?.jobRef ? `Chat about "${activeConv.jobRef.title}"` : 'Say hello to get started!'}
                    </p>
                  </div>
                )}
              </div>

              {/* Scroll to bottom button */}
              {!atBottom && (
                <button
                  onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setAtBottom(true); setNewMsgCount(0); }}
                  className="fixed bottom-28 right-6 sm:right-8 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-orange-50 transition-colors z-20"
                >
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                  {newMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {newMsgCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* ── Input area ── */}
            <div className="bg-white border-t border-gray-100 flex-shrink-0">
              {/* Image preview */}
              {imagePreview && (
                <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-100">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border-2 border-orange-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700">Photo ready to send</p>
                    <p className="text-xs text-gray-400">{imageFile?.name}</p>
                  </div>
                  <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Reply preview */}
              {replyTo && !editTarget && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50 border-b border-orange-100">
                  <div className="w-1 h-8 rounded-full bg-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-orange-600">
                      {isOwn(replyTo) ? 'Replying to yourself' : `Replying to ${otherUser?.name}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {replyTo.type === 'image' ? '📷 Photo' : replyTo.content}
                    </p>
                  </div>
                  <button onClick={() => setReplyTo(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Edit mode bar */}
              {editTarget && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                  <Edit2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-600">Editing message</p>
                    <p className="text-xs text-gray-500 truncate">{editTarget.content}</p>
                  </div>
                  <button onClick={cancelEdit}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input row */}
              <div className="flex items-end gap-2 px-3 py-3">
                {/* Image attach */}
                {!editTarget && (
                  <>
                    <button onClick={() => fileRef.current?.click()}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-orange-100 hover:text-orange-600 transition-all action-btn"
                      title="Attach photo">
                      <Image className="w-5 h-5" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </>
                )}

                {/* Text input */}
                <textarea
                  ref={inputRef}
                  className="flex-1 px-4 py-2.5 rounded-3xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none min-h-[44px] max-h-28 bg-gray-50 focus:bg-white transition-all"
                  placeholder={editTarget ? 'Edit message…' : 'Type a message…'}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !imageFile) || sendMut.isPending || editMut.isPending}
                  className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-200 active:scale-95"
                >
                  {(sendMut.isPending || editMut.isPending)
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : editTarget
                    ? <Check className="w-5 h-5" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center pb-2">
                Enter to send · Shift+Enter for new line · Right-click for options
              </p>
            </div>
          </div>
        ) : (
          /* No conversation selected */
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center chat-bg gap-4">
            <div className="w-20 h-20 rounded-3xl bg-white/80 shadow-md flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-orange-400" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-gray-700 text-lg">Your Messages</p>
              <p className="text-sm text-gray-500 mt-1">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatPage;