import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getCategoryStyles, getUrgencyBadgeStyles } from '@/Utils/ticketHelpers';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

const COLUMNS = {
    review:      { name: 'Review',      dot: 'bg-amber-400' },
    to_do:       { name: 'To Do',       dot: 'bg-sky-400' },
    in_progress: { name: 'In Progress', dot: 'bg-indigo-500' },
    testing:     { name: 'Testing',     dot: 'bg-violet-500' },
};

const initBoard = () => {
    const b = {};
    Object.keys(COLUMNS).forEach(k => { b[k] = { ...COLUMNS[k], items: [] }; });
    return b;
};

export default function KanbanBoard() {
    const [board, setBoard] = useState(initBoard);
    const [searchQuery, setSearchQuery] = useState('');

    /* ── Fetch tickets on mount ── */
    useEffect(() => {
        axios.get('/api/tickets')
            .then(res => {
                const b = initBoard();
                res.data.forEach(t => { if (b[t.status]) b[t.status].items.push(t); });
                setBoard(b);
            })
            .catch(console.error);
    }, []);

    /* ── Real-time updates via window event (dispatched by AuthenticatedLayout) ── */
    useEffect(() => {
        const handler = (e) => {
            const u = e.detail.ticket;
            setBoard(prev => {
                const next = initBoard();
                Object.keys(prev).forEach(k => { next[k].items = [...prev[k].items]; });
                Object.keys(next).forEach(k => { next[k].items = next[k].items.filter(t => t.id !== u.id); });
                if (next[u.status]) next[u.status].items.push(u);
                return next;
            });
        };

        window.addEventListener('ticket-status-updated', handler);
        return () => window.removeEventListener('ticket-status-updated', handler);
    }, []);

    const onDragEnd = ({ source, destination, draggableId }) => {
        if (searchQuery) return; // Disable dragging during active search
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const src = board[source.droppableId];
        const dst = board[destination.droppableId];
        const srcItems = [...src.items];
        const dstItems = source.droppableId === destination.droppableId ? srcItems : [...dst.items];
        const [moved] = srcItems.splice(source.index, 1);

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
                .catch(() => alert('Gagal mengupdate status.'));
        }
    };

    return (
        <AuthenticatedLayout
            title="Kanban Board"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Kanban Board" />

            <div className="py-4 flex-1 flex flex-col min-h-0">
                <div className="mb-4 shrink-0">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Kanban Board</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">Drag &amp; Drop kartu untuk memperbarui status tiket.</p>
                </div>

                {/* Horizontal scroll on mobile, 4-col grid on desktop */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex-1 min-h-0 flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-2 md:overflow-visible md:pb-0 items-stretch">
                        {Object.entries(board).map(([colId, col]) => {
                            const filteredItems = col.items.filter(item => {
                                if (!searchQuery) return true;
                                const q = searchQuery.toLowerCase();
                                return (
                                    item.judul_laporan?.toLowerCase().includes(q) ||
                                    item.kondisi_lapangan?.toLowerCase().includes(q) ||
                                    item.kategori_laporan?.toLowerCase().includes(q) ||
                                    item.karyawan?.nama_karyawan?.toLowerCase().includes(q) ||
                                    item.karyawan?.divisi?.toLowerCase().includes(q)
                                );
                            });
                            return (
                                <div key={colId}
                                    className="flex-shrink-0 w-[82vw] sm:w-72 md:w-auto bg-gray-100/80 dark:bg-zinc-950 p-3 rounded-2xl flex flex-col min-h-[calc(100vh-11rem)] md:min-h-0 md:h-full border border-gray-200/60 dark:border-zinc-800/60">

                                    {/* Column header */}
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                                            <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">{col.name}</span>
                                        </div>
                                        <span className="bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700">
                                            {filteredItems.length}
                                        </span>
                                    </div>

                                    <Droppable droppableId={colId}>
                                        {(prov, snap) => (
                                            <div {...prov.droppableProps} ref={prov.innerRef}
                                                className={`flex-1 min-h-0 overflow-y-auto space-y-3 rounded-xl transition-colors duration-150 pr-1 ${snap.isDraggingOver ? 'bg-indigo-50/60 dark:bg-indigo-950/10' : ''}`}>
                                                {filteredItems.length === 0 && (
                                                    <div className="h-20 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-[10px] text-gray-400 dark:text-zinc-600">
                                                        Kosong
                                                    </div>
                                                )}
                                                {filteredItems.map((item, idx) => (
                                                    <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={idx} isDragDisabled={!!searchQuery}>
                                                        {(prov2, snap2) => (
                                                            <div ref={prov2.innerRef} {...prov2.draggableProps} {...prov2.dragHandleProps}
                                                                className={`flex flex-col rounded-xl overflow-hidden border shadow-sm transition duration-150 bg-white dark:bg-zinc-900 cursor-grab active:cursor-grabbing
                                                                    ${snap2.isDragging
                                                                        ? 'border-indigo-300 dark:border-indigo-700 shadow-lg rotate-1'
                                                                        : 'border-gray-200/70 dark:border-zinc-800 hover:shadow-md'}`}>

                                                                <div className={`p-3 ${getCategoryStyles(item.kategori_laporan)}`}>
                                                                    <div className="flex justify-between items-start gap-1.5 mb-1.5">
                                                                        <h4 className="font-bold text-gray-950 text-xs leading-snug line-clamp-2 flex-1">{item.judul_laporan}</h4>
                                                                        <span className={`text-[7px] px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ${getUrgencyBadgeStyles(item.urgensi_laporan)}`}>
                                                                            {item.urgensi_laporan}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-700/80 line-clamp-2 leading-relaxed">{item.kondisi_lapangan}</p>
                                                                </div>

                                                                <div className="bg-white dark:bg-zinc-900 px-3 py-2.5 border-t border-gray-100 dark:border-zinc-800/50">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <p className="text-[10px] text-gray-500 dark:text-zinc-500 min-w-0 truncate">
                                                                            <strong className="text-gray-700 dark:text-zinc-300">{item.karyawan?.nama_karyawan?.split(' ')[0] || 'User'}</strong>
                                                                            <span className="ml-1">({item.karyawan?.divisi || '-'})</span>
                                                                        </p>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); router.visit(`/admin/tickets/${item.id}`); }}
                                                                            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200 underline underline-offset-4 cursor-pointer shrink-0"
                                                                        >
                                                                            Detail
                                                                        </button>
                                                                    </div>
                                                                    {item.revision_reason && (
                                                                        <div className="mt-1.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                                                                            <p className="text-[8px] font-bold text-rose-500 dark:text-rose-400 uppercase mb-0.5">⚠ Alasan Revisi</p>
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
        </AuthenticatedLayout>
    );
}
