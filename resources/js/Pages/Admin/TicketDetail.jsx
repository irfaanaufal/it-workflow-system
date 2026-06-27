import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCategoryStyles, getUrgencyBadgeStyles } from '@/Utils/ticketHelpers';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import UatModal from '@/Components/UatModal';

const STATUS_CONFIG = {
    inbox:       { label: 'Menunggu Antrian', icon: '📬' },
    review:      { label: 'Sedang Review',    icon: '🔍' },
    to_do:       { label: 'Antrean Kerja',    icon: '📋' },
    in_progress: { label: 'Dikerjakan',       icon: '⚙️' },
    testing:     { label: 'Pengujian',        icon: '🧪' },
    approved:    { label: 'Selesai',          icon: '✅' },
};

const STATUS_ORDER = ['inbox', 'review', 'to_do', 'in_progress', 'testing', 'approved'];

export default function TicketDetail({ ticketId }) {
    const { auth } = usePage().props;
    const currentKaryawanId = auth.user?.karyawan?.id;
    const isIT = auth.user?.is_it === true || auth.user?.karyawan?.divisi === 'IT';

    const [ticket, setTicket]   = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [showLogs, setShowLogs] = useState(false);
    const [isUatOpen, setIsUatOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchTicketDetails = () => {
        Promise.all([
            axios.get(`/api/tickets/${ticketId}`),
            axios.get(`/api/tickets/${ticketId}/timeline`).catch(() => ({ data: [] })),
        ]).then(([ticketRes, timelineRes]) => {
            setTicket(ticketRes.data);
            setTimeline(timelineRes.data || []);
            setLoading(false);
        }).catch(err => {
            setError(err.response?.data?.message || 'Gagal memuat data tiket.');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchTicketDetails();

        // Real-time status update via window event (dispatched by AuthenticatedLayout)
        const handler = (e) => {
            const u = e.detail.ticket;
            if (u.id === ticketId) {
                console.log('Real-time status update received on TicketDetail:', u);
                setTicket(prev => prev ? { ...prev, ...u } : prev);
                // Re-fetch timeline to display the new log entry
                axios.get(`/api/tickets/${ticketId}/timeline`)
                    .then(res => setTimeline(res.data || []))
                    .catch(console.error);
            }
        };

        window.addEventListener('ticket-status-updated', handler);
        return () => window.removeEventListener('ticket-status-updated', handler);
    }, [ticketId]);

    const handleTakeTicket = () => {
        setUpdatingStatus(true);
        axios.post(`/api/tickets/${ticketId}/take`)
            .then(() => {
                fetchTicketDetails();
            })
            .catch(err => {
                alert(err.response?.data?.message || 'Gagal mengambil tiket.');
            })
            .finally(() => setUpdatingStatus(false));
    };

    const handleStatusChange = (newStatus) => {
        setUpdatingStatus(true);
        axios.patch(`/api/tickets/${ticketId}/status`, { status: newStatus })
            .then(() => {
                setTicket(prev => ({ ...prev, status: newStatus }));
                axios.get(`/api/tickets/${ticketId}/timeline`)
                    .then(res => setTimeline(res.data || []))
                    .catch(console.error);
            })
            .catch(err => {
                alert(err.response?.data?.message || 'Gagal memperbarui status.');
            })
            .finally(() => setUpdatingStatus(false));
    };

    if (loading) return (
        <AuthenticatedLayout title="Detail Tiket">
            <Head title="Detail Tiket" />
            <div className="h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Memuat detail tiket…</span>
                </div>
            </div>
        </AuthenticatedLayout>
    );

    if (error || !ticket) return (
        <AuthenticatedLayout title="Detail Tiket">
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

    const it      = ticket.admin_it;
    const itUser  = it?.user;
    const avatarUrl = itUser?.avatar_url || null;
    const itInitials = it?.nama_karyawan?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'IT';

    const currentStatusIndex = STATUS_ORDER.indexOf(ticket.status);
    const completionPercentage = (currentStatusIndex / (STATUS_ORDER.length - 1)) * 100;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const dayMonthYear = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const time = date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        }).replace('.', ':');
        return `${dayMonthYear} pukul ${time}`;
    };

    return (
        <AuthenticatedLayout title="Detail Tiket">
            <Head title={`#${ticket.id} — ${ticket.judul_laporan}`} />

            <div className="space-y-6 py-2 pb-10">

                {/* Back Link */}
                <button onClick={() => window.history.back()}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                    Kembali
                </button>

                {/* ─── Timeline Progres (Full Width Card) ─── */}
                <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-gray-200 dark:border-zinc-800 shadow-sm p-6 md:p-8 relative">
                    <style>{`
                        @keyframes shimmerProgress {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                        .animate-shimmer-progress {
                            background: linear-gradient(90deg, #7a7a7a 0%, #c5c5c5 50%, #7a7a7a 100%);
                            background-size: 200% 100%;
                            animation: shimmerProgress 2.5s infinite linear;
                        }
                        @keyframes pulseGlow {
                            0%, 100% { transform: scale(1); opacity: 0.25; }
                            55% { transform: scale(1.25); opacity: 0.55; }
                        }
                        .pulse-glow {
                            animation: pulseGlow 2s infinite ease-in-out;
                        }
                    `}</style>
                    {/* Steps Container */}
                    <div className="relative flex justify-between items-center w-full mt-4 mb-6">
                        {/* Dual-colored Background Line */}
                        <div className="absolute top-[16px] md:top-[28px] left-[8%] right-[8%] h-[3px] md:h-[5px] bg-[#e2e8f0] dark:bg-zinc-800 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                            <div
                                className="h-full animate-shimmer-progress transition-all duration-500"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>

                        {/* Steps rendering */}
                        {STATUS_ORDER.map((statusKey, i) => {
                            const isCompleted = i <= currentStatusIndex;
                            const isActive = i === currentStatusIndex;
                            const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.inbox;

                            return (
                                <div key={statusKey} className="flex flex-col items-center relative z-10" style={{ width: `${100 / STATUS_ORDER.length}%` }}>
                                    {/* Circle Indicator */}
                                    <div className={`w-8 h-8 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-350 shadow-xs relative ${
                                        isCompleted
                                            ? 'bg-[#7a7a7a] text-white hover:scale-105 duration-200'
                                            : 'bg-white dark:bg-zinc-900 border-2 border-[#b5b7bd] text-gray-400 hover:scale-105 duration-200'
                                    }`}>
                                        {isActive && (
                                            <span className="absolute -inset-1 rounded-full bg-[#7a7a7a] pulse-glow z-[-1]" />
                                        )}
                                        {isCompleted ? (
                                            <svg className="w-4 h-4 md:w-6 md:h-6 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <div className="w-2.5 h-2.5 md:w-4 md:h-4 bg-[#7a7a7a] dark:bg-zinc-500 rounded-full" />
                                        )}
                                    </div>
                                    {/* Label */}
                                    <span className={`text-[8px] md:text-xs font-bold text-center mt-2 md:mt-3 leading-tight ${
                                        isCompleted
                                            ? 'text-gray-800 dark:text-zinc-200 font-extrabold'
                                            : 'text-gray-400 dark:text-zinc-500'
                                    }`}>
                                        {cfg.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detail Link (bottom right) */}
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={() => setShowLogs(prev => !prev)}
                            className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-2 cursor-pointer transition"
                        >
                            Detail
                        </button>
                    </div>

                    {/* Expandable Riwayat Log */}
                    {showLogs && (
                        <div className="mt-6 pt-6 border-t border-gray-150 dark:border-zinc-800 transition-all duration-300 animate-fadeIn">
                            <h3 className="text-xs font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Log Riwayat Progres</h3>
                            {timeline.length > 0 ? (
                                <div className="relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-150 dark:bg-zinc-800" />
                                    <div className="space-y-4">
                                        {timeline.map((item, idx) => {
                                            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.inbox;
                                            return (
                                                <div key={idx} className="flex items-start gap-4 relative">
                                                    {/* Small Indicator Circle */}
                                                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm z-10 shadow-sm border-2 border-white dark:border-zinc-900 bg-[#7a7a7a]">
                                                        <span className="text-white text-[10px]">✔</span>
                                                    </div>
                                                    <div className="flex-1 pb-2">
                                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">{item.title || cfg.label}</p>
                                                                {item.actor_name && (
                                                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                                                        Oleh <span className="font-semibold text-gray-600 dark:text-zinc-400">{item.actor_name}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className="text-[9px] font-bold text-gray-450 dark:text-zinc-600 whitespace-nowrap">
                                                                {new Date(item.created_at).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                        {item.message && (
                                                            <div className="mt-2 p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-800">
                                                                <p className="text-[11px] text-gray-650 dark:text-zinc-400 leading-relaxed">{item.message}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 dark:text-zinc-600 italic">Belum ada catatan log riwayat.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Bottom Layout Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                    {/* LEFT COLUMN: Ticket Content (col-span-7) */}
                    <div className="lg:col-span-7">
                        <div className={`rounded-[24px] border shadow-xs overflow-hidden flex flex-col justify-between h-full ${getCategoryStyles(ticket.kategori_laporan)}`}>
                            {/* Inner Content */}
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-extrabold opacity-75">
                                        Tiket #{ticket.id}
                                    </span>
                                    <span className={getUrgencyBadgeStyles(ticket.urgensi_laporan)}>
                                        {ticket.urgensi_laporan}
                                    </span>
                                </div>

                                {/* Judul */}
                                <h2 className="text-3xl font-black mt-4 mb-6 leading-tight">
                                    {ticket.judul_laporan}
                                </h2>

                                {/* Alasan Revisi */}
                                {ticket.revision_reason && (
                                    <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-450">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1.5">
                                            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Alasan Revisi
                                        </p>
                                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{ticket.revision_reason}</p>
                                    </div>
                                )}

                                {/* Feedback / Testimoni UAT */}
                                {ticket.uat_feedback && (
                                    <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-455">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
                                            <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Feedback / Testimoni UAT
                                        </p>
                                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{ticket.uat_feedback}</p>
                                    </div>
                                )}

                                {/* Dynamic Details Fields */}
                                <div className="space-y-5">
                                    {[
                                        { label: 'Kondisi di Lapangan', value: ticket.kondisi_lapangan },
                                        { label: 'Keinginan Sistem',    value: ticket.keinginan_sistem },
                                        { label: 'Dampak Positif',      value: ticket.dampak_positif },
                                    ].map(f => (
                                        <div key={f.label}>
                                            <p className="text-[10px] font-extrabold opacity-70 uppercase tracking-wider mb-1">{f.label}</p>
                                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap opacity-95">{f.value || '—'}</p>
                                        </div>
                                    ))}
                                    {ticket.system_ptsam && (
                                        <div>
                                            <p className="text-[10px] font-extrabold opacity-70 uppercase tracking-wider mb-1">Sistem Terkait</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {ticket.system_ptsam.nama_sistem}
                                                </span>
                                                {ticket.system_ptsam.link_sistem && (
                                                    <a
                                                        href={ticket.system_ptsam.link_sistem}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline inline-flex items-center gap-0.5"
                                                    >
                                                        Buka Sistem
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Area */}
                            <div className="bg-black/5 px-6 md:px-8 py-4 flex flex-wrap items-center justify-between border-t border-gray-950/10 gap-y-3">
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[11px] font-extrabold text-gray-700">
                                    {/* Category Label */}
                                    <span className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                                        </svg>
                                        {ticket.kategori_laporan?.toUpperCase()}
                                    </span>
                                    {/* Reporter Name */}
                                    <span className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                        </svg>
                                        {ticket.karyawan?.nama_karyawan}
                                    </span>
                                    {/* Division */}
                                    <span className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        {ticket.karyawan?.divisi || '—'}
                                    </span>
                                    {/* Formatted Date & Time */}
                                    <span className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                                        </svg>
                                        {formatDate(ticket.created_at)}
                                    </span>
                                </div>

                                {/* PIC IT Info */}
                                <div className="flex items-center gap-2 bg-white/40 dark:bg-black/15 px-3 py-1.5 rounded-full border border-white/20 shadow-xs">
                                    <span className="text-[10px] font-bold opacity-80">PIC</span>
                                    {it ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/60 shrink-0 bg-white/60 flex items-center justify-center shadow-xs">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt={it.nama_karyawan} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[8px] font-black text-gray-800">{itInitials}</span>
                                                )}
                                            </div>
                                            <span className="text-[11px] font-extrabold text-gray-900 dark:text-zinc-100">{it.nama_karyawan}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-gray-500 italic">Belum diambil</span>
                                            {isIT && ticket.status === 'inbox' && (
                                                <button
                                                    onClick={handleTakeTicket}
                                                    disabled={updatingStatus}
                                                    className="ml-1 bg-[#4b5563] hover:bg-slate-700 text-white text-[9px] font-extrabold px-2 py-0.5 rounded transition cursor-pointer disabled:opacity-50"
                                                >
                                                    {updatingStatus ? '...' : 'Take'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Action & Feedback details (col-span-5) */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        {/* UAT Confirmation Card for Ticket Owner */}
                        {ticket.status === 'testing' && ticket.karyawan_id === currentKaryawanId && (
                            <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-[20px] p-5 shadow-sm space-y-3.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🧪</span>
                                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider">Konfirmasi Pengujian (UAT)</p>
                                </div>
                                <p className="text-xs text-indigo-950/80 dark:text-zinc-300 leading-relaxed">
                                    Laporan Anda telah diselesaikan oleh IT dan siap diuji. Harap periksa hasil pekerjaan IT dan berikan tanggapan Anda.
                                </p>
                                <button
                                    onClick={() => setIsUatOpen(true)}
                                    className="w-full bg-[#0070f3] hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition cursor-pointer text-center"
                                >
                                    Konfirmasi (Setuju / Minta Revisi)
                                </button>
                            </div>
                        )}

                        {/* Status Controls Card for IT Admins */}
                        {isIT && it && (
                            <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-gray-200 dark:border-zinc-800 p-5 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider">Kelola Status Tiket</span>
                                    {updatingStatus && (
                                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        value={ticket.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        disabled={updatingStatus}
                                        className="w-full text-xs font-bold border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 outline-none transition cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="review">🔍 Sedang Review</option>
                                        <option value="to_do">📋 Antrean Kerja</option>
                                        <option value="in_progress">⚙️ Dikerjakan</option>
                                        <option value="testing">🧪 Pengujian (UAT)</option>
                                        <option value="approved">✅ Selesai</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Alasan Revisi Box */}
                        {ticket.revision_reason && (
                            <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-[20px] p-5 shadow-sm flex gap-3 items-start">
                                <div className="text-rose-500 mt-0.5 font-bold text-base">⚠️</div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Alasan Revisi</p>
                                    <p className="text-xs font-medium text-rose-900 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                        {ticket.revision_reason}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* UAT Feedback Box */}
                        {ticket.uat_feedback && (
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-[20px] p-5 shadow-sm flex gap-3 items-start">
                                <div className="text-emerald-500 mt-0.5 font-bold text-base">✅</div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">UAT Feedback</p>
                                    <p className="text-xs font-medium text-emerald-900 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                        {ticket.uat_feedback}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Lampiran Row Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-gray-200 dark:border-zinc-800 p-4 shadow-sm flex items-center justify-between gap-4">
                            <span className="text-sm font-extrabold text-gray-850 dark:text-zinc-200">Lampiran</span>
                            {ticket.attachment_path ? (
                                <a
                                    href={`/storage/${ticket.attachment_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#0070f3] hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                    Download Lampiran Pendukung
                                </a>
                            ) : (
                                <span className="text-xs text-gray-400 dark:text-zinc-600 italic">Tidak ada lampiran</span>
                            )}
                        </div>

                        {/* Checklists / Sub-tasks Support */}
                        {ticket.checklists?.length > 0 && (
                            <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Sub-Task</p>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        {ticket.checklists.filter(c => c.is_completed).length}/{ticket.checklists.length} selesai
                                    </span>
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full mb-3 overflow-hidden">
                                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                        style={{ width: `${(ticket.checklists.filter(c => c.is_completed).length / ticket.checklists.length) * 100}%` }}/>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {ticket.checklists.map(cl => (
                                        <div key={cl.id} className="flex items-center gap-2.5">
                                            <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border text-[9px] font-black ${
                                                cl.is_completed ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400' :
                                                cl.is_approved  ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400' :
                                                                  'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'}`}>
                                                {cl.is_completed ? '✔' : cl.is_approved ? '●' : ''}
                                            </span>
                                            <span className={`text-xs flex-1 ${cl.is_completed ? 'line-through text-gray-400 dark:text-zinc-500' : 'text-gray-700 dark:text-zinc-300 font-semibold'}`}>
                                                {cl.task_name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* UAT Modal */}
            {ticket && (
                <UatModal
                    isOpen={isUatOpen}
                    onClose={() => setIsUatOpen(false)}
                    ticketId={ticket.id}
                    onApproved={() => {
                        setIsUatOpen(false);
                        fetchTicketDetails();
                    }}
                    onRevised={() => {
                        setIsUatOpen(false);
                        fetchTicketDetails();
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
}
