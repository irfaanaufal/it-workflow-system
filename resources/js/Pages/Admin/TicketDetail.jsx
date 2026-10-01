import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import UatModal from '@/Components/UatModal';
import { STATUS_ORDER, CATEGORY_COLORS, STATUS, CATEGORY } from '@/Components/ticket/constants';
import StatusBadge from '@/Components/ticket/StatusBadge';
import UrgencyBadge from '@/Components/ticket/UrgencyBadge';
import ContentCards from '@/Components/ticket/ContentCards';
import InfoBoxes from '@/Components/ticket/InfoBoxes';
import ActivityTimeline from '@/Components/ticket/ActivityTimeline';
import UatBanner from '@/Components/ticket/UatBanner';
import StatusSidebar from '@/Components/ticket/StatusSidebar';

export default function TicketDetail({ ticketId }) {
    const { auth } = usePage().props;
    const currentKaryawanId = auth.user?.karyawan?.id;
    const user = auth.user;
    const isAdmin = user?.is_it === true;
    const canTake = isAdmin;
    const canManageStatus = isAdmin;

    const [ticket, setTicket] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showLogs, setShowLogs] = useState(false);
    const [isUatOpen, setIsUatOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const fetchTicketDetails = () => {
        Promise.all([
            axios.get(`/api/tickets/${ticketId}`),
            axios.get(`/api/tickets/${ticketId}/timeline`).catch(() => ({ data: [] })),
        ]).then(([ticketRes, timelineRes]) => {
            setTicket(ticketRes.data);
            setTimeline(timelineRes.data?.timeline || []);
            setLoading(false);
        }).catch(err => {
            setError(err.response?.data?.message || 'Gagal memuat data tiket.');
            setLoading(false);
        });
    };

    useEffect(() => { fetchTicketDetails(); }, [ticketId]);

    if (loading) return (
        <AuthenticatedLayout title="Detail Tiket" subtitle="Informasi lengkap dan riwayat tiket">
            <Head title="Detail Tiket" />
            <div className="h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Memuat detail tiket…</span>
                </div>
            </div>
        </AuthenticatedLayout>
    );

    if (error || !ticket) return (
        <AuthenticatedLayout title="Detail Tiket" subtitle="Informasi lengkap dan riwayat tiket">
            <Head title="Detail Tiket" />
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-center max-w-sm">
                    <p className="text-sm text-rose-700 dark:text-rose-400 font-semibold">{error || 'Tiket tidak ditemukan.'}</p>
                </div>
                <button onClick={() => window.history.back()} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer">
                    ← Kembali
                </button>
            </div>
        </AuthenticatedLayout>
    );

    const currentStatusIndex = STATUS_ORDER.indexOf(ticket.status);
    const completionPercentage = ticket.status === STATUS.REJECTED
        ? 0
        : Math.max(0, (currentStatusIndex / (STATUS_ORDER.length - 2)) * 100);
    const catColors = CATEGORY_COLORS[ticket.kategori_laporan] || CATEGORY_COLORS[CATEGORY.NEW_SYSTEM];

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const dayMonthYear = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
        return `${dayMonthYear} pukul ${time}`;
    };

    const reporterAvatarUrl = ticket.karyawan?.user?.avatar_url || null;
    const reporterInitials = ticket.karyawan?.nama_karyawan?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

    return (
        <AuthenticatedLayout title="Detail Tiket" subtitle="Informasi lengkap dan riwayat tiket">
            <Head title={`#${ticket.id} — ${ticket.judul_laporan}`} />

            <div className="py-2 pb-6">
                {/* HERO HEADER */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm mb-6">
                    <div className="p-3 md:p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-gray-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                {reporterAvatarUrl
                                    ? <img src={reporterAvatarUrl} alt="" className="w-full h-full object-cover" />
                                    : <span className="text-[9px] font-black text-slate-600 dark:text-zinc-300">{reporterInitials}</span>
                                }
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-700 dark:text-zinc-300 truncate">{ticket.karyawan?.nama_karyawan || '—'}</p>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">{ticket.karyawan?.divisi || '—'} · #{ticket.id} · {formatDate(ticket.created_at)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-tight line-clamp-2 break-words">{ticket.judul_laporan}</h1>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${catColors.badge}`}>
                                    {ticket.kategori_laporan}
                                </span>
                                <UrgencyBadge urgency={ticket.urgensi_laporan} size="lg" />
                                <StatusBadge status={ticket.status} size="lg" />
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">Progress</span>
                                <span className="text-[10px] font-extrabold text-gray-500 dark:text-zinc-400">{Math.round(completionPercentage)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${catColors.accent}`} style={{ width: `${completionPercentage}%` }} />
                            </div>
                        </div>

                        {canManageStatus && (
                            <button onClick={() => setSidebarOpen(prev => !prev)}
                                className="lg:hidden mt-3 h-9 px-3 flex items-center gap-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 shadow-sm cursor-pointer active:scale-95 transition text-xs font-bold">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Atur
                            </button>
                        )}
                    </div>
                </div>

                {/* UAT Banner */}
                <UatBanner ticket={ticket} currentKaryawanId={currentKaryawanId} onOpenUat={() => setIsUatOpen(true)} />

                {/* Main Layout */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* LEFT: Content + Activity */}
                    <div className="flex-1 min-w-0">
                        <ContentCards ticket={ticket} isAdmin={isAdmin} onUpdate={fetchTicketDetails} />
                        <InfoBoxes ticket={ticket} />
                        <ActivityTimeline timeline={timeline} showLogs={showLogs} setShowLogs={setShowLogs} />
                    </div>

                    {/* RIGHT: Sidebar */}
                    <div className={`lg:w-72 shrink-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
                        {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
                        <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden lg:sticky lg:top-6 ${sidebarOpen ? 'fixed right-0 top-0 bottom-0 z-40 w-80 rounded-none border-l border-t-0 border-b-0 border-r-0 lg:relative lg:rounded-2xl lg:border lg:overflow-hidden' : ''}`}>
                            {sidebarOpen && (
                                <div className="flex items-center justify-between lg:hidden pb-3 border-b border-gray-100 dark:border-zinc-800 p-5 pb-0">
                                    <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">Atur Tiket</span>
                                    <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <StatusSidebar ticket={ticket} ticketId={ticketId} canManageStatus={canManageStatus} canTake={canTake} onUpdate={fetchTicketDetails} />
                        </div>
                    </div>
                </div>
            </div>

            {/* UAT Modal */}
            {ticket && (
                <UatModal isOpen={isUatOpen} onClose={() => setIsUatOpen(false)} ticketId={ticket.id}
                    onApproved={() => { setIsUatOpen(false); fetchTicketDetails(); }}
                    onRevised={() => { setIsUatOpen(false); fetchTicketDetails(); }} />
            )}
        </AuthenticatedLayout>
    );
}
