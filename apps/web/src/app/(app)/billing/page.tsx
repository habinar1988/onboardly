'use client';
import { billingApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useState } from 'react';
import { CheckCircle, Zap, Building2 } from 'lucide-react';
import clsx from 'clsx';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    icon: Zap,
    color: 'border-brand-200',
    highlight: false,
    features: [
      'Up to 10 active clients',
      'Unlimited workflows',
      'Document tracking',
      'Email automation',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    icon: Building2,
    color: 'border-brand-500 ring-2 ring-brand-500',
    highlight: true,
    features: [
      'Unlimited clients',
      'Everything in Starter',
      'Custom branding',
      'API access',
      'Advanced analytics',
      'White-label client portal',
    ],
  },
];

export default function BillingPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: 'starter' | 'pro') => {
    setLoading(plan);
    try {
      const { checkout_url } = await billingApi.checkout(plan);
      window.location.href = checkout_url;
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading('portal');
    try {
      const { portal_url } = await billingApi.portal();
      window.location.href = portal_url;
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Plans</h1>
        <p className="text-slate-500 mt-1">
          Current plan: <span className="font-semibold capitalize text-slate-700">{user?.plan}</span>
          {user?.plan !== 'free' && (
            <button onClick={handlePortal} disabled={loading === 'portal'} className="ml-4 text-brand-600 text-sm hover:underline">
              Manage subscription →
            </button>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map(plan => (
          <div key={plan.id} className={clsx('card p-6 relative', plan.color)}>
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', plan.highlight ? 'bg-brand-600' : 'bg-slate-100')}>
                <plan.icon className={clsx('w-5 h-5', plan.highlight ? 'text-white' : 'text-slate-600')} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-slate-900">${plan.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
              </div>
            </div>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {user?.plan === plan.id ? (
              <div className="w-full py-2.5 text-center text-sm font-medium text-green-700 bg-green-50 rounded-lg border border-green-200">
                ✓ Current plan
              </div>
            ) : (
              <button
                onClick={() => handleCheckout(plan.id as 'starter' | 'pro')}
                disabled={!!loading}
                className={clsx('w-full py-2.5 rounded-lg text-sm font-semibold transition-colors', plan.highlight
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                {loading === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-slate-400 text-sm mt-8">
        All plans include a 14-day free trial. Cancel anytime. No hidden fees.
      </p>
    </div>
  );
}
