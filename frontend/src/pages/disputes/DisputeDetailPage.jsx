import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Send, Clock, CheckCircle, User,
  Briefcase, AlertTriangle, Shield, Star,
  ChevronDown, Lock, Unlock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import disputeService from '@/services/disputeService';
import { timeAgo, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  open:              { label: 'Open',           cls: 'bg-blue-100 text-blue-800 border-blue-200'   },
  under_review:      { label: 'Under Review',   cls: 'bg-amber-100 text-amber-800 border-amber-200'},
  awaiting_response: { label: 'Needs Response', cls: 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse' },
  resolved:          { label: 'Resolved',       cls: 'bg-green-100 text-green-800 border-green-200'},
  closed:            { label: 'Closed',         cls: 'bg-gray-100 text-gray-600 border-gray-200'  },
  escalated:         { label: 'Escalated',      cls: 'bg-purple-100 text-purple-800 border-purple-200'},
};

const RESOLUTION_LABELS = {
  favour_client:     '✅ Decided in favour of client',
  favour_labour:     '✅ Decided in favour of worker',
  mutual_agreement:  '🤝 Mutual agreement reached',
  no_action:         '📁 No action required',
  escalated_external:'⬆️ Escalated externally',
};

function MessageBubble({ msg, isMe, isAdmin }) {
  const roleColors = { admin: 'bg-indigo-100 text-indigo-700', client: 'bg-blue-100 text-blue-700', labour: 'bg-orange-100 text-orange-700' };
  return (
    <div className={`flex gap-3 mb-4 ${isMe ? 'flex-row-reverse' : ''}`}>
      <img
        src={msg.sender?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.name||'U')}&background=f97316&color=fff&size=36`}
        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
        alt=""
      />
      <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">{isMe ? 'You' : msg.sender?.name}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleColors[msg.senderRole] || 'bg-gray-100 text-gray-500'}`}>
            {msg.senderRole}
          </span>
          {msg.isAdminOnly && <Lock className="w-3 h-3 text-indigo-400" title="Admin note" />}
        </div>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? 'bg-orange-500 text-white rounded-tr-sm'
            : msg.isAdminOnly
              ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-tl-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-gray-400">{timeAgo(msg.createdAt)}</span>
      </div>
    </div>
  );
}

export default function DisputeDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const qc        = useQueryClient();
  const msgEnd    = useRef(null);
  const [msg, setMsg] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingNote, setRatingNote] = useState('');
  const [showRating, setShowRating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn:  () => disputeService.getDispute(id).then(r => r.data.data),
    refetchInterval: 15000,
  });

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages?.length]);

  const msgMut = useMutation({
    mutationFn: () => disputeService.addMessage(id, { content: msg }),
    onSuccess: () => { setMsg(''); qc.invalidateQueries(['dispute', id]); },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  const rateMut = useMutation({
    mutationFn: () => disputeService.rateResolution(id, { rating, note: ratingNote }),
    onSuccess: () => { toast.success('Rating submitted!'); qc.invalidateQueries(['dispute', id]); setShowRating(false); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-24" />
      <div className="h-32 bg-white rounded-2xl" />
      <div className="h-64 bg-white rounded-2xl" />
    </div>
  );

  if (!data) return null;

  const dispute  = data;
  const isMe     = (uid) => uid?.toString() === user?._id?.toString();
  const isAdmin  = user?.role === 'admin';
  const isClosed = ['resolved','closed'].includes(dispute.status);
  const isRaiser = dispute.raisedBy?._id?.toString() === user?._id?.toString();
  const sc       = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;

  const canRate = isClosed && isRaiser && !dispute.satisfactionRating;
  const basePath = isAdmin ? '/admin' : user?.role === 'labour' ? '/labour' : '/client';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black text-gray-400">{dispute.disputeId}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                dispute.priority === 'urgent' ? 'bg-red-50 text-red-600 border border-red-200'
                : dispute.priority === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>{dispute.priority}</span>
            </div>
            <h1 className="font-bold text-lg text-gray-900 leading-snug">{dispute.title}</h1>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <img src={dispute.raisedBy?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dispute.raisedBy?.name||'U')}&background=3b82f6&color=fff&size=32`}
              className="w-8 h-8 rounded-lg" alt="" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-blue-500">RAISED BY</p>
              <p className="text-xs font-bold text-gray-800 truncate">{dispute.raisedBy?.name}</p>
              <p className="text-[10px] text-gray-400 capitalize">{dispute.raisedByRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
            <img src={dispute.against?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dispute.against?.name||'U')}&background=ef4444&color=fff&size=32`}
              className="w-8 h-8 rounded-lg" alt="" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-red-500">AGAINST</p>
              <p className="text-xs font-bold text-gray-800 truncate">{dispute.against?.name}</p>
              <p className="text-[10px] text-gray-400 capitalize">{dispute.againstRole}</p>
            </div>
          </div>
        </div>

        {/* Job */}
        {dispute.job && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-3">
            <Briefcase className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{dispute.job?.title}</p>
              <p className="text-[10px] text-gray-400 capitalize">{dispute.job?.category}</p>
            </div>
            {dispute.amount && <span className="text-xs font-black text-red-600">₹{dispute.amount.toLocaleString()}</span>}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">{dispute.description}</p>

        {/* Due date */}
        {dispute.dueDate && !isClosed && (
          <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${
            new Date(dispute.dueDate) < new Date() ? 'text-red-600' : 'text-amber-600'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {new Date(dispute.dueDate) < new Date() ? '⚠️ Response overdue' : `Expected by ${formatDate(dispute.dueDate)}`}
          </div>
        )}

        {/* Resolution */}
        {dispute.resolution && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-bold text-green-800">{RESOLUTION_LABELS[dispute.resolution]}</p>
            {dispute.resolutionNote && <p className="text-xs text-green-700 mt-1">{dispute.resolutionNote}</p>}
            {dispute.resolvedAt && <p className="text-[10px] text-green-500 mt-1">Resolved {formatDate(dispute.resolvedAt)}</p>}
          </div>
        )}

        {/* Satisfaction rating */}
        {dispute.satisfactionRating && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= dispute.satisfactionRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />)}</div>
            <p className="text-xs text-gray-500">{dispute.satisfactionNote}</p>
          </div>
        )}
      </div>

      {/* Rate resolution */}
      {canRate && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-800 mb-2">Rate the resolution</p>
          {!showRating ? (
            <button onClick={() => setShowRating(true)}
              className="text-xs font-bold text-amber-700 underline">Give feedback →</button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-1">{[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}</div>
              <input value={ratingNote} onChange={e => setRatingNote(e.target.value)}
                placeholder="Optional feedback…"
                className="w-full px-3 py-2 rounded-xl border border-amber-200 text-sm" />
              <button onClick={() => rateMut.mutate()} disabled={!rating || rateMut.isPending}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-40">
                Submit Rating
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message thread */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-orange-400" />
            Discussion Thread
            <span className="text-xs font-normal text-gray-400">({dispute.messages?.length || 0} messages)</span>
          </p>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {dispute.messages?.length === 0
            ? <div className="text-center py-8 text-gray-400 text-sm">No messages yet. Start the conversation.</div>
            : dispute.messages?.map((m, i) => (
                <MessageBubble key={i} msg={m} isMe={isMe(m.sender?._id)} isAdmin={m.senderRole === 'admin'} />
              ))
          }
          <div ref={msgEnd} />
        </div>

        {/* Message input */}
        {!isClosed && (
          <div className="px-4 pb-4 border-t border-gray-50 pt-3">
            <div className="flex gap-2">
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (msg.trim()) msgMut.mutate(); }}}
                rows={2}
                placeholder="Type a message… (Enter to send)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <button onClick={() => { if (msg.trim()) msgMut.mutate(); }}
                disabled={!msg.trim() || msgMut.isPending}
                className="px-4 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {isClosed && (
          <div className="px-4 pb-4 pt-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Messaging closed — dispute {dispute.status}
          </div>
        )}
      </div>

      {/* Timeline */}
      {dispute.timeline?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> Activity Timeline
          </h3>
          <div className="relative space-y-1">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-100" />
            {[...dispute.timeline].reverse().map((t, i) => (
              <div key={i} className="flex gap-3 pl-1 pb-3">
                <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center flex-shrink-0 z-10">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{t.event}</p>
                  {t.note && <p className="text-[11px] text-gray-500">{t.note}</p>}
                  <p className="text-[10px] text-gray-400">{t.actor} · {timeAgo(t.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}