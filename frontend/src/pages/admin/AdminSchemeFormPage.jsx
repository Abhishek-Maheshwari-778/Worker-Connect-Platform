import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Plus, Trash2, Eye, Globe,
  Youtube, Phone, Tag, ChevronDown, ChevronUp,
  Star, ToggleLeft, ToggleRight, AlertCircle,
  Loader2, CheckCircle, MapPin, BookOpen,
} from 'lucide-react';
import schemeService from '@/services/schemeService';
import toast from 'react-hot-toast';

/* ── constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'pension',           label: '🏦 Pension'           },
  { value: 'insurance',         label: '🛡️ Insurance'         },
  { value: 'housing',           label: '🏠 Housing'           },
  { value: 'skill_development', label: '📚 Skill Development' },
  { value: 'healthcare',        label: '🏥 Healthcare'        },
  { value: 'social_security',   label: '🔐 Social Security'   },
  { value: 'financial_aid',     label: '💰 Financial Aid'     },
  { value: 'labour_welfare',    label: '👷 Labour Welfare'    },
  { value: 'women_empowerment', label: '👩 Women\'s Welfare'  },
  { value: 'other',             label: '📋 Other'             },
];

const SKILL_LEVELS    = ['unskilled', 'semi_skilled', 'skilled', 'any'];
const DEMOGRAPHICS    = ['all', 'women', 'youth', 'senior', 'rural', 'urban', 'tribal'];
const SOCIO_ECONOMIC  = ['all', 'bpl', 'low_income', 'middle_income', 'any'];
const EMP_STATUSES    = ['all', 'unemployed', 'daily_wage', 'self_employed', 'any'];

const INDIAN_STATES = [
  'National', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

/* ── empty form state ───────────────────────────────────────────────────── */
const EMPTY_FORM = {
  name_en: '', name_hi: '',
  description_en: '', description_hi: '',
  ministry_en: '', ministry_hi: '',
  category: 'pension', state: 'National',
  skillLevel: 'any', demographic: 'all',
  socioEconomic: 'any', employmentStatus: 'any',
  workType: '', industrySector: '',
  ageMin: '', ageMax: '',
  benefitAmount: '',
  helplineNumber: '', helplineLabel: '',
  officialLink: '', portalName: '',
  youtubeVideoId: '', youtubeTitle_en: '', youtubeTitle_hi: '',
  logoUrl: '', logoFallback: '',
  eligibilityCriteria: [{ en: '', hi: '' }],
  benefits:            [{ en: '', hi: '' }],
  documentsRequired:   [{ en: '', hi: '' }],
  applicationSteps:    [{ step: 1, en: '', hi: '' }],
  tags: '',
  isFeatured: false,
  isActive: true,
};

/* ── reusable sub-components ────────────────────────────────────────────── */

/** Bilingual pair row (for eligibility, benefits, documents) */
const BilingualRow = ({ items, onChange, onAdd, onRemove, label }) => (
  <div className="space-y-2.5">
    {items.map((item, i) => (
      <div key={i} className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            className="input text-sm"
            placeholder={`${label} (English)`}
            value={item.en}
            onChange={e => onChange(i, 'en', e.target.value)}
          />
          <input
            className="input text-sm"
            placeholder={`${label} (हिंदी)`}
            value={item.hi}
            onChange={e => onChange(i, 'hi', e.target.value)}
          />
        </div>
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="mt-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
    >
      <Plus className="w-4 h-4" /> Add {label}
    </button>
  </div>
);

/** Step row (has step number) */
const StepRow = ({ items, onChange, onAdd, onRemove }) => (
  <div className="space-y-2.5">
    {items.map((item, i) => (
      <div key={i} className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
          {i + 1}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            className="input text-sm"
            placeholder="Step description (English)"
            value={item.en}
            onChange={e => onChange(i, 'en', e.target.value)}
          />
          <input
            className="input text-sm"
            placeholder="चरण विवरण (हिंदी)"
            value={item.hi}
            onChange={e => onChange(i, 'hi', e.target.value)}
          />
        </div>
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="mt-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
    >
      <Plus className="w-4 h-4" /> Add Step
    </button>
  </div>
);

/** Section wrapper with collapsible header */
const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-surface-50 hover:bg-surface-100 transition-colors border-b border-surface-100"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-orange-600" />
          </div>
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
};

/* ── YouTube preview ──────────────────────────────────────────────────────── */
const YouTubePreview = ({ videoId }) => {
  const [err, setErr] = useState(false);
  useEffect(() => { setErr(false); }, [videoId]);

  if (!videoId) return (
    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
      <Youtube className="w-4 h-4" /> Enter a YouTube video ID to preview
    </div>
  );

  // Thumbnail chain: sddefault → mqdefault → 0 (always exists)
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video w-full max-w-sm relative">
      {!err ? (
        <img
          src={`https://img.youtube.com/vi/${videoId}/sddefault.jpg`}
          alt="YouTube thumbnail"
          className="w-full h-full object-cover"
          onError={e => {
            // Fallback chain
            if (e.target.src.includes('sddefault')) {
              e.target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            } else if (e.target.src.includes('mqdefault')) {
              e.target.src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
            } else {
              setErr(true);
            }
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
          Invalid video ID
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
          <Youtube className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const AdminSchemeFormPage = () => {
  const { id }   = useParams();          // defined on /admin/schemes/:id/edit
  const isEdit   = !!id;
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  /* ── load existing scheme on edit ────────────────────────────────────── */
  const { isLoading: loadingScheme } = useQuery({
    queryKey: ['scheme-admin-edit', id],
    queryFn:  () => schemeService.getSchemeById(id),
    enabled:  isEdit,
    onSuccess: ({ data: s }) => {
      setForm({
        ...EMPTY_FORM,
        ...s,
        tags: Array.isArray(s.tags) ? s.tags.join(', ') : (s.tags || ''),
        eligibilityCriteria: s.eligibilityCriteria?.length ? s.eligibilityCriteria : EMPTY_FORM.eligibilityCriteria,
        benefits:            s.benefits?.length            ? s.benefits            : EMPTY_FORM.benefits,
        documentsRequired:   s.documentsRequired?.length   ? s.documentsRequired   : EMPTY_FORM.documentsRequired,
        applicationSteps:    s.applicationSteps?.length    ? s.applicationSteps    : EMPTY_FORM.applicationSteps,
        ageMin: s.ageMin ?? '',
        ageMax: s.ageMax ?? '',
      });
    },
  });

  /* ── field helpers ───────────────────────────────────────────────────── */
  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const updateArray = (field, i, key, val) => {
    setForm(f => {
      const arr = [...f[field]];
      arr[i] = { ...arr[i], [key]: val };
      return { ...f, [field]: arr };
    });
  };

  const addArrayItem = (field, template) => setForm(f => ({ ...f, [field]: [...f[field], template] }));
  const removeArrayItem = (field, i) => setForm(f => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }));

  /* ── validation ──────────────────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.name_en.trim())         e.name_en        = 'English name is required';
    if (!form.name_hi.trim())         e.name_hi        = 'Hindi name is required';
    if (!form.description_en.trim())  e.description_en = 'English description is required';
    if (!form.description_hi.trim())  e.description_hi = 'Hindi description is required';
    if (!form.category)               e.category       = 'Category is required';
    if (form.officialLink && !/^https?:\/\//.test(form.officialLink)) e.officialLink = 'Must start with http:// or https://';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── submit mutation ─────────────────────────────────────────────────── */
  const mutation = useMutation({
    mutationFn: (payload) => isEdit
      ? schemeService.updateScheme(id, payload)
      : schemeService.createScheme(payload),
    onSuccess: () => {
      qc.invalidateQueries(['admin-schemes']);
      qc.invalidateQueries(['admin-schemes-stats']);
      qc.invalidateQueries(['schemes']);
      toast.success(isEdit ? '✅ Scheme updated!' : '✅ Scheme created! It is now live.', { duration: 4000 });
      navigate('/admin/schemes');
    },
    onError: (e) => toast.error(e.message || 'Failed to save'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      ageMin: form.ageMin ? Number(form.ageMin) : undefined,
      ageMax: form.ageMax ? Number(form.ageMax) : undefined,
      // Auto-generate logoUrl from officialLink if not provided
      logoUrl: form.logoUrl || (form.officialLink
        ? `https://www.google.com/s2/favicons?domain=${new URL(form.officialLink).hostname}&sz=128`
        : ''),
      // Auto-generate portalName from officialLink if not provided
      portalName: form.portalName || (form.officialLink
        ? new URL(form.officialLink).hostname.replace('www.', '')
        : ''),
    };

    mutation.mutate(payload);
  };

  if (loadingScheme) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/schemes')}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Scheme' : 'Create New Scheme'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'Update scheme details' : 'Scheme will be immediately visible to all users once published'}
          </p>
        </div>
      </div>

      {/* ── Validation error banner ──────────────────────────────────────── */}
      {hasErrors && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Please fix the following errors:</p>
            <ul className="text-xs text-red-600 mt-1 space-y-0.5">
              {Object.values(errors).filter(Boolean).map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── 1. Basic Information ─────────────────────────────────────── */}
        <Section title="Basic Information" icon={BookOpen}>

          {/* Names */}
          <div>
            <label className="label">Scheme Name <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  className={`input text-sm ${errors.name_en ? 'border-red-400' : ''}`}
                  placeholder="Full name in English"
                  value={form.name_en}
                  onChange={e => set('name_en', e.target.value)}
                />
                {errors.name_en && <p className="text-xs text-red-500 mt-1">{errors.name_en}</p>}
              </div>
              <div>
                <input
                  className={`input text-sm ${errors.name_hi ? 'border-red-400' : ''}`}
                  placeholder="पूरा नाम हिंदी में"
                  value={form.name_hi}
                  onChange={e => set('name_hi', e.target.value)}
                />
                {errors.name_hi && <p className="text-xs text-red-500 mt-1">{errors.name_hi}</p>}
              </div>
            </div>
          </div>

          {/* Ministry */}
          <div>
            <label className="label">Ministry / Department</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="input text-sm" placeholder="Ministry name in English" value={form.ministry_en} onChange={e => set('ministry_en', e.target.value)} />
              <input className="input text-sm" placeholder="मंत्रालय का नाम हिंदी में" value={form.ministry_hi} onChange={e => set('ministry_hi', e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Short Description <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <textarea
                  className={`input text-sm resize-none ${errors.description_en ? 'border-red-400' : ''}`}
                  rows={3}
                  placeholder="Brief description in English (shown on card)"
                  value={form.description_en}
                  onChange={e => set('description_en', e.target.value)}
                />
                {errors.description_en && <p className="text-xs text-red-500 mt-1">{errors.description_en}</p>}
              </div>
              <div>
                <textarea
                  className={`input text-sm resize-none ${errors.description_hi ? 'border-red-400' : ''}`}
                  rows={3}
                  placeholder="संक्षिप्त विवरण हिंदी में (कार्ड पर दिखेगा)"
                  value={form.description_hi}
                  onChange={e => set('description_hi', e.target.value)}
                />
                {errors.description_hi && <p className="text-xs text-red-500 mt-1">{errors.description_hi}</p>}
              </div>
            </div>
          </div>

          {/* Benefit amount */}
          <div>
            <label className="label">Benefit Amount / Tagline</label>
            <input
              className="input text-sm max-w-sm"
              placeholder="e.g. ₹3,000/month after 60 | ₹2 Lakh cover"
              value={form.benefitAmount}
              onChange={e => set('benefitAmount', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Shown as a green badge on the scheme card</p>
          </div>
        </Section>

        {/* ── 2. Classification ────────────────────────────────────────── */}
        <Section title="Classification & Eligibility Filters" icon={Tag}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Category <span className="text-red-500">*</span></label>
              <select className={`input text-sm ${errors.category ? 'border-red-400' : ''}`} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">State</label>
              <select className="input text-sm" value={form.state} onChange={e => set('state', e.target.value)}>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Skill Level</label>
              <select className="input text-sm" value={form.skillLevel} onChange={e => set('skillLevel', e.target.value)}>
                {SKILL_LEVELS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Demographic</label>
              <select className="input text-sm" value={form.demographic} onChange={e => set('demographic', e.target.value)}>
                {DEMOGRAPHICS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Socio-Economic</label>
              <select className="input text-sm" value={form.socioEconomic} onChange={e => set('socioEconomic', e.target.value)}>
                {SOCIO_ECONOMIC.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Employment Status</label>
              <select className="input text-sm" value={form.employmentStatus} onChange={e => set('employmentStatus', e.target.value)}>
                {EMP_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Min Age</label>
              <input type="number" className="input text-sm" placeholder="e.g. 18" min={0} max={100} value={form.ageMin} onChange={e => set('ageMin', e.target.value)} />
            </div>
            <div>
              <label className="label">Max Age</label>
              <input type="number" className="input text-sm" placeholder="e.g. 60" min={0} max={120} value={form.ageMax} onChange={e => set('ageMax', e.target.value)} />
            </div>
            <div>
              <label className="label">Work Type</label>
              <input className="input text-sm" placeholder="e.g. construction, agriculture" value={form.workType} onChange={e => set('workType', e.target.value)} />
            </div>
          </div>
        </Section>

        {/* ── 3. Eligibility Criteria ──────────────────────────────────── */}
        <Section title="Eligibility Criteria" icon={CheckCircle}>
          <p className="text-xs text-gray-500 -mt-2">List all conditions the applicant must meet (shown with ✅ in the modal)</p>
          <BilingualRow
            items={form.eligibilityCriteria}
            onChange={(i, k, v) => updateArray('eligibilityCriteria', i, k, v)}
            onAdd={() => addArrayItem('eligibilityCriteria', { en: '', hi: '' })}
            onRemove={i => removeArrayItem('eligibilityCriteria', i)}
            label="Eligibility criterion"
          />
        </Section>

        {/* ── 4. Benefits ──────────────────────────────────────────────── */}
        <Section title="Benefits" icon={Star}>
          <p className="text-xs text-gray-500 -mt-2">List all benefits the scheme provides (shown with ⭐ in the modal)</p>
          <BilingualRow
            items={form.benefits}
            onChange={(i, k, v) => updateArray('benefits', i, k, v)}
            onAdd={() => addArrayItem('benefits', { en: '', hi: '' })}
            onRemove={i => removeArrayItem('benefits', i)}
            label="Benefit"
          />
        </Section>

        {/* ── 5. Required Documents ────────────────────────────────────── */}
        <Section title="Required Documents" icon={BookOpen}>
          <p className="text-xs text-gray-500 -mt-2">List documents the applicant must bring (shown with ✅ in the modal)</p>
          <BilingualRow
            items={form.documentsRequired}
            onChange={(i, k, v) => updateArray('documentsRequired', i, k, v)}
            onAdd={() => addArrayItem('documentsRequired', { en: '', hi: '' })}
            onRemove={i => removeArrayItem('documentsRequired', i)}
            label="Document"
          />
        </Section>

        {/* ── 6. How to Apply Steps ────────────────────────────────────── */}
        <Section title="How to Apply — Steps" icon={CheckCircle}>
          <p className="text-xs text-gray-500 -mt-2">Step-by-step application process (shown with numbered orange circles)</p>
          <StepRow
            items={form.applicationSteps}
            onChange={(i, k, v) => updateArray('applicationSteps', i, k, v)}
            onAdd={() => addArrayItem('applicationSteps', { step: form.applicationSteps.length + 1, en: '', hi: '' })}
            onRemove={i => removeArrayItem('applicationSteps', i)}
          />
        </Section>

        {/* ── 7. Official Links & Media ────────────────────────────────── */}
        <Section title="Official Links & Media" icon={Globe}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Official Website URL</label>
              <input
                className={`input text-sm ${errors.officialLink ? 'border-red-400' : ''}`}
                placeholder="https://example.gov.in"
                value={form.officialLink}
                onChange={e => set('officialLink', e.target.value)}
              />
              {errors.officialLink && <p className="text-xs text-red-500 mt-1">{errors.officialLink}</p>}
              <p className="text-xs text-gray-400 mt-1">Logo auto-generated from this URL if Logo URL is empty</p>
            </div>
            <div>
              <label className="label">Portal Name (short)</label>
              <input
                className="input text-sm"
                placeholder="e.g. pmjay.gov.in (auto-detected)"
                value={form.portalName}
                onChange={e => set('portalName', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Shown on the "Apply Now" button. Leave blank to auto-fill.</p>
            </div>
          </div>

          {/* Helpline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Helpline Number</label>
              <input className="input text-sm" placeholder="e.g. 14555" value={form.helplineNumber} onChange={e => set('helplineNumber', e.target.value)} />
            </div>
            <div>
              <label className="label">Helpline Label</label>
              <input className="input text-sm" placeholder="e.g. Toll Free | EPFO Helpline" value={form.helplineLabel} onChange={e => set('helplineLabel', e.target.value)} />
            </div>
          </div>

          {/* YouTube */}
          <div>
            <label className="label flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Video ID</label>
            <input
              className="input text-sm max-w-xs"
              placeholder="e.g. hFGZLq1XJFI (from youtube.com/watch?v=THIS)"
              value={form.youtubeVideoId}
              onChange={e => set('youtubeVideoId', e.target.value.trim())}
            />
            <YouTubePreview videoId={form.youtubeVideoId} />
          </div>

          {/* YouTube titles */}
          {form.youtubeVideoId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="input text-sm" placeholder="Video title (English)" value={form.youtubeTitle_en} onChange={e => set('youtubeTitle_en', e.target.value)} />
              <input className="input text-sm" placeholder="वीडियो का शीर्षक (हिंदी)" value={form.youtubeTitle_hi} onChange={e => set('youtubeTitle_hi', e.target.value)} />
            </div>
          )}

          {/* Custom logo */}
          <div>
            <label className="label">Custom Logo URL (optional)</label>
            <input
              className="input text-sm"
              placeholder="Leave blank to auto-generate from official URL"
              value={form.logoUrl}
              onChange={e => set('logoUrl', e.target.value)}
            />
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo preview" className="mt-2 w-10 h-10 rounded-lg border border-gray-200 object-contain p-1 bg-white" />
            )}
          </div>
        </Section>

        {/* ── 8. Tags ──────────────────────────────────────────────────── */}
        <Section title="Tags & Search Keywords" icon={Tag} defaultOpen={false}>
          <div>
            <label className="label">Tags <span className="text-gray-400 font-normal">(comma-separated)</span></label>
            <input
              className="input text-sm"
              placeholder="e.g. pension, labour, eshram, daily wage, bpl"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Used for search. Separate with commas.</p>
            {form.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">#{t}</span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ── 9. Publish Settings ──────────────────────────────────────── */}
        <Section title="Publish Settings" icon={Eye}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Active toggle */}
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all flex-1 text-left ${
                form.isActive
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {form.isActive
                ? <ToggleRight className="w-6 h-6 text-green-500 flex-shrink-0" />
                : <ToggleLeft className="w-6 h-6 text-gray-400 flex-shrink-0" />
              }
              <div>
                <p className={`font-semibold text-sm ${form.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                  {form.isActive ? 'Active — Visible to users' : 'Inactive — Hidden from users'}
                </p>
                <p className="text-xs text-gray-400">Toggle to publish or unpublish this scheme</p>
              </div>
            </button>

            {/* Featured toggle */}
            <button
              type="button"
              onClick={() => set('isFeatured', !form.isFeatured)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all flex-1 text-left ${
                form.isFeatured
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {form.isFeatured
                ? <Star className="w-6 h-6 text-orange-500 fill-orange-500 flex-shrink-0" />
                : <Star className="w-6 h-6 text-gray-300 flex-shrink-0" />
              }
              <div>
                <p className={`font-semibold text-sm ${form.isFeatured ? 'text-orange-700' : 'text-gray-600'}`}>
                  {form.isFeatured ? '★ Featured — Pinned at top' : 'Not Featured'}
                </p>
                <p className="text-xs text-gray-400">Featured schemes appear first and get a ★ badge</p>
              </div>
            </button>
          </div>
        </Section>

        {/* ── Submit bar ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-surface-200 -mx-4 px-4 py-4 sm:relative sm:border-0 sm:bg-transparent sm:backdrop-blur-0 sm:p-0">
          <div className="flex items-center gap-3 max-w-4xl">
            <button
              type="button"
              onClick={() => navigate('/admin/schemes')}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Publish Scheme'}</>
              )}
            </button>
            {!isEdit && (
              <p className="hidden sm:block text-xs text-gray-400 ml-2">
                ✓ Scheme goes live instantly for all users
              </p>
            )}
          </div>
        </div>

      </form>
    </div>
  );
};

export default AdminSchemeFormPage;