import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import LightPullThemeSwitcher from '@/Components/LightPullThemeSwitcher';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        fid: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        }
        return 'light';
    });

    const [step, setStep] = useState(1);
    const [karyawanData, setKaryawanData] = useState(null);
    const [checkError, setCheckError] = useState('');
    const [checking, setChecking] = useState(false);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        setTheme(nextTheme);
    };

    const handleCheckFid = async (e) => {
        e.preventDefault();
        if (!data.fid) {
            setCheckError('Fingerprint ID (FID) wajib diisi.');
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

    const handleSkipFid = () => {
        setKaryawanData(null);
        setCheckError('');
        setData((prevData) => ({
            ...prevData,
            fid: '',
            name: '',
        }));
        setStep(2);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // Animation variants for staggering children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200 selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
            <Head title="Register" />

            {/* Dark Mode Pull Switcher */}
            <div className="fixed top-0 right-10 z-50">
                <LightPullThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
            </div>

            {/* Left Panel: Form */}
            <div className="relative flex w-full flex-col items-center justify-start md:justify-center bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors duration-200 overflow-hidden min-h-screen md:min-h-0">
                {/* On mobile, we show the Top Wave Banner with Topography Shape */}
                <div className="relative w-full h-[220px] sm:h-[260px] md:hidden bg-gradient-to-tr from-amber-400 to-orange-500 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 overflow-hidden flex items-center justify-center">
                    {/* Topography map lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20 stroke-white/40 dark:stroke-zinc-800/40 pointer-events-none" fill="none" strokeWidth="1.5">
                        <path d="M -50 150 Q 100 100 250 170 T 550 120" />
                        <path d="M -50 120 Q 100 70 250 140 T 550 90" />
                        <path d="M -50 90 Q 100 40 250 110 T 550 60" />
                        <path d="M -50 60 Q 100 10 250 80 T 550 30" />
                        <path d="M -50 180 Q 100 130 250 200 T 550 150" />
                        <path d="M -50 210 Q 100 160 250 230 T 550 180" />
                    </svg>

                    {/* Wavy bottom divider transition into the form */}
                    <svg viewBox="0 0 800 120" fill="none" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[40px] translate-y-[1px] pointer-events-none text-white dark:text-zinc-900 transition-colors duration-200">
                        <path d="M0,60 C240,120 560,0 800,60 L800,120 L0,120 Z" fill="currentColor" />
                    </svg>

                    {/* Logo inside the wave banner on mobile */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="h-14 w-14 rounded-2xl bg-white/95 dark:bg-zinc-800/95 border border-white/20 dark:border-zinc-700/50 shadow-lg flex items-center justify-center backdrop-blur-sm">
                            <ApplicationLogo className="h-9 w-9 object-contain" />
                        </div>
                        <span className="text-[10px] bg-white/20 dark:bg-white/5 text-white font-extrabold uppercase py-1 px-3 rounded-full tracking-[0.2em] backdrop-blur-sm border border-white/10">
                            FID Attendance
                        </span>
                    </div>
                </div>

                {/* Decorative background grid pattern for mobile only */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none md:hidden" />

                {/* Ambient glow lights for mobile only */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-amber-400/10 dark:bg-amber-400/5 blur-[80px] pointer-events-none md:hidden" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-zinc-400/15 dark:bg-zinc-400/5 blur-[80px] pointer-events-none md:hidden" />

                <div className="relative z-10 w-full max-w-md p-6 sm:p-10 md:p-0">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-6"
                    >
                        {/* Logo - hidden on mobile, shown on desktop */}
                        <motion.div variants={itemVariants} className="mb-1 hidden md:flex justify-start">
                            <Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 shadow-sm transition hover:scale-105">
                                <ApplicationLogo className="h-8 w-8 object-contain" />
                            </Link>
                        </motion.div>

                        {/* Title and Description */}
                        <motion.div variants={itemVariants} className="text-left space-y-1.5">
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Buat Akun Baru</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Daftar sebagai host rapat untuk mulai menggunakan sistem.</p>
                        </motion.div>

                        {step === 1 ? (
                            <form onSubmit={handleCheckFid} className="space-y-5">
                                <motion.div variants={itemVariants}>
                                    <InputLabel htmlFor="fid" value="Fingerprint ID (FID) Karyawan" />
                                    <TextInput
                                        id="fid"
                                        name="fid"
                                        value={data.fid}
                                        className="mt-1.5 block w-full text-center text-lg font-bold tracking-widest bg-zinc-50 dark:bg-zinc-950 focus:scale-[1.01] transition-all"
                                        onChange={(e) => setData('fid', e.target.value)}
                                        placeholder="Contoh: 309"
                                        autoFocus
                                        required
                                    />
                                    {checkError && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5">
                                            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {checkError}
                                        </p>
                                    )}
                                </motion.div>

                                <motion.div variants={itemVariants} className="pt-2 space-y-3">
                                    <PrimaryButton className="w-full py-3.5 text-xs font-bold uppercase tracking-widest shadow-md" disabled={checking}>
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

                                    <button
                                        type="button"
                                        onClick={handleSkipFid}
                                        className="w-full py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-xl transition-all duration-200"
                                    >
                                        Daftar Tanpa FID
                                    </button>
                                </motion.div>
                            </form>
                        ) : (
                            <form onSubmit={submit} className="space-y-4">
                                {/* Employee Info Card - only shown when karyawan data is found */}
                                {karyawanData ? (
                                    <motion.div
                                        variants={itemVariants}
                                        className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-3"
                                    >
                                        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-2">
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest">
                                                Data Karyawan Terdeteksi
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="text-[10px] text-red-500 hover:text-red-650 dark:text-red-400 font-extrabold hover:underline uppercase tracking-wider"
                                            >
                                                Ubah FID
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <span className="block text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5">FID</span>
                                                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">#{karyawanData.fid}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5">Nama Karyawan</span>
                                                <span className="font-extrabold text-zinc-800 dark:text-zinc-300">{karyawanData.nama_karyawan}</span>
                                            </div>
                                            <div className="col-span-3 mt-1">
                                                <span className="block text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5">Divisi</span>
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                    {karyawanData.divisi}
                                                </span>
                                            </div>
                                        </div>
                                        <InputError message={errors.fid} className="mt-1.5" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        variants={itemVariants}
                                        className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-1"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-blue-700 dark:text-blue-300 font-bold">
                                                Mendaftar tanpa FID Karyawan
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="text-[10px] text-blue-600 hover:text-blue-800 dark:text-blue-400 font-extrabold hover:underline uppercase tracking-wider"
                                            >
                                                Input FID
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60">
                                            Akun Anda tidak akan terhubung dengan data karyawan. Anda dapat menghubungkannya nanti melalui halaman profil.
                                        </p>
                                    </motion.div>
                                )}

                                {/* Nama Lengkap */}
                                <motion.div variants={itemVariants}>
                                    <InputLabel htmlFor="name" value="Nama Lengkap" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className={`mt-1.5 block w-full ${karyawanData ? 'bg-zinc-100 dark:bg-zinc-800/40' : ''}`}
                                        autoComplete="name"
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nama lengkap"
                                        required
                                        readOnly={!!karyawanData}
                                    />
                                    <InputError message={errors.name} className="mt-1.5" />
                                </motion.div>

                                {/* Username */}
                                <motion.div variants={itemVariants}>
                                    <InputLabel htmlFor="username" value="Username" />
                                    <TextInput
                                        id="username"
                                        name="username"
                                        value={data.username}
                                        className="mt-1.5 block w-full"
                                        autoComplete="username"
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="contoh: john_doe"
                                        required
                                        autoFocus
                                    />
                                    <InputError message={errors.username} className="mt-1.5" />
                                </motion.div>

                                {/* Email */}
                                <motion.div variants={itemVariants}>
                                    <InputLabel htmlFor="email" value="Alamat Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1.5 block w-full"
                                        autoComplete="email"
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="nama@perusahaan.com"
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-1.5" />
                                </motion.div>

                                {/* Password */}
                                <motion.div variants={itemVariants}>
                                    <InputLabel htmlFor="password" value="Password" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1.5 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Min. 8 karakter"
                                        required
                                    />
                                    <InputError message={errors.password} className="mt-1.5" />
                                </motion.div>

                                {/* Konfirmasi Password */}
                                <motion.div variants={itemVariants}>
                                    <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-1.5 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Ulangi password"
                                        required
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                                </motion.div>

                                {/* Submit Button */}
                                <motion.div variants={itemVariants} className="pt-2">
                                    <PrimaryButton className="w-full py-3.5 text-xs font-bold uppercase tracking-widest shadow-md" disabled={processing}>
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
                                </motion.div>
                            </form>
                        )}

                        {/* Login Account Link */}
                        <motion.p
                            variants={itemVariants}
                            className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-2"
                        >
                            Sudah memiliki akun?{' '}
                            <Link
                                href={route('login')}
                                className="font-bold text-zinc-900 dark:text-white hover:underline underline-offset-2 transition"
                            >
                                Masuk di sini
                            </Link>
                        </motion.p>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel: Image */}
            <div className="relative hidden w-1/2 md:block overflow-hidden">
                <img
                    src="/images/login_bg.png"
                    alt="Modern meeting room workspace background"
                    className="h-full w-full object-cover select-none pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />

                {/* Visual quote overlay for premium aesthetics */}
                <div className="absolute bottom-12 left-12 right-12 text-white space-y-3 pointer-events-none">
                    <p className="text-xl font-bold tracking-tight leading-relaxed">
                        "Kolaborasi tim yang solid berawal dari sistem yang teratur dan transparan."
                    </p>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                        FID Attendance System v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}
