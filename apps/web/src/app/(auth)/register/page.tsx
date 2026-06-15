'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

const PERKS = [
  'Free 14-day trial, no credit card',
  'Unlimited workflows',
  'Automated email sequences',
  'Document tracking & e-signatures',
];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await authApi.register(data);
      setAuth(res.user, res.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: value prop */}
        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-6">
            <span className="text-white text-xl font-bold">O</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Stop losing clients to messy onboarding
          </h1>
          <p className="text-slate-500 text-lg mb-8">
            Onboardly automates your entire client onboarding — from intake forms to signed contracts — so you can focus on the work.
          </p>
          <ul className="space-y-3">
            {PERKS.map(p => (
              <li key={p} className="flex items-center gap-3 text-slate-700">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form */}
        <div className="card p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Create your account</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label">Full name</label>
              <input {...register('name')} className="input" placeholder="Jane Smith" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="jane@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className="input" placeholder="Min. 8 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-2.5">
              {isSubmitting ? 'Creating account...' : 'Start free trial →'}
            </button>

            <p className="text-center text-xs text-slate-400">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
