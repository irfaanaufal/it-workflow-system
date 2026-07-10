import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { DotRingMark, OrbitCluster } from '@/Components/Auth/OrbitCluster';

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
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return true;
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const inputClass = isDark
        ? 'block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 shadow-none focus:border-white/25 focus:bg-white/[0.06] focus:ring-1 focus:ring-white/20'
        : 'block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-none focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-400 transition-colors';

    const handleCheckFid = async (e) => {
        e.preventDefault();

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
                    fid: result.karyawan.fid,
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

    return (
        <div className="flex min-h-screen w-full bg-gray-50 dark:bg-[#0a0a0b] transition-colors">
            <Head title="Register">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* Dark/Light Mode Toggle */}
            <button
                onClick={() => setIsDark(!isDark)}
                className="fixed top-4 right-4 z-50 p-1 text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80 transition"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDark ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                )}
            </button>

            {/* Visual panel */}
            <div className="relative hidden w-1/2 flex-col justify-between border-r border-gray-200 dark:border-white/[0.06] p-10 lg:flex transition-colors">
                <Link href="/" className="text-[13px] font-semibold tracking-[0.32em] text-gray-700 dark:text-white/90">
                    IT-SYSTEM<sup className="ml-0.5 align-super text-[9px]">&reg;</sup>
                </Link>

                <OrbitCluster isDark={isDark} />

                <div className="relative z-20 flex justify-center gap-6 text-[11px] text-gray-400 dark:text-white/30">
                    <a href="https://heyzine.com/flip-book/a93274951b.html" target="_blank" rel="noopener noreferrer" className="transition hover:text-gray-600 dark:hover:text-white/60">
                        Manual Book
                    </a>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex w-full flex-col items-center justify-center px-6 py-16 lg:w-1/2">
                <div className="w-full max-w-[380px]">
                    <div className="mb-8 flex justify-center lg:hidden">
                        <span className="text-[13px] font-semibold tracking-[0.32em] text-gray-700 dark:text-white/90">
                            IT-SYSTEM<sup className="ml-0.5 align-super text-[9px]">&reg;</sup>
                        </span>
                    </div>

                    <h1
                        className="text-center text-[27px] text-gray-900 dark:text-white"
                        style={{ fontFamily: "'Newsreader', Georgia, serif" }}
                    >
                        Buat akun
                    </h1>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.25 }}
                                onSubmit={handleCheckFid}
                                className="mt-8 space-y-3"
                            >
                                <div>
                                    <InputLabel htmlFor="fid" value="Fingerprint ID (FID) Karyawan" className="sr-only" />
                                    <TextInput
                                        id="fid"
                                        name="fid"
                                        value={data.fid}
                                        className={`${inputClass} text-center text-lg font-semibold tracking-widest`}
                                        onChange={(e) => setData('fid', e.target.value)}
                                        placeholder="Fingerprint ID — contoh: 309"
                                        autoFocus
                                        required
                                    />
                                    <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-white/30">
                                        FID wajib diisi. Pendaftaran tanpa FID tidak diperbolehkan.
                                    </p>
                                    {checkError && (
                                        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[12px] font-medium text-red-600 dark:text-red-300">
                                            <svg className="h-3.5 w-3.5 shrink-0 fill-current" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            {checkError}
                                        </p>
                                    )}
                                    <InputError message={errors.fid} className="mt-1.5 text-center" />
                                </div>

                                <PrimaryButton
                                    className="mt-2 w-full justify-center rounded-full border-0 bg-gray-900 dark:bg-white py-3 text-[13px] font-semibold tracking-wide text-white dark:text-[#0a0a0b] shadow-none hover:bg-gray-800 dark:hover:bg-white/90 focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/30 focus:ring-offset-0 transition-colors"
                                    disabled={checking}
                                >
                                    {checking ? (
                                        <>
                                            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                                className="mt-8 space-y-3"
                            >
                                {/* Employee info card */}
                                <div className="space-y-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-4 transition-colors">
                                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] pb-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-white/35">
                                            Data Karyawan Terdeteksi
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-300/80 hover:text-red-700 dark:hover:text-red-300 hover:underline"
                                        >
                                            Ubah FID
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <span className="mb-0.5 block font-medium text-gray-500 dark:text-white/35">FID</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">#{karyawanData?.fid}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="mb-0.5 block font-medium text-gray-500 dark:text-white/35">Nama Karyawan</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{karyawanData?.nama_karyawan}</span>
                                        </div>
                                        <div className="col-span-3 mt-1">
                                            <span className="mb-0.5 block font-medium text-gray-500 dark:text-white/35">Divisi</span>
                                            <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-gray-700 dark:text-white/80">
                                                {karyawanData?.divisi}
                                            </span>
                                        </div>
                                    </div>
                                    <InputError message={errors.fid} className="mt-1.5" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="name" value="Nama Lengkap" className="sr-only" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className={`${inputClass} opacity-60`}
                                        autoComplete="name"
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nama lengkap"
                                        required
                                        readOnly
                                    />
                                    <InputError message={errors.name} className="mt-1.5" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="username" value="Username" className="sr-only" />
                                    <TextInput
                                        id="username"
                                        name="username"
                                        value={data.username}
                                        className={inputClass}
                                        autoComplete="username"
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="Username"
                                        required
                                        autoFocus
                                    />
                                    <InputError message={errors.username} className="mt-1.5" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Alamat Email" className="sr-only" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className={inputClass}
                                        autoComplete="email"
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="example@gmail.com"
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-1.5" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value="Password" className="sr-only" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className={inputClass}
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Password — min. 8 karakter"
                                        required
                                    />
                                    <InputError message={errors.password} className="mt-1.5" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="sr-only" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className={inputClass}
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password"
                                        required
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                                </div>

                                <PrimaryButton
                                    className="mt-2 w-full justify-center rounded-full border-0 bg-gray-900 dark:bg-white py-3 text-[13px] font-semibold tracking-wide text-white dark:text-[#0a0a0b] shadow-none hover:bg-gray-800 dark:hover:bg-white/90 focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/30 focus:ring-offset-0 transition-colors"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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

                    <div className="mt-5 flex items-center justify-center gap-3 text-[12px] text-gray-500 dark:text-white/35">
                        <Link
                            href={route('login')}
                            className="transition hover:text-gray-700 dark:hover:text-white/60"
                        >
                            Sudah punya akun? Masuk
                        </Link>
                    </div>

                    <div className="relative z-20 mt-12 flex justify-center gap-6 text-[11px] text-gray-400 dark:text-white/25 lg:hidden">
                        <a href="https://heyzine.com/flip-book/a93274951b.html" target="_blank" rel="noopener noreferrer">Manual Book</a>
                    </div>
                </div>
            </div>
        </div>
    );
}