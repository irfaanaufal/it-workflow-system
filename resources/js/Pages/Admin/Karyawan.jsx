import React, { useState, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { alertSuccess } from '@/Utils/alert';
import Modal from '@/Components/Modal';
import DataTable from '@/Components/DataTable';
import MobilePagination from '@/Components/MobilePagination';

export default function Karyawan({ karyawans = [], flash = {} }) {
    const { errors } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Add form state
    const [addFid, setAddFid] = useState('');
    const [addNama, setAddNama] = useState('');
    const [addDivisi, setAddDivisi] = useState('');
    const [addJabatan, setAddJabatan] = useState('');
    const [addError, setAddError] = useState('');
    const [adding, setAdding] = useState(false);

    // Edit form state
    const [editingKaryawan, setEditingKaryawan] = useState(null);
    const [editNama, setEditNama] = useState('');
    const [editDivisi, setEditDivisi] = useState('');
    const [editJabatan, setEditJabatan] = useState('');
    const [editStatus, setEditStatus] = useState('Active');
    const [editError, setEditError] = useState('');
    const [updating, setUpdating] = useState(false);

    // Filter states
    const [filterDivisi, setFilterDivisi] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [mobilePage, setMobilePage] = useState(1);
    const mobilePerPage = 8;

    // Unique divisi from data
    const uniqueDivisi = useMemo(() => {
        const divisis = karyawans.map(k => k.divisi).filter(Boolean);
        return [...new Set(divisis)].sort();
    }, [karyawans]);

    // Flash messages
    const [showFlash, setShowFlash] = useState(false);
    const [flashMsg, setFlashMsg] = useState({ type: '', message: '' });

    useEffect(() => {
        if (flash.success) {
            setFlashMsg({ type: 'success', message: flash.success });
            setShowFlash(true);
            setTimeout(() => setShowFlash(false), 3000);
        } else if (flash.error) {
            setFlashMsg({ type: 'error', message: flash.error });
            setShowFlash(true);
            setTimeout(() => setShowFlash(false), 4000);
        }
    }, [flash]);

    // Trigger add modal from layout header button
    useEffect(() => {
        const handleOpenModal = () => {
            setAddFid('');
            setAddNama('');
            setAddDivisi('');
            setAddJabatan('');
            setAddError('');
            setIsAddModalOpen(true);
        };
        window.addEventListener('open-add-karyawan-modal', handleOpenModal);
        return () => window.removeEventListener('open-add-karyawan-modal', handleOpenModal);
    }, []);

    // Filter karyawans
    const filteredKaryawans = useMemo(() => {
        return karyawans.filter(k => {
            // Search query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = (
                    k.fid?.toLowerCase().includes(q) ||
                    k.nama_karyawan?.toLowerCase().includes(q) ||
                    k.divisi?.toLowerCase().includes(q) ||
                    k.jabatan?.toLowerCase().includes(q)
                );
                if (!match) return false;
            }
            // Divisi filter
            if (filterDivisi !== 'all') {
                if (k.divisi !== filterDivisi) return false;
            }
            // Status filter
            if (filterStatus !== 'all') {
                const kStatus = k.status || 'Active';
                if (kStatus !== filterStatus) return false;
            }
            return true;
        });
    }, [karyawans, searchQuery, filterDivisi, filterStatus]);

    // Reset mobile page on filter/search changes
    useEffect(() => {
        setMobilePage(1);
    }, [searchQuery, filterDivisi, filterStatus]);

    // Mobile pagination
    const mobileTotalPages = Math.ceil(filteredKaryawans.length / mobilePerPage);
    const mobileStart = (mobilePage - 1) * mobilePerPage;
    const mobileKaryawans = filteredKaryawans.slice(mobileStart, mobileStart + mobilePerPage);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        setAddError('');
        setAdding(true);

        router.post(route('admin.karyawan.store'), {
            fid: addFid,
            nama_karyawan: addNama,
            divisi: addDivisi,
            jabatan: addJabatan,
        }, {
            onSuccess: () => {
                alertSuccess('Karyawan berhasil ditambahkan.');
                setIsAddModalOpen(false);
                setAddFid('');
                setAddNama('');
                setAddDivisi('');
                setAddJabatan('');
            },
            onError: (err) => {
                setAddError(err.fid || err.nama_karyawan || err.message || 'Gagal menambahkan karyawan.');
            },
            onFinish: () => setAdding(false)
        });
    };

    const openEditModal = (karyawan) => {
        setEditingKaryawan(karyawan);
        setEditNama(karyawan.nama_karyawan);
        setEditDivisi(karyawan.divisi || '');
        setEditJabatan(karyawan.jabatan || '');
        setEditStatus(karyawan.status || 'Active');
        setEditError('');
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setEditError('');
        setUpdating(true);

        router.patch(route('admin.karyawan.update', editingKaryawan.fid), {
            nama_karyawan: editNama,
            divisi: editDivisi,
            jabatan: editJabatan,
            status: editStatus,
        }, {
            onSuccess: () => {
                alertSuccess('Karyawan berhasil diperbarui.');
                setIsEditModalOpen(false);
                setEditingKaryawan(null);
            },
            onError: (err) => {
                setEditError(err.nama_karyawan || err.status || err.message || 'Gagal memperbarui karyawan.');
            },
            onFinish: () => setUpdating(false)
        });
    };

    const inputClass = "w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none transition";

    return (
        <AuthenticatedLayout
            title="Kelola Karyawan"
            subtitle="Data dan manajemen karyawan"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterDivisi={filterDivisi}
            setFilterDivisi={setFilterDivisi}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            divisiOptions={uniqueDivisi}
        >
            <Head title="Kelola Karyawan" />

            {/* Flash Messages */}
            {showFlash && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 ${flashMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                    {flashMsg.message}
                </div>
            )}

            <div className="flex-1 flex flex-col min-h-0 pb-1">
                {/* Mobile: Card list */}
                <div className="md:hidden space-y-3 pb-20">
                    {mobileKaryawans.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">
                            {searchQuery ? 'Tidak ada karyawan yang cocok dengan pencarian Anda.' : 'Belum ada data karyawan.'}
                        </div>
                    ) : mobileKaryawans.map(k => {
                        const isActive = (k.status || 'Active') === 'Active';
                        return (
                            <div key={k.fid} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
                                {/* Header: Nama + Status */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{k.nama_karyawan}</p>
                                        <span className="inline-block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md mt-1">{k.fid}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
                                        {k.status || 'Active'}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="space-y-1 mb-3">
                                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                                        <span className="font-semibold text-gray-700 dark:text-zinc-300">Divisi:</span> {k.divisi || '-'}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                                        <span className="font-semibold text-gray-700 dark:text-zinc-300">Jabatan:</span> {k.jabatan || '-'}
                                    </p>
                                </div>

                                {/* Edit button */}
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                    <button
                                        onClick={() => openEditModal(k)}
                                        title="Edit"
                                        className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <MobilePagination currentPage={mobilePage} totalPages={mobileTotalPages} onPageChange={setMobilePage} />
                </div>

                {/* Desktop: DataTable — TIDAK DIUBAH */}
                <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-auto flex-1 flex flex-col min-h-0">
                    <DataTable
                        data={filteredKaryawans}
                        keyField="fid"
                        columns={[
                            { key: 'no', label: 'No', className: 'w-12', render: (_, i) => i + 1 },
                            {
                                key: 'fid',
                                label: 'FID',
                                className: 'whitespace-nowrap',
                                render: (row) => (
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">{row.fid}</span>
                                )
                            },
                            { key: 'nama_karyawan', label: 'Nama Karyawan', className: 'min-w-0', tdClassName: 'font-bold text-sm truncate dark:text-zinc-300' },
                            { key: 'divisi', label: 'Divisi', className: 'min-w-0', render: (row) => <span className="text-sm text-gray-600 dark:text-zinc-400 truncate block">{row.divisi || '-'}</span> },
                            { key: 'jabatan', label: 'Jabatan', className: 'min-w-0', render: (row) => <span className="text-sm text-gray-600 dark:text-zinc-400 truncate block">{row.jabatan || '-'}</span> },
                            {
                                key: 'status',
                                label: 'Status',
                                className: 'whitespace-nowrap',
                                render: (row) => {
                                    const isActive = (row.status || 'Active') === 'Active';
                                    return (
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
                                            {row.status || 'Active'}
                                        </span>
                                    );
                                }
                            },
                            {
                                key: 'aksi',
                                label: 'Aksi',
                                className: 'whitespace-nowrap',
                                tdClassName: 'text-right',
                                render: (row) => (
                                    <div className="flex items-center justify-end">
                                        <button
                                            onClick={() => openEditModal(row)}
                                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-500 dark:text-amber-400 hover:text-amber-600 transition cursor-pointer"
                                            title="Ubah Data"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                    </div>
                                )
                            },
                        ]}
                        emptyState={
                            <div className="py-16 text-center text-gray-400 dark:text-zinc-500 text-sm">
                                {searchQuery ? 'Tidak ada karyawan yang cocok dengan pencarian Anda.' : 'Belum ada data karyawan. Klik "+ Tambah Karyawan" di kanan atas untuk memulai.'}
                            </div>
                        }
                    />
                </div>
            </div>

            {/* Add Karyawan Modal */}
            <Modal show={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} maxWidth="md">
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200 dark:border-zinc-800">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Tambah Karyawan Baru</h3>
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
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Fingerprint ID (FID) *</label>
                            <input
                                type="text"
                                value={addFid}
                                onChange={e => setAddFid(e.target.value)}
                                required
                                placeholder="Contoh: 10234"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Nama Karyawan *</label>
                            <input
                                type="text"
                                value={addNama}
                                onChange={e => setAddNama(e.target.value)}
                                required
                                placeholder="Nama lengkap karyawan"
                                className={inputClass}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Divisi</label>
                                <input
                                    type="text"
                                    value={addDivisi}
                                    onChange={e => setAddDivisi(e.target.value)}
                                    placeholder="Contoh: IT"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Jabatan</label>
                                <input
                                    type="text"
                                    value={addJabatan}
                                    onChange={e => setAddJabatan(e.target.value)}
                                    placeholder="Contoh: Staff"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {addError && (
                            <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1.5 pt-1">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {addError}
                            </p>
                        )}

                        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
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

            {/* Edit Karyawan Modal */}
            <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="md">
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200 dark:border-zinc-800">
                        <div>
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Ubah Data Karyawan</h3>
                            {editingKaryawan && (
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">FID: {editingKaryawan.fid}</p>
                            )}
                        </div>
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
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Nama Karyawan *</label>
                            <input
                                type="text"
                                value={editNama}
                                onChange={e => setEditNama(e.target.value)}
                                required
                                className={inputClass}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Divisi</label>
                                <input
                                    type="text"
                                    value={editDivisi}
                                    onChange={e => setEditDivisi(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Jabatan</label>
                                <input
                                    type="text"
                                    value={editJabatan}
                                    onChange={e => setEditJabatan(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Status *</label>
                            <select
                                value={editStatus}
                                onChange={e => setEditStatus(e.target.value)}
                                className={inputClass}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        {editError && (
                            <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1.5 pt-1">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {editError}
                            </p>
                        )}

                        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
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
