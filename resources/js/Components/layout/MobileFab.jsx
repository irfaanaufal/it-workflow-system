export default function MobileFab({ showCreateBtn, onCreateClick }) {
    return (
        <div className="md:hidden fixed bottom-6 right-6 z-40 flex flex-col gap-3">
            {showCreateBtn && (
                <button
                    onClick={onCreateClick}
                    className="w-12 h-12 rounded-full bg-[#7a7a7a] dark:bg-zinc-800 text-white flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95 cursor-pointer"
                    title="Buat Laporan"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}

            {route().current('admin.systems.index') && (
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-add-system-modal'))}
                    className="w-12 h-12 rounded-full bg-[#7a7a7a] dark:bg-zinc-800 text-white flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95 cursor-pointer"
                    title="Tambah Sistem"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}

            {route().current('admin.karyawan.index') && (
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-add-karyawan-modal'))}
                    className="w-12 h-12 rounded-full bg-[#7a7a7a] dark:bg-zinc-800 text-white flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95 cursor-pointer"
                    title="Tambah Karyawan"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}
        </div>
    );
}
