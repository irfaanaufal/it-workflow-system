import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCategoryStyles, getUrgencyBadgeStyles } from '@/Utils/ticketHelpers';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

// Helper to sort tickets by urgency: blocker > high > medium > low
const sortByUrgency = (tickets) => {
    const urgencyOrder = { blocker: 0, high: 1, medium: 2, low: 3 };
    return [...tickets].sort((a, b) => {
        const urgencyA = urgencyOrder[a.urgensi_laporan] ?? 4;
        const urgencyB = urgencyOrder[b.urgensi_laporan] ?? 4;
        return urgencyA - urgencyB;
    });
};

export default function Inbox() {
    const [tickets, setTickets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTickets = () => {
        axios.get('/api/tickets/inbox')
            .then(res => setTickets(sortByUrgency(res.data)))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    /* ── Real-time updates via window event (dispatched by AuthenticatedLayout) ── */
    useEffect(() => {
        const handler = (e) => {
            const ticket = e.detail.ticket;
            if (ticket.status === 'inbox') {
                setTickets(prev => {
                    const newTickets = prev.some(t => t.id === ticket.id)
                        ? prev.map(t => t.id === ticket.id ? ticket : t)
                        : [ticket, ...prev];
                    return sortByUrgency(newTickets);
                });
            } else {
                setTickets(prev => sortByUrgency(prev.filter(t => t.id !== ticket.id)));
            }
        };

        window.addEventListener('ticket-status-updated', handler);
        return () => window.removeEventListener('ticket-status-updated', handler);
    }, []);

    const handleTake = (ticketId) => {
        axios.post(`/api/tickets/${ticketId}/take`)
            .then(() => {
                setTickets(prev => prev.filter(t => t.id !== ticketId));
            })
            .catch(err => alert(err.response?.data?.message || 'Gagal mengambil tiket.'));
    };

    const handleRejectClick = (ticket) => {
        setSelectedTicket(ticket);
        setRejectReason('');
        setIsRejectOpen(true);
    };

    const handleRejectSubmit = () => {
        if (!rejectReason.trim()) return;
        setIsSubmitting(true);
        axios.post(`/api/tickets/${selectedTicket.id}/reject`, { reject_reason: rejectReason })
            .then(() => {
                setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
                setIsRejectOpen(false);
                setSelectedTicket(null);
                setRejectReason('');
            })
            .catch(err => alert(err.response?.data?.message || 'Gagal menolak tiket.'))
            .finally(() => setIsSubmitting(false));
    };

    const filteredTickets = React.useMemo(() => {
        if (!searchQuery) return tickets;
        const q = searchQuery.toLowerCase();
        return tickets.filter(t =>
            t.judul_laporan?.toLowerCase().includes(q) ||
            t.kondisi_lapangan?.toLowerCase().includes(q) ||
            t.kategori_laporan?.toLowerCase().includes(q) ||
            t.status?.toLowerCase().includes(q) ||
            t.karyawan?.nama_karyawan?.toLowerCase().includes(q) ||
            t.karyawan?.divisi?.toLowerCase().includes(q)
        );
    }, [tickets, searchQuery]);

    return (
        <AuthenticatedLayout
            title="Inbox"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Inbox Laporan" />

            <div className="py-4">
                {filteredTickets.length === 0 ? (
                    <div className="mt-4 py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <svg className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-400 dark:text-zinc-600">
                            {searchQuery ? 'Tidak ada tiket yang cocok dengan pencarian Anda.' : 'Antrean kosong. Tidak ada laporan baru saat ini.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                        {filteredTickets.map(ticket => (
                            <InboxCard key={ticket.id} ticket={ticket} onTake={handleTake} onReject={handleRejectClick} onDetail={() => router.visit(route('admin.ticket-detail', ticket.id))} />
                        ))}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {isRejectOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 dark:bg-black/70" onClick={() => !isSubmitting && setIsRejectOpen(false)} />
                    <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-zinc-800">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/30">
                                    <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Tolak Tiket</h3>
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-1">{selectedTicket?.judul_laporan}</p>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                                    Alasan Penolakan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
                                    rows={3}
                                    placeholder="Masukkan alasan penolakan..."
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsRejectOpen(false)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleRejectSubmit}
                                    disabled={!rejectReason.trim() || isSubmitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Memproses...
                                        </>
                                    ) : (
                                        'Tolak Tiket'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function InboxCard({ ticket, onTake, onReject, onDetail }) {
    return (
        <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-200/70 dark:border-zinc-800 shadow-sm hover:shadow-md transition duration-200 bg-white dark:bg-zinc-900">

            {/* Pastel top */}
            <div className={`p-4 flex flex-col justify-between h-[144px] ${getCategoryStyles(ticket.kategori_laporan)}`}>
                <div>
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-950 text-sm leading-snug line-clamp-2 flex-1">
                            {ticket.judul_laporan}
                        </h3>
                        <span className={`shrink-0 font-bold uppercase text-[8px] tracking-wide px-1.5 py-0.5 rounded ${getUrgencyBadgeStyles(ticket.urgensi_laporan)}`}>
                            {ticket.urgensi_laporan}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-700/80 line-clamp-2 leading-relaxed mt-1.5">
                        {ticket.kondisi_lapangan}
                    </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-white/70 text-gray-800 border border-gray-200/20 uppercase tracking-wide">
                        {ticket.kategori_laporan}
                    </span>
                    {ticket.system_ptsam && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/20 uppercase tracking-wide truncate max-w-[120px]" title={ticket.system_ptsam.nama_sistem}>
                            {ticket.system_ptsam.nama_sistem}
                        </span>
                    )}
                </div>
            </div>

            {/* White bottom */}
            <div className="bg-white dark:bg-zinc-900 p-4 border-t border-gray-100 dark:border-zinc-800/60 flex flex-col gap-2.5">
                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-300">
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                        {ticket.karyawan?.divisi || '-'}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        {ticket.karyawan?.nama_karyawan?.split(' ')[0] || '-'}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-zinc-800/50">
                    <button onClick={onDetail} className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition underline underline-offset-4 cursor-pointer"
                        title="Detail Laporan">
                        Detail
                    </button>
                    {(() => {
                        const user = usePage().props.auth.user;
                        const canTake = user.role_name === 'superadmin' || user.role_name === 'admin';
                        if (!canTake) return null;
                        return (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onReject(ticket)}
                                    className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-[10px] font-bold text-rose-600 dark:text-rose-400 py-1.5 px-3 rounded-lg flex items-center gap-1 transition border border-rose-200/60 dark:border-rose-900/50 cursor-pointer"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => onTake(ticket.id)}
                                    className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold text-gray-700 dark:text-zinc-300 py-1.5 px-3.5 rounded-lg flex items-center gap-1 transition border border-gray-200/60 dark:border-zinc-700 cursor-pointer"
                                >
                                    Take <span className="text-gray-400 dark:text-zinc-500 font-normal">→</span>
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
