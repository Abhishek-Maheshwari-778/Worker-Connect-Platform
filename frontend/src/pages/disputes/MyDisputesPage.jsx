import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, CheckCircle, MessageCircle,
  Plus, ChevronRight, Shield, Star, XCircle,
  Briefcase, User, ArrowUpRight, Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import disputeService from '@/services/disputeService';
import { timeAgo, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  open:               { label: 'Open',             cls: 'bg-blue-100 text-blue-800 border-blue-200',     dot: 'bg-blue-500'    },
  under_review:       { label: 'Under Review',     cls: 'bg-amber-100 text-amber-800 border-amber-200',  dot: 'bg-amber-500'   },
  awaiting_response:  { label: 'Your Response Needed', cls: 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse', dot: 'bg-orange-500' },
  resolved:           { label: 'Resolved',         cls: 'bg-green-100 text-green-800 border-green-200',  dot: 'bg-green-500'   },
  closed:             { label: 'Closed',            cls: 'bg-gray-100 text-gray-600 border-gray-200',     dot: 'bg-gray-400'    },
  escalated:          { label: 'Escalated',         cls: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
};

const PRIORITY_CONFIG = {
  urgent: 'text-red-600 bg-red-50 border-red-200',
  high:   'text-orange-600 bg-orange-50 border-orange-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-blue-600 bg-blue-50 border-blue-200',
};

const TYPE_LABELS = {
  payment_not_made: 'Payment Not Made', work_not_done: 'Work Not Done',
  work_quality: 'Poor Work Quality', harassment: 'Harassment',
  fraud: 'Fraud', contract_breach: 'Contract Breach',
  unsafe_conditions: 'Unsafe Conditions', other: 'Other',
};

const RESOLUTION_LABELS = {
  favour_client:      '✅ Decided in favour of client',
  favour_labour:      '✅ Decided in favour of worker',
  mutual_agreement:   '🤝 Resolved by mutual agreement',
  no_action:          '📁 No action required',
  escalated_external: '⬆️ Escalated externally',
};

function DisputeCard({ dispute, userId }) {
  const isRaiser = dispute.raisedBy?._id === userId;
  const other    = isRaiser ? dispute.against : dispute.raisedBy;
  const sc       = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
  const unread   = (dispute.messages || []).filter(m => !m.readBy?.includes(userId) && m.sender?._id !== userId).length;

  return (
    <Link to={`/disputes/${dispute._id}`}
      className="block bg-white rounded-2xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group p-5">

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-gray-400">{dispute.disputeId}</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sc.cls} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${PRIORITY_CONFIG[dispute.priority]}`}>
            {dispute.priority}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {unread > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
              {unread}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 text-sm mb-2 group-hover:text-orange-700 transition-colors line-clamp-2">
        {dispute.title}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap mb-3">
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          <span className="truncate max-w-[150px]">{dispute.job?.title}</span>
        </span>
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {other?.name}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {timeAgo(dispute.createdAt)}
        </span>
      </div>

      {/* Type badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {TYPE_LABELS[dispute.type] || dispute.type}
        </span>
        {dispute.amount && (
          <span className="text-xs font-black text-red-600">₹{dispute.amount?.toLocaleString()}</span>
        )}
      </div>

      {/* Resolution */}
      {dispute.resolution && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs font-semibold text-green-700">{RESOLUTION_LABELS[dispute.resolution]}</p>
          {dispute.resolutionNote && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{dispute.resolutionNote}</p>
          )}
        </div>
      )}

      {/* SLA warning */}
      {dispute.dueDate && !['resolved','closed'].includes(dispute.status) && (
        <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-semibold ${
          new Date(dispute.dueDate) < new Date() ? 'text-red-600' : 'text-amber-600'
        }`}>
          <Clock className="w-3 h-3" />
          {new Date(dispute.dueDate) < new Date()
            ? `⚠️ Overdue — was due ${formatDate(dispute.dueDate)}`
            : `Due ${formatDate(dispute.dueDate)}`
          }
        </div>
      )}
    </Link>
  );
}

export default function MyDisputesPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const [filter,  setFilter] = useState('');
  const basePath  = user?.role === 'labour' ? '/labour' : '/client';

  const { data, isLoading } = useQuery({
    queryKey: ['my-disputes', filter],
    queryFn:  () => disputeService.getMyDisputes({ status: filter || undefined, limit: 30 }).then(r => r.data),
  });

  const disputes = data?.data || [];
  const total    = data?.meta?.total || 0;

  const open     = disputes.filter(d => !['resolved','closed'].includes(d.status)).length;
  const resolved = disputes.filter(d => ['resolved','closed'].includes(d.status)).length;
  const needsResp= disputes.filter(d => d.status === 'awaiting_response').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">My Disputes</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total · {open} active · {resolved} resolved</p>
        </div>
        <Link to={`${basePath}/disputes/raise`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-bold hover:from-red-600 hover:to-red-700 shadow-md shadow-red-200 transition-all flex-shrink-0">
          <Plus className="w-4 h-4" /> Raise Dispute
        </Link>
      </div>

      {/* Needs response alert */}
      {needsResp > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border-2 border-orange-300 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-800">Response Needed</p>
            <p className="text-xs text-orange-600">{needsResp} dispute{needsResp > 1 ? 's' : ''} require{needsResp === 1 ? 's' : ''} your response</p>
          </div>
          <ChevronRight className="w-4 h-4 text-orange-400" />
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'All' },
          { value: 'open,under_review,awaiting_response', label: 'Active' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'closed', label: 'Closed' },
        ].map(f => (
          <button key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
              filter === f.value
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))}</div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-500 text-lg">No disputes found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter ? 'Try a different filter' : 'You have no disputes yet'}
          </p>
          {!filter && (
            <Link to={`${basePath}/disputes/raise`}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              <Plus className="w-4 h-4" /> Raise a Dispute
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <DisputeCard key={d._id} dispute={d} userId={user?._id} />
          ))}
        </div>
      )}
    </div>
  );
}