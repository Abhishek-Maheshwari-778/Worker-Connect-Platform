import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowLeft, ArrowRight, HardHat,
  Building2, ShieldCheck, Zap, Users, Star,
  CheckCircle, LogIn, Mail, ChevronRight,
  Sparkles, Bot, BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';
import Spinner from '@/components/common/Spinner';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

/* ─── Injected keyframes ────────────────────────────────────────────────────── */
const STYLES = `
@keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes slideLeft { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
@keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes pulse-ring{ 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.5);opacity:0} }
@keyframes bounce-in { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
@keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

.au-fadeUp   { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) both }
.au-fadeIn   { animation: fadeIn .4s ease both }
.au-slideLeft{ animation: slideLeft .5s cubic-bezier(.22,1,.36,1) both }
.au-float    { animation: float 4s ease-in-out infinite }
.au-bounce-in{ animation: bounce-in .4s cubic-bezier(.34,1.56,.64,1) both }

.gradient-hero { background: linear-gradient(135deg,#0f172a 0%,#1e1b4b 45%,#0f2744 100%) }
.glass-card    { background:rgba(255,255,255,.07); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,.12) }
.gradient-text-hero {
  background: linear-gradient(135deg,#f97316,#fbbf24,#fb923c);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
}
.role-card {
  transition: all .25s cubic-bezier(.34,1.4,.64,1);
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}
.role-card::before {
  content:'';
  position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(249,115,22,.08),rgba(249,115,22,0));
  opacity:0;transition:opacity .25s ease;
}
.role-card:hover::before  { opacity:1 }
.role-card.selected       { border-color:#f97316; background:rgba(249,115,22,.06); box-shadow:0 0 0 4px rgba(249,115,22,.12) }
.role-card.selected::before { opacity:1 }

.input-field {
  width:100%; padding:12px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 14px; color: #1e293b;
  transition: all .2s ease;
  outline: none;
}
.input-field::placeholder { color:#94a3b8 }
.input-field:focus { border-color:#f97316; background:#fff; box-shadow:0 0 0 3px rgba(249,115,22,.12) }
.input-field.error { border-color:#ef4444; background:#fff5f5 }

.btn-primary-lg {
  width:100%; padding:14px;
  background: linear-gradient(135deg,#f97316,#ea580c);
  color:#fff; font-weight:700; font-size:15px;
  border-radius:14px; border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:8px;
  transition: all .25s ease;
  box-shadow: 0 4px 15px rgba(249,115,22,.35);
  position:relative; overflow:hidden;
}
.btn-primary-lg:hover  { transform:translateY(-2px); box-shadow:0 8px 25px rgba(249,115,22,.4) }
.btn-primary-lg:active { transform:translateY(0) }
.btn-primary-lg:disabled { opacity:.65; cursor:not-allowed; transform:none }

.indicator-dot {
  width:8px;height:8px;border-radius:50%;
  position:relative; flex-shrink:0;
}
.indicator-dot::after {
  content:'';position:absolute;inset:0;border-radius:50%;
  animation: pulse-ring 1.5s ease-out infinite;
}
.dot-green  { background:#22c55e } .dot-green::after  { background:#22c55e }
.dot-blue   { background:#3b82f6 } .dot-blue::after   { background:#3b82f6 }
.dot-orange { background:#f97316 } .dot-orange::after { background:#f97316 }
`;

/* ─── Left panel feature items ──────────────────────────────────────────────── */
const FEATURES = [
  { icon: Bot,        title: 'AI-Powered Matching',      desc: 'Get matched to perfect jobs or candidates in seconds', color: '#a78bfa' },
  { icon: ShieldCheck,title: 'Aadhaar Verified Workers',  desc: 'Every worker identity checked and approved by admin',  color: '#34d399' },
  { icon: Zap,        title: 'Hire in Under 2 Hours',     desc: 'From job posting to accepted application — ultra fast', color: '#fbbf24' },
  { icon: BarChart3,  title: 'Smart Dashboard',           desc: 'Track applications, ratings, and work history live',   color: '#60a5fa' },
];

const TESTIMONIALS = [
  { name: 'Ramesh K.',  role: 'Electrician',      text: 'Got 5 job offers in my first week. The AI matching is incredible!',         stars: 5 },
  { name: 'Priya S.',   role: 'Client — Builder',  text: 'Hired 12 workers for my project in one afternoon. Verified and reliable.',   stars: 5 },
  { name: 'Suresh P.',  role: 'Plumber',           text: 'Finally a platform that understands daily wage workers. Life changing.',      stars: 5 },
];

/* ─── Role card component ───────────────────────────────────────────────────── */
const RoleCard = ({ role, selected, onSelect, icon: Icon, title, desc, color, bg }) => (
  <div
    className={`role-card rounded-2xl p-4 flex items-center gap-3 ${selected ? 'selected' : 'bg-gray-50'}`}
    onClick={() => onSelect(role)}
    role="button"
    aria-pressed={selected}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-800 text-sm">{title}</p>
      <p className="text-xs text-gray-500 truncate">{desc}</p>
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
      selected ? 'border-orange-500 bg-orange-500' : 'border-gray-300 bg-white'
    }`}>
      {selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
    </div>
  </div>
);

/* ─── Main Login Page ─────────────────────────────────────────────────────── */
const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const queryClient = useQueryClient();

  const [step,      setStep]      = useState(1); // 1=email, 2=role+pass
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [role,      setRole]      = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [checking,  setChecking]  = useState(false);
  const [error,     setError]     = useState('');
  const [existRoles,setExistRoles]= useState([]); // roles found for this email
  const [isAdmin,   setIsAdmin]   = useState(false); // true when admin email detected
  const [isEmployee, setIsEmployee] = useState(false); // true when employee email detected
  const [testIdx,   setTestIdx]   = useState(0);

  const emailRef    = useRef(null);
  const passwordRef = useRef(null);

  // Rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => setTestIdx(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (step === 2) setTimeout(() => passwordRef.current?.focus(), 300); }, [step]);

  /* ── Step 1: check email ───────────────────────────────────────────────── */
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address'); return; }
    setError('');
    setChecking(true);
    try {
      const res = await authService.checkEmail(email);
      const roles = res.data.roles || [];
      setExistRoles(roles);

      // ── Admin/Employee detection ───────────────────────────────────────────────────
      const adminFound = roles.find(r => r.role === 'admin');
      const employeeFound = roles.find(r => r.role === 'employee');
      if (adminFound) {
        // Admin email — auto-set role, skip role selector entirely
        setIsAdmin(true);
        setIsEmployee(false);
        setRole('admin');
      } else if (employeeFound) {
        setIsAdmin(false);
        setIsEmployee(true);
        setRole('employee');
      } else if (roles.length === 1) {
        setIsAdmin(false);
        setIsEmployee(false);
        setRole(roles[0].role); // auto-select if only one role
      } else {
        setIsAdmin(false);
        setIsEmployee(false);
        setRole(''); // multiple or zero — user must pick
      }
      setStep(2);
    } catch {
      setIsAdmin(false);
      setIsEmployee(false);
      setStep(2); // still proceed
    } finally {
      setChecking(false);
    }
  };

  /* ── Step 2: submit login ──────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    // Admin/Employee bypasses role selector
    if (!role && !isAdmin && !isEmployee) { setError('Please select your account type to continue'); return; }
    if (!password) { setError('Please enter your password'); return; }
    setError('');
    setLoading(true);
    try {
      await login({ email, password, role });
      queryClient.clear();
      const roleLabel = role === 'admin' ? 'Admin' : role === 'employee' ? 'Employee' : role === 'labour' ? 'Worker' : 'Client';
      toast.success(`Welcome back! Redirecting to ${roleLabel} dashboard…`, { duration: 2500 });
      // Role-based redirect
      const dest = role === 'labour' ? '/labour' : role === 'client' ? '/client' : role === 'employee' ? '/employee' : '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const t = TESTIMONIALS[testIdx];

  return (
    <>
      <style>{STYLES}</style>

      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[55%] gradient-hero flex-col justify-between p-10 xl:p-14 relative overflow-hidden">

          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl au-float" style={{animationDelay:'0s'}} />
            <div className="absolute bottom-32 right-16 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl au-float" style={{animationDelay:'2s'}} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/08 rounded-full blur-3xl au-float" style={{animationDelay:'1s'}} />
            <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)',backgroundSize:'50px 50px'}} />
          </div>

          <div className="relative z-10">
            {/* Logo + back */}
            <div className="flex items-center justify-between mb-12">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <HardHat className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl text-white">
                  Labour<span className="text-orange-400">Connect</span>
                </span>
              </Link>
              <Link to="/"
                className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-medium transition-colors group">
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Link>
            </div>

            {/* Headline */}
            <div className="au-fadeUp mb-10">
              <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                India's smartest<br />
                <span className="gradient-text-hero">labour hiring</span><br />
                platform
              </h1>
              <p className="text-blue-200/80 text-base leading-relaxed max-w-md">
                Whether you need work or need workers — Labour Connect connects you to the right opportunity with AI-powered matching and verified profiles.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3 mb-10 au-fadeUp" style={{animationDelay:'.1s'}}>
              {FEATURES.map((f, i) => (
                <div key={f.title}
                  className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{animationDelay:`${i*.06}s`}}>
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4.5 h-4.5" style={{width:'18px',height:'18px',color:f.color}} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm">{f.title}</p>
                    <p className="text-blue-200/70 text-xs truncate">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats + Testimonial */}
          <div className="relative z-10">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6 au-fadeUp" style={{animationDelay:'.2s'}}>
              {[['50K+','Workers'],['20K+','Clients'],['2 hrs','Avg. Hire']].map(([v,l]) => (
                <div key={l} className="glass-card rounded-2xl p-3 text-center">
                  <p className="font-display font-bold text-white text-lg">{v}</p>
                  <p className="text-blue-300 text-xs mt-0.5">{l}</p>
                </div>
              ))}
            </div>

            {/* Testimonial rotator */}
            <div className="glass-card rounded-2xl p-4 au-fadeUp" style={{animationDelay:'.25s'}}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {Array(t.stars).fill(0).map((_,i)=>(
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/90 text-xs leading-relaxed italic">"{t.text}"</p>
                  <p className="text-orange-400 text-xs font-semibold mt-1.5">{t.name} · <span className="text-blue-300 font-normal">{t.role}</span></p>
                </div>
              </div>
              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {TESTIMONIALS.map((_,i) => (
                  <button key={i} onClick={() => setTestIdx(i)}
                    className={`rounded-full transition-all duration-300 ${i===testIdx ? 'w-5 h-1.5 bg-orange-500' : 'w-1.5 h-1.5 bg-white/25'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — FORM ───────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center bg-white p-6 py-10 lg:py-6 relative">

          {/* Mobile back + logo */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-1.5 text-gray-500 hover:text-orange-500 text-sm font-medium transition-colors group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <HardHat className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-gray-900">Labour<span className="text-orange-500">Connect</span> <span className="text-[10px] opacity-60 font-medium ml-1 tracking-tight italic">["ShramSetu Bharat"]</span></span>
            </div>
          </div>

          <div className="w-full max-w-[400px] mt-12 lg:mt-0">

            {/* ── STEP 1 — Email Entry ── */}
            {step === 1 && (
              <div className="au-fadeUp">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-orange-500" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-gray-900">Welcome back</h2>
                  <p className="text-gray-500 text-sm mt-1">Enter your email to get started</p>
                </div>

                <form onSubmit={handleCheckEmail} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                      {typeof error === 'string' ? error : (error?.message || JSON.stringify(error))}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div>
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        className={`input-field ${error ? 'error' : ''}`}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-lg" disabled={checking}>
                    {checking
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking…</>
                      : <>Continue <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    New to LabourConnect ["ShramSetu Bharat"]?{' '}
                    <Link to="/register" className="text-orange-500 font-semibold hover:underline">Create account</Link>
                  </p>
                </div>

                {/* Social proof */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="indicator-dot dot-green" />
                      <span className="text-xs text-gray-500">50K+ workers active</span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-500">4.8 / 5 rating</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2 — Role Select + Password ── */}
            {step === 2 && (
              <div className="au-slideLeft">
                {/* Header */}
                <div className="flex items-start gap-3 mb-6">
                  <button
                    onClick={() => { setStep(1); setRole(''); setPassword(''); setError(''); }}
                    className="mt-1 w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-all flex-shrink-0 group"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  </button>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900">Sign in</h2>
                    <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-orange-600 font-medium truncate max-w-[200px]">{email}</span>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 au-bounce-in">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                      <span>{typeof error === 'string' ? error : (error?.message || JSON.stringify(error))}</span>
                    </div>
                  )}

                  {/* ── Role selector — hidden for admin/employee ── */}
                  {isAdmin || isEmployee ? (
                    /* Admin/Employee badge — shown instead of role cards */
                    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-indigo-50 border border-indigo-200">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-800 text-sm">{isAdmin ? 'Administrator' : 'Employee'} Account</p>
                        <p className="text-indigo-500 text-xs">{isAdmin ? 'Full platform access detected' : 'Employee portal access detected'}</p>
                      </div>
                      <div className="ml-auto">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span className="text-indigo-600 text-xs font-semibold">Auto-detected</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        I am signing in as
                        {existRoles.length > 1 && (
                          <span className="ml-2 text-xs font-normal text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                            {existRoles.length} accounts found
                          </span>
                        )}
                      </label>
                      <div className="space-y-2.5">
                        <RoleCard
                          role="labour"
                          selected={role === 'labour'}
                          onSelect={setRole}
                          icon={HardHat}
                          title="Worker / Labour"
                          desc="Find daily wage jobs near me"
                          color="#f97316"
                          bg="bg-orange-50"
                        />
                        <RoleCard
                          role="client"
                          selected={role === 'client'}
                          onSelect={setRole}
                          icon={Building2}
                          title="Client / Employer"
                          desc="Post jobs and hire workers"
                          color="#1d4ed8"
                          bg="bg-blue-50"
                        />
                      </div>

                      {/* Hint when multiple roles found */}
                      {existRoles.length > 1 && (
                        <div className="mt-2.5 flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
                          <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-700">
                            We found <strong>{existRoles.length} accounts</strong> for this email. Select which dashboard you want to access.
                          </p>
                        </div>
                      )}

                      {/* Hint for new users */}
                      {existRoles.length === 0 && (
                        <div className="mt-2.5 flex items-start gap-2 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
                          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700">
                            No existing account found. Select a role above and sign in, or{' '}
                            <Link to="/register" className="font-semibold underline">create a free account</Link>.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Password ── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Password</label>
                      <Link to="/forgot-password" className="text-xs text-orange-500 hover:underline font-medium">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        className={`input-field pr-12 ${error && !role ? '' : error ? 'error' : ''}`}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* ── Submit ── */}
                  <button type="submit" className="btn-primary-lg" disabled={loading || !role}>
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        {isAdmin
                          ? 'Sign in as Admin'
                          : isEmployee ? 'Sign in as Employee'
                          : role === 'labour' ? 'Sign in as Worker'
                          : role === 'client' ? 'Sign in as Client'
                          : 'Select a role to continue'
                        }
                      </>
                    )}
                  </button>
                </form>

                {/* Register link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    New to Labour Connect?{' '}
                    <Link to="/register" className="text-orange-500 font-semibold hover:underline">Create free account</Link>
                  </p>
                </div>

                {/* Register second account hint */}
                {existRoles.length === 1 && !isAdmin && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-400">
                      Want to also{' '}
                      {existRoles[0].role === 'labour' ? 'hire workers' : 'find work'}?{' '}
                      <Link
                        to={`/register?role=${existRoles[0].role === 'labour' ? 'client' : 'labour'}&email=${encodeURIComponent(email)}`}
                        className="text-blue-500 hover:underline font-medium"
                      >
                        Register as {existRoles[0].role === 'labour' ? 'Client' : 'Worker'} →
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;