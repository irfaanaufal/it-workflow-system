import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import MobilePagination from '@/Components/MobilePagination';
import { getCategoryStyles } from '@/Utils/ticketHelpers';
import { STATUS_CONFIG, STATUS_COLORS, STATUS } from '@/Components/ticket/constants';

export default function History({ tickets }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateRangeType, setDateRangeType] = useState('all');
    const [dateRangeLabel, setDateRangeLabel] = useState('Semua Waktu');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterUrgency, setFilterUrgency] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [mobilePage, setMobilePage] = useState(1);
    const mobilePerPage = 8;

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

            // 2. Status
            if (filterStatus && filterStatus !== 'all') {
                if (t.status !== filterStatus) {
                    return false;
                }
            }

            // 3. Category
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
    }, [tickets, searchQuery, startDate, endDate, dateRangeType, filterCategory, filterUrgency, filterStatus]);

    // Reset mobile page on filter changes
    useEffect(() => {
        setMobilePage(1);
    }, [searchQuery, filterCategory, filterUrgency, filterStatus, dateRangeType, startDate, endDate]);

    // Mobile pagination
    const mobileTotalPages = Math.ceil(filteredTickets.length / mobilePerPage);
    const mobileStart = (mobilePage - 1) * mobilePerPage;
    const mobileTickets = filteredTickets.slice(mobileStart, mobileStart + mobilePerPage);

    const formatShortDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <AuthenticatedLayout
            title="History Laporan"
            subtitle="Riwayat seluruh laporan yang telah diproses"
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
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
        >
            <Head title="History Laporan" />

            <div className="flex-1 flex flex-col min-h-0 pb-1">
                {/* Mobile: Card list */}
                <div className="md:hidden space-y-3 pb-20">
                    {mobileTickets.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">
                            Belum ada tiket di history.
                        </div>
                    ) : mobileTickets.map(ticket => {
                        return (
                            <div key={ticket.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
                                {/* Header: Nama + Divisi */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{ticket.karyawan?.nama_karyawan || '-'}</p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{ticket.karyawan?.divisi || '-'}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 whitespace-nowrap shrink-0">{formatShortDate(ticket.created_at)}</span>
                                </div>

                                {/* Title */}
                                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-snug line-clamp-2 mb-2.5">{ticket.judul_laporan}</p>

                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${getCategoryStyles(ticket.kategori_laporan)}`}>
                                        {ticket.kategori_laporan}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg text-white ${STATUS_COLORS[ticket.status] || 'bg-gray-100'}`}>
                                        {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                                    </span>
                                </div>

                                {/* Reject reason */}
                                {ticket.status === STATUS.REJECTED && ticket.reject_reason && (
                                    <div className="mb-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                        <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase mb-0.5">Alasan Penolakan</p>
                                        <p className="text-xs text-rose-700 dark:text-rose-300 line-clamp-2">{ticket.reject_reason}</p>
                                    </div>
                                )}

                                {/* Detail link */}
                                <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-zinc-800">
                                    <Link href={route('tickets.detail', ticket.id)} className="text-xs font-bold text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200 underline underline-offset-4 py-1 px-1">
                                        Detail
                                    </Link>
                                </div>
                            </div>
                        );
                    })}

                    <MobilePagination currentPage={mobilePage} totalPages={mobileTotalPages} onPageChange={setMobilePage} />
                </div>

                {/* Desktop: DataTable — TIDAK DIUBAH */}
                <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-auto flex-1 flex flex-col min-h-0">
                    <DataTable
                        data={filteredTickets}
                        columns={[
                            { key: 'no', label: 'No', className: 'w-12 dark:text-zinc-300', render: (_, i) => i + 1 },
                            { key: 'nama', label: 'Nama Pelapor', className: 'min-w-0', tdClassName: 'font-bold text-sm truncate dark:text-zinc-300', render: (row) => <span className="truncate block dark:text-zinc-300">{row.karyawan?.nama_karyawan || '-'}</span> },
                            { key: 'divisi', label: 'Divisi', className: 'min-w-0', render: (row) => <span className="text-sm text-gray-600 dark:text-zinc-400 truncate block">{row.karyawan?.divisi || '-'}</span> },
                            { key: 'judul', label: 'Judul', className: 'min-w-0', tdClassName: 'font-semibold text-sm truncate dark:text-zinc-300', render: (row) => (
                                <span className="truncate block dark:text-zinc-300" title={row.judul_laporan}>{row.judul_laporan}</span>
                            )},
                            { key: 'kategori', label: 'Kategori', className: 'whitespace-nowrap', render: (row) => (
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getCategoryStyles(row.kategori_laporan)}`}>
                                    {row.kategori_laporan}
                                </span>
                            )},
                            { key: 'status', label: 'Status', className: 'whitespace-nowrap', render: (row) => {
                                return (
                                    <div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg text-white ${STATUS_COLORS[row.status] || 'bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200'}`}>
                                            {STATUS_CONFIG[row.status]?.label || row.status}
                                        </span>
                                        {row.status === 'rejected' && row.reject_reason && (
                                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-[150px] truncate" title={row.reject_reason}>
                                                {row.reject_reason}
                                            </p>
                                        )}
                                    </div>
                                );
                            }},
                            { key: 'tanggal', label: 'Tanggal', className: 'whitespace-nowrap', render: (row) => (
                                <span className="text-xs text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                                    {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                </span>
                            )},
                            { key: 'aksi', label: 'Aksi', className: 'whitespace-nowrap', tdClassName: 'text-right', render: (row) => (
                                <Link href={route('tickets.detail', row.id)} className="text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 underline underline-offset-4">
                                    Detail
                                </Link>
                            )},
                        ]}
                        emptyState={
                            <p className="px-5 py-16 text-center text-sm text-gray-400 dark:text-zinc-600">Belum ada tiket di history.</p>
                        }
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
