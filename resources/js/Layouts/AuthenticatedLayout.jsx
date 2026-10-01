import { Link, router, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '@/Components/Sidebar';
import useTheme from '@/Hooks/useTheme';
import useNotifications from '@/Hooks/useNotifications';
import CreateTicketModal from '@/Components/layout/CreateTicketModal';
import FidLinkModal from '@/Components/layout/FidLinkModal';
import NotificationsDropdown from '@/Components/layout/NotificationsDropdown';
import SettingsDropdown from '@/Components/layout/SettingsDropdown';
import FilterDropdown from '@/Components/layout/FilterDropdown';
import MobileFab from '@/Components/layout/MobileFab';

const ICON = 'h-[18px] w-[18px]';

export default function AuthenticatedLayout({
    children,
    title,
    subtitle,
    searchQuery: propSearchQuery,
    setSearchQuery: propSetSearchQuery,
    startDate: propStartDate,
    setStartDate: propSetStartDate,
    endDate: propEndDate,
    setEndDate: propSetEndDate,
    dateRangeType: propDateRangeType,
    setDateRangeType: propSetDateRangeType,
    dateRangeLabel: propDateRangeLabel,
    setDateRangeLabel: propSetDateRangeLabel,
    filterCategory: propFilterCategory,
    setFilterCategory: propSetFilterCategory,
    filterUrgency: propFilterUrgency,
    setFilterUrgency: propSetFilterUrgency,
    statusFilter: propStatusFilter,
    setStatusFilter: propSetStatusFilter,
    filterDivisi: propFilterDivisi,
    setFilterDivisi: propSetFilterDivisi,
    filterStatus: propFilterStatus,
    setFilterStatus: propSetFilterStatus,
    divisiOptions: propDivisiOptions,
    showMobileThemeToggle = false
}) {
    const user = usePage().props.auth.user;
    const asset_url = (usePage().props.asset_url || '').replace(/\/+$/, '');
    const isIT = user.is_it === true;

    const { isDarkMode, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAllRead, markOneRead, handleNotifClick, notifDot } = useNotifications(asset_url);

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMobileNotifModalOpen, setIsMobileNotifModalOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    const [localSearchQuery, localSetSearchQuery] = useState('');
    const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
    const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : localSetSearchQuery;

    const [localDateRangeLabel, localSetDateRangeLabel] = useState('Semua Waktu');
    const dateRangeLabel = propDateRangeLabel !== undefined ? propDateRangeLabel : localDateRangeLabel;
    const setDateRangeLabel = propSetDateRangeLabel !== undefined ? propSetDateRangeLabel : localSetDateRangeLabel;

    const [localDateRangeType, localSetDateRangeType] = useState('all');
    const dateRangeType = propDateRangeType !== undefined ? propDateRangeType : localDateRangeType;
    const setDateRangeType = propSetDateRangeType !== undefined ? propSetDateRangeType : localSetDateRangeType;

    const [localStartDate, localSetStartDate] = useState('');
    const startDate = propStartDate !== undefined ? propStartDate : localStartDate;
    const setStartDate = propSetStartDate !== undefined ? propSetStartDate : localSetStartDate;

    const [localEndDate, localSetEndDate] = useState('');
    const endDate = propEndDate !== undefined ? propEndDate : localEndDate;
    const setEndDate = propSetEndDate !== undefined ? propSetEndDate : localSetEndDate;

    const [localFilterCategory, localSetFilterCategory] = useState('all');
    const filterCategory = propFilterCategory !== undefined ? propFilterCategory : localFilterCategory;
    const setFilterCategory = propSetFilterCategory !== undefined ? propSetFilterCategory : localSetFilterCategory;

    const [localFilterUrgency, localSetFilterUrgency] = useState('all');
    const filterUrgency = propFilterUrgency !== undefined ? propFilterUrgency : localFilterUrgency;
    const setFilterUrgency = propSetFilterUrgency !== undefined ? propSetFilterUrgency : localSetFilterUrgency;

    const [localStatusFilter, localSetStatusFilter] = useState('all');
    const statusFilter = propStatusFilter !== undefined ? propStatusFilter : localStatusFilter;
    const setStatusFilter = propSetStatusFilter !== undefined ? propSetStatusFilter : localSetStatusFilter;

    const [localFilterDivisi, localSetFilterDivisi] = useState('all');
    const filterDivisi = propFilterDivisi !== undefined ? propFilterDivisi : localFilterDivisi;
    const setFilterDivisi = propSetFilterDivisi !== undefined ? propSetFilterDivisi : localSetFilterDivisi;

    const [localFilterStatus, localSetFilterStatus] = useState('all');
    const filterStatus = propFilterStatus !== undefined ? propFilterStatus : localFilterStatus;
    const setFilterStatus = propSetFilterStatus !== undefined ? propSetFilterStatus : localSetFilterStatus;

    const divisiOptions = propDivisiOptions || [];

    const notifRef = useRef(null);
    const settingsRef = useRef(null);
    const filterRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (!notifRef.current || !notifRef.current.contains(e.target)) setNotifOpen(false);
            if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
            if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const canCreate = true;
    const showCreateBtn = canCreate && (route().current('my-requests') || route().current('admin.inbox'));
    const showSearch = !route().current('profile.edit') && !route().current('dashboard') && !route().current('admin.kanban') && !route().current('global-monitor');
    const showBackButton = !route().current('dashboard');

    return (
        <div className="min-h-screen max-w-full overflow-x-hidden bg-[#e8e9eb] dark:bg-[#0a0a0a] flex items-center justify-center md:p-4 gap-4 transition-colors duration-200">
            <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} unreadCount={unreadCount} onOpenNotifications={() => setIsMobileNotifModalOpen(true)} />

            <div className="flex-1 min-w-0 h-screen md:h-[calc(100vh-2rem)] bg-[#f5f5f7] dark:bg-[#111111] md:border md:border-gray-200 dark:border-zinc-800/80 md:rounded-[32px] flex flex-col overflow-hidden md:shadow-lg transition-colors duration-200">
                <header className="h-16 md:h-[72px] flex justify-between items-center px-4 md:px-8 flex-shrink-0 bg-[#f5f5f7]/90 dark:bg-[#111111]/90 backdrop-blur-md z-20 border-b border-gray-200/60 dark:border-zinc-800/60 md:border-none transition-colors duration-200">
                    {/* Left */}
                    <div className={`items-center gap-3 ${searchOpen ? 'hidden sm:flex' : 'flex'}`}>
                        {showBackButton && (
                            <button
                                onClick={() => window.history.back()}
                                className="h-10 w-10 flex items-center justify-center text-gray-500 dark:text-zinc-400 cursor-pointer shrink-0 active:scale-95 transition"
                                title="Kembali"
                            >
                                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h1 className="hidden md:block text-base md:text-lg font-bold text-gray-800 dark:text-zinc-100 tracking-tight leading-tight">{title || 'Dashboard'}</h1>
                            {subtitle && <p className="hidden md:block text-[10px] text-gray-400 dark:text-zinc-500 font-semibold tracking-wide mt-0.5">{subtitle}</p>}
                            <h1 className="block md:hidden text-base font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">{title || 'Dashboard'}</h1>
                        </div>
                    </div>

                    {/* Mobile Full-width Search */}
                    {searchOpen && showSearch && (
                        <div className="flex-1 sm:hidden flex items-center gap-2 animate-fadeIn mx-1">
                            <div className="relative flex-1">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari..."
                                    className="w-full pl-9 pr-9 h-9 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition" />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 px-1 cursor-pointer shrink-0">Batal</button>
                        </div>
                    )}

                    {/* Right */}
                    <div className="flex items-center gap-2 md:gap-3.5">
                        {showCreateBtn && (
                            <button onClick={() => setIsCreateModalOpen(true)} className="hidden md:flex h-9 md:h-10 px-3 md:px-4 rounded-xl bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer transition">
                                <span className="text-sm font-black leading-none">+</span><span>Buat Laporan</span>
                            </button>
                        )}
                        {route().current('admin.systems.index') && (
                            <button onClick={() => window.dispatchEvent(new CustomEvent('open-add-system-modal'))} className="hidden md:flex h-9 md:h-10 px-3 md:px-4 rounded-xl bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer transition">
                                <span className="text-sm font-black leading-none">+</span><span>Tambah Sistem</span>
                            </button>
                        )}
                        {route().current('admin.applications.index') && (
                            <button onClick={() => window.dispatchEvent(new CustomEvent('open-add-application-modal'))} className="hidden md:flex h-9 md:h-10 px-3 md:px-4 rounded-xl bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer transition">
                                <span className="text-sm font-black leading-none">+</span><span>Tambah Aplikasi</span>
                            </button>
                        )}
                        {route().current('admin.karyawan.index') && (
                            <button onClick={() => window.dispatchEvent(new CustomEvent('open-add-karyawan-modal'))} className="hidden md:flex h-9 md:h-10 px-3 md:px-4 rounded-xl bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer transition">
                                <span className="text-sm font-black leading-none">+</span><span>Tambah Karyawan</span>
                            </button>
                        )}

                        {searchOpen && showSearch && (
                            <div className="relative animate-fadeIn hidden sm:block">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search"
                                    className="pl-9 pr-8 h-9 md:h-10 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition w-44 md:w-64 shadow-xs" />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 cursor-pointer">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="hidden sm:flex items-center gap-4 bg-white dark:bg-zinc-900 px-4 h-9 md:h-10 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm transition-colors duration-200">
                            {showSearch && (
                                <HeaderBtn onClick={() => { setSearchOpen(p => !p); setNotifOpen(false); setSettingsOpen(false); }} title="Cari Tiket" active={searchOpen} flat={true}>
                                    <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </HeaderBtn>
                            )}

                            <div className="relative" ref={notifRef}>
                                <HeaderBtn onClick={() => { setNotifOpen(p => !p); setSearchOpen(false); setSettingsOpen(false); }} title="Notifikasi" active={notifOpen} flat={true}>
                                    <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-rose-500 text-white text-[9px] font-extrabold rounded-full ring-2 ring-white dark:ring-zinc-900">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                                </HeaderBtn>
                                {notifOpen && <NotificationsDropdown notifications={notifications} unreadCount={unreadCount} notifDot={notifDot} onMarkAllRead={markAllRead} onNotifClick={handleNotifClick} />}
                            </div>

                            <div className="relative" ref={settingsRef}>
                                <HeaderBtn onClick={() => { setSettingsOpen(p => !p); setSearchOpen(false); setNotifOpen(false); }} title="Pengaturan" active={settingsOpen} flat={true}>
                                    <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </HeaderBtn>
                                {settingsOpen && <SettingsDropdown isDarkMode={isDarkMode} onToggleTheme={toggleTheme} onLogout={() => axios.post(route('logout')).then(() => { router.visit(route('login')); }).catch(() => {})} onClose={() => setSettingsOpen(false)} />}
                            </div>
                        </div>

                        {(route().current('history') || route().current('admin.systems.index') || route().current('admin.applications.requests') || route().current('admin.karyawan.index')) && (
                            <FilterDropdown filterOpen={filterOpen} setFilterOpen={setFilterOpen} filterRef={filterRef}
                                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                                filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                                filterUrgency={filterUrgency} setFilterUrgency={setFilterUrgency}
                                filterDivisi={filterDivisi} setFilterDivisi={setFilterDivisi} divisiOptions={divisiOptions}
                                filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                                dateRangeType={dateRangeType} setDateRangeType={setDateRangeType}
                                dateRangeLabel={dateRangeLabel} setDateRangeLabel={setDateRangeLabel}
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate} />
                        )}

                        <div className={`sm:hidden flex items-center gap-2 ${searchOpen ? 'hidden' : 'flex'}`}>
                            <button onClick={() => setIsMobileNotifModalOpen(true)} title="Notifikasi"
                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 shadow-sm transition cursor-pointer shrink-0 active:scale-95 relative">
                                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-1 ring-white dark:ring-zinc-900" />}
                            </button>
                            {showMobileThemeToggle && (
                                <button onClick={toggleTheme} title="Ganti Tema" aria-label="Toggle theme"
                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 shadow-sm transition cursor-pointer shrink-0 active:scale-95">
                                    {isDarkMode ? <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                                </button>
                            )}
                            {showSearch && (
                                <HeaderBtn onClick={() => { setSearchOpen(p => !p); setNotifOpen(false); setSettingsOpen(false); }} title="Cari Laporan" active={searchOpen} flat={false}>
                                    <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </HeaderBtn>
                            )}
                            <button onClick={() => setMobileSidebarOpen(true)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 shadow-sm cursor-pointer transition shrink-0 active:scale-95 relative">
                                <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-1 ring-white dark:ring-zinc-900" />}
                            </button>
                        </div>

                        <button onClick={toggleTheme} title="Ganti Tema" aria-label="Toggle theme"
                            className="hidden sm:flex h-9 w-9 md:h-10 md:w-10 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl items-center justify-center text-gray-500 dark:text-zinc-400 shadow-sm transition cursor-pointer shrink-0">
                            {isDarkMode ? <svg className={`${ICON} text-amber-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                                : <svg className={`${ICON} text-gray-500 dark:text-zinc-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                        </button>
                    </div>
                </header>

                <main className="flex-1 min-w-0 px-4 md:px-8 pb-6 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">{children}</main>
            </div>

            <CreateTicketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} user={user} />
            <FidLinkModal isOpen={!user.fid} user={user} onLogout={() => axios.post(route('logout')).then(() => { router.visit(route('login')); }).catch(() => {})} />

            <MobileFab showCreateBtn={showCreateBtn} onCreateClick={() => setIsCreateModalOpen(true)} />

            {isMobileNotifModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileNotifModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl z-10 max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Notifikasi</h3>
                                {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount} Baru</span>}
                            </div>
                            <button onClick={() => setIsMobileNotifModalOpen(false)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 cursor-pointer p-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {notifications.length === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-8">Belum ada notifikasi</p>
                            ) : notifications.map(n => (
                                <div key={n.id} onClick={() => { handleNotifClick(n); setIsMobileNotifModalOpen(false); }}
                                    className={`flex items-start gap-3 p-3 rounded-xl transition cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/40 ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''}`}>
                                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notifDot(n.status)}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 dark:text-zinc-300 leading-snug">{n.msg}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">{n.time.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />}
                                </div>
                            ))}
                        </div>
                        {unreadCount > 0 && (
                            <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                                <button onClick={() => { markAllRead(); setIsMobileNotifModalOpen(false); }}
                                    className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold cursor-pointer">Tandai semua dibaca</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function HeaderBtn({ onClick, title, active, children, flat }) {
    if (flat) {
        return (
            <button onClick={onClick} title={title} aria-pressed={active}
                className={`relative flex items-center justify-center transition cursor-pointer shrink-0 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white active:scale-95 duration-150 ${active ? 'text-indigo-600 dark:text-indigo-400 scale-110' : ''}`}>
                {children}
            </button>
        );
    }
    return (
        <button onClick={onClick} title={title} aria-pressed={active}
            className={`relative h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl border shadow-sm transition cursor-pointer shrink-0 ${active ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80' : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-800'}`}>
            {children}
        </button>
    );
}
