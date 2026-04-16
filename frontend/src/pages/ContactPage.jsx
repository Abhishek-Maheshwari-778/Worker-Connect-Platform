import { useEffect, useState, useRef } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import api from '@/services/api';
import {
  Mail, Phone, Clock, Send, User, MessageSquare,
  Tag, Loader2, CheckCircle, MapPin, ArrowRight,
  HardHat, ChevronDown, Briefcase, Shield,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════
   FLOATING LABEL INPUT — fixes the icon-text overlap entirely.
   Icons live in the label row, not inside the input field.
══════════════════════════════════════════════════════════════════ */
const FloatField = ({
  label, icon: Icon, type = 'text', value, onChange,
  required, as = 'input', rows = 4, maxLength, children,
}) => {
  const [focused, setFocused] = useState(false);
  const filled = value && value.toString().length > 0;
  const active = focused || filled;

  return (
    <div className="relative group">
      {/* Floating label — sits above the border when active */}
      <label
        className={`absolute left-4 flex items-center gap-1.5 font-semibold pointer-events-none transition-all duration-200 z-10 ${
          active
            ? '-top-2.5 text-[11px] bg-white px-1.5 rounded text-orange-600'
            : 'top-3.5 text-sm text-slate-400'
        }`}
      >
        {Icon && <Icon className={`flex-shrink-0 transition-all duration-200 ${active ? 'w-3 h-3' : 'w-4 h-4'}`} />}
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>

      {as === 'textarea' ? (
        <textarea
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className={`w-full pt-4 pb-3 px-4 rounded-xl border-2 text-sm text-slate-800 bg-white resize-none outline-none transition-all duration-200 ${
            focused
              ? 'border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,0.12)]'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        />
      ) : as === 'select' ? (
        <div className="relative">
          <select
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={required}
            className={`w-full pt-4 pb-3 px-4 rounded-xl border-2 text-sm text-slate-800 bg-white outline-none transition-all duration-200 appearance-none cursor-pointer ${
              focused
                ? 'border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,0.12)]'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          className={`w-full pt-4 pb-3 px-4 rounded-xl border-2 text-sm text-slate-800 bg-white outline-none transition-all duration-200 ${
            focused
              ? 'border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,0.12)]'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SCROLL REVEAL HOOK
══════════════════════════════════════════════════════════════════ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const delay = el.dataset.delay || '0';
          setTimeout(() => el.classList.add('revealed'), parseInt(delay));
          io.unobserve(el);
        }
      }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const CATEGORIES = [
  { value: 'general',     label: 'General Inquiry'   },
  { value: 'support',     label: 'Technical Support' },
  { value: 'billing',     label: 'Billing / Payments'},
  { value: 'partnership', label: 'Partnership'       },
  { value: 'complaint',   label: 'Complaint'         },
  { value: 'feedback',    label: 'Feedback'          },
  { value: 'other',       label: 'Other'             },
];

const INFO_ITEMS = [
  {
    icon: Mail,
    label: 'Email Us',
    value: 'support@labourconnect.in',
    sub: 'We reply within 24 hours',
  },
  {
    icon: Phone,
    label: 'Call Us',
    value: '+91 98765 43210',
    sub: 'Mon–Sat, 9 AM – 6 PM IST',
  },
  {
    icon: MapPin,
    label: 'Registered Office',
    value: 'Noida, Uttar Pradesh',
    sub: 'India — 201301',
  },
  {
    icon: Clock,
    label: 'Response Time',
    value: '24–48 hours',
    sub: 'For all inquiries',
  },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function ContactPage() {
  useReveal();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '',
    category: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.'); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.'); return;
    }
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <style>{`
        /* Reveal animation */
        [data-reveal] { opacity: 0; transform: translateY(28px); transition: opacity .65s ease, transform .65s ease; }
        [data-reveal].revealed { opacity: 1; transform: translateY(0); }

        /* Hero text animation */
        @keyframes heroUp { from { opacity:0; transform:translateY(36px) } to { opacity:1; transform:translateY(0) } }
        .hero-title { animation: heroUp .8s cubic-bezier(.22,1,.36,1) both; }
        .hero-sub   { animation: heroUp .8s .15s cubic-bezier(.22,1,.36,1) both; }
        .hero-chips { animation: heroUp .8s .28s cubic-bezier(.22,1,.36,1) both; }

        /* Noise texture for hero */
        .noise-bg::before {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: .4;
        }

        /* Info card hover */
        .info-card { transition: transform .2s, box-shadow .2s; }
        .info-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }

        /* Submit button shimmer */
        .btn-submit { position: relative; overflow: hidden; }
        .btn-submit::after {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
          transition: left .5s;
        }
        .btn-submit:hover::after { left: 140%; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-28 overflow-hidden noise-bg">
        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="hero-chips inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/15 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6 border border-orange-500/25">
            <Mail className="w-3 h-3" /> Contact Support
          </span>

          <h1 className="hero-title font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.05]">
            We are here <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">
              to help you
            </span>
          </h1>

          <p className="hero-sub text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Whether you are a worker looking for jobs or a client hiring talent —
            our team is ready to assist you every step of the way.
          </p>

          {/* Stat chips */}
          <div className="hero-chips flex flex-wrap items-center justify-center gap-3 mt-10">
            {[
              { icon: HardHat,  label: '50,000+ Workers' },
              { icon: Briefcase,label: '12,000+ Jobs' },
              { icon: Shield,   label: '24hr Support' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/10 text-white/70 text-xs font-semibold backdrop-blur-sm">
                <Icon className="w-3.5 h-3.5 text-orange-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INFO STRIP ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
            {INFO_ITEMS.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="info-card flex items-start gap-3.5 px-6 py-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

            {/* ── LEFT: Context panel ─────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5" data-reveal data-delay="0">

              {/* Dark card */}
              <div className="relative bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-7 overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-orange-500/10 blur-2xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-500/30">
                    <HardHat className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white mb-3 leading-snug">
                    Talk to our team
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Labour Connect connects daily wage workers with trusted clients across India. Our support team understands the challenges of unorganised labour — reach out anytime.
                  </p>

                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    {[
                      { label: 'Worker Support',  val: 'For profile, jobs & applications' },
                      { label: 'Client Support',  val: 'For posting jobs & hiring'        },
                      { label: 'Dispute Help',    val: 'For payment & work disputes'      },
                      { label: 'Scheme Queries',  val: 'For government welfare schemes'   },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-white">{label} </span>
                          <span className="text-xs text-slate-400">— {val}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Response SLA card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">What to expect</p>
                <div className="space-y-3">
                  {[
                    { step: '01', label: 'Submit your message',         desc: 'Fill the form with your query'     },
                    { step: '02', label: 'Confirmation email',          desc: 'We acknowledge within minutes'     },
                    { step: '03', label: 'Team review',                 desc: 'Reviewed within 24 hours'          },
                    { step: '04', label: 'Resolution',                  desc: 'Resolved within 24–48 hours'       },
                  ].map(({ step, label, desc }) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="text-[11px] font-black text-orange-500 bg-orange-50 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0">{step}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Form ─────────────────────────────────────────── */}
            <div className="lg:col-span-3" data-reveal data-delay="120">
              {submitted ? (
                /* Success */
                <div className="bg-white rounded-3xl border border-green-100 p-14 text-center shadow-sm">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-slate-900 mb-3">Message Sent!</h2>
                  <p className="text-slate-500 text-sm leading-relaxed mb-1">
                    Thank you, <strong className="text-slate-800">{form.name}</strong>. Your message has been received.
                  </p>
                  <p className="text-slate-400 text-sm mb-8">
                    A confirmation was sent to <strong className="text-slate-600">{form.email}</strong>.
                    Our team will respond within 24–48 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name:'', email:'', phone:'', subject:'', category:'', message:'' });
                    }}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-200"
                  >
                    Send Another Message <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Form card */
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

                  {/* Card header */}
                  <div className="relative bg-gradient-to-r from-slate-900 to-blue-950 px-8 py-7 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.06]"
                      style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <h2 className="font-display font-bold text-white text-xl">Send a Message</h2>
                        <p className="text-slate-400 text-xs mt-1">Fields marked <span className="text-orange-400 font-bold">*</span> are required</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Team online
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-5">

                    {/* Error banner */}
                    {error && (
                      <div className="flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-[9px] font-black">!</span>
                        </div>
                        {error}
                      </div>
                    )}

                    {/* Row 1: Name + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FloatField
                        label="Full Name" icon={User} required
                        value={form.name} onChange={e => set('name', e.target.value)}
                      />
                      <FloatField
                        label="Email Address" icon={Mail} type="email" required
                        value={form.email} onChange={e => set('email', e.target.value)}
                      />
                    </div>

                    {/* Row 2: Phone + Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FloatField
                        label="Phone Number" icon={Phone}
                        value={form.phone} onChange={e => set('phone', e.target.value)}
                      />
                      <FloatField
                        label="Category" icon={Tag} as="select" required
                        value={form.category} onChange={e => set('category', e.target.value)}
                      >
                        <option value="" disabled />
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </FloatField>
                    </div>

                    {/* Subject */}
                    <FloatField
                      label="Subject" icon={Tag} required
                      value={form.subject} onChange={e => set('subject', e.target.value)}
                    />

                    {/* Message */}
                    <div className="space-y-1.5">
                      <FloatField
                        label="Your Message" icon={MessageSquare}
                        as="textarea" rows={5} maxLength={1000} required
                        value={form.message} onChange={e => set('message', e.target.value)}
                      />
                      <p className="text-right text-[11px] text-slate-400 pr-1">
                        {form.message.length} / 1000
                      </p>
                    </div>

                    {/* Privacy note */}
                    <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <Shield className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Your information is kept private and used only to respond to your query.
                        We do not share your details with third parties.
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-submit w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending your message…</>
                      ) : (
                        <><Send className="w-4 h-4" /> Send Message</>
                      )}
                    </button>

                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ STRIP ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10" data-reveal>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Quick Answers</p>
            <h3 className="font-display text-2xl font-bold text-slate-900">Frequently asked questions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                q: 'How do I register as a daily wage worker?',
                a: 'Click "Register" and select the Labour role. Complete your profile with Aadhaar verification to start applying for jobs.',
              },
              {
                q: 'How long does Aadhaar verification take?',
                a: 'Verification is reviewed by our admin team within 24 hours of document submission.',
              },
              {
                q: 'Is Labour Connect free to use?',
                a: 'Yes — Labour Connect is completely free for workers. Clients may have additional features available.',
              },
              {
                q: 'How do I report a payment dispute?',
                a: 'Go to My Disputes in your dashboard and raise a new dispute. Our team reviews all disputes within 48 hours.',
              },
            ].map(({ q, a }, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
                data-reveal
                data-delay={i * 60}
              >
                <p className="text-sm font-bold text-slate-800 mb-1.5 flex items-start gap-2">
                  <span className="text-orange-500 font-black flex-shrink-0">Q.</span> {q}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed pl-5">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}