import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import authService from '@/services/authService';
import Spinner from '@/components/common/Spinner';
import { CheckCircle, XCircle } from 'lucide-react';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification failed');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm card card-body-lg text-center space-y-4 animate-fade-in">
        {status === 'loading' && (
          <>
            <Spinner size="lg" className="mx-auto" />
            <p className="text-slate-600">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-success mx-auto" />
            <h2 className="text-xl font-display font-bold text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-500">Your account is now fully activated.</p>
            <Link to="/login" className="btn-primary btn w-full">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-danger mx-auto" />
            <h2 className="text-xl font-display font-bold text-slate-900">Verification Failed</h2>
            <p className="text-sm text-slate-500">{message}</p>
            <Link to="/login" className="btn-outline btn w-full">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
