import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { getCategoryStyles, getUrgencyBadgeStyles, formatDateShort, getDeadlineBadgeStyles, isDeadlineOverdue, sortByUrgency } from '@/Utils/ticketHelpers';
import { STATUS } from '@/Components/ticket/constants';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

const COLUMNS = {
    review: { name: 'Sedang Review', dot: 'bg-amber-400' },
    to_do: { name: 'Antrean Kerja', dot: 'bg-sky-400' },
    in_progress: { name: 'Sedang Dikerjakan', dot: 'bg-indigo-500' },
    testing: { name: 'Tahap Pengujian', dot: 'bg-violet-500' },
};

const initBoard = () => {
    const b = {};
    Object.keys(COLUMNS).forEach(k => { b[k] = { ...COLUMNS[k], items: [] }; });
    return b;
};

export default function GlobalMonitor() {
    const [board, setBoard] = useState(initBoard);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(STATUS.REVIEW);
    const [loading, setLoading] = useState(true);
    const tabInitialized = useRef(false);

    useEffect(() => {
        axios.get('/api/tickets?global=true')
            .then(res => {
                const b = initBoard();
                res.data.forEach(t => { if (b[t.status]) b[t.status].items.push(t); });
                Object.keys(b).forEach(k => { b[k].items = sortByUrgency(b[k].items); });
                setBoard(b);
                setLoading(false);
            })
            .catch(() => { setLoading(false); });
    }, []);

    useEffect(() => {
        if (!tabInitialized.current) {
            const firstNonEmpty = Object.keys(board).find(k => board[k].items.length > 0);
            if (firstNonEmpty) {
                setActiveTab(firstNonEmpty);
                tabInitialized.current = true;
            }
        }
    }, [board]);

    const filteredBoard = useMemo(() => {
        const fb = {};
        Object.entries(board).forEach(([colId, col]) => {
            fb[colId] = {
                ...col,
                items: col.items.filter(item => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                        item.judul_laporan?.toLowerCase().includes(q) ||
                        item.kondisi_lapangan?.toLowerCase().includes(q) ||
                        item.kategori_laporan?.toLowerCase().includes(q) ||
                        item.karyawan?.nama_karyawan?.toLowerCase().includes(q) ||
                        item.karyawan?.divisi?.toLowerCase().includes(q)
                    );
                }),
            };
        });
        return fb;
    }, [board, searchQuery]);

    return (
        <AuthenticatedLayout
            title="Global Monitor"
            subtitle="Pemantauan seluruh laporan secara real-time"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Global Monitor" />

            {loading ? (
                <div className="h-[70vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Memuat monitor…</span>
                    </div>
                </div>
            ) : (
            <div className="py-4 flex-1 flex flex-col min-h-0">
                {/* Mobile tab bar */}
                <div className="md:hidden flex gap-2 overflow-x-auto pb-3 pt-1 -mx-1 px-1 shrink-0">
                    {Object.entries(filteredBoard).map(([colId, col]) => (
                        <button
                            key={colId}
                            type="button"
                            onClick={() => setActiveTab(colId)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 cursor-pointer
                                ${activeTab === colId
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                            {col.name}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                                ${activeTab === colId
                                    ? 'bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900'
                                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400'
                                }`}>
                                {col.items.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Board columns */}
                <div className="flex-1 min-h-0 flex md:grid md:grid-cols-4 md:grid-rows-1 gap-4 overflow-x-auto pb-2 md:overflow-hidden md:pb-0 items-stretch">
                    {Object.entries(filteredBoard).map(([colId, col]) => {
                        const isActiveMobile = colId === activeTab;
                        return (
                            <div key={colId}
                                className={`flex-shrink-0 w-full md:w-auto bg-gray-100/80 dark:bg-zinc-950 p-3 rounded-2xl flex flex-col min-h-[calc(100vh-11rem)] md:min-h-0 md:h-full border border-gray-200/60 dark:border-zinc-800/60
                                    ${isActiveMobile ? 'block' : 'hidden'} md:flex`}>

                                {/* Column header — hidden on mobile */}
                                <div className="hidden md:flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                                        <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">{col.name}</span>
                                    </div>
                                    <span className="bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700">
                                        {col.items.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                                    {col.items.length === 0 ? (
                                        <div className="h-16 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-[10px] text-gray-400 dark:text-zinc-600">
                                            Kolom Kosong
                                        </div>
                                    ) : col.items.map(item => (
                                        <div key={item.id}
                                            className="flex flex-col rounded-xl overflow-hidden border border-gray-200/70 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                                            <div className={`p-3 ${getCategoryStyles(item.kategori_laporan)}`}>
                                                <div className="flex justify-between items-start gap-1.5 mb-1">
                                                    <h4 className="font-bold text-gray-950 dark:text-zinc-100 text-xs leading-snug line-clamp-2 flex-1">{item.judul_laporan}</h4>
                                                    <span className={`text-[7px] px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ${getUrgencyBadgeStyles(item.urgensi_laporan)}`}>
                                                        {item.urgensi_laporan}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-700/80 dark:text-zinc-300 line-clamp-2 leading-relaxed">{item.kondisi_lapangan}</p>
                                            </div>
                                            <div className="bg-white dark:bg-zinc-900 px-3 py-2 border-t border-gray-100 dark:border-zinc-800/50 flex items-center justify-between gap-2">
                                                <p className="text-[10px] text-gray-500 dark:text-zinc-500 min-w-0 truncate">
                                                    <strong className="text-gray-700 dark:text-zinc-300">{item.admin_it?.nama_karyawan?.split(' ')[0] || item.karyawan?.nama_karyawan?.split(' ')[0] || 'User'}</strong>
                                                    <span className="ml-1">({item.admin_it?.divisi || item.karyawan?.divisi || '-'})</span>
                                                    {item.deadline && (
                                                        <span className={`ml-1.5 inline-flex items-center gap-0.5 ${getDeadlineBadgeStyles(item.deadline, item.status)}`}>
                                                            {formatDateShort(item.deadline)}
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => router.visit(route('tickets.detail', item.id))}
                                                        className="text-[10px] font-bold text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200 underline underline-offset-4 cursor-pointer py-1 px-1"
                                                    >
                                                        Detail
                                                    </button>
                                                </div>
                                            </div>
                                            {item.revision_reason && (
                                                <div className="mx-3 mb-2.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                                    <p className="text-[8px] font-bold text-rose-500 dark:text-rose-400 uppercase mb-0.5">Alasan Revisi</p>
                                                    <p className="text-[10px] text-rose-700 dark:text-rose-300 line-clamp-2">{item.revision_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            )}
        </AuthenticatedLayout>
    );
}
