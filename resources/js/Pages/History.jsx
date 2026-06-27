import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { getCategoryStyles } from '@/Utils/ticketHelpers';

const STATUS_MAP = {
    inbox: { label: 'Antrean', cls: 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 border-gray-200 dark:border-zinc-700' },
    review: { label: 'Review', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900' },
    to_do: { label: 'To Do', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-900' },
    in_progress: { label: 'In Progress', cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900' },
    testing: { label: 'Testing', cls: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border-violet-200 dark:border-violet-900' },
    approved: { label: 'Selesai ✔', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' },
};

export default function History({ tickets }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateRangeType, setDateRangeType] = useState('all');
    const [dateRangeLabel, setDateRangeLabel] = useState('Semua Waktu');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterUrgency, setFilterUrgency] = useState('all');

    const filteredTickets = React.useMemo(() => {
        return (tickets || []).filter(t => {
            // 1. Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchSearch =
                    t.judul_laporan?.toLowerCase().includes(q) ||
                    t.karyawan?.nama_karyawan?.toLowerCase().includes(q) ||
                    t.karyawan?.divisi?.toLowerCase().includes(q) ||
                    t.status?.toLowerCase().includes(q);
                if (!matchSearch) return false;
            }

            // 2. Category
            if (filterCategory && filterCategory !== 'all') {
                if (t.kategori_laporan?.toLowerCase() !== filterCategory.toLowerCase()) {
                    return false;
                }
            }

            // 3. Urgency
            if (filterUrgency && filterUrgency !== 'all') {
                if (t.urgensi_laporan?.toLowerCase() !== filterUrgency.toLowerCase()) {
                    return false;
                }
            }

            // 4. Date Range
            const tDate = new Date(t.created_at);
            const now = new Date();
            if (dateRangeType === 'this_month') {
                if (tDate.getMonth() !== now.getMonth() || tDate.getFullYear() !== now.getFullYear()) {
                    return false;
                }
            } else if (dateRangeType === 'last_30_days') {
                const limitDate = new Date();
                limitDate.setDate(now.getDate() - 30);
                if (tDate < limitDate) return false;
            } else if (dateRangeType === 'this_year') {
                if (tDate.getFullYear() !== now.getFullYear()) return false;
            } else if (dateRangeType === 'custom') {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (tDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (tDate > end) return false;
                }
            }

            return true;
        });
    }, [tickets, searchQuery, startDate, endDate, dateRangeType, filterCategory, filterUrgency]);

    return (
        <AuthenticatedLayout
            title="History Laporan"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            dateRangeType={dateRangeType}
            setDateRangeType={setDateRangeType}
            dateRangeLabel={dateRangeLabel}
            setDateRangeLabel={setDateRangeLabel}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterUrgency={filterUrgency}
            setFilterUrgency={setFilterUrgency}
        >
            <Head title="History Laporan" />

            <div className="py-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    {/* Mobile: card list */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-zinc-800">
                        {filteredTickets.length === 0 ? (
                            <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-zinc-600">Belum ada tiket approved.</p>
                        ) : filteredTickets.map((ticket, i) => {
                            const s = STATUS_MAP[ticket.status] || { label: ticket.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
                            return (
                                <div key={ticket.id} className="px-5 py-4">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{ticket.judul_laporan}</p>
                                            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                                                {ticket.karyawan?.nama_karyawan || '-'} · {ticket.karyawan?.divisi || '-'}
                                            </p>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide whitespace-nowrap shrink-0 ${s.cls}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getCategoryStyles(ticket.kategori_laporan)}`}>
                                                {ticket.kategori_laporan}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-zinc-600">
                                                {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <Link href={route('tickets.detail', ticket.id)} className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 underline underline-offset-4 shrink-0">
                                            Detail
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800 text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-950/50">
                                <tr>
                                    {['No', 'Nama Pelapor', 'Divisi', 'Judul', 'Kategori', 'Status', 'Tanggal', 'Aksi'].map(h => (
                                        <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800">
                                {filteredTickets.length === 0 ? (
                                    <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-zinc-600">Belum ada tiket approved.</td></tr>
                                ) : filteredTickets.map((ticket, i) => {
                                    const s = STATUS_MAP[ticket.status] || { label: ticket.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
                                    return (
                                        <tr key={ticket.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors duration-100">
                                            <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-zinc-600 font-semibold">{i + 1}</td>
                                            <td className="px-5 py-3.5 text-xs font-bold text-gray-800 dark:text-zinc-200">{ticket.karyawan?.nama_karyawan || '-'}</td>
                                            <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-zinc-400 font-medium">{ticket.karyawan?.divisi || '-'}</td>
                                            <td className="px-5 py-3.5 text-xs font-semibold text-gray-800 dark:text-zinc-200 max-w-[200px] truncate" title={ticket.judul_laporan}>{ticket.judul_laporan}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getCategoryStyles(ticket.kategori_laporan)}`}>
                                                    {ticket.kategori_laporan}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wide ${s.cls}`}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-[10px] text-gray-400 dark:text-zinc-600 whitespace-nowrap">
                                                {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Link href={route('tickets.detail', ticket.id)} className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 underline underline-offset-4">
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
