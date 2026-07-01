import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, asset_url }) {
    return (
        <>
            <Head title="Selamat Datang" />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950 flex flex-col">
                <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <img src={`${asset_url}images/logo.png`} alt="Logo" className="h-10 w-10" />
                        <div className="leading-tight">
                            <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">SINDANGASIH</p>
                            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-widest uppercase">MAKMUR</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
                                >
                                    Daftar
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                <main className="flex-1 flex items-center justify-center px-6 py-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="flex justify-center mb-8">
                            <img src={`${asset_url}images/logo.png`} alt="Logo" className="h-24 w-24" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                            IT Workflow System
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 font-semibold mb-8 max-w-xl mx-auto">
                            Sistem Informasi Manajemen Workflow Teknologi Informasi
                            <br />
                            <span className="text-indigo-600 dark:text-indigo-400">PT Sindangasih Makmur</span>
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {!auth.user && (
                                <>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-lg shadow-indigo-200 dark:shadow-indigo-950"
                                    >
                                        Daftar Akun
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center px-8 py-3.5 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 font-bold rounded-2xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition shadow-sm"
                                    >
                                        Masuk
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </main>

                <footer className="py-8 text-center">
                    <p className="text-xs font-semibold text-gray-400 dark:text-zinc-600">
                        &copy; {new Date().getFullYear()} PT Sindangasih Makmur. All rights reserved.
                    </p>
                </footer>
            </div>
        </>
    );
}
