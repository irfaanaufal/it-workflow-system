import React, { useState, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function Systems({ systems = [] }) {
    const { errors } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Add form state
    const [addName, setAddName] = useState('');
    const [addLink, setAddLink] = useState('');
    const [addError, setAddError] = useState('');
    const [adding, setAdding] = useState(false);

    // Edit form state
    const [editingSystem, setEditingSystem] = useState(null);
    const [editName, setEditName] = useState('');
    const [editLink, setEditLink] = useState('');
    const [editError, setEditError] = useState('');
    const [updating, setUpdating] = useState(false);

    // Filter states (for date filter in layout)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateRangeType, setDateRangeType] = useState('all');
    const [dateRangeLabel, setDateRangeLabel] = useState('Semua Waktu');

    // Trigger modal from AuthenticatedLayout header button
    useEffect(() => {
        const handleOpenModal = () => {
            setAddError('');
            setIsAddModalOpen(true);
        };
        window.addEventListener('open-add-system-modal', handleOpenModal);
        return () => window.removeEventListener('open-add-system-modal', handleOpenModal);
    }, []);

    // Filter systems by search query and date range
    const filteredSystems = useMemo(() => {
        return systems.filter(s => {
            // 1. Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = s.nama_sistem?.toLowerCase().includes(q) || s.link_sistem?.toLowerCase().includes(q);
                if (!match) return false;
            }

            // 2. Date Range
            const sDate = new Date(s.created_at);
            const now = new Date();
            if (dateRangeType === 'this_month') {
                if (sDate.getMonth() !== now.getMonth() || sDate.getFullYear() !== now.getFullYear()) {
                    return false;
                }
            } else if (dateRangeType === 'last_30_days') {
                const limitDate = new Date();
                limitDate.setDate(now.getDate() - 30);
                if (sDate < limitDate) return false;
            } else if (dateRangeType === 'this_year') {
                if (sDate.getFullYear() !== now.getFullYear()) return false;
            } else if (dateRangeType === 'custom') {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (sDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (sDate > end) return false;
                }
            }

            return true;
        });
    }, [systems, searchQuery, startDate, endDate, dateRangeType]);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        setAddError('');
        setAdding(true);

        router.post(route('admin.systems.store'), {
            nama_sistem: addName,
            link_sistem: addLink,
        }, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setAddName('');
                setAddLink('');
            },
            onError: (err) => {
                setAddError(err.nama_sistem || err.link_sistem || err.message || 'Gagal menambahkan sistem.');
            },
            onFinish: () => {
                setAdding(false);
            }
        });
    };

    const openEditModal = (system) => {
        setEditingSystem(system);
        setEditName(system.nama_sistem);
        setEditLink(system.link_sistem || '');
        setEditError('');
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setEditError('');
        setUpdating(true);

        router.patch(route('admin.systems.update', editingSystem.id), {
            nama_sistem: editName,
            link_sistem: editLink,
        }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingSystem(null);
            },
            onError: (err) => {
                setEditError(err.nama_sistem || err.link_sistem || err.message || 'Gagal memperbarui sistem.');
            },
            onFinish: () => {
                setUpdating(false);
            }
        });
    };

    const handleDelete = (system) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus sistem "${system.nama_sistem}"?`)) return;

        router.delete(route('admin.systems.destroy', system.id), {
            onError: (err) => {
                alert(err.message || 'Sistem tidak dapat dihapus karena masih digunakan.');
            }
        });
    };

    return (
        <AuthenticatedLayout
            title="Kelola Sistem"
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
        >
            <Head title="Kelola Sistem PTSAM" />

            <div className="py-6 transition-colors duration-200">
                {/* Systems List */}
                <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden mt-2">
                    {filteredSystems.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 dark:text-zinc-500 text-sm">
                            {searchQuery ? 'Tidak ada sistem yang cocok dengan pencarian Anda.' : 'Belum ada data sistem. Klik "+ Tambah Sistem" di kanan atas untuk memulai.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                                        <th className="px-6 py-4 text-xs font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider w-[80px]">No</th>
                                        <th className="px-6 py-4 text-xs font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Nama Sistem</th>
                                        <th className="px-6 py-4 text-xs font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Link Sistem</th>
                                        <th className="px-6 py-4 text-xs font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/65">
                                    {filteredSystems.map((system, index) => (
                                        <tr key={system.id} className="hover:bg-gray-50/55 dark:hover:bg-zinc-800/30 transition duration-150">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {system.nama_sistem}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {system.link_sistem ? (
                                                    <a
                                                        href={system.link_sistem}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline inline-flex items-center gap-1"
                                                    >
                                                        {system.link_sistem}
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400 dark:text-zinc-650 italic">Tidak ada link</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => openEditModal(system)}
                                                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-500 hover:text-amber-600 transition cursor-pointer"
                                                        title="Ubah Data"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(system)}
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 transition cursor-pointer"
                                                        title="Hapus Data"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add System Modal */}
            <Modal show={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} maxWidth="md">
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-150 dark:border-zinc-800">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Tambah Sistem Baru</h3>
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Nama Sistem</label>
                            <input
                                type="text"
                                value={addName}
                                onChange={e => setAddName(e.target.value)}
                                required
                                placeholder="Contoh: IT Ticketing"
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Link Sistem (Optional)</label>
                            <input
                                type="text"
                                value={addLink}
                                onChange={e => setAddLink(e.target.value)}
                                placeholder="Contoh: https://ticket.ptsam.com"
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none transition"
                            />
                        </div>

                        {addError && (
                            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 pt-1">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {addError}
                            </p>
                        )}

                        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-150 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={adding}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                            >
                                {adding ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit System Modal */}
            <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="md">
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-150 dark:border-zinc-800">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Ubah Data Sistem</h3>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Nama Sistem</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                required
                                placeholder="Contoh: IT Ticketing"
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Link Sistem (Optional)</label>
                            <input
                                type="text"
                                value={editLink}
                                onChange={e => setEditLink(e.target.value)}
                                placeholder="Contoh: https://ticket.ptsam.com"
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none transition"
                            />
                        </div>

                        {editError && (
                            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 pt-1">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {editError}
                            </p>
                        )}

                        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-150 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                            >
                                {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
