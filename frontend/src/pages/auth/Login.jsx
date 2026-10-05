import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import {
  ShieldCheck, Briefcase, ClipboardList, Sparkles,
  UtensilsCrossed, ChefHat, Calculator, Wrench, User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, homeFor, ROLE_META } from '../../constants/roles';
import Button from '../../components/ui/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// Who picks what on the selector screen, and the icon shown for each.
const ROLE_OPTIONS = [
  { role: ROLES.CUSTOMER, icon: User, blurb: 'Book rooms, view your stay, services & more' },
  { role: ROLES.SUPER_ADMIN, icon: ShieldCheck, blurb: 'Full system administration' },
  { role: ROLES.HOTEL_MANAGER, icon: Briefcase, blurb: 'Hotel operations & oversight' },
  { role: ROLES.RECEPTIONIST, icon: ClipboardList, blurb: 'Front desk, check-in/out' },
  { role: ROLES.HOUSEKEEPING, icon: Sparkles, blurb: 'Room cleaning & tasks' },
  { role: ROLES.FNB_STAFF, icon: UtensilsCrossed, blurb: 'Restaurant & room service' },
  { role: ROLES.CHEF, icon: ChefHat, blurb: 'Kitchen display & orders' },
  { role: ROLES.ACCOUNTANT, icon: Calculator, blurb: 'Billing, payments & reports' },
  { role: ROLES.MAINTENANCE, icon: Wrench, blurb: 'Repairs & equipment' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null); // null = showing the picker screen

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);

      // Control-system check: the account's real role (from the backend) must match
      // what the person selected on the picker screen — prevents a staff member from
      // accidentally landing in the wrong portal, and gives a clear error instead of
      // a silent redirect to the wrong dashboard.
      if (user.role !== selectedRole) {
        toast.error(`This account is registered as "${ROLE_META[user.role]?.label || user.role}", not "${ROLE_META[selectedRole]?.label}". Please select the correct account type.`);
        return;
      }

      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(homeFor(user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  // ---------- SCREEN 1: pick an account type ----------
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4 py-10">
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl text-white mb-2">Sign In to GrandVista</h1>
            <p className="text-white/60">Select your account type to continue</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ROLE_OPTIONS.map(({ role, icon: Icon, blurb }) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-gold hover:bg-white/10 transition-all duration-200 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-goldLight flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon size={18} className="text-navy" />
                </div>
                <p className="text-white font-medium text-sm">{ROLE_META[role]?.label}</p>
                <p className="text-white/40 text-xs mt-1 leading-snug">{blurb}</p>
              </button>
            ))}
          </div>

          <p className="text-white/50 text-sm mt-8 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold hover:underline">Register as a Guest</Link>
          </p>
        </div>
      </div>
    );
  }

  // ---------- SCREEN 2: email + password for the chosen role ----------
  const meta = ROLE_META[selectedRole];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl animate-fade-in">
        <button
          onClick={() => setSelectedRole(null)}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft size={14} /> Choose a different account type
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gold/15 text-gold">
            Signing in as {meta?.label}
          </span>
        </div>
        <h1 className="text-3xl font-display text-white mb-2">Welcome Back</h1>
        <p className="text-white/60 mb-8">Enter your credentials to continue</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-white/40" size={18} />
              <input
                {...register('email')}
                type="email"
                placeholder="Email address"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold transition"
              />
            </div>
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-white/40" size={18} />
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold transition"
              />
            </div>
            {errors.password && <p className="text-danger text-sm mt-1">{errors.password.message}</p>}
            <div className="text-right mt-1.5">
              <Link to="/forgot-password" className="text-xs text-gold hover:underline">Forgot password?</Link>
            </div>
          </div>

          <Button variant="gold" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : `Sign In as ${meta?.label}`}
          </Button>
        </form>

        {selectedRole === ROLES.CUSTOMER && (
          <p className="text-white/60 text-sm mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold hover:underline">Create one</Link>
          </p>
        )}
      </div>
    </div>
  );
}