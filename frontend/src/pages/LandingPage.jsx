import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layout/PublicLayout';
import { useTheme }  from '@/context/ThemeContext';
import {
  ArrowRight, Bot, Users, Zap, ShieldCheck, Star, MapPin,
  MessageCircle, BarChart3, CheckCircle, ChevronDown, ChevronUp,
  Briefcase, Clock, Award, TrendingUp, Phone, Mail, Building2,
  HardHat, Target, Sparkles, Play, Globe
} from 'lucide-react';

/* ─── Keyframes injected once ─────────────────────────────────────────────── */
const STYLES = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes slideRight { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideLeft  { from{opacity:0;transform:translateX(40px)}  to{opacity:1;transform:translateX(0)} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
@keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
@keyframes gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes arrowSlide { 0%{transform:translateX(0);opacity:1} 50%{transform:translateX(8px);opacity:0} 51%{transform:translateX(-8px);opacity:0} 100%{transform:translateX(0);opacity:1} }
@keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes countUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes borderSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
.animate-fadeUp   { animation:fadeUp   .7s ease both }
.animate-fadeIn   { animation:fadeIn   .6s ease both }
.animate-slideRight { animation:slideRight .7s ease both }
.animate-slideLeft  { animation:slideLeft  .7s ease both }
.animate-scaleIn  { animation:scaleIn  .6s ease both }
.animate-float    { animation:float    4s  ease-in-out infinite }
.reveal           { opacity:0; transform:translateY(30px); transition:opacity .7s ease, transform .7s ease }
.reveal.visible   { opacity:1; transform:translateY(0) }
.reveal-left      { opacity:0; transform:translateX(-40px); transition:opacity .7s ease, transform .7s ease }
.reveal-left.visible { opacity:1; transform:translateX(0) }
.reveal-right     { opacity:0; transform:translateX(40px);  transition:opacity .7s ease, transform .7s ease }
.reveal-right.visible { opacity:1; transform:translateX(0) }
.reveal-scale     { opacity:0; transform:scale(0.9); transition:opacity .6s ease, transform .6s ease }
.reveal-scale.visible { opacity:1; transform:scale(1) }
.card-hover-lift  { transition:transform .3s ease, box-shadow .3s ease }
.card-hover-lift:hover { transform:translateY(-8px); box-shadow:0 20px 40px rgba(0,0,0,.15) }
.btn-arrow-hover .arrow-icon { transition:transform .3s ease }
.btn-arrow-hover:hover .arrow-icon { transform:translateX(6px) }
.gradient-text { background:linear-gradient(135deg,#f97316,#fbbf24,#f97316); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 3s linear infinite }
.hero-gradient  { background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#0f2744 100%) }
.glow-orange    { box-shadow:0 0 30px rgba(249,115,22,.35) }
.glow-blue      { box-shadow:0 0 30px rgba(59,130,246,.25) }
.glass          { background:rgba(255,255,255,.06); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,.1) }
.glass-light    { background:rgba(255,255,255,.85); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,.6) }
.ticker-wrap    { overflow:hidden; white-space:nowrap }
.ticker-inner   { display:inline-flex; animation:ticker 25s linear infinite }
.stagger-1 { animation-delay:.1s }
.stagger-2 { animation-delay:.2s }
.stagger-3 { animation-delay:.3s }
.stagger-4 { animation-delay:.4s }
.stagger-5 { animation-delay:.5s }
.stagger-6 { animation-delay:.6s }
@media(prefers-reduced-motion:reduce){.animate-float,.ticker-inner,.gradient-text{animation:none}}
`;

/* ─── Scroll reveal hook ───────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale');
    const io  = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Animated counter hook ────────────────────────────────────────────────── */
function useCounter(target, duration = 2000, suffix = '') {
  const [value, setValue] = useState('0');
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const numTarget = parseFloat(target.replace(/[^0-9.]/g, ''));
        const isFloat   = target.includes('.');
        const start = performance.now();
        const tick  = (now) => {
          const p   = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          const cur  = isFloat ? (ease * numTarget).toFixed(1) : Math.round(ease * numTarget);
          setValue(cur + suffix);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, suffix]);

  return { ref, value };
}

/* ─── Components ───────────────────────────────────────────────────────────── */

const StatItem = ({ target, label, suffix = '' }) => {
  const { ref, value } = useCounter(target, 1800, suffix);
  return (
    <div ref={ref} className="text-center reveal-scale">
      <div className="text-4xl md:text-5xl font-display font-bold text-white mb-2" style={{animation:'countUp .5s ease both'}}>{value}</div>
      <div className="text-sm text-blue-200 font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
};

const FAQItem = ({ q, a, open, onToggle, dark }) => {
  // Colors adapt to dark/light mode
  const cardBg     = open
    ? dark ? 'rgba(194,65,12,0.15)'  : 'rgba(255,237,213,0.4)'
    : dark ? 'rgba(30,41,59,0.8)'    : '#ffffff';
  const cardBorder = open
    ? '#f97316'
    : dark ? '#334155' : '#e5e7eb';
  const qColor     = open
    ? '#f97316'
    : dark ? '#f1f5f9' : '#1f2937';
  const aColor     = dark ? '#94a3b8' : '#4b5563';
  const iconBg     = open ? '#f97316' : (dark ? '#334155' : '#f3f4f6');
  const iconColor  = open ? '#ffffff' : (dark ? '#94a3b8' : '#6b7280');

  return (
    <div
      style={{
        border: `1.5px solid ${cardBorder}`,
        borderRadius: 16,
        background: cardBg,
        transition: 'all 0.3s ease',
        boxShadow: open ? '0 4px 24px rgba(249,115,22,0.12)' : 'none',
      }}
    >
      {/* Question button */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
        aria-expanded={open}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: '0.95rem',
            lineHeight: 1.5,
            color: qColor,
            WebkitTextFillColor: qColor,
            flex: 1,
            display: 'block',
          }}
        >
          {q}
        </span>
        <span
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBg,
            color: iconColor,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'all 0.3s ease',
          }}
        >
          <ChevronDown style={{ width: 16, height: 16, color: iconColor }} />
        </span>
      </button>

      {/* Answer panel */}
      <div
        style={{
          maxHeight: open ? '300px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.35s ease-in-out',
        }}
      >
        <p
          style={{
            padding: '0 24px 20px',
            color: aColor,
            WebkitTextFillColor: aColor,
            fontSize: '0.875rem',
            lineHeight: 1.7,
          }}
        >
          {a}
        </p>
      </div>
    </div>
  );
};

/* ─── Main Landing Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  useReveal();
  const { isDark }      = useTheme();
  const dark            = isDark('public');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const TICKER_ITEMS = ['Verified Workers','AI Job Matching','Instant Applications','Aadhaar Verified','Real-time Chat','Smart Recommendations','Group Hiring','Government Schemes'];

  const FEATURES = [
    { icon: Bot,          title: 'AI Calling Agent',           desc: 'Our AI automatically calls and screens candidates so you don\'t have to. Get pre-qualified applicants delivered to your dashboard within hours.', color: 'from-purple-500 to-indigo-600', badge: 'AI Powered' },
    { icon: Target,       title: 'High-Intent Candidates',      desc: 'Get applications only from relevant, active jobseekers who are genuinely looking for daily work in your area — zero irrelevant noise.', color: 'from-orange-500 to-red-500', badge: 'Smart Filter' },
    { icon: Zap,          title: 'Hire Active Jobseekers Fast', desc: 'Access a pool of workers ready to start today. Our real-time availability system shows you who is free right now within your radius.', color: 'from-yellow-500 to-orange-500', badge: 'Instant' },
    { icon: ShieldCheck,  title: 'Aadhaar Verified Trust',      desc: 'Every labourer undergoes Aadhaar identity verification reviewed by our admin team. Hire with confidence — no fakes, no ghosts.', color: 'from-green-500 to-teal-500', badge: 'Verified' },
    { icon: BarChart3,    title: 'Smart Recommendation Engine', desc: 'Our algorithm matches jobs to workers based on skills, location proximity, wage expectations and past performance ratings.', color: 'from-blue-500 to-cyan-500', badge: 'ML Powered' },
    { icon: Star,         title: 'Dual Rating System',         desc: 'Workers rate clients for payment reliability. Clients rate workers for quality. Mutual accountability builds a trustworthy ecosystem.', color: 'from-pink-500 to-rose-500', badge: 'Trust Score' },
  ];

  const WHY_ITEMS = [
    { icon: Users,       val: '50,000+',  label: 'Registered Workers',   desc: 'Across 15+ states of India' },
    { icon: Briefcase,   val: '1,00,000+',label: 'Jobs Posted',          desc: 'Successfully completed' },
    { icon: Clock,       val: '< 2 hrs',  label: 'Average Hire Time',    desc: 'From posting to acceptance' },
    { icon: Award,       val: '4.8★',     label: 'Platform Rating',      desc: 'Rated by verified users' },
    { icon: TrendingUp,  val: '98%',      label: 'Satisfaction Rate',    desc: 'Client retention rate' },
    { icon: MapPin,      val: '15+',      label: 'States Covered',       desc: 'Pan-India presence' },
  ];

  const FAQS = [
    { q: 'How does Labour Connect verify workers?', a: 'Every worker on our platform must upload their Aadhaar card during registration. Our admin team manually reviews and approves each document before granting the Verified badge, ensuring the identity is authentic.' },
    { q: 'How quickly can I hire a worker?', a: 'Most clients find and hire a suitable worker within 2 hours of posting a job. Our AI recommendation engine instantly surfaces pre-verified candidates who match your skill, location, and budget requirements.' },
    { q: 'Is it free to post a job as a client?', a: 'Yes, posting a job on Labour Connect is completely free for clients. You can post unlimited jobs, browse worker profiles, and contact candidates at no cost during our launch phase.' },
    { q: 'How does the AI calling agent work?', a: 'When you post a job, our AI agent automatically reaches out to shortlisted candidates via phone. It conducts a brief screening call, confirms availability and interest, and delivers qualified applicants directly to your dashboard — saving you hours of manual outreach.' },
    { q: 'What happens if a hired worker does not show up?', a: 'Labour Connect has a no-show reporting system. If a worker does not turn up, you can report it within 24 hours. This impacts their reliability score and badge status. Our platform also shows you backup candidates immediately so your work never stops.' },
  ];

  const SERVICES = [
    { icon: HardHat,     title: 'Construction & Civil',  count: '12,400+ workers' },
    { icon: Zap,         title: 'Electrical Work',        count: '8,200+ workers' },
    { icon: Building2,   title: 'Plumbing & Sanitation',  count: '6,500+ workers' },
    { icon: Globe,       title: 'Painting & Finishing',   count: '9,100+ workers' },
    { icon: Target,      title: 'Carpentry & Woodwork',   count: '4,800+ workers' },
    { icon: Sparkles,    title: 'Cleaning & Housekeeping',count: '11,000+ workers' },
  ];

  return (
    <PublicLayout>
      <style>{STYLES}</style>


      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="hero-gradient min-h-screen flex flex-col justify-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-float" style={{animationDelay:'0s'}} />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-float" style={{animationDelay:'2s'}} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{animationDelay:'1s'}} />
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-orange-300 text-sm font-medium mb-8 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-orange-400" style={{boxShadow:'0 0 8px #fb923c'}} />
              India's Most Trusted Labour Hiring Platform
              <span className="w-2 h-2 rounded-full bg-orange-400" style={{boxShadow:'0 0 8px #fb923c'}} />
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fadeUp">
              LabourConnect<br/>
              <span className="gradient-text">["ShramSetu Bharat"]</span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed mb-10 animate-fadeUp stagger-2">
              Connect with <strong className="text-white">50,000+ verified daily wage workers</strong> across India. Post jobs, screen candidates with AI, and hire the right person in under 2 hours.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fadeUp stagger-3">
              <Link to="/register"
                className="btn-arrow-hover group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-base hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-xl glow-orange overflow-hidden">
                <span className="relative z-10">Get Started Free</span>
                <ArrowRight className="arrow-icon relative z-10 w-5 h-5" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

            </div>

            {/* Floating stat cards */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto animate-fadeUp stagger-4">
              {[['50K+','Workers Online'],['2 Hrs','Avg Hire Time'],['4.8★','Rating']].map(([v, l]) => (
                <div key={l} className="glass rounded-2xl px-4 py-4 text-center card-hover-lift">
                  <div className="text-2xl font-display font-bold text-white mb-1">{v}</div>
                  <div className="text-xs text-blue-200">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="absolute bottom-0 left-0 right-0 bg-orange-500/20 border-t border-orange-500/30 py-3">
          <div className="ticker-wrap">
            <div className="ticker-inner">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-3 mx-6 text-orange-200 text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS COUNTER ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle at 20% 50%,rgba(99,102,241,.15) 0%,transparent 50%),radial-gradient(circle at 80% 50%,rgba(249,115,22,.1) 0%,transparent 50%)'}} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12 reveal">
            <p className="text-orange-400 font-semibold text-sm uppercase tracking-widest mb-3">By The Numbers</p>
            <h2 className="font-display text-4xl font-bold text-white">Trusted by thousands across India</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <StatItem target="50000" label="Registered Workers" suffix="+" />
            <StatItem target="20000" label="Active Clients"     suffix="+" />
            <StatItem target="100000" label="Jobs Completed"    suffix="+" />
            <StatItem target="4.8"   label="Platform Rating"   suffix="★" />
          </div>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHT ────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">Core Features</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to hire <span className="text-orange-500">smarter</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">From AI-powered candidate screening to verified identity checks — Labour Connect handles it all.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className={`reveal card-hover-lift bg-white rounded-3xl p-7 border border-gray-100 cursor-pointer group`}
                style={{ animationDelay: `${i * 0.1}s`, transitionDelay: `${i * 0.08}s` }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display font-bold text-gray-900 text-lg leading-snug pr-2">{f.title}</h3>
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wide">{f.badge}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                <div className="mt-5 flex items-center gap-2 text-orange-500 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI CALLING AGENT SPOTLIGHT ───────────────────────────────────────── */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="reveal-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold uppercase tracking-widest mb-6">
                <Bot className="w-3.5 h-3.5" /> AI Calling Agent
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Let AI handle your<br/><span className="text-purple-600">candidate outreach</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Our AI calling agent automatically contacts shortlisted candidates, conducts a structured screening, and delivers only the most qualified, interested applicants directly to your dashboard.
              </p>
              <div className="space-y-4 mb-10">
                {['Calls 100 candidates in minutes — not days','Asks structured screening questions','Filters out uninterested or unavailable workers','Delivers pre-qualified shortlist instantly'].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="btn-arrow-hover inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors shadow-lg">
                Try AI Hiring Free <ArrowRight className="arrow-icon w-4 h-4" />
              </Link>
            </div>

            {/* Right — visual mockup */}
            <div className="reveal-right flex justify-center">
              <div className="relative w-full max-w-sm">
                {/* Main card */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 shadow-2xl text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">AI Agent — Active</p>
                      <p className="text-purple-200 text-xs">Screening candidates for your job</p>
                    </div>
                    <div className="ml-auto">
                      <span className="w-3 h-3 rounded-full bg-green-400 block" style={{boxShadow:'0 0 8px #4ade80'}} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Ramesh Kumar',   skill: 'Plumber',    status: 'Qualified ✓', color: 'bg-green-400/20 border-green-400/30 text-green-300' },
                      { name: 'Suresh Patel',   skill: 'Electrician',status: 'Calling...',  color: 'bg-yellow-400/20 border-yellow-400/30 text-yellow-300' },
                      { name: 'Mahesh Sharma',  skill: 'Painter',    status: 'Qualified ✓', color: 'bg-green-400/20 border-green-400/30 text-green-300' },
                      { name: 'Dinesh Yadav',   skill: 'Carpenter',  status: 'Declined',    color: 'bg-red-400/20 border-red-400/30 text-red-300' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{c.name[0]}</div>
                          <div>
                            <p className="text-xs font-semibold">{c.name}</p>
                            <p className="text-purple-300 text-[10px]">{c.skill}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${c.color}`}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-white/10 rounded-xl">
                    <p className="text-xs text-purple-200">Screened <strong className="text-white">24 candidates</strong> in the last hour. <strong className="text-white">8 qualified</strong> and ready to hire.</p>
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -top-4 -right-6 glass-light rounded-2xl p-3 shadow-xl animate-float" style={{animationDelay:'.5s'}}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Hired in 1.5 hrs</p>
                      <p className="text-[10px] text-gray-500">Average time</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-6 glass-light rounded-2xl p-3 shadow-xl animate-float" style={{animationDelay:'1.5s'}}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">100% Verified</p>
                      <p className="text-[10px] text-gray-500">Aadhaar checked</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY HIRE FROM LABOUR CONNECT ─────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">Why Choose Us</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why hire from <span className="text-blue-600">Labour Connect?</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">We built the platform specifically for India's daily wage economy — not adapted, but purpose-built.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {WHY_ITEMS.map((item, i) => (
              <div key={item.label}
                className="reveal-scale card-hover-lift bg-white rounded-3xl p-7 border border-gray-100 text-center group"
                style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                  <item.icon className="w-7 h-7 text-blue-600" />
                </div>
                <div className="font-display text-3xl font-bold text-gray-900 mb-1">{item.val}</div>
                <div className="font-semibold text-gray-800 text-sm mb-1">{item.label}</div>
                <div className="text-gray-500 text-xs">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div className="mt-12 reveal bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white text-center">
            <p className="font-display text-2xl font-bold mb-3">
              "The platform that actually understands the ground reality of India's workforce"
            </p>
            <p className="text-blue-200 text-sm">Connecting daily wage workers with genuine employment opportunities since 2024</p>
          </div>
        </div>
      </section>

      {/* ── SERVICES / CATEGORIES ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-600 text-xs font-bold uppercase tracking-widest mb-6">Job Categories</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Workers for every trade, <span className="text-green-600">available now</span>
              </h2>
              <p className="text-gray-500 text-lg mb-8">From construction to cooking — find skilled workers across all major daily wage categories, verified and ready to work.</p>
              <Link to="/register"
                className="btn-arrow-hover inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg">
                Find Workers <ArrowRight className="arrow-icon w-4 h-4" />
              </Link>
            </div>
            <div className="reveal-right grid grid-cols-2 gap-4">
              {SERVICES.map((s, i) => (
                <div key={s.title}
                  className="card-hover-lift bg-gray-50 rounded-2xl p-5 border border-gray-100 cursor-pointer group"
                  style={{ transitionDelay: `${i * 0.06}s` }}>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:shadow-md transition-shadow">
                    <s.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="font-semibold text-gray-800 text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-green-600 font-medium">{s.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-blue-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'radial-gradient(circle at 30% 70%,rgba(249,115,22,.12) 0%,transparent 50%)'}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16 reveal">
            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest mb-4">Simple Process</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* For Clients */}
            <div className="reveal-left">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
                <h3 className="font-display text-2xl font-bold text-white">For Clients</h3>
              </div>
              <div className="space-y-5">
                {[
                  ['Post a Job',         'Add job details, location, budget and required skills in under 2 minutes.'],
                  ['AI Screens for You', 'Our AI agent calls and screens candidates automatically overnight.'],
                  ['Review & Hire',      'Browse pre-qualified applicants, chat, accept, and get work started.'],
                  ['Rate the Worker',    'After completion, rate the worker to build a trusted ecosystem.'],
                ].map(([title, desc], i) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 text-orange-400 font-bold text-sm">{String(i+1).padStart(2,'0')}</div>
                    <div>
                      <p className="font-semibold text-white text-sm mb-1">{title}</p>
                      <p className="text-blue-200 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Workers */}
            <div className="reveal-right">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center"><HardHat className="w-5 h-5 text-white" /></div>
                <h3 className="font-display text-2xl font-bold text-white">For Workers</h3>
              </div>
              <div className="space-y-5">
                {[
                  ['Create Free Profile', 'Sign up, add your skills, location, daily wage, and verify your Aadhaar.'],
                  ['Get Matched by AI',   'Our engine matches you to jobs that fit your skill, location, and pay.'],
                  ['Apply Instantly',     'One-tap apply with a proposal message and your expected daily wage.'],
                  ['Build Reputation',    'Complete jobs, earn ratings, and collect verified badges over time.'],
                ].map(([title, desc], i) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400 font-bold text-sm">{String(i+1).padStart(2,'0')}</div>
                    <div>
                      <p className="font-semibold text-white text-sm mb-1">{title}</p>
                      <p className="text-blue-200 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 0', background: dark ? '#0f172a' : '#ffffff' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 reveal">
            <span
              style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: 999,
                background: dark ? 'rgba(249,115,22,0.15)' : '#f3f4f6',
                color: dark ? '#fb923c' : '#4b5563',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 16,
              }}
            >FAQ</span>
            <h2
              style={{
                fontFamily: 'Sora, Outfit, sans-serif',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: dark ? '#f1f5f9' : '#111827',
                WebkitTextFillColor: dark ? '#f1f5f9' : '#111827',
                marginBottom: 12,
              }}
            >
              Frequently Asked Questions
            </h2>
            <p style={{ color: dark ? '#64748b' : '#6b7280', WebkitTextFillColor: dark ? '#64748b' : '#6b7280' }}>
              Everything you need to know about Labour Connect.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                q={faq.q}
                a={faq.a}
                open={openFaqIndex === i}
                onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                dark={dark}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'radial-gradient(circle at 20% 50%,rgba(255,255,255,.15) 0%,transparent 50%),radial-gradient(circle at 80% 30%,rgba(255,255,255,.1) 0%,transparent 50%)'}} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 reveal">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to hire smarter?<br/>Join 20,000+ clients today.
          </h2>
          <p className="text-orange-100 text-lg mb-10 max-w-2xl mx-auto">
            Post your first job for free and experience the fastest, most reliable way to hire daily wage workers in India.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="btn-arrow-hover flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-orange-600 font-bold text-base hover:bg-orange-50 transition-all duration-300 shadow-xl">
              Start Hiring Free <ArrowRight className="arrow-icon w-5 h-5" />
            </Link>
            <Link to="/contact"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-white/50 text-white font-semibold hover:bg-white/10 transition-all duration-300">
              <Phone className="w-4 h-4" /> Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}