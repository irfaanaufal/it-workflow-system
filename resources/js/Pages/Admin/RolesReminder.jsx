import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

export default function RolesReminder({ roles = [], userApps = [] }) {
    const { errors } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const filtered = userApps.filter(ua =>
        ua.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ua.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ua.user?.karyawan?.divisi?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRoleChange = (userAppId, newRoleId) => {
        setUpdatingId(userAppId);
        router.patch(route('admin.users.update-reminder-role', userAppId), {
            role_id: newRoleId || null
        }, {
            onFinish: () => setUpdatingId(null)
        });
    };

    const handleChatbotToggle = (userAppId, userId, currentValue) => {
        setUpdatingId(userAppId);
        router.patch(route('admin.users.update-reminder-role', userAppId), {
            can_use_chatbot: !currentValue ? 1 : 0
        }, {
            onFinish: () => setUpdatingId(null)
        });
    };

    return (
        <AuthenticatedLayout
            title="Peran Pengguna - Reminder"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Peran Pengguna Reminder" />

            <div className="py-4">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                            Peran Pengguna Reminder
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Atur peran pengguna dan akses AI Chatbot untuk sistem Reminder.
                        </p>
                    </div>
                </div>

                {errors?.message && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-450 text-sm">
                        <svg className="w-5 h-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <span className="font-bold">Error:</span> {errors.message}
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Tidak ada pengguna</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Belum ada pengguna yang memiliki akses ke sistem Reminder.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-150 dark:border-zinc-800 text-xs font-bold text-gray-550 dark:text-zinc-400 uppercase tracking-wider">
                                        <th className="py-4 px-6">Pengguna / Karyawan</th>
                                        <th className="py-4 px-6">Email</th>
                                        <th className="py-4 px-6">Divisi</th>
                                        <th className="py-4 px-6">Global Role</th>
                                        <th className="py-4 px-6">Role Reminder</th>
                                        <th className="py-4 px-6">Akses AI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                                    {filtered.map((ua) => {
                                        const u = ua.user;
                                        const initials = u?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
                                        const avatarUrl = u?.avatar_url || null;

                                        return (
                                            <tr key={ua.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-extrabold text-slate-550 dark:text-zinc-400">{initials}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{u?.name}</div>
                                                            <div className="text-xs text-gray-400 dark:text-zinc-500">
                                                                username: @{u?.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                                                    {u?.email}
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-650 dark:text-zinc-450 whitespace-nowrap">
                                                    {u?.karyawan?.divisi || <span className="text-gray-400 dark:text-zinc-650">Tidak ada</span>}
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200/60 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                                                        {u?.role?.name?.toUpperCase() || 'USER'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={ua.role_id || ''}
                                                            onChange={(e) => handleRoleChange(ua.id, e.target.value)}
                                                            disabled={updatingId === ua.id}
                                                            className="px-3 py-1.5 bg-gray-55 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-semibold transition cursor-pointer"
                                                        >
                                                            <option value="">Default (User)</option>
                                                            {roles.filter(r => r.name !== 'superadmin').map(r => (
                                                                <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-200 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!u?.can_use_chatbot}
                                                                onChange={() => handleChatbotToggle(ua.id, u?.id, u?.can_use_chatbot)}
                                                                disabled={updatingId === ua.id}
                                                                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
                                                            />
                                                            <span>{u?.can_use_chatbot ? 'Diizinkan' : 'Tidak'}</span>
                                                        </label>
                                                    </div>
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
