// ── ForgotPasswordPage ─────────────────────────────────────────────────────────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '@/services/authService';
import { Alert } from '@/components/common/UIComponents';
import Spinner from '@/components/common/Spinner';
import { Mail } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm card card-body-lg space-y-5 animate-fade-in">
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-50 mb-3">
            <Mail className="w-6 h-6 text-primary" />
          </span>
          <h2 className="text-xl font-display font-bold text-slate-900">Forgot password?</h2>
          <p className="text-sm text-slate-500 mt-1">We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <Alert type="success" message={`Reset link sent to ${email}. Check your inbox.`} />
        ) : (
          <>
            {error && <Alert type="error" message={error} />}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <button type="submit" className="btn-primary btn w-full" disabled={loading}>
                {loading ? <Spinner size="sm" color="text-white" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="text-primary hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
