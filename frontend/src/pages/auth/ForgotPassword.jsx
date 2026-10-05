import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl animate-fade-in">
        <h1 className="text-3xl font-display text-white mb-2">Forgot Password</h1>
        <p className="text-white/60 mb-8">We'll email you a reset link</p>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-gold" />
            </div>
            <p className="text-white/80">If an account exists with that email, a reset link has been sent.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-white/40" size={18} />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold transition"
              />
            </div>
            <Button variant="gold" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</Button>
          </form>
        )}

        <p className="text-white/60 text-sm mt-6 text-center">
          <Link to="/login" className="text-gold hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
