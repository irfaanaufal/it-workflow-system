import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { alertSuccess, alertError, alertConfirm } from '@/Utils/alert';
import DataTable from '@/Components/DataTable';
import UserAvatar from '@/Components/UserAvatar';
import MobilePagination from '@/Components/MobilePagination';

export default function RolesPermissions({ roles = [], users = [] }) {
    const { errors } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [updatingRoleId, setUpdatingRoleId] = useState(null);
    const [mobilePage, setMobilePage] = useState(1);
    const mobilePerPage = 8;

    const handleUserRoleChange = async (userId, newRoleId) => {
        const user = users.find(u => u.id == userId);
        const userName = user?.name || 'Pengguna';
        const newRole = roles.find(r => r.id == newRoleId);
        const roleName = newRole?.name?.toUpperCase() || 'Tidak Diketahui';

        const confirmed = await alertConfirm('Ubah Peran?', `Ubah peran ${userName} menjadi ${roleName}?`, {
            confirmButtonText: 'Ya, Ubah',
        });
        if (confirmed) {
            setUpdatingRoleId(userId);
            router.patch(route('admin.users.update-role', userId), {
                role_id: newRoleId
            }, {
                onSuccess: () => alertSuccess('Peran berhasil diubah.'),
                onError: (err) => alertError(err.message || 'Gagal mengubah peran.'),
                onFinish: () => setUpdatingRoleId(null)
            });
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.karyawan?.divisi?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    // Reset mobile page on search change
    useEffect(() => {
        setMobilePage(1);
    }, [searchQuery]);

    // Mobile pagination
    const mobileTotalPages = Math.ceil(filteredUsers.length / mobilePerPage);
    const mobileStart = (mobilePage - 1) * mobilePerPage;
    const mobileUsers = filteredUsers.slice(mobileStart, mobileStart + mobilePerPage);

    return (
        <AuthenticatedLayout
            title="Peran Pengguna"
            subtitle="Pengaturan hak akses peran pengguna"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Peran Pengguna" />

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
                    {mobileUsers.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">
                            Tidak ada pengguna yang ditemukan.
                        </div>
                    ) : mobileUsers.map(user => (
                        <div key={user.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
                            {/* User info */}
                            <div className="flex items-center gap-3 mb-3">
                                <UserAvatar name={user.name} avatarUrl={user.avatar_url} className="w-10 h-10" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">@{user.username}</p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-1 mb-3">
                                <p className="text-xs text-gray-600 dark:text-zinc-400">
                                    <span className="font-semibold text-gray-700 dark:text-zinc-300">Divisi:</span> {user.karyawan?.divisi || <span className="text-gray-400 dark:text-zinc-500">Tidak ada</span>}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-zinc-400 truncate">
                                    <span className="font-semibold text-gray-700 dark:text-zinc-300">Email:</span> {user.email}
                                </p>
                            </div>

                            {/* Role select */}
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase">Peran:</span>
                                <div className="relative flex-1">
                                    <select
                                        value={user.role_id || ''}
                                        onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                                        disabled={updatingRoleId === user.id}
                                        className="w-full appearance-none pl-3 pr-8 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold tracking-wide transition cursor-pointer"
                                    >
                                        <option value="" disabled>Pilih Peran</option>
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
                                {updatingRoleId === user.id && (
                                    <svg className="animate-spin h-4 w-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    ))}

                    <MobilePagination currentPage={mobilePage} totalPages={mobileTotalPages} onPageChange={setMobilePage} />
                </div>

                {/* Desktop: DataTable — Sesuai Style Karyawan */}
                <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-auto flex-1 flex flex-col min-h-0">
                    <DataTable
                        data={filteredUsers}
                        columns={[
                            { key: 'no', label: 'No', className: 'w-12', render: (_, i) => i + 1 },
                            {
                                key: 'name',
                                label: 'Nama Pengguna',
                                className: 'min-w-0',
                                tdClassName: 'font-bold text-sm truncate',
                                render: (row) => (
                                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate block">
                                        {row.name}
                                    </span>
                                )
                            },
                            {
                                key: 'username',
                                label: 'Username',
                                className: 'min-w-0',
                                render: (row) => (
                                    <span className="text-sm text-gray-500 dark:text-zinc-400 truncate block">
                                        @{row.username}
                                    </span>
                                )
                            },
                            {
                                key: 'email',
                                label: 'Email',
                                className: 'min-w-0',
                                render: (row) => (
                                    <span className="text-sm text-gray-600 dark:text-zinc-300 truncate block">
                                        {row.email}
                                    </span>
                                )
                            },
                            {
                                key: 'divisi',
                                label: 'Divisi',
                                className: 'min-w-0',
                                render: (row) => (
                                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 truncate block">
                                        {row.karyawan?.divisi || <span className="text-gray-400 dark:text-zinc-500 font-normal">Tidak ada</span>}
                                    </span>
                                )
                            },
                            {
                                key: 'role',
                                label: 'Peran (Role)',
                                className: 'whitespace-nowrap',
                                thClassName: 'text-right',
                                tdClassName: 'text-right',
                                render: (row) => (
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="relative inline-block">
                                            <select
                                                value={row.role_id || ''}
                                                onChange={(e) => handleUserRoleChange(row.id, e.target.value)}
                                                disabled={updatingRoleId === row.id}
                                                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold tracking-wide transition cursor-pointer shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-600"
                                            >
                                                <option value="" disabled>Pilih Peran</option>
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
                                        {updatingRoleId === row.id && (
                                            <svg className="animate-spin h-4 w-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        )}
                                    </div>
                                )
                            },
                        ]}
                        emptyState={
                            <div className="py-16 text-center text-gray-400 dark:text-zinc-500 text-sm">
                                Tidak ada pengguna yang ditemukan.
                            </div>
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
