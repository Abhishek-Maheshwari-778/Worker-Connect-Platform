import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  AlertTriangle, FileText, Briefcase, User,
  IndianRupee, ArrowLeft, Send, Shield,
  Clock, CheckCircle, Info
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import jobService     from '@/services/jobService';
import disputeService from '@/services/disputeService';
import toast from 'react-hot-toast';

const DISPUTE_TYPES = [
  { value: 'payment_not_made',  label: 'Payment Not Made',       icon: IndianRupee,   desc: 'Client did not pay agreed wages',           forRole: 'labour' },
  { value: 'work_not_done',     label: 'Work Not Done',          icon: Briefcase,     desc: 'Labour did not complete agreed work',       forRole: 'client' },
  { value: 'work_quality',      label: 'Poor Work Quality',      icon: AlertTriangle, desc: 'Work done was below expected standards',    forRole: 'client' },
  { value: 'harassment',        label: 'Harassment',             icon: Shield,        desc: 'Verbal, physical or online harassment',     forRole: 'both'   },
  { value: 'fraud',             label: 'Fraud / Scam',           icon: AlertTriangle, desc: 'Fraudulent behaviour or misrepresentation', forRole: 'both'   },
  { value: 'contract_breach',   label: 'Contract Breach',        icon: FileText,      desc: 'Terms of the job agreement were violated',  forRole: 'both'   },
  { value: 'unsafe_conditions', label: 'Unsafe Work Conditions', icon: AlertTriangle, desc: 'Dangerous or unsafe working environment',   forRole: 'labour' },
  { value: 'other',             label: 'Other',                  icon: Info,          desc: 'Any other issue not listed above',          forRole: 'both'   },
];

const SLA = {
  payment_not_made: { days: 3, priority: 'high'   },
  harassment:       { days: 1, priority: 'urgent' },
  fraud:            { days: 2, priority: 'urgent' },
  unsafe_conditions:{ days: 1, priority: 'urgent' },
  work_not_done:    { days: 3, priority: 'high'   },
  work_quality:     { days: 5, priority: 'medium' },
  contract_breach:  { days: 5, priority: 'medium' },
  other:            { days: 7, priority: 'medium' },
};

export default function RaiseDisputePage() {
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const { user }     = useAuth();

  const [form, setForm] = useState({
    jobId: params.get('jobId') || '', againstUserId: params.get('against') || '',
    type: '', title: '', description: '', amount: '',
  });
  const [step, setStep] = useState(1);

  const { data: jobsData } = useQuery({
    queryKey: ['dispute-jobs'],
    queryFn: () => user?.role === 'client'
      ? jobService.getMyPostings({ limit: 50 }).then(r => r.data.data)
      : jobService.getMyApplications({ limit: 50 }).then(r => r.data.data),
    enabled: !!user,
  });

  const jobs = (jobsData || []).filter(j =>
    user?.role === 'client' ? (j.hiredLabourers?.length > 0) : (j.myApplication?.status === 'accepted')
  );

  const selectedJob = jobs.find(j => j._id === form.jobId);
  const opponents = selectedJob
    ? user?.role === 'client'
      ? (selectedJob.hiredLabourers || []).map(h => ({ _id: (h.labour?._id || h.labour)?.toString(), name: h.labour?.name || 'Worker', role: 'labour' }))
      : [{ _id: (selectedJob.postedBy?._id || selectedJob.postedBy)?.toString(), name: selectedJob.postedBy?.name || 'Client', role: 'client' }]
    : [];

  const types = DISPUTE_TYPES.filter(t => t.forRole === 'both' || t.forRole === user?.role);
  const sla   = SLA[form.type] || { days: 7, priority: 'medium' };

  const mut = useMutation({
    mutationFn: () => disputeService.raise({
      jobId: form.jobId, againstUserId: form.againstUserId,
      type: form.type, title: form.title, description: form.description,
      amount: form.amount ? Number(form.amount) : undefined,
    }),
    onSuccess: (res) => {
      toast.success(`Dispute ${res.data.data.disputeId} raised successfully`);
      navigate(user?.role === 'labour' ? '/labour/disputes' : '/client/disputes');
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  const STEPS = ['Select Job', 'Details', 'Review'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

      {/* Back + Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Raise a Dispute</h1>
          <p className="text-sm text-gray-500">Report a conflict — admin will mediate</p>
        </div>
      </div>

      {/* Step bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-1 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
              step > i+1 ? 'bg-green-500 text-white' : step === i+1 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>{step > i+1 ? '✓' : i+1}</div>
            <span className={`text-[11px] font-bold hidden sm:block mr-1 ${step >= i+1 ? 'text-gray-700' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${step > i+1 ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-gray-800">Which job is this about?</h2>
          {jobs.length === 0
            ? <div className="text-center py-8 text-gray-400"><Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No eligible jobs found</p></div>
            : <div className="space-y-2">{jobs.map(j => (
                <button key={j._id} onClick={() => setForm(f => ({...f, jobId: j._id, againstUserId: ''}))}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${form.jobId === j._id ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{j.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{j.category} · {j.status}</p>
                  </div>
                  {form.jobId === j._id && <CheckCircle className="w-5 h-5 text-orange-500" />}
                </button>
              ))}</div>
          }

          {selectedJob && opponents.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-gray-700 mb-2">Dispute against:</h3>
              {opponents.map(op => (
                <button key={op._id} onClick={() => setForm(f => ({...f, againstUserId: op._id}))}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${form.againstUserId === op._id ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-red-200'}`}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(op.name||'U')}&background=ef4444&color=fff&size=36`} className="w-9 h-9 rounded-xl" alt="" />
                  <div className="flex-1"><p className="font-bold text-sm text-gray-900">{op.name}</p><p className="text-xs text-gray-400 capitalize">{op.role}</p></div>
                  {form.againstUserId === op._id && <CheckCircle className="w-5 h-5 text-red-500" />}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => setStep(2)} disabled={!form.jobId || !form.againstUserId}
            className="w-full py-3 rounded-2xl bg-orange-500 text-white font-bold disabled:opacity-40 hover:bg-orange-600 transition-colors">
            Continue →
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-gray-800">Describe the issue</h2>

          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Issue Type *</p>
            <div className="grid grid-cols-2 gap-2">
              {types.map(t => { const Icon = t.icon; return (
                <button key={t.value} onClick={() => setForm(f => ({...f, type: t.value}))}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${form.type === t.value ? 'border-red-400 bg-red-50' : 'border-gray-100 hover:border-red-200'}`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${form.type === t.value ? 'text-red-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-bold ${form.type === t.value ? 'text-red-700' : 'text-gray-700'}`}>{t.label}</p>
                    <p className="text-[10px] text-gray-400">{t.desc}</p>
                  </div>
                </button>
              );})}
            </div>
          </div>

          {form.type && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-amber-800 font-semibold">
                {sla.priority === 'urgent' ? '🔴 Urgent' : sla.priority === 'high' ? '🟠 High Priority' : '🟡 Standard'}
                {' · '}Admin responds within <strong>{sla.days} day{sla.days > 1 ? 's' : ''}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Title * <span className="font-normal text-gray-400">({form.title.length}/150)</span></label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value.slice(0,150)}))}
              placeholder="e.g. Payment of ₹3000 not received after job completion"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">Description * <span className="font-normal text-gray-400">({form.description.length}/3000)</span></label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value.slice(0,3000)}))}
              rows={5} placeholder="Describe exactly what happened, when, what was agreed, and what went wrong. Be specific."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
          </div>

          {['payment_not_made','fraud','contract_breach'].includes(form.type) && (
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Disputed Amount (₹) <span className="font-normal text-gray-400">optional</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))}
                  placeholder="0" className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">← Back</button>
            <button onClick={() => setStep(3)} disabled={!form.type || form.title.length < 10 || form.description.length < 30}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-40 hover:bg-orange-600 transition-colors">Review →</button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-gray-800">Review & Submit</h2>
          <div className="bg-red-50 rounded-2xl border border-red-100 p-5 space-y-3 text-sm">
            <div><p className="text-[10px] font-bold text-red-400">JOB</p><p className="font-bold text-gray-900">{selectedJob?.title}</p></div>
            <div><p className="text-[10px] font-bold text-red-400">AGAINST</p><p className="font-bold text-gray-900">{opponents.find(o => o._id === form.againstUserId)?.name}</p></div>
            <div><p className="text-[10px] font-bold text-red-400">TYPE</p><p className="font-bold text-gray-900">{types.find(t => t.value === form.type)?.label}</p></div>
            <div><p className="text-[10px] font-bold text-red-400">TITLE</p><p className="font-semibold text-gray-800">{form.title}</p></div>
            <div><p className="text-[10px] font-bold text-red-400">DESCRIPTION</p><p className="text-gray-700 leading-relaxed">{form.description}</p></div>
            {form.amount && <div><p className="text-[10px] font-bold text-red-400">DISPUTED AMOUNT</p><p className="font-bold text-red-700">₹{Number(form.amount).toLocaleString()}</p></div>}
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">By submitting you confirm this information is accurate. Admin responds within <strong>{sla.days} days</strong>.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">← Edit</button>
            <button onClick={() => mut.mutate()} disabled={mut.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
              {mut.isPending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit Dispute</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}