import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { alertSuccess, alertError } from '@/Utils/alert';
import DataTable from '@/Components/DataTable';
import UserAvatar from '@/Components/UserAvatar';
import MobilePagination from '@/Components/MobilePagination';

export default function RolesSystemAccess({
    title = 'Peran Pengguna Briefing/Meeting',
    subtitle = 'Pengaturan peran pengguna khusus untuk sistem Briefing/Meeting',
    headTitle,
    routeName = 'admin.users.update-briefing-role',
    systemLabel = 'Briefing/Meeting',
    showGlobalRole = true,
    roles = [],
    userApps = [],
}) {
    const { errors } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [mobilePage, setMobilePage] = useState(1);
    const mobilePerPage = 8;

    const filtered = useMemo(() =>
        userApps.filter(ua =>
            ua.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ua.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ua.user?.karyawan?.divisi?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [userApps, searchQuery]
    );

    useEffect(() => {
        setMobilePage(1);
    }, [searchQuery]);

    const mobileTotalPages = Math.ceil(filtered.length / mobilePerPage);
    const mobileStart = (mobilePage - 1) * mobilePerPage;
    const mobileData = filtered.slice(mobileStart, mobileStart + mobilePerPage);

    const handleRoleChange = (userAppId, roleId) => {
        setUpdatingId(userAppId);
        router.patch(route(routeName, userAppId), {
            role_id: roleId || null
        }, {
            onSuccess: () => alertSuccess('Akses peran berhasil diubah.'),
            onError: (err) => alertError(err.message || 'Gagal mengubah akses.'),
            onFinish: () => setUpdatingId(null)
        });
    };

    const desktopColumns = useMemo(() => {
        const cols = [
            { key: 'no', label: 'No', className: 'w-12', render: (_, i) => i + 1 },
            {
                key: 'user',
                label: 'Nama Pengguna',
                className: 'min-w-0',
                tdClassName: 'font-bold text-sm truncate',
                render: (row) => (
                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate block">
                        {row.user?.name || '-'}
                    </span>
                )
            },
            {
                key: 'username',
                label: 'Username',
                className: 'min-w-0',
                render: (row) => (
                    <span className="text-sm text-gray-500 dark:text-zinc-400 truncate block">
                        @{row.user?.username || '-'}
                    </span>
                )
            },
            {
                key: 'email',
                label: 'Email',
                className: 'min-w-0',
                render: (row) => (
                    <span className="text-sm text-gray-600 dark:text-zinc-300 truncate block">
                        {row.user?.email || '-'}
                    </span>
                )
            },
            {
                key: 'divisi',
                label: 'Divisi',
                className: 'min-w-0',
                render: (row) => (
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 truncate block">
                        {row.user?.karyawan?.divisi || <span className="text-gray-400 dark:text-zinc-500 font-normal">Tidak ada</span>}
                    </span>
                )
            },
        ];

        if (showGlobalRole) {
            cols.push({
                key: 'globalRole',
                label: 'Global Role',
                className: 'whitespace-nowrap',
                render: (row) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200/60 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                        {row.user?.role?.name?.toUpperCase() || 'USER'}
                    </span>
                )
            });
        }

        cols.push({
            key: 'role',
            label: `Role ${systemLabel}`,
            className: 'whitespace-nowrap',
            thClassName: 'text-right',
            tdClassName: 'text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <div className="relative inline-block">
                        <select
                            value={row.role_id || ''}
                            onChange={(e) => handleRoleChange(row.id, e.target.value)}
                            disabled={updatingId === row.id}
                            className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold tracking-wide transition cursor-pointer shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-600"
                        >
                            <option value="">Default (User)</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400 dark:text-zinc-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    {updatingId === row.id && (
                        <svg className="animate-spin h-4 w-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                </div>
            )
        });

        return cols;
    }, [showGlobalRole, systemLabel, roles, updatingId, routeName]);

    return (
        <AuthenticatedLayout
            title={title}
            subtitle={subtitle}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title={headTitle || title} />

            <div className="flex-1 flex flex-col min-h-0 pb-1">
                {errors?.message && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-400 text-sm">
                        <svg className="w-5 h-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <span className="font-bold">Error:</span> {errors.message}
                        </div>
                    </div>
                )}

                {/* Mobile: Card list */}
                <div className="md:hidden space-y-3 pb-20">
                    {mobileData.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">
                            Belum ada pengguna yang memiliki akses ke sistem {systemLabel}.
                        </div>
                    ) : mobileData.map(ua => {
                        const u = ua.user;
                        return (
                            <div key={ua.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
                                {/* User info */}
                                <div className="flex items-center gap-3 mb-3">
                                    <UserAvatar name={u?.name} avatarUrl={u?.avatar_url} className="w-10 h-10" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u?.name}</p>
                                        <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">@{u?.username}</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-1 mb-3">
                                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                                        <span className="font-semibold text-gray-700 dark:text-zinc-300">Divisi:</span> {u?.karyawan?.divisi || <span className="text-gray-400 dark:text-zinc-500">Tidak ada</span>}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-zinc-400 truncate">
                                        <span className="font-semibold text-gray-700 dark:text-zinc-300">Email:</span> {u?.email}
                                    </p>
                                    {showGlobalRole && (
                                        <p className="text-xs text-gray-600 dark:text-zinc-400">
                                            <span className="font-semibold text-gray-700 dark:text-zinc-300">Global Role:</span>{' '}
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200/60 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                                                {u?.role?.name?.toUpperCase() || 'USER'}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Role select */}
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase shrink-0">Role {systemLabel}:</span>
                                    <div className="relative flex-1">
                                        <select
                                            value={ua.role_id || ''}
                                            onChange={(e) => handleRoleChange(ua.id, e.target.value)}
                                            disabled={updatingId === ua.id}
                                            className="w-full appearance-none pl-3 pr-8 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold tracking-wide transition cursor-pointer"
                                        >
                                            <option value="">Default (User)</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400 dark:text-zinc-400">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {updatingId === ua.id && (
                                        <svg className="animate-spin h-4 w-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <MobilePagination currentPage={mobilePage} totalPages={mobileTotalPages} onPageChange={setMobilePage} />
                </div>

                {/* Desktop: DataTable */}
                <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-auto flex-1 flex flex-col min-h-0">
                    <DataTable
                        data={filtered}
                        columns={desktopColumns}
                        emptyState={
                            <div className="py-16 text-center text-gray-400 dark:text-zinc-500 text-sm">
                                Belum ada pengguna yang memiliki akses ke sistem {systemLabel}.
                            </div>
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
