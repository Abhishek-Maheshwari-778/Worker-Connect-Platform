// ResetPasswordPage.jsx
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import authService from '@/services/authService';
import { Alert } from '@/components/common/UIComponents';
import Spinner from '@/components/common/Spinner';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm card card-body-lg space-y-5 animate-fade-in">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900">Set new password</h2>
          <p className="text-sm text-slate-500 mt-1">Choose a strong password for your account</p>
        </div>
        {error && <Alert type="error" message={error} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />
          </div>
          <button type="submit" className="btn-primary btn w-full" disabled={loading}>
            {loading ? <Spinner size="sm" color="text-white" /> : 'Reset Password'}
          </button>
        </form>
        <p className="text-center text-sm">
          <Link to="/login" className="text-primary hover:underline text-sm">← Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
