// import { useState, useEffect } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import { Link, useNavigate } from 'react-router-dom';
// import { Eye, EyeOff, HardHat, Building2, CheckCircle } from 'lucide-react';
// import { useAuth } from '@/context/AuthContext';
// import Spinner from '@/components/common/Spinner';
// import { Alert } from '@/components/common/UIComponents';
// import toast from 'react-hot-toast';

// const ROLE_OPTIONS = [
//   {
//     role: 'labour',
//     icon: HardHat,
//     title: "I'm a Worker",
//     desc:  'Find daily jobs near you and showcase your skills',
//     color: 'border-accent-400 bg-accent-50',
//     text:  'text-accent-700',
//   },
//   {
//     role: 'client',
//     icon: Building2,
//     title: "I'm a Client",
//     desc:  'Post jobs and hire skilled workers quickly',
//     color: 'border-primary bg-primary-50',
//     text:  'text-primary-700',
//   },
// ];

// const RegisterPage = () => {
//   const { register } = useAuth();
//   const navigate = useNavigate();

//   const [step,  setStep]  = useState(1); // 1 = role select, 2 = details
//   const [searchParams] = useSearchParams();

//   // Pre-fill from URL params (e.g. from login page hint)
//   useEffect(() => {
//     const preRole  = searchParams.get('role');
//     const preEmail = searchParams.get('email');
//     if (preRole && ['labour','client'].includes(preRole)) {
//       setForm(f => ({ ...f, role: preRole, email: preEmail || '' }));
//       setStep(2);
//     }
//   }, []);
//   const [form,  setForm]  = useState({ name: '', email: '', phone: '', password: '', role: '' });
//   const [showPass, setShowPass] = useState(false);
//   const [loading,  setLoading]  = useState(false);
//   const [error,    setError]    = useState('');

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const selectRole = (role) => { setForm({ ...form, role }); setStep(2); };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     // Frontend validation before hitting the server
//     if (!form.name.trim())     return setError('Please enter your full name.');
//     if (!form.email.trim())    return setError('Please enter your email address.');
//     if (!form.password)        return setError('Please enter a password.');
//     if (form.password.length < 8) return setError('Password must be at least 8 characters.');
//     if (!form.role)            return setError('Please select a role.');
//     if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
//       return setError('Please enter a valid 10-digit Indian mobile number, or leave it blank.');
//     }

//     setLoading(true);
//     try {
//       await register({ 
//         ...form, 
//         phone: form.phone.trim() || undefined, // send undefined if empty
//       });
//       toast.success('Account created! Welcome to Labour Connect 🎉');
//       navigate('/dashboard');
//     } catch (err) {
//       setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
//       <div className="w-full max-w-md animate-fade-in">
//         {/* ── Logo ── */}
//         <div className="flex items-center gap-2 justify-center mb-8">
//           <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow">
//             <span className="text-white font-display font-bold">LC</span>
//           </span>
//           <span className="font-display font-bold text-slate-900 text-xl">
//             Labour<span className="text-accent">Connect</span>
//           </span>
//         </div>

//         <div className="card">
//           <div className="card-body-lg space-y-6">
//             {/* ── Step 1: Role select ── */}
//             {step === 1 && (
//               <>
//                 <div>
//                   <h2 className="text-xl font-display font-bold text-slate-900">Create your account</h2>
//                   <p className="text-sm text-slate-500 mt-1">First, tell us who you are</p>
//                 </div>
//                 <div className="grid grid-cols-1 gap-3">
//                   {ROLE_OPTIONS.map(({ role, icon: Icon, title, desc, color, text }) => (
//                     <button
//                       key={role}
//                       onClick={() => selectRole(role)}
//                       className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md text-left ${color}`}
//                     >
//                       <span className={`p-2.5 rounded-xl bg-white shadow-sm`}>
//                         <Icon className={`w-6 h-6 ${text}`} />
//                       </span>
//                       <div>
//                         <p className={`font-semibold ${text}`}>{title}</p>
//                         <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </>
//             )}

//             {/* ── Step 2: Details form ── */}
//             {step === 2 && (
//               <>
//                 <div className="flex items-center gap-3">
//                   <button onClick={() => setStep(1)} className="btn-ghost btn-icon btn-sm">←</button>
//                   <div>
//                     <h2 className="text-xl font-display font-bold text-slate-900">Your details</h2>
//                     <p className="text-sm text-slate-500 mt-0.5 capitalize">
//                       Signing up as a <strong>{form.role}</strong>
//                     </p>
//                   </div>
//                 </div>

//                 {error && <Alert type="error" message={error} />}

//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   <div>
//                     <label className="label">Full Name</label>
//                     <input name="name" className="input" placeholder="Ramesh Kumar" value={form.name} onChange={handleChange} required />
//                   </div>
//                   <div>
//                     <label className="label">Email Address</label>
//                     <input name="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
//                   </div>
//                   <div>
//                     <label className="label">Mobile Number <span className="text-slate-400 font-normal">(optional)</span></label>
//                     <input name="phone" type="tel" className="input" placeholder="9876543210" value={form.phone} onChange={handleChange} maxLength={10} />
//                   </div>
//                   <div>
//                     <label className="label">Password</label>
//                     <div className="relative">
//                       <input
//                         name="password" type={showPass ? 'text' : 'password'}
//                         className="input pr-10" placeholder="Min. 8 characters"
//                         value={form.password} onChange={handleChange}
//                         required minLength={8}
//                       />
//                       <button type="button" onClick={() => setShowPass(!showPass)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
//                         {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                       </button>
//                     </div>
//                   </div>

//                   <p className="text-xs text-slate-500">
//                     By creating an account, you agree to our{' '}
//                     <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and{' '}
//                     <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
//                   </p>

//                   <button type="submit" className="btn-primary btn w-full btn-lg" disabled={loading}>
//                     {loading
//                       ? <><Spinner size="sm" color="text-white" /> Creating account…</>
//                       : <><CheckCircle className="w-4 h-4" />Create Account</>
//                     }
//                   </button>
//                 </form>
//               </>
//             )}

//             <p className="text-center text-sm text-slate-600 pt-2 border-t border-surface-100">
//               Already have an account?{' '}
//               <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RegisterPage;

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, HardHat, Building2, CheckCircle, ShieldAlert, XCircle, Info, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner';
import { Alert } from '@/components/common/UIComponents';
import toast from 'react-hot-toast';

/* ─── Age helpers ──────────────────────────────────────────────────────────── */
const MIN_AGE = 18;

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const dob = new Date(dobString + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

/* ─── Underage Modal for Registration ──────────────────────────────────────── */
const RegisterUnderageModal = ({ age, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    style={{ backdropFilter: 'blur(10px)', background: 'rgba(15,23,42,0.6)' }}
    onClick={onClose}
  >
    <div
      className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      style={{ animation: 'regModalIn .3s cubic-bezier(.34,1.4,.64,1) both' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-red-500 via-red-600 to-orange-600 px-8 pt-8 pb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-xl text-white">Registration Not Allowed</h3>
          <p className="text-red-100 text-sm mt-1">Minimum Age Requirement Not Met</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-7 space-y-5">
        {/* Aadhaar Notice */}
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-800">Important Notice</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Please ensure all your details are entered exactly as per your <strong>Aadhaar Card</strong>.
            </p>
          </div>
        </div>

        {/* Age Alert */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7 text-red-600" />
          </div>
          <h4 className="font-bold text-red-800 text-lg">Not Eligible to Register</h4>
          <p className="text-sm text-red-600 mt-2 leading-relaxed">
            The minimum age to register on <strong>Labour Connect</strong> is <strong>{MIN_AGE} years</strong>.
          </p>
          {age !== null && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-xl">
              <span className="text-xs font-bold text-red-700">Your Age:</span>
              <span className="text-lg font-extrabold text-red-800">{age} years</span>
            </div>
          )}
        </div>

        {/* Formal Message */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>Dear User,</strong><br /><br />
            We regret to inform you that you are <strong>not eligible</strong> to register on Labour Connect
            at this time. As per the <strong>Child Labour (Prohibition and Regulation) Act</strong> and our
            platform's safety policies, all users must be at least <strong>18 years of age</strong>.
            <br /><br />
            We encourage you to register once you meet the age requirement.
          </p>
        </div>

        {/* Restriction notice */}
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Registration Blocked</p>
            <p className="text-xs text-amber-600 mt-0.5">
              The registration form has been disabled. You cannot create an account until you meet the minimum age requirement.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200 active:scale-[0.98]"
        >
          <Check className="w-4 h-4" /> I Understand
        </button>

        <p className="text-[10px] text-gray-400 text-center">
          If you believe this is an error, contact <strong>support@labourconnect.in</strong>
        </p>
      </div>
    </div>
  </div>
);

const ROLE_OPTIONS = [
  {
    role: 'labour',
    icon: HardHat,
    title: "I'm a Worker",
    desc:  'Find daily jobs near you and showcase your skills',
    color: 'border-accent-400 bg-accent-50',
    text:  'text-accent-700',
  },
  {
    role: 'client',
    icon: Building2,
    title: "I'm a Client",
    desc:  'Post jobs and hire skilled workers quickly',
    color: 'border-primary bg-primary-50',
    text:  'text-primary-700',
  },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step,  setStep]  = useState(1);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const preRole  = searchParams.get('role');
    const preEmail = searchParams.get('email');
    if (preRole && ['labour','client'].includes(preRole)) {
      setForm(f => ({ ...f, role: preRole, email: preEmail || '' }));
      setStep(2);
    }
  }, []);

  const [form,  setForm]  = useState({ name: '', email: '', phone: '', password: '', role: '', dob: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // ─── Age-gate state ─────────────────────────────────────────────────────
  const [showUnderageModal, setShowUnderageModal] = useState(false);
  const [isUnderage, setIsUnderage]               = useState(false);
  const [currentAge, setCurrentAge]               = useState(null);

  // ─── Check age whenever DOB changes ────────────────────────────────────
  useEffect(() => {
    if (form.dob) {
      const age = calculateAge(form.dob);
      setCurrentAge(age);
      if (age !== null && age < MIN_AGE) {
        setIsUnderage(true);
        setShowUnderageModal(true);
      } else {
        setIsUnderage(false);
      }
    } else {
      setCurrentAge(null);
      setIsUnderage(false);
    }
  }, [form.dob]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const selectRole = (role) => { setForm({ ...form, role }); setStep(2); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ─── Age check first ───
    if (isUnderage) {
      setShowUnderageModal(true);
      return;
    }

    if (!form.name.trim())     return setError('Please enter your full name.');
    if (!form.email.trim())    return setError('Please enter your email address.');
    if (!form.dob)             return setError('Please enter your date of birth.');
    if (!form.password)        return setError('Please enter a password.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (!form.role)            return setError('Please select a role.');
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      return setError('Please enter a valid 10-digit Indian mobile number, or leave it blank.');
    }

    // Extra age validation (safety net)
    const age = calculateAge(form.dob);
    if (age === null || age < MIN_AGE) {
      setIsUnderage(true);
      setShowUnderageModal(true);
      return;
    }

    setLoading(true);
    try {
      await register({
        ...form,
        phone: form.phone.trim() || undefined,
        dob: form.dob || undefined,
      });
      toast.success('Account created! Welcome to LabourConnect ["ShramSetu Bharat"] 🎉');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">

      {/* ── Underage Modal ── */}
      {showUnderageModal && (
        <RegisterUnderageModal age={currentAge} onClose={() => setShowUnderageModal(false)} />
      )}

      {/* ── CSS for modal animation ── */}
      <style>{`
        @keyframes regModalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
      `}</style>

      <div className="w-full max-w-md animate-fade-in">
        {/* ── Logo ── */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow">
            <span className="text-white font-display font-bold">LC</span>
          </span>
          <span className="font-display font-bold text-slate-900 text-xl">
            Labour<span className="text-accent">Connect</span> <span className="text-[10px] opacity-60 font-medium ml-1 tracking-tight italic">["ShramSetu Bharat"]</span>
          </span>
        </div>

        <div className="card">
          <div className="card-body-lg space-y-6">
            {/* ── Step 1: Role select ── */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-900">Create your account</h2>
                  <p className="text-sm text-slate-500 mt-1">First, tell us who you are</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {ROLE_OPTIONS.map(({ role, icon: Icon, title, desc, color, text }) => (
                    <button
                      key={role}
                      onClick={() => selectRole(role)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md text-left ${color}`}
                    >
                      <span className={`p-2.5 rounded-xl bg-white shadow-sm`}>
                        <Icon className={`w-6 h-6 ${text}`} />
                      </span>
                      <div>
                        <p className={`font-semibold ${text}`}>{title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Step 2: Details form ── */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setStep(1); setIsUnderage(false); setForm(f => ({ ...f, dob: '' })); }} className="btn-ghost btn-icon btn-sm">←</button>
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-900">Your details</h2>
                    <p className="text-sm text-slate-500 mt-0.5 capitalize">
                      Signing up as a <strong>{form.role}</strong>
                    </p>
                  </div>
                </div>

                {/* Aadhaar Notice Banner */}
                <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-800">📋 Add All Details as per Your Aadhaar Card</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Enter your <strong>Full Name</strong> and <strong>Date of Birth</strong> exactly as printed on your Aadhaar Card.
                    </p>
                  </div>
                </div>

                {/* Underage persistent banner */}
                {isUnderage && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-red-800">Registration Blocked</p>
                        <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 text-[10px] font-bold uppercase tracking-wider">
                          Age: {currentAge} yrs
                        </span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        You must be at least <strong>{MIN_AGE} years</strong> old to register. All form fields are disabled. 
                        Please correct your date of birth if entered incorrectly.
                      </p>
                    </div>
                  </div>
                )}

                {error && <Alert type="error" message={error} />}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Full Name <span className="text-slate-400 text-xs font-normal">(as per Aadhaar)</span></label>
                    <input name="name" className={`input ${isUnderage ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="Ramesh Kumar" value={form.name} onChange={handleChange} required disabled={isUnderage} />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input name="email" type="email" className={`input ${isUnderage ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="you@example.com" value={form.email} onChange={handleChange} required disabled={isUnderage} />
                  </div>

                  {/* ── DOB Field with Age Validation ── */}
                  <div>
                    <label className="label">
                      Date of Birth <span className="text-slate-400 text-xs font-normal">(as per Aadhaar)</span>
                    </label>
                    <input
                      name="dob"
                      type="date"
                      className={`input ${isUnderage ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
                      value={form.dob}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                    {/* Inline age feedback */}
                    {form.dob && currentAge !== null && (
                      <div className={`flex items-center gap-2 mt-2 p-2.5 rounded-xl border text-xs font-semibold ${
                        isUnderage
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-green-50 border-green-200 text-green-700'
                      }`}>
                        {isUnderage
                          ? <><XCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> Age {currentAge} — You must be at least {MIN_AGE} to register. Form disabled.</>
                          : <><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Age {currentAge} — Eligible to register ✓</>
                        }
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Mobile Number <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input name="phone" type="tel" className={`input ${isUnderage ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="9876543210" value={form.phone} onChange={handleChange} maxLength={10} disabled={isUnderage} />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <input
                        name="password" type={showPass ? 'text' : 'password'}
                        className={`input pr-10 ${isUnderage ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="Min. 8 characters"
                        value={form.password} onChange={handleChange}
                        required minLength={8}
                        disabled={isUnderage}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        disabled={isUnderage}>
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    By creating an account, you agree to our{' '}
                    <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and{' '}
                    <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
                  </p>

                  <button type="submit" className={`btn-primary btn w-full btn-lg ${isUnderage ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading || isUnderage}>
                    {loading
                      ? <><Spinner size="sm" color="text-white" /> Creating account…</>
                      : isUnderage
                        ? <><ShieldAlert className="w-4 h-4" /> Registration Blocked — Under {MIN_AGE}</>
                        : <><CheckCircle className="w-4 h-4" />Create Account</>
                    }
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-sm text-slate-600 pt-2 border-t border-surface-100">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;