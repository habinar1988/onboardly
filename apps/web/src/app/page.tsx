import Link from 'next/link';
import { CheckCircle, ArrowRight, Zap, Shield, Clock } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Automated workflows',
    desc: 'Build once, run for every client. Welcome emails, intake forms, contracts — all on autopilot.',
  },
  {
    icon: Shield,
    title: 'Document tracking',
    desc: 'Know exactly when your client viewed and signed every document. No more chasing.',
  },
  {
    icon: Clock,
    title: 'Save 3+ hours per client',
    desc: 'Stop copy-pasting emails and manually tracking who sent what. Onboardly handles it.',
  },
];

const TESTIMONIALS = [
  {
    quote: "I used to spend half a day onboarding each new client. Now it takes 10 minutes.",
    name: "Sarah K.",
    role: "Brand Designer",
  },
  {
    quote: "My clients actually comment on how professional my onboarding process is. Game changer.",
    name: "Marcus T.",
    role: "Web Developer",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">O</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">Onboardly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-600 text-sm font-medium hover:text-slate-900">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm py-2">Start free trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
            Built for freelancers
          </div>
          <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
            Client onboarding that<br />
            <span className="text-brand-600">runs itself</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop losing hours to manual onboarding. Onboardly automates your intake forms, contracts, and welcome sequences — so every client gets a 5-star experience from day one.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="btn-primary text-base py-3 px-6">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-slate-400 text-sm">No credit card required · 14-day trial</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Everything you need to onboard clients professionally
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Loved by freelancers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card p-6">
                <p className="text-slate-700 text-lg leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-slate-400 text-sm">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="px-6 py-20 bg-brand-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start onboarding like a pro today</h2>
          <p className="text-brand-100 mb-8">From $19/month. Cancel anytime.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors">
              Start free trial →
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-brand-200 text-sm">
            {['14-day free trial', 'No credit card', 'Cancel anytime'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-slate-400 text-sm">
          <span>© 2026 Onboardly. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-600">Privacy</a>
            <a href="#" className="hover:text-slate-600">Terms</a>
            <a href="mailto:support@onboardly.io" className="hover:text-slate-600">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
