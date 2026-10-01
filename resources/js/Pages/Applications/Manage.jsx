import React, { useState, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { alertSuccess, alertError } from '@/Utils/alert';
import TextInput from '@/Components/TextInput';
import DataTable from '@/Components/DataTable';
import MobilePagination from '@/Components/MobilePagination';

export default function Manage({ applications = [] }) {
    const { errors } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Add form states
    const [addName, setAddName] = useState('');
    const [addSlug, setAddSlug] = useState('');
    const [addDesc, setAddDesc] = useState('');
    const [addError, setAddError] = useState('');
    const [adding, setAdding] = useState(false);

    // Edit form states
    const [editingApp, setEditingApp] = useState(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editError, setEditError] = useState('');
    const [updating, setUpdating] = useState(false);

    // Delete states
    const [deletingApp, setDeletingApp] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [mobilePage, setMobilePage] = useState(1);
    const mobilePerPage = 8;

    // Listen to custom event from header to open modal
    useEffect(() => {
        const handleOpenModal = () => {
            setAddError('');
            setIsAddModalOpen(true);
        };
        window.addEventListener('open-add-application-modal', handleOpenModal);
        return () => window.removeEventListener('open-add-application-modal', handleOpenModal);
    }, []);

    // Filtered Applications list
    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return app.name?.toLowerCase().includes(q) ||
                app.slug?.toLowerCase().includes(q) ||
                app.description?.toLowerCase().includes(q);
        });
    }, [applications, searchQuery]);

    // Reset mobile page on search change
    useEffect(() => {
        setMobilePage(1);
    }, [searchQuery]);

    // Mobile pagination
    const mobileTotalPages = Math.ceil(filteredApps.length / mobilePerPage);
    const mobileStart = (mobilePage - 1) * mobilePerPage;
    const mobileApps = filteredApps.slice(mobileStart, mobileStart + mobilePerPage);

    // Helpers to generate slug
    const generateSlug = (text) => {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    };

    const handleAddNameChange = (e) => {
        setAddName(e.target.value);
    };

    const handleEditNameChange = (e) => {
        setEditName(e.target.value);
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        setAddError('');
        setAdding(true);

        router.post(route('admin.applications.store'), {
            name: addName,
            slug: addSlug,
            description: addDesc,
        }, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setAddName('');
                setAddSlug('');
                setAddDesc('');
                alertSuccess('Aplikasi berhasil ditambahkan.');
            },
            onError: (err) => {
                setAddError(err.name || err.slug || err.description || err.message || 'Gagal menambahkan aplikasi.');
            },
            onFinish: () => {
                setAdding(false);
            }
        });
    };

    const handleEditClick = (app) => {
        setEditingApp(app);
        setEditName(app.name);
        setEditSlug(app.slug);
        setEditDesc(app.description || '');
        setEditError('');
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setEditError('');
        setUpdating(true);

        router.patch(route('admin.applications.update', editingApp.id), {
            name: editName,
            slug: editSlug,
            description: editDesc,
        }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingApp(null);
                alertSuccess('Aplikasi berhasil diperbarui.');
            },
            onError: (err) => {
                setEditError(err.name || err.slug || err.description || err.message || 'Gagal memperbarui aplikasi.');
            },
            onFinish: () => {
                setUpdating(false);
            }
        });
    };

    const handleDeleteClick = (app) => {
        setDeletingApp(app);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteSubmit = (e) => {
        e.preventDefault();
        setDeleting(true);

        router.delete(route('admin.applications.destroy', deletingApp.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeletingApp(null);
                alertSuccess('Aplikasi berhasil dihapus.');
            },
            onError: (err) => alertError(err.message || 'Gagal menghapus aplikasi.'),
            onFinish: () => {
                setDeleting(false);
            }
        });
    };

    return (
        <AuthenticatedLayout
            title="Kelola Aplikasi"
            subtitle="Manajemen data aplikasi"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Kelola Aplikasi" />

            <div className="flex-1 flex flex-col min-h-0 pb-1">
                {/* Mobile: Card list */}
                <div className="md:hidden space-y-3 pb-20">
                    {mobileApps.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">
                            Belum ada data aplikasi.
                        </div>
                    ) : mobileApps.map(app => (
                        <div key={app.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm">
                            {/* Nama */}
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{app.name}</p>

                            {/* Slug */}
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">slug: {app.slug}</p>

                            {/* Deskripsi */}
                            {app.description && (
                                <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3">{app.description}</p>
                            )}

                            {/* Action buttons */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                <button
                                    onClick={() => handleEditClick(app)}
                                    title="Edit"
                                    className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(app)}
                                    title="Hapus"
                                    className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    <MobilePagination currentPage={mobilePage} totalPages={mobileTotalPages} onPageChange={setMobilePage} />
                </div>

                {/* Desktop: DataTable — TIDAK DIUBAH */}
                <div className="hidden md:block bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-auto flex-1 flex flex-col min-h-0">
                    <DataTable
                        data={filteredApps}
                        columns={[
                            { key: 'no', label: 'No', className: 'w-12', render: (_, i) => i + 1 },
                            { key: 'name', label: 'Nama Aplikasi', className: 'min-w-0', tdClassName: 'font-bold text-sm truncate dark:text-zinc-300' },
                            { key: 'slug', label: 'Slug', className: 'min-w-0', tdClassName: 'font-semibold text-indigo-600 dark:text-indigo-400 text-sm truncate' },
                            { key: 'description', label: 'Deskripsi', className: 'min-w-0', render: (row) => (
                                <span className="text-sm text-gray-600 dark:text-zinc-400 truncate block">{row.description || '-'}</span>
                            )},
                            {
                                key: 'aksi',
                                label: 'Aksi',
                                className: 'whitespace-nowrap',
                                tdClassName: 'text-right',
                                render: (row) => (
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => handleEditClick(row)}
                                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-500 hover:text-amber-600 transition cursor-pointer"
                                            title="Ubah Data"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(row)}
                                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 transition cursor-pointer"
                                            title="Hapus Data"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )
                            },
                        ]}
                        emptyState={
                            <div className="py-16 text-center text-gray-400 dark:text-zinc-500 text-sm">
                                Belum ada data aplikasi. Klik "+ Tambah Aplikasi" untuk memulai.
                            </div>
                        }
                    />
                </div>
            </div>

            {/* Tambah Aplikasi Modal */}
            <Modal show={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} maxWidth="md">
                <div className="p-6 md:p-8 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200 dark:border-zinc-800">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Tambah Aplikasi Baru</h3>
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
                            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Nama Aplikasi</label>
                            <input
                                type="text"
                                value={addName}
                                onChange={handleAddNameChange}
                                required
                                placeholder="E.g. IT Workflow"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Slug</label>
                            <input
                                type="text"
                                value={addSlug}
                                onChange={(e) => setAddSlug(e.target.value)}
                                required
                                placeholder="https://example.com"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Deskripsi</label>
                            <textarea
                                value={addDesc}
                                onChange={(e) => setAddDesc(e.target.value)}
                                rows="3"
                                placeholder="Jelaskan kegunaan aplikasi ini..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all resize-none"
                            />
                        </div>

                        {addError && (
                            <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1.5 pt-1">
                                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                            >
                                {adding ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Aplikasi Modal */}
            <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="md">
                <div className="p-6 md:p-8 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200 dark:border-zinc-800">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Ubah Data Aplikasi</h3>
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
                            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Nama Aplikasi</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={handleEditNameChange}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Slug</label>
                            <input
                                type="text"
                                value={editSlug}
                                readOnly
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 dark:bg-zinc-900 dark:border-zinc-700 rounded-xl text-sm text-gray-400 dark:text-zinc-500 cursor-not-allowed select-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Deskripsi</label>
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                rows="3"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all resize-none"
                            />
                        </div>

                        {editError && (
                            <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1.5 pt-1">
                                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                            >
                                {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Konfirmasi Hapus Modal */}
            <Modal show={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} maxWidth="sm">
                <div className="p-6 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800">
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-rose-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-950 dark:text-white">Hapus Aplikasi</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Apakah Anda yakin ingin menghapus aplikasi <strong>{deletingApp?.name}</strong>? Tindakan ini juga akan menghapus seluruh data permintaan akses terkait.
                        </p>
                    </div>

                    <form onSubmit={handleDeleteSubmit} className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={deleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition cursor-pointer"
                        >
                            {deleting ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
