'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsApi, clientsApi, workflowsApi } from '@/lib/api';
import { useState } from 'react';
import { Plus, PlayCircle, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  abandoned: 'bg-slate-100 text-slate-500',
};

export default function RunsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ client_id: '', workflow_id: '' });

  const { data: runsData, isLoading } = useQuery({
    queryKey: ['runs', statusFilter],
    queryFn: () => runsApi.list({ status: statusFilter || undefined }),
  });

  const { data: clientsData } = useQuery({ queryKey: ['clients-all'], queryFn: () => clientsApi.list({ per_page: '100' }) });
  const { data: workflowsData } = useQuery({ queryKey: ['workflows'], queryFn: workflowsApi.list });

  const startMutation = useMutation({
    mutationFn: runsApi.start,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setShowModal(false);
      setForm({ client_id: '', workflow_id: '' });
    },
  });

  const runs = runsData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const workflows = workflowsData?.data ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Onboarding Runs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track every active onboarding</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Start Run
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'in_progress', 'completed', 'abandoned'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Runs list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="card p-12 text-center text-slate-400">Loading...</div>
        ) : runs.length === 0 ? (
          <div className="card p-12 text-center">
            <PlayCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No runs found</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
              Start your first run
            </button>
          </div>
        ) : runs.map((run: any) => (
          <Link key={run.id} href={`/runs/${run.id}`} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow block">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-brand-700 font-bold">{run.client?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-slate-900">{run.client?.name}</p>
                <span className={clsx('badge', STATUS_COLORS[run.status])}>{run.status.replace('_', ' ')}</span>
              </div>
              <p className="text-slate-500 text-sm">{run.workflow?.name}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 max-w-xs">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${run.progress_pct}%` }} />
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  Step {run.current_step}/{run.total_steps} · {run.progress_pct}%
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
              </p>
              <ChevronRight className="w-4 h-4 text-slate-300 mt-2 ml-auto" />
            </div>
          </Link>
        ))}
      </div>

      {/* Start Run Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Start Onboarding Run</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Client *</label>
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="input">
                  <option value="">Select a client...</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Workflow *</label>
                <select value={form.workflow_id} onChange={e => setForm(f => ({ ...f, workflow_id: e.target.value }))} className="input">
                  <option value="">Select a workflow...</option>
                  {workflows.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}{w.is_default ? ' (default)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={() => startMutation.mutate(form)}
                disabled={startMutation.isPending || !form.client_id || !form.workflow_id}
                className="btn-primary flex-1 justify-center"
              >
                {startMutation.isPending ? 'Starting...' : 'Start Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
