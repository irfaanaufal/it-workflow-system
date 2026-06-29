import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        fid: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [step, setStep] = useState(1);
    const [karyawanData, setKaryawanData] = useState(null);
    const [checkError, setCheckError] = useState('');
    const [checking, setChecking] = useState(false);

    const handleCheckFid = async (e) => {
        e.preventDefault();

        // FID is mandatory — block submission entirely if empty.
        if (!data.fid.trim()) {
            setCheckError('Fingerprint ID (FID) wajib diisi. Anda tidak dapat mendaftar tanpa FID.');
            return;
        }

        setChecking(true);
        setCheckError('');
        setKaryawanData(null);

        try {
            const response = await fetch(route('register.check-karyawan', data.fid));
            const result = await response.json();

            if (!response.ok) {
                setCheckError(result.message || 'Terjadi kesalahan saat memeriksa FID.');
                setChecking(false);
                return;
            }

            if (result.success) {
                setKaryawanData(result.karyawan);
                setData((prevData) => ({
                    ...prevData,
                    name: result.karyawan.nama_karyawan,
                }));
                setStep(2);
            }
        } catch (error) {
            setCheckError('Gagal menghubungkan ke server. Coba lagi.');
        } finally {
            setChecking(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setKaryawanData(null);
        setCheckError('');
        setData((prevData) => ({
            ...prevData,
            fid: '',
            name: '',
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 16, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto py-10 px-4">
            <Head title="Register" />

            {/* Full-bleed background image */}
            <div className="fixed inset-0 -z-10">
                <img
                    src="/images/login_bg.png"
                    alt=""
                    className="h-full w-full object-cover select-none pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
            </div>

            {/* Glass card */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 sm:p-10 shadow-2xl backdrop-blur-xl"
            >
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                    <Link
                        href="/"
                        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm transition hover:scale-105"
                    >
                        <ApplicationLogo className="h-8 w-8 object-contain" />
                    </Link>
                </div>

                {/* Title */}
                <div className="mb-7 text-center space-y-1.5">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Buat Akun Baru</h1>
                    <p className="text-sm text-white/60 font-medium">
                        Daftar sebagai host rapat untuk mulai menggunakan sistem.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form
                            key="step1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.25 }}
                            onSubmit={handleCheckFid}
                            className="space-y-5"
                        >
                            <div>
                                <InputLabel htmlFor="fid" value="Fingerprint ID (FID) Karyawan" className="text-white/80" />
                                <TextInput
                                    id="fid"
                                    name="fid"
                                    value={data.fid}
                                    className="mt-1.5 block w-full text-center text-lg font-bold tracking-widest rounded-xl border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:ring-white/30 focus:scale-[1.01] transition-all"
                                    onChange={(e) => setData('fid', e.target.value)}
                                    placeholder="Contoh: 309"
                                    autoFocus
                                    required
                                />
                                <p className="mt-2 text-[11px] text-white/45">
                                    FID wajib diisi. Pendaftaran tanpa FID tidak diperbolehkan.
                                </p>
                                {checkError && (
                                    <p className="mt-2 text-sm text-red-300 font-semibold flex items-center gap-1.5">
                                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {checkError}
                                    </p>
                                )}
                                <InputError message={errors.fid} className="mt-1.5" />
                            </div>

                            <PrimaryButton
                                className="w-full justify-center py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl shadow-md bg-white text-zinc-900 hover:bg-white/90 focus:ring-white/40"
                                disabled={checking}
                            >
                                {checking ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Memeriksa...
                                    </>
                                ) : (
                                    'Periksa FID Karyawan'
                                )}
                            </PrimaryButton>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.25 }}
                            onSubmit={submit}
                            className="space-y-4"
                        >
                            {/* Employee info card */}
                            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                    <span className="text-[10px] text-white/45 font-extrabold uppercase tracking-widest">
                                        Data Karyawan Terdeteksi
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="text-[10px] text-red-300 hover:text-red-200 font-extrabold hover:underline uppercase tracking-wider"
                                    >
                                        Ubah FID
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <span className="block text-white/40 font-semibold mb-0.5">FID</span>
                                        <span className="font-extrabold text-white">#{karyawanData?.fid}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-white/40 font-semibold mb-0.5">Nama Karyawan</span>
                                        <span className="font-extrabold text-white">{karyawanData?.nama_karyawan}</span>
                                    </div>
                                    <div className="col-span-3 mt-1">
                                        <span className="block text-white/40 font-semibold mb-0.5">Divisi</span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-400/20 text-amber-200">
                                            {karyawanData?.divisi}
                                        </span>
                                    </div>
                                </div>
                                <InputError message={errors.fid} className="mt-1.5" />
                            </div>

                            {/* Nama Lengkap */}
                            <div>
                                <InputLabel htmlFor="name" value="Nama Lengkap" className="text-white/80" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1.5 block w-full rounded-xl border-white/20 bg-white/5 text-white placeholder-white/40 focus:border-white/40 focus:ring-white/30"
                                    autoComplete="name"
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Nama lengkap"
                                    required
                                    readOnly
                                />
                                <InputError message={errors.name} className="mt-1.5" />
                            </div>

                            {/* Username */}
                            <div>
                                <InputLabel htmlFor="username" value="Username" className="text-white/80" />
                                <TextInput
                                    id="username"
                                    name="username"
                                    value={data.username}
                                    className="mt-1.5 block w-full rounded-xl border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:ring-white/30"
                                    autoComplete="username"
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="contoh: john_doe"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.username} className="mt-1.5" />
                            </div>

                            {/* Email */}
                            <div>
                                <InputLabel htmlFor="email" value="Alamat Email" className="text-white/80" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1.5 block w-full rounded-xl border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:ring-white/30"
                                    autoComplete="email"
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@perusahaan.com"
                                    required
                                />
                                <InputError message={errors.email} className="mt-1.5" />
                            </div>

                            {/* Password */}
                            <div>
                                <InputLabel htmlFor="password" value="Password" className="text-white/80" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1.5 block w-full rounded-xl border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:ring-white/30"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Min. 8 karakter"
                                    required
                                />
                                <InputError message={errors.password} className="mt-1.5" />
                            </div>

                            {/* Konfirmasi Password */}
                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="text-white/80" />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="mt-1.5 block w-full rounded-xl border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:ring-white/30"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi password"
                                    required
                                />
                                <InputError message={errors.password_confirmation} className="mt-1.5" />
                            </div>

                            <PrimaryButton
                                className="w-full justify-center py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl shadow-md bg-white text-zinc-900 hover:bg-white/90 focus:ring-white/40"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Mendaftarkan...
                                    </>
                                ) : (
                                    'Daftar Akun Baru'
                                )}
                            </PrimaryButton>
                        </motion.form>
                    )}
                </AnimatePresence>

                <p className="text-center text-sm text-white/55 mt-6">
                    Sudah memiliki akun?{' '}
                    <Link href={route('login')} className="font-bold text-white hover:underline underline-offset-2 transition">
                        Masuk di sini
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}