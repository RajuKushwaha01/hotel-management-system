import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const schema = z
  .object({
    firstName: z.string().min(2, 'Too short'),
    lastName: z.string().min(2, 'Too short'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    password: z.string().min(6, 'Minimum 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4 py-10">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl animate-fade-in">
        <h1 className="text-3xl font-display text-white mb-2">Create Account</h1>
        <p className="text-white/60 mb-8">Join us for a premium experience</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                {...register('firstName')}
                placeholder="First name"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold"
              />
              {errors.firstName && <p className="text-danger text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <input
                {...register('lastName')}
                placeholder="Last name"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold"
              />
              {errors.lastName && <p className="text-danger text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <input
            {...register('email')}
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold"
          />
          {errors.email && <p className="text-danger text-xs">{errors.email.message}</p>}

          <input
            {...register('phone')}
            placeholder="Phone number"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold"
          />
          {errors.phone && <p className="text-danger text-xs">{errors.phone.message}</p>}

          <input
            {...register('password')}
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold"
          />
          {errors.password && <p className="text-danger text-xs">{errors.password.message}</p>}

          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="Confirm password"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-gold"
          />
          {errors.confirmPassword && (
            <p className="text-danger text-xs">{errors.confirmPassword.message}</p>
          )}

          <Button variant="gold" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-white/60 text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
