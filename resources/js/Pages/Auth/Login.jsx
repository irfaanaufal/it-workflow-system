import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Swal from 'sweetalert2';
import { DotRingMark, OrbitCluster } from '@/Components/Auth/OrbitCluster';

export default function Login({ status, canResetPassword, appName = 'IT-SYSTEM' }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);
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

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onSuccess: () => reset('password'),
            onError: (errs) => {
                if (errs.activation_needed) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Akun Belum Diaktifkan',
                        text: errs.activation_needed,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#ffffff',
                        color: '#f5f5f5',
                        background: '#141416',
                    });
                }
                reset('password');
            },
        });
    };

    return (
        <div className="flex min-h-screen w-full bg-gray-50 dark:bg-[#0a0a0b] transition-colors">
            <Head title="Log in">
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
                    {appName}<sup className="ml-0.5 align-super text-[9px]">&reg;</sup>
                </Link>

                <OrbitCluster isDark={isDark} />

                <div className="flex justify-center gap-6 text-[11px] text-gray-400 dark:text-white/30">
                    <Link href="/terms-of-service" className="transition hover:text-gray-600 dark:hover:text-white/60">
                        Terms of Service
                    </Link>
                    <Link href="/privacy-policy" className="transition hover:text-gray-600 dark:hover:text-white/60">
                        Privacy Policy
                    </Link>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex w-full flex-col items-center justify-center px-6 py-16 lg:w-1/2">
                <div className="w-full max-w-[360px]">
                    <div className="mb-8 flex justify-center lg:hidden">
                        <span className="text-[13px] font-semibold tracking-[0.32em] text-gray-700 dark:text-white/90">
                            {appName}<sup className="ml-0.5 align-super text-[9px]">&reg;</sup>
                        </span>
                    </div>

                    <h1
                        className="text-center text-[27px] text-gray-900 dark:text-white"
                        style={{ fontFamily: "'Newsreader', Georgia, serif" }}
                    >
                        Log in
                    </h1>

                    {status && (
                        <div className="mt-6 text-center text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-8 space-y-3">
                        <div>
                            <InputLabel htmlFor="username" value="Email or username" className="sr-only" />
                            <TextInput
                                id="username"
                                type="text"
                                name="username"
                                value={data.username}
                                className="block w-full rounded-xl border border-gray-300 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 shadow-none focus:border-indigo-400 dark:focus:border-white/25 focus:bg-white dark:focus:bg-white/[0.06] focus:ring-1 focus:ring-indigo-400 dark:focus:ring-white/20 transition-colors"
                                autoComplete="username"
                                isFocused={true}
                                placeholder="Email or username"
                                onChange={(e) => setData('username', e.target.value)}
                            />
                            <InputError message={errors.username} className="mt-1.5" />
                            <InputError message={errors.activation_needed} className="mt-1.5" />
                        </div>

                        <div className="relative">
                            <InputLabel htmlFor="password" value="Password" className="sr-only" />
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className="block w-full rounded-xl border border-gray-300 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] px-4 py-3 pr-11 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 shadow-none focus:border-indigo-400 dark:focus:border-white/25 focus:bg-white dark:focus:bg-white/[0.06] focus:ring-1 focus:ring-indigo-400 dark:focus:ring-white/20 transition-colors"
                                autoComplete="current-password"
                                placeholder="Password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/35 transition hover:text-gray-600 dark:hover:text-white/70"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M3 3l18 18M10.6 10.7a2.5 2.5 0 003.5 3.5M9.3 5.5A10.4 10.4 0 0112 5c5 0 9 4 10 7a12.5 12.5 0 01-3.1 4.2M6.2 6.6C4.3 8 2.9 10 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M2 12c1-3 5-7 10-7s9 4 10 7c-1 3-5 7-10 7s-9-4-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>
                            <InputError message={errors.password} className="mt-1.5" />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-white/40">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                Remember me
                            </label>
                        </div>

                        <PrimaryButton
                            className="mt-2 w-full justify-center rounded-full border-0 bg-gray-900 dark:bg-white py-3 text-[13px] font-semibold tracking-wide text-white dark:text-[#0a0a0b] shadow-none hover:bg-gray-800 dark:hover:bg-white/90 focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/30 focus:ring-offset-0 transition-colors"
                            disabled={processing}
                        >
                            Enter
                        </PrimaryButton>
                    </form>

                    <div className="mt-5 flex items-center justify-center gap-3 text-[12px] text-gray-500 dark:text-white/35">
                        <span className="text-gray-300 dark:text-white/20">·</span>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="transition hover:text-gray-700 dark:hover:text-white/60"
                            >
                                Forgot password?
                            </Link>
                        )}
                        <Link
                            href={route('register')}
                            className="transition hover:text-gray-700 dark:hover:text-white/60"
                        >
                            Register
                        </Link>
                    </div>

                    <div className="mt-12 flex justify-center gap-6 text-[11px] text-gray-400 dark:text-white/25 lg:hidden">
                        <Link href="/terms-of-service">Terms of Service</Link>
                        <Link href="/privacy-policy">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}