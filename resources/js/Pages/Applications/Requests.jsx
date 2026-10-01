import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { alertSuccess, alertError, alertConfirm } from '@/Utils/alert';
import DataTable from '@/Components/DataTable';
import UserAvatar from '@/Components/UserAvatar';
import MobilePagination from '@/Components/MobilePagination';

export default function Requests({ allRequests = [] }) {
    const [reqSearchQuery, setReqSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'pending'
    const [togglingId, setTogglingId] = useState(null);
    const [mobilePage, setMobilePage] = useState(1);
    const mobilePerPage = 8;

    // Filter user requests by search query and status filter
    const filteredRequests = useMemo(() => {
        return (allRequests || []).filter(req => {
            const userName = req.user?.name || '';
            const appName = req.application?.name || '';
            const matchesSearch = userName.toLowerCase().includes(reqSearchQuery.toLowerCase()) ||
                appName.toLowerCase().includes(reqSearchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'active') return req.is_active;
            if (statusFilter === 'pending') return !req.is_active;

            return true;
        }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [allRequests, reqSearchQuery, statusFilter]);

    // Reset mobile page on filter/search changes
    useEffect(() => {
        setMobilePage(1);
    }, [reqSearchQuery, statusFilter]);

    // Mobile pagination
    const mobileTotalPages = Math.ceil(filteredRequests.length / mobilePerPage);
    const mobileStart = (mobilePage - 1) * mobilePerPage;
    const mobileRequests = filteredRequests.slice(mobileStart, mobileStart + mobilePerPage);

    const handleToggleAccess = async (reqId, activate) => {
        const req = (allRequests || []).find(r => r.id === reqId);
        const userName = req?.user?.name || 'Pengguna';
        const appName = req?.application?.name || '';
        const action = activate ? 'mengaktifkan' : 'menonaktifkan';
        const detail = activate ? 'Pengguna akan mendapatkan akses ke aplikasi.' : 'Akses pengguna ke aplikasi akan dicabut.';

        const confirmed = await alertConfirm('Ubah Akses?', `${action} akses ${userName}${appName ? ' ke ' + appName : ''}? ${detail}`, {
            confirmButtonText: 'Ya, Lanjutkan',
        });
        if (confirmed) {
            setTogglingId(reqId);
            router.patch(route('applications.toggle'), {
                user_application_id: reqId,
                is_active: activate
            }, {
                onSuccess: () => alertSuccess('Akses berhasil diperbarui.'),
                onError: (err) => alertError(err.message || 'Gagal memperbarui akses.'),
                onFinish: () => setTogglingId(null)
            });
        }
    };

    return (
        <AuthenticatedLayout
            title="Kelola Permintaan Akses"
            subtitle="Tinjau dan setujui permintaan akses pengguna"
            searchQuery={reqSearchQuery}
            setSearchQuery={setReqSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
        >
            <Head title="Kelola Permintaan Akses" />

            <div className="flex-1 flex flex-col min-h-0 pb-1">
                {/* Mobile: Card list */}
                <div className="md:hidden space-y-3 pb-20">
                    {mobileRequests.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">
                            Tidak ada data permintaan akses.
                        </div>
                    ) : mobileRequests.map(req => {
                        const isPending = !req.is_active;
                        return (
                            <div key={req.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
                                {/* User info */}
                                <div className="flex items-center gap-3 mb-3">
                                    <UserAvatar name={req.user?.name} avatarUrl={req.user?.avatar_url} className="w-10 h-10" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{req.user?.name}</p>
                                        <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{req.user?.karyawan?.divisi || 'Tanpa Divisi'} • {req.user?.email}</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-1.5 mb-3">
                                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                                        <span className="font-semibold text-gray-700 dark:text-zinc-300">Aplikasi:</span> {req.application?.name}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                                        <span className="font-semibold text-gray-700 dark:text-zinc-300">Tanggal:</span>{' '}
                                        {req.created_at ? new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                                        <span className="font-semibold text-gray-700 dark:text-zinc-300">Status:</span>{' '}
                                        {isPending ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">Pending</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">Aktif</span>
                                        )}
                                    </p>
                                    {!isPending && req.approver && (
                                        <p className="text-xs text-gray-600 dark:text-zinc-400">
                                            <span className="font-semibold text-gray-700 dark:text-zinc-300">Disetujui:</span> {req.approver.name}
                                            {req.approved_at && (
                                                <span className="text-gray-400 dark:text-zinc-500 ml-1">({new Date(req.approved_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})</span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                    {isPending ? (
                                        <button
                                            onClick={() => handleToggleAccess(req.id, true)}
                                            disabled={togglingId === req.id}
                                            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm transition cursor-pointer disabled:opacity-60"
                                        >
                                            {togglingId === req.id ? (
                                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : 'Setujui'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleToggleAccess(req.id, false)}
                                            disabled={togglingId === req.id}
                                            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 text-xs font-bold rounded-lg border border-gray-200 dark:border-zinc-800 text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white dark:hover:bg-rose-900/60 transition cursor-pointer disabled:opacity-60"
                                        >
                                            {togglingId === req.id ? (
                                                <svg className="animate-spin h-3.5 w-3.5 text-rose-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : 'Nonaktifkan'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <MobilePagination currentPage={mobilePage} totalPages={mobileTotalPages} onPageChange={setMobilePage} />
                </div>

                {/* Desktop: DataTable — Sesuai Style Karyawan */}
                <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-auto flex-1 flex flex-col min-h-0">
                    <DataTable
                        data={filteredRequests}
                        tableClassName="table-fixed"
                        columns={[
                            { key: 'no', label: 'No', className: 'w-[7%]', render: (_, i) => i + 1 },
                            {
                                key: 'user',
                                label: 'Nama User',
                                className: 'w-[12%]',
                                tdClassName: 'font-bold text-sm truncate',
                                render: (row) => (
                                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate block" title={row.user?.name || '-'}>
                                        {row.user?.name || '-'}
                                    </span>
                                )
                            },
                            {
                                key: 'divisi',
                                label: 'Divisi',
                                className: 'w-[9%]',
                                render: (row) => (
                                    <span className="text-sm text-gray-600 dark:text-zinc-400 truncate block" title={row.user?.karyawan?.divisi || '-'}>
                                        {row.user?.karyawan?.divisi || '-'}
                                    </span>
                                )
                            },
                            {
                                key: 'email',
                                label: 'Email',
                                className: 'w-[13%]',
                                render: (row) => (
                                    <span className="text-sm text-gray-600 dark:text-zinc-400 truncate block" title={row.user?.email || '-'}>
                                        {row.user?.email || '-'}
                                    </span>
                                )
                            },
                            {
                                key: 'app',
                                label: 'Aplikasi',
                                className: 'w-[11%]',
                                render: (row) => (
                                    <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate block" title={row.application?.name || '-'}>
                                        {row.application?.name || '-'}
                                    </span>
                                )
                            },
                            {
                                key: 'date',
                                label: 'Tgl Pengajuan',
                                className: 'w-[12%] whitespace-nowrap',
                                render: (row) => (
                                    <span className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                                        {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        }) : '-'}
                                    </span>
                                )
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                className: 'w-[12%] whitespace-nowrap',
                                render: (row) => {
                                    const isPending = !row.is_active;
                                    return (
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                            isPending
                                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                            {isPending ? 'Pending' : 'Aktif'}
                                        </span>
                                    );
                                }
                            },
                            {
                                key: 'approver',
                                label: 'Persetujuan',
                                className: 'w-[10%]',
                                render: (row) => (
                                    <span className="text-sm text-gray-600 dark:text-zinc-400 truncate block" title={!row.is_active ? '-' : (row.approver?.name || '-')}>
                                        {!row.is_active ? '-' : (row.approver?.name || '-')}
                                    </span>
                                )
                            },
                            {
                                key: 'aksi',
                                label: 'Aksi',
                                className: 'w-[14%] whitespace-nowrap',
                                tdClassName: 'text-right',
                                render: (row) => {
                                    const isPending = !row.is_active;
                                    return isPending ? (
                                        <button
                                            onClick={() => handleToggleAccess(row.id, true)}
                                            disabled={togglingId === row.id}
                                            className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm focus:outline-none transition cursor-pointer"
                                        >
                                            {togglingId === row.id ? (
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
                                            onClick={() => handleToggleAccess(row.id, false)}
                                            disabled={togglingId === row.id}
                                            className="inline-flex items-center px-2.5 py-1 border border-gray-200 dark:border-zinc-800 text-xs font-bold rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white dark:hover:bg-rose-900/60 transition cursor-pointer"
                                        >
                                            {togglingId === row.id ? (
                                                <svg className="animate-spin h-3 w-3 text-rose-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : (
                                                'Nonaktifkan'
                                            )}
                                        </button>
                                    );
                                }
                            },
                        ]}
                        emptyState={
                            <div className="py-16 text-center text-gray-400 dark:text-zinc-500 text-sm">
                                Tidak ada data permintaan akses.
                            </div>
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
