import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { alertSuccess, alertError, alertConfirm, alertWarning } from '@/Utils/alert';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getCategoryStyles, getUrgencyBadgeStyles, formatDateShort, getDeadlineBadgeStyles, isDeadlineOverdue, sortByUrgency } from '@/Utils/ticketHelpers';
import { STATUS_TRANSITIONS, STATUS } from '@/Components/ticket/constants';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

const COLUMNS = {
    review: { name: 'Review', dot: 'bg-amber-400' },
    to_do: { name: 'To Do', dot: 'bg-sky-400' },
    in_progress: { name: 'In Progress', dot: 'bg-indigo-500' },
    testing: { name: 'Testing', dot: 'bg-violet-500' },
};

const initBoard = () => {
    const b = {};
    Object.keys(COLUMNS).forEach(k => { b[k] = { ...COLUMNS[k], items: [] }; });
    return b;
};

export default function KanbanBoard() {
    const [board, setBoard] = useState(initBoard);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(STATUS.REVIEW);
    const [loading, setLoading] = useState(true);
    const { auth } = usePage().props;
    const isIT = auth.user?.is_it === true;
    const tabInitialized = useRef(false);

    /* -- Fetch tickets on mount -- */
    useEffect(() => {
        axios.get('/api/tickets')
            .then(res => {
                const b = initBoard();
                res.data.forEach(t => { if (b[t.status]) b[t.status].items.push(t); });
                Object.keys(b).forEach(k => { b[k].items = sortByUrgency(b[k].items); });
                setBoard(b);
                setLoading(false);
            })
            .catch(() => { setLoading(false); });
    }, []);

    /* -- Set default tab to first non-empty column (only once after data loads) -- */
    useEffect(() => {
        if (!tabInitialized.current) {
            const firstNonEmpty = Object.keys(board).find(k => board[k].items.length > 0);
            if (firstNonEmpty) {
                setActiveTab(firstNonEmpty);
                tabInitialized.current = true;
            }
        }
    }, [board]);

    /* -- Filtered board per column -- */
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

    const onDragEnd = ({ source, destination, draggableId }) => {
        if (searchQuery) return;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const allowed = STATUS_TRANSITIONS[source.droppableId] || [];
        if (!allowed.includes(destination.droppableId)) {
            alertWarning('Transisi Tidak Valid', `Tidak bisa memindahkan tiket dari ${source.droppableId} ke ${destination.droppableId}.`);
            return;
        }

        const src = board[source.droppableId];
        const dst = board[destination.droppableId];
        const srcItems = [...src.items];
        const dstItems = source.droppableId === destination.droppableId ? srcItems : [...dst.items];
        const moved = { ...srcItems.splice(source.index, 1)[0] };
        const prevBoard = board;

        if (source.droppableId === destination.droppableId) {
            srcItems.splice(destination.index, 0, moved);
            setBoard({ ...board, [source.droppableId]: { ...src, items: srcItems } });
        } else {
            moved.status = destination.droppableId;
            dstItems.splice(destination.index, 0, moved);
            setBoard({
                ...board,
                [source.droppableId]: { ...src, items: srcItems },
                [destination.droppableId]: { ...dst, items: dstItems },
            });
            axios.patch(`/api/tickets/${draggableId}/status`, { status: destination.droppableId })
                .then(() => alertSuccess('Status tiket diperbarui.'))
                .catch(() => {
                    setBoard(prevBoard);
                    alertError('Gagal mengupdate status.');
                });
        }
    };

    return (
        <AuthenticatedLayout
            title="Kanban Board"
            subtitle="Kelola alur kerja laporan secara visual"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Kanban Board" />

            {loading ? (
                <div className="h-[70vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Memuat papan kanban…</span>
                    </div>
                </div>
            ) : (
            <div className="flex-1 flex flex-col min-h-0">
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
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex-1 min-h-0 flex md:grid md:grid-cols-4 md:grid-rows-1 gap-4 overflow-x-auto pb-2 md:overflow-hidden md:pb-0 items-stretch">
                        {Object.entries(filteredBoard).map(([colId, col]) => {
                            const isActiveMobile = colId === activeTab;
                            return (
                                <div key={colId}
                                    className={`flex-shrink-0 w-full md:w-auto bg-gray-100/80 dark:bg-zinc-950 p-3 rounded-2xl flex flex-col min-h-[calc(100vh-11rem)] md:min-h-0 md:h-full border border-gray-200/60 dark:border-zinc-800/60
                                        ${isActiveMobile ? 'block' : 'hidden'} md:flex`}>

                                    {/* Column header — hidden on mobile (tabs handle it) */}
                                    <div className="hidden md:flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                                            <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">{col.name}</span>
                                        </div>
                                        <span className="bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700">
                                            {col.items.length}
                                        </span>
                                    </div>

                                    <Droppable droppableId={colId}>
                                        {(prov, snap) => (
                                            <div {...prov.droppableProps} ref={prov.innerRef}
                                                className={`flex-1 min-h-0 overflow-y-auto space-y-3 rounded-xl transition-colors duration-150 pr-1 ${snap.isDraggingOver ? 'bg-indigo-50/60 dark:bg-indigo-950/10' : ''}`}>
                                                {col.items.length === 0 && (
                                                    <div className="h-20 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-[10px] text-gray-400 dark:text-zinc-600">
                                                        Kosong
                                                    </div>
                                                )}
                                                {col.items.map((item, idx) => (
                                                    <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={idx} isDragDisabled={!!searchQuery}>
                                                        {(prov2, snap2) => (
                                                            <div ref={prov2.innerRef} {...prov2.draggableProps} {...prov2.dragHandleProps}
                                                                className={`flex flex-col rounded-xl overflow-hidden border shadow-sm transition duration-150 bg-white dark:bg-zinc-900 cursor-grab active:cursor-grabbing
                                                                    ${snap2.isDragging
                                                                        ? 'border-indigo-300 dark:border-indigo-700 shadow-lg rotate-1'
                                                                        : 'border-gray-200/70 dark:border-zinc-800 hover:shadow-md'}`}>

                                                                <div className={`p-3 ${getCategoryStyles(item.kategori_laporan)}`}>
                                                                    <div className="flex justify-between items-start gap-1.5 mb-1.5">
                                                                        <h4 className="font-bold text-gray-950 dark:text-zinc-100 text-xs md:text-xs leading-snug line-clamp-2 flex-1">{item.judul_laporan}</h4>
                                                                        <span className={`text-[7px] px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ${getUrgencyBadgeStyles(item.urgensi_laporan)}`}>
                                                                            {item.urgensi_laporan}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-700/80 dark:text-zinc-300 line-clamp-2 leading-relaxed">{item.kondisi_lapangan}</p>
                                                                </div>

                                                                <div className="bg-white dark:bg-zinc-900 px-3 py-2.5 border-t border-gray-100 dark:border-zinc-800/50">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <p className="text-[10px] text-gray-500 dark:text-zinc-500 min-w-0 truncate">
                                                                            <strong className="text-gray-700 dark:text-zinc-300">{item.karyawan?.nama_karyawan?.split(' ')[0] || 'User'}</strong>
                                                                            <span className="ml-1">({item.karyawan?.divisi || '-'})</span>
                                                                            {item.deadline && (
                                                                                <span className={`ml-1.5 inline-flex items-center gap-0.5 ${getDeadlineBadgeStyles(item.deadline, item.status)}`}>
                                                                                    {formatDateShort(item.deadline)}
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            {isIT && item.status === STATUS.REVIEW && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={async (e) => {
                                                                                        e.stopPropagation();
                                                                                    const confirmed = await alertConfirm('Kembalikan ke Inbox?', 'Tiket akan dikembalikan ke antrian inbox.', {
                                                                                        icon: 'warning',
                                                                                        confirmButtonText: 'Ya, Kembalikan',
                                                                                    });
                                                                                    if (confirmed) {
                                                                                         axios.post(`/api/tickets/${item.id}/return-to-inbox`)
                                                                                             .then(() => {
                                                                                                 alertSuccess('Tiket dikembalikan ke inbox.');
                                                                                                 setBoard(prev => {
                                                                                                    const next = initBoard();
                                                                                                    Object.keys(prev).forEach(k => { next[k].items = [...prev[k].items]; });
                                                                                                    next.review.items = next.review.items.filter(t => t.id !== item.id);
                                                                                                    return next;
                                                                                                });
                                                                                            })
                                                                                            .catch(err => alertError(err.response?.data?.message || 'Gagal mengembalikan tiket.'));
                                                                                    }
                                                                                    }}
                                                                                    className="text-[10px] md:text-[10px] font-bold text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-4 cursor-pointer py-2 px-2.5 rounded-lg"
                                                                                >
                                                                                    Kembali
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); router.visit(route('admin.ticket-detail', item.id)); }}
                                                                                className="text-[10px] md:text-[10px] font-bold text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200 underline underline-offset-4 cursor-pointer py-2 px-2.5 rounded-lg"
                                                                            >
                                                                                Detail
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    {item.revision_reason && (
                                                                        <div className="mt-1.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                                                            <p className="text-[8px] font-bold text-rose-500 dark:text-rose-400 uppercase mb-0.5">Alasan Revisi</p>
                                                                            <p className="text-[10px] text-rose-700 dark:text-rose-300 line-clamp-2">{item.revision_reason}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {prov.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>
            )}
        </AuthenticatedLayout>
    );
}
