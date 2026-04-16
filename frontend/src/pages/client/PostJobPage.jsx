import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, X, Zap, ChevronDown } from 'lucide-react';
import api from '@/services/api';
import { Alert } from '@/components/common/UIComponents';
import ProfileGateBanner from '@/components/common/ProfileGateBanner';
import { useProfileGate } from '@/hooks/useProfileGate';
import Spinner from '@/components/common/Spinner';
import { JOB_CATEGORIES } from '@/utils/helpers';
import { INDIA_STATES }  from '@/utils/indiaData';
import toast from 'react-hot-toast';

const INITIAL = {
  title: '', description: '', category: '', budgetType: 'daily',
  budgetMin: '', budgetMax: '', startDate: '', endDate: '',
  duration: '', totalLabourNeeded: 1, isUrgent: false, isGroupJob: false,
  location: { address: '', city: '', state: '', pincode: '', coordinates: [0, 0] },
  tags: [],
};

const PostJobPage = () => {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [form,         setForm]         = useState(INITIAL);
  const [tagInput,     setTagInput]     = useState('');
  const [reqInput,     setReqInput]     = useState({ skill: '', count: 1 });
  const [requirements, setRequirements] = useState([]);
  const [error,        setError]        = useState('');
  const [stateOpen,    setStateOpen]    = useState(false);
  const [cityOpen,     setCityOpen]     = useState(false);
  const [stateQ,       setStateQ]       = useState('');
  const [cityQ,        setCityQ]        = useState('');

  // ── Send as JSON so objects are preserved correctly ──────────────────────────
  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title:             form.title,
        description:       form.description,
        category:          form.category,
        budgetType:        form.budgetType,
        budgetMin:         Number(form.budgetMin),
        budgetMax:         Number(form.budgetMax),
        startDate:         form.startDate,
        endDate:           form.endDate           || undefined,
        duration:          form.duration          || undefined,
        totalLabourNeeded: Number(form.totalLabourNeeded),
        isUrgent:          form.isUrgent,
        isGroupJob:        form.isGroupJob,
        location:          form.location,          // object — not stringified
        requirements:      requirements,           // array  — not stringified
        tags:              form.tags,              // array  — not stringified
      };
      return api.post('/jobs', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries(['my-postings']);
      qc.invalidateQueries(['jobs']);
      toast.success('🎉 Job posted! Workers will be notified.');
      navigate('/client/jobs');
    },
    onError: (err) => setError(err.message || 'Failed to post job'),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const set    = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setLoc = (field, value) => setForm(f => ({ ...f, location: { ...f.location, [field]: value } }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t]);
      setTagInput('');
    }
  };
  const removeTag = (t) => set('tags', form.tags.filter(x => x !== t));

  const addReq = () => {
    if (!reqInput.skill.trim()) return;
    setRequirements(r => [...r, { skill: reqInput.skill.trim(), count: Number(reqInput.count) }]);
    setReqInput({ skill: '', count: 1 });
  };
  const removeReq = (skill) => setRequirements(r => r.filter(x => x.skill !== skill));

  const { canAct, gateType } = useProfileGate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.category)  { setError('Please select a job category'); return; }
    if (!form.budgetMin) { setError('Please enter minimum budget');   return; }
    if (!form.budgetMax) { setError('Please enter maximum budget');   return; }
    setError('');
    mutation.mutate();
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Post a Job</h1>
        <p className="text-slate-500 mt-1">Fill in the details and start receiving applications.</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Job Details ── */}
        <div className="card card-body space-y-4">
          <p className="text-sm font-semibold text-slate-700">Job Details</p>

          <div>
            <label className="label">Job Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Need 2 Plumbers for house renovation"
              required maxLength={100}
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              className="input resize-none" rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the work, tools needed, any specific requirements..."
              required
            />
          </div>

          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)} required>
              <option value="">Select category...</option>
              {JOB_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Workers Needed *</label>
              <input
                type="number" className="input" min={1} max={100}
                value={form.totalLabourNeeded}
                onChange={e => set('totalLabourNeeded', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Payment Type</label>
              <select className="input" value={form.budgetType} onChange={e => set('budgetType', e.target.value)}>
                <option value="daily">Per Day</option>
                <option value="fixed">Fixed</option>
                <option value="hourly">Per Hour</option>
              </select>
            </div>
            <div>
              <label className="label">Min. Budget (₹) *</label>
              <input
                type="number" className="input" min={0}
                value={form.budgetMin}
                onChange={e => set('budgetMin', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Max. Budget (₹) *</label>
              <input
                type="number" className="input" min={0}
                value={form.budgetMax}
                onChange={e => set('budgetMax', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date" className="input"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date" className="input"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Duration <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              className="input"
              value={form.duration}
              onChange={e => set('duration', e.target.value)}
              placeholder="e.g. 3 days, 1 week"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" className="w-4 h-4 rounded text-accent"
                checked={form.isUrgent}
                onChange={e => set('isUrgent', e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-accent" /> Urgent
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" className="w-4 h-4 rounded text-primary"
                checked={form.isGroupJob}
                onChange={e => set('isGroupJob', e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700">Group / Team Job</span>
            </label>
          </div>
        </div>

        {/* ── Location ── */}
        <div className="card card-body space-y-4">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" /> Work Location
          </p>

          <div>
            <label className="label">Address *</label>
            <input
              className="input"
              value={form.location.address}
              onChange={e => setLoc('address', e.target.value)}
              placeholder="Building / street / landmark"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* State dropdown */}
            <div className="relative">
              <label className="label">State</label>
              <button type="button" onClick={() => setStateOpen(o => !o)}
                className="input flex items-center justify-between cursor-pointer w-full text-left">
                <span className={form.location.state ? '' : 'text-slate-400'}>{form.location.state || 'Select state'}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${stateOpen ? 'rotate-180' : ''}`} />
              </button>
              {stateOpen && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <input value={stateQ} onChange={e => setStateQ(e.target.value)} placeholder="Search state…" autoFocus
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-orange-400" />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {INDIA_STATES.filter(s => s.state.toLowerCase().includes(stateQ.toLowerCase())).map(s => (
                      <button key={s.state} type="button"
                        onClick={() => { setLoc('state', s.state); setLoc('city', ''); setStateOpen(false); setStateQ(''); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${form.location.state === s.state ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-orange-50 hover:text-orange-700'}`}>
                        {s.state}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* City dropdown */}
            <div className="relative">
              <label className="label">City *</label>
              <button type="button" disabled={!form.location.state}
                onClick={() => form.location.state && setCityOpen(o => !o)}
                className={`input flex items-center justify-between w-full text-left ${form.location.state ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                <span className={form.location.city ? '' : 'text-slate-400'}>
                  {form.location.city || (form.location.state ? 'Select city' : 'Select state first')}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
              </button>
              {cityOpen && form.location.state && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <input value={cityQ} onChange={e => setCityQ(e.target.value)} placeholder="Search city…" autoFocus
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-orange-400" />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {(INDIA_STATES.find(s => s.state === form.location.state)?.cities || [])
                      .filter(c => c.toLowerCase().includes(cityQ.toLowerCase()))
                      .map(c => (
                        <button key={c} type="button"
                          onClick={() => { setLoc('city', c); setCityOpen(false); setCityQ(''); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${form.location.city === c ? 'bg-orange-50 text-orange-700 font-semibold' : 'hover:bg-orange-50 hover:text-orange-700'}`}>
                          {c}
                        </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="label">Pincode</label>
              <input className="input" value={form.location.pincode}
                onChange={e => setLoc('pincode', e.target.value.replace(/\D/g,''))} maxLength={6} placeholder="6-digit pincode" />
            </div>
          </div>
        </div>

        {/* ── Skill Requirements ── */}
        <div className="card card-body space-y-3">
          <p className="text-sm font-semibold text-slate-700">Skill Requirements <span className="text-slate-400 font-normal">(optional)</span></p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Skill (e.g. Plumbing)"
              value={reqInput.skill}
              onChange={e => setReqInput({ ...reqInput, skill: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addReq())}
            />
            <input
              type="number" className="input w-20" min={1}
              value={reqInput.count}
              onChange={e => setReqInput({ ...reqInput, count: e.target.value })}
            />
            <button type="button" onClick={addReq} className="btn-outline btn flex-shrink-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {requirements.length > 0 && (
            <div className="space-y-2">
              {requirements.map(r => (
                <div key={r.skill} className="flex items-center justify-between px-3 py-2 bg-surface-50 rounded-xl border border-surface-200">
                  <span className="text-sm font-medium">{r.skill}</span>
                  <div className="flex items-center gap-3">
                    <span className="badge-blue badge">{r.count} needed</span>
                    <button type="button" onClick={() => removeReq(r.skill)} className="text-slate-400 hover:text-danger">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tags ── */}
        <div className="card card-body space-y-3">
          <p className="text-sm font-semibold text-slate-700">Tags <span className="text-slate-400 font-normal">(optional)</span></p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={tagInput}
              placeholder="e.g. urgent, outdoor, tools-provided"
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="btn-outline btn">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map(t => (
                <span key={t} className="badge-gray badge">
                  #{t}
                  <button type="button" onClick={() => removeTag(t)}>
                    <X className="w-3 h-3 ml-1" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-accent btn w-full btn-lg"
          disabled={mutation.isPending || !canAct}
        >
          {mutation.isPending
            ? <><Spinner size="sm" color="text-white" /> Posting...</>
            : 'Post Job'
          }
        </button>

      </form>
    </div>
  );
};

export default PostJobPage;