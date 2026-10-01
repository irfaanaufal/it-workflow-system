import { useState } from 'react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';

export default function FidLinkModal({ isOpen, user, onLogout }) {
    const [fidInput, setFidInput] = useState('');
    const [fidChecking, setFidChecking] = useState(false);
    const [fidError, setFidError] = useState('');
    const [fidKaryawanData, setFidKaryawanData] = useState(null);
    const [fidLinking, setFidLinking] = useState(false);
    const [fidSuccess, setFidSuccess] = useState(false);

    const handleCheckFidModal = async () => {
        if (!fidInput.trim()) { setFidError('FID wajib diisi.'); return; }
        setFidChecking(true); setFidError(''); setFidKaryawanData(null);
        try {
            const res = await axios.get(`/register/check-karyawan/${fidInput.trim()}`);
            if (res.data.success) setFidKaryawanData(res.data.karyawan);
        } catch (err) { setFidError(err.response?.data?.message || 'FID tidak ditemukan.'); }
        finally { setFidChecking(false); }
    };

    const handleLinkFid = async () => {
        setFidLinking(true); setFidError('');
        try {
            await axios.post('/profile/link-fid', { fid: fidInput.trim() });
            setFidSuccess(true);
            setTimeout(() => router.reload(), 800);
        } catch (err) { setFidError(err.response?.data?.message || 'Gagal menghubungkan FID.'); }
        finally { setFidLinking(false); }
    };

    return (
        <Modal show={isOpen} closeable={false} maxWidth="md">
            <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl">
                <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 bg-amber-100 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Hubungkan Akun Karyawan</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5">Masukkan Fingerprint ID (FID) untuk menghubungkan akun.</p>
                </div>

                {!fidKaryawanData ? (
                    <div className="space-y-4">
                        <input type="text" value={fidInput} autoFocus
                            onChange={e => { setFidInput(e.target.value); setFidError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleCheckFidModal()}
                            className="w-full text-center text-lg font-bold tracking-widest border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-amber-500/40 outline-none transition"
                            placeholder="Contoh: 309" />
                        {fidError && <p className="text-sm text-red-600 dark:text-red-400 font-semibold text-center">{fidError}</p>}
                        <button onClick={handleCheckFidModal} disabled={fidChecking}
                            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl text-sm transition hover:opacity-90 disabled:opacity-50 cursor-pointer">
                            {fidChecking ? 'Memeriksa...' : 'Periksa FID'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest">Data Karyawan Ditemukan</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><p className="text-emerald-500/70 dark:text-emerald-400/60 font-semibold text-[10px]">FID</p><p className="font-extrabold text-gray-800 dark:text-zinc-200">#{fidKaryawanData.fid}</p></div>
                                <div><p className="text-emerald-500/70 dark:text-emerald-400/60 font-semibold text-[10px]">Nama</p><p className="font-extrabold text-gray-800 dark:text-zinc-200">{fidKaryawanData.nama_karyawan}</p></div>
                                <div className="col-span-2"><p className="text-emerald-500/70 dark:text-emerald-400/60 font-semibold text-[10px]">Divisi</p><p className="font-bold text-gray-800 dark:text-zinc-200">{fidKaryawanData.divisi}</p></div>
                            </div>
                        </div>
                        {fidError && <p className="text-sm text-red-600 dark:text-red-400 font-semibold text-center">{fidError}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => { setFidKaryawanData(null); setFidInput(''); setFidError(''); }}
                                className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold py-3 rounded-xl text-sm transition cursor-pointer">Ubah FID</button>
                            <button onClick={handleLinkFid} disabled={fidLinking}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-50 cursor-pointer">
                                {fidLinking ? 'Menghubungkan...' : 'Hubungkan FID'}
                            </button>
                        </div>
                    </div>
                )}
                {fidSuccess && (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center">
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-bold">FID berhasil dihubungkan! Memuat ulang...</p>
                    </div>
                )}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800 text-center">
                    <p className="text-xs text-gray-400 dark:text-zinc-600 mb-2">Tidak punya FID? Hubungi HRD.</p>
                    <button onClick={onLogout} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold hover:underline transition cursor-pointer">Logout dari akun ini</button>
                </div>
            </div>
        </Modal>
    );
}
