import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { alertSuccess, alertError, alertConfirm } from '@/Utils/alert';
import { formatDateShort, isDeadlineOverdue, todayLocalDate } from '@/Utils/ticketHelpers';
import { STATUS_CONFIG, STATUS_COLORS, BLOCKER_CATEGORIES, SYSTEM_CATEGORIES, STATUS_TRANSITIONS, STATUS, CATEGORY } from './constants';
import Icon from './Icon';
import SidebarSection from './SidebarSection';

export default function StatusSidebar({ ticket, ticketId, canManageStatus, canTake, onUpdate }) {
    const it = ticket.admin_it;

    const [statusOpen, setStatusOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [classCategory, setClassCategory] = useState(ticket.kategori_laporan || '');
    const [classUrgency, setClassUrgency] = useState(ticket.urgensi_laporan || '');
    const [classSystemId, setClassSystemId] = useState(ticket.system_ptsam_id || '');
    const [systems, setSystems] = useState([]);
    const [savingClass, setSavingClass] = useState(false);
    const [classError, setClassError] = useState('');

    const [classDeadline, setClassDeadline] = useState(ticket.deadline || '');
    const [savingDeadline, setSavingDeadline] = useState(false);
    const [deadlineError, setDeadlineError] = useState('');

    const [systemLink, setSystemLink] = useState(ticket.link_sistem || '');
    const [savingLink, setSavingLink] = useState(false);
    const [linkError, setLinkError] = useState('');

    const [reporterCandidates, setReporterCandidates] = useState([]);
    const [selectedReporterId, setSelectedReporterId] = useState(ticket.karyawan_id || '');
    const [savingReporter, setSavingReporter] = useState(false);
    const [reporterError, setReporterError] = useState('');
    const fetchedCandidatesRef = useRef(false);

    const showUbahPelapor = canManageStatus && ticket?.status === STATUS.TESTING;
    const showLinkSistem = canManageStatus && ticket?.kategori_laporan === CATEGORY.NEW_SYSTEM && ticket?.status !== STATUS.APPROVED;

    useEffect(() => {
        axios.get('/api/systems')
            .then(res => setSystems(res.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (canManageStatus && ticket?.status === STATUS.TESTING && !fetchedCandidatesRef.current) {
            fetchedCandidatesRef.current = true;
            axios.get(`/api/tickets/${ticketId}/reporter-candidates`)
                .then(res => setReporterCandidates(res.data || []))
                .catch(() => {});
        }
    }, [ticket?.status, canManageStatus]);

    useEffect(() => {
        setClassCategory(ticket.kategori_laporan || '');
        setClassUrgency(ticket.urgensi_laporan || '');
        setClassSystemId(ticket.system_ptsam_id || '');
        setClassDeadline(ticket.deadline || '');
        setSystemLink(ticket.link_sistem || '');
        setSelectedReporterId(ticket.karyawan_id || '');
    }, [ticket]);

    const handleTakeTicket = async () => {
        let deadline = null;
        const confirmed = await alertConfirm('Ambil Tiket?', '', {
            html: `
                <div class="text-left">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Target Penyelesaian</label>
                    <input type="date" id="swal-deadline" class="w-full border border-gray-300 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500" min="${todayLocalDate()}" />
                    <p class="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">Kosongkan jika belum ditentukan</p>
                </div>
            `,
            confirmButtonText: 'Ya, Ambil',
            preConfirm: () => {
                deadline = document.getElementById('swal-deadline')?.value || null;
            }
        });
        if (confirmed) {
            setUpdatingStatus(true);
            const payload = deadline ? { deadline } : {};
            axios.post(`/api/tickets/${ticketId}/take`, payload)
                .then(() => { onUpdate(); alertSuccess('Tiket berhasil diambil.'); })
                .catch(err => alertError(err.response?.data?.message || 'Gagal mengambil tiket.'))
                .finally(() => setUpdatingStatus(false));
        }
    };

    const handleReturnToInbox = async () => {
        const confirmed = await alertConfirm('Kembalikan ke Inbox?', 'Tiket akan dikembalikan ke antrian inbox.', {
            icon: 'warning',
            confirmButtonText: 'Ya, Kembalikan',
        });
        if (confirmed) {
            axios.post(`/api/tickets/${ticketId}/return-to-inbox`)
                .then(() => { onUpdate(); alertSuccess('Tiket dikembalikan ke inbox.'); })
                .catch(err => alertError(err.response?.data?.message || 'Gagal mengembalikan tiket.'));
        }
    };

    const handleStatusChange = (newStatus) => {
        setUpdatingStatus(true);
        axios.patch(`/api/tickets/${ticketId}/status`, { status: newStatus })
            .then(() => { onUpdate(); alertSuccess('Status berhasil diperbarui.'); })
            .catch(err => alertError(err.response?.data?.message || 'Gagal memperbarui status.'))
            .finally(() => setUpdatingStatus(false));
    };

    const handleClassCategoryChange = (val) => {
        setClassCategory(val);
        if (classUrgency === 'blocker' && !BLOCKER_CATEGORIES.includes(val)) {
            setClassUrgency('high');
        }
        if (!SYSTEM_CATEGORIES.includes(val)) {
            setClassSystemId('');
        }
    };

    const handleSaveClassification = () => {
        setSavingClass(true);
        setClassError('');
        axios.patch(`/api/tickets/${ticketId}/classification`, {
            kategori_laporan: classCategory,
            urgensi_laporan: classUrgency,
            system_ptsam_id: SYSTEM_CATEGORIES.includes(classCategory) ? classSystemId : null,
        })
            .then(() => { onUpdate(); alertSuccess('Klasifikasi tersimpan.'); })
            .catch(err => {
                const errors = err.response?.data?.errors;
                setClassError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan klasifikasi.'));
            })
            .finally(() => setSavingClass(false));
    };

    const handleSaveDeadline = () => {
        setSavingDeadline(true);
        setDeadlineError('');
        axios.patch(`/api/tickets/${ticketId}/deadline`, { deadline: classDeadline || null })
            .then(() => { onUpdate(); alertSuccess('Deadline tersimpan.'); })
            .catch(err => {
                const errors = err.response?.data?.errors;
                setDeadlineError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan target penyelesaian.'));
            })
            .finally(() => setSavingDeadline(false));
    };

    const handleClearDeadline = () => {
        setSavingDeadline(true);
        setDeadlineError('');
        axios.patch(`/api/tickets/${ticketId}/deadline`, { deadline: null })
            .then(() => { onUpdate(); alertSuccess('Deadline dihapus.'); })
            .catch(err => setDeadlineError(err.response?.data?.message || 'Gagal menghapus target penyelesaian.'))
            .finally(() => setSavingDeadline(false));
    };

    const handleSaveReporter = () => {
        if (!selectedReporterId) { setReporterError('Pilih pelapor baru terlebih dahulu.'); return; }
        setSavingReporter(true);
        setReporterError('');
        axios.patch(`/api/tickets/${ticketId}/reporter`, { karyawan_id: selectedReporterId })
            .then(() => { onUpdate(); alertSuccess('Pelapor berhasil diubah.'); })
            .catch(err => {
                const errors = err.response?.data?.errors;
                setReporterError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal mengubah pelapor.'));
            })
            .finally(() => setSavingReporter(false));
    };

    const handleSaveSystemLink = () => {
        setSavingLink(true);
        setLinkError('');
        axios.patch(`/api/tickets/${ticketId}/system-link`, { link_sistem: systemLink || null })
            .then(() => { onUpdate(); alertSuccess('Link sistem tersimpan.'); })
            .catch(err => {
                const errors = err.response?.data?.errors;
                setLinkError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan link sistem.'));
            })
            .finally(() => setSavingLink(false));
    };

    const handleClearSystemLink = () => {
        setSavingLink(true);
        setLinkError('');
        axios.patch(`/api/tickets/${ticketId}/system-link`, { link_sistem: null })
            .then(() => { onUpdate(); alertSuccess('Link sistem dihapus.'); })
            .catch(err => setLinkError(err.response?.data?.message || 'Gagal menghapus link sistem.'))
            .finally(() => setSavingLink(false));
    };

    return (
        <div className="p-5 space-y-4">
            {/* Deadline Display */}
            {ticket.deadline && (
                <SidebarSection title="Target Selesai">
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${isDeadlineOverdue(ticket.deadline, ticket.status)
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
                        : 'bg-gray-50 dark:bg-zinc-950 border-gray-100 dark:border-zinc-800'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDeadlineOverdue(ticket.deadline, ticket.status)
                            ? 'bg-rose-100 dark:bg-rose-950/30'
                            : 'bg-gray-100 dark:bg-zinc-800'}`}>
                            <Icon name="clock" className={`w-4 h-4 ${isDeadlineOverdue(ticket.deadline, ticket.status)
                                ? 'text-rose-500'
                                : 'text-gray-400 dark:text-zinc-500'}`} />
                        </div>
                        <span className={`text-xs font-bold ${isDeadlineOverdue(ticket.deadline, ticket.status)
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-gray-700 dark:text-zinc-300'}`}>
                            {formatDateShort(ticket.deadline)}
                        </span>
                    </div>
                </SidebarSection>
            )}

            <hr className="border-gray-100 dark:border-zinc-800" />

            {/* Links */}
            <div className="space-y-2">
                {ticket.attachment_url && (
                    <a href={ticket.attachment_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Lampiran
                    </a>
                )}
            </div>

            {/* Take / Return button for IT */}
            {canTake && !it && ticket.status === STATUS.INBOX && (
                <>
                    <hr className="border-gray-100 dark:border-zinc-800" />
                    <button onClick={handleTakeTicket} disabled={updatingStatus}
                        className="w-full bg-[#7a7a7a] dark:bg-zinc-600 hover:bg-gray-700 dark:hover:bg-zinc-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50">
                        {updatingStatus ? '...' : 'Ambil Tiket'}
                    </button>
                </>
            )}

            {ticket.status === STATUS.REVIEW && canTake && it && (
                <>
                    <hr className="border-gray-100 dark:border-zinc-800" />
                    <button onClick={handleReturnToInbox} disabled={updatingStatus}
                        className="w-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50 border border-amber-200/60 dark:border-amber-900/50">
                        Kembalikan ke Inbox
                    </button>
                </>
            )}

            {/* IT Action Forms */}
            {canManageStatus && it && (
                <>
                    <hr className="border-gray-100 dark:border-zinc-800" />

                    {/* Status Controls */}
                    <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Status</label>
                        <div className="relative">
                            <button type="button" onClick={() => setStatusOpen(prev => !prev)} disabled={updatingStatus}
                                className="w-full text-xs font-bold border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500/40 outline-none transition cursor-pointer disabled:opacity-50 flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[ticket.status] || 'bg-gray-400'}`} />
                                    {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                                </span>
                                <Icon name="chevronDown" className={`w-3.5 h-3.5 shrink-0 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {statusOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setStatusOpen(false)} />
                                    <div className="absolute z-40 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
                                        {(STATUS_TRANSITIONS[ticket.status] || []).map(s => (
                                            <button key={s} type="button"
                                                onClick={() => { setStatusOpen(false); handleStatusChange(s); }}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition">
                                                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />
                                                {STATUS_CONFIG[s].label}
                                                {ticket.status === s && (
                                                    <span className="ml-auto text-[9px] font-extrabold text-indigo-500 uppercase">Aktif</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Klasifikasi */}
                    <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Kategori</label>
                        <select value={classCategory} onChange={(e) => handleClassCategoryChange(e.target.value)}
                            disabled={ticket.status === STATUS.APPROVED || savingClass}
                            className="w-full text-xs font-bold border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500/40 outline-none transition cursor-pointer disabled:opacity-50">
                            <option value="new system">New System</option>
                            <option value="add feature">Add Feature</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="fix bug">Fix Bug</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Urgensi</label>
                        <select value={classUrgency} onChange={(e) => setClassUrgency(e.target.value)}
                            disabled={ticket.status === STATUS.APPROVED || savingClass}
                            className="w-full text-xs font-bold border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500/40 outline-none transition cursor-pointer disabled:opacity-50">
                            {BLOCKER_CATEGORIES.includes(classCategory) && <option value="blocker">Blocker</option>}
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    {SYSTEM_CATEGORIES.includes(classCategory) && (
                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Sistem</label>
                            <select value={classSystemId} onChange={(e) => setClassSystemId(e.target.value)}
                                disabled={ticket.status === STATUS.APPROVED || savingClass}
                                className="w-full text-xs font-bold border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500/40 outline-none transition cursor-pointer disabled:opacity-50">
                                <option value="">-- Pilih --</option>
                                {systems.map(sys => (
                                    <option key={sys.id} value={sys.id}>{sys.nama_sistem}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {classError && <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">{classError}</p>}

                    <button onClick={handleSaveClassification} disabled={ticket.status === 'approved' || savingClass}
                        className="w-full bg-[#0070f3] dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-400 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50">
                        {savingClass ? 'Menyimpan...' : 'Simpan Klasifikasi'}
                    </button>

                    {/* Deadline */}
                    <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Target Selesai</label>
                        <input type="date" value={classDeadline} min={todayLocalDate()}
                            onChange={(e) => setClassDeadline(e.target.value)}
                            disabled={ticket.status === STATUS.APPROVED || savingDeadline}
                            className="w-full text-xs font-bold border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500/40 outline-none transition cursor-pointer disabled:opacity-50" />
                    </div>
                    {deadlineError && <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">{deadlineError}</p>}
                    <div className="flex gap-2">
                        <button onClick={handleSaveDeadline} disabled={ticket.status === 'approved' || savingDeadline}
                            className="flex-1 bg-[#0070f3] dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-400 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50">
                            {savingDeadline ? '...' : 'Simpan'}
                        </button>
                        {ticket.deadline && (
                            <button onClick={handleClearDeadline} disabled={ticket.status === 'approved' || savingDeadline}
                                className="bg-rose-500 dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50">
                                Hapus
                            </button>
                        )}
                    </div>

                    {/* Link Sistem */}
                    {showLinkSistem && (
                        <>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Link Sistem</label>
                                <input type="url" value={systemLink}
                                    onChange={(e) => { setSystemLink(e.target.value); setLinkError(''); }}
                                    placeholder="https://..." disabled={savingLink}
                                    className="w-full text-xs font-bold border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500/40 outline-none transition disabled:opacity-50" />
                            </div>
                            {linkError && <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">{linkError}</p>}
                            <div className="flex gap-2">
                                <button onClick={handleSaveSystemLink} disabled={savingLink}
                                    className="flex-1 bg-[#0070f3] dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-400 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50">
                                    {savingLink ? '...' : 'Simpan Link'}
                                </button>
                                {ticket.link_sistem && (
                                    <button onClick={handleClearSystemLink} disabled={savingLink}
                                        className="bg-rose-500 dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50">
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* Ubah Pelapor */}
                    {showUbahPelapor && (
                        <>
                            <div>
                                <label className="block text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Ganti Pelapor</label>
                                <select value={selectedReporterId}
                                    onChange={(e) => { setSelectedReporterId(e.target.value); setReporterError(''); }}
                                    disabled={savingReporter}
                                    className="w-full text-xs font-bold border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500/40 outline-none transition cursor-pointer disabled:opacity-50">
                                    <option value="">-- Pilih --</option>
                                    {reporterCandidates.map(k => (
                                        <option key={k.id} value={k.id}>{k.nama_karyawan}{k.divisi ? ` — ${k.divisi}` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            {reporterError && <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">{reporterError}</p>}
                            <button onClick={handleSaveReporter} disabled={savingReporter}
                                className="w-full bg-[#0070f3] dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-400 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50">
                                {savingReporter ? 'Menyimpan...' : 'Simpan Pelapor'}
                            </button>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
