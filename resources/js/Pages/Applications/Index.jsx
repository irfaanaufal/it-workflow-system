import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

export default function Index({ applications = [] }) {
    const { errors } = usePage().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [requestingId, setRequestingId] = useState(null);

    // Filter applications by search query
    const filteredApps = (applications || []).filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleRequestAccess = (appId) => {
        setRequestingId(appId);
        router.post(route('applications.request'), {
            application_id: appId
        }, {
            onFinish: () => setRequestingId(null)
        });
    };

    return (
        <AuthenticatedLayout
            title="Applications Access"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Akses Aplikasi" />

            <div className="py-4">
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                            Akses Aplikasi Saya
                        </h2>
                        <p className="mt-1 text-sm text-gray-550 dark:text-gray-400">
                            Ajukan permintaan akses dan masuk ke berbagai aplikasi internal sistem dengan satu akun terintegrasi.
                        </p>
                    </div>
                </div>

                {errors?.message && (
                    <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3 text-rose-800 dark:text-rose-450 text-sm">
                        <svg className="w-5 h-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <span className="font-bold">Akses Ditolak:</span> {errors.message}
                        </div>
                    </div>
                )}

                {filteredApps.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Tidak ada aplikasi ditemukan</h3>
                        <p className="mt-1 text-sm text-gray-555 dark:text-gray-400">Coba ubah kata kunci pencarian Anda.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {filteredApps.map((app) => {
                            const userAccess = app.users && app.users.length > 0 ? app.users[0] : null;
                            const isPending = userAccess && !userAccess.pivot.is_active;
                            const isGranted = userAccess && userAccess.pivot.is_active;

                            return (
                                <div
                                    key={app.id}
                                    className="relative flex flex-col justify-between bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-zinc-700 transition-all duration-300 group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-x-4 mb-4">
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </div>

                                            <div>
                                                {isPending && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-455 dark:border-amber-900/50">
                                                        Pending Approval
                                                    </span>
                                                )}
                                                {isGranted && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50">
                                                        Access Granted
                                                    </span>
                                                )}
                                                {!userAccess && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200/60 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                                                        No Access
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {app.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                                            {app.description || 'Tidak ada deskripsi tersedia untuk aplikasi ini.'}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-50 dark:border-zinc-800/50">
                                        {isGranted ? (
                                            <a
                                                href={app.slug}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                            >
                                                Open Application
                                                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </a>
                                        ) : isPending ? (
                                            <button
                                                disabled
                                                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-200 dark:border-zinc-800 text-sm font-semibold rounded-xl text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-850 cursor-not-allowed transition-colors"
                                            >
                                                Waiting for Approval
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRequestAccess(app.id)}
                                                disabled={requestingId === app.id}
                                                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-sm font-semibold rounded-xl text-gray-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                                            >
                                                {requestingId === app.id ? (
                                                    <span className="flex items-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Sending...
                                                    </span>
                                                ) : (
                                                    'Request Access'
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
