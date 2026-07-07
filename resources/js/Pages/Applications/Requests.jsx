import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Requests({ allRequests = [] }) {
    const [reqSearchQuery, setReqSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'pending'
    const [togglingId, setTogglingId] = useState(null);

    // Filter user requests by search query and status filter
    const filteredRequests = (allRequests || []).filter(req => {
        const userName = req.user?.name || '';
        const appName = req.application?.name || '';
        const matchesSearch = userName.toLowerCase().includes(reqSearchQuery.toLowerCase()) || 
                             appName.toLowerCase().includes(reqSearchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (statusFilter === 'active') return req.is_active;
        if (statusFilter === 'pending') return !req.is_active;
        
        return true;
    });

    const handleToggleAccess = (reqId, activate) => {
        setTogglingId(reqId);
        router.patch(route('applications.toggle'), {
            user_application_id: reqId,
            is_active: activate
        }, {
            onFinish: () => setTogglingId(null)
        });
    };

    return (
        <AuthenticatedLayout
            title="Kelola Permintaan Akses"
            searchQuery={reqSearchQuery}
            setSearchQuery={setReqSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
        >
            <Head title="Kelola Permintaan Akses" />

            <div className="py-4">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                            Kelola Permintaan Akses
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Tinjau dan setujui permintaan akses sistem untuk semua pengguna secara terpusat.
                        </p>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                    {/* Table */}
                    {filteredRequests.length === 0 ? (
                        <div className="text-center py-16">
                            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Tidak ada data permintaan</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tidak ada pengajuan yang sesuai filter saat ini.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-150 dark:border-zinc-800 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                        <th className="py-4 px-6">User / Karyawan</th>
                                        <th className="py-4 px-6">Aplikasi</th>
                                        <th className="py-4 px-6">Tanggal Pengajuan</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6">Persetujuan</th>
                                        <th className="py-4 px-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                                    {filteredRequests.map((req) => {
                                        const initials = req.user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
                                        const avatarUrl = req.user?.avatar_url || null;
                                        const isPending = !req.is_active;

                                        return (
                                            <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-extrabold text-slate-500 dark:text-zinc-400">{initials}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{req.user?.name}</div>
                                                            <div className="text-xs text-gray-400 dark:text-zinc-500">
                                                                {req.user?.karyawan?.divisi || 'Tanpa Divisi'} • {req.user?.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                                                        {req.application?.name}
                                                    </div>
                                                    <div className="text-xs text-gray-450 dark:text-zinc-500">
                                                        slug: {req.application?.slug}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                                                    {new Date(req.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    {isPending ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                                                            Aktif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                                                    {!isPending && req.approver ? (
                                                        <div>
                                                            <div className="font-bold text-gray-700 dark:text-zinc-300">
                                                                Oleh: {req.approver.name}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                                {new Date(req.approved_at).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 dark:text-zinc-600">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                                    {isPending ? (
                                                        <button
                                                            onClick={() => handleToggleAccess(req.id, true)}
                                                            disabled={togglingId === req.id}
                                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-750 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm focus:outline-none transition cursor-pointer"
                                                        >
                                                            {togglingId === req.id ? (
                                                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                            ) : (
                                                                'Setujui'
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleAccess(req.id, false)}
                                                            disabled={togglingId === req.id}
                                                            className="inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-zinc-800 text-xs font-bold rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white dark:hover:bg-rose-900/60 transition cursor-pointer"
                                                        >
                                                            {togglingId === req.id ? (
                                                                    <svg className="animate-spin h-3 w-3 text-rose-500" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                    </svg>
                                                            ) : (
                                                                'Nonaktifkan'
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
