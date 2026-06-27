import { Link, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '@/Components/Sidebar';
import Modal from '@/Components/Modal';

/* ──────────────────────────────────────────────────────────────────────────
   Shared icon size — ALWAYS use this so light & dark match
────────────────────────────────────────────────────────────────────────── */
const ICON = 'h-[18px] w-[18px]';

const normalizeNotification = (notification) => ({
    ...notification,
    msg: notification.message ?? notification.msg,
    time: new Date(notification.created_at ?? notification.time),
    read: notification.read === true,
});

export default function AuthenticatedLayout({
    children,
    title,
    // Search props (passed from parent page)
    searchQuery: propSearchQuery,
    setSearchQuery: propSetSearchQuery,
    // Date range props
    startDate: propStartDate,
    setStartDate: propSetStartDate,
    endDate: propEndDate,
    setEndDate: propSetEndDate,
    dateRangeType: propDateRangeType,
    setDateRangeType: propSetDateRangeType,
    dateRangeLabel: propDateRangeLabel,
    setDateRangeLabel: propSetDateRangeLabel,
    // Category/urgency filter props
    filterCategory: propFilterCategory,
    setFilterCategory: propSetFilterCategory,
    filterUrgency: propFilterUrgency,
    setFilterUrgency: propSetFilterUrgency
}) {
    const user = usePage().props.auth.user;
    const isIT = user.is_it === true;
    const isDashboardOrKanban = route().current('dashboard') || route().current('admin.kanban');

    const [greeting, setGreeting] = useState('Good Morning');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Resolve states with fallbacks to local states
    const [localSearchQuery, localSetSearchQuery] = useState('');
    const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
    const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : localSetSearchQuery;

    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef(null);

    // History page filters
    const [localDateRangeLabel, localSetDateRangeLabel] = useState('Semua Waktu');
    const dateRangeLabel = propDateRangeLabel !== undefined ? propDateRangeLabel : localDateRangeLabel;
    const setDateRangeLabel = propSetDateRangeLabel !== undefined ? propSetDateRangeLabel : localSetDateRangeLabel;

    const [dateRangeOpen, setDateRangeOpen] = useState(false);
    const [localDateRangeType, localSetDateRangeType] = useState('all'); // all, this_month, last_30_days, this_year, custom
    const dateRangeType = propDateRangeType !== undefined ? propDateRangeType : localDateRangeType;
    const setDateRangeType = propSetDateRangeType !== undefined ? propSetDateRangeType : localSetDateRangeType;

    const [localStartDate, localSetStartDate] = useState('');
    const startDate = propStartDate !== undefined ? propStartDate : localStartDate;
    const setStartDate = propSetStartDate !== undefined ? propSetStartDate : localSetStartDate;

    const [localEndDate, localSetEndDate] = useState('');
    const endDate = propEndDate !== undefined ? propEndDate : localEndDate;
    const setEndDate = propSetEndDate !== undefined ? propSetEndDate : localSetEndDate;

    const dateRangeRef = useRef(null);

    const [localFilterCategory, localSetFilterCategory] = useState('all');
    const filterCategory = propFilterCategory !== undefined ? propFilterCategory : localFilterCategory;
    const setFilterCategory = propSetFilterCategory !== undefined ? propSetFilterCategory : localSetFilterCategory;

    const [localFilterUrgency, localSetFilterUrgency] = useState('all');
    const filterUrgency = propFilterUrgency !== undefined ? propFilterUrgency : localFilterUrgency;
    const setFilterUrgency = propSetFilterUrgency !== undefined ? propSetFilterUrgency : localSetFilterUrgency;

    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => !n.read).length;
    const notifRef = useRef(null);
    const mobileNotifRef = useRef(null);
    const settingsRef = useRef(null);

    const [judul, setJudul] = useState('');
    const [kategori, setKategori] = useState('new system');
    const [urgensi, setUrgensi] = useState('medium');
    const [kondisi, setKondisi] = useState('');
    const [keinginan, setKeinginan] = useState('');
    const [dampak, setDampak] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [attachmentName, setAttachmentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [systemId, setSystemId] = useState('');
    const [systems, setSystems] = useState([]);

    const [fidInput, setFidInput] = useState('');
    const [fidChecking, setFidChecking] = useState(false);
    const [fidError, setFidError] = useState('');
    const [fidKaryawanData, setFidKaryawanData] = useState(null);
    const [fidLinking, setFidLinking] = useState(false);
    const [fidSuccess, setFidSuccess] = useState(false);
    const showFidModal = !user.fid && !fidSuccess;
    const fetchNotifications = () => {
        axios.get('/api/notifications')
            .then(res => setNotifications(res.data.map(normalizeNotification)))
            .catch(console.error);
    };

    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : h < 21 ? 'Good Evening' : 'Good Night');
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') { setIsDarkMode(true); document.documentElement.classList.add('dark'); }
    }, []);

    useEffect(() => {
        const handler = (e) => {
            const clickOutsideNotif =
                (!notifRef.current || !notifRef.current.contains(e.target)) &&
                (!mobileNotifRef.current || !mobileNotifRef.current.contains(e.target));
            if (clickOutsideNotif) setNotifOpen(false);

            if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
            if (dateRangeRef.current && !dateRangeRef.current.contains(e.target)) setDateRangeOpen(false);
            if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (isCreateModalOpen) {
            axios.get('/api/systems')
                .then(res => setSystems(res.data))
                .catch(console.error);
        } else {
            setSystemId('');
        }
    }, [isCreateModalOpen]);

    /* -- Single Echo subscription — also dispatches a window event for child pages -- */
    useEffect(() => {
        if (typeof window.Echo === 'undefined') return;

        console.log('Setting up Echo subscriptions');
        console.log('user.karyawan:', user.karyawan);

        const publicChannel = window.Echo.channel('tickets-channel');
        console.log('Subscribed to public channel: tickets-channel');

        const handler = (data) => {
            console.log('🎉 Received event data:', data);
            const ticket = data.ticket ?? data;
            console.log('Extracted ticket:', ticket);
            window.dispatchEvent(
                new CustomEvent('ticket-status-updated', { detail: { ticket } })
            );

            fetchNotifications();
        };

        let privateChannel;

        if (isIT) {
            publicChannel.listen('.TicketStatusUpdated', handler);
        } else if (user.karyawan?.id) {
            const channelName = `user-notification.${user.karyawan.id}`;
            console.log('Subscribing to private channel:', channelName);
            privateChannel = window.Echo.private(channelName);
            privateChannel.listen('.TicketStatusUpdated', handler);
        }

        return () => {
            console.log('Cleaning up Echo subscriptions');
            publicChannel.stopListening('.TicketStatusUpdated', handler);
            window.Echo.leave('tickets-channel');

            if (privateChannel) {
                privateChannel.stopListening('.TicketStatusUpdated', handler);
                window.Echo.leave(`user-notification.${user.karyawan.id}`);
            }
        };
    }, [isIT, user.karyawan?.id]);

    const markAllRead = () => {
        axios.patch('/api/notifications/read-all')
            .then(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))))
            .catch(console.error);
    };
    /* â”€â”€ Search â”€â”€ */
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        const t = setTimeout(() => {
            setSearchLoading(true);
            const endpoint = isIT ? '/api/tickets' : '/api/my-tickets';
            axios.get(endpoint)
                .then(res => {
                    const q = searchQuery.toLowerCase();
                    setSearchResults(
                        res.data.filter(t =>
                            t.judul_laporan?.toLowerCase().includes(q) ||
                            t.karyawan?.nama_karyawan?.toLowerCase().includes(q) ||
                            t.karyawan?.divisi?.toLowerCase().includes(q) ||
                            t.status?.toLowerCase().includes(q)
                        ).slice(0, 8)
                    );
                })
                .catch(console.error)
                .finally(() => setSearchLoading(false));
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery, isIT]);

    /*Theme toggle*/
    const toggleTheme = () => {
        const next = !isDarkMode;
        setIsDarkMode(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    /*Logout*/
    const handleLogout = () => axios.post(route('logout')).then(() => { window.location.href = '/'; });

    /*File change*/
    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) { setAttachment(f); setAttachmentName(f.name); }
    };

    /*Create ticket*/
    const handleCreateTicket = (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData();
        fd.append('judul_laporan', judul); fd.append('kategori_laporan', kategori);
        fd.append('urgensi_laporan', urgensi); fd.append('kondisi_lapangan', kondisi);
        fd.append('keinginan_sistem', keinginan); fd.append('dampak_positif', dampak);
        if (['add feature', 'maintenance', 'fix bug'].includes(kategori) && systemId) {
            fd.append('system_ptsam_id', systemId);
        }
        if (attachment) fd.append('attachment', attachment);

        axios.post('/api/tickets', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(() => {
                setLoading(false); setIsCreateModalOpen(false);
                setJudul(''); setKategori('new system'); setUrgensi('medium');
                setKondisi(''); setKeinginan(''); setDampak('');
                setAttachment(null); setAttachmentName('');
                setSystemId('');
                window.location.reload();
            })
            .catch(err => {
                setLoading(false);
                const errs = err.response?.data?.errors;
                alert(errs ? Object.values(errs).flat().join('\n') : err.response?.data?.message || 'Gagal.');
            });
    };

    /*FID*/
    const handleCheckFidModal = async () => {
        if (!fidInput.trim()) { setFidError('FID wajib diisi.'); return; }
        setFidChecking(true); setFidError(''); setFidKaryawanData(null);
        try {
            const res = await axios.get(`/register/check-karyawan/${fidInput.trim()}`);
            if (res.data.success) setFidKaryawanData(res.data.karyawan);
        } catch (err) { setFidError(err.response?.data?.message || 'FID tidak ditemukan.'); }
        finally { setFidChecking(false); }
    };

    const handleLinkFid = async () => {
        setFidLinking(true); setFidError('');
        try {
            await axios.post('/profile/link-fid', { fid: fidInput.trim() });
            setFidSuccess(true);
            setTimeout(() => window.location.reload(), 800);
        } catch (err) { setFidError(err.response?.data?.message || 'Gagal menghubungkan FID.'); }
        finally { setFidLinking(false); }
    };

    const showCreateBtn = route().current('my-requests') || route().current('admin.inbox');
    const showSearch = !route().current('profile.edit') && !route().current('dashboard') && !route().current('admin.kanban') && !route().current('global-monitor');
    const todayDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    /* —— Notifications —— */
    const notifDot = (status) => {
        const dots = {
            inbox: 'bg-gray-400', review: 'bg-amber-400', to_do: 'bg-sky-400',
            in_progress: 'bg-indigo-500', testing: 'bg-violet-500', approved: 'bg-emerald-500'
        };
        return dots[status] || 'bg-gray-400';
    };

    return (
        <div className="min-h-screen bg-[#e8e9eb] dark:bg-[#0a0a0a] flex items-center justify-center md:p-4 gap-4 transition-colors duration-200">
            <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

            <div className="flex-1 h-screen md:h-[calc(100vh-2rem)] bg-[#f5f5f7] dark:bg-[#111111] md:border md:border-gray-200 dark:border-zinc-800/80 md:rounded-[32px] flex flex-col overflow-hidden md:shadow-lg transition-colors duration-200">
                {/* Header */}
                <header className="h-16 md:h-[72px] flex justify-between items-center px-4 md:px-8 flex-shrink-0 bg-[#f5f5f7]/90 dark:bg-[#111111]/90 backdrop-blur-md z-20 border-b border-gray-200/60 dark:border-zinc-800/60 md:border-none transition-colors duration-200">

                    {/* Left */}
                    <div className={`items-center gap-3 ${searchOpen ? 'hidden sm:flex' : 'flex'}`}>
                        <div>
                            {/* Desktop: Greeting */}
                            <h1 className="hidden md:block text-base md:text-lg font-bold text-gray-800 dark:text-zinc-100 tracking-tight leading-tight">
                                {greeting}, <span className="text-gray-900 dark:text-white font-extrabold">{user.name.split(' ')[0]}</span>
                            </h1>
                            {title && <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold tracking-widest uppercase mt-0.5 hidden md:block">{title}</p>}

                            {/* Mobile: Page Title instead of greeting */}
                            <h1 className="block md:hidden text-base font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                                {title || 'Dashboard'}
                            </h1>
                        </div>
                    </div>

                    {/* Mobile Full-width Search Input */}
                    {searchOpen && showSearch && (
                        <div className="flex-1 sm:hidden flex items-center gap-2 animate-fadeIn mx-1">
                            <div className="relative flex-1">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Cari..."
                                    className="w-full pl-9 pr-9 h-9 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 px-1 cursor-pointer shrink-0">
                                Batal
                            </button>
                        </div>
                    )}

                    {/* Right */}
                    <div className="flex items-center gap-2 md:gap-3.5">
                        {/* + Buat Laporan */}
                        {showCreateBtn && (
                            <button onClick={() => setIsCreateModalOpen(true)}
                                className="hidden md:flex h-9 md:h-10 px-3 md:px-4 rounded-xl bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer transition">
                                <span className="text-sm font-black leading-none">+</span>
                                <span>Buat Laporan</span>
                            </button>
                        )}

                        {/* + Tambah Sistem */}
                        {route().current('admin.systems.index') && (
                            <button onClick={() => window.dispatchEvent(new CustomEvent('open-add-system-modal'))}
                                className="hidden md:flex h-9 md:h-10 px-3 md:px-4 rounded-xl bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-white items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer transition">
                                <span className="text-sm font-black leading-none">+</span>
                                <span>Tambah Sistem</span>
                            </button>
                        )}

                        {/* Search Pill (inline, round-full, matches Image 1) */}
                        {searchOpen && showSearch && (
                            <div className="relative animate-fadeIn hidden sm:block">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search"
                                    className="pl-9 pr-8 h-9 md:h-10 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition w-44 md:w-64 shadow-xs"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 cursor-pointer">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Desktop Single Box Container (Search, Notifications, Settings) */}
                        <div className="hidden sm:flex items-center gap-4 bg-white dark:bg-zinc-900 px-4 h-9 md:h-10 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm transition-colors duration-200">

                            {/* Search */}
                            {showSearch && (
                                <HeaderBtn onClick={() => { setSearchOpen(p => !p); setNotifOpen(false); setSettingsOpen(false); }} title="Cari Tiket" active={searchOpen} flat={true}>
                                    <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </HeaderBtn>
                            )}

                            {/* Notifications */}
                            <div className="relative" ref={notifRef}>
                                <HeaderBtn onClick={() => { setNotifOpen(p => !p); setSearchOpen(false); setSettingsOpen(false); }} title="Notifikasi" active={notifOpen} flat={true}>
                                    <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-rose-500 text-white text-[9px] font-extrabold rounded-full ring-2 ring-white dark:ring-zinc-900">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </HeaderBtn>

                                {/* Notif Dropdown */}
                                {notifOpen && (
                                    <div className="absolute right-0 top-[calc(100%+10px)] w-80 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl z-50 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                                            <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">Notifikasi</span>
                                            {notifications.length > 0 && (
                                                <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer transition">Tandai semua</button>
                                            )}
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="py-8 text-center">
                                                    <svg className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                    </svg>
                                                    <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Belum ada notifikasi</p>
                                                </div>
                                            ) : notifications.map(n => (
                                                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-zinc-800/60 last:border-0 transition ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''}`}>
                                                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notifDot(n.status)}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-700 dark:text-zinc-300 leading-snug">{n.msg}</p>
                                                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">{n.time.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Settings */}
                            <div className="relative" ref={settingsRef}>
                                <HeaderBtn onClick={() => { setSettingsOpen(p => !p); setSearchOpen(false); setNotifOpen(false); }} title="Pengaturan" active={settingsOpen} flat={true}>
                                    <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </HeaderBtn>

                                {/* Settings Dropdown */}
                                {settingsOpen && (
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
                                                <button onClick={toggleTheme} className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isDarkMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>

                                            <hr className="border-gray-100 dark:border-zinc-800 mx-2 my-1" />

                                            <Link href={route('profile.edit')} onClick={() => setSettingsOpen(false)}
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

                                            <button onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 dark:text-rose-400 transition cursor-pointer">
                                                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                </div>
                                                <span className="text-xs font-semibold">Keluar</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Standalone Filter Button (Only on History or Systems page, matches Image 2) */}
                        {(route().current('history') || route().current('admin.systems.index')) && (
                            <div className="relative" ref={filterRef}>
                                <button onClick={() => setFilterOpen(p => !p)} title="Filter Data"
                                    className={`h-9 w-9 md:h-10 md:w-10 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-zinc-400 shadow-sm transition cursor-pointer shrink-0 ${filterOpen ? 'ring-2 ring-indigo-500/20 border-indigo-400' : ''}`}>
                                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                </button>
                                {filterOpen && (
                                    <div className="fixed left-4 right-4 top-[64px] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl z-50 p-4 space-y-4">
                                        {route().current('history') && (
                                            <>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Kategori</label>
                                                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                                                        <option value="all">Semua Kategori</option>
                                                        <option value="new system">New System</option>
                                                        <option value="website">Website</option>
                                                        <option value="fix bug">Fix Bug</option>
                                                        <option value="maintenance">Maintenance</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Urgensi</label>
                                                    <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}
                                                        className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                                                        <option value="all">Semua Urgensi</option>
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                        <option value="blocker">Blocker</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                                                {route().current('admin.systems.index') ? 'Waktu Registrasi' : 'Waktu Laporan'}
                                            </label>
                                            <select value={dateRangeType} onChange={e => {
                                                const type = e.target.value;
                                                setDateRangeType(type);
                                                if (type !== 'custom') {
                                                    const labels = {
                                                        all: 'Semua Waktu',
                                                        this_month: 'Bulan Ini',
                                                        last_30_days: '30 Hari Terakhir',
                                                        this_year: 'Tahun Ini'
                                                    };
                                                    setDateRangeLabel(labels[type] || 'Semua Waktu');
                                                    setStartDate('');
                                                    setEndDate('');
                                                }
                                            }}
                                                className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                                                <option value="all">Semua Waktu</option>
                                                <option value="this_month">Bulan Ini</option>
                                                <option value="last_30_days">30 Hari Terakhir</option>
                                                <option value="this_year">Tahun Ini</option>
                                                <option value="custom">Kustom Tanggal...</option>
                                            </select>
                                        </div>

                                        {dateRangeType === 'custom' && (
                                            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/80 space-y-2 mt-1 animate-fadeIn">
                                                <div>
                                                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mulai</label>
                                                    <input type="date" value={startDate} onChange={e => {
                                                        setStartDate(e.target.value);
                                                        const lbl = `${e.target.value || '?'} - ${endDate || '?'}`;
                                                        setDateRangeLabel(lbl);
                                                    }} className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sampai</label>
                                                    <input type="date" value={endDate} onChange={e => {
                                                        setEndDate(e.target.value);
                                                        const lbl = `${startDate || '?'} - ${e.target.value || '?'}`;
                                                        setDateRangeLabel(lbl);
                                                    }} className="w-full text-xs border border-gray-250 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Search & Hamburger */}
                        <div className={`sm:hidden flex items-center gap-2 ${searchOpen ? 'hidden' : 'flex'}`}>
                            {/* Mobile Search Button */}
                            {showSearch && (
                                <HeaderBtn onClick={() => { setSearchOpen(p => !p); setNotifOpen(false); setSettingsOpen(false); }} title="Cari Laporan" active={searchOpen} flat={false}>
                                    <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </HeaderBtn>
                            )}

                            {/* Mobile Hamburger Menu Button */}
                            <button onClick={() => setMobileSidebarOpen(true)}
                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 shadow-sm cursor-pointer transition shrink-0 active:scale-95 relative">
                                <svg className={ICON} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-1 ring-white dark:ring-zinc-900" />
                                )}
                            </button>
                        </div>

                        {/* Theme toggle — standalone button, same size */}
                        <button onClick={toggleTheme} title="Ganti Tema" aria-label="Toggle theme"
                            className="hidden sm:flex h-9 w-9 md:h-10 md:w-10 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl items-center justify-center text-gray-500 dark:text-zinc-400 shadow-sm transition cursor-pointer shrink-0">
                            {isDarkMode
                                ? <svg className={`${ICON} text-amber-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                                : <svg className={`${ICON} text-gray-500 dark:text-zinc-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            }
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 px-4 md:px-8 pb-6 md:pb-8 flex flex-col overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Create Ticket Modal*/}
            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="2xl">
                <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 rounded-2xl">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100 dark:border-zinc-800">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Buat Laporan Baru</h3>
                        <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition cursor-pointer">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Nama Pelapor', val: user.name },
                                { label: 'Tanggal', val: todayDate },
                                { label: 'Divisi', val: user.karyawan?.divisi || '-' }
                            ].map(f => (
                                <div key={f.label}>
                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-wider mb-1.5">{f.label}</label>
                                    <input type="text" value={f.val} disabled className="w-full text-sm border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-500 rounded-xl py-2.5 px-4 cursor-not-allowed" />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Judul Laporan</label>
                                <input type="text" value={judul} onChange={e => setJudul(e.target.value)} required placeholder="Ketik judul..."
                                    className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Kategori</label>
                                <select value={kategori} onChange={e => { const v = e.target.value; setKategori(v); if (urgensi === 'blocker' && !['fix bug', 'maintenance'].includes(v)) setUrgensi('high'); }}
                                    className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 outline-none transition">
                                    <option value="new system">New System</option>
                                    <option value="add feature">Add Feature</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="fix bug">Fix Bug</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Urgensi</label>
                                <select value={urgensi} onChange={e => setUrgensi(e.target.value)}
                                    className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 outline-none transition">
                                    {['fix bug', 'maintenance'].includes(kategori) && <option value="blocker">🔴 Blocker</option>}
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                                {!['fix bug', 'maintenance'].includes(kategori) && <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1">Blocker hanya untuk Fix Bug / Maintenance.</p>}
                            </div>
                        </div>
                        {/* Sistem dropdown */}
                        {['add feature', 'maintenance', 'fix bug'].includes(kategori) && (
                            <div className="animate-fadeIn">
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Sistem yang Dilaporkan</label>
                                <select value={systemId} onChange={e => setSystemId(e.target.value)} required
                                    className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 outline-none transition cursor-pointer">
                                    <option value="">-- Pilih Sistem --</option>
                                    {systems.map(sys => (
                                        <option key={sys.id} value={sys.id}>{sys.nama_sistem}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {[
                            { label: 'Kondisi di lapangan saat ini?', val: kondisi, set: setKondisi, ph: 'Ketik kondisi...' },
                            { label: 'Apa yang Anda ingin sistem lakukan?', val: keinginan, set: setKeinginan, ph: 'Ketik keinginan sistem...' },
                            { label: 'Dampak positif jika fitur ini selesai?', val: dampak, set: setDampak, ph: 'Ketik dampak positif...' },
                        ].map(f => (
                            <div key={f.label}>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">{f.label}</label>
                                <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={2} required placeholder={f.ph}
                                    className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 outline-none resize-none transition" />
                            </div>
                        ))}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-100 dark:border-zinc-800 gap-3">
                            <div className="flex items-center gap-3">
                                <label className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition">
                                    Pilih File
                                    <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                                </label>
                                <span className="text-xs text-gray-400 dark:text-zinc-600 truncate max-w-[160px]">{attachmentName || 'Tidak ada file'}</span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)}
                                    className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer">Batal</button>
                                <button type="submit" disabled={loading}
                                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-60">
                                    {loading ? 'Mengirim...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* FID Link Modal*/}
            <Modal show={showFidModal} closeable={false} maxWidth="md">
                <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-14 h-14 bg-amber-100 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Hubungkan Akun Karyawan</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5">Masukkan Fingerprint ID (FID) untuk menghubungkan akun.</p>
                    </div>

                    {!fidKaryawanData ? (
                        <div className="space-y-4">
                            <input type="text" value={fidInput} autoFocus
                                onChange={e => { setFidInput(e.target.value); setFidError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleCheckFidModal()}
                                className="w-full text-center text-lg font-bold tracking-widest border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-amber-500/40 outline-none transition"
                                placeholder="Contoh: 309" />
                            {fidError && <p className="text-sm text-red-600 dark:text-red-400 font-semibold text-center">{fidError}</p>}
                            <button onClick={handleCheckFidModal} disabled={fidChecking}
                                className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl text-sm transition hover:opacity-90 disabled:opacity-50 cursor-pointer">
                                {fidChecking ? 'Memeriksa...' : 'Periksa FID'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest">Data Karyawan Ditemukan</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div><p className="text-emerald-500/70 dark:text-emerald-400/60 font-semibold text-[10px]">FID</p><p className="font-extrabold text-gray-800 dark:text-zinc-200">#{fidKaryawanData.fid}</p></div>
                                    <div><p className="text-emerald-500/70 dark:text-emerald-400/60 font-semibold text-[10px]">Nama</p><p className="font-extrabold text-gray-800 dark:text-zinc-200">{fidKaryawanData.nama_karyawan}</p></div>
                                    <div className="col-span-2"><p className="text-emerald-500/70 dark:text-emerald-400/60 font-semibold text-[10px]">Divisi</p><p className="font-bold text-gray-800 dark:text-zinc-200">{fidKaryawanData.divisi}</p></div>
                                </div>
                            </div>
                            {fidError && <p className="text-sm text-red-600 dark:text-red-400 font-semibold text-center">{fidError}</p>}
                            <div className="flex gap-3">
                                <button onClick={() => { setFidKaryawanData(null); setFidInput(''); setFidError(''); }}
                                    className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold py-3 rounded-xl text-sm transition cursor-pointer">Ubah FID</button>
                                <button onClick={handleLinkFid} disabled={fidLinking}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-50 cursor-pointer">
                                    {fidLinking ? 'Menghubungkan...' : 'Hubungkan FID'}
                                </button>
                            </div>
                        </div>
                    )}
                    {fidSuccess && (
                        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center">
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-bold">✔ FID berhasil dihubungkan! Memuat ulang...</p>
                        </div>
                    )}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800 text-center">
                        <p className="text-xs text-gray-400 dark:text-zinc-600 mb-2">Tidak punya FID? Hubungi HRD.</p>
                        <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold hover:underline transition cursor-pointer">Logout dari akun ini</button>
                    </div>
                </div>
            </Modal>

            {/* Floating Action Button (FAB) for Mobile only */}
            <div className="md:hidden fixed bottom-6 right-6 z-40 flex flex-col gap-3">
                {/* FAB for Buat Laporan */}
                {showCreateBtn && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-12 h-12 rounded-full bg-[#7a7a7a] dark:bg-zinc-800 text-white flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95 cursor-pointer"
                        title="Buat Laporan"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}

                {/* FAB for Tambah Sistem */}
                {route().current('admin.systems.index') && (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-add-system-modal'))}
                        className="w-12 h-12 rounded-full bg-[#7a7a7a] dark:bg-zinc-800 text-white flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95 cursor-pointer"
                        title="Tambah Sistem"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

/* Reusable header icon button */
function HeaderBtn({ onClick, title, active, children, flat }) {
    if (flat) {
        return (
            <button onClick={onClick} title={title} aria-pressed={active}
                className={`relative flex items-center justify-center transition cursor-pointer shrink-0 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white active:scale-95 duration-150 ${active ? 'text-indigo-600 dark:text-indigo-400 scale-110' : ''
                    }`}>
                {children}
            </button>
        );
    }
    return (
        <button onClick={onClick} title={title} aria-pressed={active}
            className={`relative h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl border shadow-sm transition cursor-pointer shrink-0
                ${active
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80'
                    : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-800'
                }`}>
            {children}
        </button>
    );
}
