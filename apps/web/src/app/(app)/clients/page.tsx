'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Mail, Building2 } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-slate-100 text-slate-600',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  archived: 'bg-slate-100 text-slate-400',
};

const STAGE_LABELS: Record<string, string> = {
  intake: 'Intake',
  documents: 'Documents',
  review: 'Review',
  complete: 'Complete',
};

export default function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '' });
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, statusFilter],
    queryFn: () => clientsApi.list({ search: search || undefined, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      setForm({ name: '', email: '', company: '', phone: '' });
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create client'),
  });

  const clients = data?.data ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{data?.pagination?.total ?? 0} total clients</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="input pl-9"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Company</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Stage</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-slate-500 font-medium">No clients yet</p>
                  <p className="text-slate-400 text-sm mt-1">Add your first client to get started.</p>
                </td>
              </tr>
            ) : clients.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-700 text-xs font-bold">{c.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <Link href={`/clients/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600 text-sm">
                        {c.name}
                      </Link>
                      <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                        <Mail className="w-3 h-3" />{c.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  {c.company ? (
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />{c.company}
                    </div>
                  ) : <span className="text-slate-300 text-sm">—</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx('badge', STATUS_COLORS[c.status])}>{c.status}</span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <span className="text-slate-600 text-sm">{STAGE_LABELS[c.onboarding_stage] ?? c.onboarding_stage}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/clients/${c.id}`} className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Client</h2>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">{formError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="label">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="input" placeholder="jane@example.com" />
              </div>
              <div>
                <label className="label">Company</label>
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="input" placeholder="Acme Inc." />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+1 555 000 0000" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name || !form.email}
                className="btn-primary flex-1 justify-center"
              >
                {createMutation.isPending ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
