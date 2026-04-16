import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate }   from 'react-router-dom';
import { useAuth }       from '@/context/AuthContext';
import { useTheme }      from '@/context/ThemeContext';
import { useAuth as _useAuthTheme } from '@/context/AuthContext';
import {
  User, Bell, Shield, Trash2, Lock, Phone, Clock,
  Mail, ChevronRight, Sun, Moon, Camera,
  Check, X, Eye, EyeOff, MapPin, ChevronDown,
  Loader2, ToggleLeft, ToggleRight, AlertTriangle,
  Briefcase, HardHat, Edit2, Save, RefreshCw, CheckCircle
} from 'lucide-react';
import api              from '@/services/api';
import userService      from '@/services/userService';
import { INDIA_STATES } from '@/utils/indiaData';
import GeneralSection   from './GeneralSection';
import toast            from 'react-hot-toast';

/* ─── Tiny helpers ─────────────────────────────────────────────────────────── */
const inp = (extra = '') =>
  `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${extra}`;

const Btn = ({ children, onClick, loading, variant = 'primary', className = '', disabled }) => {
  const base = 'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md hover:from-orange-600 hover:to-orange-700 shadow-orange-200',
    outline: 'border-2 border-orange-500 text-orange-600 hover:bg-orange-50',
    danger:  'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:from-red-600 hover:to-red-700',
    ghost:   'border border-gray-200 text-gray-600 hover:bg-gray-50',
  };
  return (
    <button onClick={onClick} disabled={loading || disabled} className={`${base} ${variants[variant]} ${className}`}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

const Toggle = ({ on, onChange, label, sub }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    <button onClick={() => onChange(!on)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${on ? 'bg-orange-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${on ? 'left-6' : 'left-0.5'}`} />
    </button>
  </div>
);

const OTPInput = ({ value, onChange, length = 6 }) => {
  const containerRef = useRef(null);

  // Always create an array of exactly `length` characters — never use padEnd with ''
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const focusBox = (i) => {
    const inputs = containerRef.current?.querySelectorAll('input');
    if (inputs?.[i]) inputs[i].focus();
  };

  const handle = (i, val) => {
    const d = val.replace(/\D/g, '').slice(-1); // only digits, max 1 char
    const arr = [...digits];
    arr[i] = d;
    onChange(arr.join(''));
    if (d && i < length - 1) setTimeout(() => focusBox(i + 1), 0);
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const arr = [...digits];
      if (!arr[i] && i > 0) {
        arr[i - 1] = '';
        onChange(arr.join(''));
        setTimeout(() => focusBox(i - 1), 0);
      } else {
        arr[i] = '';
        onChange(arr.join(''));
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      setTimeout(() => focusBox(i - 1), 0);
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      setTimeout(() => focusBox(i + 1), 0);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const arr = Array.from({ length }, (_, i) => pasted[i] || '');
    onChange(arr.join(''));
    setTimeout(() => focusBox(Math.min(pasted.length, length - 1)), 0);
  };

  return (
    <div ref={containerRef} className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handle(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onFocus={e => e.target.select()}
          autoFocus={i === 0}
          className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all bg-white
            ${digit ? 'border-orange-500 text-gray-900 bg-orange-50' : 'border-gray-200 text-gray-800'}
            focus:border-orange-500 focus:ring-2 focus:ring-orange-100`}
        />
      ))}
    </div>
  );
};

/* ─── OTP Flow Modal ───────────────────────────────────────────────────────── */
const OTPModal = ({ purpose, newValue, onSuccess, onClose }) => {
  const [step,       setStep]       = useState('send'); // send | enter
  const [otp,        setOtp]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [timer,      setTimer]      = useState(0);
  const [maskedEmail,setMaskedEmail]= useState('');
  const [attempts,   setAttempts]   = useState(0);

  const labels = {
    change_email:    'Change Email',
    change_phone:    'Change Phone Number',
    change_password: 'Change Password',
  };

  const icons = {
    change_email:    Mail,
    change_phone:    Phone,
    change_password: Lock,
  };

  const Icon = icons[purpose] || Mail;

  useEffect(() => {
    let t;
    if (timer > 0) t = setTimeout(() => setTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const sendOTP = async (isResend = false) => {
    setLoading(true);
    try {
      const res = await api.post('/otp/send', { purpose });
      setMaskedEmail(res.data.message.match(/[a-z*]+@[a-z*]+\.[a-z*]+/i)?.[0] || '');
      if (isResend) toast.success('New OTP sent!');
      setStep('enter');
      setTimer(60);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length < 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const res = await api.post('/otp/verify', { otp, purpose, newValue });
      toast.success(res.data.message);
      onSuccess(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid OTP';
      toast.error(msg);
      setAttempts(a => a + 1);
      setOtp('');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(15,23,42,0.55)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-8 pt-8 pb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-display font-bold text-xl text-white">{labels[purpose]}</h3>
          <p className="text-orange-100 text-xs mt-1">Secure OTP Verification</p>
        </div>

        <div className="p-7 space-y-5">
          {step === 'send' ? (
            <>
              <div className="text-center space-y-2">
                <p className="text-gray-700 text-sm font-medium">
                  We'll send a 6-digit OTP to your registered email address to verify this change.
                </p>
                <div className="flex items-center gap-2 justify-center text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                  <Shield className="w-3.5 h-3.5 text-green-500" />
                  OTP expires in 10 minutes · Max 3 requests per 15 min
                </div>
              </div>
              <div className="space-y-2.5">
                <Btn onClick={() => sendOTP(false)} loading={loading} className="w-full">
                  <Mail className="w-4 h-4" /> Send OTP to Email
                </Btn>
                <Btn onClick={onClose} variant="ghost" className="w-full">Cancel</Btn>
              </div>
            </>
          ) : (
            <>
              {/* Success banner */}
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-green-800">OTP sent to your email</p>
                  <p className="text-xs text-green-600 mt-0.5">Check your inbox and spam folder.</p>
                </div>
              </div>

              {/* OTP input */}
              <div>
                <p className="text-xs text-gray-500 text-center mb-3">Enter the 6-digit code</p>
                <OTPInput value={otp} onChange={setOtp} />
                {attempts > 0 && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    {attempts} failed attempt{attempts !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <Btn onClick={verifyOTP} loading={loading} className="w-full"
                disabled={loading}>
                <Check className="w-4 h-4" />
                Verify &amp; {labels[purpose].replace('Change ', 'Update ')}
              </Btn>

              {/* Resend + cancel */}
              <div className="flex items-center justify-between text-xs">
                {timer > 0 ? (
                  <p className="text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Resend in {timer}s
                  </p>
                ) : (
                  <button onClick={() => sendOTP(true)}
                    className="text-orange-500 font-semibold hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Section: General / Profile ──────────────────────────────────────────── */
// Moved to GeneralSection.jsx for clean separation

/* ─── Section: Notifications ──────────────────────────────────────────────── */
const NotificationsSection = () => {
  const [prefs, setPrefs] = useState({
    new_job:       true,
    app_status:    true,
    govt_schemes:  true,
    chat_messages: true,
    ratings:       true,
    email_notifs:  false,
  });

  const toggle = (key) => {
    setPrefs(p => {
      const next = { ...p, [key]: !p[key] };
      toast.success('Preference saved');
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" /> Notification Preferences
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Choose what alerts you want to receive</p>
      </div>
      <div className="px-6">
        <Toggle on={prefs.new_job}       onChange={() => toggle('new_job')}       label="New Job Alerts"          sub="Get notified when jobs matching your skills are posted" />
        <Toggle on={prefs.app_status}    onChange={() => toggle('app_status')}    label="Application Status"      sub="Updates when clients review your application" />
        <Toggle on={prefs.govt_schemes}  onChange={() => toggle('govt_schemes')}  label="Government Schemes"      sub="New welfare schemes you may be eligible for" />
        <Toggle on={prefs.chat_messages} onChange={() => toggle('chat_messages')} label="Chat Messages"           sub="New messages from clients or workers" />
        <Toggle on={prefs.ratings}       onChange={() => toggle('ratings')}       label="Ratings Received"        sub="When someone rates your work" />
        <Toggle on={prefs.email_notifs}  onChange={() => toggle('email_notifs')}  label="Email Notifications"     sub="Also send notifications to your email inbox" />
      </div>
    </div>
  );
};

/* ─── Section: Availability (Labour only) ─────────────────────────────────── */
const AvailabilitySection = ({ user, updateUser }) => {
  const [available, setAvailable] = useState(user?.isAvailable ?? true);
  const [loading,   setLoading]   = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await userService.updateProfile({ isAvailable: !available });
      setAvailable(!available);
      updateUser(res.data.data);
      toast.success(!available ? 'You are now Available for work!' : 'You are now set as Unavailable');
    } catch { toast.error('Failed to update availability'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${available ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {available ? 'Available for Work' : 'Currently Unavailable'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {available ? 'Clients can see your profile and contact you for jobs.' : 'Your profile is hidden from client searches.'}
            </p>
          </div>
          <button onClick={toggle} disabled={loading}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${available ? 'bg-green-500' : 'bg-gray-300'}`}>
            {loading
              ? <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></span>
              : <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${available ? 'left-8' : 'left-1'}`} />
            }
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['When Available','Profile visible in search','text-green-700 bg-green-100'],
            ['When Available','AI sends you job matches','text-green-700 bg-green-100'],
            ['When Unavailable','Hidden from client search','text-gray-600 bg-gray-100'],
            ['When Unavailable','No new job notifications','text-gray-600 bg-gray-100'],
          ].map(([when, text, cls], i) => (
            <div key={i} className={`rounded-xl px-3 py-2 text-xs font-medium ${cls}`}>
              <span className="font-bold">{when}:</span> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Section: Security ────────────────────────────────────────────────────── */
const SecuritySection = ({ user, updateUser }) => {
  const [section,  setSection]  = useState(null); // 'password'|'email'|'phone'|'delete'
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({ curr:'', newPass:'', confirm:'', newEmail:'', newPhone:'' });
  const [showPw,   setShowPw]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const togglePw = key => setShowPw(p => ({ ...p, [key]: !p[key] }));

  const handleChangePassword = async () => {
    if (form.newPass !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.newPass.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.put('/auth/update-password', { currentPassword: form.curr, newPassword: form.newPass });
      toast.success('Password changed successfully!');
      setForm(f => ({ ...f, curr:'', newPass:'', confirm:'' }));
      setSection(null);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const SecurityCard = ({ icon: Icon, title, desc, action, color = 'orange' }) => (
    <div className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group cursor-pointer" onClick={action}>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
    </div>
  );

  return (
    <div className="space-y-4">
      {!section && (
        <>
          <SecurityCard icon={Lock}  title="Change Password"    desc="Update your account password"      action={() => setSection('password')} />
          <SecurityCard icon={Mail}  title="Change Email"       desc={`Current: ${user?.email}`}         action={() => setSection('email')} />
          <SecurityCard icon={Phone} title="Change Phone"       desc={`Current: ${user?.phone || 'Not set'}`} action={() => setSection('phone')} />
          <SecurityCard icon={Trash2} title="Delete Account"   desc="Permanently remove your account"   action={() => setSection('delete')} color="red" />
        </>
      )}

      {/* Change Password */}
      {section === 'password' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <button onClick={() => setSection(null)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="font-semibold text-gray-800">Change Password</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { key: 'curr',    label: 'Current Password', placeholder: 'Enter current password' },
              { key: 'newPass', label: 'New Password',     placeholder: 'At least 8 characters' },
              { key: 'confirm', label: 'Confirm Password', placeholder: 'Repeat new password' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="relative">
                  <input type={showPw[key] ? 'text' : 'password'} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className={inp('pr-12')} placeholder={placeholder} />
                  <button type="button" onClick={() => togglePw(key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <Btn onClick={handleChangePassword} loading={loading} className="flex-1">
                <Lock className="w-4 h-4" /> Update Password
              </Btn>
              <Btn onClick={() => setModal({ purpose: 'change_password', newValue: form.newPass })} variant="outline">
                Forgot? Use OTP
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Change Email */}
      {section === 'email' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <button onClick={() => setSection(null)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="font-semibold text-gray-800">Change Email</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Email Address</label>
              <input type="email" value={form.newEmail} onChange={e => setForm(f => ({ ...f, newEmail: e.target.value }))}
                className={inp()} placeholder="Enter new email address" />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              An OTP will be sent to your <strong>current email</strong> to confirm this change.
            </div>
            <Btn onClick={() => { if (!form.newEmail) { toast.error('Enter new email'); return; } setModal({ purpose: 'change_email', newValue: form.newEmail }); }} className="w-full">
              <Mail className="w-4 h-4" /> Send OTP to Verify
            </Btn>
          </div>
        </div>
      )}

      {/* Change Phone */}
      {section === 'phone' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <button onClick={() => setSection(null)} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="font-semibold text-gray-800">Change Phone Number</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Phone Number</label>
              <input type="tel" value={form.newPhone} onChange={e => setForm(f => ({ ...f, newPhone: e.target.value.replace(/\D/g,'') }))}
                className={inp()} placeholder="10-digit mobile number" maxLength={10} />
            </div>
            <Btn onClick={() => { if (form.newPhone.length !== 10) { toast.error('Enter valid 10-digit number'); return; } setModal({ purpose: 'change_phone', newValue: form.newPhone }); }} className="w-full">
              <Phone className="w-4 h-4" /> Send OTP to Email
            </Btn>
          </div>
        </div>
      )}

      {/* Delete Account */}
      {section === 'delete' && (
        <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
            <button onClick={() => setSection(null)} className="w-8 h-8 rounded-xl border border-red-200 flex items-center justify-center hover:bg-red-100">
              <X className="w-4 h-4 text-red-500" />
            </button>
            <h3 className="font-semibold text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Delete Account</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-2">
              <p className="font-bold">⚠️ This action is permanent and cannot be undone.</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Your profile will be permanently deleted</li>
                <li>All job applications and history will be removed</li>
                <li>Ratings and reviews will be deleted</li>
                <li>You will lose access to all messages</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">To request account deletion, please email us at:</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 font-mono text-sm text-gray-700 border border-gray-200">
              support@labourconnect.in
            </div>
            <p className="text-xs text-gray-400">Include your registered email address and reason. Processed within 48 hours.</p>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {modal && (
        <OTPModal
          purpose={modal.purpose}
          newValue={modal.newValue}
          onSuccess={(updatedUser) => { if (updatedUser) updateUser(updatedUser); setModal(null); setSection(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

/* ─── Section: Appearance ─────────────────────────────────────────────────── */
const AppearanceSection = () => {
  const { isDark, toggle: _themeToggle } = useTheme();
  const { user: _themeUser } = _useAuthTheme();
  const _role = _themeUser?.role || 'public';
  const dark   = isDark(_role);
  const toggle = () => _themeToggle(_role);

  return (
    <div className="space-y-5">
      {/* Main toggle card */}
      <div
        className="rounded-2xl border-2 p-6 cursor-pointer select-none"
        style={{
          background: dark ? 'linear-gradient(135deg,#1e293b,#0f172a)' : 'linear-gradient(135deg,#fff7ed,#ffffff)',
          borderColor: dark ? '#334155' : '#fed7aa',
          transition: 'all 0.4s ease',
        }}
        onClick={toggle}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="relative w-14 h-14">
              <div style={{
                width:56, height:56, borderRadius:16,
                background: dark ? 'linear-gradient(135deg,#1e3a5f,#0f2744)' : 'linear-gradient(135deg,#fff7ed,#ffedd5)',
                border: dark ? '1.5px solid #334155' : '1.5px solid #fed7aa',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition: 'all 0.4s ease',
              }}>
                {dark
                  ? <Moon style={{width:26,height:26,color:'#60a5fa',filter:'drop-shadow(0 0 8px rgba(96,165,250,0.5))'}} />
                  : <Sun  style={{width:26,height:26,color:'#f97316',filter:'drop-shadow(0 0 8px rgba(249,115,22,0.4))'}} />
                }
              </div>
            </div>
            {/* Text */}
            <div>
              <p style={{fontWeight:800, fontSize:16, color: dark ? '#f1f5f9' : '#0f172a', transition:'color 0.3s'}}>
                {dark ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </p>
              <p style={{fontSize:13, marginTop:2, color: dark ? '#64748b' : '#94a3b8', transition:'color 0.3s'}}>
                {dark ? 'Easy on your eyes. Perfect for night use.' : 'Clean and bright. Best for daytime.'}
              </p>
              <p style={{fontSize:11, marginTop:4, color: dark ? '#f97316' : '#94a3b8', fontWeight:600}}>
                {dark ? '✓ Dark mode is active across all pages' : 'Click to switch to dark mode'}
              </p>
            </div>
          </div>
          {/* Toggle pill */}
          <div style={{
            position:'relative', width:56, height:28,
            borderRadius:14, flexShrink:0,
            background: dark ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : '#e2e8f0',
            boxShadow: dark ? '0 0 16px rgba(99,102,241,0.4)' : 'none',
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <span style={{
              position:'absolute', top:3,
              width:22, height:22,
              borderRadius:'50%', background:'#ffffff',
              boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
              left: dark ? 31 : 3,
              transition: 'left 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </div>
        </div>
      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Light preview */}
        <div
          className="rounded-xl p-4 cursor-pointer border-2 transition-all"
          style={{
            background:'#ffffff', borderColor: !dark ? '#f97316' : '#e2e8f0',
            opacity: !dark ? 1 : 0.6,
          }}
          onClick={() => dark && toggle()}
        >
          <div className="flex items-center gap-2 mb-2">
            <div style={{width:20,height:20,borderRadius:6,background:'linear-gradient(135deg,#f97316,#ea580c)'}}/>
            <div style={{width:50,height:8,borderRadius:4,background:'#0f172a'}}/>
          </div>
          <div style={{height:6,borderRadius:3,background:'#f1f5f9',marginBottom:5}}/>
          <div style={{height:6,borderRadius:3,background:'#e2e8f0',width:'70%'}}/>
          <p className="text-xs font-semibold mt-3 text-gray-700">☀️ Light</p>
        </div>
        {/* Dark preview */}
        <div
          className="rounded-xl p-4 cursor-pointer border-2 transition-all"
          style={{
            background:'#1e293b', borderColor: dark ? '#f97316' : '#334155',
            opacity: dark ? 1 : 0.7,
          }}
          onClick={() => !dark && toggle()}
        >
          <div className="flex items-center gap-2 mb-2">
            <div style={{width:20,height:20,borderRadius:6,background:'linear-gradient(135deg,#f97316,#ea580c)'}}/>
            <div style={{width:50,height:8,borderRadius:4,background:'#f1f5f9'}}/>
          </div>
          <div style={{height:6,borderRadius:3,background:'#334155',marginBottom:5}}/>
          <div style={{height:6,borderRadius:3,background:'#273549',width:'70%'}}/>
          <p className="text-xs font-semibold mt-3 text-blue-300">🌙 Dark</p>
        </div>
      </div>

      <p className="text-xs text-center" style={{color:'var(--text-faint)'}}>
        Theme applies instantly to <strong>all pages</strong> and is saved to your device.
      </p>
    </div>
  );
};

/* ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────── */
const SECTIONS_LABOUR = [
  { id:'general',      icon:User,      label:'General',          sub:'Profile & location'   },
  { id:'availability', icon:HardHat,   label:'Availability',     sub:'Work status'          },
  { id:'notifications',icon:Bell,      label:'Notifications',    sub:'Alert preferences'    },
  { id:'security',     icon:Shield,    label:'Account & Security',sub:'Password & privacy'  },
  { id:'appearance',   icon:Sun,       label:'Appearance',       sub:'Dark / light mode'    },
];

const SECTIONS_CLIENT = [
  { id:'general',      icon:User,      label:'General',          sub:'Profile & contact'    },
  { id:'notifications',icon:Bell,      label:'Notifications',    sub:'Alert preferences'    },
  { id:'security',     icon:Shield,    label:'Account & Security',sub:'Password & privacy'  },
  { id:'appearance',   icon:Sun,       label:'Appearance',       sub:'Dark / light mode'    },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const role = user?.role || 'labour';
  const sections = role === 'client' ? SECTIONS_CLIENT : SECTIONS_LABOUR;

  const [active, setActive] = useState('general');
  const [mobile, setMobile] = useState(false);

  const current = sections.find(s => s.id === active);

  const renderSection = () => {
    switch (active) {
      case 'general':       return <GeneralSection />;
      case 'availability':  return <AvailabilitySection user={user} updateUser={updateUser} />;
      case 'notifications': return <NotificationsSection />;
      case 'security':      return <SecuritySection user={user} updateUser={updateUser} />;
      case 'appearance':    return <AppearanceSection />;
      default:              return null;
    }
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <style>{`
        @keyframes scaleIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .animate-scale-in { animation:scaleIn .3s cubic-bezier(.34,1.4,.64,1) both }
        .settings-sidebar-item { transition:all .2s ease }
        .settings-sidebar-item:hover { background:#fff7ed }
        .settings-sidebar-item.active { background:linear-gradient(135deg,#fff7ed,#fff) }
      `}</style>

      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account preferences and profile</p>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <div className="w-64 flex-shrink-0 hidden md:block">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {sections.map(s => {
                const Icon = s.icon;
                const isActive = active === s.id;
                return (
                  <button key={s.id} onClick={() => setActive(s.id)}
                    className={`settings-sidebar-item w-full flex items-center gap-3 px-5 py-4 text-left border-b border-gray-50 last:border-0 ${isActive ? 'active border-l-3 border-l-orange-500' : ''}`}
                    style={{ borderLeft: isActive ? '3px solid #f97316' : '3px solid transparent' }}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isActive ? 'bg-orange-500 shadow-md shadow-orange-200' : 'bg-gray-100'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? 'text-orange-600' : 'text-gray-700'}`}>{s.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-orange-400 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden w-full mb-4">
            <select value={active} onChange={e => setActive(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white outline-none focus:border-orange-400">
              {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0">
            {/* Section header */}
            <div className="mb-5 flex items-center gap-3">
              {current && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
                    <current.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-gray-900">{current.label}</h2>
                    <p className="text-xs text-gray-400">{current.sub}</p>
                  </div>
                </>
              )}
            </div>

            <div key={active} style={{ animation: 'scaleIn .28s cubic-bezier(.34,1.2,.64,1) both' }}>
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}