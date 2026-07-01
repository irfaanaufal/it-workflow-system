import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCategoryStyles, getUrgencyBadgeStyles } from '@/Utils/ticketHelpers';
import UatModal from '@/Components/UatModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

// Kategori yang boleh pakai Blocker
const BLOCKER_CATEGORIES = ['fix bug', 'maintenance'];

// Helper to sort tickets by urgency: blocker > high > medium > low
const sortByUrgency = (tickets) => {
    const urgencyOrder = { blocker: 0, high: 1, medium: 2, low: 3 };
    return [...tickets].sort((a, b) => {
        const urgencyA = urgencyOrder[a.urgensi_laporan] ?? 4;
        const urgencyB = urgencyOrder[b.urgensi_laporan] ?? 4;
        return urgencyA - urgencyB;
    });
};

export default function MyRequests() {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isUatOpen, setIsUatOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        const handler = (e) => {
            console.log('Real-time status update received on MyRequests:', e.detail.ticket);
            fetchTickets();
        };

        window.addEventListener('ticket-status-updated', handler);
        return () => window.removeEventListener('ticket-status-updated', handler);
    }, []);

    const fetchTickets = () => {
        axios.get('/api/my-tickets')
            .then(res => setTickets(sortByUrgency(res.data)))
            .catch(err => console.error(err));
    };

    const openUat = (ticket) => { setSelectedTicket(ticket); setIsUatOpen(true); };
    const openEdit = (ticket) => { setSelectedTicket(ticket); setIsEditOpen(true); };
    const openDetail = (ticket) => router.visit(route('tickets.detail', ticket.id));

    const handleApproved = (ticketId) =>
        setTickets(prev => sortByUrgency(prev.map(t => t.id === ticketId ? { ...t, status: 'approved' } : t)));

    const handleRevised = (ticketId) =>
        setTickets(prev => sortByUrgency(prev.map(t => t.id === ticketId ? { ...t, status: 'review' } : t)));

    const handleEditSaved = (updated) =>
        setTickets(prev => sortByUrgency(prev.map(t => t.id === updated.id ? updated : t)));

    const handleDelete = (ticketId) => {
        if (!confirm('Yakin ingin menghapus tiket ini? Tiket akan dihapus secara permanen dari daftar Anda.')) return;
        axios.delete(`/api/tickets/${ticketId}`)
            .then(() => setTickets(prev => sortByUrgency(prev.filter(t => t.id !== ticketId))))
            .catch(err => alert(err.response?.data?.message || 'Gagal menghapus tiket.'));
    };

    const filteredTickets = React.useMemo(() => {
        const activeTickets = (tickets || []).filter(t => t.status !== 'approved');
        if (!searchQuery) return activeTickets;
        const q = searchQuery.toLowerCase();
        return activeTickets.filter(t =>
            t.judul_laporan?.toLowerCase().includes(q) ||
            t.kondisi_lapangan?.toLowerCase().includes(q) ||
            t.kategori_laporan?.toLowerCase().includes(q) ||
            t.status?.toLowerCase().includes(q)
        );
    }, [tickets, searchQuery]);

    return (
        <AuthenticatedLayout
            title="Laporan Saya"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="My Requests" />

            <div className="py-6 transition-colors duration-200">
                <div className="mb-6">
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Laporan Saya</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        Daftar tiket yang Anda kirimkan. Tiket di antrean masih bisa diedit.
                    </p>
                </div>

                {filteredTickets.length === 0 ? (
                    <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm animate-fadeIn">
                        <svg className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-400 dark:text-zinc-650">
                            {searchQuery ? 'Tidak ada tiket yang cocok dengan pencarian Anda.' : 'Anda belum membuat laporan apapun. Klik "+ Buat Laporan" di kanan atas.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                        {filteredTickets.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                onUat={() => openUat(ticket)}
                                onDetail={() => openDetail(ticket)}
                                onEdit={() => openEdit(ticket)}
                                onDelete={() => handleDelete(ticket.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* UAT Modal */}
            <UatModal
                isOpen={isUatOpen}
                onClose={() => setIsUatOpen(false)}
                ticketId={selectedTicket?.id}
                onApproved={handleApproved}
                onRevised={handleRevised}
                initialStep={2}
            />

            {/* Edit Modal */}
            {isEditOpen && selectedTicket && (
                <EditTicketModal
                    ticket={selectedTicket}
                    onClose={() => setIsEditOpen(false)}
                    onSaved={handleEditSaved}
                />
            )}
        </AuthenticatedLayout>
    );
}

/* â”€â”€â”€ Ticket Card â”€â”€â”€ */
function TicketCard({ ticket, onUat, onDetail, onEdit, onDelete }) {
    const [readyToSubmit, setReadyToSubmit] = useState(false);

    const it = ticket.admin_it;          // karyawan IT penanggung jawab
    const itUser = it?.user;             // user record-nya (untuk avatar)

    const avatarUrl = itUser?.avatar_url || null;
    const initials = it?.nama_karyawan
        ? it.nama_karyawan.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : 'IT';

    // Reset readyToSubmit when status changes from testing
    useEffect(() => {
        if (ticket.status !== 'testing') setReadyToSubmit(false);
    }, [ticket.status]);

    const { auth } = usePage().props;
    const user = auth.user;
    const isOwner = user?.karyawan?.id === ticket.karyawan_id;
    const role = user?.role_name;
    const isAdmin = role === 'superadmin' || role === 'admin';
    const canEdit = isAdmin || (isOwner && ticket.status === 'inbox');
    const canDelete = isAdmin || (isOwner && ticket.status === 'inbox');

    const handleTestingClick = () => {
        if (!readyToSubmit) {
            if (ticket.system_ptsam?.link_sistem) {
                window.open(ticket.system_ptsam.link_sistem, '_blank');
            }
            setReadyToSubmit(true);
        } else {
            setReadyToSubmit(false);
            onUat();
        }
    };

    return (
        <div className="flex flex-col rounded-[20px] overflow-hidden border border-gray-200/60 dark:border-zinc-800 shadow-sm hover:shadow-md transition duration-200 bg-white dark:bg-zinc-900">

            {/* Top Pastel Section */}
            <div className={`p-4 flex flex-col justify-between h-[144px] ${getCategoryStyles(ticket.kategori_laporan)}`}>
                <div>
                    <h3 className="font-bold text-gray-950 text-sm leading-snug line-clamp-2">
                        {ticket.judul_laporan}
                    </h3>
                    <p className="text-[11px] text-gray-700/85 mt-1.5 line-clamp-2 leading-relaxed">
                        {ticket.kondisi_lapangan}
                    </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-block font-bold uppercase tracking-wider ${getUrgencyBadgeStyles(ticket.urgensi_laporan)}`}>
                        {ticket.urgensi_laporan}
                    </span>
                    <div className="flex items-center gap-1">
                        {ticket.system_ptsam && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/20 uppercase tracking-wide truncate max-w-[80px]" title={ticket.system_ptsam.nama_sistem}>
                                {ticket.system_ptsam.nama_sistem}
                            </span>
                        )}
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-white/70 text-gray-800 border border-gray-200/20 uppercase tracking-wide">
                            {ticket.kategori_laporan}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom White Section */}
            <div className="bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3 border-t border-gray-100 dark:border-zinc-800/50">

                {/* Metadata */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <StatusBadge status={ticket.status} />
                </div>

                {/* Alasan Revisi */}
                {ticket.status === 'review' && ticket.revision_reason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-450">
                        <p className="text-[9px] font-extrabold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-0.5">⚠ Alasan Revisi</p>
                        <p className="text-[10px] font-semibold leading-relaxed line-clamp-2">{ticket.revision_reason}</p>
                    </div>
                )}

                {/* PIC IT — tampil setelah tiket di-take */}
                <div className="flex items-center justify-between">
                    {it ? (
                        <div className="flex items-center gap-2">
                            {/* Avatar IT */}
                            <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shrink-0 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={it.nama_karyawan} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">{initials}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide leading-none">PIC IT</p>
                                <p className="text-[10px] font-semibold text-gray-700 dark:text-zinc-300 leading-tight">
                                    {it.nama_karyawan?.split(' ')[0] || 'IT Team'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {/* Gembok — belum ada PIC */}
                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border border-gray-200 dark:border-zinc-700">
                                <svg className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 italic">Belum diambil</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onDetail}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200 underline underline-offset-4 transition cursor-pointer"
                            title="Detail Laporan">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        {canEdit && (
                            <button
                                onClick={onEdit}
                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
                                title="Ubah Laporan">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={onDelete}
                                className="text-[10px] font-bold text-rose-400 hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                                title="Hapus tiket">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        {ticket.status === 'testing' ? (
                            <button
                                onClick={handleTestingClick}
                                className={`text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${readyToSubmit
                                    ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 animate-pulse'
                                    : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                                    }`}
                            >
                                {readyToSubmit ? (
                                    <>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Submit
                                    </>
                                ) : (
                                    'Testing'
                                )}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* --- Edit Ticket Modal --- */
function EditTicketModal({ ticket, onClose, onSaved }) {
    const [judul, setJudul] = useState(ticket.judul_laporan);
    const [kategori, setKategori] = useState(ticket.kategori_laporan);
    const [urgensi, setUrgensi] = useState(ticket.urgensi_laporan);
    const [kondisi, setKondisi] = useState(ticket.kondisi_lapangan);
    const [keinginan, setKeinginan] = useState(ticket.keinginan_sistem);
    const [dampak, setDampak] = useState(ticket.dampak_positif);
    const [systemId, setSystemId] = useState(ticket.system_ptsam_id || '');
    const [systems, setSystems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const canBlocker = BLOCKER_CATEGORIES.includes(kategori);

    React.useEffect(() => {
        axios.get('/api/systems')
            .then(res => setSystems(res.data))
            .catch(console.error);
    }, []);

    const handleKategoriChange = (val) => {
        setKategori(val);
        if (urgensi === 'blocker' && !BLOCKER_CATEGORIES.includes(val)) {
            setUrgensi('high');
        }
        if (!['add feature', 'maintenance', 'fix bug'].includes(val)) {
            setSystemId('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.patch(`/api/tickets/${ticket.id}`, {
                judul_laporan: judul,
                kategori_laporan: kategori,
                urgensi_laporan: urgensi,
                kondisi_lapangan: kondisi,
                keinginan_sistem: keinginan,
                dampak_positif: dampak,
                system_ptsam_id: ['add feature', 'maintenance', 'fix bug'].includes(kategori) ? (systemId || null) : null,
            });
            onSaved(res.data.ticket);
            onClose();
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
                setError(Object.values(errors).flat().join(' '));
            } else {
                setError(err.response?.data?.message || 'Gagal menyimpan perubahan.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-200/60 dark:border-zinc-800 overflow-hidden">

                {/* Header */}
                <div className="px-7 pt-6 pb-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400 mb-1">Edit Laporan</p>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">Ubah Detail Tiket</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition cursor-pointer">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-7 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

                    {/* Judul */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Judul Laporan</label>
                        <input
                            type="text"
                            value={judul}
                            onChange={e => setJudul(e.target.value)}
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 outline-none transition"
                            required
                        />
                    </div>

                    {/* Kategori + Urgensi */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Kategori</label>
                            <select
                                value={kategori}
                                onChange={e => handleKategoriChange(e.target.value)}
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-amber-400/40 outline-none transition"
                            >
                                <option value="new system">New System</option>
                                <option value="add feature">Add Feature</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="fix bug">Fix Bug</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Urgensi</label>
                            <select
                                value={urgensi}
                                onChange={e => setUrgensi(e.target.value)}
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-amber-400/40 outline-none transition"
                            >
                                {canBlocker && <option value="blocker">🔴 Blocker</option>}
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            {!canBlocker && (
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">Blocker hanya untuk Fix Bug / Maintenance.</p>
                            )}
                        </div>
                    </div>

                    {/* Sistem dropdown */}
                    {['add feature', 'maintenance', 'fix bug'].includes(kategori) && (
                        <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Sistem yang Dilaporkan</label>
                            <select
                                value={systemId}
                                onChange={e => setSystemId(e.target.value)}
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-amber-400/40 outline-none transition cursor-pointer"
                                required
                            >
                                <option value="">-- Pilih Sistem --</option>
                                {systems.map(sys => (
                                    <option key={sys.id} value={sys.id}>{sys.nama_sistem}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Kondisi */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Kondisi di Lapangan</label>
                        <textarea value={kondisi} onChange={e => setKondisi(e.target.value)} rows={3}
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-amber-400/40 outline-none resize-none transition" required />
                    </div>

                    {/* Keinginan */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Keinginan Sistem</label>
                        <textarea value={keinginan} onChange={e => setKeinginan(e.target.value)} rows={3}
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-amber-400/40 outline-none resize-none transition" required />
                    </div>

                    {/* Dampak */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Dampak Positif</label>
                        <textarea value={dampak} onChange={e => setDampak(e.target.value)} rows={3}
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-amber-400/40 outline-none resize-none transition" required />
                    </div>

                    {error && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                        <button type="button" onClick={onClose}
                            className="text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 px-4 py-2.5 rounded-xl transition cursor-pointer">
                            Batal
                        </button>
                        <button type="submit" disabled={loading}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60 flex items-center gap-2">
                            {loading ? (
                                <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Menyimpan...</>
                            ) : (
                                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Simpan Perubahan</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* --- Status Badge --- */
const STATUS_CONFIG = {
    inbox: { label: 'Menunggu Antrean', color: 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700' },
    review: { label: 'Sedang Review', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900' },
    to_do: { label: 'Antrean Kerja', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-200 dark:border-sky-900' },
    in_progress: { label: 'Sedang Dikerjakan', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900' },
    testing: { label: 'Siap Diuji', color: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-200 dark:border-violet-900' },
    approved: { label: 'Selesai ✔', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' },
};

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-500 border border-gray-200' };
    return (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${c.color}`}>
            {c.label}
        </span>
    );
}


