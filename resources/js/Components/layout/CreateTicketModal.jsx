import { useState, useEffect } from 'react';
import axios from 'axios';
import { alertSuccess, alertError } from '@/Utils/alert';
import Select from 'react-select';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import { CATEGORY, SYSTEM_CATEGORIES, BLOCKER_CATEGORIES } from '@/Components/ticket/constants';

export default function CreateTicketModal({ isOpen, onClose, user }) {
    const [judul, setJudul] = useState('');
    const [kategori, setKategori] = useState(CATEGORY.NEW_SYSTEM);
    const [urgensi, setUrgensi] = useState('low');
    const [kondisi, setKondisi] = useState('');
    const [keinginan, setKeinginan] = useState('');
    const [dampak, setDampak] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [attachmentName, setAttachmentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [systemId, setSystemId] = useState(null);
    const [systems, setSystems] = useState([]);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const todayDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    useEffect(() => {
        if (isOpen) {
            axios.get('/api/systems')
                .then(res => setSystems(res.data))
                .catch(() => {});
        } else {
            setSystemId(null);
        }
    }, [isOpen]);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) { setAttachment(f); setAttachmentName(f.name); }
    };

    const handleCreateTicket = (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData();
        fd.append('judul_laporan', judul); fd.append('kategori_laporan', kategori);
        fd.append('urgensi_laporan', urgensi); fd.append('kondisi_lapangan', kondisi);
        fd.append('keinginan_sistem', keinginan); fd.append('dampak_positif', dampak);
        if (SYSTEM_CATEGORIES.includes(kategori) && systemId) {
            fd.append('system_ptsam_id', systemId.value);
        }
        if (attachment) fd.append('attachment', attachment);

        axios.post('/api/tickets', fd)
            .then(() => {
                alertSuccess('Laporan berhasil dikirim.');
                setLoading(false); onClose();
                setJudul(''); setKategori(CATEGORY.NEW_SYSTEM); setUrgensi('low');
                setKondisi(''); setKeinginan(''); setDampak('');
                setAttachment(null); setAttachmentName('');
                setSystemId(null);
                window.dispatchEvent(new Event('ticket-created'));
            })
            .catch(err => {
                setLoading(false);
                const errs = err.response?.data?.errors;
                alertError(errs ? Object.values(errs).flat().join('\n') : err.response?.data?.message || 'Gagal mengirim tiket.');
            });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="p-6 md:p-8 max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 rounded-2xl">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Buat Laporan Baru</h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition cursor-pointer">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Nama Pelapor', val: user.name },
                            { label: 'Tanggal', val: todayDate },
                            { label: 'Divisi', val: user.karyawan?.divisi || '-' }
                        ].map(f => (
                            <div key={f.label}>
                                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-wider mb-1.5">{f.label}</label>
                                <input type="text" value={f.val} disabled className="w-full text-sm border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-500 rounded-xl py-2.5 px-4 cursor-not-allowed" />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Judul Laporan</label>
                            <input type="text" value={judul} onChange={e => setJudul(e.target.value)} required placeholder="Ketik judul..."
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Kategori</label>
                            <select value={kategori} onChange={e => { const v = e.target.value; setKategori(v); if (urgensi === 'blocker' && !BLOCKER_CATEGORIES.includes(v)) setUrgensi('high'); }}
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 outline-none transition">
                                <option value="new system">New System</option>
                                <option value="add feature">Add Feature</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="fix bug">Fix Bug</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Urgensi</label>
                            <select value={urgensi} onChange={e => setUrgensi(e.target.value)}
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 outline-none transition">
                                {BLOCKER_CATEGORIES.includes(kategori) && <option value="blocker">Blocker</option>}
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            {!BLOCKER_CATEGORIES.includes(kategori) && <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1">Blocker hanya untuk Fix Bug / Maintenance.</p>}
                        </div>
                    </div>
                    {SYSTEM_CATEGORIES.includes(kategori) && (
                        <div className="animate-fadeIn">
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Sistem yang Dilaporkan</label>
                            <Select
                                value={systemId}
                                onChange={(option) => setSystemId(option)}
                                options={systems.map(sys => ({ value: sys.id, label: sys.nama_sistem }))}
                                placeholder="-- Pilih Sistem --"
                                isClearable
                                isSearchable
                                className="text-sm"
                                classNamePrefix="react-select"
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
                                        backgroundColor: isDark ? '#18181b' : '#fff',
                                        color: isDark ? '#fff' : '#111827',
                                        borderRadius: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        minHeight: '2.625rem',
                                        boxShadow: state.isFocused ? '0 0 0 2px rgba(99,102,241,0.2)' : 'none',
                                        '&:hover': { borderColor: '#6366f1' }
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: isDark ? '#18181b' : '#fff',
                                        border: '1px solid ' + (isDark ? '#27272a' : '#e5e7eb'),
                                        borderRadius: '0.75rem',
                                        overflow: 'hidden'
                                    }),
                                    option: (base, { isFocused, isSelected }) => ({
                                        ...base,
                                        backgroundColor: isSelected ? '#6366f1' : isFocused ? (isDark ? '#27272a' : '#f3f4f6') : 'transparent',
                                        color: isSelected ? '#fff' : (isDark ? '#e4e4e7' : '#374151'),
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer'
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: isDark ? '#fff' : '#111827'
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: isDark ? '#71717a' : '#9ca3af'
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        color: isDark ? '#fff' : '#111827'
                                    }),
                                    indicatorSeparator: () => ({ display: 'none' }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        color: isDark ? '#71717a' : '#9ca3af'
                                    }),
                                    clearIndicator: (base) => ({
                                        ...base,
                                        color: isDark ? '#71717a' : '#9ca3af'
                                    }),
                                    noOptionsMessage: (base) => ({
                                        ...base,
                                        color: isDark ? '#71717a' : '#9ca3af'
                                    })
                                }}
                            />
                        </div>
                    )}
                    {[
                        { label: 'Kondisi di lapangan saat ini?', val: kondisi, set: setKondisi, ph: 'Ketik kondisi...' },
                        { label: 'Apa yang Anda ingin sistem lakukan?', val: keinginan, set: setKeinginan, ph: 'Ketik keinginan sistem...' },
                        { label: 'Dampak positif jika fitur ini selesai?', val: dampak, set: setDampak, ph: 'Ketik dampak positif...' },
                    ].map(f => (
                        <div key={f.label}>
                            <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">{f.label}</label>
                            <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={2} required placeholder={f.ph}
                                className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500/40 outline-none resize-none transition" />
                        </div>
                    ))}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-100 dark:border-zinc-800 gap-3">
                        <div className="flex items-center gap-3">
                            <label className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition">
                                Pilih File
                                <input type="file" onChange={handleFileChange} accept="image/png,image/jpeg,image/jpg,application/pdf" className="hidden" />
                            </label>
                            <span className="text-xs text-gray-400 dark:text-zinc-600 truncate max-w-[160px]">{attachmentName || 'Tidak ada file'}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={onClose}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold py-2.5 px-5 rounded-xl text-xs transition cursor-pointer">Batal</button>
                            <button type="submit" disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-60">
                                {loading ? 'Mengirim...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
