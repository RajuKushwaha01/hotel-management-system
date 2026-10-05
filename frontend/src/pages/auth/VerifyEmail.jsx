import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return setStatus('error');

    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center animate-fade-in">
        {status === 'verifying' && <p className="text-white/70">Verifying your email...</p>}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-success mx-auto mb-4" />
            <h1 className="text-2xl font-display text-white mb-2">Email Verified!</h1>
            <p className="text-white/60 mb-6">Your account is now fully activated.</p>
            <Link to="/login" className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold inline-block hover:shadow-lg transition">
              Continue to Sign In
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="text-danger mx-auto mb-4" />
            <h1 className="text-2xl font-display text-white mb-2">Verification Failed</h1>
            <p className="text-white/60">This link is invalid or has expired. Please request a new one from your profile.</p>
          </>
        )}
      </div>
    </div>
  );
}
