import { Head, Link } from '@inertiajs/react';

export default function ServerError() {
    return (
        <>
            <Head title="Terjadi Kesalahan" />
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 px-6">
                <div className="text-center max-w-md">
                    <div className="text-8xl font-black text-gray-200 dark:text-zinc-800 mb-4">500</div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-2">Terjadi Kesalahan</h1>
                    <p className="text-gray-500 dark:text-zinc-400 mb-8 font-medium">
                        Maaf, terjadi kesalahan pada server. Silakan coba beberapa saat lagi.
                    </p>
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm"
                    >
                        Kembali ke Dashboard
                    </Link>
                </div>
            </div>
        </>
    );
}
