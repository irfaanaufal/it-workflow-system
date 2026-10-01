import { useState } from 'react';
import axios from 'axios';
import { alertError } from '@/Utils/alert';
import { CONTENT_FIELDS } from './constants';

export default function ContentCards({ ticket, isAdmin, onUpdate }) {
    const [newTask, setNewTask] = useState('');
    const [adding, setAdding] = useState(false);

    const checklists = ticket.checklists || [];
    const completedCount = checklists.filter(c => c.is_completed).length;

    const handleAddTask = async () => {
        if (!newTask.trim()) return;
        setAdding(true);
        try {
            await axios.post('/api/checklists', {
                ticket_id: ticket.id,
                task_name: newTask.trim(),
            });
            setNewTask('');
            onUpdate?.();
        } catch (err) {
            alertError(err.response?.data?.message || 'Gagal menambah sub-task.');
        } finally {
            setAdding(false);
        }
    };

    const handleToggleComplete = async (id) => {
        try {
            await axios.patch(`/api/checklists/${id}/toggle-complete`);
            onUpdate?.();
        } catch {
            alertError('Gagal mengubah status.');
        }
    };

    const handleToggleApprove = async (id) => {
        try {
            await axios.patch(`/api/checklists/${id}/toggle-approve`);
            onUpdate?.();
        } catch {
            alertError('Gagal mengubah status.');
        }
    };

    const showChecklistSection = isAdmin || checklists.length > 0;

    return (
        <div className="space-y-3 mb-6">
            {CONTENT_FIELDS.map(f => (
                <div key={f.key} className="bg-gray-50/80 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{f.label}</p>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{ticket[f.key] || '—'}</p>
                </div>
            ))}

            {/* Sistem Terkait */}
            {(ticket.system_ptsam || ticket.link_sistem) && (
                <div className="bg-gray-50/80 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3">
                        <p className="text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Sistem Terkait</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                                {ticket.system_ptsam?.nama_sistem || 'Sistem Baru (New System)'}
                            </span>
                            {(ticket.system_ptsam?.link_sistem || ticket.link_sistem) && (
                                <a
                                    href={ticket.system_ptsam?.link_sistem || ticket.link_sistem}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 underline inline-flex items-center gap-0.5"
                                >
                                    Buka Sistem
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Tasks */}
            {showChecklistSection && (
                <div className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Sub-Task</p>
                        {checklists.length > 0 && (
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                {completedCount}/{checklists.length} selesai
                            </span>
                        )}
                    </div>

                    {checklists.length > 0 && (
                        <div className="h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mb-2 overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${(completedCount / checklists.length) * 100}%` }} />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        {checklists.map(cl => (
                            <div key={cl.id} className="flex items-center gap-2.5 group">
                                {isAdmin ? (
                                    <button
                                        onClick={() => handleToggleComplete(cl.id)}
                                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border text-[9px] font-black cursor-pointer transition
                                            ${cl.is_completed
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 hover:border-emerald-400 dark:hover:border-emerald-600'}`}
                                    >
                                        {cl.is_completed ? '✓' : ''}
                                    </button>
                                ) : (
                                    <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border text-[9px] font-black
                                        ${cl.is_completed ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                                            : cl.is_approved ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                                            : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'}`}>
                                        {cl.is_completed ? '✓' : cl.is_approved ? '•' : ''}
                                    </span>
                                )}
                                <span className={`text-xs flex-1 ${cl.is_completed ? 'line-through text-gray-400 dark:text-zinc-500' : 'text-gray-700 dark:text-zinc-300 font-semibold'}`}>
                                    {cl.task_name}
                                </span>
                                {isAdmin && !cl.is_completed && (
                                    <button
                                        onClick={() => handleToggleApprove(cl.id)}
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition
                                            ${cl.is_approved
                                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-500'}`}
                                        title={cl.is_approved ? 'Batal approve' : 'Approve'}
                                    >
                                        {cl.is_approved ? 'Approved' : 'Approve'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Input tambah sub-task (IT Staff only) */}
                    {isAdmin && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                            <input
                                type="text"
                                value={newTask}
                                onChange={e => setNewTask(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                                placeholder="Tambah sub-tugas..."
                                className="flex-1 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-700 dark:text-zinc-300 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400"
                                disabled={adding}
                            />
                            <button
                                onClick={handleAddTask}
                                disabled={adding || !newTask.trim()}
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {adding ? '…' : '+'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
