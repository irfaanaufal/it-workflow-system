import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * UAT Modal — 3-step flow:
 *  step 1 → "Testing"    : konfirmasi user sudah coba sistem
 *  step 2 → pilih aksi   : "Revisi" atau "Approved"
 *  step 3a → revisi form : isi alasan revisi → submit → kembali ke review
 *  step 3b → approve form: isi feedback → submit → approved & masuk history
 */
export default function UatModal({ isOpen, onClose, ticketId, onApproved, onRevised, initialStep = 1 }) {
    const [step, setStep]           = useState(initialStep); // 1 | 2 | 'revise' | 'approve'
    const [feedback, setFeedback]   = useState('');
    const [reason, setReason]       = useState('');
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep(initialStep);
            setFeedback('');
            setReason('');
            setLoading(false);
            setError('');
        }
    }, [isOpen, initialStep]);

    if (!isOpen) return null;

    const reset = () => {
        setStep(initialStep);
        setFeedback('');
        setReason('');
        setLoading(false);
        setError('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    /* ── Step 3b: Approve ── */
    const handleApprove = async () => {
        if (!feedback.trim()) { setError('Feedback wajib diisi.'); return; }
        setLoading(true);
        setError('');
        try {
            await axios.patch(`/api/tickets/${ticketId}/uat-approve`, { uat_feedback: feedback });
            onApproved(ticketId);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyetujui tiket.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Step 3a: Revisi ── */
    const handleRevise = async () => {
        if (!reason.trim()) { setError('Alasan revisi wajib diisi.'); return; }
        setLoading(true);
        setError('');
        try {
            await axios.patch(`/api/tickets/${ticketId}/uat-revise`, { revision_reason: reason });
            onRevised?.(ticketId);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim revisi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200/60 dark:border-zinc-800">

                {/* ─── HEADER ─── */}
                <div className="px-7 pt-7 pb-5 border-b border-gray-100 dark:border-zinc-800 flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
                            User Acceptance Testing
                        </p>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
                            {step === 1      && 'Uji Hasil Pengerjaan'}
                            {step === 2      && 'Pilih Tindakan'}
                            {step === 'revise'  && 'Kirim Permintaan Revisi'}
                            {step === 'approve' && 'Berikan Feedback'}
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition mt-0.5 cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ─── STEP INDICATOR ─── */}
                <div className="px-7 pt-4 flex items-center gap-2">
                    {[1, 2, 3].map(s => {
                        const active =
                            (s === 1 && step === 1) ||
                            (s === 2 && step === 2) ||
                            (s === 3 && (step === 'revise' || step === 'approve'));
                        const done =
                            (s === 1 && step !== 1) ||
                            (s === 2 && (step === 'revise' || step === 'approve'));
                        return (
                            <React.Fragment key={s}>
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-colors ${
                                    done   ? 'bg-indigo-500 text-white' :
                                    active ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-400' :
                                             'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'
                                }`}>
                                    {done ? (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : s}
                                </div>
                                {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${done ? 'bg-indigo-400' : 'bg-gray-200 dark:bg-zinc-800'}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>
                <div className="px-7 flex justify-between mt-1 mb-1">
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-semibold">Testing</span>
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-semibold">Pilih Aksi</span>
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-semibold">Selesai</span>
                </div>

                {/* ─── BODY ─── */}
                <div className="px-7 py-5">

                    {/* ── Step 1: Konfirmasi Testing ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 flex gap-3">
                                <div className="shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
                                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                                        Tiket ini sudah siap diuji
                                    </p>
                                    <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/70 leading-relaxed">
                                        Tim IT telah menyelesaikan pengerjaan. Silakan uji sistem terlebih dahulu sebelum memberikan keputusan.
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                                Klik tombol <strong className="text-gray-700 dark:text-zinc-200">"Mulai Testing"</strong> untuk melanjutkan ke tahap penilaian.
                            </p>
                        </div>
                    )}

                    {/* ── Step 2: Pilih aksi ── */}
                    {step === 2 && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                                Setelah menguji sistem, pilih salah satu tindakan berikut:
                            </p>

                            {/* Revisi */}
                            <button
                                onClick={() => { setError(''); setStep('revise'); }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/10 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition group cursor-pointer text-left"
                            >
                                <div className="w-10 h-10 shrink-0 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50 transition">
                                    <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Minta Revisi</p>
                                    <p className="text-[11px] text-rose-500/80 dark:text-rose-400/60 mt-0.5">
                                        Ada yang kurang sesuai — tiket dikembalikan ke Review
                                    </p>
                                </div>
                            </button>

                            {/* Approve */}
                            <button
                                onClick={() => { setError(''); setStep('approve'); }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/10 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition group cursor-pointer text-left"
                            >
                                <div className="w-10 h-10 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition">
                                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Approve & Selesai</p>
                                    <p className="text-[11px] text-emerald-500/80 dark:text-emerald-400/60 mt-0.5">
                                        Sistem sudah sesuai — tiket ditutup dan masuk History
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ── Step 3a: Form Revisi ── */}
                    {step === 'revise' && (
                        <div className="space-y-4">
                            <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-3 flex gap-2.5 items-start">
                                <svg className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-relaxed">
                                    Tiket akan dikembalikan ke kolom <strong>Review</strong> agar IT dapat memperbaiki kembali.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2 uppercase tracking-wide">
                                    Alasan Revisi
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={e => { setReason(e.target.value); setError(''); }}
                                    rows={4}
                                    placeholder="Jelaskan apa yang perlu diperbaiki oleh tim IT..."
                                    className="w-full text-sm bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 outline-none resize-none transition"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Step 3b: Form Approve ── */}
                    {step === 'approve' && (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3 flex gap-2.5 items-start">
                                <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                    Tiket akan ditutup dan dipindahkan ke <strong>History</strong>. Berikan feedback agar tim IT tahu hasilnya.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2 uppercase tracking-wide">
                                    Feedback / Testimoni
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={e => { setFeedback(e.target.value); setError(''); }}
                                    rows={4}
                                    placeholder="Tuliskan testimoni atau kesan setelah sistem diperbaiki..."
                                    className="w-full text-sm bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 outline-none resize-none transition"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>
                    )}
                </div>

                {/* ─── FOOTER / ACTIONS ─── */}
                <div className="px-7 pb-7 flex items-center justify-between gap-3">

                    {/* Back button (step 2 onwards) */}
                    {step !== 1 ? (
                        <button
                            onClick={() => { setError(''); setStep(step === 2 ? 1 : 2); }}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition cursor-pointer disabled:opacity-40"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Kembali
                        </button>
                    ) : (
                        <span />
                    )}

                    {/* Primary action */}
                    <div className="flex gap-2.5">
                        {step === 1 && (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="text-xs font-bold text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 px-4 py-2.5 rounded-xl transition cursor-pointer"
                                >
                                    Nanti
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2"
                                >
                                    Mulai Testing
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {step === 'revise' && (
                            <button
                                onClick={handleRevise}
                                disabled={loading}
                                className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
                            >
                                {loading ? (
                                    <><Spinner /> Mengirim...</>
                                ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Kirim Revisi</>
                                )}
                            </button>
                        )}

                        {step === 'approve' && (
                            <button
                                onClick={handleApprove}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
                            >
                                {loading ? (
                                    <><Spinner /> Menyimpan...</>
                                ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Approve & Selesai</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}
