import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../../components/ui/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl animate-fade-in">
        <h1 className="text-3xl font-display text-white mb-2">Reset Password</h1>
        <p className="text-white/60 mb-8">Choose a new, strong password</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-white/40" size={18} />
            <input
              type="password" required value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              placeholder="New password"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold transition"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-white/40" size={18} />
            <input
              type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold transition"
            />
          </div>
          <p className="text-white/40 text-xs">Must be 8+ characters with uppercase, lowercase, a number, and a special character.</p>
          <Button variant="gold" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
        </form>

        <p className="text-white/60 text-sm mt-6 text-center">
          <Link to="/login" className="text-gold hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
