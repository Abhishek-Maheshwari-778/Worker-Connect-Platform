import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, ShieldX, FileText, Eye, ExternalLink,
  User, Building2, Clock, CheckCircle, X,
  Loader2, AlertTriangle, Download
} from 'lucide-react';
import adminService from '@/services/adminService';
import Avatar from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/UIComponents';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

/* ── Safe Document Viewer ──────────────────────────────────────────────────── */
/* Opens Cloudinary URL safely — avoids chrome-error:// iframe restriction    */
const DocViewer = ({ url, onClose }) => {
  if (!url) return null;

  // Detect PDF: Cloudinary raw uploads contain '/raw/upload/' in the URL
  // or file extension is .pdf
  const isPdf = url.includes('/raw/upload/') ||
                url.toLowerCase().endsWith('.pdf') ||
                url.toLowerCase().includes('.pdf?');

  // For Cloudinary PDFs stored as 'raw': the direct URL works fine in a new tab.
  // Google Docs viewer fails with 401 because it tries to re-fetch from Cloudinary
  // which requires auth on raw resources.
  // Best solution: for PDF, show a clean "open in tab" screen instead of broken iframe.

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <span className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            {isPdf ? 'PDF Document' : 'Aadhaar Document'}
          </span>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
            </a>
            <a href={url} download="aadhaar-document"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document content */}
        <div className="flex-1 overflow-hidden bg-gray-50" style={{ minHeight: '300px' }}>
          {isPdf ? (
            /* PDF: Cannot be embedded due to Cloudinary auth on raw resources.
               Show a clean action panel instead. */
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
              <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center">
                <FileText className="w-10 h-10 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">PDF Document</p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF files cannot be previewed inline.<br />
                  Open in a new tab to review the document.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
                >
                  <ExternalLink className="w-4 h-4" /> Open PDF
                </a>
                <a
                  href={url}
                  download="aadhaar-document.pdf"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            </div>
          ) : (
            /* Image: show directly */
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={url}
                alt="Aadhaar Document"
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg"
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none' }} className="flex-col items-center gap-3 text-gray-500">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <p className="text-sm font-medium">Cannot preview this image</p>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Review Modal ──────────────────────────────────────────────────────────── */
const ReviewModal = ({ profile, onClose }) => {
  const qc = useQueryClient();
  const [note,    setNote]    = useState('');
  const [viewing, setViewing] = useState(false);
  const isClient = profile.profileType === 'client';

  const mutation = useMutation({
    mutationFn: (action) => adminService.reviewVerification(profile._id, {
      action, reviewNote: note, profileType: profile.profileType,
    }),
    onSuccess: (_, action) => {
      qc.invalidateQueries(['admin-verifications']);
      toast.success(`✅ Verification ${action} successfully!`);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  const docUrl = profile.aadhaarDoc?.url;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(6px)', background: 'rgba(15,23,42,0.6)' }}>
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in">

          {/* Header */}
          <div className={`px-6 py-4 flex items-center justify-between ${isClient ? 'bg-blue-50 border-b border-blue-100' : 'bg-orange-50 border-b border-orange-100'}`}>
            <div>
              <h3 className="font-display font-bold text-gray-900">Review Aadhaar Document</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isClient ? 'Client Identity Verification' : 'Labour Identity Verification'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isClient ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {isClient ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {isClient ? 'Client' : 'Labour'}
              </span>
              <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* User info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <Avatar src={profile.user?.avatar?.url} name={profile.user?.name} size="lg" />
              <div>
                <p className="font-bold text-gray-900">{profile.user?.name}</p>
                <p className="text-sm text-gray-500">{profile.user?.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submitted: {formatDate(profile.updatedAt)}
                </p>
              </div>
            </div>

            {/* Document preview thumbnail */}
            {docUrl ? (
              <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" /> Aadhaar Document
                  </span>
                  <button
                    onClick={() => setViewing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Document
                  </button>
                </div>

                {/* Thumbnail — only for images */}
                {!docUrl.toLowerCase().includes('.pdf') ? (
                  <img
                    src={docUrl}
                    alt="Aadhaar"
                    className="w-full max-h-48 object-contain bg-gray-100 p-2 cursor-pointer"
                    onClick={() => setViewing(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 bg-gray-50 gap-2 cursor-pointer"
                    onClick={() => setViewing(true)}>
                    <FileText className="w-8 h-8 text-gray-400" />
                    <p className="text-xs text-gray-500 font-medium">PDF Document — click to view</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <p className="text-sm text-red-600 font-medium">No document uploaded</p>
              </div>
            )}

            {/* Review note */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Review Note <span className="normal-case font-normal text-gray-400">(optional — sent to user if rejected)</span>
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                rows={2}
                placeholder="e.g. Please upload a clearer photo with all 4 corners visible…"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate('rejected')}
              disabled={mutation.isPending}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
              Reject
            </button>
            <button
              onClick={() => mutation.mutate('approved')}
              disabled={mutation.isPending}
              className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Approve
            </button>
          </div>
        </div>
      </div>

      {/* Safe document viewer */}
      {viewing && <DocViewer url={docUrl} onClose={() => setViewing(false)} />}
    </>
  );
};

/* ── Verification Card ─────────────────────────────────────────────────────── */
const VerifCard = ({ profile, onReview }) => {
  const isClient = profile.profileType === 'client';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className={`h-1 w-full rounded-t-2xl ${isClient ? 'bg-blue-400' : 'bg-orange-400'}`} />
      <div className="p-4 flex items-center gap-4">
        {/* Avatar + type badge */}
        <div className="relative flex-shrink-0">
          <Avatar src={profile.user?.avatar?.url} name={profile.user?.name} size="md" />
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${isClient ? 'bg-blue-500' : 'bg-orange-500'}`}>
            {isClient
              ? <Building2 className="w-2.5 h-2.5 text-white" />
              : <User className="w-2.5 h-2.5 text-white" />
            }
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-sm">{profile.user?.name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isClient ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
              {isClient ? 'Client' : 'Labour'}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{profile.user?.email}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Submitted {formatDate(profile.updatedAt)}
          </p>
        </div>

        {/* Document thumbnail */}
        {profile.aadhaarDoc?.url && !profile.aadhaarDoc.url.includes('.pdf') && (
          <img
            src={profile.aadhaarDoc.url}
            alt="doc"
            className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0 hidden sm:block"
          />
        )}
        {profile.aadhaarDoc?.url?.includes('.pdf') && (
          <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 hidden sm:flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
          <button
            onClick={() => onReview(profile)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" /> Review
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Section with header ───────────────────────────────────────────────────── */
const Section = ({ title, icon: Icon, color, count, profiles, onReview, loading }) => (
  <div className="space-y-3">
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${color}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <h2 className="font-display font-bold text-sm">{title}</h2>
      <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-white/60">
        {count} pending
      </span>
    </div>
    {loading ? (
      <div className="space-y-3">
        {[1,2].map(i => <div key={i} className="h-20 skeleton rounded-2xl animate-pulse" />)}
      </div>
    ) : profiles.length > 0 ? (
      profiles.map(p => <VerifCard key={p._id} profile={p} onReview={onReview} />)
    ) : (
      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 text-gray-400 text-sm">
        <CheckCircle className="w-5 h-5 text-green-400" />
        All caught up — no pending {title.toLowerCase()} verifications
      </div>
    )}
  </div>
);

/* ── MAIN PAGE ─────────────────────────────────────────────────────────────── */
const AdminVerificationsPage = () => {
  const [selected, setSelected] = useState(null);

  const { data: labourData, isLoading: labourLoading } = useQuery({
    queryKey: ['admin-verifications', 'labour'],
    queryFn:  () => adminService.getPendingVerifications({ type: 'labour', limit: 50 }).then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['admin-verifications', 'client'],
    queryFn:  () => adminService.getPendingVerifications({ type: 'client', limit: 50 }).then(r => r.data),
    refetchInterval: 30000,
  });

  const labourProfiles = (labourData?.data || []).map(p => ({ ...p, profileType: 'labour' }));
  const clientProfiles = (clientData?.data || []).map(p => ({ ...p, profileType: 'client' }));
  const totalPending   = labourProfiles.length + clientProfiles.length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="page-title">Identity Verifications</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {totalPending > 0
            ? `${totalPending} document${totalPending !== 1 ? 's' : ''} pending review`
            : 'All caught up — no pending verifications'
          }
        </p>
      </div>

      {/* Labour section */}
      <Section
        title="Labour Verifications"
        icon={User}
        color="bg-orange-50 text-orange-800 border border-orange-200"
        count={labourProfiles.length}
        profiles={labourProfiles}
        onReview={setSelected}
        loading={labourLoading}
      />

      {/* Client section */}
      <Section
        title="Client Verifications"
        icon={Building2}
        color="bg-blue-50 text-blue-800 border border-blue-200"
        count={clientProfiles.length}
        profiles={clientProfiles}
        onReview={setSelected}
        loading={clientLoading}
      />

      {/* Review modal */}
      {selected && (
        <ReviewModal profile={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default AdminVerificationsPage;