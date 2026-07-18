import { usePage } from '@inertiajs/react';

export default function AppLogo({ collapsed = false, className = '' }) {
    const { asset_url } = usePage().props;

    return (
        <div className={`flex items-center gap-3 overflow-hidden ${className}`}>
            {/* Logo perusahaan */}
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                <img
                    src={`${asset_url}/images/logo.png`}
                    alt="Logo Perusahaan"
                    className="w-10 h-10 object-contain"
                />
            </div>

            {!collapsed && (
                <div className="leading-tight min-w-0">
                    <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
                        SINDANGASIH
                    </p>
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-widest uppercase truncate">
                        MAKMUR
                    </p>
                </div>
            )}
        </div>
    );
}