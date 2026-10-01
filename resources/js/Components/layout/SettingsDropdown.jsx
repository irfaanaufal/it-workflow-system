import { Link } from '@inertiajs/react';
import React from 'react';

export default function SettingsDropdown({
    isDarkMode,
    onToggleTheme,
    onLogout,
    onClose,
}) {
    return (
        <div className="absolute right-0 top-[calc(100%+10px)] w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-gray-800 dark:text-zinc-100">Pengaturan</p>
            </div>
            <div className="p-2 space-y-0.5">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            {isDarkMode ? (
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                            ) : (
                                <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            )}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>
                    </div>
                    <button onClick={onToggleTheme} className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isDarkMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800 mx-2 my-1" />

                <Link href={route('profile.edit')} onClick={onClose}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Edit Profil</span>
                </Link>

                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Notifikasi</span>
                    </div>
                    <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">Aktif</span>
                </div>

                <hr className="border-gray-100 dark:border-zinc-800 mx-2 my-1" />

                <button onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 dark:text-rose-400 transition cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </div>
                    <span className="text-xs font-semibold">Keluar</span>
                </button>
            </div>
        </div>
    );
}
