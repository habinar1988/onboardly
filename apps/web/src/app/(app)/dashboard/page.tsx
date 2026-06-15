'use client';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, runsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Users, PlayCircle, CheckCircle, FileText, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  abandoned: 'bg-slate-100 text-slate-600',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: dashboardApi.stats });
  const { data: runsData } = useQuery({ queryKey: ['runs', 'in_progress'], queryFn: () => runsApi.list({ status: 'in_progress' }) });

  const runs = runsData?.data ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your clients today.</p>
      </div>

      {/* Trial banner */}
      {user?.plan === 'free' && user?.trial_ends_at && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-brand-800 font-medium text-sm">You're on a free trial</p>
            <p className="text-brand-600 text-xs mt-0.5">Upgrade to keep access after your trial ends.</p>
          </div>
          <Link href="/billing" className="btn-primary text-xs py-1.5 px-3">
            Upgrade now
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Clients" value={stats?.total_clients ?? 0} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Active Runs" value={stats?.active_runs ?? 0} icon={PlayCircle} color="bg-amber-50 text-amber-600" />
        <StatCard label="Completed This Month" value={stats?.completed_this_month ?? 0} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <StatCard label="Pending Documents" value={stats?.pending_documents ?? 0} icon={FileText} color="bg-purple-50 text-purple-600" />
        <StatCard label="Completion Rate" value={`${stats?.completion_rate ?? 0}%`} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Avg. Days to Complete" value={stats?.avg_completion_days ?? 0} icon={Clock} color="bg-slate-100 text-slate-600" />
      </div>

      {/* Active runs */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Active Onboarding Runs</h2>
          <Link href="/runs" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>

        {runs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <PlayCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No active runs</p>
            <p className="text-slate-400 text-sm mt-1">Start onboarding a client to see it here.</p>
            <Link href="/clients" className="btn-primary mt-4 inline-flex">
              Add a client
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {runs.slice(0, 8).map((run: any) => (
              <Link key={run.id} href={`/runs/${run.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-700 text-sm font-bold">
                    {run.client?.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{run.client?.name}</p>
                  <p className="text-slate-400 text-xs truncate">{run.workflow?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  <div className="w-24 hidden sm:block">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Step {run.current_step}/{run.total_steps}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${run.progress_pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={clsx('badge', STATUS_COLORS[run.status] ?? 'bg-slate-100 text-slate-600')}>
                    {run.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
